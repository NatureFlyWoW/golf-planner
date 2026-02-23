---
trigger: "when implementing a multi-task plan"
confidence: 0.9
domain: "tooling"
created: "2026-02-22T00:00:00Z"
source: "MEMORY.md + CLAUDE.md"
last_validated: "2026-02-22T00:00:00Z"
---

# Subagent-Driven Development

## Action
User wants parallelized implementation via subagents. When executing plans:
- Use Explore agent type for domain-expert subagents (avoids MCP tool name conflicts)
- Keep subagent scopes small enough to complete within usage limits
- Never check out a different branch from within a subagent
- Have subagents write results to files rather than returning large payloads
- Batch status updates rather than reporting each individually

## Evidence
- MEMORY.md: "Wants subagent-driven development (parallelized)"
- CLAUDE.md: "Use Explore agent type to avoid MCP tool name conflicts"
- CLAUDE.md: Detailed subagent guidelines section
