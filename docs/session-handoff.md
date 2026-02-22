# Session Handoff — 2026-02-22 (Sections 01-11 Complete)

## Completed This Session
- **Section 10 (Feature Migration): COMPLETE** — commit `599110f`
  - Removed `showFlowPath`/`toggleFlowPath` from store, types, and UI
  - Migrated Toolbar + BottomToolbar to use `layers.flowPath.visible` + `toggleLayerVisible("flowPath")`
  - Removed desktop view toggle button from Toolbar
  - Moved MiniMap from container overlay into 2D pane div
  - 4 tests in `tests/components/featureMigration.test.ts`
- **Section 11 (Mobile & Responsive): COMPLETE** — commit `abb74ff`
  - Created `useIsMobileViewport` hook (reactive matchMedia, 768px breakpoint)
  - DualViewport mobile fallback: single Canvas, no View components, ui.view drives camera
  - MobileLayerPanel created, registered in App.tsx
  - Layers button added to BottomToolbar overflow menu
  - CameraPresets gated on mobile (isMobile guard)

## Current State
- **Branch**: `feat/dual-viewport-and-layers`
- **Working tree**: clean (only .claude/homunculus files dirty)
- **Tests**: 582 passing (52 files)
- **TypeScript**: clean (no errors)
- **deep-implement state**: sections 01-11 recorded complete in `docs/plans/01-dual-viewport-and-layers/implementation/deep_implement_config.json`
- **Next section**: section-12-polish-and-testing (LAST section)

## Sections Status (11 of 12 complete)
- [x] section-01-spike (27f09fd)
- [x] section-02-types-and-store (c766429)
- [x] section-03-split-pane-layout
- [x] section-04-dual-canvas-views
- [x] section-05-camera-system
- [x] section-06-event-isolation
- [x] section-07-layer-state
- [x] section-08-layer-panel-ui
- [x] section-09-postprocessing (c93b458)
- [x] section-10-feature-migration (599110f)
- [x] section-11-mobile-responsive (abb74ff)
- [ ] section-12-polish-and-testing ← NEXT

## Key Files Modified (sections 10-11)
- `src/types/ui.ts` — removed `showFlowPath` field
- `src/store/store.ts` — removed `toggleFlowPath` action + `showFlowPath` default
- `src/components/ui/Toolbar.tsx` — flow path migrated to layers, view toggle removed
- `src/components/ui/BottomToolbar.tsx` — flow path migrated, Layers button added
- `src/components/layout/DualViewport.tsx` — MiniMap moved to 2D pane, mobile fallback added
- `src/hooks/useIsMobileViewport.ts` — NEW (reactive mobile viewport hook)
- `src/components/ui/MobileLayerPanel.tsx` — NEW (mobile layer controls overlay)
- `src/components/three/CameraPresets.tsx` — isMobile guard added
- `src/App.tsx` — MobileLayerPanel registered

## deep-implement Recovery
Run: `/deep-implement @docs/plans/01-dual-viewport-and-layers/sections/`
Setup will detect sections 01-11 complete and resume from section-12.

## Section 12 Preview (Polish & Testing)
This is the final section. Expected tasks:
- Playwright visual regression tests for dual-viewport
- Accessibility audit
- Performance verification
- Final cleanup and polish

## Environment
- fnm: `export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)"`
- Biome uses tabs, PostToolUse hook runs tsc --noEmit
- 30+ commits ahead of origin — NOT PUSHED

---

# Session 27 Addendum — 2026-02-22 (Homunculus Improvements)

## Context
This was a check-in / meta session (no app dev work). The user explored how the homunculus system works, then we designed and implemented improvements through red team + blue team adversarial review.

## What Changed (Homunculus v2.1)
Four targeted improvements to the homunculus plugin, all backward-compatible:

### 1. `last_validated` timestamps on all instincts
- Added `last_validated: "2026-02-22T00:00:00Z"` to all 25 existing instinct files
- Observer updated to include `last_validated` in its instinct template
- Observer updated to bump `last_validated` on existing instincts confirmed by new observations
- Enables future staleness detection without building the decay mechanism yet

### 2. Anti-instinct support (observer learns from mistakes)
- Added "Mistake Patterns" section to observer.md — observer now detects repeated errors, user rejections, and postmortem signals
- Anti-instincts use the same file format but with negative actions: `STOP — [what to avoid]. Instead: [correct approach]`
- No new file types or directories — just a convention within existing format

### 3. Contradiction-triggered evolution
- Added to both observer.md (detection) and evolve.md (resolution)
- 2+ instincts in same domain with conflicting actions = evolution opportunity, regardless of 5-instinct threshold
- Observer writes contradiction reasons to `identity.json` `.evolution.reasons` field
- Evolve command synthesizes contradictions into context-dependent rules rather than picking a winner

### 4. `/homunculus:review` evolved command
- First evolved command (not skill, not agent) — user-invokable
- Lives at `.claude/homunculus/evolved/commands/review.md`
- Domain-filtered instinct surfacing: auto-detects domain from current activity or accepts explicit domain argument
- Presents matching instincts as a pre-flight checklist with anti-instincts highlighted
- Registered in identity.json under `homunculus.evolved`

## Files Modified
- `.claude/homunculus/instincts/personal/*.md` (all 25) — added `last_validated` field
- `~/.claude/plugins/cache/homunculus/homunculus/2.0.0-alpha/agents/observer.md` — anti-instincts, last_validated, contradiction detection
- `~/.claude/plugins/cache/homunculus/homunculus/2.0.0-alpha/commands/evolve.md` — contradiction-triggered evolution
- `.claude/homunculus/evolved/commands/review.md` — NEW (evolved command)
- `.claude/homunculus/identity.json` — registered review command, added milestone, added `evolution.reasons` field

## Design Decision Trail
- 5 improvements were proposed, red-teamed (devils-advocate), then blue-teamed
- Red team killed 2 (cross-domain linking = redundant, conflict resolution = no evidence), deferred 1 (decay = premature)
- Blue team rehabilitated contradiction-triggered evolution as a reframing of conflict resolution
- Final synthesis: 4 small, reversible changes — no new file types, no new directories, no new concepts

## Next Session
- Continue app dev work (Section 12 of dual viewport split is still pending)
- The homunculus improvements are passive — they'll take effect naturally in future sessions as the observer runs
