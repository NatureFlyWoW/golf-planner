# Postmortem: Phase 11A Delivered the Wrong Thing

**Date:** 2026-02-21
**Status:** Root cause analysis complete
**Severity:** High -- multiple sessions of work spent on wrong priorities

---

## What Happened

### Timeline of Events

1. **Pre-planning (early in session):** The user asked for a "next phase" after Phase 10A (Hole Builder). Six specialist subagents were dispatched to research possibilities for an immersive rendering overhaul. They produced analysis documents:
   - `temp-backend-analysis.md` -- server-side rendering, BASEMAP.AT, Gaussian Splatting
   - `temp-mobile-analysis.md` -- mobile 3D performance, AR, GPU tiers
   - `temp-mobile-app-analysis.md` -- AR accuracy, marker-based AR, Capacitor
   - `temp-ui-design.md` -- visual identity, palette, typography, UV transition, tour mode
   - `temp-rendering-research.md` -- R3F/drei/postprocessing ecosystem catalog
   - `temp-unified-concept.md` -- synthesized concept across all agents

2. **Unified concept produced:** `temp-unified-concept.md` was a comprehensive document covering five domains:
   - **A. Visual Overhaul** (dark theme, rendering quick wins, UV lighting, PBR materials, camera, transition)
   - **B. Geo Integration** (aerial ground plane, 3D tiles, on-site mode, compass, sun path)
   - **C. Fun & Sharing** (URL sharing, confetti, sound, tour mode, before/after slider)
   - **D. Backend & AI** (Gaussian Splatting, AI textures, 4K renders, collaboration)
   - **E. Mobile Performance** (GPU tiers, performance fixes, AR path)

3. **Design document created:** `2026-02-21-phase11a-visual-rendering-design.md` underwent 4 rounds of adversarial review (2x Devils Advocate + 2x Blue Team). This was thorough from a technical correctness standpoint.

4. **The critical narrowing:** The design document was scoped to **only section A** of the unified concept, and within section A, it **excluded A4 (PBR Material Upgrade)** and **excluded A5 (Camera Choreography)**. The "Phase 11A" naming implied it was the first slice of a broader vision.

5. **`/deep-plan` invoked:** The design document was fed to `/deep-plan` as the spec file. The deep-plan process:
   - Researched the codebase (R3F config, materials, lighting, Tailwind)
   - Researched web best practices (GPU detection, postprocessing, reflectors, Tailwind v4)
   - Conducted an 8-question interview with the user
   - Produced `claude-spec.md`, `claude-plan.md`, `claude-plan-tdd.md`
   - External Opus review caught 13 technical issues, all integrated
   - 4 more rounds of adversarial review caught 10 more amendments
   - Section files created for 12 implementation sections

6. **`/deep-implement` executed:** Across multiple sessions, all 12 sections were implemented. 12 commits, 377 tests, store format v8. The work was technically excellent.

7. **User reaction:** The user saw the result and realized the 3D hole models -- the actual mini golf course elements that are the entire point of the app -- still looked like basic procedural geometry from a "late 90s planning tool." The phase had delivered a dark theme, post-processing effects, and UI polish, but the actual content being rendered (the golf holes) was untouched.

---

## The User's Actual Vision

From MEMORY.md:
> **Rendering vision**: wants beautiful, realistic, immersive renders; fun collaborative planning; Google Earth geo integration

The user wanted the **golf course holes themselves** to look beautiful and realistic. When they said "immersive renders," they meant the 3D models of the mini golf holes -- the felt surfaces, bumpers, ramps, curves, cups, tee areas -- should look like real mini golf elements, not flat-shaded extruded boxes.

What they got instead:
- A dark purple UI theme
- Post-processing effects (bloom, vignette, chromatic aberration, god rays)
- A theatrical UV transition animation
- GPU tier detection
- Reflective floor material
- UV lamp fixtures
- Visual regression tests

These are all real improvements to the rendering pipeline and visual identity. But they are **set dressing for a stage with no actors**. The actual 3D models -- the things the user cares about -- remained untouched.

---

## Root Causes

### Root Cause 1: The Spec File Was Already Wrong Before /deep-plan Saw It

The design document (`2026-02-21-phase11a-visual-rendering-design.md`) was produced by synthesizing the six specialist agent outputs. But the synthesis made a critical scoping decision: it focused on **rendering pipeline and UI theming** (sections A1, A2, A3, A6 of the unified concept) while explicitly deferring **PBR Material Upgrade** (A4) and **Camera Choreography** (A5) to "future phases."

The problem is that A4 (PBR materials on actual hole models) was the thing the user cared about most. The beautiful rendering of the golf course elements was classified as "Tier 2" in the unified concept and cut from Phase 11A's scope.

**The spec that went into /deep-plan already had the wrong priorities.** The /deep-plan process then faithfully planned, reviewed, and refined a technically excellent implementation of the wrong thing.

### Root Cause 2: No "User Intent Validation" Step in the Workflow

The deep-plan workflow has these steps:
1. Research (codebase + web)
2. Interview (8 questions with the user)
3. Write spec
4. Write plan
5. External review
6. Integration
7. TDD plan
8. Section split

**None of these steps explicitly ask: "Does this plan match what the user actually wants the app to LOOK and FEEL like?"**

The interview (step 2) asked highly technical questions:
- Q1: Bloom strategy (selective vs. soft)
- Q2: Is "GOLF FORGE" the final name?
- Q3: How important is the UV transition?
- Q4: GPU tier detection caching
- Q5: 3D vs. top-down usage ratio
- Q6: UV lamp visibility
- Q7: Testing approach
- Q8: Dark theme conversion strategy

Every question was about **how to implement** the spec. Not a single question asked: "Is this the right thing to build? Does this match your vision for making the renders beautiful?"

The interview protocol says: "Surface everything the user knows but hasn't mentioned" and "Assume the initial spec is incomplete." But it operated within the frame of the existing spec rather than questioning the spec's premise.

### Root Cause 3: The Adversarial Review Checked Correctness, Not Relevance

The plan underwent an extraordinary amount of review:
- 13 issues found by Opus external review
- 10 amendments from 4 rounds of adversarial review (Devils Advocate + Blue Team)
- 8 consistency fixes in a final deep review

All of this review checked **internal consistency, technical correctness, and implementation risk**. The reviews caught real bugs: contrast ratio failures, OKLCH issues, frameloop problems, GodRays architecture coupling, migration safety, font weight gaps.

But no review asked: **"Is this the right plan for the user's stated goal?"** The adversarial review process was designed to attack the plan on technical grounds, not to validate it against user intent.

### Root Cause 4: MEMORY.md Was Available But Not Actively Consulted

The user's rendering vision was documented in MEMORY.md:
> **Rendering vision**: wants beautiful, realistic, immersive renders; fun collaborative planning; Google Earth geo integration

This memory was available in the system context during the session. But the /deep-plan process does not include a step that says: "Read the user's documented preferences and goals from MEMORY.md and verify the plan aligns with them."

The research step reads the codebase and the web. The interview asks the user questions. But neither step explicitly cross-references the user's long-term documented goals.

### Root Cause 5: Phase Naming Created a False Sense of Coverage

The phase was called "Phase 11A: GOLF FORGE Visual Rendering Overhaul." The word "rendering" in a graphics context naturally means "how things look when rendered." But the plan interpreted "rendering" as "the rendering pipeline" (postprocessing, lighting, environment) rather than "the rendered output" (3D model quality, material fidelity, visual realism of the golf holes).

The "11A" suffix implied this was part of a larger Phase 11 that would cover more ground. But the user experienced it as "the visual overhaul phase," expected it to make things look beautiful, and was disappointed when the actual golf course content was unchanged.

### Root Cause 6: The Pre-Planning Research Agents Set the Wrong Frame

The six specialist agents were asked broad questions about "immersive rendering" and "visual experience." Their outputs naturally focused on what R3F/Three.js can do at the **pipeline level** (postprocessing, lighting, environment, reflections) because that is what the library ecosystem provides as drop-in improvements.

None of the agents were asked: "What would make the actual mini golf holes look beautiful?" This is a fundamentally different question -- it requires thinking about 3D modeling, geometry detail, surface quality, and physical realism of the game elements themselves.

The research framing biased the entire chain toward pipeline-level improvements.

---

## Contributing Factors

### C1: Automation Bias

The `/deep-plan` + `/deep-implement` workflow is impressive and well-engineered. It creates a sense of momentum and progress. But this very efficiency makes it dangerous when pointed at the wrong target. The workflow executed 12 sections, 12 commits, 377 tests, and a store format migration -- all without a single checkpoint asking "are we building the right thing?"

### C2: The User Trusted Autonomous Execution

From session handoff:
> User trusts Claude to work autonomously (was grocery shopping during sections 04-05)
> Streamlined deep-implement: skip full code review for simple sections

The user had established a pattern of trust: set the phase in motion, go do something else, come back to finished work. This worked well for Phases 1-10 where the scope was well-defined. For a "visual overhaul" phase, this trust was misplaced -- the user needed to see the visual output before too much work was invested.

### C3: No Visual Checkpoint

The entire Phase 11A was executed without the user ever seeing the app during implementation. The first visual checkpoint was after all 12 sections were complete. For a visual phase, this is backwards -- the user should have seen the app after the first 2-3 rendering changes to confirm the direction.

### C4: The Unified Concept Document Was Too Big

`temp-unified-concept.md` covered 26 items across 5 domains. This breadth meant that any single phase had to aggressively scope-cut. The scoping decisions were made by Claude (the agent), not the user. Claude chose to prioritize the "quick wins" and "infrastructure" (GPU tiers, dark theme, postprocessing pipeline) over the "content quality" improvements (PBR materials, model detail).

This is a classic engineering trap: build the infrastructure first, deliver the user-visible improvements later. It makes technical sense but delivers zero user value in the first phase.

### C5: Conflation of "Visual Identity" with "Visual Quality"

The plan title says "Visual Identity & Rendering." The plan delivered visual identity (dark theme, GOLF FORGE branding, color palette) and rendering infrastructure (GPU tiers, postprocessing, lighting). But the user wanted visual quality -- making the actual 3D content look good.

---

## Recommendations

### R1: Add a "Vision Alignment Check" to /deep-plan Interview Protocol

**Where:** After the spec is synthesized but before the plan is written (between steps 9 and 10 of the deep-plan workflow).

**What:** A mandatory question that reads the user's documented goals from MEMORY.md and asks:

```
Before I write the implementation plan, let me verify this matches your vision.

Your documented goals are:
- [extracted from MEMORY.md]

This plan will deliver:
- [bullet summary of what the spec covers]

This plan will NOT deliver:
- [bullet summary of what the spec explicitly defers]

Does this match what you wanted for this phase?
```

### R2: Add "What Will the User SEE?" Section to Plan Documents

**Where:** At the top of every `claude-plan.md`, before the Architecture section.

**What:** A plain-English section titled "User-Visible Outcomes" that describes what the user will experience when the phase is complete. Written from the user's perspective, not the developer's.

Example of what Phase 11A should have said:
> After this phase, the app will have a dark purple theme, UV lighting effects, and post-processing. The mini golf holes themselves will look the same as they do now (flat-shaded procedural geometry).

This would have immediately surfaced the mismatch.

### R3: Add Visual Checkpoints to /deep-implement for Rendering Phases

**Where:** In the section index for any phase that changes visual output.

**What:** After every 2-3 sections, add a mandatory step: "Take a screenshot, show it to the user, and ask: 'Is this the direction you want?'"

For the Playwright MCP integration, this means navigating to the dev server and capturing the current state of the app for user review.

### R4: Update MEMORY.md Rendering Vision to Be More Specific

**Current:**
> **Rendering vision**: wants beautiful, realistic, immersive renders

**Proposed:**
> **Rendering vision**: wants the 3D mini golf holes to look beautiful and realistic (detailed geometry, PBR materials, realistic felt/bumper/ramp surfaces). The rendering pipeline (postprocessing, lighting, environment) supports this but is secondary to the content quality. "Immersive" means the user opens the app and the golf course looks like a real blacklight mini golf venue.

### R5: Add "Scope Validation Against User Goals" to Adversarial Review

**Where:** As an explicit attack vector for the Devils Advocate review.

**What:** The reviewer should be instructed to:
1. Read the user's documented goals from MEMORY.md
2. Check if the plan delivers on those goals
3. Flag any plan that spends >50% of effort on infrastructure vs. user-visible improvements

### R6: Add a "Build Order Principle" to CLAUDE.md

Add to the project's CLAUDE.md:

```markdown
## Build Order Principle
For visual/rendering phases: deliver user-visible content improvements FIRST,
then add pipeline infrastructure (postprocessing, lighting, environment) to
enhance them. Never ship a phase that improves the rendering pipeline without
also improving the rendered content. The user wants to see their golf course
look better, not see a better-lit version of the same basic geometry.
```

### R7: Require Phase Scope Confirmation Before /deep-plan

Before running /deep-plan, explicitly present the user with:
1. What this phase WILL cover (in plain English, user-visible outcomes)
2. What this phase will NOT cover (deferred to future phases)
3. Ask for explicit confirmation

This should happen before the deep-plan workflow starts, not during the interview (which is too late -- the interview operates within the frame of the spec).

### R8: Split "Rendering Overhaul" into Content-First Phases

If Phase 11A is redone, the correct ordering would be:
1. **Phase 11A: Beautiful Hole Models** -- PBR materials, detailed geometry, realistic surfaces
2. **Phase 11B: Rendering Pipeline** -- GPU tiers, postprocessing, lighting, environment
3. **Phase 11C: Visual Identity** -- dark theme, branding, fonts, UV transition

This ensures the user sees improvement to the actual content first.

---

## Proposed Safeguards

### Safeguard 1: Pre-Plan User Confirmation (blocking)

Before `/deep-plan` starts, the agent MUST show the user a 3-bullet summary of what the phase will and will not deliver, written in plain English from the user's perspective. Require explicit "yes, that's right" before proceeding.

### Safeguard 2: MEMORY.md Cross-Reference (automated)

Add to the deep-plan SKILL.md: "Before writing claude-spec.md, read the user's MEMORY.md and verify the spec aligns with documented user preferences and goals. If there is a mismatch, flag it to the user."

### Safeguard 3: Visual Phase Checkpoint (blocking)

For any phase tagged as "visual," "rendering," or "3D," add a mandatory mid-phase screenshot review with the user after the first batch of visual changes is implemented.

### Safeguard 4: "What Didn't Change" Audit (automated)

After a plan is written, add an automated step that lists what major components of the app will NOT be changed by this phase. Present this list to the user. This inverts the normal "here's what we'll build" framing and forces visibility of what's being left behind.

### Safeguard 5: Interview Must Include a "Wrong Plan" Question

Add to the interview protocol a mandatory final question:

> "What would make this phase feel like a waste of time? What's the one thing that MUST be different when this phase is done?"

This question directly elicits the user's core expectation and creates a litmus test for plan validation.

---

## Summary

Phase 11A was a technically excellent implementation of the wrong plan. The failure was not in execution but in requirements capture. The planning process -- including research, interview, external review, and adversarial review -- was thorough in validating technical correctness but had zero mechanisms for validating user intent alignment.

The core lesson: **no amount of technical review can compensate for building the wrong thing.** The planning workflow needs explicit, mandatory checkpoints that ask "is this the right thing to build?" before asking "is this the right way to build it?"

The work produced in Phase 11A (dark theme, GPU tiers, postprocessing pipeline, UV transition) is not wasted -- it is useful infrastructure. But it should have been preceded by, or concurrent with, improvements to the actual 3D content that the user cares about seeing.
