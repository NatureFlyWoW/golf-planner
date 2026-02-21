# 05 - Visual Spec

## Rendering Rules

Every 3D element has a concrete visual definition so implementation doesn't stall on "what should this look like?"

## Hall Elements

### Floor
- **Geometry:** Flat plane, 10m × 20m
- **Color:** Light gray (`#E0E0E0`)
- **Purpose:** Shows hall footprint, serves as raycast target for placement

### Walls
- **Geometry:** Thin boxes, 0.1m thick × 4.3m tall × wall length
- **Color:** Warm gray (`#B0B0B0`), semi-transparent in 3D view (opacity 0.6)
- **Cutouts:** None. Doors and windows are separate objects placed on walls.
- **Top-down view:** Walls visible as thin borders around the floor

### Doors
- **Sectional door (3.5m × 3.5m):** Green rectangle (`#4CAF50`) on wall surface, 0.01m offset from wall
- **PVC door (0.9m × 2.0m):** Lighter green (`#81C784`) on wall surface
- **Label:** "Door" text overlay via drei `<Html>`

### Windows
- **4× PVC windows (3.0m × 1.1m):** Light blue rectangle (`#64B5F6`) on wall surface
- **Sill height:** TBD (not in BORGA offer — default to 1.5m above floor)

### Roof
- **Top-down view:** Not rendered (would occlude everything)
- **3D view:** Wireframe or semi-transparent sloped plane (opacity 0.15)
- **Pitch:** 7° from center ridge, slopes to both sides
- **Color:** Light blue wireframe (`#90CAF9`)

### Grid
- **Major gridlines:** Every 1.0m, light gray (`#CCCCCC`), thin
- **Minor gridlines:** Every 0.25m, very light (`#EEEEEE`), thinner (only visible when snap is on)
- **Grid plane:** At floor level (y=0)
- **Toggleable:** Minor grid only shows when snap is enabled

## Mini Golf Holes

### Target Quality (Phase 12)
Holes should look like real miniature golf obstacles — textured surfaces, rounded edges, detailed geometry. See [Phase 12 design doc](./2026-02-21-phase12-beautiful-3d-models.md) for full spec.

### Placed Holes
- **Playing surface:** Textured felt/carpet with visible fiber direction (normal map), subtle color variation, slight surface irregularity
- **Bumper rails:** Rounded cross-section profile (ExtrudeGeometry, not BoxGeometry), wood grain or metal finish per material profile
- **Cup:** Recessed cylindrical hole with lip edge, visible depth, small flag/pin marker
- **Tee pad:** Raised rubber mat with texture, visible thickness
- **Obstacles:** Detailed 3D models — windmill with tower/blades, brick tunnel archway, smooth loop track, curved ramp surfaces
- **Selected state:** Bright yellow outline/border, slight y-offset (+0.01m)
- **Label:** Hole number (from holeOrder position) displayed on top face or as Html overlay
- **Rotation:** Visible via a small arrow/tick mark on one end indicating "direction of play"
- **Material profiles:** Visual quality matches cost tier (budget=rustic wood bumpers, standard=painted MDF, semi_pro=aluminum rails)

### Ghost Hole (placement preview)
- **Same geometry as placed hole** for the selected type
- **Valid placement:** Green, semi-transparent (opacity 0.5)
- **Invalid placement (collision or out of bounds):** Red, semi-transparent (opacity 0.5)
- **Follows cursor/tap position**, snapped to grid when snap is enabled

## Player Flow Path

- **Geometry:** Line segments connecting hole centers in holeOrder sequence
- **Color:** Orange (`#FF9800`), dashed line
- **Numbers:** Small numbered circles at each hole center (1, 2, 3...)
- **Toggleable:** Can be shown/hidden via toolbar button
- **Purpose:** Visualize player route, spot crossing paths and bottlenecks

## Camera Presets

### Top-Down (default)
- **Type:** OrthographicCamera
- **Position:** Directly above center of hall, looking straight down
- **Zoom:** Fits entire hall with small margin
- **Controls:** Pan (middle-click/two-finger), zoom (scroll/pinch), no rotation

### 3D / Isometric
- **Type:** OrthographicCamera
- **Position:** `[15, 15, 15]` looking at hall center
- **Controls:** Pan, zoom, orbit (limited polar angle 10°–80° to prevent flipping)

## UI Elements (non-3D)

### Toolbar (top on desktop, bottom on mobile)
- Icon buttons with tooltips
- Active tool highlighted
- Tools: Select, Place, Delete, View Toggle (Top/3D), Flow Path Toggle
- Undo/Redo buttons (Phase 2)

### Sidebar (desktop) / Overlay panels (mobile)
- **Holes tab:** Grid of hole type cards (icon + name + dimensions), click to enter place mode
- **Detail tab:** Selected hole properties — name (editable), type, position, rotation (buttons for 0/90/180/270), par, delete button
- **Budget tab:** Category list with estimated/actual/notes fields

### Collision Feedback
- Invalid placement: red ghost + subtle shake animation
- Out of bounds: same red treatment
- Overlapping holes on move: red outline on the moving hole
