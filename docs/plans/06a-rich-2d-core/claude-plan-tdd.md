# TDD Plan — Split 06a: Rich 2D Floor Plan Core + Status Bar

Mirrors the structure of `claude-plan.md`. Defines test stubs to write BEFORE implementing each section.

**Testing stack:** Vitest (unit tests), Playwright (visual regression). Existing patterns: store-based state manipulation via `window.__STORE__`, `describe`/`it` blocks, Biome formatting (tabs).

---

## Section 1: Rendering Spike

No formal tests — this is a proof-of-concept validation. Manual visual inspection at multiple zoom levels. The spike component is temporary and will be removed.

---

## Section 2: Viewport-Aware SharedScene

### Unit Tests (`tests/hooks/useViewportId.test.ts`)
- Test: `useViewportId` returns `"2d"` when ViewportContext provides `{ id: "2d" }`
- Test: `useViewportId` returns `"3d"` when ViewportContext provides `{ id: "3d" }`
- Test: `useViewportId` returns `null` when no ViewportContext is provided (mobile fallback)

### Integration Tests (conceptual — verified via visual tests)
- Test: `Hall` renders `HallWalls` in 3D viewport but not in 2D viewport
- Test: `Hall` renders `HallFloor` in both viewports
- Test: `FloorGrid` (drei Grid) renders in 3D viewport but not in 2D viewport

---

## Section 3: Architectural Wall Geometry

### Unit Tests (`tests/utils/wallGeometry.test.ts`)
- Test: `computeWallSegments` for south wall with 2 doors returns 3 segments: [0, 3.25], [6.75, 8.1], [9.0, 10.0]
- Test: `computeWallSegments` for east wall with 2 windows returns 3 segments: [0, 2.0], [5.0, 10.0], [13.0, 20.0]
- Test: `computeWallSegments` for north wall with no openings returns 1 segment: [0, 10.0]
- Test: `computeWallSegments` for west wall with 2 windows returns 3 segments
- Test: `wallSegmentToRect` for south wall segment returns correct position and size
- Test: `wallSegmentToRect` for east wall segment returns correct position and size (rotated axis)
- Test: `computeWallSegments` handles overlapping doors/windows (edge case)
- Test: `computeWallSegments` handles opening at wall edge (start or end)

### Visual Tests (Playwright)
- Test: 2D pane shows thick walls with gaps at door and window positions

---

## Section 4: Door and Window Symbols

### Unit Tests (`tests/utils/arcPoints.test.ts`)
- Test: `computeDoorArc` returns ~24 points for a quarter-circle
- Test: `computeDoorArc` first point is at hinge position
- Test: `computeDoorArc` last point is at door edge position
- Test: `computeDoorArc` all points are at radius distance from hinge
- Test: `computeDoorArc` for inward-opening door arcs into the hall
- Test: `computeDoorArc` for outward-opening door arcs away from hall
- Test: Window break line positions are computed correctly for east/west walls

### Visual Tests (Playwright)
- Test: Zoomed-in 2D view shows door swing arcs on south wall
- Test: Zoomed-in 2D view shows window break lines on east/west walls

---

## Section 5: Status Bar

### Unit Tests (`tests/utils/zoomScale.test.ts`)
- Test: `computeScale` at zoom=20 returns approximately "1:50"
- Test: `computeScale` rounds to nearest standard scale
- Test: `computeScale` at very high zoom returns "1:10"
- Test: `computeScale` at very low zoom returns "1:200"

### Unit Tests (`tests/stores/mouseStatusStore.test.ts`)
- Test: `mouseStatusStore` initial state has null mouseWorldPos
- Test: `setMouseWorldPos` updates store correctly
- Test: `setCurrentZoom` updates store correctly
- Test: `setMouseWorldPos(null)` clears position

### Visual Tests (Playwright)
- Test: Status bar is visible at bottom of app
- Test: Status bar shows coordinate values when cursor is over 2D pane

---

## Section 6: Grid Refinement and Labeled Coordinates

### Unit Tests (within `tests/utils/wallGeometry.test.ts` or separate)
- Test: Grid spacing logic returns 5m major lines at zoom < 10
- Test: Grid spacing logic returns 1m major + 0.5m minor at zoom 10-30
- Test: Grid spacing logic returns 1m major + 0.25m minor at zoom > 30
- Test: Grid label positions are computed correctly for X axis (0-10)
- Test: Grid label positions are computed correctly for Z axis (0-20)

### Visual Tests (Playwright)
- Test: 2D pane shows labeled grid coordinates along edges

---

## Section 7: Textured 2D Holes

No unit tests — this is primarily visual (ShaderMaterial). Tested via visual regression.

### Visual Tests (Playwright)
- Test: Zoomed-in 2D view shows textured hole surfaces (vs flat color at overview zoom)

---

## Section 8: Scale-Dependent Detail (LOD System)

### Unit Tests (`tests/hooks/useZoomLOD.test.ts`)
- Test: LOD returns `"overview"` when zoom < 15
- Test: LOD returns `"standard"` when zoom is between 15 and 40
- Test: LOD returns `"detail"` when zoom >= 40
- Test: LOD boundary at exactly 15 returns `"standard"`
- Test: LOD boundary at exactly 40 returns `"detail"`

---

## Section 9: Title Block

No unit tests — purely visual. Tested via Playwright.

### Visual Tests (Playwright)
- Test: Title block is visible in bottom-right of 2D pane
- Test: Title block shows "Golf Forge" text

---

## Section 10: Integration, Polish, and Testing

### Integration Visual Tests (Playwright)
- Test: Full 2D architectural floor plan at default zoom (comprehensive baseline)
- Test: 2D pane with collapsed 3D shows full-width floor plan
- Test: UV mode shows appropriate dark-theme colors for all architectural elements
- Test: Existing visual tests still pass (no regressions)

### Manual Verification
- Hole placement still works (raycasts not blocked by new meshes)
- Layer toggle hides/shows architectural elements
- Mobile top-down view shows simplified architectural walls
