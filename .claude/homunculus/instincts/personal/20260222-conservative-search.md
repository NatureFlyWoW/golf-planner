---
trigger: "when searching filesystem"
confidence: 0.65
domain: "debugging"
created: "2026-02-22T00:00:00Z"
source: "observation"
last_validated: "2026-02-22T00:00:00Z"
---

# Conservative Search

## Action
When searching for files, prefer bounded searches with early termination:
- Use -maxdepth to limit recursion depth
- Narrow search paths (e.g., /home/ben/.claude not /)
- Include | head -N to limit results
- Use type filters (-type f) to avoid directories

## Evidence
- 6 observations of find with -maxdepth
- Pattern contrasts with 1 observation of unbounded search (find /)
- Avoids expensive deep recursion
- Early termination common (| head -1, | head -5)
