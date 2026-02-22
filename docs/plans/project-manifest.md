<!-- SPLIT_MANIFEST
01-dual-viewport-and-layers        (COMPLETE)
06a-rich-2d-core                   (NEXT)
02-measurement-and-dimensions
06b-furniture-library
05-3d-environment
03-annotations-and-zones
04-precision-and-smart-tools
07-export-and-command-palette
END_MANIFEST -->

<!-- REORDER NOTE (2026-02-22):
  Original order was 01→02→03→04→05→06→07.
  Reordered to "Visual First" per gap analysis against Plan7Architekt reference images.
  Split 06 into 06a (core rendering) + 06b (furniture library).
  Dropped material/texture palette (insufficient use case).
  See docs/plans/2026-02-22-visual-first-reorder-design.md for full rationale.
-->

# Golf Forge Next Evolution — Project Manifest

## Overview

This manifest decomposes the "next evolution" of Golf Forge into 7 well-scoped planning units. The decomposition follows the user's vision of transforming a functional layout planner into a professional-grade planning tool ("calculator that can do calculus") as informed by Plan7Architekt-style reference images.

### Design Philosophy: Progressive Disclosure
Each split must maintain the "easy on the surface, powerful in depth" principle:
- **Default behavior**: simple, obvious, works without reading a manual
- **Power features**: discoverable through UI cues, keyboard shortcuts, or the command palette
- **Example**: Grid snap is a toggle button (simple). Grid size is configurable from 0.1m to 1.0m (power). Smart alignment guides appear automatically when dragging near other objects (progressive).

---

## Split Structure

### 01-dual-viewport-and-layers (FOUNDATION)
**Purpose**: Transform the single-canvas toggle-based view into a professional dual-pane layout with a comprehensive layer system.

**Scope**:
- Resizable split-pane layout (2D left, 3D right) with drag divider
- Collapse either pane to full-screen single view
- Synchronized selection and hover highlight across both panes
- Orbit camera controls in 3D pane (click-drag rotate, scroll zoom, right-drag pan)
- Camera preset buttons (top, front, side, isometric) with smooth animated transitions
- Layer system: visibility toggles, per-layer opacity sliders, layer lock
- Layer panel in sidebar (new tab or floating panel)
- Default layers: Holes, Flow Path, Grid, Walls/Doors, Dimensions, Annotations, Zones, Sun

**Key technical decisions needed**:
- Single `<Canvas>` with R3F `<View>` components vs. two separate `<Canvas>` instances
- Performance impact of dual rendering on mid-tier GPUs
- How layer state integrates with Zustand (new slice vs. UI state)
- Whether to use `drei`'s `OrbitControls` or a custom camera controller

**Estimated deep-plan sections**: 7-9

---

### 02-measurement-and-dimensions
**Purpose**: Add professional dimensioning and measurement tools to the floor plan.

**Scope**:
- Click-to-measure tool: click two points to display distance
- Persistent dimension lines: permanent annotations showing distances between points
- Auto-dimension: wall lengths displayed along hall edges
- Hole spacing: show distances between adjacent holes when a hole is selected
- Scale bar widget: always-visible scale reference on canvas
- Live coordinate display: mouse position in meters shown on canvas or status bar
- Area overlay: zones display their area in m² (connects to zone system in split 03)
- Dimension data model: new Zustand slice for persistent dimension objects
- Rendering in both 2D and 3D viewports

**Key technical decisions needed**:
- Dimension line rendering: HTML overlay, R3F geometry, or drei `<Html>` component
- How dimensions interact with zoom level (scaling behavior)
- Dimension snap targets (wall corners, hole edges, hole centers)
- Persistence: should dimensions be saved/loaded with the project?

**Estimated deep-plan sections**: 5-7

---

### 03-annotations-and-zones
**Purpose**: Enable planning overlays — text annotations, markup tools, and functional zone definition within the hall.

**Scope**:
**Annotations**:
- Text label placement tool (click to place, type text)
- Arrow/line drawing tool (click start → click end)
- Callout box tool (text bubble with leader line pointing to feature)
- Font size and color controls
- Annotation data model (new Zustand slice)
- Annotation rendering in both viewports

**Zones**:
- Zone drawing tool: click vertices to define a polygon, close to complete
- Zone types: playing area, waiting/reception, counter/POS, storage, WC, staff, emergency path, UV coverage
- Zone area auto-calculation (m²)
- Zone rendering: colored/hatched overlay in 2D, floor tinting in 3D
- Zone budget linking: associate zones with budget categories
- Minimum clearance validation (aisle width, exit paths)
- Zone data model (new Zustand slice)

**Key technical decisions needed**:
- Polygon drawing UX (click vertices vs. rectangle-then-edit)
- Zone rendering approach: R3F mesh overlay vs. shader-based
- How zones interact with hole collision detection
- Budget linking: one-way reference or bidirectional?

**Estimated deep-plan sections**: 6-8

---

### 04-precision-and-smart-tools
**Purpose**: Add professional CAD-like precision to hole placement and manipulation.

**Scope**:
- Numeric position input panel: type exact X, Z coordinates for selected hole
- Alignment guides: snap to horizontal/vertical alignment with other holes' edges or centers
- Smart guides: temporary visual guide lines appear when dragging near alignments
- Distribution tools: evenly space selected holes horizontally or vertically
- Grid size control: configurable grid spacing (0.1m, 0.25m, 0.5m, 1.0m)
- Enhanced transform gizmo: visual handles for position + improved rotation handle
- Shift-drag constraint: hold Shift to lock to horizontal/vertical movement
- Tab-cycle: Tab key cycles through placed holes for quick selection
- Edge-to-edge distance display while dragging (live readout)

**Key technical decisions needed**:
- Alignment detection algorithm (nearest-neighbor vs. spatial index)
- How to render smart guides (R3F lines vs. HTML overlay)
- Multi-select for distribution (currently only single selection exists)
- Integration with existing snap-to-grid system

**Estimated deep-plan sections**: 5-6

---

### 05-3d-environment
**Purpose**: Make the 3D viewport look professional with environment context, like the reference images show buildings in their surroundings.

**Scope**:
- Ground plane: textured ground extending beyond hall footprint (grass/gravel/asphalt)
- Hall exterior model: corrugated steel walls visible from outside, roof ridge, eaves
- Sky dome or environment map for realistic background
- Ambient occlusion enhancement for the 3D scene
- Soft shadow improvements (directional sun shadow, contact shadows)
- First-person walkthrough mode: eye-level camera with WASD movement
- Walkthrough collision with walls (prevent walking through)
- Environment elements: parking area, simple landscaping (optional, low priority)
- Performance: all additions respect GPU tier gating

**Key technical decisions needed**:
- Ground plane extent and texture resolution
- Hall exterior model complexity (simple box vs. detailed BORGA geometry)
- Walkthrough camera: custom controller vs. drei `PointerLockControls`
- Performance budget for environment additions on mid-tier GPUs
- Whether to add environment props (trees, cars) or keep minimal

**Estimated deep-plan sections**: 5-7

---

### 06-rich-2d-floorplan
**Purpose**: Transform the top-down view from a functional schematic into a professional architectural floor plan.

**Scope**:
- Textured 2D hole representations: holes show felt surface pattern (not flat rectangles)
- Wall thickness rendering: walls drawn with real thickness (not just lines)
- Door/window architectural symbols: standard plan symbols for doors (arc) and windows (break lines)
- Zone hatching: cross-hatching or pattern fills for different zone types
- Scale-dependent detail: more detail at high zoom, simplified at overview zoom
- Clean line rendering: crisp edges, anti-aliased, print-quality appearance
- Title block: project name, scale, date in corner of floor plan view
- Grid refinement: lighter grid with labeled coordinates

**Key technical decisions needed**:
- Rendering approach: enhance existing R3F orthographic view vs. separate 2D renderer
- How to achieve "architectural drawing" aesthetic in R3F (shaders? post-processing?)
- Wall thickness: modify Hall model geometry or add separate 2D overlay
- Performance impact of textured 2D rendering at overview zoom

**Estimated deep-plan sections**: 5-7

---

### 07-export-and-command-palette
**Purpose**: Generate professional output documents and enhance tool discoverability with organized toolbar and command palette.

**Scope**:
**Export**:
- Dimensioned floor plan PDF: auto-generated construction document with measurements, scale bar, title block, legend
- Cost summary report PDF: budget data combined with floor plan overview
- Material schedule: auto-generated list of materials based on hole types and zones
- Enhanced SVG export: includes dimensions, annotations, and zone outlines
- 3D presentation renders: high-quality static images from key viewpoints

**Toolbar & Commands**:
- Reorganized toolbar: categorized sections (Place, Measure, Annotate, View, Export) with dropdowns
- Command palette (Ctrl+K / Cmd+K): fuzzy-search all actions by name
- Keyboard shortcuts panel: visual reference for all shortcuts
- Contextual right-click menus on holes, zones, annotations
- Recent actions list for quick re-access
- Toolbar customization: show/hide tool categories

**Key technical decisions needed**:
- PDF generation library: jsPDF + svg2pdf vs. html-to-pdf vs. Puppeteer-like approach
- Client-side rendering for PDF (must stay serverless)
- Command palette implementation: custom vs. library (cmdk)
- How to handle mobile toolbar reorganization (already has different layout)

**Estimated deep-plan sections**: 6-8

---

## Dependency Map

```
┌─────────────────────────────┐
│  01-dual-viewport-and-layers│  ← FOUNDATION (must be first)
└─────────┬───────────────────┘
          │
          ├──→ 02-measurement-and-dimensions
          │
          ├──→ 03-annotations-and-zones
          │
          ├──→ 04-precision-and-smart-tools
          │
          ├──→ 05-3d-environment
          │
          └──→ 06-rich-2d-floorplan
                    │
                    ▼
          07-export-and-command-palette ←── needs 02, 03, 06 data
```

### Dependency Details

| Split | Depends On | Dependency Type |
|-------|-----------|-----------------|
| 01 | (none) | Foundation |
| 02 | 01 (viewport + layers) | Renders dimensions in both panes, uses layers |
| 03 | 01 (viewport + layers) | Renders annotations/zones in both panes, uses layers |
| 04 | 01 (viewport) | Precision tools work within the viewport interaction system |
| 05 | 01 (3D pane + orbit controls) | Builds on the 3D viewport established in 01 |
| 06 | 01 (2D pane) | Enhances the 2D viewport established in 01 |
| 07 | 02, 03, 06 | Export needs dimensions, annotations, zones, and rich 2D rendering |

### Parallel Execution Groups

**Phase A — Foundation**:
- `01-dual-viewport-and-layers` (sequential, must complete first)

**Phase B — Feature Development (all parallelizable after 01)**:
- `02-measurement-and-dimensions`
- `03-annotations-and-zones`
- `04-precision-and-smart-tools`
- `05-3d-environment`
- `06-rich-2d-floorplan`

**Phase C — Capstone**:
- `07-export-and-command-palette` (after Phase B, especially 02+03+06)

---

## Execution Order Recommendation

1. `/deep-plan @01-dual-viewport-and-layers/spec.md` — Do first, everything depends on it
2. After 01 is implemented, run these in parallel:
   - `/deep-plan @02-measurement-and-dimensions/spec.md`
   - `/deep-plan @03-annotations-and-zones/spec.md`
   - `/deep-plan @04-precision-and-smart-tools/spec.md`
   - `/deep-plan @05-3d-environment/spec.md`
   - `/deep-plan @06-rich-2d-floorplan/spec.md`
3. `/deep-plan @07-export-and-command-palette/spec.md` — Do last

**Realistic session planning**: Each split maps to roughly 1-2 implementation sessions. With parallelization of Phase B, the total project is approximately 8-10 sessions.

---

## Cross-Cutting Concerns

### Store Architecture
Splits 02, 03, and the layer part of 01 each introduce new Zustand store slices:
- `layers` slice (01): layer definitions, visibility, opacity, lock state
- `dimensions` slice (02): dimension line objects, measurement tool state
- `annotations` slice (03): text labels, arrows, callouts
- `zones` slice (03): zone polygons, types, area calculations

All must follow existing patterns: `partialize` for persistence, `temporal` consideration for undo/redo scope.

### Save Format Migration
Adding new store slices requires a v8 → v9 migration (or later versions if done incrementally). Each split that adds persisted state needs a migration function.

### Layer Integration
Every split that adds renderable content (02, 03, 05, 06) must integrate with the layer system from 01. This means:
- Register layer definitions
- Respect layer visibility in render logic
- Respect layer lock in interaction logic

### Performance Budget
The dual viewport from 01 roughly doubles rendering cost. Each subsequent split must be mindful of this. GPU tier gating applies to all new visual features.

### Testing Strategy
Each split should add:
- Unit tests for new store slices and utilities
- Visual regression tests for new viewport features (Playwright)
- Integration tests for cross-pane synchronization (01)
