---
trigger: "when running any Bash command that needs Node.js or npm"
confidence: 0.95
domain: "tooling"
created: "2026-02-22T00:00:00Z"
source: "MEMORY.md + CLAUDE.md"
last_validated: "2026-02-23T11:00:17Z"
---

# Source fnm in Every Bash Call

## Action
Prefix every Bash command that requires Node/npm with:
```bash
export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)"
```
fnm state does not persist between Bash tool invocations.

## Evidence
- Documented in both outer CLAUDE.md and MEMORY.md as mandatory
- Consistent pattern across all 41 sessions
- Omitting causes "node not found" errors every time
- 25 error→recovery sequences show this is a common recovery point
- **Validation 2026-02-23**: Confirmed in error recovery patterns — fnm setup errors lead to immediate recovery with proper sourcing
