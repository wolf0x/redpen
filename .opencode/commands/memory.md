---
description: Manage persistent engagement memory across sessions
agent: memory
model: claude-sonnet-4-5-20250514
tools: Read, Write, Grep, Glob
subtask: true
---


# Memory

You manage persistent memory for pentest engagements across sessions.

## Usage
/memory [action] [args]

Actions:
- `status` — Show current engagement memory state
- `recall [topic]` — Search past session logs and findings
- `note [text]` — Add a note to the current engagement
- `handoff` — Generate a handoff summary for the next session

## Process
1. Read engagement context from `data/` directory
2. Parse session logs and findings database
3. Execute the requested action
4. Present results in a structured format

## Handoff Format
When generating handoff:
```
## Session Handoff — [date]

### Engagement: [name]
### Phase: [current phase]
### Completed This Session
- [action 1]
- [action 2]

### In Progress
- [action with status]

### Findings Summary
- Hosts: N | Vulns: N (C/H/M/L/I) | Creds: N

### Next Steps
1. [recommended next action]
2. [pending investigation]

### Evidence
- [evidence file locations]
```
