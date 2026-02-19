# Phase 2 — Group B: Visualization (Tasks 10–12)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
>
> **Environment:** Every Bash call needs `export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)"` before commands. Working dir: `golf-planner/`. Biome uses tabs.
>
> **Depends on:** Group A complete (snap, collision, rotation, ghost preview, toolbar toggles all wired)

---

### Task 10: Create FlowPath component

**Files:**
- Create: `src/components/three/FlowPath.tsx`

**Context:** Draws dashed lines between holes in `holeOrder` sequence (center to center), with numbered labels at each hole. Uses drei `<Line>` for lines and `<Billboard>` + `<Text>` for labels that always face the camera. Only renders when `showFlowPath` is true and there are >= 2 holes.

**Step 1: Create the component**

```tsx
// src/components/three/FlowPath.tsx
import { Billboard, Line, Text } from "@react-three/drei";
import { useStore } from "../../store";

const LINE_Y = 0.02;
const LABEL_Y = 0.5;

export function FlowPath() {
	const showFlowPath = useStore((s) => s.ui.showFlowPath);
	const holes = useStore((s) => s.holes);
	const holeOrder = useStore((s) => s.holeOrder);

	if (!showFlowPath || holeOrder.length < 2) return null;

	const points: [number, number, number][] = [];
	for (const id of holeOrder) {
		const hole = holes[id];
		if (!hole) continue;
		points.push([hole.position.x, LINE_Y, hole.position.z]);
	}

	if (points.length < 2) return null;

	return (
		<group>
			<Line
				points={points}
				color="white"
				lineWidth={2}
				dashed
				dashSize={0.3}
				gapSize={0.15}
				opacity={0.5}
				transparent
			/>
			{holeOrder.map((id, index) => {
				const hole = holes[id];
				if (!hole) return null;
				return (
					<Billboard
						key={id}
						position={[hole.position.x, LABEL_Y, hole.position.z]}
						follow
					>
						<Text
							fontSize={0.35}
							color="white"
							anchorX="center"
							anchorY="middle"
							outlineWidth={0.03}
							outlineColor="black"
						>
							{index + 1}
						</Text>
					</Billboard>
				);
			})}
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
git add src/components/three/FlowPath.tsx
git commit -m "feat: add FlowPath component with dashed lines and numbered labels"
```

---

### Task 11: Implement dual camera system (3D toggle)

**Files:**
- Modify: `src/components/three/CameraControls.tsx` — dual camera, perspective orbit, transition
- Modify: `src/hooks/useKeyboardControls.ts` — camera-type branching for zoom, R key reset
- Modify: `src/App.tsx` — remove `orthographic` from Canvas, let CameraControls manage cameras

**Context:** The current setup uses a single orthographic camera set on the `<Canvas>` element. Phase 2 needs:
- Two cameras: `<OrthographicCamera>` and `<PerspectiveCamera>`, both in the scene
- Toggle switches which has `makeDefault`
- Orthographic: current behavior (no rotate, pan/zoom)
- Perspective: 45-degree initial angle, orbit enabled
- Keyboard zoom branches on camera type
- `R` key resets to default in either mode

**Step 1: Rewrite CameraControls**

Replace entire `src/components/three/CameraControls.tsx`:

```tsx
import { OrthographicCamera, PerspectiveCamera } from "@react-three/drei";
import { OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { MOUSE, TOUCH } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useKeyboardControls } from "../../hooks/useKeyboardControls";
import { useStore } from "../../store";

const DEFAULT_ZOOM = 40;
const PERSPECTIVE_DISTANCE = 25;
const PERSPECTIVE_ANGLE = Math.PI / 4; // 45 degrees

export function CameraControls() {
	const { width, length } = useStore((s) => s.hall);
	const view = useStore((s) => s.ui.view);
	const controlsRef = useRef<OrbitControlsImpl>(null);
	const defaultTarget: [number, number, number] = useMemo(
		() => [width / 2, 0, length / 2],
		[width, length],
	);
	const gl = useThree((s) => s.gl);
	const invalidate = useThree((s) => s.invalidate);

	const is3D = view === "3d";

	// Perspective camera initial position: 45-degree angle looking at center
	const perspPos: [number, number, number] = useMemo(() => {
		const cx = width / 2;
		const cz = length / 2;
		return [
			cx,
			Math.sin(PERSPECTIVE_ANGLE) * PERSPECTIVE_DISTANCE,
			cz + Math.cos(PERSPECTIVE_ANGLE) * PERSPECTIVE_DISTANCE,
		];
	}, [width, length]);

	useKeyboardControls({
		controlsRef,
		defaultZoom: DEFAULT_ZOOM,
		defaultTarget,
		is3D,
		perspectiveDistance: PERSPECTIVE_DISTANCE,
		perspectiveAngle: PERSPECTIVE_ANGLE,
	});

	// Double-tap to reset camera (touch devices)
	useEffect(() => {
		const canvas = gl.domElement;
		let lastTapTime = 0;
		let wasSingleTouch = false;

		function handleTouchStart(e: TouchEvent) {
			wasSingleTouch = e.touches.length === 1;
		}

		function handleTouchEnd(e: TouchEvent) {
			if (e.touches.length > 0) return;
			if (!wasSingleTouch) return;

			const now = Date.now();
			if (now - lastTapTime < 300) {
				const ctrl = controlsRef.current;
				if (!ctrl) return;
				const cam = ctrl.object;
				ctrl.target.set(...defaultTarget);

				if ("zoom" in cam && !is3D) {
					cam.position.set(defaultTarget[0], 50, defaultTarget[2]);
					(cam as { zoom: number }).zoom = DEFAULT_ZOOM;
				} else {
					cam.position.set(...perspPos);
				}
				cam.updateProjectionMatrix();
				ctrl.update();
				invalidate();
				lastTapTime = 0;
			} else {
				lastTapTime = now;
			}
		}

		canvas.addEventListener("touchstart", handleTouchStart);
		canvas.addEventListener("touchend", handleTouchEnd);
		return () => {
			canvas.removeEventListener("touchstart", handleTouchStart);
			canvas.removeEventListener("touchend", handleTouchEnd);
		};
	}, [gl, defaultTarget, is3D, perspPos, invalidate]);

	// Invalidate on view change to re-render
	const [prevView, setPrevView] = useState(view);
	useEffect(() => {
		if (view !== prevView) {
			setPrevView(view);
			invalidate();
		}
	}, [view, prevView, invalidate]);

	return (
		<>
			<OrthographicCamera
				makeDefault={!is3D}
				position={[defaultTarget[0], 50, defaultTarget[2]]}
				zoom={DEFAULT_ZOOM}
				near={0.1}
				far={200}
			/>
			<PerspectiveCamera
				makeDefault={is3D}
				position={perspPos}
				fov={60}
				near={0.1}
				far={500}
			/>
			<OrbitControls
				ref={controlsRef}
				target={defaultTarget}
				enableRotate={is3D}
				enablePan={true}
				enableZoom={true}
				minZoom={is3D ? undefined : 15}
				maxZoom={is3D ? undefined : 120}
				minDistance={is3D ? 5 : undefined}
				maxDistance={is3D ? 80 : undefined}
				mouseButtons={{
					LEFT: is3D ? MOUSE.ROTATE : undefined,
					MIDDLE: MOUSE.PAN,
					RIGHT: MOUSE.PAN,
				}}
				touches={{
					ONE: is3D ? TOUCH.ROTATE : undefined,
					TWO: TOUCH.DOLLY_PAN,
				}}
				makeDefault
				onChange={() => invalidate()}
			/>
		</>
	);
}
```

**Step 2: Update useKeyboardControls**

In `src/hooks/useKeyboardControls.ts`, update the options type and handler:

Add two new fields to `KeyboardControlsOptions`:

```typescript
type KeyboardControlsOptions = {
	controlsRef: React.RefObject<OrbitControlsImpl | null>;
	defaultZoom: number;
	defaultTarget: [number, number, number];
	is3D: boolean;
	perspectiveDistance: number;
	perspectiveAngle: number;
};
```

Update the function signature to destructure the new fields:

```typescript
export function useKeyboardControls({
	controlsRef,
	defaultZoom,
	defaultTarget,
	is3D,
	perspectiveDistance,
	perspectiveAngle,
}: KeyboardControlsOptions) {
```

Update the `R` key handler (replace the existing case):

```typescript
case "r":
case "R": {
	controls.target.set(...defaultTarget);
	if (!is3D && "zoom" in camera) {
		camera.zoom = defaultZoom;
		camera.position.set(defaultTarget[0], 50, defaultTarget[2]);
	} else {
		camera.position.set(
			defaultTarget[0],
			Math.sin(perspectiveAngle) * perspectiveDistance,
			defaultTarget[2] + Math.cos(perspectiveAngle) * perspectiveDistance,
		);
	}
	camera.updateProjectionMatrix();
	controls.update();
	break;
}
```

Remove the old guard `if (!(\"zoom\" in camera)) return;` near line 34. Replace with a check only for zoom keys:

For the `+`/`=`, `-`, `0` cases, wrap each body with:
```typescript
if ("zoom" in camera) {
	// ... existing zoom logic
}
```

Add `is3D, perspectiveDistance, perspectiveAngle` to the `useEffect` dependency array.

**Step 3: Update App.tsx Canvas**

In `src/App.tsx`, remove the `orthographic` and `camera` props from `<Canvas>`:

```tsx
<Canvas
	dpr={[1, 2]}
	frameloop="demand"
>
```

(The cameras are now managed by CameraControls)

**Step 4: Run build + tests**

Run: `cd /mnt/c/Users/Caus/Golf_Plan/golf-planner && npx tsc -b && npm run check && npx vitest run`
Expected: Clean build, all tests pass. TypeScript may flag missing params in existing test for `useKeyboardControls` if there's a test — update accordingly.

**Step 5: Commit**

```bash
cd /mnt/c/Users/Caus/Golf_Plan/golf-planner
git add src/components/three/CameraControls.tsx src/hooks/useKeyboardControls.ts src/App.tsx
git commit -m "feat: implement dual camera system with 3D orbit toggle"
```

---

### Task 12: Wire new components into scene

**Files:**
- Modify: `src/components/three/PlacedHoles.tsx` — render RotationHandle for selected hole
- Modify: `src/App.tsx` — add FlowPath to Canvas

**Step 1: Update PlacedHoles to include RotationHandle**

In `src/components/three/PlacedHoles.tsx`, add import:

```typescript
import { RotationHandle } from "./RotationHandle";
```

After the `{holeOrder.map(...)}` block but still inside the `<group>`, add the RotationHandle for the selected hole:

```tsx
{selectedId && holes[selectedId] && (
	<RotationHandle
		holeId={selectedId}
		holeX={holes[selectedId].position.x}
		holeZ={holes[selectedId].position.z}
		rotation={holes[selectedId].rotation}
	/>
)}
```

**Step 2: Add FlowPath to App.tsx Canvas**

In `src/App.tsx`, add import:

```typescript
import { FlowPath } from "./components/three/FlowPath";
```

Inside the `<Canvas>` block, add `<FlowPath />` after `<PlacedHoles />`:

```tsx
<PlacedHoles />
<FlowPath />
```

**Step 3: Run build + tests**

Run: `cd /mnt/c/Users/Caus/Golf_Plan/golf-planner && npx tsc -b && npm run check && npx vitest run`
Expected: Clean

**Step 4: Commit**

```bash
cd /mnt/c/Users/Caus/Golf_Plan/golf-planner
git add src/components/three/PlacedHoles.tsx src/App.tsx
git commit -m "feat: wire FlowPath and RotationHandle into scene"
```
