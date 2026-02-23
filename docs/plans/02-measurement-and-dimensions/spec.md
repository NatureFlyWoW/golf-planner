# 02 — Measurement & Dimensions

## Overview
Add professional dimensioning and measurement tools to Golf Forge — click-to-measure distances, persistent dimension lines, a scale bar, live coordinate display, and auto-dimensioned wall edges. These are the "how big / how far" tools that transform the planner from a placement toy into a precision layout tool.

## Reference
- **Requirements**: `../next-evolution-requirements.md` (F2: Dimension & Measurement Tools)
- **Reference images**: `../../reference_samples/APP_AND_UI_REF1.jpg` — shows dimension annotations, area labels (31.37m², 36.18m², etc.), and scale ruler on the floor plan
- **Interview**: `../deep_project_interview.md` — Topic 1 (natural boundaries, "Measurement & Dimensioning" cluster)

## Current State
- **Dimension display**: Only in sidebar text — "0.6m x 3.0m" in HoleLibrary and HoleDetail panels
- **Position display**: Read-only `Position: (x, z)` in HoleDetail
- **Grid**: 1m cells, 5m sections (`FloorGrid.tsx`) — provides implicit scale but no ruler
- **Coordinate display**: LocationBar shows GPS coordinates and sun angle, but NOT mouse position in meters
- **No measurement tools**: No click-to-measure, no dimension lines, no area overlays
- **Key files**: `FloorGrid.tsx`, `HoleDetail.tsx`, `HoleLibrary.tsx`, `LocationBar.tsx`

## Requirements

### Click-to-Measure Tool
1. **Measure tool**: New toolbar tool mode — click point A, click point B, see distance in meters
2. **Visual feedback**: Line drawn between points with distance label at midpoint
3. **Temporary measurement**: Disappears when tool mode changes (not persisted)
4. **Multi-measure**: Allow measuring multiple distances in sequence without switching tool

### Persistent Dimension Lines
5. **Dimension annotation**: Click two points to create a permanent dimension line with distance label
6. **Dimension data model**: `{ id, start: {x,z}, end: {x,z}, label?: string }` — new Zustand slice
7. **Render in both viewports**: Dimension lines visible in 2D and 3D panes (from split 01)
8. **Editable**: Click dimension to select, Delete to remove, drag endpoints to adjust
9. **Persistence**: Saved with project (new store slice, included in save format v9+)

### Auto-Dimensions
10. **Wall dimensions**: Hall wall lengths auto-displayed along edges (10.00m and 20.00m)
11. **Hole spacing**: When a hole is selected, show distance to nearest adjacent holes
12. **Snap distance**: While dragging a hole, show live distance to nearest wall and nearest hole

### Scale Bar
13. **Scale bar widget**: Always-visible scale reference in corner of each viewport pane
14. **Adaptive scale**: Updates based on zoom level (e.g., shows "1m" at medium zoom, "5m" at overview)
15. **Clean design**: Minimal, matches dark theme, doesn't obstruct content

### Coordinate Display
16. **Mouse position**: Show cursor position in meters (relative to hall origin) in status bar or on-canvas tooltip
17. **Selected hole position**: Enhanced display with editable X/Z fields (connects to precision tools split 04)

### Layer Integration
18. **Dimensions layer**: All dimension annotations belong to a "Dimensions" layer (from split 01)
19. **Togglable**: Can hide all dimensions via layer panel

## Technical Considerations

### Rendering Approach
- **Dimension lines in R3F**: Use `<Line>` from drei or custom geometry for the lines, `<Html>` or `<Billboard>/<Text>` for distance labels
- **Scale bar**: HTML overlay (positioned absolutely in viewport corner) is likely cleaner than R3F — scales independently of 3D zoom
- **Mouse coordinate display**: HTML overlay in the viewport footer or a floating tooltip near cursor

### Data Model
```typescript
type DimensionLine = {
  id: string;
  start: { x: number; z: number };
  end: { x: number; z: number };
  label?: string; // custom label override
  distance: number; // computed, cached
};

// New store slice
dimensions: Record<string, DimensionLine>;
```

### Performance
- Dimension lines are lightweight geometry — negligible performance impact
- Text rendering (distance labels) via drei `<Text>` uses SDF — efficient at scale
- Auto-dimensions (wall lengths, hole spacing) are computed on selection change, not per-frame

## Dependencies
- **Depends on**: Split 01 (dual viewport — dimensions render in both panes; layer system — "Dimensions" layer)
- **Blocks**: Split 07 (export needs dimension data for PDF floor plans)
- **Provides**: Dimension data model, measurement tool, coordinate display

## Acceptance Criteria
- [ ] Measure tool: click two points, see distance line with label
- [ ] Persistent dimension lines: create, select, delete, drag endpoints
- [ ] Wall dimensions auto-displayed along hall edges
- [ ] Hole spacing shown when a hole is selected
- [ ] Scale bar visible in both viewport panes, adapts to zoom
- [ ] Mouse position displayed in meters somewhere on-screen
- [ ] Dimensions render in both 2D and 3D viewports
- [ ] Dimensions layer in layer panel — can show/hide
- [ ] Dimension data persisted in save format
