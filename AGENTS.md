# RedPen Agent Instructions

## Overview
RedPen is a pentest AI agent platform with 35 specialized agents organized into two operational tiers.

## Agent Routing
When receiving a task, route to the appropriate agent based on:
1. **Domain match** — Which security domain does the task belong to?
2. **Tier requirement** — Does the task need execution (Tier 2) or advisory (Tier 1)?
3. **Phase alignment** — Where does this fall in the pentest lifecycle?

## Tier Definitions
- **Tier 1 (Advisory)**: Analysis, planning, methodology guidance. No tool execution required.
- **Tier 2 (Execution)**: Can compose and execute commands. Requires declared scope and user approval.

## Scope Enforcement
All Tier 2 execution MUST pass through the scope gate:
1. Target must be within declared engagement scope
2. Hard-refusal patterns are checked (DoS, destructive commands, shell injection)
3. User approval is required before execution
4. All commands are logged with evidence

## Evidence Handling
- All command outputs are saved to `data/evidence/{engagement_id}/`
- Evidence files follow naming: `{tool}_{target}_{timestamp}.log`
- Evidence is linked to findings in the database

## Available Commands
- `/recommend` — Get intelligent agent recommendation based on context
- `/agents-for [task]` — List agents relevant to a specific task
- `/memory [action]` — Manage persistent engagement memory

## Session Continuity
- Engagement data persists in SQLite (`data/redpen.db`)
- Session logs track all actions with timestamps
- Handoff reports can be generated between sessions
