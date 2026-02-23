---
trigger: "when needing to locate files in golf-planner codebase"
confidence: 0.7
domain: "file-organization"
created: "2026-02-22T00:00:00Z"
source: "observation"
last_validated: "2026-02-22T00:00:00Z"
---

# Codebase Find Search

## Action
Use conservative `find` with explicit filters before reading files:
```bash
find /mnt/c/Users/Caus/Golf_Plan/golf-planner -maxdepth [N] -type f -name "[pattern]" | sort
```

Prefer bounded searches (-maxdepth) over recursive ones. Include type filters to avoid directories.

## Evidence
- 8+ observations of find commands for source file discovery
- Pattern shows preference for -maxdepth (6 obs) over unbounded searches
- Clear workflow: find → read → find (iterated exploration)
- Targets: src/, tests/, docs/plans/, config files
- Avoids node_modules and build artifacts
