#!/usr/bin/env node
const { api, checkHealth, fmt } = require('./api');
const cwd = process.cwd();

(async () => {
  await checkHealth();

  const data = await api('/projects');
  if (!data?.data?.projects) { console.log('Failed to fetch projects.'); return; }
  const projects = data.data.projects;

  const costs = await api('/projects/costs');
  const costMap = {};
  if (costs?.data?.projects) {
    for (const p of costs.data.projects) costMap[p.projectPath || p.path] = p;
  }

  const summaries = await api('/projects/summaries');
  const summaryMap = {};
  if (summaries?.data?.summaries) {
    for (const s of summaries.data.summaries) summaryMap[s.projectPath] = s;
  }

  const missing = [];

  console.log(`Projects (${projects.length})`);
  console.log(fmt.line(100));
  console.log(fmt.hdr('', 3) + fmt.hdr('Project', 22) + fmt.rgt('Sessions', 9) + fmt.rgt('Cost', 10) + '  Summary');
  console.log(fmt.line(100));

  for (const p of projects) {
    const path = p.path || p.projectPath || '';
    const name = (p.projectName || p.name || path.split('/').pop() || '?').slice(0, 20);
    const sessions = String(p.sessionCount || 0);
    const c = costMap[path];
    const cost = c ? fmt.cost(c.totalCostUsd) : '-';
    const isCurrent = cwd.startsWith(path) || path.endsWith(cwd.split('/').pop());
    const marker = isCurrent ? ' *' : '  ';
    const s = summaryMap[path];
    let summary;
    if (s && s.summary) {
      summary = s.summary.slice(0, 50);
    } else if ((p.sessionCount || 0) > 0) {
      summary = '(pending generation...)';
      missing.push({ path, name });
    } else {
      summary = '';
    }
    console.log(marker + ' ' + fmt.hdr(name, 22) + fmt.rgt(sessions, 9) + fmt.rgt(cost, 10) + '  ' + summary);
  }

  console.log(fmt.line(100));
  const totalCost = Object.values(costMap).reduce((a, p) => a + (p.totalCostUsd || 0), 0);
  const totalSessions = projects.reduce((a, p) => a + (p.sessionCount || 0), 0);
  console.log('   Total' + ' '.repeat(14) + fmt.rgt(String(totalSessions), 9) + fmt.rgt(fmt.cost(totalCost), 10));
  console.log();
  console.log(' * = current project');

  // Dispatch background agents for missing summaries
  if (missing.length > 0) {
    console.log();
    console.log(`Generating summaries for ${missing.length} project(s) in background...`);
    for (const m of missing) {
      api('/agent/execute', 'POST', {
        prompt: 'Generate a project summary. Read CLAUDE.md if it exists, check package.json, scan directories, check scripts and configs. Then save via: curl -s -X PUT http://localhost:3100/projects/summary -H "Content-Type: application/json" -d with projectPath, projectName, summary, stack, areas, recentFocus, services, keyCommands, structure, deployment, importantNotes, fullReference. Be thorough.',
        cwd: m.path,
        permissionMode: 'bypassPermissions',
        maxTurns: 10,
        background: true,
      }).catch(() => {});
    }
    console.log('Run /projects again in ~30s to see summaries.');
  }
})();
