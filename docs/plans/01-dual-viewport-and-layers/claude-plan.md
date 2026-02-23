# Implementation Plan — 01 Dual Viewport & Layer System

## 1. Context & Goals

Golf Forge is an indoor blacklight mini golf hall layout planner (React 19 + R3F + Zustand + Tailwind). Currently it has a **single Canvas** with a toggle that switches between 2D (orthographic top-down) and 3D (perspective) views — only one visible at a time.

This plan transforms it into a **professional split-pane dual viewport** with a **layer visibility system**:

- **2D pane** (left): Orthographic top-down floor plan — pan/zoom, no rotation
- **3D pane** (right): Perspective view with orbit controls, camera presets
- **Resizable divider**: Drag to resize, double-click to collapse to single view
- **Layer panel**: New sidebar tab controlling visibility, opacity, and lock per layer
- **Mobile fallback**: Single-pane with existing toggle behavior on screens <768px

This is the **foundation split** — all subsequent features (dimensions, annotations, zones, 3D environment, rich 2D, export) render into these viewports and integrate with these layers.

### User-Visible Outcomes

Opening the app shows a side-by-side layout: 2D floor plan on the left, 3D perspective on the right. Users can resize the split by dragging the divider. Clicking a hole in either pane selects it in both. Holes can be moved in both panes. Camera preset buttons in the 3D corner switch to Top/Front/Isometric views with smooth animation. A new "Layers" tab in the sidebar lets users toggle visibility, adjust opacity, and lock individual layers. On mobile, it gracefully falls back to the existing single-view toggle.

---

## 1b. Architecture Validation Spike (Pre-Implementation)

Before full implementation, build a **minimal proof-of-concept** to validate two critical unknowns:

1. **View + EffectComposer compatibility**: Create a minimal dual-View setup with EffectComposer in one View. Verify whether effects bleed into the other View or break rendering. Test both dual mode and collapsed (single-View) mode.
2. **View + existing scene complexity**: Render the existing scene (Hall, holes, Environment map, SoftShadows, fog) through two Views to verify no subtle rendering bugs.

**If the spike reveals incompatibility:**
- **Plan B (fallback)**: Keep the existing single-Canvas toggle for viewport switching but still implement the layer system (independently valuable). Dual-pane becomes a future enhancement when R3F/drei support improves.
- The layer system, camera presets, and keyboard improvements are all valuable regardless of whether dual-pane works.

This spike should take ~30 minutes and prevents days of debugging later.

---

## 2. Architecture Overview

### Single Canvas with drei View Components

We use `@react-three/drei`'s `<View>` component to split one WebGL context into two viewports. Views use `gl.scissor` internally — each View is an unstyled HTML div that controls viewport position and bounds.

**Key pattern:**
- A parent container `ref` is passed to `<Canvas eventSource={containerRef}>`
- Two `<View>` components (which are styled divs) define their respective pane positions via CSS
- `<View.Port />` inside the Canvas renders both views
- Each View contains its own camera and controls
- The Canvas is positioned `absolute inset-0` behind the View divs

**Why not two Canvas instances:** Two `<Canvas>` elements would mean two WebGL contexts, double GPU memory, duplicate textures/geometries. The single-Canvas approach shares everything.

### Component Hierarchy

```
App.tsx
├── Toolbar (modified: remove view toggle button)
├── main content area (flex)
│   ├── Sidebar (modified: add 4th "Layers" tab)
│   │   ├── HoleLibrary tab
│   │   ├── HoleDetail tab
│   │   ├── BudgetPanel tab
│   │   └── LayerPanel tab (NEW)
│   └── DualViewport (NEW — replaces current canvas area)
│       ├── Pane2D (View div, width = splitRatio)
│       │   └── OrthographicCamera + OrbitControls + SharedScene
│       ├── SplitDivider (NEW — draggable resize handle)
│       ├── Pane3D (View div, width = 1-splitRatio)
│       │   └── PerspectiveCamera + CameraControls + SharedScene + 3DOnlyContent
│       │   └── CameraPresets overlay (HTML buttons in corner, outside Canvas)
│       ├── MiniMap overlay (repositioned to 2D pane corner)
│       ├── SunControls overlay (repositioned)
│       └── <Canvas eventSource={containerRef} style="position:absolute; inset:0">
│           └── <View.Port />
├── LocationBar, BottomToolbar, HoleDrawer (unchanged)
└── Builder overlay (unchanged — separate Canvas, z-50)
```

### Scene Content Split

Scene content is split into two categories to avoid singleton issues (e.g., GodRaysSource registering a mesh ref in the store):

**SharedScene** — rendered in BOTH Views:
- Lighting (ambient + directional)
- Hall, PlacedHoles, FlowPath, FloorGrid, SunIndicator (all checking layer state)
- PlacementHandler (pointer interaction — gated by `activeViewport`)

**ThreeDOnlyContent** — rendered ONLY in the 3D View:
- Fog, Environment map, SoftShadows
- UVLamps, GodRaysSource, Sparkles
- PostProcessing / UVEffects (see Section 8 for critical details)

**React component duplication note:** Both Views instantiate SharedScene independently. This means React components (PlacedHoles, Hall, etc.) are mounted twice — doubling Zustand selector calls, `useFrame` callbacks, and pointer event handlers. For our small scene (~18 holes, hall, grid, flow path), this overhead is acceptable. The expensive GPU work (draw calls) is also doubled, but shared geometry/textures keep memory stable. Performance must be validated during implementation (see Section 9).

### Mobile Layout

On mobile (<768px), `DualViewport` renders as a **single pane** using the existing single-Canvas pattern. The `ui.view` toggle continues to switch between "top" and "3d" modes. Layer panel becomes a mobile overlay (bottom sheet pattern matching `MobileSunControls`, `MobileBudgetPanel`).

---

## 3. Type Definitions

### New Types File: `src/types/viewport.ts`

```typescript
type ViewportLayout = "dual" | "2d-only" | "3d-only";

type CameraPreset = "top" | "front" | "back" | "left" | "right" | "isometric";

type LayerId =
  | "holes"
  | "flowPath"
  | "grid"
  | "walls"
  | "sunIndicator";
// Future splits will add: "dimensions", "annotations", "zones"

type LayerState = {
  visible: boolean;
  opacity: number;    // 0-1 range
  locked: boolean;
};

type LayerDefinition = {
  id: LayerId;
  label: string;
  icon: string;       // Lucide icon name
};
```

### UIState Additions

Add to existing `UIState` type in `src/types/ui.ts`:

```typescript
viewportLayout: ViewportLayout;       // "dual" | "2d-only" | "3d-only"
activeViewport: "2d" | "3d" | null;   // which pane has focus (for keyboard/event routing)
splitRatio: number;                    // 0.0-1.0 (0.5 = 50/50), only used in "dual" mode
layers: Record<LayerId, LayerState>;   // layer visibility/opacity/lock
```

Also update `SidebarTab` to add `"layers"` and `ActivePanel` to add `"layers"`.

**Deprecation:** The existing `view: ViewMode` field ("top" | "3d") continues to exist for mobile single-pane mode but is unused in dual-pane layout on desktop.

---

## 4. Store Architecture

### Viewport & Layer State

The existing store uses a single monolithic `create()` call (no slice pattern). New viewport/layer state and actions are added inline to the store, following the existing pattern (or extracted as action factory functions like `createBuilderActions`).

**Viewport layout actions:**
- `setViewportLayout(layout)` — switches between "dual", "2d-only", "3d-only"
- `setSplitRatio(ratio)` — set split ratio, clamped 0.2–0.8
- `collapseTo(pane: "2d" | "3d")` — sets `viewportLayout` to "2d-only" or "3d-only" (splitRatio is preserved for when user re-expands)
- `expandDual()` — sets `viewportLayout` back to "dual" (restores last splitRatio)
- `setActiveViewport(viewport)` — set which pane has focus for keyboard/event routing

**Layer management actions:**
- `setLayerVisible(layerId, visible)`
- `setLayerOpacity(layerId, opacity)` — clamped 0–1
- `setLayerLocked(layerId, locked)`
- `toggleLayerVisible(layerId)`
- `toggleLayerLocked(layerId)`
- `resetLayers()` — all visible, 100% opacity, unlocked

**Default state:**

```typescript
const DEFAULT_LAYERS: Record<LayerId, LayerState> = {
  holes:        { visible: true, opacity: 1, locked: false },
  flowPath:     { visible: true, opacity: 1, locked: false },
  grid:         { visible: true, opacity: 1, locked: false },
  walls:        { visible: true, opacity: 1, locked: false },
  sunIndicator: { visible: true, opacity: 1, locked: false },
};
```

Only the 5 active layers are included. Future splits (02, 03) will register their own layer IDs when implemented.

**Persistence:** Layer state and viewport layout are **ephemeral** — not included in `partialize`, reset on refresh. Matches existing UI toggle behavior.

**No undo/redo tracking:** Layers and viewport layout are view state, not document state. Excluded from temporal middleware.

---

## 5. Split-Pane Layout

### DualViewport Component: `src/components/layout/DualViewport.tsx`

Replaces the current `<div className="relative flex-1">` + `<Canvas>` block in `App.tsx`.

**Responsibilities:**
- Render two View divs side by side with the divider between them
- Position the Canvas absolutely behind both panes with `eventSource` pointing to the container ref
- Render `<View.Port />` inside the Canvas
- Handle mobile detection: render single-pane fallback on <768px (using existing `useMediaQuery` or Tailwind breakpoint)
- Manage overlay positioning: MiniMap in 2D pane corner, SunControls/KeyboardHelp as overlays
- Set `activeViewport` on `onPointerEnter` of each pane div (for event routing)

### useSplitPane Hook: `src/hooks/useSplitPane.ts`

Custom hook managing the resize interaction (~80-100 LOC):

- **State:** `isDragging` ref, container width measurement via `ResizeObserver` or `getBoundingClientRect`
- **Mouse events:** `onMouseDown` starts drag, `onMouseMove` updates ratio, `onMouseUp` ends drag
- **Touch events:** Same flow with touch equivalents
- **Clamping:** Ratio clamped to 0.2–0.8 during drag
- **Double-click:** On divider calls `collapseTo(activeViewport)` or `expandDual()` to toggle
- **Cursor:** Sets `cursor: col-resize` on document body during drag

### SplitDivider Component: `src/components/layout/SplitDivider.tsx`

Thin vertical bar (4px visual width, 12px touch hitzone) between the two panes.

**Visual design:**
- Default: subtle border color (`border-subtle` from Tailwind theme)
- Hover: accent color highlight, show collapse chevrons
- Dragging: accent color, full opacity
- Collapse arrows: Small `<` `>` chevrons appear on hover, clicking collapses in that direction

---

## 6. Viewport Panes & Camera Setup

### SharedScene Component: `src/components/three/SharedScene.tsx`

Extracted from current `ThreeCanvas.tsx`. Contains all scene content that renders in both Views:

- `<ambientLight>` + `<directionalLight>` (sun-positioned or static)
- `<Hall>` (floor, walls, doors, windows) — with layer checks
- `<PlacedHoles>` — with layer checks
- `<FlowPath>` — with layer checks (replaces `showFlowPath` toggle)
- `<FloorGrid>` — with layer checks
- `<SunIndicator>` — with layer checks
- `<PlacementHandler>` — with `activeViewport` gating

### ThreeDOnlyContent Component: `src/components/three/ThreeDOnlyContent.tsx`

Rendered only inside the 3D View. Contains singleton and effects-related components:

- `<fogExp2>` + `<FogController>` (UV + 3D only)
- `<Environment preset="night">` with lightformers
- `<SoftShadows>` (high GPU tier)
- `<UVLamps>` (UV mode)
- `<GodRaysSource>` (stores mesh ref in Zustand — must be singleton)
- `<Sparkles>` (GPU tier gated)
- PostProcessing (see Section 8)
- `<ScreenshotCapture>` (captures from 3D camera)

### 2D Pane Camera

```
OrthographicCamera:
  position = [hallWidth/2, 50, hallLength/2]  (centered above hall)
  zoom = 40, near = 0.1, far = 200

OrbitControls:
  enableRotate = false  (pan + zoom only)
  minZoom = 15, maxZoom = 120
  mouseButtons = { MIDDLE: PAN, RIGHT: PAN }
  touches = { ONE: PAN, TWO: DOLLY_PAN }
```

### 3D Pane Camera

```
PerspectiveCamera:
  position = isometric view of hall (calculated)
  fov = 60, near = 0.1, far = 500

CameraControls (drei, camera-controls library):
  Supports setLookAt(position, target, enableTransition) for smooth presets
  Inject specific camera via camera prop
```

**Context-aware mouse interaction in 3D pane:**
- Left-click on hole = select it (R3F pointer event on mesh)
- Left-drag on hole = move it (R3F pointer events)
- Left-drag on empty space = orbit camera (falls through to CameraControls)
- Right-drag = pan camera (CameraControls)
- Scroll = zoom (CameraControls)

### Pointer Event Isolation Between Views

**Critical architecture concern:** With `eventSource={containerRef}`, both Views independently process pointer events. A click at world position X hits the hole mesh in BOTH Views.

**Solution:** Position-based viewport detection in event handlers:

1. Each View wraps its content in `<ViewportContext.Provider value="2d"|"3d">`
2. Pointer event handlers compare `e.nativeEvent.clientX` against the pane boundary (divider position) to determine which pane the event originated from
3. If the event's screen position doesn't match the handler's viewport, return early
4. This is more robust than `onPointerEnter`-based `activeViewport` tracking, which has stale-state issues during fast mouse movements across the divider
5. `activeViewport` in the store is still useful for **keyboard** routing (set on click/focus), just not for pointer gating

### setPointerCapture Migration (Critical)

**Problem:** `MiniGolfHole.tsx` and `RotationHandle.tsx` use `e.nativeEvent.target.setPointerCapture(pointerId)` during drag operations. The target is the shared Canvas DOM element. When one View captures the pointer, ALL pointer events route to that Canvas exclusively, breaking the other View's camera controls.

**Solution:** Remove `setPointerCapture` from hole drag/rotation handlers. Instead:
- Track drag state via component-local refs (already partially done with `dragStart.current`)
- Use floor-plane raycasting for the full drag lifecycle (PlacementHandler already does this pattern)
- Use `onPointerMove` on a full-pane invisible mesh (like PlacementHandler's approach) instead of relying on pointer capture to receive move events outside the original target

This ensures only the pane the mouse is hovering over processes interaction events.

### CameraPresets Component: `src/components/three/CameraPresets.tsx`

Small overlay buttons positioned in the 3D pane's top-right corner using absolute CSS positioning (HTML div inside the 3D pane div, outside the Canvas).

**Buttons:** Top | Front | Back | Left | Right | Iso

**Behavior:** Clicking a preset calls `cameraControlsRef.current.setLookAt(pos, target, true)` which smoothly animates (~0.3-0.5s) to the target position.

**Preset positions:** Calculated from hall dimensions. Defined in a utility `src/utils/cameraPresets.ts`:

```typescript
type CameraPresetConfig = {
  position: [number, number, number];
  target: [number, number, number];
};

function getCameraPresets(hallWidth: number, hallLength: number): Record<CameraPreset, CameraPresetConfig>;
```

### Keyboard Controls Migration

The existing `useKeyboardControls` hook directly manipulates camera position and OrbitControls via refs. It must be refactored to be viewport-aware:

- Read `activeViewport` from store
- Maintain refs to both the 2D OrbitControls and 3D CameraControls
- Keyboard shortcuts (R = reset camera, F = fit to holes, +/- = zoom) dispatch to the active pane's controls
- Camera preset shortcuts (1-6) only apply when activeViewport is "3d"

---

## 7. Layer System Implementation

### Layer Integration Pattern

Each renderable component that belongs to a layer follows this pattern:

1. Read layer state from store: `useStore(s => s.ui.layers[layerId])`
2. If `!visible`, return `null` (existing R3F conditional rendering pattern)
3. If `opacity < 1`, pass opacity to materials as a prop
4. If `locked`, skip pointer event handlers (return early in onClick/onPointerDown)

**Components and their layers:**

| Component | Layer | Opacity approach | Lock approach |
|-----------|-------|------------------|---------------|
| `PlacedHoles` | `holes` | Pass opacity to MiniGolfHole materials | Skip pointer event handlers |
| `FlowPath` | `flowPath` | Line/Text material opacity | No interaction (view-only) |
| `FloorGrid` | `grid` | Visibility toggle only* | No interaction (view-only) |
| `Hall` (walls/doors/windows) | `walls` | Wall/door/window material opacity | No interaction currently |
| `SunIndicator` | `sunIndicator` | Marker material opacity | No interaction currently |

*Grid uses drei's `<Grid>` component which manages its own materials internally. Opacity slider is present in the UI but may have limited effect. Visibility toggle (show/hide) works fully. Custom grid rendering can be added later to support opacity.

### Opacity Implementation

For simple materials: set `material.opacity` and `material.transparent = true` when opacity < 1.

For holes (complex PBR materials with multiple meshes): pass `opacity` prop down through MiniGolfHole to segment renderers. Each material sets `transparent: opacity < 1` and `opacity: layerOpacity`.

### Lock Implementation

When locked, objects should not respond to pointer events (click, hover, drag) and not show hover highlighting.

Implementation: Check `layers[layerId].locked` at the top of pointer event handlers. If locked, return immediately (don't even call `stopPropagation` — let the event pass through to camera controls).

### LayerPanel Component: `src/components/ui/LayerPanel.tsx`

New sidebar tab content. `SidebarTab` type updated to include `"layers"`.

**LayerRow layout per layer:**
```
[Eye icon] [Layer label] [───── Opacity slider ─────] [Lock icon]
```

- Eye icon: Lucide `Eye` / `EyeOff` — toggles visibility
- Label: Text
- Opacity slider: Range input 0–100%, mapped to 0–1
- Lock icon: Lucide `Lock` / `Unlock` — toggles lock

**Reset button** at bottom: "Reset All Layers"

**Mobile:** Accessible via `MobileLayerPanel` overlay (same pattern as existing mobile panels).

---

## 8. PostProcessing Strategy (Critical)

### The Problem

`@react-three/postprocessing`'s `EffectComposer` takes over the entire Canvas rendering pipeline. It replaces `gl.render()` with a multi-pass render-to-texture pipeline and does NOT respect `<View>` scissor boundaries. **PostProcessing cannot be scoped to a single View.**

### The Solution

**PostProcessing is disabled in dual-pane mode.** Effects only run when the 3D pane is expanded to fullscreen (`viewportLayout === "3d-only"`).

**Rationale:**
- The user specified effects should apply to "3D pane only" — in fullscreen 3D, this is exactly what happens
- The 2D pane is for precision editing and should be clean anyway
- In dual mode, the 3D pane serves as a preview — full visual fidelity comes when expanded
- This is the simplest and most robust approach, with no risk of View rendering conflicts

**Implementation:**
- PostProcessing/UVEffects components check `viewportLayout !== "dual"` before rendering
- When `viewportLayout === "3d-only"`, the 3D View renders fullscreen with full postprocessing (identical to current single-canvas 3D mode)
- When `viewportLayout === "2d-only"`, no postprocessing needed (2D mode)

**Future enhancement (if needed):** Render the 3D View to an offscreen render target, apply postprocessing, then composite the result. This would allow effects in dual mode but adds significant complexity.

### Environment Gating Migration

Existing gating functions (`shouldEnableFog`, `deriveFrameloop`, etc.) check `ui.view` which is deprecated in dual mode. Refactor to accept a viewport context:

- `shouldEnableFog(uvMode, viewportLayout)` — enabled when 3D-only or when 3D pane renders fog in dual
- `deriveFrameloop(uvMode, gpuTier, transitioning, viewportLayout)` — same logic but uses layout state
- PostProcessing gating: add `viewportLayout` check

---

## 9. Performance Strategy

### Canvas Frameloop

**Important constraint:** Both Views share one Canvas, so the frameloop is global. It cannot be independently controlled per View.

- When `viewportLayout === "dual"` and 3D content has animations (sparkles, UV effects): `frameloop="always"`
- When 3D pane has no animation: `frameloop="demand"` with `invalidate()` on control changes
- The 2D pane re-renders every frame when frameloop is "always", but cheaply (no postprocessing, no fog, no effects)

### Per-Pane Cost

| Aspect | 2D Pane | 3D Pane |
|--------|---------|---------|
| Draw calls | Scene geometry (shared) | Scene geometry + effects geometry |
| PostProcessing | None | None in dual mode; full in 3d-only mode |
| Shadows | Disabled | Per GPU tier |
| Fog | Disabled | UV mode only |
| Environment | Disabled | Enabled |

### Performance Validation

During implementation, benchmark the following on a mid-tier GPU:
- FPS in dual-pane mode with 18 holes placed
- FPS when interacting (drag, orbit) in each pane
- Compare to current single-pane FPS
- Target: 30+ fps in dual mode, no regression in single-pane (collapsed) mode

If performance is unacceptable, consider:
1. Reducing 2D pane draw calls (simplified hole meshes in 2D?)
2. Using `invalidate()` more aggressively
3. Lowering DPR in dual mode

---

## 10. Existing Feature Migration

### Toolbar Changes

- **Remove** the view toggle button (2D/3D switch) — replaced by dual-pane layout
- The `ui.view` state remains for mobile single-pane mode only
- All other toolbar buttons unchanged

### FlowPath Toggle Migration

The existing `showFlowPath` toggle is superseded by the `flowPath` layer. **Keep the toolbar toggle** as a convenience shortcut that calls `toggleLayerVisible("flowPath")` instead of toggling `ui.showFlowPath`. Remove the standalone `showFlowPath` field from UIState.

**Important:** Both `Toolbar.tsx` AND `BottomToolbar.tsx` (mobile) reference `showFlowPath` / `toggleFlowPath`. Both must be migrated to use the layer system.

### Grid Toggle

Any existing grid toggle routes through `toggleLayerVisible("grid")`.

### UV Mode

UV mode is **not** a layer — it's a rendering mode that changes materials, lighting, and effects globally. Remains in `ui.uvMode`.

### ScreenshotCapture

The current `ScreenshotCapture` calls `gl.render(scene, camera)` which renders the full scene to the full Canvas, ignoring View scissor boundaries. In dual mode, this would produce a fullscreen render from one camera, not the dual-pane layout.

**Fix:** Refactor ScreenshotCapture to render to an offscreen `WebGLRenderTarget` with a specific camera, then extract the texture as an image. This gives clean single-camera screenshots regardless of viewport mode. The component moves to `ThreeDOnlyContent` to access the 3D camera.

### Overlay Repositioning

- **MiniMap**: Moves to the 2D pane corner (absolute positioned inside the 2D pane div)
- **SunControls**: Remains as overlay on the DualViewport container
- **KeyboardHelp**: Remains as overlay on the DualViewport container

---

## 11. Mobile & Responsive

### Desktop (>=768px): Dual-Pane

Full dual viewport with resizable divider, all features active.

### Mobile (<768px): Single-Pane Fallback

- `DualViewport` detects width and renders single-pane mode with existing Canvas pattern
- `ui.view` toggle ("top"/"3d") continues to work
- Existing mobile toolbar, hole drawer, detail panel — unchanged
- Layer panel accessible via `MobileLayerPanel` overlay
- Camera presets accessible via mobile overlay

### Tablet (768px-1024px)

Dual-pane works with 50/50 default. Can be adjusted via divider.

---

## 12. Testing Strategy

### Unit Tests

**Viewport/layer store tests:**
- `setViewportLayout` correctly updates state
- `setSplitRatio` clamps to 0.2–0.8
- `collapseTo` sets viewportLayout without changing splitRatio
- `expandDual` restores "dual" layout
- `setLayerVisible/Opacity/Locked` update correct layer
- `toggleLayerVisible/Locked` flip state
- `resetLayers` restores all defaults
- Default state: all 5 layers visible, opacity 1, unlocked
- `activeViewport` updates correctly

**Camera preset tests:**
- `getCameraPresets` returns correct positions for given hall dimensions
- All 6 presets have valid position and target vectors
- Positions are centered on hall

**useSplitPane tests:**
- Ratio clamping to 0.2–0.8
- Double-click toggle behavior

### Integration Tests

- When `layers.holes.visible = false`, PlacedHoles returns null
- When `layers.holes.locked = true`, holes skip pointer event handlers
- Opacity prop flows through to materials
- `flowPath` layer replaces `showFlowPath` toggle

### Visual Regression Tests (Playwright)

- Dual-pane layout at 1280x720
- Collapsed-to-2D mode
- Collapsed-to-3D mode
- Layer panel in sidebar

### Existing Test Preservation

All 495 existing tests pass unchanged. They test store logic, placement math, and utilities — none depend on single-canvas layout.

---

## 13. File Structure Summary

### New Files

```
src/
  types/
    viewport.ts              # ViewportLayout, CameraPreset, LayerId, LayerState types
  components/
    layout/
      DualViewport.tsx       # Main split-pane container with Canvas + Views
      SplitDivider.tsx       # Resizable divider with collapse arrows
    three/
      SharedScene.tsx        # Scene content rendered in both Views
      ThreeDOnlyContent.tsx  # 3D-only content (effects, fog, env)
      CameraPresets.tsx      # 3D pane camera preset overlay buttons
    ui/
      LayerPanel.tsx         # Sidebar layer tab content
      LayerRow.tsx           # Individual layer control row
      MobileLayerPanel.tsx   # Mobile overlay for layers
  hooks/
    useSplitPane.ts          # Split-pane resize hook
  utils/
    cameraPresets.ts         # Camera preset position calculations
tests/
  store/
    viewportSlice.test.ts    # Layer/viewport store tests
  utils/
    cameraPresets.test.ts    # Camera preset calculation tests
```

### Modified Files

```
src/
  App.tsx                    # Replace canvas area with DualViewport
  types/ui.ts                # Add viewport/layer fields, update SidebarTab, ActivePanel
  store/store.ts             # Add viewport/layer state + actions
  components/
    three/
      ThreeCanvas.tsx        # Refactor into SharedScene + ThreeDOnlyContent
      CameraControls.tsx     # Refactor into per-view camera components
      PlacedHoles.tsx        # Add layer visibility/opacity/lock checks
      FlowPath.tsx           # Route through layer system (replace showFlowPath)
      FloorGrid.tsx          # Route through layer system
      Hall.tsx               # Add walls layer checks
      SunIndicator.tsx       # Add layer checks
      UVEffects.tsx          # Add viewportLayout check (disable in dual mode)
      PostProcessing.tsx     # Add viewportLayout check
    ui/
      Sidebar.tsx            # Add 4th "Layers" tab
      Toolbar.tsx            # Remove view toggle, update flow path toggle
  hooks/
    useKeyboardControls.ts   # Refactor for viewport-aware keyboard dispatch
  utils/
    environmentGating.ts     # Refactor to use viewportLayout instead of ui.view
```

---

## 14. Implementation Order

0. **Architecture Validation Spike** — Minimal proof-of-concept: dual View + EffectComposer + existing scene. Validate or trigger Plan B.
1. **Types & Store** — Define viewport/layer types, add state + actions to store
2. **Split-Pane Layout** — Build DualViewport, SplitDivider, useSplitPane hook (HTML/CSS only, no Canvas yet)
3. **Dual Canvas Architecture** — Set up Canvas + View + View.Port pattern, extract SharedScene and ThreeDOnlyContent from ThreeCanvas
4. **Camera System** — Per-pane cameras and controls, camera presets with smooth transitions
5. **Event Isolation & Interaction** — Position-based viewport gating, ViewportContext, setPointerCapture migration, refactor useKeyboardControls
6. **Layer State Integration** — Wire layer state to renderable components (PlacedHoles, FlowPath, Grid, Hall, SunIndicator)
7. **Layer Panel UI** — Build sidebar Layers tab with controls, mobile overlay
8. **PostProcessing & Effects Scoping** — Disable effects in dual mode, refactor environment gating, ScreenshotCapture refactor
9. **Feature Migration & Overlays** — Toolbar + BottomToolbar cleanup, flowPath toggle migration, overlay repositioning (MiniMap, SunControls)
10. **Mobile Fallback** — Ensure single-pane mode on <768px, mobile layer panel
11. **Polish & Performance** — Frameloop optimization, performance benchmarking, visual regression tests, edge cases
