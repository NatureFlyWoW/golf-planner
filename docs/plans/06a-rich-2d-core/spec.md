# Split 06a — Rich 2D Floor Plan Core + Status Bar

## Context

Golf Forge is an indoor blacklight mini golf hall layout planner (React 19 + R3F + Zustand). Split 01 (dual viewport + layers) is complete — the app has a resizable split-pane layout with 2D orthographic left pane and 3D perspective right pane, plus a layer system.

The user wants the app to look like Plan7Architekt / Ashampoo Home Design — professional architectural planning software. Reference images are in `reference_samples/APP_AND_UI_REF*.jpg`.

This split transforms the 2D pane from a schematic with flat rectangles into a professional architectural floor plan.

## Scope

### Rendering Spike (MUST DO FIRST)
- Proof of concept: render thick walls with door arcs and hatch patterns in the R3F orthographic View
- Confirm visual quality is achievable before committing to full implementation
- Test: line crispness, hatch pattern tiling at different zoom levels, text rendering approach

### Wall Thickness Rendering
- Walls currently render as simple lines or thin geometry
- Replace with walls drawn at real thickness (~0.2m for steel hall walls)
- Wall cross-section visible in top-down view (filled, possibly hatched)
- Walls must look clean and crisp at all zoom levels

### Door/Window Architectural Symbols
- Door swing arcs (standard floor plan convention: quarter-circle showing door swing path)
- Window break lines (standard plan symbols for window openings)
- Symbols scale appropriately with zoom

### Textured 2D Hole Representations
- Holes currently appear as flat colored rectangles in 2D view
- Replace with felt surface pattern/texture that's visible in top-down view
- Show hole boundaries more clearly (border/outline)

### Scale-Dependent Detail
- At overview zoom: simplified representation (outlines, labels, no texture)
- At close zoom: full detail (textures, hatch patterns, precise symbols)
- Smooth transition between detail levels

### Grid Refinement
- Current grid is basic lines
- Labeled grid coordinates along edges (like graph paper with labeled axes)
- Lighter grid appearance that doesn't compete with content
- Grid spacing adapts to zoom level

### Title Block
- Corner display: project name, scale indicator, date
- Standard architectural drawing convention
- Positioned in 2D pane corner, doesn't scroll with content (HUD-style)

### Status Bar
- Fixed bar at bottom of the application
- Shows: mouse coordinates (X, Z in meters), zoom/scale indicator, active layer name
- Updates in real-time as mouse moves over the 2D pane
- Minimal but informative (matches reference images' status bar style)

## Technical Context

- **Renderer**: React Three Fiber with @react-three/drei View component (orthographic projection for 2D)
- **State management**: Zustand with slices (hall, holes, ui, viewport, layers)
- **Hall data**: src/constants/hall.ts — 10m × 20m BORGA hall, walls at known positions
- **Existing wall component**: src/components/three/HallWalls.tsx
- **Existing floor plan**: src/components/three/Hall.tsx (floor, grid, walls, doors, windows)
- **2D pane**: Left side of DualViewport, orthographic camera with pan/zoom
- **Layer system**: Walls, doors, grid etc. are on separate layers with visibility/opacity control
- **Current door/window data**: Positions defined in hall.ts, rendered as simple geometry

## Key Risks
1. R3F orthographic view may struggle with crisp architectural-quality lines
2. Hatch patterns in WebGL require custom shaders or texture-based approach
3. Text rendering at various zoom levels — drei Html vs SDF text vs canvas texture
4. Performance: additional geometry/textures in 2D view must not degrade frame rate

## Out of Scope
- Furniture/fixture library (that's Split 06b)
- Dimension lines/measurements (that's Split 02)
- Zone overlays (that's Split 03)
- 3D environment changes (that's Split 05)
- Material/texture palette (dropped)
