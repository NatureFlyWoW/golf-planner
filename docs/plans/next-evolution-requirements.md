# Golf Forge — Next Evolution Requirements

## Vision Statement

Transform Golf Forge from a functional layout planner into a **professional-grade planning tool** — one that feels approachable on the surface but reveals deep professional capabilities to the power user. Think of it as the "TI-89 of mini golf planning": a high school student can place holes and see their layout, but a venue engineer can produce dimensioned construction documents, analyze player flow, and present a stakeholder-ready 3D walkthrough.

### Reference Model
The architectural reference is professional German home-planning software (Plan7Architekt / Ashampoo 3D CAD style) — see `reference_samples/APP_AND_UI_REF1-3.jpg`. Key patterns from these references:
- **Simultaneous 2D + 3D split-pane view** (not toggle-based)
- **Rich 2D floor plan** with textured surfaces, dimension annotations, area calculations
- **Full 3D perspective** with orbit camera, realistic environment context
- **Deep categorized toolbar** organized by function domain
- **Layer system** for toggling visibility of element groups
- **Precision tools**: numeric position input, alignment guides, rulers, scale controls
- **Professional output**: dimensioned drawings, construction-ready documents

## Current State (Phase 12 Complete)

### What Works Well (Keep)
- Dark purple/navy theme with neon accents
- Hole library with 7 built-in types + custom Hole Builder (11 segment types)
- PBR-textured 3D models (felt, wood, rubber, concrete, steel, brick)
- Budget tracker with 18 categories, VAT profiles, confidence tiers, construction phases
- Cost auto-estimation (DIY/pro modes, per-type cost mappings)
- Financial settings (Austrian-specific: VAT registration, inflation, risk tolerance)
- Flow path visualization (numbered dashed lines)
- Sun position calculator
- Snap-to-grid, undo/redo, collision detection
- SVG export, screenshot capture, JSON save/load
- PWA with mobile support
- GPU tier gating (low/mid/high)
- UV/Blacklight mode with postprocessing effects

### What's Missing (The Gap)
Comparing current screenshots to the reference images, the following capabilities are absent:

1. **No split-pane dual view** — 2D and 3D are toggle-based, not simultaneous
2. **No dimension/measurement tools** — can't click to measure distances, no dimension lines on floor plan
3. **No layer system** — can't toggle visibility of holes, grid, flow path, annotations, walls independently
4. **No annotation tools** — can't add text labels, notes, arrows, or dimension callouts to the floor plan
5. **No rich 2D plan rendering** — top-down holes are flat colored rectangles, no textured 2D representations
6. **No environment context in 3D** — hall floats in void, no terrain/ground/surroundings
7. **No precision positioning tools** — no numeric X/Y input, no alignment/distribution/snapping guides
8. **No zone/room system** — can't define functional areas (waiting, counter, storage, WC, etc.) within the hall
9. **No presentation/print mode** — no way to generate a professional dimensioned floor plan document
10. **No ruler/scale bar** — no visual scale reference on the canvas
11. **Limited toolbar depth** — flat toolbar, not organized into functional categories
12. **No 3D orbit camera** — 3D mode appears fixed, not freely rotatable with orbit controls
13. **No walkthrough/first-person view** — can't "walk through" the venue at eye level

## Feature Requirements

### F1: Split-Pane Dual View
The canvas should support a resizable split-pane layout:
- **Left**: 2D orthographic top-down floor plan (current default view, enhanced)
- **Right**: 3D perspective view with orbit controls
- Both views stay synchronized: selecting a hole in 2D highlights it in 3D and vice versa
- Resizable divider (drag to adjust split ratio)
- Can collapse either pane to go full-screen on one view
- Each pane has its own zoom/pan controls

### F2: Dimension & Measurement Tools
Professional dimensioning system:
- **Click-to-measure**: click two points to display distance in meters
- **Dimension lines**: permanent dimension annotations that stay on the floor plan
- **Area display**: clickable zones show their area (m²) as overlay text
- **Ruler/scale bar**: always-visible scale reference on the canvas
- **Hall dimensions**: wall lengths auto-displayed along edges
- **Hole spacing**: show distances between adjacent holes when selected
- **Snap to dimensions**: when dragging, show live distance readouts to nearby objects

### F3: Layer System
Toggleable visibility layers:
- **Holes** — all placed holes
- **Flow path** — numbered connection lines
- **Grid** — the background grid overlay
- **Dimensions** — dimension lines and measurements
- **Annotations** — text labels and notes
- **Walls/Doors/Windows** — structural elements
- **Zones** — functional area outlines
- **Sun** — sun position indicator
- Layer panel in sidebar or as floating panel
- Per-layer opacity slider (not just on/off)
- Lock layers to prevent accidental edits

### F4: Annotation & Markup Tools
Add text, arrows, and callouts to the floor plan:
- **Text labels**: place text at any position (font size, color adjustable)
- **Arrows/lines**: draw arrows pointing to specific features
- **Callout boxes**: annotation bubbles with leader lines
- **Freehand notes**: simple shapes (rectangles, circles) for marking areas
- Annotations persist across saves
- Toggleable via layer system
- Exportable in SVG/screenshot output

### F5: Zone/Room System
Define functional areas within the hall:
- **Zone types**: playing area, waiting/reception, counter/POS, storage, WC/facilities, staff area, emergency exit paths, UV lamp coverage zones
- Draw zone boundaries (rectangle or polygon)
- Auto-calculate zone area (m²)
- Zone-specific coloring/hatching in 2D view
- Zones visible as floor coloring in 3D view
- Zone budget linking (associate budget categories with zones)
- Clearance validation (minimum aisle width, exit path requirements)

### F6: Precision Positioning & Alignment
Professional CAD-like precision:
- **Numeric input panel**: type exact X, Z coordinates for selected hole
- **Alignment guides**: snap to horizontal/vertical alignment with other holes
- **Distribution tools**: evenly space selected holes horizontally or vertically
- **Smart guides**: temporary guide lines appear when dragging near alignments
- **Grid size control**: adjustable grid spacing (0.1m, 0.25m, 0.5m, 1m)
- **Coordinate display**: live mouse position in meters on the canvas
- **Transform gizmo**: visual handles for position + rotation on selected hole

### F7: Enhanced 3D Viewport
Bring the 3D view to reference-image quality:
- **Full orbit camera**: click-drag to rotate, scroll to zoom, right-drag to pan
- **Ground plane**: textured ground extending beyond the hall (grass/gravel/asphalt)
- **Hall exterior**: simple steel exterior walls, roof ridge visible from outside
- **Environment lighting**: sky dome, ambient occlusion, soft shadows
- **First-person walkthrough**: toggle into eye-level camera to "walk through" the venue
- **Camera presets**: top, front, back, left, right, isometric buttons
- **Smooth transitions**: animated camera movement between presets

### F8: Rich 2D Floor Plan Rendering
Make the top-down view look like a professional floor plan:
- **Textured surfaces in 2D**: holes show felt texture (not just flat color), floor shows concrete
- **Wall thickness**: walls rendered with thickness (not just lines)
- **Door/window symbols**: standard architectural symbols for doors and windows
- **Hatching for zones**: cross-hatching or pattern fills for different zone types
- **Scale-dependent detail**: more detail at higher zoom levels, simplified at overview zoom
- **Print-ready rendering**: clean lines, crisp text, professional appearance

### F9: Professional Export & Presentation
Generate stakeholder-ready output:
- **Dimensioned floor plan PDF**: auto-generated construction document with measurements, scale bar, title block, legend
- **3D presentation renders**: high-quality static renders from key viewpoints
- **Material schedule**: auto-generated list of materials needed based on hole types and zones
- **Cost summary report**: PDF combining budget data with floor plan
- **Before/after comparison**: side-by-side empty hall vs. planned layout

### F10: Enhanced Toolbar & Command Palette
Deeper tool organization:
- **Categorized toolbar sections**: Place, Measure, Annotate, View, Export (with submenus/dropdowns)
- **Command palette** (Ctrl+K / Cmd+K): fuzzy-search any action/tool by name
- **Keyboard shortcuts panel**: visual reference for all shortcuts
- **Recent actions**: quick access to recently used tools
- **Contextual actions**: right-click context menu on holes/zones/annotations

## Design Constraints

- Must remain a **client-side PWA** — no server dependencies
- Must maintain **mobile responsiveness** (features gracefully degrade on small screens)
- Must preserve **existing save format compatibility** (migration path for v8 saves)
- Must maintain **495+ tests passing** baseline
- **Performance**: split-pane dual R3F rendering must run at 30+ fps on mid-tier hardware
- **Incremental delivery**: features should be deployable independently, not an all-or-nothing rewrite

## Priority Guidance (from user)

The user's reference images emphasize:
1. **HIGHEST**: Split-pane dual view (F1) + 3D orbit camera (F7) — this is the most visually transformative change
2. **HIGH**: Dimensions/measurements (F2) + precision tools (F6) — "power user" depth
3. **HIGH**: Rich 2D rendering (F8) — floor plan should look professional
4. **MEDIUM**: Layer system (F3) + zones (F5) — organizational depth
5. **MEDIUM**: Annotations (F4) + enhanced toolbar (F10) — usability
6. **LOWER**: Professional export (F9) — polishing step
7. **LOWER**: First-person walkthrough (part of F7) — nice-to-have

## Non-Goals (Explicit Exclusions)

- Multi-user collaboration / real-time sync
- Server-side rendering or API backends
- VR/AR integration
- Physics simulation (ball rolling)
- Customer-facing booking/reservation system
- Redesigning the existing dark theme / visual identity
