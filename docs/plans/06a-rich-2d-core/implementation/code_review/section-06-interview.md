# Section 06 Code Review Interview — Grid Refinement

## Triage Summary

| Finding | Severity | Decision |
|---------|----------|----------|
| `computeGridLineSegments` untested | HIGH | **Auto-fix**: added 4 tests |
| String-based float comparison in minor-line filter | HIGH | **Let go**: spacings are always clean decimals, Math.round ensures clean values |
| `useGroupOpacity` on Line/Text | MEDIUM | **Let go**: Line2 is Mesh subclass, Troika creates meshes; verify visually |
| `useStore(s.hall)` too broad | MEDIUM | **Auto-fix**: narrowed to `s.hall.width` and `s.hall.length` |
| Spacing useMemo lint suppression | MEDIUM | **Let go**: timing difference negligible at band transitions |
| No guard for spacing <= 0 | MEDIUM | **Auto-fix**: added early return guards |
| Magic number 40 for label scale | LOW | **Auto-fix**: extracted to `DEFAULT_ZOOM` constant with doc comment |
| Grid behind walls, label display, non-evenly-divisible test | LOW | **Let go** |

## Auto-Fixes Applied

1. Added 4 tests for `computeGridLineSegments` (segment count, Y coordinate, non-divisible spacing, zero spacing guard)
2. Added 1 test for `computeGridLabelPositions` with zero spacing
3. Added `if (spacing <= 0) return []` guards in both utility functions
4. Narrowed store selector from `s.hall` to `s.hall.width` / `s.hall.length`
5. Extracted magic number 40 to `DEFAULT_ZOOM` constant with JSDoc

## Verification

- 15/15 tests pass (6 gridSpacing + 4 gridLabel + 5 gridLineSegments)
- TypeScript clean
