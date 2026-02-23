---
trigger: "when looking up code references, function callers, or class hierarchies"
confidence: 0.85
domain: "tooling"
created: "2026-02-22T00:00:00Z"
source: "MEMORY.md"
last_validated: "2026-02-22T00:00:00Z"
---

# Use CodeGraphContext First for Code Lookup

## Action
When searching for code references, use CGC tools (find_code, analyze_code_relationships) first. Fall back to Read/Glob/Grep only if CGC doesn't have the answer.

## Evidence
- MEMORY.md: "Use CGC first for code references, fall back to Read/Glob/Grep"
- CGC provides semantic relationships (callers, callees, hierarchy) that text search can't
