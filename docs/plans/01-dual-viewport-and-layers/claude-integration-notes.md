# Integration Notes — Opus Review Feedback

## Critical Issues

### 1. PostProcessing + View Incompatibility — INTEGRATING
**Assessment:** This is a legitimate blocker. EffectComposer takes over the Canvas render pipeline and cannot be scoped to one View.

**Decision:** Add a new plan section addressing this with a concrete strategy:
- **Primary approach:** Disable postprocessing when in dual-pane mode. Effects only run when 3D pane is collapsed to fullscreen (viewportLayout === "3d-only").
- **Rationale:** This is the simplest, most robust solution. The user already specified effects should only apply to 3D pane. When in dual mode, the 3D pane is a preview — full visual fidelity with postprocessing comes when expanded.
- **Alternative if needed later:** Render 3D View to an offscreen render target, apply effects, then composite. More complex but achievable.

### 2. React Component Duplication in Both Views — INTEGRATING
**Assessment:** Valid concern. Scene components rendered twice means 2x React overhead.

**Decision:** Add explicit acknowledgment and mitigation strategy:
- Split `SceneContent` into `SharedScene` (rendered once, contains shared state logic) and lightweight per-view wrappers that just reference the shared scene via `createPortal` or minimal duplicate geometry.
- Actually, after further reflection: the simpler approach is to accept the duplication but ensure components are lightweight. The scene has ~18 holes max, a hall, grid, and flow path. This is a small scene graph. The real cost is draw calls (doubled), not React reconciliation. Benchmark during implementation.
- Add explicit performance validation step in the plan.

### 3. Pointer Event Isolation Between Views — INTEGRATING
**Assessment:** Critical. Both Views will receive raycaster hits for the same world-space objects.

**Decision:** Add concrete event isolation strategy:
- Use R3F's `pointer.x` / `pointer.y` values and compare against pane bounds to determine which View the event originated from
- Gate pointer event handlers with `activeViewport` state — only the pane receiving focus (mouse entered) processes interaction events
- Set `activeViewport` on `onPointerEnter` of each pane div

### 4. useKeyboardControls Migration — INTEGRATING
**Assessment:** Valid. Keyboard controls need to target the active viewport's camera.

**Decision:** Add explicit refactoring step. `useKeyboardControls` receives the `activeViewport` state and dispatches to the correct camera controls ref (2D OrbitControls ref or 3D CameraControls ref).

## Significant Issues

### 5. ScreenshotCapture — INTEGRATING
**Decision:** Screenshot captures both panes in dual mode (this is actually useful — shows the full layout). For single-view screenshots, user collapses to the desired pane first.

### 6. GodRaysSource Singleton — INTEGRATING
**Decision:** Split SceneContent so 3D-only components (GodRays, Sparkles, Environment map, Fog, UVEffects) only render in the 3D View. This was already intended but needs explicit component separation.

### 7. SidebarTab Type — INTEGRATING
**Decision:** Add `"layers"` to `SidebarTab` and `ActivePanel` types. Simple oversight, adding to plan.

### 8. Three.js Layers vs React Conditional — PARTIALLY INTEGRATING
**Decision:** Use React conditional rendering for visibility (simpler, matches existing patterns). For lock, use the `locked` state checked in pointer event handlers (simpler than raycaster layer filtering given we already gate on `activeViewport`). Discard Three.js native layers recommendation from research.

### 9. Environment Gating Functions — INTEGRATING
**Decision:** Refactor gating functions to accept viewport context instead of `ui.view`. Add to implementation steps.

## Minor Issues

### 10-11. MiniMap, SunControls, KeyboardHelp Positioning — INTEGRATING
**Decision:** These overlays move inside the DualViewport container. MiniMap goes to 2D pane corner. SunControls and KeyboardHelp remain as overlays on the full container.

### 12. Canvas frameloop Is Global — INTEGRATING
**Decision:** Correct the plan. Cannot do per-View demand rendering. Canvas uses `frameloop="always"` when 3D pane is visible (matching current behavior). 2D pane re-renders every frame but cheaply (no postprocessing). Update Section 9 to be honest about this.

### 13. View track API — MINOR, INTEGRATING
**Decision:** Clarify that Views are DOM divs positioned by CSS. No `track` prop needed if Views are the divs themselves.

### 14. Grid Opacity — INTEGRATING
**Decision:** Grid layer supports visibility toggle only. Opacity slider is present but notes that grid opacity may not work with drei's Grid component. Can be fixed later with custom grid.

### 15. Store Slice Pattern — INTEGRATING
**Decision:** Clarify that the store uses a single `create()` call. The viewport state and actions are added inline, following the existing pattern (not an extracted slice file). Rename from "viewportSlice.ts" to inline additions in store.ts, or extract as action factory functions.

### 16. Sidebar Tab Width — NOTED, NOT INTEGRATING
Tab icons can be used if text overflows. Minor UI polish, not a plan-level concern.

### 17. Collapse vs Ratio Clamping — INTEGRATING
**Decision:** Use `viewportLayout` state to distinguish collapsed vs dual. `splitRatio` is only relevant in "dual" mode. Collapse/expand changes `viewportLayout`, not `splitRatio`.

### 18. Future Layer IDs — INTEGRATING
**Decision:** Remove `dimensions`, `annotations`, `zones` from initial DEFAULT_LAYERS. Only include the 5 active layers. Future splits will register their own layers when implemented.
