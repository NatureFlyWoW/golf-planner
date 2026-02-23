Now I have comprehensive context. Let me generate the section content.

# Section 9: Performance, Polish & Edge Cases

## Overview

This is the final integration section for Split 05 (3D Environment). It verifies all preceding sections work together correctly, runs the full regression suite, handles edge cases, and polishes the walkthrough transitions. This section depends on all of sections 01-08 being complete.

## Dependencies

- **Section 01**: Walkthrough store state, `enterWalkthrough()`, `exitWalkthrough()`, `deriveFrameloop()` updated with `walkthroughMode` param
- **Section 02**: `WalkthroughController`, movement math, `getWalkthroughSpawnPoint()`
- **Section 03**: `checkWalkthroughCollision()`, `getDoorZones()` in `src/utils/walkthroughCollision.ts`
- **Section 04**: Keyboard integration (F key, Escape), `WalkthroughOverlay` component
- **Section 05**: `GroundPlane`, environment layer (`"environment"` in `LayerId`, `LAYER_DEFINITIONS`, `DEFAULT_LAYERS`), `shouldShowGroundTexture()`
- **Section 06**: `HallRoof`, `HallFoundation`, exterior wall meshes
- **Section 07**: `SkyEnvironment`, `shouldShowSky()`, `shouldEnableNormalFog()`, updated `shouldEnableFog()`
- **Section 08**: Overview preset in `getCameraPresets()` (7 presets), ground clamp

## Tests

Test files for this section reside in existing test infrastructure. No new test files are created — this section extends and validates across existing tests.

### Test File: `tests/utils/environment.test.ts` (extend existing)

This file currently tests `shouldEnableFog`, `deriveFrameloop`, `shouldEnablePostProcessing`, and `shouldEnableSoftShadows`. Section 09 extends it with walkthrough integration and new gating functions from sections 01, 07.

```ts
// tests/utils/environment.test.ts (additions for section 09)

import {
  deriveFrameloop,
  shouldEnableNormalFog,
  shouldShowGroundTexture,
  shouldShowSky,
} from "../../src/utils/environmentGating";

describe("deriveFrameloop (walkthrough integration)", () => {
  it('returns "always" when walkthroughMode=true, gpuTier="low", uvMode=false', () => {
    expect(deriveFrameloop(false, "low", false, "3d-only", true)).toBe("always");
  });

  it('returns "always" when walkthroughMode=true, gpuTier="high", uvMode=true', () => {
    expect(deriveFrameloop(true, "high", false, "3d-only", true)).toBe("always");
  });

  it("walkthroughMode=false preserves existing behavior for all prior cases", () => {
    // UV off, 3d-only, no transition → demand
    expect(deriveFrameloop(false, "low", false, "3d-only", false)).toBe("demand");
    // dual → always
    expect(deriveFrameloop(false, "mid", false, "dual", false)).toBe("always");
    // transitioning → always
    expect(deriveFrameloop(false, "low", true, "3d-only", false)).toBe("always");
  });
});

describe("shouldShowSky (cross-check with section 07)", () => {
  it("returns true for normal mode + mid/high GPU", () => {
    expect(shouldShowSky(false, "mid")).toBe(true);
    expect(shouldShowSky(false, "high")).toBe(true);
  });

  it("returns false in UV mode regardless of tier", () => {
    expect(shouldShowSky(true, "mid")).toBe(false);
    expect(shouldShowSky(true, "high")).toBe(false);
    expect(shouldShowSky(true, "low")).toBe(false);
  });

  it("returns false for low tier in normal mode", () => {
    expect(shouldShowSky(false, "low")).toBe(false);
  });
});

describe("shouldEnableNormalFog (cross-check with section 07)", () => {
  it('returns true for ("3d-only", uvMode=false, envVisible=true)', () => {
    expect(shouldEnableNormalFog("3d-only", false, true)).toBe(true);
  });

  it('returns false in "dual" layout (fog bleeds into 2D pane)', () => {
    expect(shouldEnableNormalFog("dual", false, true)).toBe(false);
  });

  it("returns false in UV mode (UV mode uses its own fogExp2)", () => {
    expect(shouldEnableNormalFog("3d-only", true, true)).toBe(false);
  });

  it("returns false when environment layer hidden", () => {
    expect(shouldEnableNormalFog("3d-only", false, false)).toBe(false);
  });
});

describe("shouldShowGroundTexture (cross-check with section 05)", () => {
  it('returns false for "low" tier', () => {
    expect(shouldShowGroundTexture("low")).toBe(false);
  });

  it('returns true for "mid" tier', () => {
    expect(shouldShowGroundTexture("mid")).toBe(true);
  });

  it('returns true for "high" tier', () => {
    expect(shouldShowGroundTexture("high")).toBe(true);
  });
});
```

### Test File: `tests/store/walkthrough.test.ts` (cross-check — from section 01)

Section 09 verifies the critical lifecycle scenario: frameloop returns to `"demand"` after walkthrough exit, and layout is restored correctly from all starting layouts.

```ts
// tests/store/walkthrough.test.ts (additions for section 09 cross-check)

describe("Walkthrough lifecycle integration (section 09)", () => {
  it("frameloop returns to demand after exitWalkthrough from 3d-only layout", () => {
    // Start in 3d-only, no UV, no transition
    useStore.getState().setViewportLayout("3d-only");
    useStore.getState().enterWalkthrough();
    // walkthrough forces "always"
    const stateInWT = useStore.getState().ui;
    const flInWT = deriveFrameloop(false, "low", false, stateInWT.viewportLayout, stateInWT.walkthroughMode);
    expect(flInWT).toBe("always");

    // Exit walkthrough
    useStore.getState().exitWalkthrough();
    const stateAfter = useStore.getState().ui;
    const flAfter = deriveFrameloop(false, "low", false, stateAfter.viewportLayout, stateAfter.walkthroughMode);
    expect(flAfter).toBe("demand");
  });

  it("enterWalkthrough from 2d-only layout transitions to 3d-only", () => {
    useStore.getState().setViewportLayout("2d-only");
    useStore.getState().enterWalkthrough();
    expect(useStore.getState().ui.viewportLayout).toBe("3d-only");
    expect(useStore.getState().ui.previousViewportLayout).toBe("2d-only");
  });

  it("exitWalkthrough from stored 2d-only restores 2d-only", () => {
    useStore.getState().setViewportLayout("2d-only");
    useStore.getState().enterWalkthrough();
    useStore.getState().exitWalkthrough();
    expect(useStore.getState().ui.viewportLayout).toBe("2d-only");
  });

  it("exitWalkthrough from stored dual restores dual", () => {
    useStore.getState().setViewportLayout("dual");
    useStore.getState().enterWalkthrough();
    useStore.getState().exitWalkthrough();
    expect(useStore.getState().ui.viewportLayout).toBe("dual");
  });

  it("walkthroughMode is false after exitWalkthrough", () => {
    useStore.getState().enterWalkthrough();
    useStore.getState().exitWalkthrough();
    expect(useStore.getState().ui.walkthroughMode).toBe(false);
  });
});
```

### Test File: `tests/utils/cameraPresets.test.ts` (extend — from section 08)

```ts
// Additions to the existing cameraPresets.test.ts describe block

describe("Overview preset (section 08 / section 09 verification)", () => {
  it("getCameraPresets returns 7 presets including overview", () => {
    const presets = getCameraPresets(10, 20);
    expect(Object.keys(presets)).toHaveLength(7);
    expect(presets).toHaveProperty("overview");
  });

  it("overview preset position is outside hall perimeter", () => {
    const presets = getCameraPresets(10, 20);
    const pos = presets.overview.position;
    // At least one axis should be outside the hall bounds
    const outsideX = pos[0] < 0 || pos[0] > 10;
    const outsideZ = pos[2] < 0 || pos[2] > 20;
    const elevated = pos[1] > 10;
    expect(outsideX || outsideZ || elevated).toBe(true);
  });

  it("overview preset target is at hall center", () => {
    const presets = getCameraPresets(10, 20);
    expect(presets.overview.target[0]).toBeCloseTo(5);
    expect(presets.overview.target[2]).toBeCloseTo(10);
  });
});
```

### Regression Guard (no new test file needed)

The existing 639+ Vitest tests serve as the regression suite. Run `npm run test` after each section to confirm zero regressions. Section 09 implementation work should not break any existing tests.

## Implementation Tasks

### 1. Verify `deriveFrameloop` Signature

The signature was updated in Section 01 to accept `walkthroughMode` as a 5th parameter. Confirm the call site in `src/components/layout/DualViewport.tsx` passes `walkthroughMode`:

```ts
// src/components/layout/DualViewport.tsx (call site must match updated signature)
const frameloop = deriveFrameloop(uvMode, gpuTier, transitioning, viewportLayout, walkthroughMode);
```

If `deriveFrameloop` still has the 4-parameter signature from before Split 05, update it as part of section 09 verification. The signature in `src/utils/environmentGating.ts` must be:

```ts
export function deriveFrameloop(
  uvMode: boolean,
  gpuTier: GpuTier,
  transitioning: boolean,
  viewportLayout: ViewportLayout,
  walkthroughMode: boolean,
): "always" | "demand"
```

The implementation logic: when `walkthroughMode === true`, return `"always"` immediately (before all other checks).

### 2. Add New Gating Functions to `environmentGating.ts`

File: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/utils/environmentGating.ts`

Add the following exports alongside existing ones:

```ts
/**
 * Sky (drei <Sky>) is only shown in normal mode on mid/high GPU tiers.
 * In UV mode, the dark void / night environment is used instead.
 * Low-tier GPUs use a flat background color only.
 */
export function shouldShowSky(uvMode: boolean, gpuTier: GpuTier): boolean

/**
 * Ground texture (asphalt normal + roughness maps) is only loaded on mid/high GPUs.
 * Low-tier GPUs get a flat gray color.
 */
export function shouldShowGroundTexture(gpuTier: GpuTier): boolean

/**
 * Normal-mode fog (linear, for ground plane edge fade) is only enabled:
 * - In 3d-only layout (scene-level fog bleeds into 2D pane in dual mode)
 * - When NOT in UV mode (UV mode uses existing fogExp2)
 * - When environment layer is visible
 */
export function shouldEnableNormalFog(
  viewportLayout: ViewportLayout,
  uvMode: boolean,
  envLayerVisible: boolean,
): boolean
```

### 3. GPU Tier Gating Verification

Cross-reference all environment components against the gating table. Review each component to confirm correct behaviour:

| Feature | Low GPU | Mid GPU | High GPU |
|---------|---------|---------|---------|
| Walkthrough | Yes | Yes | Yes |
| Ground plane | Flat `meshBasicMaterial` (#808080) | `meshStandardMaterial` + color map | + normal + roughness maps |
| Hall exterior (roof + foundation) | Visible, no textures | Visible, textures | Visible, full PBR |
| Sky (`<Sky>` component) | No — flat background color only | Yes | Yes |
| Normal-mode fog (3d-only) | Basic linear fog | Standard linear fog | Standard linear fog |

Confirm each environment component (`GroundPlane`, `HallRoof`, `HallFoundation`, exterior walls in `HallWalls`, `SkyEnvironment`) reads `gpuTier` and branches correctly.

### 4. Mobile Walkthrough Disabled Confirmation

Verify `enterWalkthrough()` in the store action checks `isMobile()` (from `src/utils/isMobile.ts`) and early-returns without changing any state. Confirm the walkthrough toolbar button is hidden on mobile via `md:hidden` or similar Tailwind class. No tests beyond section 01 are needed here — validate by reading the implementation code.

### 5. UV Mode Toggle During Walkthrough

This edge case is reactive-by-design: `SkyEnvironment`, fog, and background color are all driven by store selectors. Toggling `uvMode` during walkthrough should Just Work. Verify no `useEffect` in any environment component has `walkthroughMode` as a dependency that could cause unexpected unmounts.

The potential crash scenario: if `SkyEnvironment` mounts/unmounts based on `uvMode` while walkthrough is active, and some `useFrame` callback in `WalkthroughController` holds a stale ref to the camera that was restored. This is avoided by ensuring `WalkthroughController` reads the camera from `useThree` (not from a stored ref), so remounting sibling components cannot affect it.

### 6. Transition Polish — Camera Descent/Ascent Animation

This is the most implementationally complex part of section 09. The walkthrough enter/exit transitions should animate camera position instead of snapping.

**Enter transition** (~0.5 seconds):
- Triggered in `WalkthroughController` on mount
- Uses a `useRef<number>` for elapsed time, set to 0 on mount
- In `useFrame`, while elapsed < 0.5: lerp camera position from saved orbit position to spawn point + y=1.7m. Elapsed += delta. After 0.5s, snap to exact spawn position.
- During transition, do not apply WASD movement (player has not yet "arrived")
- Set euler facing north immediately on mount (not animated — prevents nausea)

**Exit transition** (~0.5 seconds):
- Triggered by `exitWalkthrough()` action
- The complication: `WalkthroughController` unmounts when `walkthroughMode` becomes false
- Solution: use a transition state flag in the component. When exit is requested (respond to a `exitRequested` prop or a store `walkthroughExiting` flag), begin the exit lerp animation. Only after animation completes, call the actual `exitWalkthrough()` store action.
- Alternative (simpler): skip the exit animation entirely — snap to orbit restore position. The `CameraControls` setLookAt call in the deferred rAF from Section 01 handles this adequately. Document that enter animation is implemented but exit animation is deferred to a future polish pass.

Given the complexity and the fact that this is a polish item, the recommended implementation is:
- **Enter transition**: implement the 0.5s lerp on mount in `WalkthroughController`
- **Exit transition**: deferred (rAF restore is sufficient for MVP)

### 7. Performance Measurement (manual verification step)

After all sections are complete, manually verify in the browser dev tools:
- Draw call count in 3d-only normal mode before walkthrough: baseline
- Draw call count after walkthrough enter: should increase by < 15 (WalkthroughController renders null, no new draw calls from camera)
- Frameloop mode: confirm it shows "always" during walkthrough and returns to "demand" after exit (visible in React DevTools or via a `console.log` in `deriveFrameloop`)

This is a manual verification step — no automated test is required.

### 8. Environment Layer Test Update

The existing test in `tests/store/viewportLayers.test.ts` asserts `"all 5 layers present"` and checks `toHaveLength(5)`. After Section 05 adds the `"environment"` layer, this test must be updated to `toHaveLength(6)` and include the environment layer assertion.

File: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/store/viewportLayers.test.ts`

Update the `"all 5 layers present"` test:

```ts
it("all 6 layers present", () => {
  const layers = useStore.getState().ui.layers;
  expect(Object.keys(layers)).toHaveLength(6);
  expect(layers).toHaveProperty("holes");
  expect(layers).toHaveProperty("flowPath");
  expect(layers).toHaveProperty("grid");
  expect(layers).toHaveProperty("walls");
  expect(layers).toHaveProperty("sunIndicator");
  expect(layers).toHaveProperty("environment");
});
```

Also update the `beforeEach` reset block to include the environment layer:

```ts
layers: {
  holes: { visible: true, opacity: 1, locked: false },
  flowPath: { visible: true, opacity: 1, locked: false },
  grid: { visible: true, opacity: 1, locked: false },
  walls: { visible: true, opacity: 1, locked: false },
  sunIndicator: { visible: true, opacity: 1, locked: false },
  environment: { visible: true, opacity: 1, locked: false },
},
```

This is a **required fix** — without it, the existing viewportLayers tests will fail after Section 05 adds the environment layer to `DEFAULT_LAYERS`.

### 9. Camera Presets Test Update

The existing `tests/utils/cameraPresets.test.ts` asserts `returns all 6 presets` with `toHaveLength(6)`. After Section 08 adds the `"overview"` preset, this must be updated to `toHaveLength(7)`.

File: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/utils/cameraPresets.test.ts`

Update the `"returns all 6 presets"` test:

```ts
it("returns all 7 presets (top, front, back, left, right, isometric, overview)", () => {
  expect(Object.keys(presets)).toHaveLength(7);
  expect(presets).toHaveProperty("top");
  expect(presets).toHaveProperty("front");
  expect(presets).toHaveProperty("back");
  expect(presets).toHaveProperty("left");
  expect(presets).toHaveProperty("right");
  expect(presets).toHaveProperty("isometric");
  expect(presets).toHaveProperty("overview");
});
```

Also update the `"all presets have targets at approximately hall center"` test — the overview preset target is hall center so this test should continue to pass unchanged.

## Implementation Files Summary

Files to **create** (none in section 09 — all new files created in sections 01-08):
- No new files

Files to **modify** in section 09:

| File | Change |
|------|--------|
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/utils/environmentGating.ts` | Add `shouldShowSky()`, `shouldShowGroundTexture()`, `shouldEnableNormalFog()`. Update `deriveFrameloop()` to accept 5th `walkthroughMode` param. |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/utils/environment.test.ts` | Add tests for `walkthroughMode` in `deriveFrameloop`, `shouldShowSky`, `shouldEnableNormalFog`, `shouldShowGroundTexture`. |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/store/viewportLayers.test.ts` | Update layer count from 5 to 6, add environment layer to `beforeEach` reset and assertion. |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/utils/cameraPresets.test.ts` | Update preset count from 6 to 7, add `overview` to assertions. |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/store/walkthrough.test.ts` | Add lifecycle integration tests (layout round-trip, frameloop leak check). |

Note: `tests/store/walkthrough.test.ts` was created in Section 01. Section 09 only adds the lifecycle integration `describe` block to it.

## Edge Case Checklist

Before marking section 09 complete, verify each of the following manually or through existing test coverage:

- [ ] `npm run test` passes with 639+ tests (all sections merged)
- [ ] `npx tsc --noEmit` produces zero errors
- [ ] `npm run check` (Biome) produces zero errors (tabs for indentation)
- [ ] Entering walkthrough from `"2d-only"` layout: transitions to `"3d-only"` correctly
- [ ] Entering walkthrough from `"dual"` layout: transitions to `"3d-only"` correctly
- [ ] Exiting walkthrough restores `"2d-only"` when that was the previous layout
- [ ] Exiting walkthrough restores `"dual"` when that was the previous layout
- [ ] `deriveFrameloop` returns `"always"` during walkthrough regardless of UV mode or GPU tier
- [ ] `deriveFrameloop` returns to correct non-walkthrough value after exit
- [ ] UV mode toggle during walkthrough does not crash (reactive store selectors handle it)
- [ ] Mobile: walkthrough button is hidden, `enterWalkthrough()` is a no-op
- [ ] Environment layer toggle hides/shows ground, roof, foundation, exterior walls together
- [ ] Fog does not appear in `"dual"` layout in either normal or UV mode