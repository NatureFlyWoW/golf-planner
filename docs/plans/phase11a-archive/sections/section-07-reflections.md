Good. MeshReflectorMaterial is not yet used in any source file, only in docs/plans. Now I have everything I need to write the section.

# Section 07: MeshReflectorMaterial (Reflective Floor)

## Overview

This section adds a conditional reflective floor to the hall using drei's `MeshReflectorMaterial`. The reflective floor is the visual centerpiece of UV mode in 3D perspective view -- it creates a dark, glossy surface that reflects the UV lighting, neon holes, and sparkle particles, producing an immersive blacklight venue atmosphere.

The reflector is conditionally rendered based on three gating criteria: UV mode must be active, the view must be 3D perspective (not top-down), and the GPU tier must be mid or high (never low). When any condition is unmet, the floor falls back to a standard `MeshStandardMaterial`. The reflector also respects `PerformanceMonitor` degradation and will disable itself if FPS drops below the 0.5 threshold.

## Dependencies

- **Section 01 (GPU Tier Classifier)**: Must be complete. This section reads `gpuTier` from the Zustand UI state to gate reflector rendering. The `gpuTier` field (`"low" | "mid" | "high"`) must exist in `UIState` and be populated by the `useGpuTier` hook.
- **Section 05 (Environment)**: Must be complete. The frameloop strategy (`needsAlwaysFrameloop`) must be implemented because `MeshReflectorMaterial` requires `frameloop="always"` for its FBO (frame buffer object) updates. Section 05 already handles this: when `uvMode && gpuTier !== "low"`, the frameloop is set to `"always"`.

## Files to Modify

- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/HallFloor.tsx` -- Primary file. Replace simple `meshStandardMaterial` with conditional `MeshReflectorMaterial`.

## Files to Create

- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/reflections.test.ts` -- Unit tests for gating logic and configuration.

## Tests (Write First)

All tests go in `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/reflections.test.ts`. These test the pure gating logic and configuration derivation, not 3D rendering (which cannot be tested in jsdom).

```ts
/**
 * Tests for MeshReflectorMaterial gating logic and configuration.
 *
 * Tests the pure functions that determine:
 * 1. Whether the reflector should be enabled (boolean gating)
 * 2. What resolution the reflector should use (tier-dependent)
 * 3. Whether PerformanceMonitor degradation disables it
 */

import { describe, expect, it } from "vitest";

// Import the gating function and config derivation from HallFloor
// (these will be extracted as testable pure functions)
// import { shouldUseReflector, getReflectorResolution } from "../src/components/three/HallFloor";

describe("MeshReflectorMaterial gating", () => {
	describe("shouldUseReflector", () => {
		it("returns true when uvMode=true, view='3d', gpuTier='mid'", () => {
			// shouldUseReflector({ uvMode: true, view: "3d", gpuTier: "mid", perfCurrent: 1.0 }) === true
		});

		it("returns true when uvMode=true, view='3d', gpuTier='high'", () => {
			// shouldUseReflector({ uvMode: true, view: "3d", gpuTier: "high", perfCurrent: 1.0 }) === true
		});

		it("returns false when view='top' (any tier)", () => {
			// shouldUseReflector({ uvMode: true, view: "top", gpuTier: "high", perfCurrent: 1.0 }) === false
		});

		it("returns false when uvMode=false (any view)", () => {
			// shouldUseReflector({ uvMode: false, view: "3d", gpuTier: "high", perfCurrent: 1.0 }) === false
		});

		it("returns false when gpuTier='low' (any state)", () => {
			// shouldUseReflector({ uvMode: true, view: "3d", gpuTier: "low", perfCurrent: 1.0 }) === false
		});
	});

	describe("getReflectorResolution", () => {
		it("returns 256 for mid tier", () => {
			// getReflectorResolution("mid") === 256
		});

		it("returns 512 for high tier", () => {
			// getReflectorResolution("high") === 512
		});
	});

	describe("PerformanceMonitor degradation", () => {
		it("returns false when performance.current < 0.5", () => {
			// shouldUseReflector({ uvMode: true, view: "3d", gpuTier: "high", perfCurrent: 0.4 }) === false
		});

		it("returns true when performance.current >= 0.5", () => {
			// shouldUseReflector({ uvMode: true, view: "3d", gpuTier: "high", perfCurrent: 0.5 }) === true
		});
	});
});
```

## Implementation Details

### Current HallFloor Component

The current `HallFloor` component (at `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/HallFloor.tsx`) is simple:

```tsx
import { useStore } from "../../store";

export function HallFloor() {
	const { width, length } = useStore((s) => s.hall);
	const uvMode = useStore((s) => s.ui.uvMode);

	return (
		<mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[width / 2, 0, length / 2]}>
			<planeGeometry args={[width, length]} />
			<meshStandardMaterial color={uvMode ? "#0A0A1A" : "#E0E0E0"} />
		</mesh>
	);
}
```

### Gating Logic (Extract as Pure Functions)

Extract two pure functions from the component so they can be unit-tested without R3F:

**`shouldUseReflector`** -- determines whether to render `MeshReflectorMaterial` or fall back to `MeshStandardMaterial`:

```ts
type ReflectorGateInput = {
	uvMode: boolean;
	view: "top" | "3d";
	gpuTier: "low" | "mid" | "high";
	perfCurrent: number; // 0.0 to 1.0 from PerformanceMonitor
};

export function shouldUseReflector(input: ReflectorGateInput): boolean {
	// All three conditions must be true, AND performance must be above threshold
	// uvMode === true AND view === "3d" AND gpuTier !== "low" AND perfCurrent >= 0.5
}
```

**`getReflectorResolution`** -- returns the FBO resolution based on GPU tier:

```ts
export function getReflectorResolution(gpuTier: "low" | "mid" | "high"): number {
	// mid → 256, high → 512
	// low should never be called (gated out), but return 256 as safe default
}
```

### MeshReflectorMaterial Configuration

When the reflector is active, use `MeshReflectorMaterial` from `@react-three/drei` with these props:

| Prop | Value | Notes |
|------|-------|-------|
| `resolution` | 256 (mid) / 512 (high) | From `getReflectorResolution` |
| `blur` | `[200, 100]` | Gaussian blur on reflection |
| `mixStrength` | 0.8 | Tune at implementation time, may reduce to 0.4 |
| `mirror` | 0 | No perfect mirror (frosted/diffuse look) |
| `color` | `"#07071A"` | Void color for dark reflection base |
| `roughness` | 0.3 | Slightly rough surface |
| `metalness` | 0.8 | Metallic for reflectivity |

### PerformanceMonitor Integration

The `PerformanceMonitor` component (added in Section 01) provides a `performance.current` value from 0.0 to 1.0. Use `usePerformanceMonitor` from `@react-three/drei` or read the performance state to get the current factor. When `performance.current` drops below 0.5 (sustained poor FPS), disable the reflector by switching to the fallback `MeshStandardMaterial`.

In practice, this means using a `useRef` or state variable to track the current performance factor, updated by the `PerformanceMonitor`'s `onChange` callback (or drei's `usePerformanceMonitor` hook if available). The `shouldUseReflector` function receives this value.

### Component Structure

The updated `HallFloor` component should:

1. Read `uvMode`, `view`, and `gpuTier` from the Zustand store.
2. Track `perfCurrent` via a ref updated by the performance monitor.
3. Call `shouldUseReflector(...)` to decide which material to render.
4. Conditionally render either `<MeshReflectorMaterial .../>` or `<meshStandardMaterial .../>`.
5. The mesh itself (plane geometry, position, rotation, receiveShadow) stays the same regardless of material.

The component signature stays the same (no new props). All data comes from Zustand and the performance monitor.

### Fallback Material

When the reflector is not active (gating returns false), render the same `meshStandardMaterial` as before. The color depends on `uvMode`:
- UV mode: `"#07071A"` (void -- slightly different from the old `"#0A0A1A"`, updated to match the new palette)
- Planning mode: `"#E0E0E0"` (light gray, unless Section 03 dark-theme changes this)

### Import Requirements

The `MeshReflectorMaterial` component is exported from `@react-three/drei`. It is already a project dependency (version 10.7.7). No new package installation is needed.

```ts
import { MeshReflectorMaterial } from "@react-three/drei";
```

### Frameloop Consideration

`MeshReflectorMaterial` renders to a frame buffer object (FBO) each frame to capture reflections. This requires `frameloop="always"` on the Canvas. Section 05 already implements this: when `uvMode && gpuTier !== "low"`, the frameloop switches to `"always"`. Since the reflector is only active under those same conditions, the frameloop will always be in the correct mode when the reflector is rendering.

In `frameloop="demand"` mode (planning mode, or UV mode on low tier), the reflector is never active, so there is no mismatch.

## Implementation Checklist

1. [x] Write tests in `tests/reflections.test.ts` — 10 tests covering all gating logic and resolution derivation.
2. [x] Extract `shouldUseReflector` and `getReflectorResolution` as exported pure functions in `src/components/three/HallFloor.tsx`.
3. [x] Update `HallFloor` to conditionally render `MeshReflectorMaterial` when gating passes.
4. [x] Configure reflector properties (resolution, blur, mixStrength, mirror, color, roughness, metalness).
5. [x] Add PerformanceMonitor degradation tracking — uses `useState` + `useRef` guard (not bare `useRef`) so threshold crossing triggers re-render. Reads `state.performance.current` via R3F `useFrame`.
6. [x] Verify fallback to standard material when conditions are not met.
7. [x] Run `npm test` — 327 tests pass (10 new).
8. [x] Run `npx tsc --noEmit` — zero errors.
9. [ ] Visual verification pending.

## Deviations from Plan

- **Performance tracking**: Plan suggested `useRef` but code review identified this never triggers re-render. Fixed to use `useState` with a `useRef` guard that only calls `setPerfOk` when crossing the 0.5 threshold, avoiding unnecessary re-renders while remaining reactive.
- **UV fallback color**: Updated from `#0A0A1A` to `#07071A` per plan spec.