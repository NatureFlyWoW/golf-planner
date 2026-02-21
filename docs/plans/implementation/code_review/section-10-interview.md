# Section 10 Code Review Interview

## Triage Summary

| # | Issue | Severity | Decision |
|---|-------|----------|----------|
| 1 | No beforeEach store reset in tests | HIGH | Auto-fix — added beforeEach with getInitialState() |
| 2 | MATERIAL_SWAP_TIME unused import | HIGH | Auto-fix — removed unused import |
| 3 | No migration test for v7->v8 | HIGH | Auto-fix — added 3 migration tests + v8 passthrough |
| 4 | Indentation inconsistency | MEDIUM | Auto-fix — Biome handles |
| 5 | uv-button-pulse missing from BottomToolbar | MEDIUM | Auto-fix — added className prop to ToggleBtn |
| 6 | uv-flicker keyframe not in CSS | MEDIUM | Let go — rAF is primary implementation |
| 7 | HMR stale closure | MEDIUM | Let go — dev-only, unlikely |
| 8 | Unused variable in test | LOW | Auto-fix — removed |
| 9 | Duplicate timing assertions | LOW | Auto-fix — removed duplicate block |
| 10 | setUvTransitionEnabled untested | LOW | Let go — trivial setter |
| 11 | Phase 2 UI dimming | LOW | Let go — cosmetic |
| 12 | Unmount race: transitioning stuck | RACE | Auto-fix — cleanup calls setTransitioning(false) |
| 13 | flipUvMode unguarded | RACE | Let go — internal API |

## Auto-fixes Applied

1. Added `beforeEach(() => useStore.setState(useStore.getInitialState()))` to test file
2. Removed `MATERIAL_SWAP_TIME` import from `UVTransition.tsx`
3. Added 4 new migration tests (3 for v7->v8 + 1 v8 passthrough), replaced stale v7 passthrough
4. Added `uv-button-pulse` class and `className` prop to BottomToolbar's ToggleBtn
5. Removed duplicate timing constant test block
6. Added unmount cleanup: `setTransitioning(false)` if still transitioning
7. Removed unused `store` variable from test

## User Interview

User away — no items required input. All decisions auto-triaged.
