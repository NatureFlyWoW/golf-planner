# Section 03 Code Review: Architectural Wall Geometry

## Overall Assessment

The implementation is a faithful, clean translation of the section plan. Utility functions, component, tests, and mounting are all present and structurally correct.

## Issues Found

### MEDIUM: New MeshBasicMaterial created every render cycle

**File:** `ArchitecturalWalls2D.tsx`, line 96

When `uvMode` toggles, React re-renders and creates new `MeshBasicMaterial` instances for all 12 wall fill meshes. The `useGroupOpacity` hook stores refs to OLD materials in a WeakMap. If opacity != 1.0 at the moment of UV toggle, new materials render at default opacity until the effect re-runs. Subtle race between material re-creation and opacity effect.

### LOW: `wallSide` stored in rects but never consumed

`wallSide` is destructured away in the map callback and never used. Dead data that increases object allocation per segment. Should be removed.

### LOW: No clamping of gap intervals to wall bounds

If a door/window offset + width exceeds wall length, the gap extends beyond wall boundary. The filter catches zero-length segments but silently accepts invalid data. For a personal tool this is fine.

### INFO: No tests for `rectToOutlineSegments`

Pure geometric helper in the component file. Could be extracted to `wallGeometry.ts` for testability.

### INFO: `outlineOnly` prop exists but mobile path doesn't use it

The prop works correctly but `ArchitecturalFloorPlan` has no mobile fallback path — it returns null for non-2d viewports. The mobile outline-only behavior from the plan is not implemented.

## Passes

- All 11 specified tests present and match plan exactly
- Utility functions implement the plan's algorithm correctly
- Component follows project conventions (named exports, Zustand selectors, useMemo, Biome tabs)
- Colors match plan specification
- Performance characteristics match plan (~13 draw objects)

## Verdict

Approve with optional cleanup of unused `wallSide` field in rects array.
