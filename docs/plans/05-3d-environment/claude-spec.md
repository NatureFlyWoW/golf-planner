# Synthesized Spec: Split 05 — 3D Environment

## Project Context

Golf Forge is a personal planning tool for a 200m² BORGA steel hall blacklight mini golf venue in Gramastetten, Austria. Built with React 19 + TypeScript + Vite + R3F + drei + Zustand. The app has a dual-viewport layout (2D architectural floor plan + 3D perspective view) with 7 legacy hole types featuring PBR materials (felt/wood/rubber textures), a Hole Builder with 11 segment types, and comprehensive planning features (budget, cost estimation, layers, sun tracking).

The 3D scene currently shows the hall interior — textured concrete floor, corrugated steel walls, PBR-textured holes — but the hall floats in a dark void. There is no exterior, no ground, no sky, and no way to walk through the venue at eye level.

## What This Split Delivers

### Priority 1: First-Person Walkthrough (Killer Feature)
Walk through the mini golf course at eye level. See holes, obstacles, and materials from a player's perspective. This is the "wow" moment — experiencing the blacklight venue as a visitor would see it.

- **Camera**: Eye-level (~1.7m height) perspective camera inside the hall
- **Movement**: WASD keys for walk/strafe, Shift for run
- **Look**: Click-drag to look around (cursor stays visible, planning-tool-friendly). Optional PointerLock toggle for full immersion.
- **Spawn**: Inside hall near PVC entrance door (south wall, x≈8.1, z≈19.5), facing north
- **Collision**: Cannot walk through walls or placed holes (AABB boundary checks)
- **Toggle**: F key or toolbar button enters walkthrough. Escape exits back to orbit.
- **Layout**: Walkthrough forces 3D-only viewport layout. Previous layout restored on exit.
- **UV mode**: Walkthrough works in both normal and UV mode (no special handling)
- **No GPU gating**: Available on all tiers (zero extra rendering cost)

### Priority 2: Ground Plane
- Textured asphalt ground extending ~15m beyond hall in all directions
- Repeating CC0 asphalt texture, fades into fog at edges
- Renders in 3D viewport only (not in 2D floor plan)
- GPU-tier gated: flat color on low tier, textured on mid+

### Priority 3: Hall Exterior
- Walls visible from outside: `side: DoubleSide` on existing wall material
- Pitched roof: two inclined planes, 7° pitch, ridge at ~4.91m, steel texture
- Door/window openings visible from exterior (visual recesses)
- Foundation strip at ground level
- Renders in 3D viewport only

### Priority 4: Sky & Lighting
- Normal mode: drei `<Sky>` component with sun position from existing calculator
- UV mode: existing dark environment preserved (no change)
- Hall casts shadow on ground plane
- Contact shadows at hall-ground junction
- Fog in normal mode (light color matching sky horizon) for ground edge fade

### Priority 5: Camera Enhancements
- "Overview" camera preset showing exterior from distance
- Ground clamp preventing orbit camera from going below Y=0

## Technical Architecture

### Walkthrough Camera System
- New `WalkthroughController` component (renders null, manages camera in useFrame)
- Click-drag look: pointer event handlers on canvas, euler rotation with yaw (Y) + pitch (X) clamping
- WASD movement: read key state in useFrame, compute direction vector relative to camera facing, apply delta
- Collision: clamp camera position to hall boundaries (with margin), check against hole bounding boxes using existing `checkOBBCollision`
- Camera state preservation: save orbit position/target on enter, restore on exit
- Frameloop: `deriveFrameloop()` returns "always" when walkthrough active

### Walkthrough State (Zustand UI Slice)
```typescript
walkthroughMode: boolean;
previousViewportLayout: ViewportLayout | null;
```
Actions: `enterWalkthrough()`, `exitWalkthrough()`

### Environment Components
- `GroundPlane.tsx`: planeGeometry + meshStandardMaterial with repeating asphalt texture
- `HallExterior.tsx`: roof geometry + foundation strip (walls already have exterior via DoubleSide)
- `SkyEnvironment.tsx`: drei `<Sky>` (normal) or existing dark Environment (UV)
- All gated by `useViewportId() !== "2d"` and layer visibility

### Layer Integration
- New "environment" layer: controls ground, exterior, sky, fog visibility
- Added to `LayerId` type, `LAYER_DEFINITIONS`, `DEFAULT_LAYERS`

### Fog Strategy
- Normal mode: linear fog, light blue-gray color matching sky horizon, near=30 far=60
- UV mode: existing fogExp2 (#07071A, density 0.04) unchanged
- Background color: matches fog color for clean fade

### Keyboard Integration
- F key in 3D viewport: toggle walkthrough (currently "fit all holes" — remap to Shift+F in 3D)
- WASD in walkthrough: movement (suspended from 2D pan during walkthrough)
- Escape: exit walkthrough
- Camera presets (1-6): disabled during walkthrough

### GPU Tier Gating
| Feature | Low | Mid | High |
|---------|-----|-----|------|
| Walkthrough | Yes | Yes | Yes |
| Ground plane | Flat color | Textured | Textured |
| Hall exterior | DoubleSide walls only | + Roof + foundation | Full |
| Sky | Color background | Sky component | Sky + contact shadows |
| Fog | Basic | Standard | Standard |

## File Structure
```
src/components/three/environment/
  GroundPlane.tsx          # Textured ground extending beyond hall
  HallExterior.tsx         # Roof geometry + foundation strip
  SkyEnvironment.tsx       # Sky (normal) / dark env (UV) switcher
  WalkthroughController.tsx # FPS camera + movement + collision
  WalkthroughOverlay.tsx   # UI overlay (exit button, crosshair, speed indicator)
```

## Acceptance Criteria
1. Walkthrough: F key enters, WASD moves, click-drag looks, Escape exits
2. Walkthrough spawns inside hall at eye level near entrance
3. Wall + hole collision prevents walking through geometry
4. Ground plane visible, textured, fading at edges
5. Hall exterior visible from outside (walls + roof)
6. Sky gradient in normal mode, dark void in UV mode
7. Environment renders in 3D only (2D pane unchanged)
8. New "environment" layer in layers panel
9. No performance degradation on mid-tier GPU
10. All existing tests pass (639+), new tests for walkthrough + environment utilities
