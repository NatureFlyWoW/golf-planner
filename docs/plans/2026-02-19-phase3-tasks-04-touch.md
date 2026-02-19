# Phase 3 — Tasks 10–13: Touch Interaction

> Part of [Phase 3 Implementation Plan](./2026-02-19-phase3-implementation-index.md)
> Design: [Phase 3 Mobile + PWA Design](./2026-02-19-phase3-mobile-pwa-design.md) §4
> Depends on: Task 2 (isMobile utility)

---

## Task 10: OrbitControls Touch Pan Fix

**Files:**
- Modify: `src/components/three/CameraControls.tsx`

### Step 1: Fix one-finger touch in top-down view

Currently in `CameraControls.tsx` (line 133-134):

```tsx
touches={{
	ONE: is3D ? TOUCH.ROTATE : undefined,
	TWO: TOUCH.DOLLY_PAN,
}}
```

`undefined` means one-finger touch does nothing in top-down view. On mobile, users need single-finger pan. Change to:

```tsx
touches={{
	ONE: is3D ? TOUCH.ROTATE : TOUCH.PAN,
	TWO: TOUCH.DOLLY_PAN,
}}
```

`TOUCH` is already imported from `three` on line 8.

### Step 2: Verify build

```bash
npm run check && npm run build
```

Expected: Clean build. On mobile, single-finger pans the camera in top-down view. In 3D view, single-finger rotates (unchanged).

### Step 3: Commit

```bash
git add src/components/three/CameraControls.tsx
git commit -m "fix: enable single-finger pan in top-down view for touch devices"
```

---

## Task 11: Drag Deadzone in MiniGolfHole

**Files:**
- Modify: `src/components/three/MiniGolfHole.tsx`

### Step 1: Understand the current problem

Currently, `MiniGolfHole` transitions to dragging state immediately on `pointerDown` (line 47: `setIsDragging(true)`). On touch devices, this means tapping to select a hole always starts a drag. The fix: track `pointerDown` screen position and only start dragging after 10px movement in **screen pixels**.

### Step 2: Add deadzone tracking

In `src/components/three/MiniGolfHole.tsx`:

1. Add a ref to track the pointer-down screen position:

```tsx
const pointerStartScreen = useRef<{ x: number; y: number } | null>(null);
```

2. Replace `handlePointerDown` (currently lines 38-49):

```tsx
function handlePointerDown(e: ThreeEvent<PointerEvent>) {
	if (tool !== "select" || !isSelected) return;
	e.stopPropagation();
	e.nativeEvent.target &&
		"setPointerCapture" in (e.nativeEvent.target as Element) &&
		(e.nativeEvent.target as Element).setPointerCapture(
			e.nativeEvent.pointerId,
		);
	dragStart.current = { x: hole.position.x, z: hole.position.z };
	pointerStartScreen.current = {
		x: e.nativeEvent.clientX,
		y: e.nativeEvent.clientY,
	};
	// Don't setIsDragging(true) yet — wait for deadzone
}
```

3. Replace `handlePointerMove` (currently lines 51-106):

```tsx
function handlePointerMove(e: ThreeEvent<PointerEvent>) {
	if (!dragStart.current || !pointerStartScreen.current) return;
	e.stopPropagation();

	// Check deadzone if not yet dragging
	if (!isDragging) {
		const dx = e.nativeEvent.clientX - pointerStartScreen.current.x;
		const dy = e.nativeEvent.clientY - pointerStartScreen.current.y;
		if (Math.hypot(dx, dy) < 10) return;
		// Past deadzone — start dragging
		setIsDragging(true);
		useStore.temporal?.getState()?.pause();
	}

	const intersection = new THREE.Vector3();
	raycaster.ray.intersectPlane(floorPlane, intersection);

	if (intersection) {
		let x = intersection.x;
		let z = intersection.z;

		if (snapEnabled) {
			x = snapToGrid(x, 0.25);
			z = snapToGrid(z, 0.25);
		}

		x = Math.max(width / 2, Math.min(hall.width - width / 2, x));
		z = Math.max(length / 2, Math.min(hall.length - length / 2, z));

		const inBounds = checkHallBounds(
			{ x, z },
			hole.rotation,
			width,
			length,
			hall,
		);
		const obbMap: Record<
			string,
			{
				pos: { x: number; z: number };
				rot: number;
				w: number;
				l: number;
			}
		> = {};
		for (const [id, h] of Object.entries(holes)) {
			const def = HOLE_TYPE_MAP[h.type];
			if (!def) continue;
			obbMap[id] = {
				pos: h.position,
				rot: h.rotation,
				w: def.dimensions.width,
				l: def.dimensions.length,
			};
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
}
```

4. Update `handlePointerUp`:

```tsx
function handlePointerUp(e: ThreeEvent<PointerEvent>) {
	if (!dragStart.current) return;
	e.stopPropagation();
	if (isDragging) {
		useStore.temporal?.getState()?.resume();
	}
	setIsDragging(false);
	dragStart.current = null;
	pointerStartScreen.current = null;
}
```

Key: `temporal.pause()` moved from `pointerDown` to the deadzone-crossing moment, and `temporal.resume()` only called if actually dragging.

### Step 3: Verify build + existing tests

```bash
npm run check && npm run build && npx vitest run
```

Expected: All tests pass, clean build.

### Step 4: Commit

```bash
git add src/components/three/MiniGolfHole.tsx
git commit -m "feat: add 10px drag deadzone to prevent accidental drags on touch"
```

---

## Task 12: Mobile Ghost Preview in PlacementHandler

**Files:**
- Modify: `src/components/three/PlacementHandler.tsx`

### Step 1: Understand the current behavior

Currently, the ghost follows `onPointerMove` (hover). On mobile, there's no hover — so no ghost appears. The fix:
- Desktop: unchanged (ghost follows pointer hover)
- Mobile: ghost appears at `pointerDown` position. On `pointerUp`, if moved <10px screen pixels, confirm placement. If >10px, cancel (was a pan gesture).

### Step 2: Add mobile placement handling

In `src/components/three/PlacementHandler.tsx`:

1. Add imports:
```tsx
import { isMobile } from "../../utils/isMobile";
```

2. Add refs for tracking pointer-down position:
```tsx
const pointerDownScreen = useRef<{ x: number; y: number } | null>(null);
const pointerDownWorld = useRef<{ x: number; z: number } | null>(null);
```

(Add `useRef` to the react import if not already there.)

3. Add `onPointerDown` handler for mobile:
```tsx
function handlePointerDown(e: ThreeEvent<PointerEvent>) {
	if (!showGhost || !isMobile) return;
	const pos = computePosition({ x: e.point.x, z: e.point.z });
	setGhostPos(pos);
	setGhostValid(checkValidity(pos));
	pointerDownScreen.current = {
		x: e.nativeEvent.clientX,
		y: e.nativeEvent.clientY,
	};
	pointerDownWorld.current = pos;
}
```

4. Add `onPointerUp` handler for mobile:
```tsx
function handlePointerUp(e: ThreeEvent<PointerEvent>) {
	if (!isMobile) return;

	if (pointerDownScreen.current && pointerDownWorld.current) {
		const dx = e.nativeEvent.clientX - pointerDownScreen.current.x;
		const dy = e.nativeEvent.clientY - pointerDownScreen.current.y;
		const moved = Math.hypot(dx, dy);

		if (moved < 10 && ghostValid && placingType) {
			// Tap — confirm placement
			addHole(placingType, pointerDownWorld.current);
		}
		// If moved >= 10, it was a pan — cancel placement
	} else if (tool === "select") {
		// Tap on empty canvas in Select mode — deselect
		selectHole(null);
	}

	pointerDownScreen.current = null;
	pointerDownWorld.current = null;
}
```

**IMPORTANT:** This handler also provides the mobile deselection path. On desktop, clicking empty canvas calls `selectHole(null)` via `handleClick`. On mobile, `handleClick` is guarded with `if (isMobile) return`, so deselection happens here instead via `handlePointerUp`.

5. Modify `handleClick` to only work on desktop:
```tsx
function handleClick(e: ThreeEvent<MouseEvent>) {
	e.stopPropagation();

	if (isMobile) return; // Mobile uses pointerDown/Up instead

	if (tool === "place" && placingType && ghostPos) {
		if (ghostValid) {
			addHole(placingType, ghostPos);
		}
	} else if (tool === "select") {
		selectHole(null);
	}
}
```

6. Wire new handlers on the invisible mesh:
```tsx
<mesh
	rotation={[-Math.PI / 2, 0, 0]}
	position={[hall.width / 2, -0.01, hall.length / 2]}
	onClick={handleClick}
	onPointerMove={handlePointerMove}
	onPointerDown={handlePointerDown}
	onPointerUp={handlePointerUp}
	visible={false}
>
```

### Step 3: Verify build

```bash
npm run check && npm run build
```

Expected: Clean build. Desktop placement unchanged (hover + click). Mobile placement works via tap (pointerDown shows ghost, pointerUp confirms if <10px movement).

### Step 4: Commit

```bash
git add src/components/three/PlacementHandler.tsx
git commit -m "feat: add mobile ghost preview with tap-to-place"
```

---

## Task 13: RotationHandle Mobile Enlargement

**Files:**
- Modify: `src/components/three/RotationHandle.tsx`

### Step 1: Import isMobile and add conditional sizing

In `src/components/three/RotationHandle.tsx`:

1. Add import:
```tsx
import { isMobile } from "../../utils/isMobile";
```

2. Add conditional constants after the existing ones (lines 5-6):
```tsx
const SPHERE_RADIUS = isMobile ? 0.35 : 0.12;
const SPHERE_SEGMENTS = isMobile ? 8 : 16;
const RING_SEGMENTS = isMobile ? 32 : 64;
```

3. Update the ring geometry (line 67):

Current:
```tsx
<ringGeometry args={[RING_RADIUS - 0.03, RING_RADIUS + 0.03, 64]} />
```

Replace with:
```tsx
<ringGeometry args={[RING_RADIUS - 0.03, RING_RADIUS + 0.03, RING_SEGMENTS]} />
```

4. Update the sphere geometry (line 77):

Current:
```tsx
<sphereGeometry args={[0.12, 16, 16]} />
```

Replace with:
```tsx
<sphereGeometry args={[SPHERE_RADIUS, SPHERE_SEGMENTS, SPHERE_SEGMENTS]} />
```

### Step 2: Verify build

```bash
npm run check && npm run build
```

Expected: Clean build. On mobile, rotation handle sphere is 3x larger (0.35 vs 0.12) for easier touch targeting. Ring has fewer segments (32 vs 64) for performance.

### Step 3: Commit

```bash
git add src/components/three/RotationHandle.tsx
git commit -m "feat: enlarge rotation handle sphere on mobile for touch"
```
