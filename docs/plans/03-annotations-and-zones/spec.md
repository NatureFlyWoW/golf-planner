# 03 — Annotations & Zones

## Overview
Enable **planning overlays** on the floor plan — text annotations, arrows, callout boxes for notes and markup, plus **functional zone polygons** for defining areas within the hall (waiting, counter, storage, WC, emergency paths). Both are "things you draw on the plan that aren't physical objects" and share the pattern of new store slices, layer integration, and rendering in both viewports.

## Reference
- **Requirements**: `../next-evolution-requirements.md` (F4: Annotation & Markup Tools, F5: Zone/Room System)
- **Reference images**: `../../reference_samples/APP_AND_UI_REF1.jpg` — shows labeled rooms with area calculations (31.37m², 36.18m², etc.) and different surface renderings per room
- **Interview**: `../deep_project_interview.md` — Topic 1 (zone system, annotation tools)

## Current State
- **No annotation system**: No text labels, arrows, or callout boxes on the canvas
- **No zone system**: No way to define functional areas within the hall
- **Existing labels**: Hole numbers appear on the flow path as numbered billboards (`FlowPath.tsx`)
- **Budget categories**: 18 budget categories exist (hall, course, lighting, etc.) but aren't linked to spatial zones
- **Key files**: `FlowPath.tsx` (for label rendering patterns), `BudgetPanel.tsx`, `store/store.ts`

## Requirements

### Annotations

#### Text Labels
1. **Text tool**: New toolbar mode — click canvas to place text, type content
2. **Properties**: Font size (small/medium/large), color (from theme palette), optional background
3. **Move/edit**: Click to select, drag to move, double-click to edit text
4. **Delete**: Select + Delete key or delete tool

#### Arrows & Lines
5. **Arrow tool**: Click start point, click end point to draw arrow
6. **Line styles**: Solid, dashed; arrowhead at end, both ends, or neither
7. **Color**: Configurable from theme palette

#### Callout Boxes
8. **Callout tool**: Click to place a text box with a leader line pointing to a specific location
9. **Leader line**: Drag the point end to anchor to a feature (hole, wall corner, etc.)
10. **Content**: Multi-line text in a rounded box

#### Data Model
11. **Annotation store slice**: `annotations: Record<string, Annotation>`
12. **Annotation types**: `text | arrow | callout`
13. **Persistence**: Saved with project (store format migration)
14. **Render in both viewports**: Visible in 2D and 3D panes

### Zones

#### Zone Drawing
15. **Zone tool**: Click vertices to define a polygon, click first vertex (or double-click) to close
16. **Rectangle shortcut**: Click-drag for quick rectangular zone
17. **Edit vertices**: Click zone to select, drag vertices to reshape
18. **Delete**: Select + Delete key

#### Zone Types
19. **Type classification**: Playing area, Waiting/Reception, Counter/POS, Storage, WC/Facilities, Staff Area, Emergency Exit Path, UV Lamp Coverage
20. **Type colors**: Each zone type has a distinct color from the theme
21. **Type assignment**: Set type via dropdown when zone is selected

#### Zone Display
22. **2D rendering**: Semi-transparent colored overlay with optional hatching pattern
23. **3D rendering**: Tinted floor plane within zone boundaries
24. **Area calculation**: Auto-computed from polygon vertices, displayed as label (e.g., "12.4 m²")
25. **Zone name**: Optional custom name label displayed on zone

#### Zone Budget Linking
26. **Category association**: Link a zone to a budget category (e.g., "WC" zone → "Sanitary facilities" budget category)
27. **Zone cost display**: Show linked budget category's estimate on the zone info panel

#### Validation
28. **Clearance check**: Warn if aisle width between zones and walls is below minimum (1.2m for accessibility)
29. **Exit path validation**: Warn if emergency exit paths are blocked by holes

#### Data Model
30. **Zone store slice**: `zones: Record<string, Zone>`
31. **Zone type**:
```typescript
type Zone = {
  id: string;
  type: ZoneType;
  name: string;
  vertices: { x: number; z: number }[];
  color: string;
  budgetCategoryId?: string;
  area: number; // computed from vertices
};
```
32. **Persistence**: Saved with project

### Layer Integration
33. **Annotations layer**: All annotations togglable via layer panel
34. **Zones layer**: All zones togglable via layer panel
35. **Independent**: Annotations and zones are separate layers

## Technical Considerations

### Annotation Rendering
- **Text**: drei `<Text>` or `<Html>` component for canvas text labels
- **Arrows**: R3F `<Line>` with custom arrowhead geometry or drei `<Line>`
- **Callouts**: HTML overlay (`<Html>` from drei) for rich text box + R3F `<Line>` for leader
- Consider using HTML overlays for annotations to get crisp text at any zoom level

### Zone Rendering
- **2D polygons**: R3F `<mesh>` with `ShapeGeometry` from THREE.Shape built from zone vertices
- **Hatching**: Custom shader or texture pattern for architectural hatching effect
- **3D tinting**: Decal or overlay mesh slightly above floor plane
- **Area calculation**: Shoelace formula on polygon vertices

### Polygon Drawing UX
- Click to add vertices, displayed as dots with connecting lines
- Visual "close" indicator when cursor nears first vertex
- Double-click to auto-close polygon
- Hold Shift while clicking to constrain to 90-degree angles (for rectangular zones)

## Dependencies
- **Depends on**: Split 01 (dual viewport + layers — annotations/zones render in both panes and register as layers)
- **Integrates with**: Existing budget system (zone budget linking)
- **Blocks**: Split 07 (export includes annotations and zone data)
- **Provides**: Annotation data model, zone data model, polygon drawing tools

## Acceptance Criteria
- [ ] Text label tool: place, edit, move, delete text on canvas
- [ ] Arrow tool: draw arrows/lines between two points
- [ ] Callout tool: text box with leader line
- [ ] Zone drawing: click vertices to define polygon, rectangle shortcut
- [ ] Zone types: at least 5 types with distinct colors
- [ ] Area calculation displayed on each zone
- [ ] Zone budget linking: associate zone with budget category
- [ ] Annotations and zones render in both viewports
- [ ] Two separate layers (Annotations, Zones) in layer panel
- [ ] Data persisted in save format
