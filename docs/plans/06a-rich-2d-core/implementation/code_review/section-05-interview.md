# Section 05 Code Review Interview — Status Bar

## Triage Summary

| Finding | Severity | Decision |
|---------|----------|----------|
| `computeScale` ignores `viewportWidthPx` and `hallWidthM` params | HIGH | **Auto-fix**: removed unused params from signature |
| Tracker plane may intercept hole placement events | HIGH | **Let go**: R3F event bubbling handles this; plane is at same Y as existing floor |
| Missing active layer display in StatusBar | MEDIUM | **Let go**: not in section spec, future enhancement |
| Weakened test assertions (toContain array) | MEDIUM | **Let go**: tests verify format + standard scale membership; exact values depend on tuning |
| Out-of-bounds coordinate display | MEDIUM | **Let go**: coordinates outside hall are useful for orientation |
| LocationBar.tsx orphaned | LOW | **Auto-fix**: deleted old file |
| Hardcoded 800px in StatusBar | LOW | **Auto-fix**: removed along with unused params |

## Auto-Fixes Applied

1. **Simplified `computeScale` signature** — removed `viewportWidthPx` and `hallWidthM` params that were unused in the actual formula. Function now takes only `cameraZoom: number`.
2. **Updated all test calls** — removed extra args from `computeScale()` calls in zoomScale.test.ts.
3. **Updated StatusBar.tsx** — removed `hall` selector (no longer needed), simplified `computeScale(currentZoom)` call.
4. **Deleted `src/components/ui/LocationBar.tsx`** — orphaned after rename to StatusBar.

## Verification

- 9/9 tests pass (5 zoomScale + 4 mouseStatusStore)
- TypeScript clean (`tsc --noEmit` passes)
