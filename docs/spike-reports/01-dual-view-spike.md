# Spike Report: Dual-View Architecture Validation

**Date:** 2026-02-22
**Branch:** feat/dual-viewport-and-layers
**Section:** 01-spike (Architecture Validation)

## Versions Tested

- `@react-three/fiber`: 9.5.0
- `@react-three/drei`: 10.7.7
- `@react-three/postprocessing`: 3.0.4
- `three`: 0.183.0
- `react`: 19.2.0
- `postprocessing`: 6.36.7

## Architecture Under Test

The drei `<View>` component splits a single WebGL context into multiple viewports via `gl.scissor`. Pattern:

```
<div ref={containerRef}>
  <View style={{left:0, width:"50%"}}>  <!-- 2D ortho view -->
  <View style={{left:"50%", width:"50%"}}>  <!-- 3D perspective view -->
  <Canvas eventSource={containerRef}>
    <View.Port />
  </Canvas>
</div>
```

This avoids two WebGL contexts (which would double GPU memory and duplicate all textures/geometries).

## Test Results

### Decision Matrix

| Test | Result | Notes |
|------|--------|-------|
| Basic dual-View rendering | **PASS** | Two views with independent cameras, no visual artifacts |
| EffectComposer bleeds across Views | **NO** | Effects contained to their View only |
| EffectComposer disabled in dual works | **PASS** | Both views render cleanly without effects |
| EffectComposer in collapsed single-View | **PASS** | Effects work correctly in full-width single view |
| Real scene in dual-View | **PASS** | Hall, grid, sun indicator render in both views |
| GodRaysSource singleton issue | **NO** | GodRaysSource in one View only, no conflicts |
| Fog scoped to 3D View only | **PASS** | fogExp2 attached in 3D-only content |
| Environment scoped to 3D View only | **PASS** | Environment map in 3D-only content |
| Performance (rough FPS) | **55-60 FPS** | Basic mode. Real scene ~30 FPS |
| Console errors/warnings | **None in production modes** | Shader errors only from SoftShadows dynamic mount (spike-only) |

### Detailed Findings

#### 1. Basic Dual-View Rendering (Mode 1) -- PASS

Two colored boxes (red = 2D, blue = 3D) render side-by-side with independent cameras (OrthographicCamera for 2D, PerspectiveCamera for 3D). OrbitControls work independently in each pane. No visual bleed, no artifacts. **56 FPS**.

#### 2. EffectComposer in One View (Mode 2) -- PASS

EffectComposer (Bloom + Vignette + ToneMapping) placed inside only the 3D View. Effects are correctly contained -- the 2D view remains clean with no bloom bleed or vignette darkening. This was the primary unknown and the result is better than expected.

#### 3. No Effects in Dual Mode (Mode 3) -- PASS

Both views render cleanly without any postprocessing. This is the **planned production approach** for dual-pane mode. **60 FPS**. No issues.

#### 4. Collapsed Single-View + Effects (Mode 4) -- PASS

2D View collapses (width: 0, visible: false), 3D View expands to full width. EffectComposer activates and renders correctly. This validates the planned single-pane-with-effects mode.

#### 5. Real Scene Content (Mode 5) -- PASS

Full scene content split as planned:

**SharedSceneContent (both views):**
- Hall (walls, floor, roof structure)
- FloorGrid
- FlowPath
- SunIndicator
- Ambient + directional lights

**ThreeDOnlyContent (3D view only):**
- fogExp2
- Environment with Lightformers
- SoftShadows
- UVLamps (when UV mode active)
- GodRaysSource
- Sparkles

Hall renders correctly in both views from their respective camera angles. Grid visible in both. Sun indicator visible. No React warnings about duplicate context providers or singleton conflicts.

## Bugs Found

### Bug 1: Paint Trail Artifacts (FIXED)

**Symptom:** Content from previous frames persisted, creating paint trail artifacts when orbiting.

**Root cause:** `preserveDrawingBuffer: true` (set in production Canvas for screenshot capture) prevents drei's View compositor from clearing the buffer between frames. View sets `autoClear=false` and relies on its own clearing logic.

**Fix:** Set `preserveDrawingBuffer: false` on Canvas in dual-view mode.

**Implication:** Screenshot capture needs `WebGLRenderTarget` approach instead of `readPixels` on the drawing buffer. Already planned in section-09-postprocessing.

### Bug 2: SoftShadows Dynamic Mount Shader Errors (SPIKE-ONLY)

**Symptom:** `THREE.WebGLProgram: Shader Error` and `WebGL: INVALID_OPERATION: useProgram` warnings when switching between modes that mount/unmount SoftShadows.

**Root cause:** `SoftShadows` patches `THREE.ShaderChunk.shadowmap_pars_fragment` globally. Already-compiled shader programs become invalid when the patch changes.

**Impact:** Spike-only. In production, SoftShadows will be always-on or always-off (not dynamically mounted/unmounted). **No action needed.**

## Performance Summary

| Configuration | FPS | Notes |
|--------------|-----|-------|
| Basic dual-View (simple geometry) | 55-56 | Baseline |
| No effects dual mode (planned) | 60 | Production dual mode |
| Real scene dual-View | ~30 | Hall + grid + environment + SoftShadows |
| Collapsed single + effects | ~60 | After shader stabilization |

Performance is acceptable. The ~30 FPS for real scene dual-view is expected given this is WSL2 with software WebGL and the scene includes SoftShadows, Environment maps, and Sparkles. On native hardware this will be significantly higher.

## Caveats for Full Implementation

1. **`preserveDrawingBuffer` must be `false`** when using drei View. Screenshot capture needs `WebGLRenderTarget` (section-09).
2. **SoftShadows must not be dynamically mounted/unmounted.** Keep always-on or always-off per the 3D-only content pattern.
3. **`frameloop="always"` is required** for View rendering (the demand frameloop with invalidate doesn't work reliably with the View compositor).
4. **Canvas needs `eventSource={containerRef}`** pointing to the parent container, not the Canvas itself, for proper event routing to Views.
5. **View divs use CSS positioning** (position: absolute with left/width) -- they are regular DOM elements tracked by the View system.

## Decision

### **GO -- Proceed with dual-pane architecture**

All acceptance criteria met:
- Basic dual-View rendering works with independent cameras
- EffectComposer can be cleanly disabled in dual mode and re-enabled in collapsed single-View mode
- Real scene content renders in both Views without errors
- Performance is acceptable (30+ fps in dual mode, 60 fps for planned no-effects mode)
- No blocking issues with singleton components

**Proceed to Section 02 (Types & Store).**

## Screenshots

Screenshots saved to `docs/spike-reports/screenshots/`:
- `mode1-basic.png` -- Basic dual-View with colored boxes
- `mode2-effects-one-view.png` -- EffectComposer in 3D View only
- `mode3-effects-disabled.png` -- No effects (planned approach)
- `mode4-collapsed.png` -- Collapsed single-View + effects
- `mode5-real-scene.png` -- Real scene content in both views
- `mode5-real-scene-clean.png` -- Real scene (clean load)
