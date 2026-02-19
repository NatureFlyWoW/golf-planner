# Phase 2: Polish — Design Document

**Goal:** "Does the layout actually work?" — Add guard rails (collision, snap), visual feedback (flow path, ghost preview, 3D view), and workflow tools (undo/redo, named saves, more hole types).

**Builds on:** Phase 1 core + geo features (sun indicator, mini-map, location bar, camera controls).

---

## Implementation Groups

Features are split into 3 groups that build on each other:

- **Group A: Placement Precision** — grid snap, collision detection, ghost preview, rotation drag handle
- **Group B: Visualization** — player flow path, 3D camera toggle
- **Group C: Workflow** — undo/redo, named saves, new hole types

---

## Group A: Placement Precision

### Grid Snap

- New util: `snapToGrid(value: number, gridSize: number): number` — rounds to nearest increment
- Grid size: 0.25m minor grid, rendered as thin lines when snap is enabled
- Toggle: toolbar button + keyboard shortcut `G`
- Applied in `PlacementHandler` (on click) and `MiniGolfHole` (on drag)
- Visual: minor grid lines appear/disappear with toggle

### Collision Detection (SAT-based OBB)

- New util: `checkOBBCollision(holeA: {pos, rot, w, l}, holeB: {pos, rot, w, l}): boolean`
- Uses Separating Axis Theorem on 2D rotated rectangles (4 test axes: 2 edge normals per rectangle)
- Correct for any rotation angle — no false positives from AABB approximation
- Helper: `checkAllCollisions(candidate, allHoles, excludeId?): boolean` — iterates all holes
- Also checks hall boundaries (position must keep hole fully inside walls)
- Placement and drag are blocked when collision is detected

### Ghost Preview

- New R3F component: `GhostHole`
- Rendered in `PlacementHandler` when `tool === "place"` and a type is selected
- Follows mouse via raycasting against floor plane
- Applies grid snap if enabled
- Color: semi-transparent green (`opacity: 0.4`) if valid, semi-transparent red if collision
- Same dimensions as the selected hole type, includes rotation
- Disappears when not in place mode

### Rotation Drag Handle

- Flat `<Ring>` mesh in XZ plane at Y=0.01 (visible from top-down orthographic view)
- Small sphere on ring edge as grab point
- Angle: `atan2(mouseX - holeX, mouseZ - holeZ)` converted to degrees
- Default: snaps to 15-degree increments. Hold Shift: free rotation
- `Hole.rotation` type changes from `0 | 90 | 180 | 270` to `number` (degrees, 0-360)
- Detail panel: numeric input (0-360) with quick-set buttons (0/90/180/270)
- Existing layouts load fine (numbers are valid), detail panel updated to handle any angle

---

## Group B: Visualization

### Player Flow Path

- New R3F component: `FlowPath`
- Visible when `showFlowPath` is true (already in store/UIState)
- Draws dashed lines between holes in `holeOrder` sequence (center to center)
- Uses drei `<Line>` with dashed material, white, 50% opacity
- `depthTest={true}` so lines go behind walls in 3D mode
- Numbered labels at each hole: drei `<Billboard>` + `<Text>` for proper 3D occlusion (not `<Html>`)
- Toggle button in toolbar
- Empty state: nothing rendered when < 2 holes

### 3D Camera Toggle

- Toolbar button: "2D" / "3D" (uses existing `view` state)
- **Dual camera system:** both `<OrthographicCamera>` and `<PerspectiveCamera>` exist in the scene. Toggle switches which has `makeDefault`
- **Top-down mode (current):** orthographic, no rotation, pan/zoom only
- **3D mode:** perspective camera at 45-degree initial angle, `enableRotate={true}` on OrbitControls
- **Transition animation:** `useFrame` loop with `invalidate()` each frame during ~500ms lerp. Temporarily continuous rendering during animation
- **Keyboard/touch controls branch on camera type:**
  - Orthographic: zoom via `camera.zoom` property
  - Perspective: zoom via dolly (move camera position along look direction)
  - `camera instanceof OrthographicCamera` check in all zoom handlers
- `R` key resets to default position in either mode
- Hall walls already have 3D geometry — they become more visible at an angle

---

## Group C: Workflow

### Undo/Redo

- Add `zundo` package (temporal middleware for Zustand)
- **Middleware order:** `temporal(persist(create(...)))` — temporal outermost
- **Temporal partialize:** only tracks `holes`, `holeOrder`, `selectedId` — not ui state, not budget
- Keyboard: `Ctrl+Z` (undo), `Ctrl+Shift+Z` (redo) — added to `useKeyboardControls`
- Toolbar: undo/redo arrow buttons, disabled when history empty
- History limit: 50 steps
- **Drag coalescing:** `temporal.pause()` on pointer-down, `temporal.resume()` on pointer-up — records only final position, not every intermediate drag

### Named Saves

- New UI: dropdown/modal in toolbar area
- Storage: `localStorage` key `golf-planner-saves` — `Record<string, SaveSlot>`
- `SaveSlot = { name: string, holes: ..., holeOrder: ..., savedAt: string }`
- Actions: Save As, Load, Rename, Delete
- Max 10 slots (warn when full)
- Current auto-save (`golf-planner-state`) continues as the "active" layout
- **Dirty state tracking:** shallow comparison of current `holes`+`holeOrder` against last-loaded snapshot. Warn on load if unsaved changes exist
- Load replaces current state (holes, holeOrder, selectedId)

### New Hole Types

Three additions to `HOLE_TYPES` array (types already exist in the `HoleType` union):

| Type | Dimensions | Par | Color | Notes |
|------|-----------|-----|-------|-------|
| Loop | 1.8m x 2.0m | 3 | `#00BCD4` teal | Wide curved path |
| Windmill | 1.2m x 2.5m | 4 | `#E91E63` pink | Iconic obstacle |
| Tunnel | 0.6m x 4.0m | 3 | `#607D8B` blue-grey | Long narrow passage |

Visual: colored blocks (same as existing types). Realistic 3D models are future-phase.

---

## Store Changes Summary

- `Hole.rotation`: `number` (was `0 | 90 | 180 | 270`)
- Middleware: `temporal(persist(create(...)))` (was `persist(create(...))`)
- Temporal partialize: `{ holes, holeOrder, selectedId }`
- New actions: `undo()`, `redo()` (from temporal), `saveLayout(name)`, `loadLayout(name)`, `renameLayout(id, name)`, `deleteLayout(id)`
- `UIState` unchanged (already has `snapEnabled`, `showFlowPath`, `view`)

## New Files

- `src/utils/collision.ts` — SAT-based OBB collision + hall boundary check
- `src/utils/snap.ts` — grid snap util
- `src/components/three/GhostHole.tsx` — placement preview
- `src/components/three/RotationHandle.tsx` — drag-to-rotate ring
- `src/components/three/FlowPath.tsx` — numbered route lines
- `src/utils/saveManager.ts` — named save/load/rename/delete logic
- `src/components/ui/SaveManager.tsx` — save slots UI

## Modified Files

- `src/store/store.ts` — temporal middleware, rotation type, save actions
- `src/types/hole.ts` — rotation type change
- `src/constants/holeTypes.ts` — 3 new entries
- `src/components/three/PlacementHandler.tsx` — ghost preview, snap, collision
- `src/components/three/MiniGolfHole.tsx` — snap on drag, collision on drag, temporal pause/resume
- `src/components/three/CameraControls.tsx` — dual camera, 3D orbit, perspective zoom
- `src/components/ui/HoleDetail.tsx` — numeric rotation input + presets
- `src/components/ui/Toolbar.tsx` — snap toggle, flow toggle, view toggle, undo/redo, save dropdown
- `src/hooks/useKeyboardControls.ts` — G key (snap), Ctrl+Z/Shift+Ctrl+Z, camera type branching
- `src/App.tsx` — wire new components

## Dependencies

- `zundo` — temporal middleware for undo/redo (~2KB)
- No other new dependencies

## Testing

- `tests/utils/collision.test.ts` — OBB intersection: axis-aligned, rotated, edge cases (touching, identical position, zero-size)
- `tests/utils/snap.test.ts` — snap math
- `tests/utils/saveManager.test.ts` — save/load/rename/delete with mock localStorage
- Existing store tests updated for temporal middleware compatibility
