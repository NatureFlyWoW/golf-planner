# 05 — 3D Environment

## Overview
Transform the 3D viewport from a floating-in-void orbit view into an immersive environment where users can walk through their mini golf course at eye level and see the hall situated in its real-world context. The headline feature is **first-person walkthrough mode** — walking among beautiful PBR holes inside a blacklight venue. Environmental context (ground plane, hall exterior, sky) completes the scene.

## User-Visible Outcomes

**What changes when this split ships:**

| Priority | What the user SEES |
|----------|--------------------|
| **1 (Killer feature)** | Walk through the golf course at eye-level with WASD controls. See holes, obstacles, felt surfaces from a player's perspective. Toggle between orbit and walkthrough freely. |
| **2 (Context)** | Hall sits on a textured ground surface (asphalt/gravel) instead of floating in void. |
| **3 (Context)** | Hall has a visible exterior — corrugated steel walls + pitched roof — when viewed/orbited from outside. |
| **4 (Atmosphere)** | Gradient sky background replaces the dark void. Sun position affects lighting. |

**What stays the same:**
- All existing hole models, materials, and interactions unchanged
- 2D floor plan pane unaffected (environment renders in 3D only)
- UV mode continues to work (dark environment replaces sky in UV mode)
- Budget, sidebar, toolbar, mobile layout unchanged

## Reference
- **Requirements**: `../next-evolution-requirements.md` (F7: Enhanced 3D Viewport)
- **Reference images**: `../../reference_samples/APP_AND_UI_REF1-3.jpg` — houses shown with grass, driveways, garden furniture
- **Interview**: `../deep_project_interview.md` — Topic 1 ("Enhanced 3D Environment" cluster)
- **Postmortem**: `../postmortem-phase11a-wrong-plan.md` — walkthrough (user experience) prioritized over environment (infrastructure)

## Current State
- **3D scene**: Hall walls (corrugated steel textures), floor (concrete textures), holes with PBR materials (felt/wood/rubber)
- **Background**: Dark void (#07071A) with exponential fog in UV+3D mode
- **Lighting**: Directional sun light + ambient; UV mode: purple ambient + UV lightformers
- **Camera**: PerspectiveCamera with CameraControls (orbit, pan, zoom, 6 presets)
- **No ground**: Hall sits on nothing — floor is the only horizontal surface
- **No exterior**: Walls rendered as inward-facing boxes; no roof geometry
- **No walkthrough**: Can orbit/pan but not walk at eye level
- **Dual viewport**: 2D (orthographic) + 3D (perspective) in split pane, or single-pane modes
- **Key files**: `DualViewport.tsx`, `HallFloor.tsx`, `HallWalls.tsx`, `CameraPresets.tsx`, `ThreeDOnlyContent.tsx`, `SharedScene.tsx`

## Requirements

### First-Person Walkthrough (PRIORITY 1 — Killer Feature)
1. **Walkthrough toggle**: Button in 3D pane toolbar + keyboard shortcut (F key) to enter walkthrough mode
2. **Eye-level camera**: Camera at ~1.7m height, perspective projection, inside the hall
3. **WASD movement**: Standard FPS controls — W/S forward/back, A/D strafe left/right
4. **Mouse look**: Click-drag to look around (no pointer lock — too aggressive for a planning tool). Pointer lock as optional toggle.
5. **Walk speed**: ~2m/s normal, Shift to run at ~4m/s
6. **Wall collision**: Prevent walking through hall walls (AABB against wall boundaries)
7. **Hole collision**: Prevent walking through placed golf holes (AABB per hole bounding box)
8. **Exit**: Escape key or button to return to previous orbit camera position
9. **Interior-first**: Walkthrough spawns inside the hall near the entrance door. User can walk outside through door openings.
10. **No GPU tier gating**: Walkthrough is just a camera mode — zero extra rendering cost. Available on ALL tiers.
11. **Viewport mode**: Walkthrough forces 3D-only layout (no 2D pane during walkthrough — orbit controls make no sense in FPS mode)

### Ground Plane (PRIORITY 2)
12. **Textured ground**: Large plane extending ~15m beyond hall in all directions
13. **Surface**: Asphalt/gravel texture (appropriate for commercial/industrial site in Gramastetten)
14. **Edge fade**: Ground plane fades into fog/background at edges
15. **Performance**: Simple plane with repeating texture — 1 draw call
16. **3D viewport only**: Ground plane does NOT render in 2D architectural pane

### Hall Exterior (PRIORITY 3)
17. **Exterior walls**: Corrugated steel visible from outside (reuse existing steel textures, add backface or separate exterior meshes)
18. **Roof**: Simple pitched roof matching BORGA specs (7° pitch, ridge along 20m length, ~0.61m rise at center)
19. **Roof texture**: Metal/steel roofing material (reuse steel panel texture)
20. **Doors/windows from outside**: Visible as recessed openings in exterior walls
21. **Foundation line**: Subtle darker base strip at ground level
22. **3D viewport only**: Exterior does NOT render in 2D pane

### Sky & Lighting (PRIORITY 4)
23. **Sky background**: Gradient sky in normal mode — light blue above, lighter at horizon. Replaces dark void.
24. **UV mode override**: Sky replaced with dark void (#07071A) when UV mode active. Existing UV environment (night preset + lightformers) continues unchanged.
25. **Ground shadow**: Hall casts shadow on ground plane from existing directional sun light
26. **Contact shadows**: Subtle darkening where hall meets ground (drei `<ContactShadows>` or baked AO strip)
27. **Sun direction**: Existing directional light already points from sun position — no change needed. It just now also illuminates the exterior and ground.

### Camera Enhancements
28. **Exterior orbit presets**: Add 1-2 camera presets that show the hall from outside (e.g., "Overview" showing full exterior)
29. **Ground clamp**: Prevent orbit camera from going below ground plane (min polar angle / Y clamp)

## Technical Considerations

### Walkthrough Camera
- **NOT `PointerLockControls`** by default — pointer lock is too aggressive for a planning tool (steals cursor, users may panic). Use click-drag look + WASD instead.
- Optional pointer lock toggle for users who want full immersion
- Collision detection: raycasting from camera position in movement direction, or simple AABB math against wall boundaries + hole bounding boxes
- When entering walkthrough: store current orbit camera state, switch to FPS camera at spawn point
- When exiting: restore orbit camera to previous state
- Respect existing `frameloop` strategy — walkthrough needs continuous frames ("always")
- Walkthrough state in Zustand UI slice (ephemeral, not persisted)

### Ground Plane
- `THREE.PlaneGeometry` with `MeshStandardMaterial` using repeating asphalt/gravel texture (CC0)
- Position at Y=0 (hall floor level, same as existing floor), extend ~15m beyond hall
- Texture repeat: ~1m tile size, no visible seam with proper UV wrapping
- Edge fade via fog (extend existing fog to normal mode with appropriate color)

### Hall Exterior
- Current `HallWalls.tsx` renders walls as `boxGeometry` — these are already 3D boxes, so they HAVE exterior faces. But materials may only face inward.
- Solution: Use `side: THREE.DoubleSide` on wall material, or add separate exterior mesh group
- Roof: Simple `BufferGeometry` — two planes meeting at ridge. BORGA specs: 10m wide, 7° pitch → ridge at ~wallHeight + 0.61m
- Keep it simple — the exterior is context, not primary content

### Sky Dome
- drei `<Sky>` component (Preetham sky model) or simple gradient shader
- Must toggle off in UV mode (replace with dark background)
- Alternative: `<Environment>` with a daytime HDRI preset for normal mode, "night" for UV mode

### GPU Tier Gating (Environment Only — NOT Walkthrough)
- **Low tier**: No ground texture (flat color ground), no exterior detail, basic sky gradient
- **Mid tier**: Ground texture + hall exterior + sky
- **High tier**: Full environment + contact shadows + enhanced sky
- **All tiers**: Walkthrough mode available (it's just a camera)

### Dual Viewport Integration
- All new environment elements render in 3D View ONLY (use `useViewportId()` guard)
- 2D pane remains pure architectural floor plan — no ground, sky, or exterior
- Walkthrough forces `3d-only` viewport layout; exiting restores previous layout

### Performance Budget
- Ground plane: 1 draw call, negligible
- Hall exterior: ~5-8 draw calls (walls double-side or exterior mesh + roof + foundation)
- Sky: 1 draw call (Sky component or gradient)
- Contact shadows: 1 draw call
- Total environment addition: <15 draw calls — well within budget
- Walkthrough: 0 extra draw calls (same scene, different camera)

## Explicitly Deferred
- **Environment props** (parking area, landscaping, trees): deferred to future enhancement. Zero user value for a planning tool.
- **Dynamic time-of-day sky colors**: Existing sun position drives light direction only. Sky color stays static blue gradient. Dynamic sunrise/sunset deferred.
- **Exterior architectural detail** (gutters, downspouts, signage): not needed for planning context.
- **Walkthrough with VR/AR**: future consideration, not in scope.

## Dependencies
- **Depends on**: Split 01 (3D viewport pane + dual layout — COMPLETE)
- **Integrates with**: Existing sun calculator, GPU tier gating, UV mode, layer system
- **Provides**: Walkthrough camera mode, ground plane, hall exterior, sky background

## Acceptance Criteria
- [ ] Walkthrough mode: enter via button/F-key, WASD movement, click-drag look, ~1.7m eye level
- [ ] Walkthrough spawns inside hall near entrance
- [ ] Wall collision prevents walking through hall walls in walkthrough
- [ ] Hole collision prevents walking through placed holes in walkthrough
- [ ] Escape exits walkthrough, restores orbit camera
- [ ] Walkthrough available on ALL GPU tiers
- [ ] Ground plane visible in 3D viewport extending ~15m beyond hall
- [ ] Hall exterior visible when orbiting outside (walls + roof)
- [ ] Sky gradient visible in normal mode (not dark void)
- [ ] UV mode: sky replaced with dark environment (existing behavior preserved)
- [ ] Hall casts shadow on ground plane
- [ ] Environment renders in 3D pane only (2D pane unchanged)
- [ ] No visible performance degradation on mid-tier GPU
- [ ] Walkthrough forces 3D-only layout; exit restores previous layout
