# Opus Review

**Model:** claude-opus-4-6
**Generated:** 2026-02-22T23:30:00Z

---

## 1. Critical Architectural Issue: SharedScene Is Shared, Not Viewport-Specific

The plan says to mount `ArchitecturalFloorPlan` "in the 2D View scene" but does not address how to split `SharedScene` into viewport-specific rendering. `SharedScene` already renders `<Hall>` (which includes `<HallWalls>` and `<HallOpenings>`) in both viewports, so adding 2D walls would create duplicate rendering.

**Required resolution:** Make `SharedScene` viewport-aware (read `ViewportContext`), split into separate scene components, or have `<Hall>` conditionally skip walls/openings in 2D.

## 2. Status Bar vs. LocationBar Conflict

App.tsx already renders `<LocationBar>` at the bottom with location data, coordinates, sun data, and map links. The plan proposes a new `StatusBar` without mentioning `LocationBar`. Two bars stacked would waste space.

## 3. Zustand Store Update Frequency (Performance Footgun)

`onPointerMove` fires at 60+ Hz. Each Zustand `set()` triggers re-renders. Plan needs throttling or ref-based approach for mouseWorldPos.

## 4. Window Offset Semantics — Verified Correct

South wall and east wall segment calculations are correct.

## 5. Mobile Fallback Path Not Addressed

Mobile uses a completely different layout (no `<View>` components). Plan needs to specify how architectural elements render on mobile in top-down mode.

## 6. Section 6 (Textured 2D Holes) — Incomplete Integration Design

`PlacedHoles` renders full 3D `HoleModel` in `SharedScene`. The overlay approach risks Z-fighting. Need to specify: replace in 2D or layer on top?

## 7. Section 1 Spike — Scope Creep Risk

Hatch shader in spike is never used in remaining sections (walls use solid fill, holes use noise). Remove from spike.

## 8. LOD Hook Implementation — useFrame in Multiple Components

Multiple components each calling `useZoomLOD()` is redundant. Better: compute once in wrapper, pass as prop.

## 9. Grid Replacement Scope — SharedScene Again

Keep drei `<Grid>` for 3D, `ArchitecturalGrid2D` for 2D, both gated by viewport context. Requires solving SharedScene.

## 10. Title Block Scale Computation — Incorrect Formula

"1 world unit = 1 pixel at zoom=1" is incorrect for orthographic camera unless frustum matches viewport.

## 11. Section Ordering Issue

Viewport-Aware Rendering (Section 9) is a prerequisite for Sections 2-6 but comes after them. Should be moved to Section 2.

## 12. UV Mode Not Addressed Per Section

Every new component needs UV mode color variants. Should be specified in each section, not deferred to "edge cases."

## 13. Missing: Interaction Passthrough for Architectural Elements

New wall/felt meshes will intercept raycasts for hole placement/selection. Must set `raycast={null}` or render at Y-positions that don't intersect.

## 14. Performance: Grid Labels Object Count

Actual count is ~171-192 objects, not ~70-80. Grid alone is 90+ objects. Need batching strategy (Segments, instancing, single Line with segments=true).

## 15. Missing: Pointer Leave Handling for StatusBar

`onPointerLeave` on the 2D pane DOM container needed to null mouseWorldPos when cursor exits.

## 16. Spec Requirement: Wall Thickness Values

Spec mentions two thicknesses (exterior 0.2m, interior 0.12m) but plan uses single 0.2m. No interior walls exist currently — clarify this is out of scope.

---

## Summary Priority

**Must fix:** #1, #11, #13, #2
**Should fix:** #3, #5, #12, #14, #15
**Nice to fix:** #7, #6, #10, #8
