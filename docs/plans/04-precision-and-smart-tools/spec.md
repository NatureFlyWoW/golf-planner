# 04 — Precision & Smart Tools

## Overview
Add professional CAD-like precision to hole placement and manipulation. This is the "master's calculator" layer — the features that separate a casual user from a power user. Numeric input, smart alignment guides, distribution tools, and enhanced snapping that make precise layouts effortless.

## Reference
- **Requirements**: `../next-evolution-requirements.md` (F6: Precision Positioning & Alignment)
- **Reference images**: `../../reference_samples/APP_AND_UI_REF2-3.jpg` — shows coordinate input fields (`l:`, `phi:`, `cm`), grid controls, and precise selection in status bar
- **Interview**: `../deep_project_interview.md` — Topic 1 ("Precision & Alignment Tools" cluster)

## Current State
- **Snap grid**: 0.25m fixed grid (`snap.ts`) — togglable via toolbar button
- **Position display**: Read-only in HoleDetail and MobileDetailPanel: `Position: (x, z)`
- **Rotation**: Preset buttons (0°, 90°, 180°, 270°) + numeric input + drag handle with 15° snap (`RotationHandle.tsx`)
- **No alignment guides**: No visual guides when dragging near other objects' edges/centers
- **No numeric position input**: Can't type exact X, Z coordinates
- **No distribution tools**: Can't evenly space holes
- **No multi-select**: Only single hole selection exists
- **Key files**: `snap.ts`, `PlacementHandler.tsx`, `RotationHandle.tsx`, `HoleDetail.tsx`, `MobileDetailPanel.tsx`

## Requirements

### Numeric Position Input
1. **Editable X/Z fields**: In HoleDetail panel, position becomes editable input fields (not read-only)
2. **Unit display**: Values shown in meters with one decimal place
3. **Validation**: Clamp to hall boundaries, check collision before applying
4. **Tab order**: Tab between X and Z fields; Enter to confirm
5. **Undo integration**: Position changes via numeric input are undoable

### Alignment Guides
6. **Edge alignment**: When dragging a hole, show guide lines when its edges align with other holes' edges
7. **Center alignment**: Guide lines for horizontal/vertical center alignment between holes
8. **Wall alignment**: Guide lines when hole edge aligns with hall walls
9. **Visual style**: Thin dashed cyan lines extending across the viewport
10. **Snap to guide**: When within snap threshold (5px screen-space), snap to the guide position

### Smart Guides (Live Distance)
11. **Distance readouts while dragging**: Show distance from dragged hole to nearest wall and nearest hole
12. **Edge-to-edge**: Measure from closest edges, not centers
13. **Format**: Small labels on the guide lines showing distance in meters (e.g., "1.2m")

### Distribution Tools
14. **Multi-select**: Hold Shift + click to add holes to selection (new feature)
15. **Distribute horizontally**: Evenly space selected holes along X axis
16. **Distribute vertically**: Evenly space selected holes along Z axis
17. **Align edges**: Align selected holes to a common top/bottom/left/right edge
18. **Access**: Right-click context menu or toolbar dropdown

### Grid Control
19. **Grid size selector**: Choose from 0.1m, 0.25m, 0.5m, 1.0m grid spacing
20. **UI**: Dropdown or segmented control near the Snap toggle button
21. **Grid visual**: FloorGrid updates to reflect chosen spacing

### Enhanced Transform
22. **Shift-drag constraint**: Hold Shift while dragging to lock movement to horizontal or vertical axis
23. **Tab-cycle selection**: Press Tab to cycle through placed holes for quick selection
24. **Arrow key nudge**: When a hole is selected, arrow keys nudge position by one grid unit

### Coordinate Display
25. **Live mouse position**: Show mouse cursor position in meters in the viewport or status bar
26. **Relative coordinates**: When dragging, show both absolute position and delta from starting position

## Technical Considerations

### Alignment Detection
- **Approach**: On each drag frame, compare dragged hole's AABB edges + center against all other holes' edges + centers + wall edges
- **Performance**: For <20 holes, brute-force comparison is fine. If perf becomes an issue, use a 1D interval tree per axis
- **Snap threshold**: ~5-8px in screen space, converted to world units based on current zoom
- **Guide rendering**: R3F `<Line>` components, created/destroyed dynamically during drag

### Multi-Select Architecture
- Currently `selectedId: string | null` — needs to become `selectedIds: string[]` or keep primary + add `multiSelectedIds`
- Multi-select affects: HoleDetail panel (show count, shared properties), distribution tools, delete (bulk), undo
- This is the most architecturally impactful change — need to evaluate whether to keep backward compat with `selectedId`

### Grid Size
- Current `GRID_SIZE = 0.25` is a constant in `snap.ts`
- Needs to become configurable: new store field `gridSize: number` (persisted)
- `FloorGrid.tsx` reads grid size to draw lines; `snap.ts` reads it for placement

## Dependencies
- **Depends on**: Split 01 (viewport — precision tools work within the viewport interaction system)
- **Integrates with**: Existing placement system (`PlacementHandler.tsx`, `snap.ts`, `collision.ts`)
- **Provides**: Multi-select capability (used by other splits if needed), alignment API, configurable grid

## Acceptance Criteria
- [ ] Editable X, Z position fields in HoleDetail panel
- [ ] Alignment guides visible when dragging near other holes' edges/centers
- [ ] Wall alignment guides when near hall edges
- [ ] Distance readouts shown during drag (to nearest wall and hole)
- [ ] Multi-select: Shift+click to select multiple holes
- [ ] Distribute horizontally/vertically for multi-selected holes
- [ ] Align edges for multi-selected holes
- [ ] Grid size selector (0.1m, 0.25m, 0.5m, 1.0m)
- [ ] Shift-drag constrains to horizontal/vertical
- [ ] Tab cycles through holes
- [ ] Arrow keys nudge selected hole by grid unit
- [ ] Live mouse position display in meters
