---
trigger: "when a bash command fails or produces an error"
confidence: 0.5
domain: "debugging"
created: "2026-02-23T11:00:17Z"
source: "observation"
last_validated: "2026-02-23T11:00:17Z"
---

# Diversify Recovery Tool After Error

## Action
When a Bash command fails, do NOT retry the same command. Instead, switch tools: after bash error, the next action is typically Edit (fix source), Read (investigate), or Write (create config). This 25-observation pattern suggests learning from errors rather than brute-force retries.

## Evidence
- 25 error→recovery sequences observed
- Recovery actions: Edit (fix code), Read (understand), Write (create file)
- No observed pattern of same bash command retried immediately
- Suggests good error handling practice: don't thrash, switch approach
- Confidence is moderate (0.5) because this pattern is relatively rare (25 in 5024 obs)
