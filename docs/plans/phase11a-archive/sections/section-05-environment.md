Now I have comprehensive context on the codebase. Let me generate the section content.

# Section 05: Environment + SoftShadows + Fog + Canvas GL

## Overview

This section implements the 3D environment enhancements for the GOLF FORGE visual identity. It adds a drei `<Environment>` with the night preset, custom `<Lightformer>` elements simulating UV tube reflections, tier-gated `<SoftShadows>`, view-gated exponential fog, Canvas GPU hints, the frameloop strategy, and a dev-only FPS counter. Together, these create the atmospheric foundation that the post-processing (section-06), reflections (section-07), UV lighting (section-08), and GodRays (section-09) sections build upon.

**Estimated effort**: 1 day

## Dependencies

- **section-01-gpu-tier** (MUST be completed first): This section relies on:
  - `gpuTier` field in Zustand UIState (`"low" | "mid" | "high"`)
  - `transitioning` field in Zustand UIState (boolean)
  - `gpuTierOverride` in persisted settings
  - Store version v7 with migration
  - The `useGpuTier` hook or equivalent mechanism for reading the tier

This section does NOT depend on section-02 (theme tokens), section-03 (dark theme), or section-04 (data panels).

## Tests First

All tests go in `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/utils/environment.test.ts`. Follow the existing project test conventions: Vitest with `describe/it/expect`, pure logic tests (no R3F component rendering).

The tests validate three pure-logic gating functions that will be extracted from the component into a testable utility module.

### Test File: `tests/utils/environment.test.ts`

```ts
import { describe, expect, it } from "vitest";
import {
  shouldEnableFog,
  deriveFrameloop,
  shouldEnableSoftShadows,
} from "../../src/utils/environmentGating";

// ---------------------------------------------------------------------------
// Fog gating
// ---------------------------------------------------------------------------

describe("shouldEnableFog", () => {
  it("returns true when uvMode=true AND view='3d'", () => {
    expect(shouldEnableFog(true, "3d")).toBe(true);
  });

  it("returns false when uvMode=true AND view='top' (orthographic)", () => {
    expect(shouldEnableFog(true, "top")).toBe(false);
  });

  it("returns false when uvMode=false AND view='3d'", () => {
    expect(shouldEnableFog(false, "3d")).toBe(false);
  });

  it("returns false when uvMode=false AND view='top'", () => {
    expect(shouldEnableFog(false, "top")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Frameloop derived state
// ---------------------------------------------------------------------------

describe("deriveFrameloop", () => {
  it("returns 'demand' when uvMode=false", () => {
    expect(deriveFrameloop(false, "low", false)).toBe("demand");
  });

  it("returns 'demand' when uvMode=true + gpuTier='low'", () => {
    expect(deriveFrameloop(true, "low", false)).toBe("demand");
  });

  it("returns 'always' when uvMode=true + gpuTier='mid'", () => {
    expect(deriveFrameloop(true, "mid", false)).toBe("always");
  });

  it("returns 'always' when uvMode=true + gpuTier='high'", () => {
    expect(deriveFrameloop(true, "high", false)).toBe("always");
  });

  it("returns 'always' when transitioning=true regardless of tier", () => {
    expect(deriveFrameloop(false, "low", true)).toBe("always");
    expect(deriveFrameloop(false, "mid", true)).toBe("always");
    expect(deriveFrameloop(false, "high", true)).toBe("always");
  });

  it("returns 'always' when transitioning=true AND uvMode=true", () => {
    expect(deriveFrameloop(true, "mid", true)).toBe("always");
  });
});

// ---------------------------------------------------------------------------
// SoftShadows gating
// ---------------------------------------------------------------------------

describe("shouldEnableSoftShadows", () => {
  it("returns true for mid tier", () => {
    expect(shouldEnableSoftShadows("mid")).toBe(true);
  });

  it("returns true for high tier", () => {
    expect(shouldEnableSoftShadows("high")).toBe(true);
  });

  it("returns false for low tier", () => {
    expect(shouldEnableSoftShadows("low")).toBe(false);
  });
});
```

## Implementation Details

### New File: `src/utils/environmentGating.ts`

This module exports three pure functions that encapsulate the gating logic for environment features. Extracting these from the R3F component enables unit testing without needing a 3D rendering context.

**File path**: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/utils/environmentGating.ts`

```ts
import type { ViewMode } from "../types/ui";

/** GPU tier as defined by section-01 */
export type GpuTier = "low" | "mid" | "high";

/**
 * Fog should only render in UV mode AND 3D perspective view.
 * Exponential fog in orthographic (top-down) view creates uniform
 * darkening with no atmospheric value (all fragments at similar camera distance).
 */
export function shouldEnableFog(uvMode: boolean, view: ViewMode): boolean {
  return uvMode && view === "3d";
}

/**
 * Derive the Canvas frameloop mode from current state.
 *
 * "always" is needed when:
 * - UV transition is in progress (animated overlay)
 * - UV mode is active AND GPU tier is mid or high (animated effects:
 *   Sparkles, SoftShadows, MeshReflectorMaterial, GodRays)
 *
 * Low-tier GPUs always use "demand" (they only get static Bloom + Vignette).
 */
export function deriveFrameloop(
  uvMode: boolean,
  gpuTier: GpuTier,
  transitioning: boolean,
): "always" | "demand" {
  const needsAlways = transitioning || (uvMode && gpuTier !== "low");
  return needsAlways ? "always" : "demand";
}

/**
 * SoftShadows are only enabled on mid and high tier GPUs.
 * They require continuous rendering (always frameloop) and use PCSS
 * which is too expensive for low-tier hardware.
 */
export function shouldEnableSoftShadows(gpuTier: GpuTier): boolean {
  return gpuTier === "mid" || gpuTier === "high";
}
```

### Modified File: `src/App.tsx`

**File path**: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/App.tsx`

Changes to the `<Canvas>` element in `App.tsx`:

1. **Frameloop**: Replace the hardcoded `frameloop="demand"` with a computed value using `deriveFrameloop()`. Read `uvMode`, `gpuTier`, and `transitioning` from the Zustand store.

2. **Canvas `gl` props**: Add `powerPreference: "high-performance"` to hint the browser to use the discrete GPU (if available). This goes into the existing `gl` prop object alongside `antialias` and `preserveDrawingBuffer`.

3. **DPR**: Adjust DPR based on GPU tier. Currently the code uses `dpr={isMobile ? [1, 1.5] : [1, 2]}`. After this change, the upper DPR bound should respect the GPU tier: low=1.0, mid=1.5, high=2.0 (desktop). On mobile, cap at 1.5 for all tiers.

4. **Shadows**: The `shadows` prop on `<Canvas>` currently conditionally uses `"soft"`. After section-01 is in place, the shadows prop should also be tier-aware: `shadows={shouldEnableSoftShadows(gpuTier) ? "soft" : true}`. On mobile, always use `shadows={true}` (never `"soft"` -- 40% cheaper). Note: mobile shadow optimization is also covered in section-11 (perf fixes), but the Canvas-level `shadows` prop change belongs here since it is part of the frameloop/Canvas GL configuration.

5. **Renderer toneMapping**: Set `toneMapping` to `THREE.NoToneMapping` in the `gl` prop. This prevents double tone mapping -- the ToneMapping postprocessing effect (section-06) will handle it instead. Import `NoToneMapping` from `three`.

Key changes (conceptual, not full code):

```tsx
import { deriveFrameloop } from "./utils/environmentGating";
import { NoToneMapping } from "three";

// Inside the component:
const uvMode = useStore((s) => s.ui.uvMode);
const gpuTier = useStore((s) => s.ui.gpuTier);
const transitioning = useStore((s) => s.ui.transitioning);
const frameloop = deriveFrameloop(uvMode, gpuTier, transitioning);

// On the Canvas element:
<Canvas
  dpr={/* tier-aware DPR logic */}
  frameloop={frameloop}
  shadows={/* tier-aware shadows logic */}
  gl={{
    antialias: !isMobile,
    preserveDrawingBuffer: true,
    powerPreference: "high-performance",
    toneMapping: NoToneMapping,
  }}
>
```

### Modified File: `src/components/three/ThreeCanvas.tsx`

**File path**: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/ThreeCanvas.tsx`

This is the inner scene component (child of `<Canvas>`). It currently contains lighting, fog, and renders all scene children. Changes:

1. **Replace linear fog with exponential fog, view-gated**:
   - Remove: `{uvMode && <fog attach="fog" args={["#0A0A1A", 8, 25]} />}`
   - Add: `{shouldEnableFog(uvMode, view) && <fogExp2 attach="fog" args={["#07071A", 0.04]} />}`
   - Import `shouldEnableFog` from `../../utils/environmentGating`
   - Read `view` from Zustand: `const view = useStore((s) => s.ui.view);`
   - When fog is disabled (top-down view or planning mode), attach `null` to clear any previously attached fog: add `{!shouldEnableFog(uvMode, view) && <primitive object={null} attach="fog" />}` or use a `useEffect` to set `scene.fog = null`.

2. **Add drei `<Environment>`**:
   - Import `Environment` from `@react-three/drei`
   - Render `<Environment preset="night" environmentIntensity={0.15} background={false} />` inside the scene
   - The `night` preset provides subtle dark ambient lighting suitable for the blacklight aesthetic
   - `background={false}` prevents a skybox from rendering (the hall walls define the visual space)

3. **Add `<Lightformer>` elements inside `<Environment>`**:
   - Import `Lightformer` from `@react-three/drei`
   - Add lightformers inside the `<Environment>` component to simulate UV tube strip reflections in the cubemap
   - These bake into the environment map for subtle PBR reflections on metallic surfaces
   - Position them corresponding to the UV lamp ceiling positions from section-08

   ```tsx
   <Environment preset="night" environmentIntensity={0.15} background={false}>
     <Lightformer
       form="rect"
       intensity={0.4}
       color="#8800FF"
       position={[2.5, 4.3, 5]}
       rotation-x={Math.PI / 2}
       scale={[0.3, 2, 1]}
     />
     {/* ...repeat for other 3 positions */}
   </Environment>
   ```

4. **Add `<SoftShadows>` (tier-gated)**:
   - Import `SoftShadows` from `@react-three/drei`
   - Import `shouldEnableSoftShadows` from `../../utils/environmentGating`
   - Read `gpuTier` from Zustand: `const gpuTier = useStore((s) => s.ui.gpuTier);`
   - Conditionally render: `{shouldEnableSoftShadows(gpuTier) && <SoftShadows size={25} samples={10} />}`
   - SoftShadows uses PCSS (Percentage-Closer Soft Shadows) which requires continuous rendering -- this is handled by the frameloop strategy in `App.tsx`

5. **Add dev-only `<Stats />`**:
   - Import `Stats` from `@react-three/drei`
   - Render conditionally: `{import.meta.env.DEV && <Stats />}`
   - This shows an FPS counter during development for performance verification
   - Remove or keep gated behind `DEV` before shipping

6. **Add `<PerformanceMonitor>`**:
   - Import `PerformanceMonitor` from `@react-three/drei`
   - Wrap the scene content or add as a sibling: `<PerformanceMonitor onDecline={() => performance.regress()} />`
   - This monitors FPS and provides a `performance.current` value (0-1) that other components (section-07 MeshReflectorMaterial) can use to degrade gracefully
   - Note: `PerformanceMonitor` could alternatively go in `App.tsx` as a child of `<Canvas>`. Placing it in `ThreeCanvas.tsx` keeps all scene-level concerns together.

### Conceptual structure of modified `ThreeCanvas.tsx`:

```tsx
import { Environment, Lightformer, PerformanceMonitor, SoftShadows, Stats } from "@react-three/drei";
import { shouldEnableFog, shouldEnableSoftShadows } from "../../utils/environmentGating";

export default function ThreeCanvas({ sunData }: ThreeCanvasProps) {
  const uvMode = useStore((s) => s.ui.uvMode);
  const view = useStore((s) => s.ui.view);
  const gpuTier = useStore((s) => s.ui.gpuTier);

  const fogEnabled = shouldEnableFog(uvMode, view);

  return (
    <>
      {/* Fog: exponential, only in UV mode + 3D perspective view */}
      {fogEnabled && <fogExp2 attach="fog" args={["#07071A", 0.04]} />}

      {/* Environment with UV tube lightformers for PBR reflections */}
      <Environment preset="night" environmentIntensity={0.15} background={false}>
        <Lightformer form="rect" intensity={0.4} color="#8800FF"
          position={[2.5, 4.3, 5]} rotation-x={Math.PI / 2} scale={[0.3, 2, 1]} />
        <Lightformer form="rect" intensity={0.4} color="#8800FF"
          position={[7.5, 4.3, 5]} rotation-x={Math.PI / 2} scale={[0.3, 2, 1]} />
        <Lightformer form="rect" intensity={0.4} color="#8800FF"
          position={[2.5, 4.3, 15]} rotation-x={Math.PI / 2} scale={[0.3, 2, 1]} />
        <Lightformer form="rect" intensity={0.4} color="#8800FF"
          position={[7.5, 4.3, 15]} rotation-x={Math.PI / 2} scale={[0.3, 2, 1]} />
      </Environment>

      {/* SoftShadows: PCSS, mid+high tier only */}
      {shouldEnableSoftShadows(gpuTier) && <SoftShadows size={25} samples={10} />}

      {/* Performance monitoring for adaptive degradation */}
      <PerformanceMonitor />

      {/* Dev-only FPS counter */}
      {import.meta.env.DEV && <Stats />}

      {/* Existing scene content */}
      <ambientLight ... />
      <directionalLight ... />
      <CameraControls />
      <FloorGrid />
      <Hall sunData={sunData} />
      <PlacementHandler />
      <PlacedHoles />
      <FlowPath />
      <SunIndicator sunData={sunData} />
      <UVEffects />
      <ScreenshotCapture />
    </>
  );
}
```

## Fog Clearing Strategy

When fog transitions from enabled to disabled (e.g., user switches from 3D view to top-down while in UV mode), the previously attached `fogExp2` must be removed from the scene. R3F's `attach="fog"` will set `scene.fog`, but removing the JSX element does not automatically clear `scene.fog` back to `null`.

Two approaches:

**Option A**: Use a `useEffect` to clear fog when the condition changes:

```tsx
import { useThree } from "@react-three/fiber";

const scene = useThree((s) => s.scene);

useEffect(() => {
  if (!fogEnabled) {
    scene.fog = null;
  }
}, [fogEnabled, scene]);
```

**Option B**: Always render a fog element but toggle between `fogExp2` and a null assignment. Option A is simpler and more explicit.

## Lightformer Positions

The four lightformer positions correspond to the UV lamp positions defined in the architecture. These are the same positions that section-08 (UV Lighting) will use for `RectAreaLight` placement:

| Index | Position (x, y, z) | Description |
|-------|-------------------|-------------|
| 0 | (2.5, 4.3, 5) | Front-left ceiling |
| 1 | (7.5, 4.3, 5) | Front-right ceiling |
| 2 | (2.5, 4.3, 15) | Back-left ceiling |
| 3 | (7.5, 4.3, 15) | Back-right ceiling |

The hall dimensions are 10m wide (x-axis) and 20m long (z-axis) with a 4.3m wall height (y-axis). The lightformers are distributed evenly at quarter-width positions and at z=5 and z=15 (quarter-length positions).

Consider extracting these positions as a shared constant (e.g., in `src/constants/uvLamps.ts`) so that section-08 (RectAreaLight positions) and section-09 (GodRays source positions) can reuse them without duplication:

```ts
// src/constants/uvLamps.ts
export const UV_LAMP_POSITIONS: [number, number, number][] = [
  [2.5, 4.3, 5],
  [7.5, 4.3, 5],
  [2.5, 4.3, 15],
  [7.5, 4.3, 15],
];

export const UV_LAMP_COLOR = "#8800FF";
export const UV_LAMP_INTENSITY = 0.8;
export const UV_LAMP_WIDTH = 0.3;
export const UV_LAMP_HEIGHT = 2;
```

## Canvas GL Props Summary

After this section, the `<Canvas>` `gl` prop in `App.tsx` should include:

| Property | Value | Reason |
|----------|-------|--------|
| `antialias` | `!isMobile` | Existing -- disable on mobile for perf |
| `preserveDrawingBuffer` | `true` | Existing -- needed for screenshot export |
| `powerPreference` | `"high-performance"` | New -- hint to use discrete GPU |
| `toneMapping` | `NoToneMapping` (from three) | New -- prevents double tone mapping with the postprocessing ToneMapping effect (section-06) |

## DPR Strategy

The device pixel ratio should respect GPU tier:

| Scenario | DPR |
|----------|-----|
| Mobile (any tier) | `[1, 1.5]` (current behavior, keep as-is) |
| Desktop, low tier | `[1, 1.0]` |
| Desktop, mid tier | `[1, 1.5]` |
| Desktop, high tier | `[1, 2.0]` |

Implementation:

```ts
function getDpr(gpuTier: GpuTier): [number, number] {
  if (isMobile) return [1, 1.5];
  switch (gpuTier) {
    case "low": return [1, 1];
    case "mid": return [1, 1.5];
    case "high": return [1, 2];
  }
}
```

This could be added to `environmentGating.ts` or kept inline in `App.tsx`.

## Manual Verification Checklist

These items cannot be automated with Vitest (they require visual/runtime verification):

- [ ] Canvas `gl` prop includes `powerPreference: "high-performance"` (inspect via browser devtools or code review)
- [ ] `<Environment>` component renders with `background={false}` (no skybox visible)
- [ ] `<Stats />` component only visible when `import.meta.env.DEV` is true (run `npm run dev` vs `npm run build && npm run preview`)
- [ ] Fog is visible in UV mode + 3D perspective view (dark atmospheric effect)
- [ ] Fog is NOT visible in UV mode + top-down orthographic view
- [ ] Fog is NOT visible in planning mode (uvMode off)
- [ ] SoftShadows visually active on mid/high tier GPUs (shadow edges are soft, not hard)
- [ ] SoftShadows not active on low tier (hard shadow edges or no shadows)
- [ ] Lightformers produce subtle UV-tinted reflections on metallic/glossy surfaces in the scene
- [ ] Frameloop switches between `"demand"` and `"always"` when UV mode toggles (verify via Stats FPS counter in dev mode -- demand mode shows ~0 FPS when idle, always mode shows continuous FPS)

## File Summary

| File | Action | Description |
|------|--------|-------------|
| `src/utils/environmentGating.ts` | **Create** | Pure gating functions: `shouldEnableFog`, `deriveFrameloop`, `shouldEnableSoftShadows` |
| `src/constants/uvLamps.ts` | **Create** | Shared UV lamp position/color/dimension constants (optional, but recommended for section-08/09 reuse) |
| `tests/utils/environment.test.ts` | **Create** | Vitest tests for all gating logic |
| `src/App.tsx` | **Modify** | Canvas `gl` props (powerPreference, toneMapping), frameloop strategy, DPR |
| `src/components/three/ThreeCanvas.tsx` | **Modify** | Environment, Lightformers, SoftShadows, fogExp2, PerformanceMonitor, Stats |

## TODO Checklist

1. Write the test file `tests/utils/environment.test.ts` with all gating logic tests
2. Create `src/utils/environmentGating.ts` with `shouldEnableFog`, `deriveFrameloop`, `shouldEnableSoftShadows`
3. Run tests -- confirm all pass
4. Create `src/constants/uvLamps.ts` with shared lamp position constants
5. Modify `src/App.tsx`:
   - Import `deriveFrameloop` and `NoToneMapping`
   - Read `gpuTier` and `transitioning` from Zustand store
   - Compute `frameloop` using `deriveFrameloop()`
   - Update Canvas `gl` prop with `powerPreference` and `toneMapping`
   - Update Canvas `dpr` prop to be tier-aware
   - Update Canvas `shadows` prop to be tier-aware
6. Modify `src/components/three/ThreeCanvas.tsx`:
   - Import `Environment`, `Lightformer`, `SoftShadows`, `Stats`, `PerformanceMonitor` from drei
   - Import gating functions from `environmentGating`
   - Read `view` and `gpuTier` from Zustand
   - Replace linear fog with view-gated exponential fog
   - Add fog clearing logic (useEffect to set `scene.fog = null` when disabled)
   - Add `<Environment>` with night preset and 4 `<Lightformer>` elements
   - Add tier-gated `<SoftShadows>`
   - Add `<PerformanceMonitor>`
   - Add dev-only `<Stats />`
7. Run `npx tsc --noEmit` to verify no type errors
8. Run `npm test` to verify all tests pass (existing 229 + new environment tests)
9. Manual verification of visual behavior in dev server