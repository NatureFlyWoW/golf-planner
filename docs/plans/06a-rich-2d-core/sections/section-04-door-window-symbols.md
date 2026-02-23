# Section 4: Door and Window Symbols

**Status: IMPLEMENTED**

## Overview

This section adds standard architectural plan symbols for doors and windows in the 2D viewport: door swing arcs (quarter-circle arcs from hinge point) and window break lines (parallel glass lines with perpendicular end ticks). These replace the 3D colored plane representations (`HallOpenings`) that are already hidden in the 2D pane by the viewport-aware `Hall` component from Section 02.

**User-Visible Outcome:** When zoomed into the 2D floor plan, doors show the classic architectural swing arc notation and windows show standard glass/break line symbols, matching professional floor plan software.

**Depends on:** Section 02 (Viewport-Aware SharedScene) -- the `useViewportId()` hook and the `ArchitecturalFloorPlan` wrapper must exist.

---

## File Structure

New files to create:

| File | Purpose |
|------|---------|
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/utils/arcPoints.ts` | Pure utility: compute door arc points and window line positions |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/architectural/DoorSymbol2D.tsx` | R3F component: single door swing arc + panel line |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/architectural/WindowSymbol2D.tsx` | R3F component: single window glass lines + break ticks |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/architectural/ArchitecturalOpenings2D.tsx` | R3F component: iterates doors/windows, renders symbols |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/utils/arcPoints.test.ts` | Unit tests for arc/window point computation |

Modified files:

| File | Change |
|------|--------|
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/architectural/ArchitecturalFloorPlan.tsx` | Mount `<ArchitecturalOpenings2D />` inside the 2D-only wrapper (created in Section 02) |

---

## Hall Data Reference

These are the door and window specs from `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/constants/hall.ts`:

**Doors (both on south wall, Z = hallLength = 20.0):**
- Sectional door: 3.5m wide, offset 3.25m from west corner
- PVC door: 0.9m wide, offset 8.1m from west corner

**Windows (east and west walls):**
- Window 1: east wall, 3.0m wide, offset 2.0m from south corner
- Window 2: east wall, 3.0m wide, offset 10.0m from south corner
- Window 3: west wall, 3.0m wide, offset 2.0m from south corner
- Window 4: west wall, 3.0m wide, offset 10.0m from south corner

**Types from `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/types/hall.ts`:**
```ts
type Wall = "north" | "south" | "east" | "west";
type DoorSpec = { id: string; type: "sectional" | "pvc"; width: number; height: number; wall: Wall; offset: number; };
type WindowSpec = { id: string; width: number; height: number; wall: Wall; offset: number; sillHeight: number; };
```

**Coordinate system:** The hall floor occupies the XZ plane. X ranges 0..10 (width), Z ranges 0..20 (length). Y is vertical. The south wall is at Z = 20, north at Z = 0, west at X = 0, east at X = 10. All 2D architectural elements render at Y = 0.02 to sit slightly above the floor plane.

**Wall thickness (visual):** 0.2m in 2D rendering (double the data value of 0.1m for architectural visibility). Walls extend inward from the hall boundary.

---

## Tests FIRST

### File: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/utils/arcPoints.test.ts`

```ts
import { describe, it, expect } from "vitest";
import {
	computeDoorArc,
	computeWindowLines,
} from "../../src/utils/arcPoints";

describe("computeDoorArc", () => {
	const hallWidth = 10.0;
	const hallLength = 20.0;
	const wallThickness = 0.2;

	it("returns approximately 24 points for a quarter-circle", () => {
		/** The arc should have ~24 points (configurable segments + 1) */
	});

	it("first point is at hinge position", () => {
		/**
		 * For the sectional door (south wall, offset 3.25, width 3.5),
		 * the hinge is at one edge of the door opening.
		 * Verify the first point of the returned arc matches the hinge X,Z.
		 */
	});

	it("last point is at door edge position", () => {
		/**
		 * The last arc point should be at the other edge of the door
		 * opening (the swing endpoint), at radius distance from hinge.
		 */
	});

	it("all points are at radius distance from hinge", () => {
		/**
		 * Every point in the arc should be approximately `door.width`
		 * distance from the hinge point (within floating point tolerance).
		 */
	});

	it("for inward-opening door (PVC), arc swings into the hall", () => {
		/**
		 * PVC doors open inward. The arc Z values should be less than
		 * hallLength (i.e., swinging into the hall interior from the south wall).
		 */
	});

	it("for outward-opening door (sectional), arc swings away from hall", () => {
		/**
		 * Sectional doors open outward. The arc Z values should be greater
		 * than or equal to hallLength (swinging outside the hall).
		 */
	});
});

describe("computeWindowLines", () => {
	const hallWidth = 10.0;
	const hallLength = 20.0;
	const wallThickness = 0.2;

	it("returns glass lines and break ticks for an east wall window", () => {
		/**
		 * For a window on the east wall (X = hallWidth), verify that the
		 * returned object contains two parallel glass line segments and
		 * four break tick segments (two per end).
		 */
	});

	it("returns glass lines and break ticks for a west wall window", () => {
		/**
		 * For a window on the west wall (X = 0), verify the returned
		 * segments are positioned correctly.
		 */
	});

	it("glass lines are parallel and slightly inset from wall edges", () => {
		/**
		 * The two glass lines should run along the window opening,
		 * inset slightly from the outer and inner wall face.
		 */
	});

	it("break ticks are perpendicular to the wall at each end", () => {
		/**
		 * At each end of the window opening, short perpendicular lines
		 * (break ticks) should cross the wall thickness.
		 */
	});
});
```

---

## Implementation Details

### 1. Arc Point Computation Utility

**File:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/utils/arcPoints.ts`

This module exports pure functions for computing geometric points for door arcs and window line symbols. No React or Three.js dependencies -- pure math.

#### `computeDoorArc`

**Signature:**
```ts
export function computeDoorArc(
	door: DoorSpec,
	hallWidth: number,
	hallLength: number,
	wallThickness: number,
	segments?: number,
): { arcPoints: [number, number, number][]; panelLine: [[number, number, number], [number, number, number]] }
```

**Parameters:**
- `door` -- the `DoorSpec` from the hall constants
- `hallWidth`, `hallLength` -- hall dimensions (10, 20)
- `wallThickness` -- visual wall thickness in 2D (0.2)
- `segments` -- number of arc segments, default 24

**Returns:**
- `arcPoints` -- array of ~25 XZ points (at Y=0.02) forming a quarter-circle arc
- `panelLine` -- two-point line from hinge to door edge (the door panel in closed position)

**Logic for south wall doors:**

The south wall runs along Z = `hallLength` (Z=20). Door openings run along X.

For the **sectional door** (offset 3.25, width 3.5):
- The door opening spans X from 3.25 to 6.75 on the south wall
- Hinge is at one end of the opening (say X=3.25, Z=20.0)
- The arc sweeps outward (Z > 20.0) with radius = door.width (3.5m)
- Arc sweeps from angle 0 (along the wall, toward X=6.75) to angle PI/2 (perpendicular, outward from hall)
- Panel line: from hinge (3.25, 0.02, 20.0) to door edge (6.75, 0.02, 20.0)

For the **PVC door** (offset 8.1, width 0.9):
- Opening spans X from 8.1 to 9.0
- Hinge at X=8.1, Z=20.0
- Arc sweeps inward (Z < 20.0, into the hall interior) with radius = 0.9m
- Arc from angle 0 (along wall toward X=9.0) to angle PI/2 (perpendicular, inward)
- Panel line: from hinge (8.1, 0.02, 20.0) to door edge (9.0, 0.02, 20.0)

**Door swing direction rules:**
- `type === "sectional"` -- opens outward (away from hall interior)
- `type === "pvc"` -- opens inward (into hall interior)

For south wall: outward means +Z, inward means -Z.
For north wall: outward means -Z, inward means +Z.
For east wall: outward means +X, inward means -X.
For west wall: outward means -X, inward means +X.

**Arc point generation:** Use parametric circle: for angle from 0 to PI/2, compute point at `hinge + radius * [cos(angle), sin(angle)]` mapped to the appropriate XZ axes based on wall orientation and swing direction. Generate `segments + 1` points evenly spaced.

#### `computeWindowLines`

**Signature:**
```ts
export function computeWindowLines(
	window: WindowSpec,
	hallWidth: number,
	hallLength: number,
	wallThickness: number,
): { glassLines: [[number, number, number], [number, number, number]][]; breakTicks: [[number, number, number], [number, number, number]][] }
```

**Returns:**
- `glassLines` -- two line segments (each a pair of 3D points), representing the two parallel glass panes. These run along the window opening, slightly inset from the outer and inner wall faces.
- `breakTicks` -- four short line segments (perpendicular to the wall), two at each end of the window, marking where the wall is interrupted.

**Logic for east/west wall windows:**

East wall is at X = `hallWidth` (10.0). Windows run along Z axis. For a window at offset 2.0, width 3.0: the opening spans Z from 2.0 to 5.0.

Glass lines:
- Line 1: from (hallWidth - wallThickness * 0.3, 0.02, offset) to (hallWidth - wallThickness * 0.3, 0.02, offset + width) -- inner glass line
- Line 2: from (hallWidth + wallThickness * 0.3, 0.02, offset) to (hallWidth + wallThickness * 0.3, 0.02, offset + width) -- outer glass line (note: wall extends inward, so adjust accordingly)

Actually, since walls extend inward from the boundary, the east wall occupies X from (hallWidth - wallThickness) to hallWidth. So:
- Outer face: X = hallWidth
- Inner face: X = hallWidth - wallThickness (= 9.8)
- Glass line 1 (inner): X = hallWidth - wallThickness * 0.7
- Glass line 2 (outer): X = hallWidth - wallThickness * 0.3

Break ticks at each end of the window opening:
- At Z = offset: short perpendicular line from inner face to outer face
- At Z = offset + width: same

West wall is at X = 0. Wall occupies X from 0 to wallThickness. Similar logic mirrored.

For north/south walls (no windows currently, but for completeness): windows run along X, wall thickness along Z.

---

### 2. DoorSymbol2D Component

**File:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/architectural/DoorSymbol2D.tsx`

**Props:**
```ts
type DoorSymbol2DProps = {
	door: DoorSpec;
	hallWidth: number;
	hallLength: number;
	wallThickness: number;
	uvMode: boolean;
};
```

**Renders:**
1. A `<Line>` for the quarter-circle arc (the swing path), using the points from `computeDoorArc().arcPoints`
2. A `<Line>` for the panel line (the door in closed position), using `computeDoorArc().panelLine`

**Line properties:**
- Arc line: `lineWidth={1.5}`, `worldUnits={false}`
- Panel line: `lineWidth={1.5}`, `worldUnits={false}`
- Planning color: `#555555`
- UV color: `#3A3A6E`

**No meshes** in this component (only Line2), so no `raycast` no-op needed (drei `<Line>` does not participate in raycasting by default).

Memoize the arc point computation with `useMemo` keyed on door spec, hall dimensions, and wall thickness to avoid recalculating every frame.

---

### 3. WindowSymbol2D Component

**File:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/architectural/WindowSymbol2D.tsx`

**Props:**
```ts
type WindowSymbol2DProps = {
	window: WindowSpec;
	hallWidth: number;
	hallLength: number;
	wallThickness: number;
	uvMode: boolean;
};
```

**Renders:**
1. Two `<Line>` elements for the parallel glass lines
2. `<Line>` elements for the break ticks at each end (can be consolidated into one `<Line segments={true}>` call with all four tick pairs)

Alternatively, consolidate all lines (glass + ticks) into a single `<Line segments={true}>` call for fewer draw calls:
- Compute all segment pairs (each a start-end pair)
- Flatten into a single points array with `segments={true}` mode

**Line properties:**
- Glass lines: `lineWidth={1}`, `worldUnits={false}`
- Break ticks: `lineWidth={1}`, `worldUnits={false}`
- Planning color: `#6699CC`
- UV color: `#3300AA`

Memoize all point computations with `useMemo`.

---

### 4. ArchitecturalOpenings2D Component

**File:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/architectural/ArchitecturalOpenings2D.tsx`

This is the main aggregator. It reads hall data from the Zustand store and renders a `DoorSymbol2D` for each door and a `WindowSymbol2D` for each window.

**Signature:**
```ts
export function ArchitecturalOpenings2D(): JSX.Element | null
```

**Implementation outline:**
```ts
export function ArchitecturalOpenings2D() {
	const { doors, windows, width, length } = useStore((s) => s.hall);
	const uvMode = useStore((s) => s.ui.uvMode);
	const wallThickness = 0.2; // Visual wall thickness for 2D rendering

	return (
		<group>
			{doors.map((door) => (
				<DoorSymbol2D
					key={door.id}
					door={door}
					hallWidth={width}
					hallLength={length}
					wallThickness={wallThickness}
					uvMode={uvMode}
				/>
			))}
			{windows.map((win) => (
				<WindowSymbol2D
					key={win.id}
					window={win}
					hallWidth={width}
					hallLength={length}
					wallThickness={wallThickness}
					uvMode={uvMode}
				/>
			))}
		</group>
	);
}
```

**Layer integration:** This component should respect `layers.walls.visible` (door/window symbols are part of the wall layer). Wrap the group with a visibility check:
```ts
const wallsVisible = useStore((s) => s.ui.layers.walls?.visible ?? true);
if (!wallsVisible) return null;
```

---

### 5. Mount in ArchitecturalFloorPlan

**File to modify:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/architectural/ArchitecturalFloorPlan.tsx`

This file is created in Section 02 and serves as the 2D-only wrapper. Add `<ArchitecturalOpenings2D />` as a child alongside `<ArchitecturalWalls2D />` (from Section 03):

```tsx
// Inside ArchitecturalFloorPlan (which already gates on viewport === "2d")
<group>
	<ArchitecturalWalls2D />    {/* Section 03 */}
	<ArchitecturalOpenings2D /> {/* This section */}
	{/* Future: ArchitecturalGrid2D, HoleFelt2D */}
</group>
```

---

## Color Reference

| Element | Planning Mode | UV Mode |
|---------|--------------|---------|
| Door arc + panel line | `#555555` | `#3A3A6E` |
| Window glass + break ticks | `#6699CC` | `#3300AA` |

---

## Performance Notes

- Door symbols: 2 doors x (1 arc Line + 1 panel Line) = 4 Line objects
- Window symbols: 4 windows x 1 consolidated Line (segments mode) = 4 Line objects (or up to 12 if not consolidated)
- **Total: ~4-8 new Line objects** in the 2D viewport. Well within budget.
- All computations are `useMemo`-cached. No per-frame work.
- drei `<Line>` uses `Line2` (LineSegments2/LineMaterial) which does not participate in raycasting, so no explicit `raycast` no-op is needed on these components.

---

## LOD Integration (Section 08 Dependency)

When the LOD system (Section 08) is implemented, door arcs and window symbols should be hidden at the `"overview"` zoom level (camera.zoom < 15) and visible at `"standard"` and `"detail"` levels. Until Section 08 is implemented, always render the symbols. The LOD gating will be a simple conditional:

```ts
const lod = useZoomLOD();
if (lod === "overview") return null;
```

This can be added to `ArchitecturalOpenings2D` or to each individual symbol component. Adding it to the parent `ArchitecturalOpenings2D` is simpler and avoids the overhead of individual hooks.

---

## TODO Checklist

1. Write tests in `tests/utils/arcPoints.test.ts` (see test stubs above)
2. Implement `src/utils/arcPoints.ts` with `computeDoorArc` and `computeWindowLines`
3. Run tests -- verify all pass
4. Create `src/components/three/architectural/DoorSymbol2D.tsx`
5. Create `src/components/three/architectural/WindowSymbol2D.tsx`
6. Create `src/components/three/architectural/ArchitecturalOpenings2D.tsx`
7. Mount `<ArchitecturalOpenings2D />` in `ArchitecturalFloorPlan.tsx`
8. Verify `npx tsc --noEmit` passes
9. Visual check: door arcs visible on south wall, window symbols on east/west walls in the 2D pane
10. Verify symbols do not appear in the 3D pane

---

## Implementation Notes

**Implemented by:** deep-implement session, 2026-02-22

**Files created:**
- `src/utils/arcPoints.ts` — pure functions: `computeDoorArc` (quarter-circle swing arcs), `computeWindowLines` (glass lines + break ticks)
- `src/components/three/architectural/DoorSymbol2D.tsx` — door swing arc + panel line
- `src/components/three/architectural/WindowSymbol2D.tsx` — consolidated glass lines + break ticks in single Line segments call
- `src/components/three/architectural/ArchitecturalOpenings2D.tsx` — aggregator component
- `tests/utils/arcPoints.test.ts` — 12 unit tests

**Files modified:**
- `src/components/three/architectural/ArchitecturalFloorPlan.tsx` — mounted `<ArchitecturalOpenings2D />`
- `src/utils/wallGeometry.ts` — extracted shared `ARCH_WALL_THICKNESS` constant
- `src/components/three/architectural/ArchitecturalWalls2D.tsx` — imports shared constant

**Deviations from plan:**
- Removed `wallThickness` parameter from `computeDoorArc` (was unused — door arcs don't need wall thickness)
- Extracted `ARCH_WALL_THICKNESS = 0.2` to `wallGeometry.ts` as shared constant (was duplicated in 3 files)
- 2 break ticks per window (not 4 as plan suggested) — standard architectural notation uses 1 per end
- No layer opacity support for Line materials (architectural limitation of useGroupOpacity which only handles Mesh materials)

**Test count:** 12 tests (7 computeDoorArc + 5 computeWindowLines), all passing