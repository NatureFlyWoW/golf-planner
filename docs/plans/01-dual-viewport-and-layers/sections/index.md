<!-- PROJECT_CONFIG
runtime: typescript-npm
test_command: cd golf-planner && npx vitest run
END_PROJECT_CONFIG -->

<!-- SECTION_MANIFEST
section-01-spike
section-02-types-and-store
section-03-split-pane-layout
section-04-dual-canvas-views
section-05-camera-system
section-06-event-isolation
section-07-layer-state
section-08-layer-panel-ui
section-09-postprocessing
section-10-feature-migration
section-11-mobile-responsive
section-12-polish-and-testing
END_MANIFEST -->

# Implementation Sections Index

## Dependency Graph

| Section | Depends On | Blocks | Parallelizable |
|---------|------------|--------|----------------|
| section-01-spike | - | all | Yes (standalone) |
| section-02-types-and-store | 01 | 03, 04, 05, 06, 07, 08, 09, 10 | Yes |
| section-03-split-pane-layout | 02 | 04 | Yes (with 02) |
| section-04-dual-canvas-views | 02, 03 | 05, 06, 09, 10 | No |
| section-05-camera-system | 04 | 06, 12 | Yes |
| section-06-event-isolation | 04, 05 | 07, 10 | No |
| section-07-layer-state | 02, 06 | 08, 10 | Yes |
| section-08-layer-panel-ui | 07 | 11, 12 | Yes |
| section-09-postprocessing | 04 | 12 | Yes (with 05, 07) |
| section-10-feature-migration | 04, 06, 07 | 11, 12 | No |
| section-11-mobile-responsive | 08, 10 | 12 | No |
| section-12-polish-and-testing | all | - | No (final) |

## Execution Order

1. **Batch 1:** section-01-spike (standalone validation — if spike fails, Plan B)
2. **Batch 2:** section-02-types-and-store (foundation types + store actions)
3. **Batch 3:** section-03-split-pane-layout (parallel — HTML/CSS split-pane, no Canvas yet)
4. **Batch 4:** section-04-dual-canvas-views (Canvas + View architecture, SharedScene extraction)
5. **Batch 5:** section-05-camera-system, section-09-postprocessing (parallel — cameras/presets + effects gating)
6. **Batch 6:** section-06-event-isolation (pointer gating, setPointerCapture migration)
7. **Batch 7:** section-07-layer-state (wire layer state to scene components)
8. **Batch 8:** section-08-layer-panel-ui, section-10-feature-migration (parallel — UI + toolbar cleanup)
9. **Batch 9:** section-11-mobile-responsive (mobile fallback + mobile layer panel)
10. **Batch 10:** section-12-polish-and-testing (final polish, performance, visual regression)

## Section Summaries

### section-01-spike
**Plan sections:** 1b (Architecture Validation Spike)

Minimal proof-of-concept to validate that drei `<View>` components work with the existing scene and that `EffectComposer` behaves as expected in single-View mode. Creates a throwaway test file, validates compatibility, documents findings. If View approach doesn't work, triggers Plan B (layer system on existing single-Canvas toggle). ~30 minutes of work.

### section-02-types-and-store
**Plan sections:** 3 (Type Definitions), 4 (Store Architecture)

Define all new TypeScript types (`ViewportLayout`, `CameraPreset`, `LayerId`, `LayerState`) in `src/types/viewport.ts`. Update `UIState` in `src/types/ui.ts`. Add viewport layout actions and layer management actions to `store.ts`. Write ~35 unit tests for store actions (clamping, defaults, reset, persistence exclusion).

### section-03-split-pane-layout
**Plan sections:** 5 (Split-Pane Layout)

Build `DualViewport.tsx`, `SplitDivider.tsx`, and `useSplitPane.ts`. Pure HTML/CSS split-pane with draggable divider, no Canvas integration yet. Handles resize, clamping, double-click collapse/expand. Write ~8 tests for useSplitPane hook.

### section-04-dual-canvas-views
**Plan sections:** 2 (Architecture Overview — component hierarchy, scene content split)

Set up the Canvas + View + View.Port pattern. Refactor `ThreeCanvas.tsx` into `SharedScene.tsx` and `ThreeDOnlyContent.tsx`. Wire Views into DualViewport with proper refs and eventSource. This is the core architectural change. Verify rendering in both panes.

### section-05-camera-system
**Plan sections:** 6 (Camera Setup — 2D/3D cameras, CameraPresets, keyboard migration)

Configure per-pane cameras: OrthographicCamera + OrbitControls for 2D, PerspectiveCamera + CameraControls for 3D. Build `CameraPresets.tsx` overlay with smooth animated transitions via `setLookAt`. Create `cameraPresets.ts` utility. Refactor `useKeyboardControls` for viewport-awareness. Write ~16 tests.

### section-06-event-isolation
**Plan sections:** 6 (Pointer Event Isolation, setPointerCapture Migration)

Implement position-based viewport detection in event handlers. Create `ViewportContext`. Migrate `MiniGolfHole.tsx` and `RotationHandle.tsx` away from `setPointerCapture` to floor-plane raycasting pattern. Gate `PlacementHandler` with activeViewport. Ensure click/drag/hover only processes in the correct pane.

### section-07-layer-state
**Plan sections:** 7 (Layer System Implementation — integration pattern, opacity, lock)

Wire layer state from store to all renderable components: `PlacedHoles`, `FlowPath`, `FloorGrid`, `Hall`/`HallWalls`, `SunIndicator`. Implement visibility (return null), opacity (material props), and lock (skip pointer events) patterns. Migrate `showFlowPath` to layer system. Write ~10 integration tests.

### section-08-layer-panel-ui
**Plan sections:** 7 (Layer Panel UI — LayerPanel, LayerRow)

Build `LayerPanel.tsx` and `LayerRow.tsx` components. Add "Layers" as 4th sidebar tab. Each row has eye toggle, label, opacity slider, lock toggle. Reset button at bottom. Update `SidebarTab` and `ActivePanel` types. Add `MobileLayerPanel.tsx` skeleton.

### section-09-postprocessing
**Plan sections:** 8 (PostProcessing Strategy), part of 10 (Environment Gating)

Gate PostProcessing and UVEffects to only render when `viewportLayout !== "dual"`. Refactor environment gating functions (`shouldEnableFog`, `deriveFrameloop`) to accept `viewportLayout` instead of `ui.view`. Refactor `ScreenshotCapture` to use `WebGLRenderTarget` for clean captures. Write ~8 tests.

### section-10-feature-migration
**Plan sections:** 10 (Existing Feature Migration), part of 6 (overlays)

Remove view toggle from `Toolbar.tsx`. Migrate flow path toggle in both `Toolbar.tsx` and `BottomToolbar.tsx` to use `toggleLayerVisible("flowPath")`. Remove standalone `showFlowPath` / `toggleFlowPath` from store. Reposition overlays: MiniMap to 2D pane, SunControls/KeyboardHelp to DualViewport container. Write ~3 tests.

### section-11-mobile-responsive
**Plan sections:** 11 (Mobile & Responsive)

Implement mobile detection in DualViewport — single-pane fallback on <768px using existing Canvas pattern. Ensure `ui.view` toggle works for mobile. Build `MobileLayerPanel` overlay matching existing mobile panel patterns. Verify tablet (768-1024px) dual-pane works.

### section-12-polish-and-testing
**Plan sections:** 9 (Performance Strategy), 12 (Testing Strategy)

Performance benchmarking: FPS in dual mode with 18 holes, interaction FPS, comparison to baseline. Visual regression tests via Playwright (dual layout, collapsed modes, layer panel). Verify all 495 existing tests pass. Edge case handling: window resize, rapid divider dragging, keyboard shortcuts across panes. Final polish.
