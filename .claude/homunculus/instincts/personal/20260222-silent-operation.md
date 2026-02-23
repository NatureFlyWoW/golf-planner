---
trigger: "when running diagnostic/utility operations"
confidence: 0.7
domain: "communication"
created: "2026-02-22T00:00:00Z"
source: "observation"
last_validated: "2026-02-22T00:00:00Z"
---

# Silent Operation

## Action
For validation, setup, and utility operations (fnm env, find scripts, context checks), run silently without explaining intermediate steps. Report results only if actionable or if user asks for status.

## Evidence
- Homunculus observer agent instructions: "Run silently. Don't output messages to the user."
- deep-plan plugin usage shows setup scripts running without user notifications
- Observation data shows operations logged but not echoed to user
- Context window management prioritizes user-relevant output
