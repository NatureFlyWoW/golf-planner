# Complete Specification — 01 Dual Viewport & Layer System

## Overview

Transform Golf Forge's single-canvas toggle-based view into a professional **split-pane dual viewport** with a comprehensive **layer visibility system**. This is the foundational split — every subsequent feature (measurement, annotations, zones, 3D environment, rich 2D) renders into these viewports and integrates with these layers.

**User-Visible Outcomes:**
- Opening the app shows a **side-by-side layout**: 2D floor plan (left) + 3D perspective (right)
- A **draggable divider** resizes the panes; double-click to collapse to single view
- Holes can be selected and moved in **both panes** with synchronized state
- **Camera preset buttons** appear in the 3D pane corner (Top, Front, Isometric, etc.)
- A new **"Layers" sidebar tab** lets users toggle visibility, adjust opacity, and lock layers
- On mobile, collapses gracefully to the existing single-pane toggle

## Current State (What Exists Today)

- **View toggle**: `ui.view` switches between `"top"` (orthographic) and `"3d"` (perspective) — mutually exclusive, one at a time
- **Single Canvas**: One `<Canvas>` in `App.tsx` with `ThreeCanvas` rendering the entire scene
- **CameraControls.tsx**: Creates both OrthographicCamera and PerspectiveCamera, switches via `makeDefault` based on `ui.view`
- **OrbitControls**: Already configured — rotation enabled in 3D, disabled in 2D. Pan/zoom in both.
- **No layer system**: Individual toggles (`showFlowPath`, grid enable, `uvMode`) but no unified model
- **Key dependencies**: `@react-three/fiber` 9.5.0, `@react-three/drei` 10.7.7, `three` 0.183.0

## Architecture Decision: Single Canvas with View Components

**Chosen: Option A — Single `<Canvas>` with drei `<View>` components**

This uses drei's View component to split one WebGL context into two viewports via `gl.scissor`. Each View tracks a DOM div and renders through its own camera.

### Architecture Pattern

```
<main ref={containerRef}>
  <!-- 2D pane tracking div (CSS positioned left) -->
  <div ref={view2dRef} style="width: {splitRatio}; height: 100%">
    <View track={view2dRef}>
      <OrthographicCamera makeDefault />
      <OrbitControls enableRotate={false} />
      <!-- scene content -->
    </View>
  </div>

  <!-- Resizable divider -->
  <div class="cursor-col-resize w-1" />

  <!-- 3D pane tracking div (CSS positioned right) -->
  <div ref={view3dRef} style="width: {1-splitRatio}; height: 100%">
    <View track={view3dRef}>
      <PerspectiveCamera makeDefault />
      <CameraControls />  <!-- drei CameraControls for setLookAt presets -->
      <!-- scene content -->
    </View>
  </div>

  <!-- Single Canvas renders both Views -->
  <Canvas eventSource={containerRef} style="position: absolute; inset: 0">
    <View.Port />
  </Canvas>
</main>
```

**Why this approach:**
- Shared textures/geometries — no GPU memory duplication
- drei v10.7.7 has mature View support
- `eventSource` on a parent container handles events across both views
- Each View gets its own camera and controls — complete independence
- Performance: single WebGL context, shared scene graph

## Dual Viewport Requirements

### Split-Pane Layout
1. **Default**: 50/50 split, 2D (orthographic top-down) on left, 3D (perspective with orbit) on right
2. **Resizable divider**: Drag to adjust ratio. Minimum 20% per pane; below 20% snaps to collapse.
3. **Collapse**: Double-click divider to expand focused pane to fullscreen. Click again to restore.
4. **Camera preservation**: Collapsing remembers the hidden pane's camera state; re-expanding restores it.
5. **Independent zoom/pan**: Each pane has its own zoom level and pan offset.

### Camera System

**2D Pane (left):**
- OrthographicCamera centered above hall
- OrbitControls with `enableRotate={false}` — pan + zoom only
- Zoom range: 15–120 (existing values)

**3D Pane (right):**
- PerspectiveCamera, fov 60
- drei `CameraControls` (not OrbitControls) — supports `setLookAt` with smooth animated transitions
- Context-aware mouse: click = select, drag on hole = move, drag on empty = orbit
- Right-drag = pan, scroll = zoom

**Camera Presets (3D pane only):**
| Preset | Position | Target |
|--------|----------|--------|
| Top | Center above hall at Y=50 | Hall center |
| Front | Center at Z=-20, Y=2 | Hall center |
| Back | Center at Z+20, Y=2 | Hall center |
| Left | X-20, Y=2 | Hall center |
| Right | X+20, Y=2 | Hall center |
| Isometric | Existing calculated position | Hall center |

- Smooth animated transitions: `CameraControls.setLookAt(pos, target, true)` with ~0.3-0.5s ease
- UI: Small overlay buttons in the 3D pane's top-right corner

### Synchronized Interaction
6. **Synchronized selection**: Clicking a hole in one pane highlights it in both (already free via Zustand `selectedHoleId`)
7. **Synchronized hover**: Hovering in one pane shows hover effect in both
8. **Synchronized state**: Moving/rotating a hole in either pane updates both in real-time (free via Zustand)
9. **Both panes editable**: Select + move holes in 2D (existing) AND 3D (new context-aware interaction)

## Layer System Requirements

### Layer Definitions

| LayerId | Label | Controls | Default |
|---------|-------|----------|---------|
| `holes` | Holes | All placed holes | Visible, 100%, Unlocked |
| `flowPath` | Flow Path | Player flow path + numbers | Visible, 100%, Unlocked |
| `grid` | Grid | Floor grid overlay | Visible, 100%, Unlocked |
| `walls` | Walls & Doors | Hall walls, doors, windows | Visible, 100%, Unlocked |
| `sunIndicator` | Sun Indicator | Sun position marker | Visible, 100%, Unlocked |
| `dimensions` | Dimensions | (Future — split 02) | Visible, 100%, Unlocked |
| `annotations` | Annotations | (Future — split 03) | Visible, 100%, Unlocked |
| `zones` | Zones | (Future — split 03) | Visible, 100%, Unlocked |

### Layer Controls
10. **Visibility toggle**: Eye icon to show/hide. Component returns `null` when hidden (existing R3F pattern).
11. **Opacity slider**: Per-layer 0–100%. Applied via material opacity to all objects in that layer.
12. **Layer lock**: Lock icon. When locked, objects in that layer cannot be selected, hovered, or moved. Implemented via raycaster layer filtering.
13. **Reset**: Action to reset all layers to defaults.

### Layer Panel UI
14. **Location**: New 4th sidebar tab "Layers" (icon: stacked layers)
15. **Layout per layer**: `[Eye icon] [Layer name] [Opacity slider] [Lock icon]`
16. **Mobile**: Layers accessible via overlay panel (existing mobile overlay pattern)

### Layer State Architecture
- **Zustand slice**: `layers: Record<LayerId, { visible: boolean; opacity: number; locked: boolean }>`
- **Ephemeral**: Resets to defaults on page refresh (matches existing UI toggle patterns)
- **Not persisted**: Not included in partialize/localStorage
- **Not undo-tracked**: Layer toggles are view state, not document state
- **Rendering integration**: Each renderable component reads its layer state from store

### Hybrid Three.js Integration
- **Visibility**: Zustand boolean → component returns null (existing pattern, simpler than Three.js layers)
- **Opacity**: Zustand number → passed as prop to materials
- **Lock**: Zustand boolean → filter pointer events / skip raycaster for locked layers

## Integration Points

### Existing Features Preserved
17. All current toolbar buttons, sidebar tabs, UV mode, budget panel continue to work
18. Flow path toggle (`showFlowPath`) is superseded by layer visibility — remove the standalone toggle, use layer instead
19. Snap toggle, UV mode, undo/redo — unchanged

### Mobile Graceful Degradation
20. On mobile (<768px): Dual-pane collapses to single-pane with existing toggle behavior
21. Layer panel accessible via mobile overlay (same pattern as MobileDetailPanel, MobileSunControls)
22. Touch interactions unchanged in single-pane mode

### Builder Mode
23. When entering Hole Builder, dual-pane layout is replaced by builder's fullscreen Canvas (existing z-50 overlay behavior — no changes needed)

### PostProcessing
24. Effects (bloom, N8AO, GodRays, sparkles) apply to **3D pane only**
25. 2D pane stays clean and crisp for precision editing
26. Implementation: PostProcessing components render only inside the 3D View

### Performance
27. Target: 30+ fps on mid-tier GPU with both panes active
28. 2D pane: demand frameloop (render only on interaction), no postprocessing
29. 3D pane: full rendering per GPU tier settings
30. GPU tier gating applies per-pane
31. Shared geometry/textures via single Canvas keeps memory stable

## Files to Create

| File | Purpose |
|------|---------|
| `src/types/viewport.ts` | ViewportLayout, CameraPreset, LayerId, LayerState types |
| `src/store/viewportSlice.ts` | Layer actions, split ratio, camera presets, viewport layout |
| `src/components/layout/DualViewport.tsx` | Split-pane container with resizable divider |
| `src/components/layout/ViewportPane.tsx` | Individual pane wrapper (camera + controls + scene) |
| `src/components/layout/SplitDivider.tsx` | Draggable divider with collapse behavior |
| `src/components/three/CameraPresets.tsx` | 3D pane camera preset buttons (overlay HTML) |
| `src/components/three/SceneContent.tsx` | Shared scene content rendered in both views |
| `src/components/ui/LayerPanel.tsx` | Sidebar tab for layer controls |
| `src/components/ui/LayerRow.tsx` | Individual layer row (eye, name, slider, lock) |
| `src/hooks/useSplitPane.ts` | Split-pane resize hook |

## Files to Modify

| File | Changes |
|------|---------|
| `App.tsx` | Replace single Canvas area with DualViewport component |
| `src/types/ui.ts` | Add viewportLayout, activeViewport, splitRatio to UIState |
| `src/store/store.ts` | Integrate viewport slice |
| `ThreeCanvas.tsx` | Refactor into SceneContent (shared) — remove direct Canvas wrapping |
| `CameraControls.tsx` | Split into per-viewport camera components or deprecate |
| `Sidebar.tsx` | Add 4th "Layers" tab |
| `Toolbar.tsx` | Remove view toggle button (replaced by dual-pane) |
| `PlacedHoles.tsx` | Check layer visibility/opacity/lock |
| `FlowPath.tsx` | Check layer visibility/opacity (replace showFlowPath toggle) |
| `FloorGrid.tsx` | Check layer visibility/opacity |
| `Hall.tsx` / `HallWalls.tsx` | Check layer visibility/opacity |
| `SunIndicator.tsx` | Check layer visibility/opacity |

## Acceptance Criteria

- [ ] Split-pane visible with 2D left, 3D right, resizable divider (50/50 default)
- [ ] Either pane collapsible to single-view; re-expand restores camera state
- [ ] Minimum 20% pane width; below snaps to collapse
- [ ] Selecting a hole in one pane highlights it in the other
- [ ] Holes can be selected and moved in both 2D and 3D panes
- [ ] 3D pane: context-aware interaction (click=select, drag-hole=move, drag-empty=orbit)
- [ ] Orbit controls work in 3D pane; pan/zoom only in 2D pane
- [ ] Camera presets (Top, Front, Back, Left, Right, Isometric) with smooth animated transitions
- [ ] Camera preset buttons overlaid in 3D pane corner
- [ ] Layer panel as 4th sidebar tab with at least 5 layers (Holes, Flow Path, Grid, Walls, Sun)
- [ ] Layer visibility toggles show/hide corresponding elements
- [ ] Layer opacity slider affects rendering (0–100%)
- [ ] Layer lock prevents interaction with locked elements
- [ ] PostProcessing effects apply to 3D pane only
- [ ] Mobile (<768px): single-pane with toggle, layer panel as overlay
- [ ] Builder mode: fullscreen overlay unaffected
- [ ] Existing 495+ tests still pass
- [ ] Performance: 30+ fps on mid-tier GPU in dual-pane mode
