#!/usr/bin/env node
/**
 * Saves a session summary and records learning signals.
 * Called by /summary after Claude generates the summary text.
 *
 * Usage: node summary-save.js SESSION_ID "SUMMARY" "DISPLAY_NAME" TURN_COUNT "KEYWORD" "AREA"
 */
const { api } = require('./api');
const sid = process.argv[2] || process.env.CLAUDE_SESSION_ID;
const summary = process.argv[3];
const displayName = process.argv[4];
const turnCount = parseInt(process.argv[5]) || 0;
const keyword = process.argv[6];
const area = process.argv[7];
const cwd = process.cwd();
const projectName = cwd.split('/').pop();

(async () => {
  // Save summary
  const result = await api('/sessions/' + sid + '/summary', 'PUT', {
    summary, displayName, projectPath: cwd,
    lastTurnIndex: turnCount, totalTurns: turnCount,
  });
  const saved = result?.success || false;

  // Record learning signals
  const signals = [];
  if (keyword) signals.push({ type: 'keyword', value: keyword, projectPath: cwd, projectName });
  if (area) signals.push({ type: 'area', value: area, projectPath: cwd });
  let learned = false;
  if (signals.length) {
    const learn = await api('/learn', 'POST', { signals });
    learned = learn?.success || false;
  }

  console.log(`Summary: ${saved ? 'saved' : 'failed'} | Learning: ${learned ? 'recorded' : 'skipped'}`);
})();
