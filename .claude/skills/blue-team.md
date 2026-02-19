---
name: blue-team
description: Use when strengthening plans, designs, or architectures — automatically after brainstorming produces a design, or manually when asked to steel-man, stress-test, or generate alternatives for any proposal
---

# Blue Team — Constructive Strengthening Review

## Overview

Counterpart to Devil's Advocate (Red Team). Blue Team proactively **strengthens** ideas through a 4-phase pipeline: steel-man the idea, stress-test assumptions, generate divergent alternatives, then synthesize a stronger version.

## When This Skill Activates

**Automatically** after the brainstorming skill produces a design, before transitioning to writing-plans.

**Manually** when the user says: "blue team this", "steel-man this", "pre-mortem", "generate alternatives", or `/blue-team`.

**Do NOT activate** for: simple Q&A, trivial edits, when user says "skip blue team", or follow-up iterations already addressing previous review.

## The 4-Phase Process

Present output with a clear separator:

```
---
🛡️ **Blue Team Review**
---
```

### Phase A — Steel-Man

Before any evaluation, you MUST:

1. **Restate** the idea in its strongest form — *better* than the original, filling in unstated but plausible supporting assumptions
2. **Identify contexts** where this idea would be most effective
3. **List** what is genuinely valuable or insightful about it
4. **Articulate** the strongest reasons someone would champion this approach

Then ask constructive questions to draw out latent strengths:
- "The heart of this seems to be [X] — it could be strengthened by [Z]"
- "The most compelling evidence supporting this would be..."
- "If this works, the broader implications include..."
- "What would this look like at its absolute best?"

**Do NOT skip this phase.** The baseline failure mode is jumping straight to gap-finding. Steel-manning first is the entire point.

### Phase B — Stress Test

1. **Pre-mortem**: Assert "This has been implemented and has failed catastrophically." Generate **5-7 specific failure scenarios** across: technical failures, assumption failures, integration failures, human/organizational failures. Assess likelihood + severity for each. Identify mitigations for the top 3.

2. **Confidence audit**: For each key claim, state confidence (high/medium/low), what would **falsify** it ("this is wrong if..."), and whether evidence actually updated beliefs or just confirmed priors.

3. **Debiasing checklist**:
   - **Consider-the-opposite**: strongest arguments against this approach
   - **Reference class**: what typically happens with similar approaches? Am I claiming "this time is different"?
   - **Bias scan**: anchored on first solution? confirmation bias? planning fallacy? framing effects?

### Phase C — Generate Alternatives

1. **3 provocations** (minimum):
   - **Reversal**: "What if we did the exact opposite?"
   - **Exaggeration**: "What if we had unlimited [resource]?"
   - **Escape**: "What if we dropped the assumption that [X]?"
   For each: extract a useful principle, trace positive implications, harvest at least one actionable idea. The provocations should feel absurd — the value is in the movement, not the provocation.

2. **Morphological box**: Decompose the problem into **4-6 independent dimensions**, list 3-5 values per dimension (including at least one unconventional option), generate **5-8 combinations**, evaluate feasibility and novelty. Select 2-3 most interesting for deeper consideration.

3. **Contradiction resolution**: If trade-offs exist, frame them as contradictions ("Improving X requires sacrificing Y"). Try separation in **time, space, condition, or scale**. Articulate the Ideal Final Result — the state where the function is achieved with zero cost.

### Phase D — Integrate

1. **Multi-perspective**: Generate **4+ stakeholder framings** qualified with "from this standpoint." Present contradictory assessments as simultaneously valid — do not resolve into false consensus. Flag where the framing itself may be incomplete.

2. **Dialectical synthesis**: Thesis (steel-manned original from Phase A) + Antithesis (stress-test findings from Phase B + alternatives from Phase C) = **Synthesis** (a version stronger than any individual perspective). Where reasoning paths disagree, flag as genuine uncertainty rather than forcing resolution.

## Output Format

```markdown
---
🛡️ **Blue Team Review**
---

**Phase A — Steel-Manned Version**
[Strongest restatement + constructive questions]

**Phase B — Stress Test**
[Pre-mortem scenarios | Confidence audit | Debiasing results]

**Phase C — Alternatives Explored**
[Provocations | Morphological combinations | Contradiction resolutions]

**Phase D — Synthesis**
[Final strengthened version integrating best elements]
```

## Calibration

- **Simple designs**: Phase A + B only, abbreviated (2-3 pre-mortem scenarios, skip morphological box)
- **Significant designs**: Full 4-phase pipeline
- Depth scales with significance — same principle as Devil's Advocate

## Behavioral Rules

1. **Steel-man BEFORE stress-testing.** The most common failure is skipping Phase A and going straight to gap-finding. That's Devil's Advocate, not Blue Team.

2. **Generate genuinely different alternatives, not incremental improvements.** Phase C must produce ideas from a fundamentally different paradigm, not just "the same thing but more detailed."

3. **Hold contradictions.** Phase D should present stakeholder perspectives that genuinely conflict and mark them as simultaneously valid. Premature resolution destroys insight.

4. **Separate generation and critique.** Never combine steel-manning and stress-testing in the same phase. The phases must be sequential, not interleaved.

5. **Respect the user's time.** If the design is genuinely strong, say so. Don't manufacture weaknesses or generate pointless alternatives. A strong Phase A verdict + light Phase B with no critical findings is a valid outcome.

## User Commands

- **"Steel-man this"** → Phase A only
- **"Pre-mortem"** → Phase B only
- **"Generate alternatives"** → Phase C only
- **"Skip blue team"** → Suppress auto-activation
- **"Deep blue"** → Extra thorough, all phases expanded
