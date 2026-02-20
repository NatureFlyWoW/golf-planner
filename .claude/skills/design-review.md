---
name: design-review
description: Use when a design document or implementation plan needs pre-implementation review from multiple perspectives, or when the user requests adversarial multi-agent review of a proposal
---

# Design Review — Multi-Agent Adversarial Plan Review

## Overview

This skill runs a structured 4-agent adversarial design review on a plan or design document. Four specialist reviewers critique the plan in parallel from different perspectives (Architect, Skeptic, QA Engineer, UX Advocate), then their feedback is synthesized into a revised, stronger plan.

This complements `/devils-advocate` (per-output self-review) and `/blue-team` (constructive strengthening). `/design-review` is specifically for **pre-implementation plan review** with multiple independent perspectives running in parallel.

## When This Skill Activates

**Manually** when the user says: `/design-review`, "design review", "review this plan", "multi-agent review", or "review this design".

**Do NOT auto-activate.** This is an expensive operation (4 subagents) and should only run on explicit request.

## The Review Process

### Phase 1 — Setup

1. **Identify the plan.** The user provides a file path. If no path is given, look for the most recent file in `docs/plans/` (sort by modification time). Confirm with the user before proceeding.

2. **Read the full plan document.** Load the entire contents into memory. If the plan references an index file with multiple sub-documents, read all of them.

3. **Create the reviews directory.** Ensure `docs/reviews/` exists at the project root (`/mnt/c/Users/Caus/Golf_Plan/docs/reviews/`). Create it if it does not exist.

4. **Announce the review.** Tell the user:
   - Which document is being reviewed
   - That 4 reviewer subagents will be dispatched in parallel
   - That results will be written to `docs/reviews/`
   - Estimated time: "This will take a few minutes."

### Phase 2 — Dispatch 4 Reviewer Subagents (in parallel)

Use the **Task tool** with `general-purpose` subagent type to dispatch all 4 reviewers simultaneously. Each reviewer receives the **full plan text** in its prompt (do not make subagents read files — pass the content directly to avoid file-access failures and reduce latency).

Each subagent MUST write its critique to the specified file path using the Write tool.

---

**Agent 1 — Architect** (writes to `docs/reviews/architect-review.md`)

Prompt the subagent with the full plan text and these instructions:

> You are a **Software Architect** reviewing a design plan. Your job is to challenge the technical design rigorously. Read the plan below, then write your critique to the file `docs/reviews/architect-review.md`.
>
> **Your review lens:**
> - Technical design: Are the patterns appropriate? Is the architecture over- or under-engineered?
> - Coupling and cohesion: Where are the hidden dependencies? What is the blast radius of a change?
> - Data model: Are the types, state shapes, and data flows correct and minimal?
> - Component boundaries: Are responsibilities clearly separated? Could modules be split or merged?
> - State management: Is state in the right place? Too much global? Too much local?
> - Scalability: What breaks if requirements grow 2x or 10x?
> - Patterns: Are established patterns followed? Are there better alternatives?
>
> **Output format (write this to the file):**
>
> ```markdown
> # Architect Review
>
> **Reviewing:** [document name]
> **Reviewer:** Architect
> **Date:** [current date]
>
> ## Top 3 Concerns
>
> ### 1. [Title] — [Critical / Warning / Note]
> [Detailed explanation of the concern, why it matters, and what breaks if unaddressed]
>
> ### 2. [Title] — [Critical / Warning / Note]
> [Detailed explanation]
>
> ### 3. [Title] — [Critical / Warning / Note]
> [Detailed explanation]
>
> ## Suggestions
>
> ### Suggestion 1: [Title]
> [Implementation-level detail: what to change, where, and how]
>
> ### Suggestion 2: [Title]
> [Implementation-level detail: what to change, where, and how]
>
> ## Verdict: [GO / REVISE / BLOCK]
> [1-2 sentence justification]
> ```

---

**Agent 2 — Skeptic** (writes to `docs/reviews/skeptic-review.md`)

Prompt the subagent with the full plan text and these instructions:

> You are a **Skeptic** reviewing a design plan. Your job is to question whether this plan is doing too much, making unwarranted assumptions, or hiding complexity behind optimistic estimates. Read the plan below, then write your critique to the file `docs/reviews/skeptic-review.md`.
>
> **Your review lens:**
> - Scope creep: Is every feature truly necessary for this phase? What could be deferred?
> - Unnecessary complexity: Is there a simpler approach that achieves 80% of the value?
> - Assumptions: What is being assumed about difficulty, dependencies, or user needs?
> - Time estimates: Are they realistic? Where is the planning fallacy most likely?
> - YAGNI violations: What is being built "just in case" rather than because it is needed now?
> - Dependencies: Are there external dependencies that could block or delay work?
> - Opportunity cost: What are you NOT doing by spending time on this?
>
> **Output format (write this to the file):**
>
> ```markdown
> # Skeptic Review
>
> **Reviewing:** [document name]
> **Reviewer:** Skeptic
> **Date:** [current date]
>
> ## Top 3 Concerns
>
> ### 1. [Title] — [Critical / Warning / Note]
> [Detailed explanation of the concern, why it matters, and what breaks if unaddressed]
>
> ### 2. [Title] — [Critical / Warning / Note]
> [Detailed explanation]
>
> ### 3. [Title] — [Critical / Warning / Note]
> [Detailed explanation]
>
> ## Suggestions
>
> ### Suggestion 1: [Title]
> [Implementation-level detail: what to change, where, and how]
>
> ### Suggestion 2: [Title]
> [Implementation-level detail: what to change, where, and how]
>
> ## Verdict: [GO / REVISE / BLOCK]
> [1-2 sentence justification]
> ```

---

**Agent 3 — QA Engineer** (writes to `docs/reviews/qa-review.md`)

Prompt the subagent with the full plan text and these instructions:

> You are a **QA Engineer** reviewing a design plan. Your job is to identify designs that will be hard to test, edge cases that are unhandled, and failure modes that are not considered. Read the plan below, then write your critique to the file `docs/reviews/qa-review.md`.
>
> **Your review lens:**
> - Testability: Can each component/feature be tested in isolation? Are there seams for mocking?
> - Edge cases: What happens with empty data, maximum data, invalid input, concurrent operations?
> - Error handling: Are failure modes identified? Is there graceful degradation or just crashes?
> - Data validation: Where is input validated? What slips through?
> - Recovery: If something goes wrong mid-operation, can the user recover? Is data lost?
> - Test strategy: Is there a plan for what gets unit tests vs integration tests vs manual testing?
> - Coverage gaps: What is explicitly untested or untestable given the proposed design?
> - Regression risk: Which changes are most likely to break existing functionality?
>
> **Output format (write this to the file):**
>
> ```markdown
> # QA Engineer Review
>
> **Reviewing:** [document name]
> **Reviewer:** QA Engineer
> **Date:** [current date]
>
> ## Top 3 Concerns
>
> ### 1. [Title] — [Critical / Warning / Note]
> [Detailed explanation of the concern, why it matters, and what breaks if unaddressed]
>
> ### 2. [Title] — [Critical / Warning / Note]
> [Detailed explanation]
>
> ### 3. [Title] — [Critical / Warning / Note]
> [Detailed explanation]
>
> ## Suggestions
>
> ### Suggestion 1: [Title]
> [Implementation-level detail: what to change, where, and how]
>
> ### Suggestion 2: [Title]
> [Implementation-level detail: what to change, where, and how]
>
> ## Verdict: [GO / REVISE / BLOCK]
> [1-2 sentence justification]
> ```

---

**Agent 4 — UX Advocate** (writes to `docs/reviews/ux-review.md`)

Prompt the subagent with the full plan text and these instructions:

> You are a **UX Advocate** reviewing a design plan. Your job is to challenge every user-facing decision from the perspective of someone who will actually use this tool. Read the plan below, then write your critique to the file `docs/reviews/ux-review.md`.
>
> **Your review lens:**
> - Interaction design: Are interactions intuitive? Will the user know what to do without instructions?
> - Discoverability: Can users find features? Are important actions visible or buried in menus?
> - Mobile responsiveness: Does this work well on small screens? Are touch targets large enough (44px minimum)?
> - Accessibility: Keyboard navigation, screen reader support, color contrast, focus management
> - Visual hierarchy: Is the most important information prominent? Is there visual clutter?
> - User mental models: Does the interface match how users think about the domain?
> - Error states: What does the user see when something goes wrong? Is the messaging helpful?
> - Performance perception: Will the UI feel responsive? Are there loading states where needed?
>
> **Output format (write this to the file):**
>
> ```markdown
> # UX Advocate Review
>
> **Reviewing:** [document name]
> **Reviewer:** UX Advocate
> **Date:** [current date]
>
> ## Top 3 Concerns
>
> ### 1. [Title] — [Critical / Warning / Note]
> [Detailed explanation of the concern, why it matters, and what breaks if unaddressed]
>
> ### 2. [Title] — [Critical / Warning / Note]
> [Detailed explanation]
>
> ### 3. [Title] — [Critical / Warning / Note]
> [Detailed explanation]
>
> ## Suggestions
>
> ### Suggestion 1: [Title]
> [Implementation-level detail: what to change, where, and how]
>
> ### Suggestion 2: [Title]
> [Implementation-level detail: what to change, where, and how]
>
> ## Verdict: [GO / REVISE / BLOCK]
> [1-2 sentence justification]
> ```

---

### Phase 3 — Wait for All Reviewers

All 4 subagents run in parallel. Wait for all of them to complete before proceeding. If any subagent fails, note the failure and proceed with the reviews that did complete.

After all subagents finish, confirm to the user that all 4 review files have been written.

### Phase 4 — Synthesis

Read all 4 review files:
- `docs/reviews/architect-review.md`
- `docs/reviews/skeptic-review.md`
- `docs/reviews/qa-review.md`
- `docs/reviews/ux-review.md`

Then perform the synthesis:

1. **Build the summary table.** Create a table of all concerns across all reviewers:

   | # | Concern | Reviewer | Severity | Action |
   |---|---------|----------|----------|--------|
   | 1 | [title] | Architect | Critical | Addressed: [how] |
   | 2 | [title] | Skeptic | Warning | Deferred: [rationale] |
   | ... | ... | ... | ... | ... |

   For each concern, decide:
   - **Addressed** — incorporate the fix into the revised plan, explain how
   - **Deferred** — explain why this is acceptable to defer (e.g., out of scope, low impact, future phase)
   - **Rejected** — explain why the concern does not apply or is based on a misunderstanding

   Every **BLOCK** verdict and every **Critical** severity item MUST be addressed or have a compelling rejection rationale. Warning items should be addressed where practical.

2. **Tally the verdicts.** Report the 4 verdicts and the overall consensus:
   - If any reviewer said BLOCK: overall is REVISE (at minimum)
   - If 3+ said REVISE: overall is REVISE
   - If 3+ said GO: overall is GO (with noted caveats from dissenters)

3. **Write the revised plan.** Create a new file in the same directory as the original plan, with `-reviewed` appended to the filename (before the extension). For example:
   - `docs/plans/phase5-design.md` becomes `docs/plans/phase5-design-reviewed.md`

   The revised plan should incorporate all addressed changes. It should be a complete, standalone document — not a diff or patch. Mark sections that were changed with a brief inline note like `[REVISED per Architect concern #1]` so the user can see what changed.

4. **Present the summary to the user.** Show:
   - The summary table
   - The verdict tally
   - The path to the revised plan file
   - A recommendation: proceed to implementation, run another review round, or run `/blue-team` on the synthesis

## Output Format

Present the final synthesis directly in the conversation (not just in a file):

```markdown
---
## Design Review Complete
---

**Document reviewed:** [path]
**Reviewers:** Architect, Skeptic, QA Engineer, UX Advocate

### Verdict Tally

| Reviewer | Verdict |
|----------|---------|
| Architect | GO / REVISE / BLOCK |
| Skeptic | GO / REVISE / BLOCK |
| QA Engineer | GO / REVISE / BLOCK |
| UX Advocate | GO / REVISE / BLOCK |
| **Overall** | **GO / REVISE / BLOCK** |

### Concern Summary

| # | Concern | Reviewer | Severity | Action |
|---|---------|----------|----------|--------|
| 1 | ... | ... | ... | ... |
| ... | ... | ... | ... | ... |

### Review Files
- `docs/reviews/architect-review.md`
- `docs/reviews/skeptic-review.md`
- `docs/reviews/qa-review.md`
- `docs/reviews/ux-review.md`

### Revised Plan
- `[path to revised plan]`

### Recommendation
[Proceed to implementation / Run another review round / Run /blue-team on synthesis]
```

## Behavioral Rules

1. **Pass plan content to subagents directly.** Do not make subagents read files themselves. Include the full plan text in each subagent's prompt. This avoids file-access issues and is faster.

2. **Subagents write to files to avoid context bloat.** Each reviewer writes its output to a file rather than returning it in the conversation. The synthesis phase reads these files.

3. **All 4 subagents must run in parallel.** Dispatch them simultaneously, not sequentially. This is the entire point of the multi-agent approach.

4. **Every BLOCK and Critical item must be resolved.** The synthesis cannot hand-wave past blocking concerns. Either address them in the revised plan or provide a rigorous rejection rationale.

5. **The revised plan must be complete and standalone.** It is not a diff, not a list of changes. It is the full plan, revised, ready to hand off to implementation.

6. **Do not recursively review the synthesis.** The revised plan is the output. If the user wants another round, they can run `/design-review` again on the revised file, or run `/blue-team` for constructive strengthening.

7. **Respect the user's time.** If the plan is genuinely strong and all 4 reviewers say GO with only minor Notes, say so clearly and skip generating a revised plan (the original stands). Only generate a revised plan if there are substantive changes to make.

8. **Clean up old reviews.** Before writing new review files, delete any existing files in `docs/reviews/` from a previous run. Each invocation starts fresh.

## User Commands

- **`/design-review [path]`** — Run the full 4-agent review on the specified document
- **`/design-review`** — Run on the most recent plan in `docs/plans/` (confirm with user first)
- **`/design-review --quick`** — Run only Architect + Skeptic (2 agents instead of 4), lighter synthesis
- **`/design-review --focus [area]`** — Weight all reviewers toward a specific concern area (e.g., "performance", "mobile", "testing")
