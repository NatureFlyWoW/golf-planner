# Phase 6: Realistic 3D Hole Models — Design Document

**Date:** 2026-02-20
**Status:** Draft

## Goal

Replace the plain colored boxes with detailed, recognizable mini golf obstacle models. Each of the 7 hole types gets distinctive geometry that conveys what the obstacle actually is — ramps slope, windmills have blades, tunnels have arches. All procedural R3F geometry, no external assets.

## Core Decisions

1. **Procedural geometry** — built from Three.js primitives in React components
2. **Clean & colorful style** — green felt lanes, white bumpers, colored obstacle features
3. **Static only** — no animations (windmill blades frozen in place)
4. **Same bounding box** — collision/selection/drag use existing AABB dimensions
5. **View-dependent detail** — top-down view can stay simple (colored rectangles with a type icon/border), 3D view shows full models
6. **One component per type** — `HoleStraight.tsx`, `HoleWindmill.tsx`, etc. dispatched by type

## Shared Anatomy

Every hole model shares this structure:

```
Base pad (thin gray rectangle, full footprint)
  └─ Playing surface (green felt, raised 0.01m)
      ├─ Side bumpers (white walls, 0.05m thick, 0.08m tall)
      ├─ Tee marker (yellow disc at start end, flush with surface)
      ├─ Hole cup (black disc at far end, flush with surface)
      └─ Obstacle feature (type-specific, colored per type)
```

### Shared Constants

```typescript
const FELT_COLOR = "#2E7D32";     // dark green
const BUMPER_COLOR = "#F5F5F5";   // near-white
const BASE_COLOR = "#9E9E9E";     // medium gray
const TEE_COLOR = "#FDD835";      // yellow
const CUP_COLOR = "#212121";      // near-black

const BUMPER_HEIGHT = 0.08;       // 8cm tall
const BUMPER_THICKNESS = 0.05;    // 5cm wide
const SURFACE_THICKNESS = 0.02;   // 2cm thick felt
const BASE_THICKNESS = 0.01;      // 1cm pad
const TEE_RADIUS = 0.03;          // 3cm
const CUP_RADIUS = 0.054;         // 5.4cm (regulation)
```

### Shared Material Strategy

- Felt: `MeshStandardMaterial` with `roughness: 0.9`, `metalness: 0`
- Bumpers: `MeshStandardMaterial` with `roughness: 0.3`, `metalness: 0.1`
- Obstacle features: `MeshStandardMaterial` with type's signature color
- Base: `MeshStandardMaterial` with `roughness: 0.7`

## Per-Type Models

### 1. Straight (0.6m x 3.0m, green #4CAF50)

**The simplest hole.** Flat lane with bumpers on both long sides. No obstacles.

Geometry:
- Base pad: 0.6 x 3.0
- Felt surface: 0.5 x 2.9 (inset from bumpers)
- Two long bumper walls (left/right)
- Two short bumper walls (front/back, with gap for tee and hole)

### 2. L-Shape (1.2m x 2.5m, blue #2196F3)

**90-degree right turn.** Two lane segments meeting at a corner.

Geometry:
- Base pad: 1.2 x 2.5
- Entry segment: 0.5m wide x 1.5m long, starting from bottom-left
- Turn segment: 0.5m wide x ~1.2m long, running perpendicular after the bend
- Outer bumper walls follow the L path
- Inner corner bumper (the turn piece)
- Felt surfaces on both segments

### 3. Dogleg (1.5m x 3.3m, orange #FF9800)

**Gentle double-bend.** Wider lane with two angled direction changes.

Geometry:
- Base pad: 1.5 x 3.3
- Three lane segments forming a shallow Z/S shape:
  - Entry: straight for ~1m
  - Angle: 20-30 degree bend
  - Middle: ~1.3m
  - Angle: opposite bend back to center
  - Exit: ~1m
- Bumper walls follow the bends (angled wall sections)
- Wider than straight to accommodate the offset

### 4. Ramp (0.6m x 3.0m, purple #9C27B0)

**Uphill slope and downhill.** Classic elevated ramp obstacle.

Geometry:
- Base pad: 0.6 x 3.0
- Flat entry lane: first 0.8m
- Ramp up: wedge/slope from 0 to 0.15m height over 0.5m
- Flat elevated plateau: 0.4m at 0.15m height
- Ramp down: slope back to ground over 0.5m
- Flat exit lane: final 0.8m
- Side bumpers follow the elevation change
- Purple accent color on the ramp slopes

### 5. Loop (1.8m x 2.0m, cyan #00BCD4)

**The showpiece — a vertical loop arch.** Ball theoretically goes through a loop.

Geometry:
- Base pad: 1.8 x 2.0
- Entry lane: 0.5m wide, first 0.6m
- Loop structure: torus section (half-ring) standing vertical
  - `TorusGeometry` with arc of PI (180 degrees)
  - Inner radius ~0.3m, tube radius ~0.05m
  - Positioned at center of the hole
  - Cyan colored
- Two support pillars on either side of the loop base
- Exit lane: continues after the loop
- Side bumpers on the straight sections

### 6. Windmill (1.2m x 2.5m, pink #E91E63)

**Classic windmill obstacle.** Central post with 4 blades over the lane.

Geometry:
- Base pad: 1.2 x 2.5
- Straight lane running full length (centered)
- Central pillar: cylinder, 0.06m radius, 0.35m tall, positioned at center
- 4 blades: flat rectangular panels (0.3m x 0.06m x 0.02m), attached to pillar at y=0.2m
  - Rotated 0°, 90°, 180°, 270° from pillar center
  - Pink colored
  - Static (frozen at a fixed angle, e.g., 22.5° offset for visual interest)
- Lane opening under the blades (gap in bumpers for ball to pass through)
- Side bumpers along the lane

### 7. Tunnel (0.6m x 4.0m, gray #607D8B)

**Enclosed passage.** Half-cylinder arch over the middle section.

Geometry:
- Base pad: 0.6 x 4.0
- Entry lane: first 1.2m, open
- Tunnel section: middle 1.6m
  - Half-cylinder arch: `CylinderGeometry` with thetaLength=PI, rotated
  - Or extruded half-circle shape
  - Gray colored, slightly transparent from outside (opacity 0.8)
  - Lane continues inside, visible through the entry/exit openings
- Exit lane: final 1.2m, open
- Side bumpers on the open sections, tunnel walls enclose the middle

## Architecture

### Component Dispatch

```typescript
// src/components/three/holes/HoleModel.tsx
function HoleModel({ type, ...props }) {
  switch (type) {
    case "straight":  return <HoleStraight {...props} />;
    case "l-shape":   return <HoleLShape {...props} />;
    case "dogleg":    return <HoleDogleg {...props} />;
    case "ramp":      return <HoleRamp {...props} />;
    case "loop":      return <HoleLoop {...props} />;
    case "windmill":  return <HoleWindmill {...props} />;
    case "tunnel":    return <HoleTunnel {...props} />;
  }
}
```

### File Structure

```
src/components/three/holes/
  HoleModel.tsx          — dispatcher
  HoleStraight.tsx       — straight lane
  HoleLShape.tsx         — L-bend
  HoleDogleg.tsx         — S-curve
  HoleRamp.tsx           — elevated ramp
  HoleLoop.tsx           — vertical loop
  HoleWindmill.tsx       — blade obstacle
  HoleTunnel.tsx         — enclosed tunnel
  shared.ts              — constants, shared materials, BasePad/Bumper/Tee/Cup components
```

### Integration with MiniGolfHole.tsx

Current `MiniGolfHole.tsx` renders a `<boxGeometry>`. Replace that with:

```tsx
// Before (current):
<mesh>
  <boxGeometry args={[width, HOLE_HEIGHT, length]} />
  <meshStandardMaterial color={currentColor} />
</mesh>

// After:
<HoleModel
  type={hole.type}
  width={def.dimensions.width}
  length={def.dimensions.length}
  color={def.color}
  state={currentState}  // "normal" | "selected" | "dragging" | "delete-hover"
/>
```

State-dependent coloring moves into HoleModel — when selected/dragging/delete, the model gets a tinted overlay or emissive boost rather than replacing the entire color.

### GhostHole.tsx

GhostHole (placement preview) stays as a simple transparent box. No need to render full models during placement — it's a quick preview, not a final render.

## View-Dependent Rendering

### Top-Down View (default)

In top-down orthographic view, the detailed 3D models are visible from above. The green felt surface, bumper outlines, and obstacle features are all visible as a top-down footprint. No special handling needed — the models just look like detailed floor plans from above.

### 3D Isometric View

Full model detail visible. This is where the models really shine — ramps have visible slopes, windmills have blades, tunnels have arches.

## Selection & Interaction

- **Bounding box unchanged**: AABB collision uses same width/length dimensions
- **Selection highlight**: add a semi-transparent outline box (or edges) around the entire model group, same as current amber outline
- **Drag overlay**: tint the entire model yellow during drag (add emissive to all materials)
- **Delete hover**: tint red (add emissive red)
- **Rotation**: RotationHandle ring works unchanged (wraps around the bounding box)

## Performance Considerations

- Each model is 10-30 mesh objects (primitives)
- With 18 holes max, that's 180-540 meshes — well within R3F's comfort zone
- No textures, no shadows from holes (keep directional light shadow off for holes)
- Static geometry — no per-frame updates
- Consider `useMemo` for geometry creation to prevent re-creation on re-render
- Shared materials via `useRef` or module-level constants (not new material per render)

## Testing

- Visual verification only — no unit tests for geometry shapes
- Test in both top-down and 3D views
- Verify all 7 types render without errors
- Verify selection/drag/rotate/delete still work
- Verify GhostHole placement preview still works
- Mobile performance check (3D view with 10+ holes)

## Migration

- No data model changes
- No store changes
- No persistence changes
- Pure rendering upgrade — swap box geometry for model components
