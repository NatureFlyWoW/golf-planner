Now I have all the context I need to write the section. Let me generate the complete section content.

# Section 02: Walkthrough Camera Controller

## Overview

This section implements the FPS (first-person shooter style) camera controller for walkthrough mode. It creates the pure math utilities for movement vector computation, pitch clamping, and spawn point calculation, then wires them into a `WalkthroughController` React Three Fiber component.

**Dependency**: Section 01 (Walkthrough State & Store Integration) must be complete — this section requires `walkthroughMode` state, `enterWalkthrough`/`exitWalkthrough` actions, and `getWalkthroughSpawnPoint` from the store.

**What this section delivers**: When `walkthroughMode` is true, the 3D camera drops to eye level at the hall entrance and responds to WASD movement + click-drag look. Movement and look are free (no collision — that comes in Section 03).

---

## Tests First

**Test file**: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/utils/walkthroughCamera.test.ts`

Create this file with the following test structure. All tests operate on pure math functions extracted from the controller — no R3F component mounting required.

```ts
import { describe, expect, it } from "vitest";
import {
  computeMovementVector,
  clampPitch,
  getWalkthroughSpawnPoint,
} from "../../src/utils/walkthroughCamera";
import { HALL } from "../../src/constants/hall";

describe("computeMovementVector", () => {
  it("forward key produces movement in -Z direction at 0° yaw", () => { ... });
  it("backward key produces movement in +Z direction at 0° yaw", () => { ... });
  it("left strafe produces movement in -X direction at 0° yaw", () => { ... });
  it("right strafe produces movement in +X direction at 0° yaw", () => { ... });
  it("diagonal movement (forward + left) normalizes to unit length × speed", () => { ... });
  it("movement scales with delta time (0.016s vs 0.032s = double distance)", () => { ... });
  it("walk speed is 2.0 m/s", () => { ... });
  it("run speed (shift held) is 4.0 m/s", () => { ... });
  it("Y component of movement vector is always 0", () => { ... });
});

describe("clampPitch", () => {
  it("clamps at +85° (looking nearly straight up)", () => { ... });
  it("clamps at -85° (looking nearly straight down)", () => { ... });
  it("leaves pitch unchanged when within range", () => { ... });
  it("returns exact boundary values at limits", () => { ... });
});

describe("getWalkthroughSpawnPoint", () => {
  it("returns position near PVC door (x≈8.1, y=1.7, z≈19.5)", () => { ... });
  it("spawn point Y is exactly 1.7m (eye level)", () => { ... });
  it("spawn point X is within hall boundaries [0, hall.width]", () => { ... });
  it("spawn point Z is inside hall (not beyond south wall)", () => { ... });
});
```

Run tests with: `npm run test -- tests/utils/walkthroughCamera.test.ts`

---

## Implementation

### 1. Pure Math Utility: `src/utils/walkthroughCamera.ts`

Create this new file. It must export all functions consumed by the test file above and by the controller component.

**Constants**:
- `WALK_SPEED = 2.0` (m/s)
- `RUN_SPEED = 4.0` (m/s)
- `EYE_HEIGHT = 1.7` (m)
- `LOOK_SENSITIVITY = 0.003` (radians per pixel)
- `MAX_PITCH = (85 * Math.PI) / 180` (radians)
- `SPAWN_OFFSET_FROM_SOUTH_WALL = 0.5` (m — spawn 0.5m inside south wall)

**`computeMovementVector` function**:

```ts
type KeyState = {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  shift: boolean;
};

type MovementResult = { x: number; y: number; z: number };

/**
 * Compute world-space movement delta for one frame.
 * Yaw angle (radians) describes camera horizontal facing (Y-axis rotation).
 * Returns a vector ready to be added to camera position.
 * Y is always 0 — vertical position is locked to EYE_HEIGHT externally.
 */
export function computeMovementVector(
  keys: KeyState,
  yaw: number,
  delta: number,
): MovementResult
```

Implementation notes:
- Front vector: `(-sin(yaw), 0, -cos(yaw))` — Three.js convention, -Z is forward at yaw=0
- Side vector: `(cos(yaw), 0, -sin(yaw))` — perpendicular to front on XZ plane, positive = right
- For strafe left: negate side vector
- Combine: `dir = front * (forward - backward) + side * (right - left)`
- Normalize only if `dir.length > 0` to avoid NaN on zero vector
- Scale: `dir * speed * delta` where speed = `keys.shift ? RUN_SPEED : WALK_SPEED`
- Return `{ x: dir.x, y: 0, z: dir.z }`

**`clampPitch` function**:

```ts
/**
 * Clamp pitch angle (radians) to prevent camera flip.
 * Positive pitch = looking up, negative pitch = looking down.
 */
export function clampPitch(pitch: number): number
```

Clamps to `[-MAX_PITCH, MAX_PITCH]`.

**`getWalkthroughSpawnPoint` function**:

```ts
/**
 * Compute the camera spawn position for walkthrough mode.
 * Places the camera just inside the south wall near the PVC entrance door.
 */
export function getWalkthroughSpawnPoint(hall: Hall): { x: number; y: number; z: number }
```

Implementation:
- Find the PVC door in `hall.doors`: `hall.doors.find(d => d.type === "pvc")`
- If found: `x = door.offset` (the door center offset from west wall)
- If not found (fallback): `x = hall.width / 2`
- `y = EYE_HEIGHT` (1.7m)
- `z = hall.length - SPAWN_OFFSET_FROM_SOUTH_WALL` — just inside the south wall

The PVC door in `HALL` has `offset: 8.1`, so the spawn point will be approximately `{ x: 8.1, y: 1.7, z: 19.5 }`.

---

### 2. Controller Component: `src/components/three/environment/WalkthroughController.tsx`

Create this directory and file. The component renders nothing (`return null`) and manages the camera imperatively via `useFrame` and DOM event listeners.

**Props**:
```ts
type WalkthroughControllerProps = {
  /** The DOM element to attach pointer events to (3D pane div, not canvas). */
  targetRef: React.RefObject<HTMLDivElement | null>;
};
```

**Internal state** (all via `useRef` to avoid re-renders):
- `eulerRef: useRef(new THREE.Euler(0, 0, 0, 'YXZ'))` — current look angles
- `keyStateRef: useRef<KeyState>({ forward, backward, left, right, shift: all false })`
- `isDraggingRef: useRef(false)`
- `lastPointerRef: useRef({ x: 0, y: 0 })`

**Mount/unmount lifecycle** (`useEffect`):

On mount:
1. Call `getWalkthroughSpawnPoint(hall)` to compute spawn position
2. Set `camera.position.set(spawn.x, spawn.y, spawn.z)`
3. Reset `eulerRef.current` to `new THREE.Euler(0, 0, 0, 'YXZ')` (facing -Z = into hall)
4. Apply euler to camera: `camera.quaternion.setFromEuler(eulerRef.current)`

On unmount:
- Restore camera via deferred `requestAnimationFrame(() => { cameraControls?.setLookAt(...savedPos, ...savedTarget, false) })`
- The saved position/target should be captured at mount time via `CameraControls.getPosition()` / `getTarget()` — but since CameraControls is disabled during walkthrough (`enabled={!walkthroughMode}`), save the camera's world position directly: `camera.position.clone()`, `target = camera.position.clone().add(camera.getWorldDirection(new THREE.Vector3()))`

**Keyboard event listeners** (attached to `window` in `useEffect`):

```ts
// Key mapping:
// 'w' or 'ArrowUp'   → forward
// 's' or 'ArrowDown' → backward
// 'a' or 'ArrowLeft' → left
// 'd' or 'ArrowRight'→ right
// 'Shift'            → shift (run)
```

Use `stopPropagation()` on all handled key events to prevent `useKeyboardControls` from also firing on WASD keys during walkthrough.

**Pointer event listeners** (attached to `targetRef.current` in `useEffect`):

- `pointerdown`: set `isDraggingRef.current = true`, capture `lastPointerRef.current = { x: e.clientX, y: e.clientY }`, call `e.currentTarget.setPointerCapture(e.pointerId)`
- `pointermove`: if dragging, compute `dx = e.clientX - lastPointer.x`, `dy = e.clientY - lastPointer.y`. Apply:
  - `euler.y -= dx * LOOK_SENSITIVITY` (yaw: mouse right = turn right)
  - `euler.x = clampPitch(euler.x - dy * LOOK_SENSITIVITY)` (pitch: mouse up = look up)
  - Update `lastPointerRef.current`
- `pointerup` / `pointercancel`: set `isDraggingRef.current = false`

**`useFrame` hook**:

Each frame (only when mounted, which only happens when `walkthroughMode === true`):
1. Apply euler to camera: `camera.quaternion.setFromEuler(eulerRef.current)`
2. Compute movement: `const delta = computeMovementVector(keyStateRef.current, eulerRef.current.y, state.clock.getDelta())`
   - Note: use `state.clock.getDelta()` — `state` is the R3F state from `useFrame((state, delta) => ...)`; use the `delta` parameter directly from `useFrame`, not `state.clock.getDelta()` which would double-consume
3. Apply movement: `camera.position.x += delta.x; camera.position.z += delta.z`
4. Lock Y: `camera.position.y = EYE_HEIGHT`

**Important**: The `useFrame` delta parameter (second argument) should be used directly: `useFrame((state, delta) => { ... computeMovementVector(keys, yaw, delta) ... })`.

---

### 3. Mount the Controller in `DualViewport.tsx`

**File to modify**: `src/components/layout/DualViewport.tsx`

The component needs to:
1. Read `walkthroughMode` from store: `const walkthroughMode = useStore((s) => s.ui.walkthroughMode)`
2. Create a ref for the 3D pane div: `const threeDPaneRef = useRef<HTMLDivElement>(null)`
3. Attach that ref to the 3D pane container div
4. Inside the 3D Canvas (or SharedScene), conditionally mount: `{walkthroughMode && <WalkthroughController targetRef={threeDPaneRef} />}`
5. Disable CameraControls during walkthrough: add `enabled={!walkthroughMode}` prop to the `<CameraControls>` component

**Pass `walkthroughMode` to `deriveFrameloop`**:

The existing `deriveFrameloop` call in `DualViewport.tsx` must be updated once Section 01 adds the 5th parameter. This section does the wiring:

```ts
const frameloop = deriveFrameloop(uvMode, gpuTier, transitioning, viewportLayout, walkthroughMode);
```

The signature change to `deriveFrameloop` is done in Section 01 — this section only updates the call site.

---

### 4. Create Environment Directory

Create the directory `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/environment/` — this is where all environment components for this split live. Add an `index.ts` barrel export as components are added.

---

## Key Decisions & Constraints

**Euler order 'YXZ'**: This is critical. `THREE.Euler` defaults to 'XYZ' which causes gimbal lock at ±90° pitch. 'YXZ' applies yaw (horizontal) first, then pitch (vertical), which is the standard FPS camera order.

**Pointer events on pane div, not canvas**: The R3F canvas has `pointerEvents: "none"` in dual viewport mode (pointer events are routed through a separate event source). Attach to the 3D pane container div instead.

**Key event stopPropagation**: WASD keys must call `e.stopPropagation()` to prevent the existing `useKeyboardControls` hook from also processing them (e.g., 'a' triggering some other shortcut). Section 04 handles the full suppression of `useKeyboardControls` during walkthrough, but `stopPropagation` is a defense-in-depth measure here.

**Camera restore race condition**: When exiting walkthrough, `DualViewport.tsx` re-enables `CameraControls` and may restore the layout transition simultaneously. Use `requestAnimationFrame` on the restore callback to ensure `CameraControls` has finished remounting before calling `setLookAt`.

**No collision in this section**: Movement is free — camera can walk through walls and holes. Section 03 adds collision. The `checkWalkthroughCollision` call site in `useFrame` should be left as a `// TODO: Section 03 — wrap with checkWalkthroughCollision` comment.

---

## File Summary

Files to create:
- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/utils/walkthroughCamera.ts` — pure math utilities
- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/environment/WalkthroughController.tsx` — R3F component
- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/utils/walkthroughCamera.test.ts` — test file

Files to modify:
- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/layout/DualViewport.tsx` — mount controller, add pane ref, update `deriveFrameloop` call, disable CameraControls during walkthrough