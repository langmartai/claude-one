#!/usr/bin/env node
const { api, checkHealth, fmt } = require('./api');
const filter = process.argv[2] || '';

(async () => {
  await checkHealth();

  const data = await api('/projects/sessions');
  if (!data?.data?.sessions) { console.log('Failed to fetch sessions.'); return; }

  let sessions = data.data.sessions;
  const total = data.data.total || sessions.length;

  if (filter) {
    sessions = sessions.filter(s =>
      ((s.projectPath || '') + (s.projectName || '')).toLowerCase().includes(filter.toLowerCase())
    );
  }

  const running = sessions.filter(s => s.isRunning);
  const rest = sessions.filter(s => !s.isRunning).slice(0, 15);
  const show = [...running, ...rest];

  console.log(`Sessions (${running.length} running, ${total} total)`);
  if (filter) console.log(`Filtered: ${filter}`);
  console.log(fmt.line());
  console.log(fmt.hdr('Status', 7) + fmt.hdr('Name', 28) + fmt.hdr('Project', 18) + fmt.hdr('Model', 8) + fmt.rgt('Cost', 8) + fmt.rgt('Turns', 6));
  console.log(fmt.line());

  for (const s of show) {
    const status = s.isRunning ? '[RUN]' : '';
    const name = (s.customTitle || s.slug || s.sessionId.slice(0, 12)).slice(0, 26);
    const project = ((s.projectPath || '').split('/').pop() || '-').slice(0, 16);
    const model = (s.model || '-').replace('claude-', '').replace('opus-4-6', 'opus').replace('sonnet-4-6', 'sonnet').slice(0, 7);
    const cost = fmt.cost(s.totalCostUsd);
    const turns = String(s.numTurns || '-');
    console.log(fmt.hdr(status, 7) + fmt.hdr(name, 28) + fmt.hdr(project, 18) + fmt.hdr(model, 8) + fmt.rgt(cost, 8) + fmt.rgt(turns, 6));
  }

  // Running executions
  const exData = await api('/monitor/executions');
  if (exData?.data?.executions) {
    const re = exData.data.executions.filter(e => e.isRunning);
    if (re.length) {
      console.log(`\nRunning Executions (${re.length}):`);
      for (const e of re) {
        const eid = (e.executionId || '').slice(0, 12);
        const t = e.turnCount || 0;
        const c = (e.costUsd || 0).toFixed(2);
        const elapsed = Math.floor((e.elapsedMs || 0) / 1000);
        console.log(`  ${eid}  T:${t}  $${c}  ${Math.floor(elapsed / 60)}m${elapsed % 60}s`);
      }
    }
  }

  const totalCost = sessions.reduce((a, s) => a + (s.totalCostUsd || 0), 0);
  console.log(fmt.line());
  console.log(`Total cost: $${totalCost.toFixed(2)}`);
})();
