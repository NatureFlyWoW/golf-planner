# Implementation Plan — Split 06a: Rich 2D Floor Plan Core + Status Bar

## Overview

This plan transforms the 2D orthographic pane of Golf Forge from a schematic view (thin-line walls, flat-color holes, basic grid) into a professional architectural floor plan (thick solid-fill walls, door swing arcs, window symbols, textured holes, labeled grid, title block, and a live status bar).

Golf Forge is a React 19 + R3F + Zustand indoor mini golf hall layout planner. Split 01 delivered a dual-viewport layout (2D left / 3D right) with a layer system. This split builds on that foundation to achieve Plan7Architekt-level visual quality in the 2D pane.

**User-Visible Outcome:** When this split is complete, opening the app shows a floor plan that looks like professional architectural software — thick walls with door swing arcs, window symbols, textured playing surfaces, labeled coordinates, and a status bar showing cursor position and zoom level.

---

## Architectural Context

### Existing Components

| Component | File | Role |
|-----------|------|------|
| `SharedScene` | `src/components/three/SharedScene.tsx` | Common scene rendered in BOTH viewports |
| `Hall` | `src/components/three/Hall.tsx` | Assembles floor, walls, openings |
| `HallWalls` | `src/components/three/HallWalls.tsx` | 3D box-geometry walls (textured or flat) |
| `HallOpenings` | `src/components/three/HallOpenings.tsx` | Doors/windows as colored planes |
| `HallFloor` | `src/components/three/HallFloor.tsx` | Floor plane |
| `FloorGrid` | `src/components/three/FloorGrid.tsx` | drei `<Grid>` component |
| `DualViewport` | `src/components/layout/DualViewport.tsx` | Split-pane with 2D + 3D Views |
| `LocationBar` | `src/components/ui/LocationBar.tsx` | Bottom info bar (address, coords, sun) |
| `ViewportContext` | `src/contexts/ViewportContext.ts` | Provides `{ id: "2d"|"3d", paneBoundaryX }` |
| Hall constants | `src/constants/hall.ts` | 10x20m hall, 2 doors, 4 windows |

### Critical Architecture Pattern: SharedScene

Both the 2D and 3D Views render `<SharedScene>`, which contains `<Hall>` (floor + walls + openings), `<PlacedHoles>`, `<FlowPath>`, `<FloorGrid>`, and `<SunIndicator>`. This means **the same components render in both viewports**.

To add 2D-only architectural elements, `SharedScene` must become viewport-aware. Components inside `SharedScene` can read `ViewportContext` (already provided by `DualViewport` around each View) to determine which viewport they are in and render accordingly.

### Hall Data
- **Dimensions:** 10.0m wide x 20.0m long
- **Wall thickness:** 0.1m (data), will render at 0.2m in 2D for architectural visibility
- **Doors:** Sectional (3.5m wide, south wall, offset 3.25m), PVC (0.9m wide, south wall, offset 8.1m)
- **Windows:** 4 windows (3.0m wide), 2 on east wall (offsets 2.0m, 10.0m), 2 on west wall (same)

### Rendering Stack
- Single `<Canvas>` with `<View>` components per pane (both Views share the Canvas)
- `ViewportContext.Provider` wraps each View's contents with `{ id: "2d"|"3d" }`
- Zustand store: `ui.layers` for visibility/opacity/lock per layer
- Layer IDs: `holes`, `flowPath`, `grid`, `walls`, `sunIndicator`

### Key Constraints
- `preserveDrawingBuffer: false` required (dual-view mode)
- EffectComposer in 3D View does not bleed into 2D View
- All new meshes that are not interactive must set `raycast` to no-op to avoid blocking hole placement/selection
- PostToolUse hook runs `npx tsc --noEmit` after edits
- Mobile layout uses a single Canvas (no View components) — needs separate handling

---

## Section 1: Rendering Spike

**Goal:** Validate that drei `<Line>` (Line2-based) and `<Text>` (SDF/Troika) deliver architectural-quality rendering in the R3F orthographic View before committing to the full implementation.

### What to Build

A temporary test component (`RenderingSpike.tsx`) mounted in the 2D View that renders:
1. A thick wall rectangle — `<mesh>` with `MeshBasicMaterial` (solid dark fill) plus a `<Line>` outline
2. A door swing arc — `<Line>` with computed quarter-circle points (~24 points)
3. A text label — `<Text>` with inverse-zoom scaling via `useFrame`

### Technical Approach

**Line rendering:** drei `<Line>` with `worldUnits={false}`. Wraps Three.js `Line2` which draws lines as screen-space-expanded triangle strips. Line width stays constant regardless of zoom.

**Text rendering:** drei `<Text>` (Troika SDF). Apply inverse-zoom scaling: `ref.current.scale.setScalar(1 / camera.zoom)` in a `useFrame` callback.

**All new meshes** must set `raycast` to a no-op: `<mesh raycast={() => {}} ...>` to avoid intercepting raycasts for hole placement.

### Success Criteria
- Lines remain crisp at zoom levels from 5x to 100x
- Text is readable at all zoom levels without blurring
- No visible artifacts or performance issues

### Decision Gate
If Line2 produces aliased or blurry results: enable MSAA (`antialias: true`) or investigate FXAA post-processing. If text rendering is inadequate at extreme zoom, increase `sdfGlyphSize`.

---

## Section 2: Viewport-Aware SharedScene

**Goal:** Make `SharedScene` and its children viewport-aware, so 2D-specific components can render only in the 2D pane and 3D-specific components only in the 3D pane.

### The Problem

`SharedScene` renders `<Hall>` (which includes `<HallWalls>` and `<HallOpenings>`) identically in both viewports. We need the 2D viewport to show architectural walls (thick fill, outlines) instead of 3D box-geometry walls, and to show door/window symbols instead of colored planes.

### Approach

Create a `useViewportId()` hook that reads `ViewportContext` and returns the viewport id (`"2d"` or `"3d"` or `null` if outside a viewport). Components use this to conditionally render.

**Modify `Hall` component:** Make it viewport-aware. When in the 2D viewport:
- Skip `<HallWalls>` (3D box walls) — replaced by `ArchitecturalWalls2D`
- Skip `<HallOpenings>` (3D door/window planes) — replaced by `ArchitecturalOpenings2D`
- Still render `<HallFloor>` (the floor plane is needed in both views)

When in the 3D viewport: render everything as before (no change).

**Modify `SharedScene`:** Add `<ArchitecturalFloorPlan>` alongside existing children. The wrapper internally checks viewport and renders 2D content only in the 2D pane.

**Modify `FloorGrid`:** When in the 2D viewport, skip the drei `<Grid>` (will be replaced by `ArchitecturalGrid2D`). The drei `<Grid>` continues to render in 3D.

### Mobile Handling

Mobile top-down view (no `<View>` components, no `ViewportContext`) should get simplified architectural walls (outline only, no fill) when `view === "top"`. Check for `null` viewport context and treat it as a "mobile-2d" mode.

---

## Section 3: Architectural Wall Geometry

**Goal:** Render the hall's four walls as solid-fill thick rectangles with crisp outlines in the 2D pane.

### Wall Geometry Calculations

The hall is 10m x 20m. Walls render as rectangles in the XZ plane at Y=0.02 (slightly above floor to avoid Z-fighting). Visual thickness: 0.2m, extending inward from the hall boundary.

**Wall segments with door/window gaps:**

For each wall, subtract door and window openings to get solid segments. The south wall with two doors becomes three segments: [0, 3.25], [6.75, 8.1], [9.0, 10.0]. East wall with two windows becomes: [0, 2.0], [5.0, 10.0], [13.0, 20.0]. And so on.

### Utility Functions

Create `src/utils/wallGeometry.ts` with pure functions:
- `computeWallSegments(wallSide, hallDimensions, doors, windows)` — returns `{ start: number; end: number }[]`
- `wallSegmentToRect(segment, wallSide, thickness, hallWidth, hallLength)` — returns `{ position: [x, y, z]; size: [w, d] }`

### Component: `ArchitecturalWalls2D`

For each wall segment:
1. **Fill mesh:** `<mesh raycast={() => {}}>` with `<planeGeometry>` and solid dark `MeshBasicMaterial`
2. **Outline:** `<Line>` around the rectangle with `lineWidth={2}`, `worldUnits={false}`

**Colors:**
- Planning mode: fill `#3a3a3a`, outline `#222222`
- UV mode: fill `#1A1A2E`, outline `#2A2A5E`

### Layer Integration
- Renders only when `layers.walls.visible` is true
- Uses `useGroupOpacity` hook for layer opacity

### Batching
Group all wall outline points into a single `<Line segments={true}>` call to minimize draw calls. Each wall segment contributes 4 line segments (rectangle outline = 5 points forming closed loop, stored as 4 segment pairs).

---

## Section 4: Door and Window Symbols

**Goal:** Add standard architectural plan symbols — door swing arcs and window break lines.

### Door Symbols

For each door in `hall.doors`:
1. **Arc:** Quarter-circle (90°) from hinge point, radius = door width. Rendered as `<Line>` polyline (~24 points).
2. **Panel line:** Straight line from hinge point to door edge.
3. **Direction:** Sectional doors open outward (away from hall), PVC doors open inward.

### Arc Point Computation

Create `src/utils/arcPoints.ts`:
- `computeDoorArc(door, hallWidth, hallLength, wallThickness)` — returns array of `[x, y, z]` points
- Input: door spec + which side of the wall the hinge is on
- Output: ~24 points along a quarter-circle arc in the XZ plane at Y=0.02

### Window Symbols

For each window in `hall.windows`:
1. **Glass lines:** Two parallel lines across the opening, slightly inset from wall edges
2. **Break ticks:** Short perpendicular lines at each end marking the wall break

### Component Structure
- `DoorSymbol2D` — arc + panel line for one door
- `WindowSymbol2D` — glass lines + break ticks for one window
- `ArchitecturalOpenings2D` — iterates `hall.doors` and `hall.windows`

### Line Properties
- Door arcs: `lineWidth={1.5}`, planning: `#555555`, UV: `#3A3A6E`
- Window lines: `lineWidth={1}`, planning: `#6699CC`, UV: `#3300AA`
- All lines: `worldUnits={false}`, `raycast` no-op on any meshes

---

## Section 5: Status Bar

**Goal:** Add live cursor coordinates, zoom level, and active layer display to the bottom info bar.

### Existing LocationBar

`LocationBar.tsx` already occupies the bottom bar slot with address, coordinates, and sun data. Rather than creating a duplicate bar, **extend `LocationBar` into a unified `StatusBar`** that includes:
- Left section: existing location info (address, elevation, coordinates)
- Right section: **new** — mouse world position (X, Z in meters), zoom/scale, active layer

### Mouse Position Tracking (Performance-Safe)

`onPointerMove` fires at 60Hz. Writing to Zustand at that rate causes excessive re-renders. Instead:

1. Store mouse position in a **ref** (`mouseWorldPosRef`) inside the 2D pane
2. Create a tiny standalone Zustand store (`mouseStatusStore`) separate from the main store, dedicated to high-frequency updates
3. The `StatusBar` subscribes to this micro-store. Only `StatusBar` re-renders on mouse move — no other components are affected.

Alternatively, use a `requestAnimationFrame`-throttled update to the main store's `ui` slice (~15Hz max).

### Zoom Tracking

Read `camera.zoom` from the orthographic camera in a `useFrame` callback. Update the micro-store or debounce to main store (only when zoom changes by >0.5).

### Pointer Leave

Add `onPointerLeave` on the 2D pane container div (`pane2DRef` in `DualViewport.tsx`) to set mouse position to `null` when cursor exits the 2D pane.

### StatusBar Display

Right section content:
- `X: 5.23m  Z: 12.47m` (or `X: --  Z: --` when outside 2D pane)
- `Scale: 1:50` (computed from camera zoom and viewport dimensions)
- `Layer: Walls` (active layer name)

Style: monospace font for coordinates, `text-xs`, consistent with existing `LocationBar` styling.

### Scale Computation

Create `src/utils/zoomScale.ts`:
- `computeScale(cameraZoom, viewportWidthPx, hallWidthM)` — the scale is `1 : (hallWidthM * cameraZoom * pixelsPerUnit / viewportWidthPx)`. Derive `pixelsPerUnit` from the orthographic camera's frustum parameters.
- Round to nearest standard scale: 1:10, 1:20, 1:25, 1:50, 1:100, 1:200.

---

## Section 6: Grid Refinement and Labeled Coordinates

**Goal:** Replace the drei `<Grid>` in the 2D pane with a custom grid that has labeled coordinates and adaptive spacing.

### Why Custom

The drei `<Grid>` component renders a shader-based infinite grid. It doesn't support labeled coordinates along edges or adaptive density per zoom level. It stays in the 3D pane unchanged.

### New Component: `ArchitecturalGrid2D`

Renders:
1. **Grid lines:** Batched into a single `<Line segments={true}>` call for performance
2. **Labels:** drei `<Text>` at intervals along top and left edges

### Grid Density by Zoom

| Zoom Range | Major Lines | Minor Lines |
|-----------|-------------|-------------|
| < 10 (far) | Every 5m | None |
| 10-30 (medium) | Every 1m | Every 0.5m (lighter) |
| > 30 (close) | Every 1m | Every 0.25m |

### Line Batching Strategy

Instead of individual `<Line>` per grid line, compute all grid line points as segment pairs and render with a single `<Line segments={true}>` call. At medium zoom (1m + 0.5m spacing across 10x20m), this is ~60 segment pairs in one draw call.

### Label Placement
- Top edge: X coordinates (0, 1, 2, ... 10) at `[x, 0.01, -0.5]`
- Left edge: Z coordinates (0, 1, 2, ... 20) at `[-0.5, 0.01, z]`
- Labels use inverse-zoom scaling for constant screen size
- Labels: `fontSize={0.3}`, planning: `#999999`, UV: `#4A4A8E`

### Visual Weight
- Major lines: `lineWidth={0.5}`, planning: `#cccccc`, UV: `#2A2A5E`
- Minor lines: `lineWidth={0.3}`, planning: `#eeeeee`, UV: `#1A1A4E`

### Layer Integration
Respects `layers.grid.visible` and `layers.grid.opacity`.

---

## Section 7: Textured 2D Holes

**Goal:** Replace flat colored rectangles with felt-textured surfaces in the 2D view.

### Approach

Create `HoleFelt2D` component that renders a felt-textured overlay on top of each placed hole in the 2D viewport:
1. **Fill mesh:** A plane at Y=0.03 (above floor and walls, below interaction layer) with procedural felt `ShaderMaterial`
2. **Border:** A `<Line>` outline around the hole boundary with `lineWidth={2}`

The felt shader uses object-space UVs with a subtle noise pattern (value noise via `fract(sin(dot(...)))`) to give a fabric-like appearance. Color tint matches the hole type's accent color.

### Integration with PlacedHoles

`PlacedHoles` renders `MiniGolfHole` for each hole, which includes full 3D models. In the 2D top-down view, these 3D models are visible from above. `HoleFelt2D` renders on top at Y=0.03 with `raycast={() => {}}` to not block interactions.

### Scale-Dependent Rendering

At overview zoom (camera.zoom < 15), render as simple solid-color fill (skip shader). Felt texture appears only at medium and close zoom.

### UV Mode
- Planning: green-tinted felt with hole-type accent color
- UV: dark purple tint with neon accent

---

## Section 8: Scale-Dependent Detail (LOD System)

**Goal:** Implement zoom-level-based rendering that shows appropriate detail at each zoom level.

### LOD Hook: `useZoomLOD()`

Returns a detail level based on `camera.zoom`:
- `"overview"`: zoom < 15
- `"standard"`: 15 ≤ zoom < 40
- `"detail"`: zoom ≥ 40

Uses `useFrame` to read camera zoom and stores in a ref (no React state, no re-renders). Components read the ref value during their own render or `useFrame`.

### What Changes Per Level

| Feature | Overview (< 15) | Standard (15-40) | Detail (> 40) |
|---------|-----------------|-------------------|---------------|
| Walls | Outline only, no fill | Solid fill + outline | Same |
| Door arcs | Hidden | Visible | Visible |
| Window symbols | Hidden | Visible | Visible |
| Hole texture | Solid color | Solid color | Felt shader |
| Grid | Major every 5m | Major 1m + minor 0.5m | Major 1m + minor 0.25m |
| Grid labels | Every 5m | Every 1m | Every 1m |

### Consumers
Each architectural component calls `useZoomLOD()` and conditionally renders based on the returned level. The hook is lightweight (one `useFrame` ref read per component, no state updates).

---

## Section 9: Title Block

**Goal:** Small architectural title block in the corner of the 2D pane.

### Content
- Project name: "Golf Forge"
- Scale indicator: from `computeScale()` (Section 5)
- Date: current date (YYYY-MM-DD)

### Implementation: HTML Overlay

An absolutely-positioned `<div>` inside the 2D pane container (`pane2DRef` div in `DualViewport.tsx`). CSS positioned in the bottom-right corner.

Style: small text (`text-[10px]`), semi-transparent background, thin border. Planning: dark text on light bg. UV: light text on dark bg.

---

## Section 10: Integration, Polish, and Testing

**Goal:** Wire everything together, handle edge cases, and write tests.

### Integration Checklist
1. Remove rendering spike component
2. Ensure all architectural components render only in 2D viewport (via `useViewportId`)
3. Verify `raycast` no-ops on all new non-interactive meshes
4. Mobile top-down mode: simplified architectural walls (outline only)
5. UV mode: verify all components have appropriate dark-theme colors
6. Layer toggle: all architectural elements respect wall/grid layer visibility
7. Collapsed viewport: status bar shows `--` when 2D pane is collapsed

### Testing Strategy

**Unit tests (Vitest):**
- `wallGeometry.ts`: segment computation with door/window gaps (parametric tests)
- `arcPoints.ts`: door arc point generation
- `zoomScale.ts`: scale computation from camera zoom
- LOD threshold logic

**Visual regression (Playwright):**
- 2D pane at default zoom showing architectural floor plan
- Status bar visible with coordinate display
- Zoomed-in view showing door arcs and window symbols
- Collapsed 3D pane showing full-width 2D floor plan

---

## File Structure

New files:
```
src/
  components/
    three/
      architectural/
        ArchitecturalFloorPlan.tsx   # 2D pane wrapper (viewport-gated)
        ArchitecturalWalls2D.tsx     # Thick wall rectangles + outlines
        ArchitecturalOpenings2D.tsx  # Door arcs + window symbols
        DoorSymbol2D.tsx             # Single door swing arc
        WindowSymbol2D.tsx           # Single window break lines
        ArchitecturalGrid2D.tsx      # Custom grid with labels
        HoleFelt2D.tsx               # Felt-textured hole overlays
  ui/
    StatusBar.tsx                    # Enhanced LocationBar → StatusBar
    TitleBlock2D.tsx                 # HTML title block overlay
  utils/
    wallGeometry.ts                  # Wall segment computation
    arcPoints.ts                     # Door arc point generation
    zoomScale.ts                     # Zoom-to-scale conversion
  hooks/
    useZoomLOD.ts                    # LOD level from camera zoom
    useViewportId.ts                 # Read viewport context for id
  stores/
    mouseStatusStore.ts              # Lightweight store for mouse pos + zoom
```

Modified files:
```
src/components/three/SharedScene.tsx    # Add ArchitecturalFloorPlan
src/components/three/Hall.tsx           # Viewport-aware wall/opening rendering
src/components/three/FloorGrid.tsx      # Skip in 2D viewport
src/components/layout/DualViewport.tsx  # Add onPointerLeave, mount TitleBlock
src/components/ui/LocationBar.tsx       # Rename/enhance to StatusBar
src/App.tsx                             # Replace LocationBar with StatusBar
```

---

## Dependencies and Constraints

### No New npm Dependencies
All rendering uses existing drei components (`<Line>`, `<Text>`) and Three.js core (`ShaderMaterial`, `MeshBasicMaterial`). No new packages needed.

### Store Changes
- New micro-store `mouseStatusStore.ts` for high-frequency mouse/zoom data (separate from main Zustand store)
- No changes to main store schema → no save format migration needed

### Performance Budget (Revised)

At medium zoom:
- Wall segments: ~12 fill meshes + 1 batched `<Line segments>` = ~13 objects
- Door symbols: 2 arcs + 2 panel lines = ~4 Line objects
- Window symbols: 4 windows consolidated = ~8 Line objects
- Grid: 1 batched `<Line segments>` + ~32 Text labels = ~33 objects
- Hole overlays: 9-18 meshes + 9-18 Line outlines = ~18-36 objects
- **Total: ~76-94 objects** (within budget with batching)

All 2D-only — no impact on 3D viewport rendering cost.
