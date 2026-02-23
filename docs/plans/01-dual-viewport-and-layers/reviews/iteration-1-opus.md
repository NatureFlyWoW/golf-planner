# Opus Review

**Model:** claude-opus-4-6
**Generated:** 2026-02-21

---

## Overall Assessment

This is a well-structured plan with solid architectural decisions. The single-Canvas + `<View>` approach is correct, the layer system design is clean, and the mobile fallback strategy is sensible. However, there are several significant technical pitfalls, a major architectural contradiction, and missing details that would cause problems during implementation.

---

## Critical Issues

### 1. PostProcessing inside `<View>` Does Not Work (Section 8, Section 9)

This is the most dangerous issue in the entire plan. The `@react-three/postprocessing` `EffectComposer` takes over the entire rendering pipeline of the Canvas. It replaces `gl.render()` with a multi-pass render-to-texture pipeline. It does NOT respect `<View>` scissor boundaries. Placing `<EffectComposer>` inside one `<View>` will either:
- Apply effects to the entire Canvas (both viewports), or
- Break the View rendering entirely, as EffectComposer hijacks the render loop

**Recommendation:** Research this before committing to the architecture. Options include:
- Render postprocessing effects only when the 3D pane is expanded to fullscreen (collapsed mode)
- Use a render target for the 3D View and apply postprocessing to that render target
- Accept that postprocessing applies to both views (with the 2D pane getting unintended effects)
- Use two separate Canvases specifically when UV mode is active (mode switch)

### 2. Scene Content Duplication vs. Shared Scene Graph (Section 6)

Both Views render `SceneContent` containing the same components. This means every React component is **instantiated twice** -- two `<PlacedHoles>`, two `<Hall>`, two `<FlowPath>`, etc. While drei's `<View>` shares the WebGL context and Three.js geometries/textures, the React component tree is fully duplicated:
- Every Zustand selector runs twice per state change
- Every `useFrame` callback runs twice per frame
- Every `useMemo` and `useState` is duplicated
- Pointer event handlers are duplicated

**Recommendation:** Explicitly call out that React components are duplicated. Benchmark the doubling and confirm it stays within the 30fps budget.

### 3. Drag Interaction Conflict Between Views (Section 7, Section 13 step 7)

With `eventSource={containerRef}`, R3F dispatches pointer events based on raycaster hits. When a user drags a hole in the 2D pane, the 3D pane's SceneContent has the same hole mesh. Both Views will receive the raycaster hit. `e.stopPropagation()` stops bubbling within the scene graph, but both Views independently process the raw DOM event.

**Recommendation:** The plan needs a concrete strategy for event isolation between Views:
- Check which View received the event (by comparing pointer position to pane bounds)
- Use the `activeViewport` state to gate pointer handlers
- Use `raycaster.layers` per View to prevent the inactive View from hitting

### 4. `useKeyboardControls` Hook Will Break

Existing keyboard controls hook directly manipulates camera position and OrbitControls via refs. With dual-pane architecture, there are two separate camera setups. Keyboard shortcuts need to target the active pane's camera.

**Recommendation:** Add an explicit step for refactoring `useKeyboardControls` to be viewport-aware.

---

## Significant Issues

### 5. `ScreenshotCapture` Will Capture Both Views

With the View-based architecture, `gl.domElement` covers both panes. The screenshot will capture whatever the Canvas's scissor state last rendered.

### 6. `GodRaysSource` Stores a Mesh Ref in Zustand

If `SceneContent` is rendered in both Views, two `GodRaysSource` instances will fight over the single `godRaysLampRef` in the store.

**Recommendation:** Components that register global refs in the store should only be instantiated once, in the 3D View.

### 7. `SidebarTab` Type Needs Updating

Adding "layers" to `SidebarTab` union type and `ActivePanel` type.

### 8. Hybrid Three.js Layers Contradicts Plan

Research recommends Three.js native `Object3D.layers`; plan recommends React conditional rendering. These are two different approaches. Plan's approach is simpler and better for this project.

**Recommendation:** Use React conditional rendering (plan Section 7) for visibility. Consider raycaster layer filtering for lock (cleaner than manually gating every event handler).

### 9. `deriveFrameloop` and Environment Gating Use `view` State

With dual viewports, `ui.view` is deprecated on desktop. Gating functions need refactoring.

---

## Minor Issues

### 10. MiniMap Positioning
MiniMap is positioned `absolute right-2 bottom-2 z-10` inside current canvas container. Needs repositioning.

### 11. SunControls and KeyboardHelp Overlays
Currently rendered as HTML overlays inside canvas container. Need repositioning.

### 12. Canvas frameloop Is Global
Both Views share one Canvas. If 3D pane needs `frameloop="always"`, 2D pane also re-renders every frame. Cannot independently control per-View frameloop.

### 13. `View` track vs ref API
Plan should be consistent about which View API pattern it uses.

### 14. Opacity on drei `<Grid>` Component
`FloorGrid.tsx` uses drei's `<Grid>` which manages its own materials. Setting opacity is not straightforward.

### 15. Store Slice Architecture
Actual store has no slice pattern -- single monolithic `create()` call. Plan references "existing slice pattern" which doesn't exist.

### 16. SidebarTab Width at 4 Tabs
256px sidebar with 4 tabs = 64px per tab. Text may overflow.

### 17. `collapseTo` vs `setSplitRatio` Clamping
`setSplitRatio` clamps to 0.2-0.8, but collapse needs to set 0 or 1.

### 18. Future Layer IDs
Consider omitting future layers (`dimensions`, `annotations`, `zones`) from initial implementation.

---

## What the Plan Gets Right

- Single Canvas + View approach is correct
- Ephemeral layer state (not persisted) is right
- Layer system design (visibility/opacity/lock) is clean and extensible
- Mobile fallback reusing existing toggle is pragmatic
- Camera preset approach using drei CameraControls with `setLookAt` is elegant
- Implementation order is logical
- No undo/redo tracking for layers is correct
