---
allowed-tools: Bash
description: Summarize the current session — what we're working on, what was done, current state
---

# /summary — Current Session Summary

Generate or refresh a summary of THIS session.

## Step 1: Gather session data

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/summary-gather.js" "$CLAUDE_SESSION_ID"
```

## Step 2: Generate the summary

Analyze the output from Step 1 and generate:
- **Summary text** — what this session is about, what was accomplished, current state
- **Display name** — 2-4 words, kebab-case (if no customTitle exists)

## Step 3: Save summary and record learning

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/summary-save.js" "$CLAUDE_SESSION_ID" "YOUR_SUMMARY" "YOUR_DISPLAY_NAME" TURN_COUNT "MAIN_KEYWORD" "PROJECT_AREA"
```

## Step 4: Rename session (if needed)

If the session doesn't have a customTitle:
```
/rename YOUR_DISPLAY_NAME
```

## Output

```
Session Summary
═══════════════
Name:    SESSION_DISPLAY_NAME
Project: PROJECT_NAME
Turns:   N | Cost: $X.XX
Status:  in progress / completed

What this session is about:
  DESCRIPTION

What was accomplished:
  - MILESTONE_1
  - MILESTONE_2

Current state:
  CURRENT_WORK

Key context:
  - DECISION_1
  - PATTERN_1
```
