Now I have all the context I need. Let me generate the section content.

# Section 6: Grid Refinement and Labeled Coordinates

## Overview

This section replaces the drei `<Grid>` component in the 2D viewport with a custom `ArchitecturalGrid2D` component that supports adaptive line spacing based on zoom level and labeled coordinates along the edges. The drei `<Grid>` continues to render unchanged in the 3D viewport.

The drei `<Grid>` is a shader-based infinite grid that does not support labeled coordinates or adaptive density per zoom level. A custom component using drei `<Line segments>` and `<Text>` gives full control over these features.

**User-Visible Outcome:** The 2D pane shows a grid with coordinate labels along the top (X: 0-10m) and left (Z: 0-20m) edges. Grid density adapts as the user zooms: sparse at overview level, dense at close-up. Lines are crisp at all zoom levels.

---

## Dependencies

- **Section 02 (Viewport-Aware SharedScene):** Must be complete. The existing `FloorGrid` must already be skipping the drei `<Grid>` in the 2D viewport using `useViewportId()`. This section adds `ArchitecturalGrid2D` as the 2D replacement, rendered inside or alongside the `ArchitecturalFloorPlan` wrapper in `SharedScene`.
- **Section 08 (LOD System):** The `useZoomLOD` hook is not strictly required. This section implements its own grid-specific zoom thresholds (see Grid Density table below). However, if section 08 is already implemented, the grid component can optionally consume `useZoomLOD()` instead of reading camera zoom directly. Either approach works.

---

## Tests First

All tests are written BEFORE implementation. Test file: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/utils/gridSpacing.test.ts`

### Unit Tests: Grid Spacing Logic

```typescript
import { describe, expect, it } from "vitest";
import {
	computeGridSpacing,
	computeGridLabelPositions,
} from "../../src/utils/gridSpacing";

describe("computeGridSpacing", () => {
	it("returns 5m major lines with no minor lines at zoom < 10", () => {
		const result = computeGridSpacing(5);
		expect(result.majorSpacing).toBe(5);
		expect(result.minorSpacing).toBeNull();
	});

	it("returns 1m major + 0.5m minor lines at zoom 10-30", () => {
		const result = computeGridSpacing(20);
		expect(result.majorSpacing).toBe(1);
		expect(result.minorSpacing).toBe(0.5);
	});

	it("returns 1m major + 0.25m minor lines at zoom > 30", () => {
		const result = computeGridSpacing(50);
		expect(result.majorSpacing).toBe(1);
		expect(result.minorSpacing).toBe(0.25);
	});

	it("boundary: zoom exactly 10 returns medium spacing", () => {
		const result = computeGridSpacing(10);
		expect(result.majorSpacing).toBe(1);
		expect(result.minorSpacing).toBe(0.5);
	});

	it("boundary: zoom exactly 30 returns close spacing", () => {
		const result = computeGridSpacing(30);
		expect(result.majorSpacing).toBe(1);
		expect(result.minorSpacing).toBe(0.5);
		// 30 is in the 10-30 range (upper bound inclusive)
	});

	it("boundary: zoom 30.01 returns close spacing", () => {
		const result = computeGridSpacing(30.01);
		expect(result.majorSpacing).toBe(1);
		expect(result.minorSpacing).toBe(0.25);
	});
});

describe("computeGridLabelPositions", () => {
	it("returns correct X-axis label positions for 10m width at 1m spacing", () => {
		const labels = computeGridLabelPositions("x", 10, 1);
		expect(labels).toHaveLength(11); // 0, 1, 2, ... 10
		expect(labels[0]).toEqual({ value: 0, position: [0, 0.01, -0.5] });
		expect(labels[10]).toEqual({ value: 10, position: [10, 0.01, -0.5] });
	});

	it("returns correct Z-axis label positions for 20m length at 1m spacing", () => {
		const labels = computeGridLabelPositions("z", 20, 1);
		expect(labels).toHaveLength(21); // 0, 1, 2, ... 20
		expect(labels[0]).toEqual({ value: 0, position: [-0.5, 0.01, 0] });
		expect(labels[20]).toEqual({ value: 20, position: [-0.5, 0.01, 20] });
	});

	it("returns correct positions at 5m spacing for overview zoom", () => {
		const labels = computeGridLabelPositions("x", 10, 5);
		expect(labels).toHaveLength(3); // 0, 5, 10
		expect(labels[0].value).toBe(0);
		expect(labels[1].value).toBe(5);
		expect(labels[2].value).toBe(10);
	});

	it("returns correct Z labels at 5m spacing", () => {
		const labels = computeGridLabelPositions("z", 20, 5);
		expect(labels).toHaveLength(5); // 0, 5, 10, 15, 20
	});
});
```

### Visual Tests (Playwright)

A Playwright visual regression test is defined in section 10 (Integration) but conceptually validates this section:
- **Test:** 2D pane shows labeled grid coordinates along edges at default zoom.

---

## Implementation Details

### File: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/utils/gridSpacing.ts`

Pure utility functions with no R3F or Three.js dependencies. Easily unit-testable.

**`computeGridSpacing(zoom: number)`** -- Returns an object with `majorSpacing` and `minorSpacing` (or `null` if no minor lines at this zoom):

| Zoom Range | `majorSpacing` | `minorSpacing` |
|-----------|----------------|----------------|
| `< 10` (far) | `5` | `null` |
| `10 <= zoom <= 30` (medium) | `1` | `0.5` |
| `> 30` (close) | `1` | `0.25` |

Return type:
```typescript
type GridSpacing = {
	majorSpacing: number;
	minorSpacing: number | null;
};
```

**`computeGridLabelPositions(axis, maxValue, spacing)`** -- Generates an array of label descriptors:

```typescript
type GridLabel = {
	value: number;
	position: [number, number, number];
};
```

- For `axis === "x"`: labels placed at `[value, 0.01, -0.5]` (above the hall, offset in -Z for the top edge).
- For `axis === "z"`: labels placed at `[-0.5, 0.01, value]` (to the left of the hall, offset in -X for the left edge).
- Iterates from `0` to `maxValue` inclusive, stepping by `spacing`.

**`computeGridLineSegments(hallWidth, hallLength, spacing)`** -- Generates all grid line points as flat segment pairs for batched rendering:

```typescript
type GridLineSegments = Array<[number, number, number]>;
```

- For each vertical line (X = 0, spacing, 2*spacing, ... hallWidth): push two points `[x, 0.01, 0]` and `[x, 0.01, hallLength]`.
- For each horizontal line (Z = 0, spacing, 2*spacing, ... hallLength): push two points `[0, 0.01, z]` and `[hallWidth, 0.01, z]`.
- The caller renders these with `<Line segments={true}>`, where each consecutive pair of points forms one line segment.

---

### File: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/architectural/ArchitecturalGrid2D.tsx`

R3F component that renders the custom grid in the 2D viewport.

**Structure:**

```typescript
/**
 * Custom architectural grid for the 2D viewport with labeled coordinates
 * and adaptive spacing based on camera zoom level.
 *
 * Replaces the drei <Grid> (which continues to render in 3D viewport).
 * All meshes use raycast={() => {}} to avoid blocking hole interactions.
 */
export function ArchitecturalGrid2D(): JSX.Element | null {
	// 1. Read layer state: layers.grid.visible and layers.grid.opacity
	// 2. Read uvMode for color theming
	// 3. Read camera.zoom via useFrame (store in ref, not state)
	// 4. Compute spacing from zoom ref
	// 5. Render major lines, minor lines (if applicable), and labels
}
```

**Key implementation details:**

1. **Layer gating:** Return `null` if `layers.grid.visible` is false. Apply `useGroupOpacity` for opacity support (wrap everything in a `<group ref={groupRef}>`).

2. **Camera zoom tracking:** Use `useFrame` to read `camera.zoom` into a local ref. Recompute grid spacing only when the zoom crosses a threshold boundary (not every frame). Use `useMemo` or a state update triggered by threshold changes to avoid unnecessary geometry rebuilds.

3. **Major grid lines:** Rendered as a single `<Line segments={true}>` call. Points computed by `computeGridLineSegments(hallWidth, hallLength, majorSpacing)`. At medium zoom (1m spacing, 10x20m hall), this produces approximately 30 vertical + horizontal line pairs = ~60 segment pairs in one draw call.
   - Planning mode color: `#cccccc`, line width: `0.5`
   - UV mode color: `#2A2A5E`, line width: `0.5`
   - `worldUnits={false}` so line width is in screen pixels (constant regardless of zoom)

4. **Minor grid lines:** A second `<Line segments={true}>` call with the minor spacing. Only rendered when `minorSpacing !== null`. Uses lighter colors and thinner lines:
   - Planning mode color: `#eeeeee`, line width: `0.3`
   - UV mode color: `#1A1A4E`, line width: `0.3`
   - `worldUnits={false}`
   - Minor lines that coincide with major lines should be excluded from the minor batch to avoid overdraw (filter out positions that are multiples of `majorSpacing`).

5. **Labels:** Rendered as drei `<Text>` components. One for each label position from `computeGridLabelPositions`.
   - Font size: `0.3` (in world units, but scaled by inverse zoom)
   - Planning color: `#999999`; UV color: `#4A4A8E`
   - **Inverse-zoom scaling:** Each `<Text>` needs to maintain constant screen size. Use a `useFrame` callback to set `ref.current.scale.setScalar(1 / camera.zoom)` on each text instance. Alternatively, use a single `useFrame` on the labels `<group>` that scales all children together if they share the same base size.
   - `anchorX="center"` and `anchorY="middle"` for centering
   - `raycast={() => {}}` on Text components (they should not intercept pointer events)
   - Label text format: integer values (e.g., `"0"`, `"5"`, `"10"`, `"20"`)
   - Label spacing follows `majorSpacing` (not minor). At overview zoom: labels every 5m. At medium/close zoom: labels every 1m.

6. **Y position:** All grid geometry at `Y = 0.01` (matches the existing `FloorGrid` position, slightly above the floor plane at `Y = 0` to avoid Z-fighting).

7. **Raycast passthrough:** The `<Line>` component from drei does not participate in raycasting by default (it uses `Line2` which has no built-in raycast). No explicit `raycast` override needed on Line components. Text components should have `raycast={() => {}}`.

**Performance at medium zoom (1m + 0.5m spacing, 10x20m hall):**
- Major lines: 1 draw call (~30 segment pairs)
- Minor lines: 1 draw call (~30 segment pairs, excluding major coincidences)
- Labels: ~31 Text objects (11 X-axis + 21 Z-axis at 1m spacing, but using instanced rendering through Troika is not possible, so 31 individual `<Text>` components)
- **Total: ~33 objects.** This is within the performance budget specified in the plan (~33 objects for the grid).

---

### File Modifications

**`/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/FloorGrid.tsx`** -- This file was already modified in Section 02 to skip rendering the drei `<Grid>` in the 2D viewport. No additional changes needed in this section.

**`/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/SharedScene.tsx`** (or the `ArchitecturalFloorPlan` wrapper created in Section 02) -- `ArchitecturalGrid2D` is mounted inside the 2D-only architectural wrapper. If Section 02 created an `ArchitecturalFloorPlan` component that is viewport-gated and already mounted in `SharedScene`, then `ArchitecturalGrid2D` is added as a child of that wrapper. If the wrapper does not exist yet, the component gates itself using `useViewportId()`:

```typescript
const viewportId = useViewportId();
if (viewportId !== "2d") return null;
```

---

## Existing Context

### Hall Dimensions (from `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/constants/hall.ts`)

- Width: `10.0`m, Length: `20.0`m
- Grid covers the full hall area: X from 0 to 10, Z from 0 to 20

### Layer System (from `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/types/viewport.ts`)

Grid layer ID is `"grid"`. Layer state has `visible: boolean`, `opacity: number`, `locked: boolean`. The component reads `useStore(s => s.ui.layers.grid)`.

### ViewportContext (from `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/contexts/ViewportContext.ts`)

The `useViewportInfo()` hook returns `{ id: "2d" | "3d", paneBoundaryX }` or `null` (mobile). The Section 02 hook `useViewportId()` is a convenience wrapper returning just the `id` string.

### UV Mode

Read from `useStore(s => s.ui.uvMode)`. When true, use dark-themed colors for all grid elements. When false, use standard planning-mode colors.

### useGroupOpacity (from `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/hooks/useGroupOpacity.ts`)

Imperatively sets opacity on all materials in a group. Pass `groupRef` and `opacity` value from the layer state.

### Existing FloorGrid Colors (for reference/consistency)

The current drei `<Grid>` in `FloorGrid.tsx` uses:
- Cell: planning `#cccccc`, UV `#2A2A5E`
- Section: planning `#999999`, UV `#2A2A5E`

The new architectural grid should use matching colors for visual consistency.

---

## Implementation Result

### Files Created
| File | Purpose |
|------|---------|
| `src/utils/gridSpacing.ts` | Pure utilities: `computeGridSpacing`, `computeGridLabelPositions`, `computeGridLineSegments` |
| `src/components/three/architectural/ArchitecturalGrid2D.tsx` | R3F component with adaptive grid + labels |
| `tests/utils/gridSpacing.test.ts` | 15 unit tests (6 spacing + 4 labels + 5 line segments) |

### Files Modified
| File | Change |
|------|--------|
| `src/components/three/architectural/ArchitecturalFloorPlan.tsx` | Mounted `<ArchitecturalGrid2D />` |

### Code Review Fixes
- Added 5 tests for `computeGridLineSegments` (was untested)
- Added `spacing <= 0` guards in utility functions
- Narrowed store selector from `s.hall` to `s.hall.width`/`s.hall.length`
- Extracted magic number 40 to `DEFAULT_ZOOM` constant

### Deviations from Plan
- Labels use imperative `useFrame` scaling (scale = DEFAULT_ZOOM / zoom) instead of the `1/camera.zoom` approach mentioned in plan, to achieve ~constant 12px screen size with `fontSize=0.3` world units.