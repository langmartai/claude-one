---
allowed-tools: Bash
description: List all projects with session counts and costs
---

# /projects — Project Overview

Show all projects with session counts, costs, and current project highlighted.

## Execution

```bash
node -e "
const http = require('http');
const cwd = process.cwd();

function api(path) {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3100' + path, { timeout: 5000 }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve(null); } });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

(async () => {
  const health = await api('/health');
  if (!health?.success) {
    console.log('lm-assist API is not running.\nStart with: npm install -g lm-assist');
    return;
  }

  // Get projects
  const data = await api('/projects');
  if (!data?.data?.projects) { console.log('Failed to fetch projects.'); return; }
  const projects = data.data.projects;

  // Get costs
  const costs = await api('/projects/costs');
  const costMap = {};
  if (costs?.data?.projects) {
    for (const p of costs.data.projects) costMap[p.projectPath || p.path] = p;
  }

  // Get project summaries
  const summaries = await api('/projects/summaries');
  const summaryMap = {};
  if (summaries?.data?.summaries) {
    for (const s of summaries.data.summaries) summaryMap[s.projectPath] = s;
  }

  console.log('Projects (' + projects.length + ')');
  console.log('\u2500'.repeat(95));
  const hdr = (s,n) => (s + ' '.repeat(n)).slice(0,n);
  const rgt = (s,n) => (' '.repeat(n) + s).slice(-n);
  console.log(hdr('',3) + hdr('Project',25) + rgt('Sessions',10) + rgt('Cost',10) + '  ' + 'Summary');
  console.log('\u2500'.repeat(95));

  for (const p of projects) {
    const path = p.path || p.projectPath || '';
    const name = (p.projectName || p.name || path.split('/').pop() || '?').slice(0,23);
    const sessions = String(p.sessionCount || 0);
    const c = costMap[path];
    const cost = c ? '\$' + (c.totalCostUsd || 0).toFixed(2) : '-';
    const isCurrent = cwd.startsWith(path) || path.endsWith(cwd.split('/').pop());
    const marker = isCurrent ? ' *' : '  ';
    const s = summaryMap[path];
    const summary = s ? (s.summary || '').slice(0,40) : '';
    console.log(marker + ' ' + hdr(name,25) + rgt(sessions,10) + rgt(cost,10) + '  ' + summary);
  }

  console.log('\u2500'.repeat(95));
  const totalCost = Object.values(costMap).reduce((a, p) => a + (p.totalCostUsd || 0), 0);
  const totalSessions = projects.reduce((a, p) => a + (p.sessionCount || 0), 0);
  console.log('   Total' + ' '.repeat(17) + rgt(String(totalSessions),10) + rgt('\$' + totalCost.toFixed(2),10));
  console.log();
  console.log(' * = current project');
})();
"
```

## Output

Present the script output directly.
