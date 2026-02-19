# 03 - Architecture

## Application Layout

### Desktop (≥768px)
```
┌──────────────────────────────────────────────────────┐
│ Toolbar: [Select] [Place] [Delete]  [Top|3D]  [Undo] │
├──────────┬───────────────────────────────────────────┤
│          │                                           │
│ Sidebar  │           3D Viewport                     │
│          │           (dominant area)                  │
│ [Holes]  │                                           │
│ [Detail] │    ┌───────────────────────────┐          │
│ [Budget] │    │  BORGA Hall 10×20m        │          │
│          │    │  ·····  ·····  ·····      │          │
│ (content │    │  [H1]→→[H2]→→[H3]        │          │
│  switches│    │        ↙                  │          │
│  by tab) │    │  [H6]←←[H5]←←[H4]        │          │
│          │    └───────────────────────────┘          │
│          │                                           │
└──────────┴───────────────────────────────────────────┘
```

### Mobile (<768px)
```
┌──────────────────┐
│                  │
│   3D Viewport    │
│   (fullscreen)   │
│                  │
│                  │
│                  │
├──────────────────┤
│ [Sel][+][Del][⚙] │  ← bottom toolbar (thumb reach)
└──────────────────┘

Tapping a toolbar icon opens a full-screen overlay panel.
No bottom sheets — too complex to build well. Simple overlay toggles.
```

## State Management

Single Zustand store with logical slices. See [04-data-models.md](./04-data-models.md) for full type definitions.

```
store
├── hall        (read-only BORGA specs)
├── holes       (Record<string, Hole>)
├── holeOrder   (string[] — player flow sequence)
├── budget      (Record<string, BudgetCategory>)
├── ui          (tool, view, sidebarTab, snapEnabled, showFlowPath)
└── selectedId  (string | null)
```

**Persistence:** `zustand/middleware/persist` with `partialize` — only persist `holes`, `holeOrder`, `budget`. Exclude `ui`, `selectedId` (transient state).

**Future:** `zundo` middleware for undo/redo in Phase 2.

## 3D Scene Component Tree

```
<Canvas dpr={[1, 2]} frameloop="demand">
  <Camera />              ← OrthographicCamera, top-down default
  <Controls />            ← OrbitControls, pan/zoom, limited rotation
  <ambientLight />
  <directionalLight />
  <GridOverlay />         ← 1m major lines, 0.25m minor (toggleable)
  <Hall />                ← floor plane + wall segments + door/window planes
  <PlayerFlowPath />      ← numbered lines connecting holes in holeOrder
  <PlacedHoles />         ← iterates holes Record, renders each
    <MiniGolfHole />      ← colored block, click/drag target
  <GhostHole />           ← placement preview (green=valid, red=collision)
</Canvas>
```

## Interaction Models

### Desktop (mouse)
1. Select hole type in Library sidebar tab
2. `ui.tool` → `'place'`, type stored
3. Mouse moves over canvas → raycast against floor plane → GhostHole follows cursor, snapped to grid
4. GhostHole color: green if valid placement, red if colliding/out of bounds
5. Click valid position → hole added to `holes`, appended to `holeOrder`
6. Tool auto-switches to `'select'`, new hole selected in Inspector
7. User can adjust position/rotation in Detail tab or drag on canvas

### Mobile (touch)
1. Tap "Place" in bottom toolbar → hole type picker overlay
2. Select type → overlay closes, `ui.tool` → `'place'`
3. Tap on canvas → hole placed at tap location (snapped to grid)
4. If collision: visual feedback, placement rejected
5. Tool auto-switches to `'select'`, new hole selected
6. Drag to reposition (one-finger drag on selected hole)

### Gesture Disambiguation (mobile)
- **Select tool active:** one-finger = pan canvas, two-finger = zoom
- **Move tool active:** one-finger on hole = drag hole, one-finger on empty = pan, two-finger = zoom
- Tool state makes gestures unambiguous.

## Key Architecture Decisions

| Decision | Choice | Why |
|---|---|---|
| Drag implementation | Custom pointer events + raycasting | DragControls is wrong for grid-snapped 2D placement |
| Wall rendering | Wall segments around openings | CSG boolean ops are complex; colored planes for doors/windows |
| Camera default | Top-down orthographic | 90% of work is layout planning; top-down is clearest and works best on mobile |
| Mobile panels | Full-screen overlays | Bottom sheets are hard to build well; overlays are simple and sufficient |
| Collision detection | AABB (axis-aligned bounding box) | Holes are rectangles; AABB is the simplest correct check |
