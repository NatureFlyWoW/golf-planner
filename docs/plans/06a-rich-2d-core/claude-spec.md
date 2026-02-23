# Synthesized Specification — Split 06a: Rich 2D Floor Plan Core + Status Bar

## Background

Golf Forge is an indoor blacklight mini golf hall layout planner (React 19 + R3F + Zustand). Split 01 delivered a dual-viewport layout (2D orthographic left pane, 3D perspective right pane) with a layer system. The user wants the app to match Plan7Architekt / Ashampoo Home Design — professional architectural planning software.

This split transforms the 2D pane from a schematic with flat rectangles and thin lines into a professional architectural floor plan.

## Visual Transformation Goal

**Before (current):** Flat colored rectangles for holes, thin line walls, basic grid, no status feedback.

**After (this split):** Thick solid-fill walls, door swing arcs, window break symbols, textured hole surfaces, labeled grid coordinates, title block, live status bar with coordinates and zoom.

## Requirements

### 1. Rendering Spike (MUST DO FIRST)
- Proof of concept: render thick walls + door arcs + hatch/fill patterns in the R3F orthographic View
- Confirm drei `<Line>` (Line2-based) delivers crisp architectural lines at all zoom levels
- Test: line crispness, fill rendering, text readability at different zoom levels
- Decision gate: if quality is insufficient, identify mitigations before proceeding

### 2. Wall Thickness Rendering
- New `ArchitecturalWalls2D` component for the 2D pane only
- Walls rendered as rectangles (meshes) at real thickness: ~0.2m exterior, ~0.12m interior
- Solid dark fill (gray/charcoal) with crisp outline via drei `<Line>`
- Wall data sourced from `src/constants/hall.ts`
- Existing `HallWalls.tsx` continues to serve the 3D view
- Integrated with layer system (Walls/Doors layer)

### 3. Door Architectural Symbols
- Quarter-circle arc (90°) showing door swing path
- Line showing door panel from hinge to edge
- Opening direction from door data in `hall.ts`
- Rendered with drei `<Line>` (constant pixel width via `worldUnits={false}`)
- Arc computed as polyline of ~20-24 points
- Applies to main entry door and emergency exit

### 4. Window Architectural Symbols
- Two parallel lines across wall opening (glass representation)
- Short perpendicular ticks at each end (wall break)
- Standard architectural plan convention
- Window positions from `hall.ts`
- Rendered with drei `<Line>`

### 5. Textured 2D Hole Representations
- Replace flat colored rectangles with felt surface pattern
- Procedural shader: subtle noise pattern with color tint matching hole type
- Visible border/outline (darker stroke) around each hole
- The 3D view already has PBR felt textures; 2D needs a visual indicator of playing surface

### 6. Scale-Dependent Detail (LOD)
- **Overview** (camera.zoom < 15): Wall outlines only, no fill, larger labels, no door arcs, coarse grid
- **Standard** (15 ≤ zoom < 40): Solid wall fill, door arcs, window symbols, grid labels
- **Close** (zoom ≥ 40): Full detail — textured holes, fine grid subdivisions, all symbols
- Thresholds checked via `camera.zoom` in render logic
- Smooth transitions not required — discrete level switches are acceptable

### 7. Grid Refinement
- Lighter grid appearance (reduced opacity from current)
- **Major gridlines**: Every 1m, slightly more visible than minor
- **Minor gridlines**: Every 0.25m, visible only at close zoom
- Adaptive spacing: at very far zoom, show only 2m or 5m gridlines
- **Labels**: Meter numbers along top and left edges using drei `<Text>`
- Labels use inverse-zoom scaling for constant screen size

### 8. Title Block
- Position: bottom-right corner of 2D pane, HUD-style (doesn't scroll)
- Content: project name ("Golf Forge"), scale indicator, current date
- Implementation: drei `<Hud>` or absolutely-positioned HTML overlay
- Style: small, unobtrusive, standard architectural convention

### 9. Status Bar
- Fixed bar at bottom of the application (React DOM, outside Canvas)
- Shows: mouse coordinates (X, Z in meters), zoom/scale indicator, active layer name
- Updates in real-time as mouse moves over 2D pane
- Coordinates captured from R3F pointer events, passed to Zustand UI slice
- Minimal dark style, monospace font for coordinates
- Extensible for future tool modes

## Technical Approach

### Line Rendering
- drei `<Line>` component with `worldUnits={false}` for constant pixel-width lines
- `lineWidth` values: 2px for wall outlines, 1px for door arcs/window symbols, 0.5px for grid
- Renderer `antialias: true` + Line2's built-in edge feathering

### Text Rendering
- drei `<Text>` (troika SDF) for grid labels and title block text
- Inverse-zoom scaling via `useFrame`: `scale = 1 / camera.zoom`
- Keeps text at constant screen size regardless of zoom

### Fill/Pattern Rendering
- Wall fill: Standard `MeshBasicMaterial` with solid color on rectangular meshes
- Hole felt: `ShaderMaterial` with procedural noise in fragment shader
- Hatch patterns: Reserved for future zone fills (Split 03)

### Status Bar Architecture
- New Zustand state: `mouseWorldPosition: [x, z] | null`, `currentZoom: number`
- Updated in `onPointerMove` handler within the 2D pane
- Status bar React component reads from store, renders outside Canvas

### Layer Integration
- All new 2D components check layer visibility before rendering
- New architectural elements belong to existing "Walls/Doors" layer
- Grid belongs to existing "Grid" layer
- Hole textures belong to existing "Holes" layer

## Performance Budget
- ~70-80 new 3D objects in 2D pane (well within budget)
- All new objects are 2D-pane only, no 3D viewport impact
- ShaderMaterial for holes: single draw call per hole
- Status bar is pure DOM, zero GPU cost

## Priority Order (if time-constrained)
1. Rendering spike (gate decision)
2. Wall thickness rendering
3. Door/window symbols
4. Status bar
5. Grid refinement
6. Textured 2D holes
7. Scale-dependent detail
8. Title block

## Out of Scope
- Furniture/fixture library (Split 06b)
- Dimension lines/measurements (Split 02)
- Zone overlays/hatching (Split 03)
- 3D environment changes (Split 05)
- Material/texture palette (dropped)
