# Section 09 — Code Review Interview Transcript

## Review Source
- Diff: `section-09-diff.md`
- Review: `section-09-review.md`

## Triage Summary

| # | Finding | Severity | Action |
|---|---------|----------|--------|
| H1 | OBB construction ignores template holes | HIGH | Auto-fix |
| M2 | OBBs rebuilt every frame (GC pressure) | MEDIUM | Auto-fix |
| M3 | getDoorZones called every frame | LOW-MEDIUM | Auto-fix |
| #4 | Missing deriveFrameloop cross-check test | PLAN | Auto-fix |
| #7 | ENTER_DURATION should be module-level | NITS | Auto-fix |
| #10 | RAF stubbing duplication | NITS | Let go |

## Auto-Fixes Applied

### H1: Template hole collision bounds (HIGH)

**Problem:** `WalkthroughController` only used `HOLE_TYPE_MAP[hole.type]` for collision dimensions. Template holes (with `hole.templateId`) have custom dimensions from `computeTemplateBounds()`. The existing `buildOBBMap` in `PlacementHandler.tsx` already handles this correctly.

**Fix:** Created `buildHoleOBBs()` helper that reads `holeTemplates` from the store and branches on `hole.templateId` to use `computeTemplateBounds()` when applicable.

### M2 + M3: Per-frame allocation (MEDIUM)

**Problem:** OBBs and door zones rebuilt every frame inside `useFrame`, causing unnecessary GC pressure. Holes don't move during walkthrough.

**Fix:** Cached both in refs (`holeOBBsRef`, `doorZonesRef`), computed once on mount in the `useEffect`. Door zones passed directly from ref; hole OBBs accessed from ref in `useFrame`.

### #4: deriveFrameloop cross-check test

**Problem:** Plan specified testing `deriveFrameloop` round-trip in walkthrough lifecycle tests. Originally omitted.

**Fix:** Added test "deriveFrameloop returns 'always' during walkthrough, 'demand' after exit" to the section 09 lifecycle test block. Imports `deriveFrameloop` and composes it with store state.

### #7: ENTER_DURATION hoisted

**Problem:** `ENTER_DURATION = 0.5` was declared inside component body, re-declared every render.

**Fix:** Moved to module-level constant above the component function.

## Items Let Go

### #10: RAF stubbing duplication
The section 09 tests inline their own `requestAnimationFrame` stub rather than using the `beforeEach`/`afterEach` pattern from the `exitWalkthrough` describe block. This is intentional — the section 09 tests are in a separate describe block and self-contained. Minor duplication is acceptable for test isolation.

## Verification

All 785 tests pass after fixes. TypeScript check clean.
