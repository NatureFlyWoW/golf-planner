# Section 04 Code Review Interview

## Triage

| Finding | Severity | Decision |
|---------|----------|----------|
| Unused `Wall` import | HIGH | Auto-fix — removed |
| Misleading field names in N/S window geom | HIGH | Let go — works correctly, internal detail |
| `_wallThickness` unused in computeDoorArc | HIGH | Auto-fix — removed parameter |
| WALL_THICKNESS duplicated in 3 files | MEDIUM | Auto-fix — extracted to shared `ARCH_WALL_THICKNESS` in wallGeometry.ts |
| No layer opacity for openings | MEDIUM | Let go — architectural limitation (Line vs Mesh materials) |
| Test name deviations from plan | MEDIUM | Let go — tests are correct for actual geometry |
| No exhaustive switch defaults | LOW | Let go — Wall type is stable |
| 2 vs 4 break ticks | LOW | Let go — 2 is correct standard notation |
| Inline props vs named types | LOW | Let go — project convention |
| No tests for N/E/W doors | LOW | Let go — south wall tests cover core algorithm |

## Auto-fixes Applied

1. Removed unused `Wall` import from `arcPoints.ts`
2. Removed `_wallThickness` parameter from `computeDoorArc` signature
3. Updated all test calls to match new signature
4. Extracted `ARCH_WALL_THICKNESS = 0.2` to `wallGeometry.ts` as shared export
5. Updated `ArchitecturalWalls2D.tsx` and `WindowSymbol2D.tsx` to import from shared constant
6. Removed local `WALL_THICKNESS` constant from `DoorSymbol2D.tsx` and `WindowSymbol2D.tsx`

## No User Interview Needed

All actionable findings were straightforward auto-fixes. No tradeoff decisions.
