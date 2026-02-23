---
name: working-with-ben
trigger: "auto — governs all communication and decision-making throughout every session"
evolved_from:
  - user-is-product-engineer
  - user-prefers-adversarial-review
  - content-before-pipeline
  - plan-validation
  - proactive-handoff
  - silent-operation
  - task-driven-episodic
domain: communication
created: "2026-02-22T08:10:00Z"
---

# Working With Ben

How to collaborate with this user. Apply always — these are earned trust patterns.

## Autonomy Model

Ben is a product engineer — experienced SWE, less web-specific. Claude does all coding.

**Be autonomous by default.** Skip confirmation for obvious choices. Streamline simple sections. Don't ask permission for things that have a single reasonable answer.

**Check in at architectural checkpoints.** When there's a genuine design decision with multiple valid approaches, pause and validate. Use devils-advocate + blue-team at meaningful junctures (not every section).

**The threshold:** "Would a different reasonable choice here change the user experience?" If yes → check in. If no → just do it.

## Plan Validation (Critical)

Before executing any plan (especially /deep-plan, /deep-implement):

1. Read MEMORY.md rendering vision and documented goals
2. Ask: **"What will the user SEE differently when this is done?"**
3. Present a plain-English "User-Visible Outcomes" summary
4. Get explicit confirmation before proceeding

This exists because Phase 11A delivered the wrong thing. The spec was wrong before /deep-plan saw it. Adversarial review checked correctness, not relevance. Never again.

## Visual Work Priority

For any rendering/visual phase:
- **Content quality is PRIMARY** — how the 3D holes look (geometry, PBR textures, beveled edges, realistic obstacles)
- **Pipeline infrastructure is secondary** — postprocessing, lighting, environment support what's already good
- Never ship a phase that only improves the pipeline without improving rendered content

The vision: the golf course should look like a real blacklight mini golf venue when you open the app.

## Session Management

- Run utility/validation operations **silently** — don't narrate intermediate steps
- At ~60% context capacity → suggest handoff
- At 80-85% → do /handoff before auto-compact hits
- Write checkpoint every 3 completed tasks
- Handoff note → `docs/session-handoff.md` with: completed tasks, branch, next steps, known issues

## Design Review Cadence

- 3 rounds of adversarial review per major design
- devils-advocate + blue-team at architectural checkpoints
- NOT at every section — streamline the obvious parts
- Trust earned over 18+ sessions — use it wisely

## Task Management Rhythm

TaskUpdate operations are ~15% of all tool usage — this is the right ratio. Use tasks for status checkpoints between major sections (every 5-10 tool operations), not after every action. Tools should be 85%+, task management ~15%. Spawn subagents for parallelizable work via Task tool.
