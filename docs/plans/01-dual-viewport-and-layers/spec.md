# 01 — Dual Viewport & Layer System

## Overview
Transform Golf Forge's single-canvas toggle-based view into a professional **split-pane dual viewport** with a comprehensive **layer visibility system**. This is the foundational split — every subsequent feature (measurement, annotations, zones, 3D environment, rich 2D) renders into these viewports and integrates with these layers.

## Reference
- **Requirements**: `../next-evolution-requirements.md` (F1: Split-Pane Dual View, F3: Layer System)
- **Reference images**: `../../reference_samples/APP_AND_UI_REF1-3.jpg` — Plan7Architekt-style software showing simultaneous 2D+3D side-by-side views
- **Interview**: `../deep_project_interview.md` — Topics 1-2 (natural boundaries, ordering)

## Current State
- **View toggle**: `ui.view` switches between `"top"` (orthographic) and `"3d"` (perspective) — mutually exclusive
- **Single Canvas**: One `<Canvas>` in `App.tsx` with `ThreeCanvas` component rendering the entire scene
- **Camera**: `CameraControls.tsx` switches between `OrthographicCamera` and `PerspectiveCamera`
- **OrbitControls**: Already exist via `@react-three/drei` — rotation enabled in 3D mode, disabled in 2D
- **No layer system**: Individual toggles exist (`showFlowPath`, `snapEnabled`, `uvMode`) but no unified layer model
- **Key files**: `App.tsx`, `ThreeCanvas.tsx`, `CameraControls.tsx`, `store/store.ts` (UIState)

## Requirements

### Dual Viewport
1. **Split-pane layout**: 2D (orthographic top-down) on the left, 3D (perspective with orbit) on the right
2. **Resizable divider**: Drag to adjust the split ratio between panes
3. **Collapse to single view**: Click divider edge or double-click to expand either pane to full-screen
4. **Independent zoom/pan**: Each pane has its own zoom level and pan offset
5. **Synchronized selection**: Clicking a hole in one pane highlights it in both; hover effects sync too
6. **Synchronized hole state**: Moving/rotating a hole in either pane updates both in real-time (this comes free from Zustand)

### Camera System
7. **Orbit controls (3D pane)**: Full orbit (rotate, pan, zoom) — already partially exists, needs to work in split context
8. **Camera presets**: Top, Front, Back, Left, Right, Isometric — buttons in 3D pane header or toolbar
9. **Smooth transitions**: Animated camera lerp between presets (0.3-0.5s ease)
10. **2D pane controls**: Pan (drag) + zoom (scroll) only, no rotation — same as current top-down mode

### Layer System
11. **Layer definitions**: Holes, Flow Path, Grid, Walls/Doors/Windows, Dimensions (future), Annotations (future), Zones (future), Sun Indicator
12. **Visibility toggle**: Click layer name or eye icon to show/hide
13. **Opacity slider**: Per-layer opacity control (0-100%)
14. **Layer lock**: Lock icon to prevent interaction (selection, movement) for that layer
15. **Layer panel**: New sidebar tab "Layers" or a floating panel accessible from toolbar
16. **Layer state**: New Zustand slice — `layers: Record<LayerId, { visible: boolean; opacity: number; locked: boolean }>`
17. **Default layers**: All visible, 100% opacity, unlocked

### Integration Points
18. **Existing features preserved**: All current toolbar buttons, sidebar tabs, UV mode, budget panel continue to work
19. **Mobile graceful degradation**: On mobile (<768px), dual-pane collapses to single-pane with existing toggle behavior; layer panel accessible via mobile overlay
20. **Builder mode**: When entering the Hole Builder, the dual-pane layout is replaced by the builder's fullscreen canvas (existing behavior)

## Technical Considerations

### Dual Canvas Architecture
The critical technical decision is **how to render two synchronized viewports**:

**Option A: Single `<Canvas>` with R3F `<View>` components**
- Uses `@react-three/drei`'s `<View>` to split one WebGL context into two viewports
- Pro: Shared textures/geometries, lower memory, better performance
- Con: Both views share the same scene graph; camera separation needs careful handling
- Reference: drei docs on `<View>` + `<Canvas eventSource={...}>`

**Option B: Two separate `<Canvas>` instances**
- Each pane gets its own WebGL context
- Pro: Complete isolation, simpler camera management
- Con: Double GPU memory, textures loaded twice, no shared geometry

**Recommendation**: Option A (single Canvas with Views) is preferred for performance. The existing scene graph can be rendered through two different cameras. R3F's `<View>` was designed for exactly this use case.

### Layer System Architecture
- Layers are a **rendering concern**, not a data concern — a hole doesn't "belong to" a layer; the layer controls whether holes are rendered
- Layer state should be **ephemeral** (part of UI state, not persisted) to match the existing pattern where UI toggles reset on refresh
- Alternatively, persist layer preferences if users customize them frequently — TBD during /deep-plan
- Integration: each renderable component checks its layer's visibility before rendering

### Performance
- Two viewports ≈ 2x draw calls, but shared geometry (Option A) keeps GPU memory stable
- The GPU tier gating system should apply per-pane (e.g., disable postprocessing in 2D pane)
- Target: 30+ fps on mid-tier GPU with both panes active
- Consider rendering the 2D pane at reduced framerate (15fps) when idle, full rate during interaction

## Dependencies
- **Depends on**: Nothing (this is the foundation)
- **Blocks**: All other splits (02-07) render into these viewports and use these layers
- **Provides**: Dual-pane layout, layer visibility API, camera preset system

## Acceptance Criteria
- [ ] Split-pane visible with 2D left, 3D right, resizable divider
- [ ] Either pane collapsible to single-view mode
- [ ] Selecting a hole in one pane highlights it in the other
- [ ] Orbit controls work in 3D pane; pan/zoom only in 2D pane
- [ ] Camera presets (top, front, side, isometric) with smooth animated transitions
- [ ] Layer panel with at least 4 layers (Holes, Flow Path, Grid, Walls)
- [ ] Layer visibility toggles show/hide corresponding elements
- [ ] Layer opacity slider affects rendering
- [ ] Layer lock prevents interaction with locked elements
- [ ] Mobile fallback: single-pane with toggle, layer panel as overlay
- [ ] Existing 495+ tests still pass
- [ ] Performance: 30+ fps on mid-tier GPU in dual-pane mode
