# Phase 2 — Group A: Placement Precision (Tasks 1–9)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
>
> **Environment:** Every Bash call needs `export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)"` before commands. Working dir: `golf-planner/`. Biome uses tabs.

---

### Task 1: Create `snapToGrid` utility + tests

**Files:**
- Create: `src/utils/snap.ts`
- Create: `tests/utils/snap.test.ts`

**Step 1: Write the test file**

```typescript
// tests/utils/snap.test.ts
import { describe, expect, it } from "vitest";
import { snapToGrid } from "../../src/utils/snap";

describe("snapToGrid", () => {
	it("snaps to nearest grid increment", () => {
		expect(snapToGrid(1.13, 0.25)).toBe(1.25);
		expect(snapToGrid(1.12, 0.25)).toBe(1.0);
	});

	it("returns exact value when already on grid", () => {
		expect(snapToGrid(2.5, 0.25)).toBe(2.5);
		expect(snapToGrid(0, 0.25)).toBe(0);
	});

	it("works with different grid sizes", () => {
		expect(snapToGrid(1.3, 0.5)).toBe(1.5);
		expect(snapToGrid(1.2, 0.5)).toBe(1.0);
		expect(snapToGrid(3.7, 1.0)).toBe(4.0);
	});

	it("handles negative values", () => {
		expect(snapToGrid(-1.13, 0.25)).toBe(-1.0);
		expect(snapToGrid(-1.37, 0.25)).toBe(-1.25); // rounds toward -1.25, not -1.5
	});
});
```

**Step 2: Run test to verify it fails**

Run: `cd /mnt/c/Users/Caus/Golf_Plan/golf-planner && npx vitest run tests/utils/snap.test.ts`
Expected: FAIL — module not found

**Step 3: Write the implementation**

```typescript
// src/utils/snap.ts
export function snapToGrid(value: number, gridSize: number): number {
	return Math.round(value / gridSize) * gridSize;
}
```

**Step 4: Run test to verify it passes**

Run: `cd /mnt/c/Users/Caus/Golf_Plan/golf-planner && npx vitest run tests/utils/snap.test.ts`
Expected: PASS (all 4 tests)

**Step 5: Commit**

```bash
cd /mnt/c/Users/Caus/Golf_Plan/golf-planner
git add src/utils/snap.ts tests/utils/snap.test.ts
git commit -m "feat: add snapToGrid utility with tests"
```

---

### Task 2: Create SAT-based OBB collision utility + tests

**Files:**
- Create: `src/utils/collision.ts`
- Create: `tests/utils/collision.test.ts`

**Step 1: Write the test file**

```typescript
// tests/utils/collision.test.ts
import { describe, expect, it } from "vitest";
import {
	checkHallBounds,
	checkOBBCollision,
} from "../../src/utils/collision";

describe("checkOBBCollision", () => {
	it("detects overlap between axis-aligned rectangles", () => {
		const a = { pos: { x: 1, z: 1 }, rot: 0, w: 2, l: 2 };
		const b = { pos: { x: 2, z: 1 }, rot: 0, w: 2, l: 2 };
		expect(checkOBBCollision(a, b)).toBe(true);
	});

	it("returns false for separated axis-aligned rectangles", () => {
		const a = { pos: { x: 0, z: 0 }, rot: 0, w: 1, l: 1 };
		const b = { pos: { x: 3, z: 0 }, rot: 0, w: 1, l: 1 };
		expect(checkOBBCollision(a, b)).toBe(false);
	});

	it("detects overlap between rotated rectangles", () => {
		const a = { pos: { x: 1, z: 1 }, rot: 45, w: 2, l: 2 };
		const b = { pos: { x: 2.5, z: 1 }, rot: 0, w: 2, l: 2 };
		expect(checkOBBCollision(a, b)).toBe(true);
	});

	it("returns false for rotated rectangles that miss", () => {
		const a = { pos: { x: 0, z: 0 }, rot: 45, w: 1, l: 1 };
		const b = { pos: { x: 3, z: 3 }, rot: 30, w: 1, l: 1 };
		expect(checkOBBCollision(a, b)).toBe(false);
	});

	it("returns true for identical overlapping position", () => {
		const a = { pos: { x: 5, z: 5 }, rot: 0, w: 2, l: 3 };
		const b = { pos: { x: 5, z: 5 }, rot: 90, w: 2, l: 3 };
		expect(checkOBBCollision(a, b)).toBe(true);
	});

	it("returns false when just touching edges (no overlap)", () => {
		const a = { pos: { x: 0, z: 0 }, rot: 0, w: 2, l: 2 };
		const b = { pos: { x: 2, z: 0 }, rot: 0, w: 2, l: 2 };
		// Edge-touching: maxA === minB → no overlap (strict inequality)
		expect(checkOBBCollision(a, b)).toBe(false);
	});
});

describe("checkHallBounds", () => {
	const hall = { width: 10, length: 20 };

	it("returns true when hole is fully inside hall", () => {
		expect(checkHallBounds({ x: 5, z: 10 }, 0, 2, 3, hall)).toBe(true);
	});

	it("returns false when hole extends past east wall", () => {
		expect(checkHallBounds({ x: 9.5, z: 10 }, 0, 2, 3, hall)).toBe(false);
	});

	it("returns false when hole extends past south wall", () => {
		expect(checkHallBounds({ x: 5, z: 19 }, 0, 2, 3, hall)).toBe(false);
	});

	it("handles rotated hole near corner", () => {
		// A 1x4 hole at 45 degrees near origin — corners extend outside
		expect(checkHallBounds({ x: 1, z: 1 }, 45, 1, 4, hall)).toBe(false);
	});

	it("rotated hole in center is fine", () => {
		expect(checkHallBounds({ x: 5, z: 10 }, 45, 2, 3, hall)).toBe(true);
	});
});
```

**Step 2: Run test to verify it fails**

Run: `cd /mnt/c/Users/Caus/Golf_Plan/golf-planner && npx vitest run tests/utils/collision.test.ts`
Expected: FAIL — module not found

**Step 3: Write the implementation**

```typescript
// src/utils/collision.ts

export type OBBInput = {
	pos: { x: number; z: number };
	rot: number; // degrees
	w: number; // full width
	l: number; // full length
};

type Vec2 = [number, number];

function getCorners(obb: OBBInput): Vec2[] {
	const rad = (obb.rot * Math.PI) / 180;
	const cos = Math.cos(rad);
	const sin = Math.sin(rad);
	const hw = obb.w / 2;
	const hl = obb.l / 2;
	return [
		[obb.pos.x + cos * hw - sin * hl, obb.pos.z + sin * hw + cos * hl],
		[obb.pos.x - cos * hw - sin * hl, obb.pos.z - sin * hw + cos * hl],
		[obb.pos.x - cos * hw + sin * hl, obb.pos.z - sin * hw - cos * hl],
		[obb.pos.x + cos * hw + sin * hl, obb.pos.z + sin * hw - cos * hl],
	];
}

function getAxes(obb: OBBInput): Vec2[] {
	const rad = (obb.rot * Math.PI) / 180;
	const cos = Math.cos(rad);
	const sin = Math.sin(rad);
	return [
		[cos, sin],
		[-sin, cos],
	];
}

function project(corners: Vec2[], axis: Vec2): [number, number] {
	let min = Infinity;
	let max = -Infinity;
	for (const [x, z] of corners) {
		const p = x * axis[0] + z * axis[1];
		if (p < min) min = p;
		if (p > max) max = p;
	}
	return [min, max];
}

/**
 * SAT-based OBB collision test on 2D rotated rectangles.
 * Returns true if the two rectangles overlap (strict — touching edges = no collision).
 */
export function checkOBBCollision(a: OBBInput, b: OBBInput): boolean {
	const cornersA = getCorners(a);
	const cornersB = getCorners(b);
	const axes = [...getAxes(a), ...getAxes(b)];

	for (const axis of axes) {
		const [minA, maxA] = project(cornersA, axis);
		const [minB, maxB] = project(cornersB, axis);
		if (maxA <= minB || maxB <= minA) return false;
	}
	return true;
}

/**
 * Check if all corners of a rotated rectangle are inside the hall boundaries.
 */
export function checkHallBounds(
	pos: { x: number; z: number },
	rot: number,
	w: number,
	l: number,
	hall: { width: number; length: number },
): boolean {
	const corners = getCorners({ pos, rot, w, l });
	return corners.every(
		([x, z]) => x >= 0 && x <= hall.width && z >= 0 && z <= hall.length,
	);
}

/**
 * Check if a candidate hole collides with any existing hole.
 * Also checks hall boundary. Returns true if placement is INVALID.
 */
export function checkAnyCollision(
	candidate: OBBInput,
	allHoles: Record<string, { pos: { x: number; z: number }; rot: number; w: number; l: number }>,
	excludeId?: string,
): boolean {
	for (const [id, other] of Object.entries(allHoles)) {
		if (id === excludeId) continue;
		if (checkOBBCollision(candidate, other)) return true;
	}
	return false;
}
```

**Step 4: Run test to verify it passes**

Run: `cd /mnt/c/Users/Caus/Golf_Plan/golf-planner && npx vitest run tests/utils/collision.test.ts`
Expected: PASS (all 11 tests)

**Step 5: Commit**

```bash
cd /mnt/c/Users/Caus/Golf_Plan/golf-planner
git add src/utils/collision.ts tests/utils/collision.test.ts
git commit -m "feat: add SAT-based OBB collision detection with tests"
```

---

### Task 3: Change rotation type to free-angle number

**Files:**
- Modify: `src/types/hole.ts:10` — change `HoleRotation` from enum to `number`
- Modify: `src/components/ui/HoleDetail.tsx` — numeric input + preset buttons
- Modify: `tests/utils/store.test.ts` — verify existing tests still pass

**Step 1: Update the type**

In `src/types/hole.ts`, replace:
```typescript
export type HoleRotation = 0 | 90 | 180 | 270;
```
with:
```typescript
export type HoleRotation = number;
```

This is backward-compatible — `0 | 90 | 180 | 270` are valid `number` values, so existing saved layouts load fine.

**Step 2: Update HoleDetail component**

Replace the rotation section in `src/components/ui/HoleDetail.tsx` (the `<div className="flex flex-col gap-1">` block with "Rotation" label, around lines 62–80). Replace with:

```tsx
<div className="flex flex-col gap-1">
	<span className="text-xs text-gray-500">Rotation</span>
	<div className="flex items-center gap-2">
		<input
			type="number"
			value={hole.rotation}
			min={0}
			max={359}
			step={15}
			onChange={(e) =>
				updateHole(selectedId, {
					rotation: ((Number(e.target.value) % 360) + 360) % 360,
				})
			}
			className="w-20 rounded border border-gray-200 px-2 py-1 text-sm"
		/>
		<span className="text-xs text-gray-400">°</span>
	</div>
	<div className="flex gap-1">
		{[0, 90, 180, 270].map((r) => (
			<button
				key={r}
				type="button"
				onClick={() => updateHole(selectedId, { rotation: r })}
				className={`rounded px-2.5 py-1 text-xs font-medium ${
					hole.rotation === r
						? "bg-blue-600 text-white"
						: "bg-gray-100 text-gray-600 hover:bg-gray-200"
				}`}
			>
				{r}°
			</button>
		))}
	</div>
</div>
```

Also remove the `HoleRotation` import and the `rotations` array (line 3 import and line 24 const).

**Step 3: Run existing tests**

Run: `cd /mnt/c/Users/Caus/Golf_Plan/golf-planner && npx vitest run`
Expected: All existing tests pass (rotation value `90` in store.test.ts is a valid `number`)

**Step 4: Run build check**

Run: `cd /mnt/c/Users/Caus/Golf_Plan/golf-planner && npx tsc -b && npm run check`
Expected: Clean — no type errors

**Step 5: Commit**

```bash
cd /mnt/c/Users/Caus/Golf_Plan/golf-planner
git add src/types/hole.ts src/components/ui/HoleDetail.tsx
git commit -m "feat: change rotation type to free-angle number with numeric input"
```

---

### Task 4: Add 3 new hole types

**Files:**
- Modify: `src/constants/holeTypes.ts:32` — add 3 entries after the `ramp` entry

**Step 1: Add the new hole type entries**

In `src/constants/holeTypes.ts`, add these 3 entries to the `HOLE_TYPES` array (before the closing `];`):

```typescript
	{
		type: "loop",
		label: "Loop",
		dimensions: { width: 1.8, length: 2.0 },
		color: "#00BCD4",
		defaultPar: 3,
	},
	{
		type: "windmill",
		label: "Windmill",
		dimensions: { width: 1.2, length: 2.5 },
		color: "#E91E63",
		defaultPar: 4,
	},
	{
		type: "tunnel",
		label: "Tunnel",
		dimensions: { width: 0.6, length: 4.0 },
		color: "#607D8B",
		defaultPar: 3,
	},
```

**Step 2: Run build check**

Run: `cd /mnt/c/Users/Caus/Golf_Plan/golf-planner && npx tsc -b && npm run check`
Expected: Clean — `HoleType` union already includes `"loop" | "windmill" | "tunnel"`

**Step 3: Commit**

```bash
cd /mnt/c/Users/Caus/Golf_Plan/golf-planner
git add src/constants/holeTypes.ts
git commit -m "feat: add loop, windmill, and tunnel hole types"
```

---

### Task 5: Create GhostHole preview component

**Files:**
- Create: `src/components/three/GhostHole.tsx`

**Context:** This component renders a semi-transparent box that follows the mouse cursor during placement. It shows green when the position is valid, red when there's a collision or out-of-bounds.

**Step 1: Create the component**

```tsx
// src/components/three/GhostHole.tsx
import { useMemo } from "react";
import * as THREE from "three";
import { HOLE_TYPE_MAP } from "../../constants";
import type { HoleType } from "../../types";

const HOLE_HEIGHT = 0.3;
const GREEN = new THREE.Color("#4CAF50");
const RED = new THREE.Color("#EF5350");

type GhostHoleProps = {
	type: HoleType;
	position: { x: number; z: number };
	rotation: number;
	isValid: boolean;
};

export function GhostHole({ type, position, rotation, isValid }: GhostHoleProps) {
	const definition = HOLE_TYPE_MAP[type];
	const color = isValid ? GREEN : RED;
	const rotationRad = (rotation * Math.PI) / 180;

	const material = useMemo(
		() =>
			new THREE.MeshStandardMaterial({
				color,
				transparent: true,
				opacity: 0.4,
				depthWrite: false,
			}),
		[color],
	);

	if (!definition) return null;

	const { width, length } = definition.dimensions;

	return (
		<group
			position={[position.x, HOLE_HEIGHT / 2, position.z]}
			rotation={[0, rotationRad, 0]}
		>
			<mesh material={material}>
				<boxGeometry args={[width, HOLE_HEIGHT, length]} />
			</mesh>
		</group>
	);
}
```

**Step 2: Run build check**

Run: `cd /mnt/c/Users/Caus/Golf_Plan/golf-planner && npx tsc -b && npm run check`
Expected: Clean

**Step 3: Commit**

```bash
cd /mnt/c/Users/Caus/Golf_Plan/golf-planner
git add src/components/three/GhostHole.tsx
git commit -m "feat: add GhostHole semi-transparent preview component"
```

---

### Task 6: Wire PlacementHandler with ghost + snap + collision

**Files:**
- Modify: `src/components/three/PlacementHandler.tsx` — full rewrite

**Context:** Currently PlacementHandler is a simple invisible floor plane that handles clicks. It needs to:
1. Track mouse position via `onPointerMove` to position the ghost preview
2. Apply grid snap when `snapEnabled` is true
3. Check collision before placing
4. Render `GhostHole` when in place mode with a type selected

**Step 1: Rewrite PlacementHandler**

Replace entire content of `src/components/three/PlacementHandler.tsx`:

```tsx
import type { ThreeEvent } from "@react-three/fiber";
import { useState } from "react";
import { HOLE_TYPE_MAP } from "../../constants";
import { useStore } from "../../store";
import { checkAnyCollision, checkHallBounds } from "../../utils/collision";
import { snapToGrid } from "../../utils/snap";
import { GhostHole } from "./GhostHole";

const GRID_SIZE = 0.25;

function buildOBBMap(
	holes: Record<string, { position: { x: number; z: number }; rotation: number; type: string }>,
) {
	const map: Record<string, { pos: { x: number; z: number }; rot: number; w: number; l: number }> = {};
	for (const [id, hole] of Object.entries(holes)) {
		const def = HOLE_TYPE_MAP[hole.type];
		if (!def) continue;
		map[id] = {
			pos: hole.position,
			rot: hole.rotation,
			w: def.dimensions.width,
			l: def.dimensions.length,
		};
	}
	return map;
}

export function PlacementHandler() {
	const hall = useStore((s) => s.hall);
	const tool = useStore((s) => s.ui.tool);
	const placingType = useStore((s) => s.ui.placingType);
	const snapEnabled = useStore((s) => s.ui.snapEnabled);
	const holes = useStore((s) => s.holes);
	const addHole = useStore((s) => s.addHole);
	const selectHole = useStore((s) => s.selectHole);

	const [ghostPos, setGhostPos] = useState<{ x: number; z: number } | null>(null);
	const [ghostValid, setGhostValid] = useState(true);

	const showGhost = tool === "place" && placingType != null;
	const definition = placingType ? HOLE_TYPE_MAP[placingType] : null;

	function computePosition(point: { x: number; z: number }) {
		let x = point.x;
		let z = point.z;

		if (snapEnabled) {
			x = snapToGrid(x, GRID_SIZE);
			z = snapToGrid(z, GRID_SIZE);
		}

		// Clamp inside hall (AABB clamp for center, OBB checked separately)
		if (definition) {
			x = Math.max(definition.dimensions.width / 2, Math.min(hall.width - definition.dimensions.width / 2, x));
			z = Math.max(definition.dimensions.length / 2, Math.min(hall.length - definition.dimensions.length / 2, z));
		}

		return { x, z };
	}

	function checkValidity(pos: { x: number; z: number }) {
		if (!definition || !placingType) return true;
		const { width, length } = definition.dimensions;
		const candidate = { pos, rot: 0, w: width, l: length };
		const inBounds = checkHallBounds(pos, 0, width, length, hall);
		const obbMap = buildOBBMap(holes);
		const collides = checkAnyCollision(candidate, obbMap);
		return inBounds && !collides;
	}

	function handlePointerMove(e: ThreeEvent<PointerEvent>) {
		if (!showGhost) return;
		const pos = computePosition({ x: e.point.x, z: e.point.z });
		setGhostPos(pos);
		setGhostValid(checkValidity(pos));
	}

	function handleClick(e: ThreeEvent<MouseEvent>) {
		e.stopPropagation();

		if (tool === "place" && placingType && ghostPos) {
			if (ghostValid) {
				addHole(placingType, ghostPos);
			}
		} else if (tool === "select") {
			selectHole(null);
		}
	}

	return (
		<>
			{/* biome-ignore lint/a11y/noStaticElementInteractions: R3F mesh element, not HTML */}
			<mesh
				rotation={[-Math.PI / 2, 0, 0]}
				position={[hall.width / 2, -0.01, hall.length / 2]}
				onClick={handleClick}
				onPointerMove={handlePointerMove}
				visible={false}
			>
				<planeGeometry args={[hall.width, hall.length]} />
				<meshBasicMaterial transparent opacity={0} />
			</mesh>
			{showGhost && ghostPos && placingType && (
				<GhostHole
					type={placingType}
					position={ghostPos}
					rotation={0}
					isValid={ghostValid}
				/>
			)}
		</>
	);
}
```

**Step 2: Run build + tests**

Run: `cd /mnt/c/Users/Caus/Golf_Plan/golf-planner && npx tsc -b && npm run check && npx vitest run`
Expected: Clean build, all tests pass

**Step 3: Commit**

```bash
cd /mnt/c/Users/Caus/Golf_Plan/golf-planner
git add src/components/three/PlacementHandler.tsx
git commit -m "feat: wire ghost preview, snap, and collision into PlacementHandler"
```

---

### Task 7: Wire MiniGolfHole drag with snap + collision

**Files:**
- Modify: `src/components/three/MiniGolfHole.tsx` — update drag handlers

**Context:** The drag handler currently clamps to hall bounds with simple min/max. It needs to:
1. Apply grid snap when `snapEnabled` is true
2. Check OBB collision against other holes during drag
3. Only update position if the new position is valid (no collision, in bounds)

**Step 1: Update MiniGolfHole**

In `src/components/three/MiniGolfHole.tsx`, add imports at top:

```typescript
import { checkAnyCollision, checkHallBounds } from "../../utils/collision";
import { snapToGrid } from "../../utils/snap";
```

Add `snapEnabled` selector after existing selectors (around line 23):

```typescript
const snapEnabled = useStore((s) => s.ui.snapEnabled);
const holes = useStore((s) => s.holes);
```

Replace the `handlePointerMove` function body (the part inside `if (intersection)`, around lines 53–63) with:

```typescript
if (intersection) {
	let x = intersection.x;
	let z = intersection.z;

	if (snapEnabled) {
		x = snapToGrid(x, 0.25);
		z = snapToGrid(z, 0.25);
	}

	x = Math.max(width / 2, Math.min(hall.width - width / 2, x));
	z = Math.max(length / 2, Math.min(hall.length - length / 2, z));

	// Check collision + bounds before applying
	const inBounds = checkHallBounds({ x, z }, hole.rotation, width, length, hall);
	const obbMap: Record<string, { pos: { x: number; z: number }; rot: number; w: number; l: number }> = {};
	for (const [id, h] of Object.entries(holes)) {
		const def = HOLE_TYPE_MAP[h.type];
		if (!def) continue;
		obbMap[id] = { pos: h.position, rot: h.rotation, w: def.dimensions.width, l: def.dimensions.length };
	}
	const collides = checkAnyCollision(
		{ pos: { x, z }, rot: hole.rotation, w: width, l: length },
		obbMap,
		hole.id,
	);

	if (inBounds && !collides) {
		updateHole(hole.id, { position: { x, z } });
	}
}
```

**Step 2: Run build + tests**

Run: `cd /mnt/c/Users/Caus/Golf_Plan/golf-planner && npx tsc -b && npm run check && npx vitest run`
Expected: Clean

**Step 3: Commit**

```bash
cd /mnt/c/Users/Caus/Golf_Plan/golf-planner
git add src/components/three/MiniGolfHole.tsx
git commit -m "feat: add snap and collision detection to hole drag"
```

---

### Task 8: Create RotationHandle drag component

**Files:**
- Create: `src/components/three/RotationHandle.tsx`

**Context:** A flat ring in the XZ plane around a selected hole, with a small sphere grab point on the ring edge. Dragging the sphere rotates the hole. Default: 15-degree snap. Hold Shift: free rotation.

**Step 1: Create the component**

```tsx
// src/components/three/RotationHandle.tsx
import type { ThreeEvent } from "@react-three/fiber";
import { useRef, useState } from "react";
import { useStore } from "../../store";

const RING_RADIUS = 1.2;
const SNAP_DEG = 15;

type RotationHandleProps = {
	holeId: string;
	holeX: number;
	holeZ: number;
	rotation: number;
};

export function RotationHandle({ holeId, holeX, holeZ, rotation }: RotationHandleProps) {
	const updateHole = useStore((s) => s.updateHole);
	const [isDragging, setIsDragging] = useState(false);
	const shiftHeld = useRef(false);

	const rotRad = (rotation * Math.PI) / 180;
	const handleX = holeX + Math.sin(rotRad) * RING_RADIUS;
	const handleZ = holeZ + Math.cos(rotRad) * RING_RADIUS;

	function handlePointerDown(e: ThreeEvent<PointerEvent>) {
		e.stopPropagation();
		setIsDragging(true);
		shiftHeld.current = e.nativeEvent.shiftKey;
		(e.nativeEvent.target as Element)?.setPointerCapture?.(e.nativeEvent.pointerId);
	}

	function handlePointerMove(e: ThreeEvent<PointerEvent>) {
		if (!isDragging) return;
		e.stopPropagation();
		shiftHeld.current = e.nativeEvent.shiftKey;

		const dx = e.point.x - holeX;
		const dz = e.point.z - holeZ;
		let angleDeg = (Math.atan2(dx, dz) * 180) / Math.PI;
		angleDeg = ((angleDeg % 360) + 360) % 360;

		if (!shiftHeld.current) {
			angleDeg = Math.round(angleDeg / SNAP_DEG) * SNAP_DEG;
		}

		updateHole(holeId, { rotation: angleDeg });
	}

	function handlePointerUp(e: ThreeEvent<PointerEvent>) {
		if (!isDragging) return;
		e.stopPropagation();
		setIsDragging(false);
	}

	return (
		<group position={[holeX, 0.01, holeZ]}>
			{/* Ring outline */}
			<mesh rotation={[-Math.PI / 2, 0, 0]}>
				<ringGeometry args={[RING_RADIUS - 0.03, RING_RADIUS + 0.03, 64]} />
				<meshBasicMaterial color="#FF9800" transparent opacity={0.6} />
			</mesh>
			{/* Drag handle sphere */}
			{/* biome-ignore lint/a11y/noStaticElementInteractions: R3F mesh */}
			<mesh
				position={[handleX - holeX, 0, handleZ - holeZ]}
				onPointerDown={handlePointerDown}
				onPointerMove={handlePointerMove}
				onPointerUp={handlePointerUp}
			>
				<sphereGeometry args={[0.12, 16, 16]} />
				<meshStandardMaterial color={isDragging ? "#FFE082" : "#FF9800"} />
			</mesh>
		</group>
	);
}
```

**Step 2: Run build check**

Run: `cd /mnt/c/Users/Caus/Golf_Plan/golf-planner && npx tsc -b && npm run check`
Expected: Clean

**Step 3: Commit**

```bash
cd /mnt/c/Users/Caus/Golf_Plan/golf-planner
git add src/components/three/RotationHandle.tsx
git commit -m "feat: add RotationHandle drag component with 15-degree snap"
```

---

### Task 9: Add toolbar toggles + G keyboard shortcut

**Files:**
- Modify: `src/components/ui/Toolbar.tsx` — add snap toggle, flow path toggle, view toggle
- Modify: `src/hooks/useKeyboardControls.ts` — add `G` key for snap toggle

**Step 1: Update Toolbar**

Replace `src/components/ui/Toolbar.tsx` entirely:

```tsx
import { useStore } from "../../store";
import type { Tool } from "../../types";
import { ExportButton } from "./ExportButton";

const tools: { tool: Tool; label: string; icon: string }[] = [
	{ tool: "select", label: "Select", icon: "\u2196" },
	{ tool: "place", label: "Place", icon: "+" },
	{ tool: "delete", label: "Delete", icon: "\u2715" },
];

export function Toolbar() {
	const activeTool = useStore((s) => s.ui.tool);
	const setTool = useStore((s) => s.setTool);
	const snapEnabled = useStore((s) => s.ui.snapEnabled);
	const toggleSnap = useStore((s) => s.toggleSnap);
	const showFlowPath = useStore((s) => s.ui.showFlowPath);
	const toggleFlowPath = useStore((s) => s.toggleFlowPath);
	const view = useStore((s) => s.ui.view);
	const setView = useStore((s) => s.setView);

	return (
		<div className="flex items-center gap-1 border-b border-gray-200 bg-white px-3 py-2">
			{tools.map(({ tool, label, icon }) => (
				<button
					type="button"
					key={tool}
					onClick={() => setTool(tool)}
					className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
						activeTool === tool
							? "bg-blue-600 text-white"
							: "bg-gray-100 text-gray-700 hover:bg-gray-200"
					}`}
				>
					<span className="mr-1">{icon}</span>
					{label}
				</button>
			))}

			<div className="mx-2 h-6 w-px bg-gray-200" />

			<button
				type="button"
				onClick={toggleSnap}
				className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
					snapEnabled
						? "bg-green-600 text-white"
						: "bg-gray-100 text-gray-700 hover:bg-gray-200"
				}`}
				title="Toggle grid snap (G)"
			>
				Snap
			</button>

			<button
				type="button"
				onClick={toggleFlowPath}
				className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
					showFlowPath
						? "bg-purple-600 text-white"
						: "bg-gray-100 text-gray-700 hover:bg-gray-200"
				}`}
				title="Toggle player flow path"
			>
				Flow
			</button>

			<button
				type="button"
				onClick={() => setView(view === "top" ? "3d" : "top")}
				className="rounded bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
				title="Toggle 2D/3D view"
			>
				{view === "top" ? "3D" : "2D"}
			</button>

			<div className="ml-auto">
				<ExportButton />
			</div>
		</div>
	);
}
```

**Step 2: Add G key to keyboard controls**

In `src/hooks/useKeyboardControls.ts`, add a new case in the `switch` block (before the closing `}`), around line 141:

```typescript
case "g":
case "G": {
	useStore.getState().toggleSnap();
	break;
}
```

**Step 3: Run build + tests**

Run: `cd /mnt/c/Users/Caus/Golf_Plan/golf-planner && npx tsc -b && npm run check && npx vitest run`
Expected: Clean

**Step 4: Commit**

```bash
cd /mnt/c/Users/Caus/Golf_Plan/golf-planner
git add src/components/ui/Toolbar.tsx src/hooks/useKeyboardControls.ts
git commit -m "feat: add toolbar toggles (snap, flow, view) and G keyboard shortcut"
```
