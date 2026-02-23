---
trigger: "before running /deep-plan or /deep-implement"
confidence: 0.95
domain: "communication"
created: "2026-02-22T00:00:00Z"
source: "CLAUDE.md + postmortem-phase11a"
last_validated: "2026-02-22T00:00:00Z"
---

# Validate Plans Against User Intent

## Action
Before executing any plan:
1. Read MEMORY.md rendering vision and documented goals
2. Verify the plan delivers what the user actually wants to SEE when done
3. Present plain-English "User-Visible Outcomes" summary
4. Get explicit user confirmation before proceeding

## Evidence
- Phase 11A postmortem: spec was wrong before /deep-plan saw it, adversarial review checked correctness not relevance
- CLAUDE.md Plan Validation section added as critical safeguard
- Root cause was no "user intent validation" step in the workflow
