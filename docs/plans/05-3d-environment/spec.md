# 05 — 3D Environment

## Overview
Make the 3D viewport look professional by adding environmental context — a ground plane, the hall's exterior appearance, improved lighting, and an optional first-person walkthrough mode. The reference images show buildings sitting in their surroundings with terrain, driveways, and landscaping. Golf Forge's hall currently floats in a dark void — this split gives it a sense of place.

## Reference
- **Requirements**: `../next-evolution-requirements.md` (F7: Enhanced 3D Viewport)
- **Reference images**: `../../reference_samples/APP_AND_UI_REF1-3.jpg` — houses shown with grass, driveways, cars, garden furniture; the building has a visible exterior with textured walls and roof
- **Interview**: `../deep_project_interview.md` — Topic 1 ("Enhanced 3D Environment" cluster)

## Current State
- **3D scene**: Hall walls (corrugated steel textures), floor (concrete textures), holes with PBR materials
- **Background**: Dark void (#07071A) with exponential fog in UV+3D mode
- **Lighting**: Directional sun light + ambient; UV mode: purple ambient + UV lightformers
- **Camera**: PerspectiveCamera at 45° angle with OrbitControls (rotate, pan, zoom)
- **No ground**: Hall sits on nothing — floor is the only horizontal surface
- **No exterior**: Walls are only visible from inside; no roof geometry, no exterior texture
- **No walkthrough**: Can orbit/pan but not walk at eye level
- **Key files**: `ThreeCanvas.tsx`, `HallFloor.tsx`, `HallWalls.tsx`, `CameraControls.tsx`

## Requirements

### Ground Plane
1. **Textured ground**: Large plane extending 20-30m beyond hall in all directions
2. **Surface**: Asphalt/gravel texture (appropriate for commercial/industrial site in Gramastetten)
3. **Edge fade**: Ground plane fades into background at edges (alpha gradient or fog)
4. **Performance**: Simple plane with repeating texture — negligible GPU cost

### Hall Exterior
5. **Exterior walls**: Corrugated steel visible from outside (existing interior textures may work)
6. **Roof**: Simple pitched roof matching BORGA specs (7° pitch, ridge along length)
7. **Roof texture**: Metal/steel roofing material
8. **Doors/windows from outside**: Visible as recessed openings in exterior walls
9. **Foundation line**: Subtle base strip at ground level

### Environment Lighting
10. **Sky dome**: Gradient sky (not just solid color) — light blue/gray above, lighter at horizon
11. **Ground shadow**: Hall casts a shadow on the ground plane
12. **Ambient occlusion**: Contact shadows where hall meets ground (already partially exists)
13. **Time-of-day**: Sun position from existing sun calculator affects exterior lighting too

### Camera Presets (Enhancement from Split 01)
14. **Exterior views**: Camera presets that show the hall from outside (if orbit allows)
15. **Zoom constraints**: Prevent camera from going below ground plane

### First-Person Walkthrough
16. **Walkthrough toggle**: Button or keyboard shortcut (W) to enter walkthrough mode
17. **Eye-level camera**: Camera at ~1.7m height, perspective projection
18. **WASD movement**: Standard FPS controls — W/S forward/back, A/D strafe
19. **Mouse look**: Click-drag to look around (or pointer lock for immersive mode)
20. **Wall collision**: Prevent walking through walls (simple AABB collision against hall walls)
21. **Exit**: Escape key or button to return to orbit view
22. **Performance**: Same scene, just different camera — no extra rendering cost

### Optional Environment Props (Lower Priority)
23. **Parking area**: Simple textured rectangle adjacent to hall (the site has parking)
24. **Simple landscaping**: A few low-poly trees or shrubs (optional, GPU-tier gated)
25. **Entry path**: Textured path from parking to hall door

## Technical Considerations

### Ground Plane
- `THREE.PlaneGeometry` with `MeshStandardMaterial` using a repeating asphalt/gravel texture
- Or use drei's `<Ground>` or `<ContactShadows>` helpers
- Position at Y=0 (hall floor level), extend 30m in each direction

### Hall Exterior
- Current `HallWalls.tsx` renders walls as inward-facing planes
- For exterior visibility, walls need to be double-sided or separate exterior meshes
- Roof: `THREE.BufferGeometry` with triangular prism following BORGA pitch (7°, height TBD)
- Keep it simple — the exterior is context, not the primary content

### Walkthrough Camera
- drei `PointerLockControls` for immersive FPS mode, or
- Custom camera controller with click-drag look + WASD movement (less immersive but no pointer lock needed)
- Wall collision: simple raycasting from camera position in movement direction
- Speed: ~2m/s (walking pace), adjustable with Shift (run)

### GPU Tier Gating
- **Low tier**: No ground plane, no exterior — same as current
- **Mid tier**: Ground plane + hall exterior, no walkthrough
- **High tier**: Full environment + walkthrough + shadows + props

### Performance Budget
- Ground plane: 1 draw call, negligible
- Hall exterior: ~5-10 draw calls (walls + roof + foundation)
- Sky dome: 1 draw call (environment map or gradient shader)
- Environment props: 3-10 draw calls (if included)
- Total environment addition: <20 draw calls — well within budget

## Dependencies
- **Depends on**: Split 01 (3D viewport pane — environment renders only in 3D)
- **Integrates with**: Existing sun calculator (sun position affects exterior lighting), GPU tier gating
- **Provides**: Ground plane, hall exterior, walkthrough camera mode

## Acceptance Criteria
- [ ] Ground plane visible in 3D viewport extending beyond hall
- [ ] Hall exterior visible when orbiting outside (walls + roof)
- [ ] Sky gradient visible (not dark void)
- [ ] Hall casts shadow on ground plane
- [ ] Walkthrough mode: enter via button/shortcut, WASD movement, mouse look
- [ ] Wall collision prevents walking through hall walls
- [ ] Escape to exit walkthrough back to orbit
- [ ] Environment additions respect GPU tier gating
- [ ] No visible performance degradation on mid-tier GPU
