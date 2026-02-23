I now have all the context needed to write the section. Let me produce the content.

# Section 09 -- PostProcessing and Effects Scoping

## Overview

This section gates PostProcessing, UVEffects, and environment-related rendering to behave correctly in the dual-viewport architecture. The core constraint: `@react-three/postprocessing`'s `EffectComposer` takes over the entire Canvas rendering pipeline and does NOT respect `<View>` scissor boundaries. PostProcessing therefore cannot be scoped to a single View.

The solution is straightforward: **disable PostProcessing in dual-pane mode** and only enable it when the 3D pane is expanded to fullscreen (`viewportLayout === "3d-only"`). This section also refactors the environment gating functions (`shouldEnableFog`, `deriveFrameloop`) to accept `viewportLayout` as a parameter, and refactors `ScreenshotCapture` to use a `WebGLRenderTarget` for clean captures that work regardless of viewport mode.

### Dependencies

- **section-02-types-and-store** must be complete (provides `ViewportLayout` type and `viewportLayout` state in the store)
- **section-04-dual-canvas-views** must be complete (provides the dual-View Canvas architecture, `SharedScene.tsx` / `ThreeDOnlyContent.tsx` extraction)

### User-Visible Outcome

In dual-pane mode, the 3D pane shows the scene without postprocessing effects (no bloom, god rays, N8AO, etc.). When the user collapses the layout to 3D-only mode (double-click divider or collapse button), full postprocessing activates -- identical to the current single-canvas 3D experience. The 2D pane never has postprocessing. Screenshots work cleanly in any viewport mode.

---

## Tests First

All tests go in `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/utils/environmentGating.test.ts`. This file already exists with tests for the current `shouldEnableFog`, `deriveFrameloop`, and `shouldEnableSoftShadows` functions. Existing tests must be updated to reflect the new function signatures that accept `viewportLayout`.

### Updated Environment Gating Tests

The existing test file at `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/utils/environment.test.ts` must be updated. The current tests call `shouldEnableFog(uvMode, view)` with a `ViewMode` parameter. After this section, the signature changes to accept `ViewportLayout` instead.

```ts
// File: /mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/utils/environment.test.ts
// Updates to existing tests + new tests

describe("shouldEnableFog (with viewportLayout)", () => {
  // Test: returns false when viewportLayout is "2d-only" regardless of uvMode
  // Test: returns true when uvMode=true AND viewportLayout is "3d-only"
  // Test: returns false when uvMode=false AND viewportLayout is "3d-only"
  // Test: returns true when uvMode=true AND viewportLayout is "dual"
  //   (fog renders in the 3D pane's ThreeDOnlyContent, which checks this)
  // Test: returns false when uvMode=false AND viewportLayout is "dual"
});

describe("deriveFrameloop (with viewportLayout)", () => {
  // Test: accepts viewportLayout as a 4th parameter
  // Test: returns "always" when viewportLayout="dual" AND uvMode=true AND gpuTier != "low"
  //   (3D pane has active UV animations)
  // Test: returns "demand" when viewportLayout="dual" AND uvMode=false AND not transitioning
  //   (no animations in either pane)
  // Test: returns "always" when transitioning=true regardless of viewportLayout
  // Test: existing behavior preserved for "3d-only" (same as current "3d" view)
});

describe("shouldEnablePostProcessing", () => {
  // Test: returns false when viewportLayout is "dual"
  // Test: returns true when viewportLayout is "3d-only"
  // Test: returns false when viewportLayout is "2d-only"
});
```

### PostProcessing/UVEffects Gating Tests

These are architecture-level validations. Because `PostProcessing` and `UVEffects` are R3F components that render `EffectComposer`, they cannot be easily unit-tested without a full R3F context. The gating logic is extracted into a pure utility function `shouldEnablePostProcessing` which IS unit-testable. The component-level wiring (reading `viewportLayout` from store and conditionally rendering) is validated via manual testing and visual regression.

```ts
// In the same test file or a new section

describe("shouldEnablePostProcessing", () => {
  // Test: returns false for "dual" layout
  it('returns false when viewportLayout is "dual"', () => {
    expect(shouldEnablePostProcessing("dual")).toBe(false);
  });

  // Test: returns true for "3d-only" layout
  it('returns true when viewportLayout is "3d-only"', () => {
    expect(shouldEnablePostProcessing("3d-only")).toBe(true);
  });

  // Test: returns false for "2d-only" layout
  it('returns false when viewportLayout is "2d-only"', () => {
    expect(shouldEnablePostProcessing("2d-only")).toBe(false);
  });
});
```

---

## Implementation Details

### 1. New Utility Function: `shouldEnablePostProcessing`

**File:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/utils/environmentGating.ts`

Add a new exported function to the existing environment gating module:

```ts
import type { ViewportLayout } from "../types/viewport";

/**
 * PostProcessing (EffectComposer) cannot be scoped to a single View --
 * it takes over the entire Canvas rendering pipeline.
 * Only enable when the 3D pane is fullscreen (no View splitting).
 */
export function shouldEnablePostProcessing(viewportLayout: ViewportLayout): boolean {
  return viewportLayout === "3d-only";
}
```

This is a simple, pure function. The key insight: postprocessing only works when there is a single View occupying the entire Canvas. In `"dual"` mode there are two Views using scissor, and EffectComposer would bleed across both. In `"2d-only"` mode there is no 3D content to apply effects to.

### 2. Refactor `shouldEnableFog` Signature

**File:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/utils/environmentGating.ts`

The current signature is `shouldEnableFog(uvMode: boolean, view: ViewMode): boolean`. The `ViewMode` parameter (`"top" | "3d"`) is being deprecated for desktop dual-pane mode.

Update the function to accept `ViewportLayout` instead:

```ts
import type { ViewportLayout } from "../types/viewport";

/**
 * Fog should only render in UV mode AND when 3D content is visible.
 * In "dual" mode, fog renders inside ThreeDOnlyContent (3D pane only).
 * In "2d-only" mode, no fog (orthographic view, no atmospheric value).
 * In "3d-only" mode, fog enabled when uvMode is true.
 */
export function shouldEnableFog(uvMode: boolean, viewportLayout: ViewportLayout): boolean {
  if (viewportLayout === "2d-only") return false;
  return uvMode; // "dual" or "3d-only": fog in the 3D pane
}
```

Note: In `"dual"` mode, fog is rendered inside `ThreeDOnlyContent` which is only mounted in the 3D View. The function returns `true` when `uvMode` is active, and the component hierarchy ensures it only affects the 3D pane.

**Backward compatibility for mobile:** Mobile still uses the `ui.view` toggle (`"top" | "3d"`). The mobile code path must map `ViewMode` to `ViewportLayout` before calling this function. The mapping is: `"top"` maps to `"2d-only"`, `"3d"` maps to `"3d-only"`. This can be done at the call site with a simple ternary.

### 3. Refactor `deriveFrameloop` Signature

**File:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/utils/environmentGating.ts`

Add `viewportLayout` as a parameter. In dual mode, the frameloop must account for both panes sharing one Canvas:

```ts
/**
 * Derive the Canvas frameloop mode from current state.
 * "always" when UV effects need continuous rendering, during transitions,
 * or when dual-pane mode has active 3D animations.
 * Low-tier GPUs always use "demand" in UV mode (static effects only).
 */
export function deriveFrameloop(
  uvMode: boolean,
  gpuTier: GpuTier,
  transitioning: boolean,
  viewportLayout: ViewportLayout,
): "always" | "demand" {
  // Transitioning always needs continuous rendering
  if (transitioning) return "always";

  // UV mode with capable GPU needs "always" (sparkles, god rays animate)
  if (uvMode && gpuTier !== "low") return "always";

  // Dual mode: both panes share one frameloop.
  // If no animations, use "demand" with invalidate() on interactions.
  return "demand";
}
```

The `viewportLayout` parameter is accepted for future use (e.g., forcing "always" in dual mode if camera transitions are animating in the 3D pane). For now, the logic is the same regardless of layout -- the key change is updating the function signature and all call sites.

### 4. Update All Call Sites

The following files call the environment gating functions and must be updated:

**`/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/ThreeCanvas.tsx`** (or its refactored successors `SharedScene.tsx` / `ThreeDOnlyContent.tsx` from section-04):

- `shouldEnableFog(uvMode, view)` becomes `shouldEnableFog(uvMode, viewportLayout)`
- The `viewportLayout` value is read from the store: `useStore(s => s.ui.viewportLayout)`

**`/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/App.tsx`**:

- `deriveFrameloop(uvMode, gpuTier, transitioning)` becomes `deriveFrameloop(uvMode, gpuTier, transitioning, viewportLayout)`
- Add `viewportLayout` to the store selector

### 5. Gate PostProcessing Component

**File:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/PostProcessing.tsx`

Add a viewport layout check at the top of the component. If postprocessing should not be enabled, return `null`:

```ts
export default function PostProcessing() {
  const gpuTier = useStore((s) => s.ui.gpuTier);
  const viewportLayout = useStore((s) => s.ui.viewportLayout);
  const godRaysLampRef = useStore((s) => s.ui.godRaysLampRef);

  // PostProcessing (EffectComposer) cannot be scoped to a single View.
  // Only render in 3d-only mode (fullscreen 3D pane).
  if (!shouldEnablePostProcessing(viewportLayout)) return null;

  // ... rest of existing implementation unchanged ...
}
```

Import `shouldEnablePostProcessing` from `../../utils/environmentGating`.

### 6. Gate UVEffects Component

**File:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/UVEffects.tsx`

The `UVEffects` component is a lazy wrapper around `PostProcessing`. Since `PostProcessing` itself now checks `viewportLayout`, `UVEffects` will naturally return `null` when PostProcessing returns `null`. However, adding a check in `UVEffects` avoids even the lazy-load overhead in dual mode:

```ts
export function UVEffects() {
  const uvMode = useStore((s) => s.ui.uvMode);
  const viewportLayout = useStore((s) => s.ui.viewportLayout);

  // No UV effects in non-UV mode or when PostProcessing is disabled
  if (!uvMode) return null;
  if (!shouldEnablePostProcessing(viewportLayout)) return null;

  return (
    <Suspense fallback={null}>
      <PostProcessing />
    </Suspense>
  );
}
```

### 7. Refactor ScreenshotCapture for Dual-View Compatibility

**File:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/ScreenshotCapture.tsx`

The current implementation calls `gl.render(scene, camera)` which renders the full scene to the full Canvas, ignoring View scissor boundaries. In dual mode, this produces a fullscreen render from one camera rather than the dual-pane layout.

**Solution:** Render to an offscreen `WebGLRenderTarget` with a specific camera, then extract the texture as an image. The component lives in `ThreeDOnlyContent` (from section-04) and uses the 3D camera.

```ts
import { useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { WebGLRenderTarget } from "three";
import { useStore } from "../../store";

/**
 * Captures screenshots from the 3D viewport by rendering to an offscreen
 * WebGLRenderTarget. This works correctly regardless of viewport layout
 * (dual-pane, single-pane) because it renders independently of View scissor.
 */
export function ScreenshotCapture() {
  const { gl, scene, camera, size } = useThree();
  const register = useStore((s) => s.registerScreenshotCapture);

  useEffect(() => {
    register(() => {
      // Create a render target matching the current canvas resolution
      const dpr = Math.min(window.devicePixelRatio * 2, 4);
      const width = Math.floor(size.width * dpr);
      const height = Math.floor(size.height * dpr);
      const renderTarget = new WebGLRenderTarget(width, height);

      // Save current state
      const currentRenderTarget = gl.getRenderTarget();
      const currentPixelRatio = gl.getPixelRatio();

      // Render to offscreen target
      gl.setRenderTarget(renderTarget);
      gl.setPixelRatio(1); // Target already has DPR baked into dimensions
      gl.render(scene, camera);

      // Read pixels and create image
      const buffer = new Uint8Array(width * height * 4);
      gl.readRenderTargetPixels(renderTarget, 0, 0, width, height, buffer);

      // Restore state
      gl.setRenderTarget(currentRenderTarget);
      gl.setPixelRatio(currentPixelRatio);

      // Convert to canvas for download (WebGL pixels are bottom-up)
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const imageData = ctx.createImageData(width, height);
        // Flip vertically (WebGL reads bottom-to-top)
        for (let y = 0; y < height; y++) {
          const srcRow = (height - y - 1) * width * 4;
          const dstRow = y * width * 4;
          imageData.data.set(buffer.subarray(srcRow, srcRow + width * 4), dstRow);
        }
        ctx.putImageData(imageData, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `golf-plan-${Date.now()}.png`;
              a.click();
              URL.revokeObjectURL(url);
            }
          },
          "image/png",
        );
      }

      // Clean up render target
      renderTarget.dispose();
    });
  }, [gl, scene, camera, size, register]);

  return null;
}
```

Key differences from the current implementation:
- Uses `WebGLRenderTarget` instead of rendering directly to the canvas -- avoids interference with View scissor boundaries
- Reads pixels from the render target and creates an image via an offscreen `<canvas>` element
- Handles the WebGL vertical flip (pixels are bottom-to-top)
- Disposes the render target after use to avoid GPU memory leaks
- The component is mounted inside `ThreeDOnlyContent`, so `camera` is the 3D PerspectiveCamera

### 8. Update Existing Tests

**File:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/utils/environment.test.ts`

The existing tests call `shouldEnableFog(uvMode, view)` with `ViewMode` values (`"top"`, `"3d"`). These must be updated to use `ViewportLayout` values (`"2d-only"`, `"3d-only"`, `"dual"`).

Similarly, `deriveFrameloop` tests must be updated to pass 4 arguments instead of 3.

The updated test file should:

1. Import `shouldEnablePostProcessing` alongside the existing imports
2. Import `ViewportLayout` type from `../../src/types/viewport`
3. Update all `shouldEnableFog` test cases to use `ViewportLayout` values
4. Update all `deriveFrameloop` test cases to include the 4th `viewportLayout` parameter
5. Add a new `describe("shouldEnablePostProcessing", ...)` block with the 3 tests specified above
6. Keep `shouldEnableSoftShadows` tests unchanged (it does not depend on viewport layout)

---

## File Summary

### Files Modified

| File | Changes |
|------|---------|
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/utils/environmentGating.ts` | Add `shouldEnablePostProcessing`, update `shouldEnableFog` and `deriveFrameloop` signatures to accept `ViewportLayout` |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/PostProcessing.tsx` | Add `viewportLayout` store selector, gate rendering with `shouldEnablePostProcessing` |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/UVEffects.tsx` | Add `viewportLayout` store selector, gate rendering with `shouldEnablePostProcessing` |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/ScreenshotCapture.tsx` | Rewrite to use `WebGLRenderTarget` for viewport-independent captures |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/utils/environment.test.ts` | Update existing tests for new signatures, add `shouldEnablePostProcessing` tests |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/App.tsx` | Update `deriveFrameloop` call to pass `viewportLayout` |

### Call Site Updates (after section-04 refactoring)

If `ThreeCanvas.tsx` has already been refactored into `SharedScene.tsx` and `ThreeDOnlyContent.tsx` (by section-04), then the `shouldEnableFog` call site is in `ThreeDOnlyContent.tsx` rather than `ThreeCanvas.tsx`. If section-04 is not yet applied, update `ThreeCanvas.tsx` directly -- the call site migration will happen when section-04 is applied later.

### No New Files

This section modifies existing files only. No new source files are created. The new `shouldEnablePostProcessing` function is added to the existing `environmentGating.ts` module.

---

## Edge Cases and Notes

1. **Mobile backward compatibility:** Mobile code still uses `ui.view` (`"top" | "3d"`). The mobile code path should map `ViewMode` to `ViewportLayout` at the call site: `view === "3d" ? "3d-only" : "2d-only"`. This avoids changing the mobile rendering path.

2. **EffectComposer mount/unmount:** When toggling from `"dual"` to `"3d-only"`, `PostProcessing` mounts and `EffectComposer` initializes. When toggling back to `"dual"`, it unmounts. This mount/unmount cycle is clean -- `EffectComposer` handles its own setup/teardown. There may be a brief visual flash during the transition, but this is acceptable.

3. **GodRaysSource singleton:** `GodRaysSource` stores a mesh ref in the Zustand store (`godRaysLampRef`). It must remain a singleton in `ThreeDOnlyContent` (not duplicated in both Views). Since `PostProcessing` reads this ref and is gated to `"3d-only"` mode only, the ref is always valid when PostProcessing renders.

4. **Sparkles, UVLamps, fog:** These are in `ThreeDOnlyContent` and render in the 3D View regardless of postprocessing state. They are visual elements (geometry/particles), not postprocessing effects, so they work fine with View scissor boundaries. No gating changes needed for these.

5. **ScreenshotCapture render target disposal:** The `WebGLRenderTarget` is created per-capture and disposed immediately after. This avoids holding GPU memory between screenshots. For frequent screenshots this is slightly less efficient than a persistent target, but screenshots are infrequent user actions.

6. **Future enhancement note:** If effects in dual mode are ever desired, the approach would be: render the 3D View to an offscreen render target, apply postprocessing to that target, then composite the result back. This is significantly more complex and not needed for the initial implementation.

---

## What Was Actually Built

### Deviations from Plan

1. **shouldEnableFog returns false for "dual" mode** — The plan said fog should work in dual mode because ThreeDOnlyContent scopes it. This is wrong: `<fogExp2 attach="fog">` sets `scene.fog` on the shared scene, so fog would bleed into both Views. The implementation correctly returns false for all layouts except "3d-only".
2. **deriveFrameloop forces "always" in dual mode** — The plan said logic stays the same for all layouts. The implementation preserves the spike finding that drei View rendering requires `frameloop="always"` in dual mode. Also returns "demand" for "2d-only" (no 3D animations needed).
3. **App.tsx not modified** — The plan said to update `deriveFrameloop` call in App.tsx. In the actual codebase (after section-04 refactoring), `deriveFrameloop` is called from `DualViewport.tsx`, not App.tsx. Updated DualViewport.tsx instead.
4. **ScreenshotCapture early-return with console.warn** — Code review caught silent failure when `canvas.getContext("2d")` returns null. Added early return with `console.warn` and proper `renderTarget.dispose()`.
5. **Mobile ViewMode→ViewportLayout mapping NOT added** — The plan called for mobile call sites to map `ViewMode` to `ViewportLayout`. This is deferred to section-10/11 where mobile's `setView` action needs to sync `viewportLayout`. Known mobile regression: fog disabled in UV 3D view because `viewportLayout` stays "dual".

### Files Actually Modified
| File | Change |
|------|--------|
| `src/utils/environmentGating.ts` | Added `shouldEnablePostProcessing`, refactored `shouldEnableFog` (ViewportLayout param, false for dual), refactored `deriveFrameloop` (4th param, "always" for dual, "demand" for 2d-only) |
| `src/components/three/PostProcessing.tsx` | Added `viewportLayout` selector + `shouldEnablePostProcessing` gate |
| `src/components/three/UVEffects.tsx` | Added `viewportLayout` selector + `shouldEnablePostProcessing` gate |
| `src/components/three/ScreenshotCapture.tsx` | Rewritten to WebGLRenderTarget approach with early-return on ctx failure |
| `src/components/three/ThreeDOnlyContent.tsx` | Simplified fog check to `shouldEnableFog(uvMode, viewportLayout)`, removed unused `view` selector |
| `src/components/layout/DualViewport.tsx` | Simplified frameloop to `deriveFrameloop(uvMode, gpuTier, transitioning, viewportLayout)` |
| `tests/utils/environment.test.ts` | Updated all tests for ViewportLayout params + 3 new `shouldEnablePostProcessing` tests |

### Test Results
- 4 new tests (3 shouldEnablePostProcessing + 1 updated deriveFrameloop 2d-only)
- 578 total tests pass
- TypeScript clean