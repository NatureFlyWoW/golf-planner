I now have full context. Let me produce the section content.

# Section 01 -- Architecture Validation Spike

## Goal

Before committing to the dual-viewport architecture, validate two critical unknowns in a throwaway proof-of-concept:

1. **View + EffectComposer compatibility**: Do `@react-three/postprocessing` effects bleed across `<View>` boundaries, or break rendering when one View has an `EffectComposer` and the other does not?
2. **View + existing scene complexity**: Can the current scene (Hall, PlacedHoles, Environment map, SoftShadows, fog, lighting) render through two `<View>` components without subtle visual bugs?

This spike takes approximately 30 minutes and prevents days of debugging later. Its output is a short written report with a go/no-go decision for the dual-pane approach.

---

## Background

### Current Architecture

The app uses a single `<Canvas>` in `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/App.tsx` that renders one `ThreeCanvas` component containing the entire scene. A `ui.view` toggle switches between "top" (orthographic) and "3d" (perspective) -- only one visible at a time.

Key current files:

- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/App.tsx` -- Canvas setup with `dpr`, `frameloop`, `shadows`, `gl` config
- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/ThreeCanvas.tsx` -- Full scene: lighting, fog, Environment, SoftShadows, Hall, PlacedHoles, FloorGrid, FlowPath, SunIndicator, UVLamps, GodRaysSource, Sparkles, UVEffects, ScreenshotCapture, CameraControls
- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/PostProcessing.tsx` -- `EffectComposer` with N8AO, GodRays, Bloom, ChromaticAberration, Vignette, ToneMapping
- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/UVEffects.tsx` -- Lazy-loaded `PostProcessing`, gated by `uvMode`
- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/CameraControls.tsx` -- `OrthographicCamera`, `PerspectiveCamera`, `OrbitControls`, keyboard controls

### The drei View Pattern

`@react-three/drei` (version 10.7.7 installed) provides a `<View>` component that splits one WebGL context into multiple viewports via `gl.scissor`. The pattern is:

- A parent container `ref` is passed to `<Canvas eventSource={containerRef}>`
- Two `<View>` components (regular HTML divs with `track` or `ref` props) define viewport positions via CSS
- `<View.Port />` inside the Canvas renders both views
- Each View contains its own camera and controls
- The Canvas sits `position: absolute; inset: 0` behind the View divs

This avoids two WebGL contexts (which would double GPU memory and duplicate all textures/geometries).

### Known Risk: EffectComposer

`@react-three/postprocessing`'s `EffectComposer` replaces the standard `gl.render()` call with a multi-pass render-to-texture pipeline. It is **not** designed to respect `<View>` scissor boundaries. Effects could bleed across views or cause one view to render incorrectly. This is the primary unknown the spike must resolve.

---

## Tests

There are no formal automated tests for this section. The spike is a manual proof-of-concept with documented acceptance criteria. Per the TDD plan:

> No formal tests. This is a manual proof-of-concept to validate View + EffectComposer compatibility. **Acceptance criteria** documented in a short spike report (works / doesn't work / Plan B triggered).

The spike produces a written report, not test code.

---

## Acceptance Criteria

The spike must answer these questions with evidence:

1. **Dual View rendering**: Do two `<View>` components, each with their own camera, correctly render the scene side-by-side without visual artifacts?
2. **EffectComposer in one View only**: When `EffectComposer` is placed inside only the 3D View, does it bleed into the 2D View? Does the 2D View render cleanly?
3. **EffectComposer disabled in dual mode**: When `EffectComposer` is conditionally excluded in dual mode (the planned approach), does everything work cleanly?
4. **Collapsed mode**: When one View is hidden (single-pane mode), does `EffectComposer` work correctly in the remaining View?
5. **Scene complexity**: Do Environment maps, SoftShadows, fog, Sparkles, and GodRaysSource render without errors through the View setup?
6. **Performance**: Is the dual-View rendering acceptable (rough FPS check, no catastrophic regression)?

---

## Implementation Steps

### Step 1: Create the Spike File

Create a throwaway component at `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/DualViewSpike.tsx`.

This file is temporary and will be deleted after the spike concludes. It should NOT be committed to git.

The spike component should:

- Create a container div with `useRef`
- Render two styled divs side-by-side (50/50 split) as View tracking elements
- Render a `<Canvas>` with `eventSource` pointing to the container ref
- Inside the Canvas, render `<View.Port />`
- Inside each View, render a simple test scene first (colored boxes, different cameras), then escalate to the real scene

### Step 2: Minimal Dual-View Test

Build the simplest possible dual-view setup to confirm the basic pattern works:

```typescript
// Pseudocode structure -- NOT full implementation
// File: DualViewSpike.tsx

function DualViewSpike() {
  const containerRef = useRef<HTMLDivElement>(null);
  const view2dRef = useRef<HTMLDivElement>(null);
  const view3dRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Two side-by-side view tracking divs */}
      <div ref={view2dRef} style={{ position: "absolute", left: 0, top: 0, width: "50%", height: "100%" }} />
      <div ref={view3dRef} style={{ position: "absolute", left: "50%", top: 0, width: "50%", height: "100%" }} />

      <Canvas eventSource={containerRef} style={{ position: "absolute", inset: 0 }}>
        <View track={view2dRef}>
          <OrthographicCamera makeDefault position={[5, 50, 10]} zoom={40} />
          {/* Simple test geometry */}
          <mesh><boxGeometry /><meshStandardMaterial color="red" /></mesh>
          <ambientLight />
        </View>

        <View track={view3dRef}>
          <PerspectiveCamera makeDefault position={[15, 15, 15]} fov={60} />
          {/* Same or different test geometry */}
          <mesh><boxGeometry /><meshStandardMaterial color="blue" /></mesh>
          <ambientLight />
        </View>

        <View.Port />
      </Canvas>
    </div>
  );
}
```

Verify: Two distinct colored boxes render side-by-side, each from their own camera angle. No visual bleed.

### Step 3: Add EffectComposer to One View

Add the project's `EffectComposer` setup (from `PostProcessing.tsx`) inside only the 3D View:

```typescript
// Inside the 3D View only:
<View track={view3dRef}>
  <PerspectiveCamera makeDefault ... />
  <mesh>...</mesh>
  <ambientLight />
  <EffectComposer>
    <Bloom mipmapBlur luminanceThreshold={0.7} intensity={0.5} />
    <Vignette offset={0.3} darkness={0.8} />
    <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
  </EffectComposer>
</View>
```

**Check for:**
- Does Bloom/Vignette only affect the 3D view?
- Does the 2D view remain clean (no bloom bleed, no vignette darkening)?
- Are there any WebGL errors in the console?
- Does the effect render at all, or does it take over the full canvas?

**Expected outcome based on architecture analysis:** EffectComposer will likely take over the full canvas render pipeline, affecting both views. This is why the plan disables PostProcessing in dual mode.

### Step 4: Test the Planned Approach (No Effects in Dual Mode)

Remove `EffectComposer` from both Views. Verify that dual-View rendering works cleanly without any postprocessing. This is the actual planned architecture for dual-pane mode.

Then test collapsed mode: hide one View div (set `display: none` or `width: 0`), add `EffectComposer` to the remaining visible View. Verify effects work correctly in single-pane mode.

### Step 5: Escalate to Real Scene Content

Replace the simple test geometry with the actual scene components from `ThreeCanvas.tsx`. Split them as the plan describes:

**In both Views (SharedScene content):**
- `ambientLight` + `directionalLight`
- `Hall` (with sunData)
- `PlacedHoles`
- `FlowPath`
- `FloorGrid`
- `SunIndicator`

**In 3D View only (ThreeDOnlyContent):**
- `fogExp2` + `FogController`
- `Environment` with `Lightformer`s
- `SoftShadows`
- `UVLamps` (when UV mode active)
- `GodRaysSource`
- `Sparkles`

**Do NOT include in either View during the spike:**
- `CameraControls` component (use inline camera/controls instead)
- `PlacementHandler` (interaction testing is for Section 06)
- `UVEffects` / `PostProcessing` (already validated to be disabled in dual mode)
- `ScreenshotCapture`

**Check for:**
- Does the hall render correctly in both views?
- Do placed holes appear in both views from their respective camera angles?
- Does fog only appear in the 3D view?
- Does the Environment map only affect the 3D view?
- Are there any React warnings about duplicate context providers or singleton conflicts?
- Does `GodRaysSource` (which stores a mesh ref in Zustand via `useStore.setState`) cause issues when only instantiated in one View?

### Step 6: Basic Performance Check

With the full scene content in dual-View mode:
- Open the browser DevTools Performance tab or use the `<Stats />` component
- Note the FPS with ~5 holes placed
- Compare roughly to the current single-canvas FPS
- No formal benchmark needed -- just verify it is not catastrophically slow (target: 30+ fps on your machine)

### Step 7: Wire into App for Testing

Temporarily modify `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/App.tsx` to render `DualViewSpike` instead of the normal canvas area. This allows testing with the real store state, real placed holes, and real UI interactions around it.

Replace the `<div className="relative flex-1">` block (lines 60-86) with the spike component. Keep all surrounding UI (Toolbar, Sidebar, LocationBar, etc.) intact.

**Important:** This modification is temporary. Revert `App.tsx` after the spike.

---

## Decision Matrix

After completing the steps above, record findings against this matrix:

| Test | Result | Notes |
|------|--------|-------|
| Basic dual-View rendering | PASS/FAIL | |
| EffectComposer bleeds across Views | YES/NO | |
| EffectComposer disabled in dual works | PASS/FAIL | |
| EffectComposer in collapsed single-View | PASS/FAIL | |
| Real scene in dual-View | PASS/FAIL | |
| GodRaysSource singleton issue | YES/NO | |
| Fog scoped to 3D View only | PASS/FAIL | |
| Environment scoped to 3D View only | PASS/FAIL | |
| Performance (rough FPS) | NUMBER | |
| Console errors/warnings | LIST | |

---

## Go / No-Go Decision

### GO (proceed with dual-pane architecture)

If all of the following are true:
- Basic dual-View rendering works (two independent cameras, no visual artifacts)
- EffectComposer can be cleanly disabled in dual mode and re-enabled in collapsed single-View mode
- Real scene content renders in both Views without errors
- Performance is acceptable (30+ fps in dual mode)
- No blocking issues with singleton components (GodRaysSource)

Proceed to Section 02 (Types & Store).

### NO-GO (trigger Plan B)

If any of the following are true:
- The drei `<View>` component fundamentally does not work with R3F 9.x / drei 10.x at the installed versions
- Scene content cannot be rendered in two Views without critical visual bugs
- Performance is catastrophically bad (<15 fps with a simple scene)
- Singleton components create unresolvable conflicts

**Plan B:** Keep the existing single-Canvas toggle for viewport switching. Still implement the layer system (Sections 02, 07, 08 from the full plan) as it is independently valuable. Dual-pane becomes a future enhancement.

### PARTIAL GO

If EffectComposer causes issues but basic dual-View works:
- Proceed with the plan as-is (effects disabled in dual mode, enabled in 3d-only mode)
- This is the **expected** outcome and is fully accounted for in the architecture

---

## Spike Report Location

Write the spike findings to `/mnt/c/Users/Caus/Golf_Plan/golf-planner/docs/spike-reports/01-dual-view-spike.md` with:

- Date and versions tested (drei 10.7.7, R3F 9.5.0, three 0.183.0)
- Results for each test in the decision matrix
- Screenshots if helpful (save to `docs/spike-reports/screenshots/`)
- GO / NO-GO / PARTIAL GO decision
- Any caveats or issues to watch for during full implementation

---

## Cleanup

After the spike:

1. Delete `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/DualViewSpike.tsx`
2. Revert any temporary changes to `App.tsx`
3. Run `npx tsc --noEmit` to verify no type errors remain
4. Run `npx vitest run` to verify all 495 existing tests still pass
5. Keep the spike report -- it is permanent documentation

---

## Dependencies

- **Depends on:** Nothing (this is the first section, standalone)
- **Blocks:** All subsequent sections. If this spike fails, Plan B is triggered and the remaining sections are scoped down to layer-system-only

---

## Package Versions (for reference)

These are the exact versions installed in the project, as found in `/mnt/c/Users/Caus/Golf_Plan/golf-planner/package.json`:

- `@react-three/fiber`: 9.5.0
- `@react-three/drei`: 10.7.7
- `@react-three/postprocessing`: 3.0.4
- `three`: 0.183.0
- `react`: ^19.2.0