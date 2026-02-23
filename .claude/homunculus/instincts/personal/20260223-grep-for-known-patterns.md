---
trigger: "when searching for specific code identifiers, function names, or known patterns"
confidence: 0.7
domain: "debugging"
created: "2026-02-23T11:00:17Z"
source: "observation"
last_validated: "2026-02-23T11:00:17Z"
---

# Grep for Known Patterns, Read for Discovery

## Action
Use Grep when searching for a specific identifier you know exists (function name, constant, type name, prop name). Use Read for exploration and understanding context. Current ratio: 416 Greps vs 1453 Reads — this indicates Read is used for discovery, Grep for targeted lookups. Keep this ratio to stay efficient.

## Evidence
- Top grep patterns: uvMode, deriveFrameloop, showFlowPath, ThreeCanvas, partialize — all known identifiers
- 416 Grep operations across 5024 total observations (8%) — targeted use
- 1453 Read operations — 29% of all observations — indicates heavy exploration/discovery workflow
- Grep patterns change per task, suggesting context-aware search vs generic reading
