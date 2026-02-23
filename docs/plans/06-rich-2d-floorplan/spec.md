# 06 — Rich 2D Floor Plan

## Overview
Transform the top-down 2D view from a functional schematic (flat colored rectangles on a gray slab) into a **professional architectural floor plan** — with textured surfaces, wall thickness, door/window symbols, zone hatching, and print-quality rendering. This is what makes the 2D pane look like the left side of the reference images.

## Reference
- **Requirements**: `../next-evolution-requirements.md` (F8: Rich 2D Floor Plan Rendering)
- **Reference images**: `../../reference_samples/APP_AND_UI_REF1.jpg` — left side shows a 2D floor plan with textured flooring (wood, tile), furniture representations, area labels, thick walls, door arcs, and dimension annotations
- **Interview**: `../deep_project_interview.md` — Topic 1 ("Rich 2D Floor Plan" cluster)

## Current State
- **2D view**: Orthographic camera looking straight down at Y=0 plane
- **Hall floor**: Concrete PBR texture (`HallFloor.tsx`) — actually looks decent in 2D as-is
- **Hall walls**: Thin planes rendered at wall positions — no thickness in 2D view
- **Holes**: 3D models viewed from above appear as flat green rectangles with bumper rail edges
- **Grid**: 1m cells, 5m sections, subtle colors
- **Doors/windows**: 3D geometry (recessed openings) — not readable as standard architectural symbols from top-down
- **No hatching, no zone fills, no title block, no legend**
- **Key files**: `HallFloor.tsx`, `HallWalls.tsx`, `HallOpenings.tsx`, `FloorGrid.tsx`, `HoleModel.tsx`

## Requirements

### Textured 2D Representations
1. **Hole surfaces**: In 2D view, holes show felt surface texture/color from above (already partially works since 3D models with PBR are viewed from top)
2. **Floor texture**: Concrete floor texture visible in 2D (already works)
3. **Enhanced contrast**: Ensure holes stand out clearly against floor — may need outline or subtle shadow

### Wall Rendering
4. **Wall thickness**: Walls rendered with actual thickness in 2D view (e.g., 0.2m thick lines instead of zero-thickness planes)
5. **Wall fill**: Solid or hatched fill inside wall thickness (standard architectural practice — solid black or cross-hatch)
6. **Corner joints**: Clean intersections at wall corners (mitred or overlapping)

### Door & Window Symbols
7. **Door symbol**: Standard architectural door symbol — arc showing swing direction + gap in wall
8. **Window symbol**: Standard window symbol — parallel lines within wall thickness (or break lines)
9. **Scale-appropriate**: Symbols readable at default zoom, simplified at overview zoom

### Zone Rendering (Integration with Split 03)
10. **Hatching patterns**: Different zone types get different hatching (diagonal lines, cross-hatch, dots) or colored fills
11. **Boundary lines**: Zone edges drawn as dashed or solid colored lines
12. **Area labels**: Zone area (m²) centered within each zone

### Scale-Dependent Detail
13. **High zoom (close-up)**: Full detail — textures, door symbols, dimension labels, hatching
14. **Medium zoom (default)**: Textures + walls + door symbols, labels readable
15. **Low zoom (overview)**: Simplified — solid fills, thick wall lines, no hatching, labels hidden
16. **Smooth transitions**: Detail levels transition smoothly as user zooms, not sudden pop

### Print-Quality Rendering
17. **Clean lines**: Crisp, anti-aliased edges on walls, holes, grid
18. **Readable labels**: Text always renders at legible size regardless of zoom
19. **Title block**: Project name, scale indicator, date — small box in corner of 2D pane
20. **Legend**: Optional: small legend showing zone type colors/patterns
21. **White background mode**: Toggle to render on white background for printing (vs. dark theme for screen)

### Grid Enhancement
22. **Labeled coordinates**: Grid labels along edges (0m, 1m, 2m... or A, B, C)
23. **Lighter secondary grid**: Subtle grid at finer spacing (0.5m) visible only at high zoom
24. **Grid origin marker**: Small cross or marker at hall origin point

## Technical Considerations

### Wall Thickness
- Current `HallWalls.tsx` renders walls as thin planes in 3D
- For 2D view, could:
  - **Option A**: Add a separate 2D overlay with thick wall rendering (BoxGeometry at Y≈0, very thin height)
  - **Option B**: Render walls with actual width in 3D but it was only visible at wall base height
  - **Option C**: HTML/SVG overlay for 2D-only architectural elements
- Recommendation: Option A — thin R3F BoxGeometry meshes at floor level, only visible in 2D pane

### Door/Window Symbols
- Standard door arcs can be drawn with R3F `<Line>` curves or drei shapes
- These are 2D-only elements — don't need to appear in 3D perspective
- Conditional rendering: only when `view === "top"` or in 2D pane

### Hatching
- **Texture-based**: Create hatching patterns as small repeating textures, apply to zone meshes
- **Shader-based**: Simple fragment shader that draws parallel lines (more flexible, resolution-independent)
- Recommendation: Texture-based is simpler to implement; shader-based is sharper

### Scale-Dependent Detail
- Use camera zoom level to determine detail tier
- R3F components check `useThree().camera.zoom` (orthographic) to decide what to render
- Or use drei's `<DetailLevel>` / `<LOD>` concepts

### Print Mode
- Toggle a `printMode` flag that:
  - Switches background from dark to white
  - Changes grid/text/line colors for print contrast
  - Hides 3D-only effects (UV lamps, postprocessing)
  - This is preparation for split 07 (PDF export)

## Dependencies
- **Depends on**: Split 01 (2D viewport pane — this split enhances its rendering)
- **Integrates with**: Split 03 (zones — zone hatching and area labels are rendered here)
- **Blocks**: Split 07 (PDF export needs print-quality 2D rendering)
- **Provides**: Professional 2D floor plan rendering, wall thickness, architectural symbols, print mode

## Acceptance Criteria
- [ ] Walls rendered with visible thickness in 2D view
- [ ] Door symbols (arc + gap) visible at appropriate zoom
- [ ] Window symbols visible in 2D view
- [ ] Wall corners cleanly joined
- [ ] Holes clearly distinguishable against floor (outline or shadow)
- [ ] Grid labeled with coordinates along edges
- [ ] Title block visible in 2D pane corner
- [ ] Scale-dependent detail: detail reduces gracefully at lower zoom
- [ ] Print/white-background mode toggle
- [ ] Clean, crisp rendering suitable for screenshot/export
