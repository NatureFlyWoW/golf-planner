---
trigger: "when writing TypeScript code"
confidence: 0.9
domain: "code-style"
created: "2026-02-22T00:00:00Z"
source: "CLAUDE.md"
last_validated: "2026-02-22T00:00:00Z"
---

# Strict TypeScript Conventions

## Action
- Run `npx tsc --noEmit` before committing (PostToolUse hook does this after edits)
- Resolve all TS errors before marking a task complete
- When modifying types/interfaces, check all downstream usages for breakage
- Prefer strict types over `any` — use `unknown` + type guards where uncertain
- Types used in 1 file: inline. Shared across 2+: src/types/

## Evidence
- CLAUDE.md TypeScript Project Conventions section
- PostToolUse hook runs tsc automatically
