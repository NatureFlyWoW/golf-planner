# Section 04 Code Review: Door and Window Symbols

## Issues Found

### HIGH
1. Unused `Wall` import in arcPoints.ts (Biome lint fail)
2. Misleading field names in north/south window geometry (works but confusing)
3. `_wallThickness` accepted but ignored in `computeDoorArc`

### MEDIUM
4. WALL_THICKNESS magic number duplicated in 3 files
5. No layer opacity support for openings (Line materials vs mesh)
6. Test names deviate from plan descriptions (but geometry is correct)

### LOW
7. No exhaustive switch default cases
8. 2 break ticks instead of plan's 4 (but 2 is correct for standard notation)
9. Inline props vs named types
10. No tests for north/east/west wall doors

## Passes
- Arc geometry math correct
- useMemo properly applied
- Window lines consolidated into single Line segments call
- Layer visibility check present
- Colors match plan
- Correct mounting in ArchitecturalFloorPlan
