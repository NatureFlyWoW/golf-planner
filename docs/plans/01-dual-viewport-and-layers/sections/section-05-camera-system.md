Good -- that file is created by section-02. Now I have all the context I need to write this section. Let me produce the content.

# Section 05 -- Camera System

## Overview

This section configures per-pane cameras and controls for the dual viewport layout, builds the camera presets overlay with smooth animated transitions, creates the `cameraPresets.ts` utility, and refactors `useKeyboardControls` for viewport-awareness.

**Dependencies:** This section requires section-04 (Dual Canvas Views) to be complete. The Canvas + View + View.Port architecture, `SharedScene.tsx`, and `ThreeDOnlyContent.tsx` must exist. Types from section-02 (`CameraPreset`, `ViewportLayout`, the `activeViewport` store field) must also be in place.

**Blocks:** section-06 (Event Isolation) and section-12 (Polish and Testing).

---

## Background

The existing app has a single `CameraControls.tsx` component that manages both an `OrthographicCamera` and a `PerspectiveCamera`, toggling which is "default" based on `ui.view`. It uses drei's `<OrbitControls>` for all camera interaction, and `useKeyboardControls` to handle R/F/arrow/zoom/undo keyboard shortcuts.

In the dual-viewport architecture, each View needs its own dedicated camera and controls:

- **2D pane**: Orthographic camera with OrbitControls (pan + zoom only, rotation disabled)
- **3D pane**: Perspective camera with drei `<CameraControls>` (the camera-controls library wrapper), which supports `setLookAt()` for smooth animated preset transitions

The existing `CameraControls.tsx` at `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/CameraControls.tsx` is retired and replaced by two separate camera setups embedded within the 2D and 3D View content (either inline within `SharedScene` per-View, or as dedicated per-pane camera components).

---

## Tests (Write First)

### Camera Presets Utility Tests

**File:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/utils/cameraPresets.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { getCameraPresets } from "../../src/utils/cameraPresets";

describe("getCameraPresets", () => {
	const hallWidth = 10;
	const hallLength = 20;
	const presets = getCameraPresets(hallWidth, hallLength);

	it("returns all 6 presets (top, front, back, left, right, isometric)", () => {
		expect(Object.keys(presets)).toHaveLength(6);
		expect(presets).toHaveProperty("top");
		expect(presets).toHaveProperty("front");
		expect(presets).toHaveProperty("back");
		expect(presets).toHaveProperty("left");
		expect(presets).toHaveProperty("right");
		expect(presets).toHaveProperty("isometric");
	});

	it("each preset has a position array of length 3", () => {
		for (const key of Object.keys(presets)) {
			expect(presets[key as keyof typeof presets].position).toHaveLength(3);
		}
	});

	it("each preset has a target array of length 3", () => {
		for (const key of Object.keys(presets)) {
			expect(presets[key as keyof typeof presets].target).toHaveLength(3);
		}
	});

	it('"top" preset position is above hall center (Y > 30)', () => {
		expect(presets.top.position[1]).toBeGreaterThan(30);
	});

	it('"top" preset target is at hall center', () => {
		expect(presets.top.target[0]).toBeCloseTo(hallWidth / 2);
		expect(presets.top.target[2]).toBeCloseTo(hallLength / 2);
	});

	it('"front" preset is at negative Z, low Y, looking at center', () => {
		expect(presets.front.position[2]).toBeLessThan(0);
		expect(presets.front.position[1]).toBeLessThan(30);
	});

	it('"back" preset is at positive Z, low Y, looking at center', () => {
		expect(presets.back.position[2]).toBeGreaterThan(hallLength);
		expect(presets.back.position[1]).toBeLessThan(30);
	});

	it('"left" preset is at negative X', () => {
		expect(presets.left.position[0]).toBeLessThan(0);
	});

	it('"right" preset is at positive X', () => {
		expect(presets.right.position[0]).toBeGreaterThan(hallWidth);
	});

	it('"isometric" preset has non-zero X, Y, Z', () => {
		for (const v of presets.isometric.position) {
			expect(v).not.toBe(0);
		}
	});

	it("all presets have targets at approximately hall center", () => {
		const cx = hallWidth / 2;
		const cz = hallLength / 2;
		for (const key of Object.keys(presets)) {
			const t = presets[key as keyof typeof presets].target;
			expect(t[0]).toBeCloseTo(cx, 0);
			expect(t[2]).toBeCloseTo(cz, 0);
		}
	});

	it("different hall dimensions produce different positions", () => {
		const smallPresets = getCameraPresets(5, 10);
		const largePresets = getCameraPresets(20, 40);
		expect(smallPresets.top.position).not.toEqual(largePresets.top.position);
		expect(smallPresets.front.position).not.toEqual(largePresets.front.position);
	});
});
```

### Keyboard Controls Viewport-Awareness Tests

The existing test file at `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/hooks/keyboardControls.test.ts` retains its current `shouldHandleKey` tests unchanged. New tests for viewport dispatch are added:

**File:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/hooks/keyboardControls.test.ts` (append to existing file)

```ts
// These test the pure-function routing logic, not R3F refs.
// If the refactored hook extracts a testable routing function, add:

// Test: getTargetControls returns 2D controls ref when activeViewport is "2d"
// Test: getTargetControls returns 3D controls ref when activeViewport is "3d"
// Test: getTargetControls returns null when activeViewport is null
// Test: camera preset keys (1-6) return no-op when activeViewport is "2d"
```

Note: The keyboard controls hook is tightly coupled to R3F refs (`OrbitControlsImpl`, `CameraControls`). If a pure routing function can be extracted, test it. Otherwise, viewport-aware keyboard behavior is validated during manual integration testing and section-12 polish.

---

## Implementation Details

### 1. Camera Presets Utility

**New file:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/utils/cameraPresets.ts`

This is a pure utility with no React or R3F dependencies -- easy to test.

```ts
import type { CameraPreset } from "../types/viewport";

export type CameraPresetConfig = {
	position: [number, number, number];
	target: [number, number, number];
};

/**
 * Calculate camera positions for each preset, centered on the hall.
 *
 * @param hallWidth  - Hall width in meters (X axis)
 * @param hallLength - Hall length in meters (Z axis)
 * @returns Record mapping each CameraPreset name to position + target
 */
export function getCameraPresets(
	hallWidth: number,
	hallLength: number,
): Record<CameraPreset, CameraPresetConfig> {
	// cx, cz = hall center in world space
	// Hall sits at origin (0,0,0) to (width,0,length)
	// Camera distance scaled from hall diagonal for comfortable framing
	// ... implementation
}
```

The `target` for every preset should be approximately `[hallWidth/2, 0, hallLength/2]` (hall center at ground level). Position varies per preset:

| Preset | Position logic |
|--------|---------------|
| `top` | Directly above center, Y ~40-50, X = cx, Z = cz |
| `front` | Negative Z side, moderate Y (~8-12), X = cx |
| `back` | Positive Z side (beyond hall length), moderate Y, X = cx |
| `left` | Negative X side, moderate Y, Z = cz |
| `right` | Positive X side (beyond hall width), moderate Y, Z = cz |
| `isometric` | Corner position with all three axes offset, classic 45-degree viewing angle |

Distance from center should scale with the hall diagonal (`Math.sqrt(hallWidth**2 + hallLength**2)`) to ensure the entire hall is visible at any hall size. A multiplier of ~1.2-1.5x the half-diagonal works well for the perspective camera's 60-degree FOV.

### 2. Per-Pane Camera Setup

The existing `CameraControls.tsx` component is **retired** (deleted or gutted). Instead, camera setup is split between the two View contents.

#### 2D Pane Camera

Placed inside the 2D View (within `SharedScene` or as a sibling in the View's JSX). Configuration:

```
OrthographicCamera:
  position = [hallWidth/2, 50, hallLength/2]   (centered above hall)
  zoom = 40
  near = 0.1, far = 200
  makeDefault (within this View only -- drei handles per-View defaults)

OrbitControls:
  enableRotate = false       (pan + zoom only, no orbit)
  enablePan = true
  enableZoom = true
  minZoom = 15, maxZoom = 120
  mouseButtons = { MIDDLE: THREE.MOUSE.PAN, RIGHT: THREE.MOUSE.PAN }
  touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_PAN }
  makeDefault
  onChange = () => invalidate()
```

The `makeDefault` prop on both the camera and controls ensures they are registered as the default camera/controls **within this View's context**. drei `<View>` components create isolated R3F fiber roots, so `makeDefault` only affects the enclosing View.

#### 3D Pane Camera

Placed inside the 3D View. Configuration:

```
PerspectiveCamera:
  position = isometric default (from getCameraPresets(...).isometric.position)
  fov = 60
  near = 0.1, far = 500
  makeDefault

CameraControls (from @react-three/drei):
  Wraps the camera-controls library
  Supports setLookAt(posX, posY, posZ, targetX, targetY, targetZ, enableTransition)
  enableTransition = true for smooth animated presets
  Store a ref for preset invocation and keyboard control
```

**Why use drei `<CameraControls>` instead of `<OrbitControls>` for 3D?** The camera-controls library provides `setLookAt()` with built-in smooth interpolation, which is exactly what camera presets need. OrbitControls does not support animated transitions natively. The camera-controls library is already a dependency of drei.

**Context-aware mouse interaction in 3D pane** (handled by CameraControls defaults):
- Left-drag on empty space = orbit (CameraControls default)
- Right-drag = pan (CameraControls default)
- Scroll = zoom (CameraControls default)
- Left-click on a hole mesh = select it (R3F pointer event, handled by the mesh, not by CameraControls)
- Left-drag on a hole mesh = move it (R3F pointer event)

CameraControls allows pointer events to pass through to R3F meshes before falling through to camera orbit, which is the desired behavior.

#### Double-Tap Reset (Touch Devices)

The existing double-tap-to-reset logic in `CameraControls.tsx` should be preserved. It needs to be split per-viewport:
- In the 2D pane: double-tap resets to centered orthographic view
- In the 3D pane: double-tap resets to default isometric view (or the "top" preset)

This logic can be extracted into a small `useDoubleTapReset` hook or kept inline in the per-pane camera setup components.

### 3. CameraPresets Component (HTML Overlay)

**New file:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/CameraPresets.tsx`

This is an **HTML overlay** positioned in the 3D pane's top-right corner using absolute CSS positioning. It is a regular React component (not an R3F component) rendered as a child of the 3D pane's `<div>` (the View div), placed **outside the Canvas**.

```tsx
/**
 * Camera preset buttons for the 3D pane.
 *
 * Renders 6 small buttons (Top/Front/Back/Left/Right/Iso) that
 * animate the 3D camera to predefined positions using CameraControls'
 * setLookAt() with smooth transitions.
 *
 * Positioned absolutely in the 3D pane div's top-right corner.
 *
 * Props:
 *   cameraControlsRef: RefObject to the drei CameraControls instance
 */
```

Button styling follows the existing overlay pattern (semi-transparent dark background, compact buttons, Tailwind classes). Layout suggestion: a small vertical stack or 2x3 grid of icon/text buttons.

On click, each button:
1. Looks up the preset config via `getCameraPresets(hall.width, hall.length)`
2. Calls `cameraControlsRef.current.setLookAt(...position, ...target, true)` where `true` enables the smooth transition
3. The camera-controls library handles the animation internally (~300-500ms default duration)

The `cameraControlsRef` must be passed from the 3D View's parent (DualViewport or the 3D pane wrapper). The ref is created in DualViewport and threaded into both the CameraPresets overlay and the 3D View's CameraControls component via prop or context.

### 4. Keyboard Controls Refactor

**Modified file:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/hooks/useKeyboardControls.ts`

The current hook takes a single `controlsRef` and `is3D` flag. It must be refactored to accept refs for **both** the 2D OrbitControls and the 3D CameraControls, plus the `activeViewport` from the store.

#### New Signature

```ts
type KeyboardControlsOptions = {
	controls2DRef: React.RefObject<OrbitControlsImpl | null>;
	controls3DRef: React.RefObject<CameraControlsImpl | null>;
	defaultZoom: number;
	defaultTarget: [number, number, number];
	perspectiveDistance: number;
	perspectiveAngle: number;
};
```

The hook internally reads `activeViewport` from the store to decide which controls ref to dispatch to.

#### Key Behavior Changes

| Key | activeViewport = "2d" | activeViewport = "3d" | activeViewport = null |
|-----|----------------------|----------------------|----------------------|
| R (reset) | Reset ortho camera to center/default zoom | Reset 3D camera to isometric preset via `setLookAt` | No-op |
| F (fit) | Fit ortho camera to holes bounding box | Fit 3D camera (setLookAt to bounding box center, distance from extent) | No-op |
| +/- (zoom) | Adjust ortho zoom | No-op (CameraControls handles scroll zoom) | No-op |
| 0 (reset zoom) | Reset ortho zoom to default | No-op | No-op |
| Arrows (pan) | Pan ortho camera | No-op (CameraControls handles drag pan) | No-op |
| 1-6 (presets) | No-op | Animate to preset via `setLookAt` | No-op |
| G (snap toggle) | Works regardless | Works regardless | Works regardless |
| Ctrl+Z / Ctrl+Shift+Z | Works regardless | Works regardless | Works regardless |

The `shouldHandleKey` function remains unchanged.

#### CameraControls API Differences

The 3D pane uses drei's `<CameraControls>` which wraps `camera-controls`. Its API differs from `OrbitControls`:
- **Reset**: `cameraControlsRef.current.setLookAt(...defaultPos, ...defaultTarget, true)`
- **Fit to box**: Calculate bounding center + distance, then `setLookAt`
- **No direct `.target` or `.object` property** like OrbitControls -- use `setLookAt` / `setTarget` / `setPosition`

The hook must use different codepaths for each viewport. The `switch` on `e.key` should first determine the active controls ref, then branch logic accordingly.

### 5. Invocation Site

The refactored `useKeyboardControls` hook is called once at the `DualViewport` level (not inside individual Views). It receives refs for both control instances:

```tsx
// Inside DualViewport.tsx (conceptual)
const controls2DRef = useRef<OrbitControlsImpl>(null);
const controls3DRef = useRef<CameraControlsImpl>(null);

useKeyboardControls({
	controls2DRef,
	controls3DRef,
	defaultZoom: 40,
	defaultTarget: [hall.width / 2, 0, hall.length / 2],
	perspectiveDistance: 25,
	perspectiveAngle: Math.PI / 4,
});
```

These refs are passed down into the respective View content components so the actual `<OrbitControls ref={controls2DRef}>` and `<CameraControls ref={controls3DRef}>` attach to them.

**Important:** R3F refs created outside a `<Canvas>` can be passed into Canvas children as props. The ref assignment happens during React reconciliation, which works across the Canvas boundary.

### 6. Constants

Camera-related constants used across the system:

```ts
// In cameraPresets.ts or a shared constants file
export const DEFAULT_ORTHO_ZOOM = 40;
export const PERSPECTIVE_DISTANCE = 25;
export const PERSPECTIVE_ANGLE = Math.PI / 4;
export const MIN_ORTHO_ZOOM = 15;
export const MAX_ORTHO_ZOOM = 120;
export const CAMERA_TRANSITION_DURATION = 0.4; // seconds, for CameraControls setLookAt
```

---

## Actual Implementation (Post-Build)

### New Files

| File | Purpose |
|------|---------|
| `src/utils/cameraPresets.ts` | Pure utility: `getCameraPresets(width, length)` → 6 preset configs + camera constants (`DEFAULT_ORTHO_ZOOM`, `MIN/MAX_ORTHO_ZOOM`, `PERSPECTIVE_FOV`) |
| `src/components/three/CameraPresets.tsx` | HTML overlay with 6 preset buttons (Top/Front/Back/Left/Right/Iso) in 3D pane top-right. Calls `setLookAt` on CameraControls ref |
| `tests/utils/cameraPresets.test.ts` | 12 unit tests for `getCameraPresets` |

### Modified Files

| File | Changes |
|------|---------|
| `src/components/three/CameraControls.tsx` | **Deleted** — responsibilities moved to per-View inline cameras in DualViewport |
| `src/hooks/useKeyboardControls.ts` | Refactored: dual-ref signature (`controls2DRef` + `controls3DRef`), `resolveViewport()` helper (infers viewport in single-pane modes when `activeViewport` is null), `getHolesBoundingBox()` DRY helper, preset keys 1-6 for 3D |
| `src/components/layout/DualViewport.tsx` | Added: OrbitControls (2D, rotation disabled), drei CameraControls (3D), pane refs, `useDoubleTapReset` hook per-pane, CameraPresets overlay, `useKeyboardControls` with both refs |
| `tests/hooks/keyboardControls.test.ts` | Unchanged — existing `shouldHandleKey` tests still pass |

### Deviations from Plan

1. **`onChange={() => invalidate()}` on OrbitControls omitted** — drei OrbitControls auto-invalidates internally on every change event. The explicit callback in the old code was redundant.
2. **`CAMERA_TRANSITION_DURATION` constant not created** — camera-controls lib uses its own default transition time; the constant would be dead code since `setLookAt(…, true)` just enables the built-in animation.
3. **`resolveViewport()` helper added (not in plan)** — infers effective viewport from layout when `activeViewport` is null on page load (single-pane modes), improving UX.
4. **`getHolesBoundingBox()` extracted (not in plan)** — DRYs up the bounding box computation shared by 2D and 3D 'F' key handlers.
5. **`useDoubleTapReset` hook in DualViewport** — plan suggested either a hook or inline; implemented as a reusable hook attached to pane divs.

### Test Results
- 560 tests pass (49 files), including 12 new camera preset tests
- TypeScript: clean (`npx tsc --noEmit` passes)