# Section 3: Architectural Wall Geometry

**Status: IMPLEMENTED**

## Overview

This section implements the 2D architectural wall rendering system. The hall's four walls are rendered as solid-fill thick rectangles with crisp outlines in the 2D viewport pane. Walls have gaps where doors and windows exist, producing multiple wall segments per side.

**User-Visible Outcome:** In the 2D pane, the thin 3D box-geometry walls are replaced by thick, dark-filled wall rectangles with clear outlines. Gaps appear at door and window positions. The result looks like a professional architectural floor plan.

**Dependencies:**
- Section 02 (Viewport-Aware SharedScene) must be complete. The `useViewportId()` hook must exist and `Hall.tsx` must already conditionally skip `<HallWalls>` in the 2D viewport.

---

## Tests First

All tests go in `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/utils/wallGeometry.test.ts`. Write these before implementation.

### Test File: `tests/utils/wallGeometry.test.ts`

```ts
import { describe, expect, it } from "vitest";
import {
	computeWallSegments,
	wallSegmentToRect,
} from "../../src/utils/wallGeometry";

describe("computeWallSegments", () => {
	const hallWidth = 10.0;
	const hallLength = 20.0;

	const doors = [
		{ id: "door-sectional", type: "sectional" as const, width: 3.5, height: 3.5, wall: "south" as const, offset: 3.25 },
		{ id: "door-pvc", type: "pvc" as const, width: 0.9, height: 2.0, wall: "south" as const, offset: 8.1 },
	];

	const windows = [
		{ id: "window-1", width: 3.0, height: 1.1, wall: "east" as const, offset: 2.0, sillHeight: 1.5 },
		{ id: "window-2", width: 3.0, height: 1.1, wall: "east" as const, offset: 10.0, sillHeight: 1.5 },
		{ id: "window-3", width: 3.0, height: 1.1, wall: "west" as const, offset: 2.0, sillHeight: 1.5 },
		{ id: "window-4", width: 3.0, height: 1.1, wall: "west" as const, offset: 10.0, sillHeight: 1.5 },
	];

	it("south wall with 2 doors returns 3 segments", () => {
		const segments = computeWallSegments("south", hallWidth, hallLength, doors, windows);
		expect(segments).toEqual([
			{ start: 0, end: 3.25 },
			{ start: 6.75, end: 8.1 },
			{ start: 9.0, end: 10.0 },
		]);
	});

	it("east wall with 2 windows returns 3 segments", () => {
		const segments = computeWallSegments("east", hallWidth, hallLength, doors, windows);
		expect(segments).toEqual([
			{ start: 0, end: 2.0 },
			{ start: 5.0, end: 10.0 },
			{ start: 13.0, end: 20.0 },
		]);
	});

	it("north wall with no openings returns 1 full-length segment", () => {
		const segments = computeWallSegments("north", hallWidth, hallLength, doors, windows);
		expect(segments).toEqual([{ start: 0, end: 10.0 }]);
	});

	it("west wall with 2 windows returns 3 segments", () => {
		const segments = computeWallSegments("west", hallWidth, hallLength, doors, windows);
		expect(segments).toEqual([
			{ start: 0, end: 2.0 },
			{ start: 5.0, end: 10.0 },
			{ start: 13.0, end: 20.0 },
		]);
	});

	it("handles overlapping doors/windows by merging gaps", () => {
		const overlappingDoors = [
			{ id: "d1", type: "pvc" as const, width: 3.0, height: 2.0, wall: "south" as const, offset: 2.0 },
			{ id: "d2", type: "pvc" as const, width: 3.0, height: 2.0, wall: "south" as const, offset: 4.0 },
		];
		const segments = computeWallSegments("south", hallWidth, hallLength, overlappingDoors, []);
		// Gaps: [2,5] and [4,7] overlap => merged gap [2,7]
		// Segments: [0,2] and [7,10]
		expect(segments).toEqual([
			{ start: 0, end: 2.0 },
			{ start: 7.0, end: 10.0 },
		]);
	});

	it("handles opening at wall start (offset 0)", () => {
		const edgeDoor = [
			{ id: "d-edge", type: "pvc" as const, width: 2.0, height: 2.0, wall: "south" as const, offset: 0 },
		];
		const segments = computeWallSegments("south", hallWidth, hallLength, edgeDoor, []);
		// Gap: [0, 2] => segment: [2, 10]
		expect(segments).toEqual([{ start: 2.0, end: 10.0 }]);
	});

	it("handles opening at wall end", () => {
		const edgeDoor = [
			{ id: "d-edge", type: "pvc" as const, width: 2.0, height: 2.0, wall: "south" as const, offset: 8.0 },
		];
		const segments = computeWallSegments("south", hallWidth, hallLength, edgeDoor, []);
		// Gap: [8, 10] => segment: [0, 8]
		expect(segments).toEqual([{ start: 0, end: 8.0 }]);
	});
});

describe("wallSegmentToRect", () => {
	const thickness = 0.2;
	const hallWidth = 10.0;
	const hallLength = 20.0;

	it("south wall segment returns correct position and size", () => {
		const segment = { start: 0, end: 3.25 };
		const rect = wallSegmentToRect(segment, "south", thickness, hallWidth, hallLength);
		// South wall is at z=hallLength, extends inward (toward z=hallLength - thickness)
		// X runs from segment.start to segment.end
		expect(rect.size[0]).toBeCloseTo(3.25); // width along X
		expect(rect.size[1]).toBeCloseTo(thickness); // depth along Z
		// Position is center of the rectangle
		expect(rect.position[0]).toBeCloseTo(3.25 / 2); // center X
		expect(rect.position[1]).toBeCloseTo(0.02); // Y slightly above floor
		expect(rect.position[2]).toBeCloseTo(hallLength - thickness / 2); // center Z
	});

	it("east wall segment returns correct position and size (rotated axis)", () => {
		const segment = { start: 0, end: 2.0 };
		const rect = wallSegmentToRect(segment, "east", thickness, hallWidth, hallLength);
		// East wall is at x=hallWidth, extends inward (toward x=hallWidth - thickness)
		// Z runs from segment.start to segment.end
		expect(rect.size[0]).toBeCloseTo(thickness); // width along X
		expect(rect.size[1]).toBeCloseTo(2.0); // depth along Z
		expect(rect.position[0]).toBeCloseTo(hallWidth - thickness / 2); // center X
		expect(rect.position[1]).toBeCloseTo(0.02); // Y
		expect(rect.position[2]).toBeCloseTo(1.0); // center Z
	});

	it("north wall segment returns correct position and size", () => {
		const segment = { start: 0, end: 10.0 };
		const rect = wallSegmentToRect(segment, "north", thickness, hallWidth, hallLength);
		expect(rect.size[0]).toBeCloseTo(10.0);
		expect(rect.size[1]).toBeCloseTo(thickness);
		expect(rect.position[0]).toBeCloseTo(5.0);
		expect(rect.position[1]).toBeCloseTo(0.02);
		expect(rect.position[2]).toBeCloseTo(thickness / 2);
	});

	it("west wall segment returns correct position and size", () => {
		const segment = { start: 5.0, end: 10.0 };
		const rect = wallSegmentToRect(segment, "west", thickness, hallWidth, hallLength);
		expect(rect.size[0]).toBeCloseTo(thickness);
		expect(rect.size[1]).toBeCloseTo(5.0);
		expect(rect.position[0]).toBeCloseTo(thickness / 2);
		expect(rect.position[1]).toBeCloseTo(0.02);
		expect(rect.position[2]).toBeCloseTo(7.5);
	});
});
```

---

## Implementation

### File 1: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/utils/wallGeometry.ts`

Pure utility functions with no React or Three.js dependencies. These compute wall segment positions after subtracting door and window openings.

**Types needed:**

```ts
import type { DoorSpec, Wall, WindowSpec } from "../types/hall";

export type WallSegment = {
	start: number;
	end: number;
};

export type WallRect = {
	position: [number, number, number]; // center [x, y, z]
	size: [number, number]; // [widthAlongPrimary, depthAlongSecondary]
};
```

**`computeWallSegments` function:**

Signature:

```ts
export function computeWallSegments(
	wallSide: Wall,
	hallWidth: number,
	hallLength: number,
	doors: DoorSpec[],
	windows: WindowSpec[],
): WallSegment[]
```

Logic:
1. Determine the wall's total length: north/south walls span `hallWidth` (10m), east/west walls span `hallLength` (20m).
2. Filter `doors` and `windows` to only those on the given `wallSide`.
3. For each opening, compute the gap interval: `[offset, offset + width]`.
4. Merge overlapping gaps (sort by start, then iterate and merge if next.start <= current.end).
5. Subtract merged gaps from `[0, wallLength]` to produce solid wall segments.
6. Filter out any zero-length segments.

**`wallSegmentToRect` function:**

Signature:

```ts
export function wallSegmentToRect(
	segment: WallSegment,
	wallSide: Wall,
	thickness: number,
	hallWidth: number,
	hallLength: number,
): WallRect
```

Logic by wall side:
- **North (z=0):** Rectangle spans X from `segment.start` to `segment.end`, Z from `0` to `thickness`. Center position: `[(start+end)/2, 0.02, thickness/2]`. Size: `[end-start, thickness]`.
- **South (z=hallLength):** Rectangle spans X from `segment.start` to `segment.end`, Z from `hallLength - thickness` to `hallLength`. Center: `[(start+end)/2, 0.02, hallLength - thickness/2]`. Size: `[end-start, thickness]`.
- **West (x=0):** Rectangle spans Z from `segment.start` to `segment.end`, X from `0` to `thickness`. Center: `[thickness/2, 0.02, (start+end)/2]`. Size: `[thickness, end-start]`.
- **East (x=hallWidth):** Rectangle spans Z from `segment.start` to `segment.end`, X from `hallWidth - thickness` to `hallWidth`. Center: `[hallWidth - thickness/2, 0.02, (start+end)/2]`. Size: `[thickness, end-start]`.

The Y value `0.02` places walls slightly above the floor plane to avoid Z-fighting.

---

### File 2: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/architectural/ArchitecturalWalls2D.tsx`

R3F component that renders 2D architectural walls in the orthographic viewport.

**Props:** None (reads hall data from the Zustand store).

**Behavior:**

1. Read `hall` (dimensions, doors, windows) and `ui.layers.walls` and `ui.uvMode` from the store.
2. If `layers.walls.visible` is false, return null.
3. Use `computeWallSegments` for each of the four wall sides (north, south, east, west) to get all wall segments.
4. Use `wallSegmentToRect` to convert each segment to a positioned rectangle.
5. Render each rectangle as:
   - A `<mesh>` with `<planeGeometry>` for the solid fill, rotated to lie in the XZ plane (rotation `[-Math.PI / 2, 0, 0]`), using `MeshBasicMaterial` with the fill color.
   - Set `raycast` to no-op on every mesh: `raycast={() => {}}`.
6. Batch all wall outlines into a single `<Line segments={true}>` call for performance.
7. Apply layer opacity via `useGroupOpacity` on the wrapping `<group>`.

**Colors:**
- Planning mode: fill `#3a3a3a`, outline `#222222`
- UV mode: fill `#1A1A2E`, outline `#2A2A5E`

**Line batching strategy:**

For each wall segment rectangle, compute 4 corner points (in 3D coords on the XZ plane at Y=0.02). To create a closed outline, produce 4 line segments (pairs of points): [p0,p1], [p1,p2], [p2,p3], [p3,p0]. Concatenate all segment pairs from all wall rectangles into a single flat array of `[x,y,z]` points and pass to `<Line segments={true} points={allPoints} ...>`. This renders all outlines in one draw call.

Line properties: `lineWidth={2}`, `worldUnits={false}`, `color` set per UV mode.

**Mesh geometry note:**

`<planeGeometry>` creates a plane in XY by default. To lay it flat in the XZ plane, apply `rotation={[-Math.PI/2, 0, 0]}` to the parent mesh. The `args` for `planeGeometry` are `[width, height]` where width maps to the rect's primary dimension and height maps to the secondary dimension.

**Component structure sketch:**

```tsx
export function ArchitecturalWalls2D() {
	/** Reads hall dimensions, doors, windows from store */
	/** Reads uvMode, layers.walls from store */
	/** Computes wall segments for all 4 sides */
	/** Computes rects and outline points */
	/** Returns <group> with fill meshes + batched <Line> */
}
```

The component uses `useMemo` to recompute segments and rects only when hall data changes (which is essentially never at runtime since hall dimensions are constant, but this keeps it correct).

---

### File 3: Mounting in SharedScene

Section 02 creates `ArchitecturalFloorPlan.tsx` which is the 2D-viewport-gated wrapper added to `SharedScene`. This section's `ArchitecturalWalls2D` is rendered inside that wrapper.

The component hierarchy is:
```
SharedScene
  ├── Hall (viewport-aware: skips HallWalls in 2D)
  ├── ArchitecturalFloorPlan (only renders in 2D viewport)
  │     └── ArchitecturalWalls2D  ← THIS SECTION
  │     └── ArchitecturalOpenings2D  (section 04)
  │     └── ArchitecturalGrid2D  (section 06)
  │     └── HoleFelt2D  (section 07)
  ├── PlacedHoles
  ├── FlowPath
  ├── FloorGrid (viewport-aware: skips drei Grid in 2D)
  └── SunIndicator
```

**Modification to `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/architectural/ArchitecturalFloorPlan.tsx`:**

Import and render `<ArchitecturalWalls2D />` inside the existing `ArchitecturalFloorPlan` wrapper (which already gates on `useViewportId() === "2d"`).

---

## Key Implementation Details

### Wall Segment Computation Algorithm

The core algorithm in `computeWallSegments`:

1. Determine wall total length:
   - North/South: `hallWidth` (10m)
   - East/West: `hallLength` (20m)

2. Collect all openings on this wall:
   ```
   gaps = []
   for each door where door.wall === wallSide:
       gaps.push({ start: door.offset, end: door.offset + door.width })
   for each window where window.wall === wallSide:
       gaps.push({ start: window.offset, end: window.offset + window.width })
   ```

3. Sort gaps by start position, then merge overlapping:
   ```
   sort gaps by .start ascending
   merged = [gaps[0]]
   for i = 1..n:
       if gaps[i].start <= merged.last.end:
           merged.last.end = max(merged.last.end, gaps[i].end)
       else:
           merged.push(gaps[i])
   ```

4. Subtract gaps from the full wall to get solid segments:
   ```
   segments = []
   cursor = 0
   for each gap in merged:
       if cursor < gap.start:
           segments.push({ start: cursor, end: gap.start })
       cursor = gap.end
   if cursor < wallLength:
       segments.push({ start: cursor, end: wallLength })
   ```

### Visual Wall Thickness

The data model specifies `wallThickness: 0.1m` but the plan calls for rendering at `0.2m` visual thickness in the 2D pane for architectural visibility. Use a constant `ARCH_WALL_THICKNESS = 0.2` in the component or utility, separate from the hall data's `wallThickness`.

### Outline Point Computation for Batched Rendering

For a rectangle with center `[cx, cy, cz]` and size `[w, d]`:

For north/south walls (width along X, depth along Z):
- p0 = `[cx - w/2, cy, cz - d/2]`
- p1 = `[cx + w/2, cy, cz - d/2]`
- p2 = `[cx + w/2, cy, cz + d/2]`
- p3 = `[cx - w/2, cy, cz + d/2]`

For east/west walls (width along X = thickness, depth along Z = segment length):
- Same formula applies since `size` already encodes the correct axis mapping.

The `segments={true}` mode in drei `<Line>` interprets the points array as pairs: `[p0,p1, p2,p3, p4,p5, ...]` where each consecutive pair draws a line segment. So for a closed rectangle you need 8 points (4 segment pairs): `[p0,p1, p1,p2, p2,p3, p3,p0]`.

### Performance Characteristics

At the standard BORGA hall configuration:
- 4 walls with 2 doors (south) and 4 windows (2 east, 2 west) produce approximately 12 solid segments total.
- 12 fill meshes (planes) + 1 batched Line object = 13 draw objects.
- This is well within the performance budget of ~76-94 total objects for all 2D architectural elements.

### Mobile Fallback

When `useViewportId()` returns `null` (mobile mode, no `ViewportContext`), `ArchitecturalFloorPlan` should render a simplified version. For walls, this means outline-only (no fill meshes) to keep mobile rendering lightweight. This is handled at the `ArchitecturalFloorPlan` wrapper level from Section 02, but `ArchitecturalWalls2D` should accept an optional `outlineOnly` prop that, when true, skips the fill meshes and only renders the batched outline lines.

### drei `<Line>` Import

```ts
import { Line } from "@react-three/drei";
```

The `<Line>` component from drei wraps Three.js `Line2` (fat lines). Key props used:
- `points`: array of `[x, y, z]` tuples
- `segments`: boolean, when true treats points as segment pairs
- `lineWidth`: screen-space width in pixels (when `worldUnits={false}`)
- `worldUnits`: set to `false` so line width is constant regardless of zoom
- `color`: hex color string

---

## Checklist

1. Write tests in `tests/utils/wallGeometry.test.ts` (all tests from the Tests First section above).
2. Create `src/utils/wallGeometry.ts` with `computeWallSegments` and `wallSegmentToRect` functions.
3. Run tests, verify all pass.
4. Create `src/components/three/architectural/ArchitecturalWalls2D.tsx` component.
5. Mount `<ArchitecturalWalls2D />` inside `ArchitecturalFloorPlan.tsx` (from Section 02).
6. Verify TypeScript compiles (`npx tsc --noEmit`).
7. Visually verify in the browser: thick dark walls visible in the 2D pane with gaps at door/window positions.
8. Verify walls do NOT appear in the 3D pane.
9. Verify UV mode colors switch correctly.
10. Verify layer toggle (`layers.walls.visible = false`) hides architectural walls.

---

## Implementation Notes

**Implemented by:** deep-implement session, 2026-02-22

**Files created:**
- `src/utils/wallGeometry.ts` — pure utility with `computeWallSegments` and `wallSegmentToRect`
- `src/components/three/architectural/ArchitecturalWalls2D.tsx` — R3F component
- `tests/utils/wallGeometry.test.ts` — 11 unit tests

**Files modified:**
- `src/components/three/architectural/ArchitecturalFloorPlan.tsx` — mounted `<ArchitecturalWalls2D />`

**Deviations from plan:**
- Removed unused `wallSide` field from internal rects array (code review cleanup — the field was computed but never consumed in the component's render)
- No other deviations; implementation matches plan exactly

**Test count:** 11 tests (7 `computeWallSegments` + 4 `wallSegmentToRect`), all passing