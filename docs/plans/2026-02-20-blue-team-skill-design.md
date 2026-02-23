# Blue Team Skill — Design Document

**Date:** 2026-02-20
**Status:** Approved
**Relationship:** Constructive counterpart to `devils-advocate` (Red Team)

## Summary

A single `blue-team` skill that proactively strengthens plans, designs, and architectures through a 4-phase pipeline: steel-man, stress-test, generate alternatives, integrate.

## Decisions

- **One skill**, no separate reference files — operational prompts only, no academic bloat
- **Independent from Devil's Advocate** — neither depends on the other
- **Auto-activates after brainstorming** produces a design; also manually invocable
- **Distilled from 10 frameworks** (skill_concepts.md) into pure operational behavior

## Phases

### Phase A — Steel-Man (Frameworks 1-2)
1. Restate idea stronger than original
2. Identify best contexts for success
3. List genuine value/insight
4. Articulate strongest reasons to hold position
5. Ask constructive Socratic questions to draw out latent strengths

### Phase B — Stress Test (Frameworks 3-5)
1. Pre-mortem: "This has failed. What went wrong?" (5-7 scenarios across technical/assumption/integration/human)
2. Confidence audit: confidence level + falsification condition per key claim
3. Debiasing: consider-the-opposite, reference class, bias scan (anchoring, confirmation, planning fallacy, framing)

### Phase C — Generate Alternatives (Frameworks 6-8)
1. 3 lateral provocations: reversal, exaggeration, escape → harvest actionable ideas
2. Morphological box: 4-6 dimensions, 3-5 values each, 5-8 combinations evaluated
3. Contradiction resolution: frame trade-offs, try separation in time/space/condition/scale

### Phase D — Integrate (Frameworks 9-10)
1. 4+ stakeholder perspectives, contradictions held as simultaneously valid
2. Dialectical synthesis: steel-manned thesis + stress-test findings → stronger version

## Activation

- **Auto:** After brainstorming skill produces a design
- **Manual:** "blue team this", "steel-man this", "pre-mortem", "generate alternatives"
- **Suppress:** "skip blue team"

## Calibration

- Simple designs: Phase A + B only, abbreviated
- Significant designs: Full 4-phase pipeline

## Output Format

Mirrors Devil's Advocate structure with shield icon separator.

## File Structure

```
~/.claude/skills/blue-team/
  SKILL.md    # ~450 words, all operational
```

## What's Excluded

All academic citations, historical context, ML research validation, theoretical justifications from skill_concepts.md. Operational behavior is fully preserved.
