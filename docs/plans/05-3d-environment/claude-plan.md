# Implementation Plan: Split 05 — 3D Environment

## User-Visible Outcomes

When this split ships, opening Golf Forge and switching to 3D view:

1. **Walkthrough mode**: Press F or click the walkthrough button → camera drops to eye level inside the hall near the entrance. Walk with WASD, look around by click-dragging. See mini golf holes from a player's perspective — felt surfaces, wooden bumpers, windmill obstacles at eye height. Toggle UV mode to experience the blacklight atmosphere. Press Escape to return to orbit view.

2. **Hall in context**: The BORGA hall sits on an asphalt ground surface. It has a visible corrugated steel exterior and pitched metal roof. A gradient sky replaces the dark void behind the hall.

3. **What stays the same**: All hole models, 2D floor plan, sidebar, toolbar, budget, mobile layout.

---

## Architecture Overview

### New Components (in `src/components/three/environment/`)

| Component | Purpose |
|-----------|---------|
| `WalkthroughController.tsx` | FPS camera management: movement, click-drag look, collision |
| `WalkthroughOverlay.tsx` | HTML overlay: exit button, controls hint |
| `GroundPlane.tsx` | Textured asphalt plane extending beyond hall |
| `HallRoof.tsx` | Pitched roof geometry (two inclined planes + gable ends) |
| `HallFoundation.tsx` | Dark base strip around hall perimeter |
| `SkyEnvironment.tsx` | Sky (normal mode) / dark void (UV mode) switcher |

### Modified Files

| File | Changes |
|------|---------|
| `src/store/store.ts` | Add `walkthroughMode`, `previousViewportLayout` to UI state; add enter/exit actions |
| `src/types/viewport.ts` | Extend `LayerId` with `"environment"` |
| `src/constants/layers.ts` | Add environment layer definition |
| `src/hooks/useKeyboardControls.ts` | F key → walkthrough toggle in 3D; suppress shortcuts during walkthrough |
| `src/utils/environmentGating.ts` | `deriveFrameloop()` adds `walkthroughMode` param; new gating functions |
| `src/components/three/HallWalls.tsx` | Add separate exterior mesh group with `side: BackSide` |
| `src/components/three/ThreeDOnlyContent.tsx` | Mount environment components (ground, roof, sky, foundation) |
| `src/components/layout/DualViewport.tsx` | Mount `WalkthroughOverlay`; pass `walkthroughMode` to `deriveFrameloop`; provide pane ref for pointer events |

### New Utility Functions

| Function | File | Purpose |
|----------|------|---------|
| `checkWalkthroughCollision(currentPos, desiredPos, holes, hall)` | `src/utils/walkthroughCollision.ts` | Test camera movement against walls + holes, return resolved position |
| `getWalkthroughSpawnPoint(hall)` | `src/utils/walkthroughCollision.ts` | Compute spawn position near PVC door from hall constants |
| `getDoorZones(hall)` | `src/utils/walkthroughCollision.ts` | Compute passable door zones from hall.doors array |
| `shouldShowSky(uvMode, gpuTier)` | `src/utils/environmentGating.ts` | Sky visibility gating |
| `shouldShowGroundTexture(gpuTier)` | `src/utils/environmentGating.ts` | Ground texture vs flat color |
| `shouldEnableNormalFog(viewportLayout, uvMode, envLayerVisible)` | `src/utils/environmentGating.ts` | Normal-mode fog gating (3d-only only) |

---

## Section-by-Section Implementation

### Section 1: Walkthrough State & Store Integration

**Goal**: Add walkthrough mode to Zustand store, wire up enter/exit lifecycle, force 3D-only layout, update frameloop derivation.

**Store changes** (UI slice):
- New state fields: `walkthroughMode: boolean` (default false), `previousViewportLayout: ViewportLayout | null` (default null)
- New actions:
  - `enterWalkthrough()`: early-return if `isMobile()`. Saves current `viewportLayout` to `previousViewportLayout`, sets `walkthroughMode: true`, sets `viewportLayout: "3d-only"`
  - `exitWalkthrough()`: sets `walkthroughMode: false`, restores `viewportLayout` from `previousViewportLayout` (deferred via `requestAnimationFrame` to avoid race condition with CameraControls remounting)
- Walkthrough state is **ephemeral** — not persisted, not undo-tracked (same pattern as `uvMode`)
- Verify `partialize` excludes walkthrough fields

**Frameloop update** (`environmentGating.ts`):
- Add `walkthroughMode: boolean` as 5th parameter to `deriveFrameloop()`
- When `walkthroughMode === true`, return `"always"` (camera needs continuous frames regardless of UV/GPU tier)
- Update call site in `DualViewport.tsx` to pass `walkthroughMode` from store

**Tests**:
- `enterWalkthrough()` sets mode true, layout to 3d-only, saves previous layout
- `enterWalkthrough()` no-ops on mobile
- `exitWalkthrough()` restores previous layout, clears walkthrough mode
- `deriveFrameloop()` returns "always" when walkthrough active (all GPU tiers, all UV modes)
- Walkthrough state not included in persistence (verify partialize)

---

### Section 2: Walkthrough Camera Controller

**Goal**: Implement FPS camera with click-drag look and WASD movement. No collision yet — just free movement.

**Component**: `WalkthroughController.tsx` — renders null, manages camera via `useFrame` + pointer events.

**Pointer event target**: Attach pointer events to the 3D pane div (passed via ref/context from DualViewport), NOT the canvas (which has `pointerEvents: "none"`). In 3d-only layout, use the container div. The component receives the target element ref as a prop.

**Look system** (click-drag):
- Track `isDragging` ref. On pointerdown on target element: set dragging, capture previous mouse position. On pointermove: compute dx/dy delta, apply to euler yaw (Y-axis) and pitch (X-axis). On pointerup: stop dragging.
- Sensitivity: ~0.003 radians per pixel
- Pitch clamped to ±85° (prevent camera flip)
- Euler order: 'YXZ' (yaw first, then pitch)
- Apply euler to camera quaternion each frame
- Initial euler: yaw=0, pitch=0 (facing -Z = north in Three.js)

**Movement system** (WASD):
- Track pressed keys via `keydown`/`keyup` listeners on `window` in useEffect
- Use `stopPropagation` on handled keys to prevent `useKeyboardControls` from also processing them
- Each frame in `useFrame`: compute front vector (camera forward projected to XZ plane), side vector (perpendicular), combine based on key state, normalize, scale by speed × delta
- Walk speed: 2.0 m/s. Run speed (Shift held): 4.0 m/s
- Y position locked to 1.7m (eye level)

**Camera lifecycle**:
- On mount: save current camera position + target (via `CameraControls.getPosition()`/`getTarget()` refs). Set camera to spawn point (`getWalkthroughSpawnPoint(hall)`), set euler to face north.
- On unmount: restore camera via deferred `CameraControls.setLookAt()` (using saved state). Use `requestAnimationFrame` to ensure CameraControls is ready after re-mount.
- When mounted: `CameraControls` should have `enabled={!walkthroughMode}` to prevent interference

**Tests**:
- Movement vector computation: forward, strafe, diagonal normalization
- Pitch clamping at ±85°
- Speed scaling (walk vs run, delta-time independence)
- Spawn point computation from hall dimensions (near PVC door)
- Camera euler initialization (facing north = -Z)

---

### Section 3: Walkthrough Collision Detection

**Goal**: Prevent camera from walking through walls and placed holes.

**Wall collision** — AABB boundary clamping:
- Camera effective radius: 0.4m (minimum distance from wall centers)
- Clamp position: `x ∈ [margin, hall.width - margin]`, `z ∈ [margin, hall.length - margin]`
- **Door exception**: Compute door zones dynamically from `hall.doors` array using `getDoorZones(hall)` → array of `{ wall, xMin, xMax }` ranges. If camera x is within a door zone on the south wall, allow z to exceed `hall.length` (walk through door). Same logic for any future north/east/west wall doors.
- Outside the hall (z > length + margin or z < -margin): no wall collision — open ground

**Hole collision** — OBB per placed hole:
- Each frame, read placed holes from store
- For each hole: construct `OBBInput` from `{ pos: hole.position, rot: hole.rotation, w: dimensions.width, l: dimensions.length }` (same format as existing `collision.ts`)
- Template holes: resolve dimensions from template definition
- Camera as OBB: `{ pos: cameraXZ, rot: 0, w: 0.8, l: 0.8 }` (0.4m radius → 0.8m square)
- Use `checkOBBCollision(cameraOBB, holeOBB)` for detection
- Resolution: push camera along shortest escape vector

**Utility functions** (`walkthroughCollision.ts`):
- `getDoorZones(hall) → DoorZone[]`: compute passable ranges from hall.doors
- `getWalkthroughSpawnPoint(hall) → {x, y, z}`: position inside hall near PVC entrance door
- `checkWalkthroughCollision(currentPos, desiredPos, holes, hall) → resolvedPos`: combined wall + hole check, returns collision-free position

**Tests**:
- Wall boundary clamping at all 4 edges
- Door zone computation from hall constants (verify PVC door: center=8.1, width=0.9 → [7.65, 8.55]; sectional: center=3.25, width=3.5 → [1.5, 5.0])
- Door exception allows passage through door zones
- Hole collision detection using OBBInput format
- Collision resolution pushes camera out correctly
- Multiple simultaneous collisions (wall + hole) resolved
- Camera outside hall has no wall collision

---

### Section 4: Walkthrough UI & Keyboard Integration

**Goal**: Wire walkthrough toggle to F key and toolbar button. Add walkthrough overlay UI. Handle keyboard mode switching.

**Keyboard changes** (`useKeyboardControls.ts`):
- In 3D viewport, F key toggles walkthrough (call `enterWalkthrough()`/`exitWalkthrough()`)
- During walkthrough, skip ALL other keyboard processing in `useKeyboardControls` (early return if `walkthroughMode === true`). The `WalkthroughController` handles its own key events separately.
- Escape key exits walkthrough: add Escape handler that calls `exitWalkthrough()` when `walkthroughMode` is true

**Walkthrough toolbar button**:
- Add to `CameraPresets.tsx` or separate component — "Walk" button next to camera preset buttons
- Hidden on mobile (walkthrough disabled on mobile)
- Toggle appearance: shows entry icon in orbit, exit icon in walkthrough
- Only visible when 3D pane is shown

**Walkthrough overlay** (`WalkthroughOverlay.tsx`):
- HTML overlay positioned over 3D viewport (sibling to canvas in DualViewport)
- Shows only when `walkthroughMode === true`
- Content:
  - Exit button (top-right): "Exit Walkthrough" or X icon — calls `exitWalkthrough()`
  - Controls hint (bottom-center): "WASD to move | Drag to look | Shift to run | Esc to exit" — auto-fades after 3 seconds using CSS transition
- Styled with Tailwind, dark semi-transparent background for readability
- PointerLock: **DEFERRED** to future enhancement (Escape key conflict, scope creep)

**Tests**:
- F key toggles walkthrough mode in store
- Escape key calls `exitWalkthrough()`
- `useKeyboardControls` skips processing when walkthrough active
- Overlay renders when walkthrough active
- Overlay hidden when walkthrough inactive
- Walk button hidden on mobile

---

### Section 5: Ground Plane + Environment Layer Type

**Goal**: Add textured asphalt ground extending beyond hall. Also add the "environment" layer type/constants (needed by all environment components).

**Environment layer setup** (done first, used by this and subsequent sections):
- Extend `LayerId` type in `types/viewport.ts` with `"environment"`
- Add to `LAYER_DEFINITIONS` in `constants/layers.ts`: `{ id: "environment", label: "Environment", icon: "E" }` (no emoji per project convention)
- Add to `DEFAULT_LAYERS` in `store.ts`: `environment: { visible: true, opacity: 1, locked: false }`
- No store migration needed — layers are part of ephemeral UI state (fresh `DEFAULT_UI` each session)

**Component**: `GroundPlane.tsx`
- `planeGeometry` rotated -π/2 X-axis (flat on XZ plane)
- Size: `(hall.width + 30) × (hall.length + 30)` centered on hall center `(width/2, 0, length/2)`
- Position: Y = -0.01 (slightly below floor to avoid z-fighting with HallFloor)
- Material: `meshStandardMaterial`, roughness 0.9, metalness 0, `receiveShadow`

**Texture sourcing**:
- Download CC0 asphalt texture set (color + normal + roughness) from Poly Haven or ambientCG
- Save to `public/textures/asphalt/{color,normal,roughness}.jpg`
- Use drei `useTexture` with Suspense fallback (flat color while loading)
- Texture repeat: `RepeatWrapping`, repeat = totalSize / 2m tile

**Gating**:
- Viewport: `useViewportId() !== "2d"` — skip in 2D pane
- Layer: `useStore((s) => s.ui.layers.environment).visible`
- GPU tier: low → flat gray `meshBasicMaterial`; mid → color map only; high → color + normal + roughness

**Mount point**: `ThreeDOnlyContent.tsx` — add `<GroundPlane />` gated by environment visibility

**Tests**:
- Ground plane dimensions and position
- Texture repeat calculation
- GPU tier material selection
- Viewport gating (not in 2D)
- Layer visibility toggle hides ground
- Environment layer added to type, constants, defaults

---

### Section 6: Hall Exterior (Walls + Roof + Foundation)

**Goal**: Make hall visible from outside — exterior wall faces, pitched roof, foundation strip.

**Exterior walls** (separate meshes, not DoubleSide):
- Add `HallWallsExterior` group inside `HallWalls.tsx` (or as separate component)
- Duplicate 4 wall box meshes with `side: THREE.BackSide` — renders only exterior faces
- Use same steel texture/material but can apply slightly different roughness for exterior appearance
- Gated by environment layer visibility + viewport (3D only)
- This avoids z-fighting from DoubleSide on thin (0.1m) geometry

**Roof** (`HallRoof.tsx`):
- Two inclined planes meeting at ridge along Z-axis (20m length)
- Ridge height: use `hall.firstHeight` (4.9m) from constants (canonical BORGA value)
- West slope: vertices from (0, wallHeight, 0)→(0, wallHeight, length) along eave, (width/2, firstHeight, 0)→(width/2, firstHeight, length) along ridge
- East slope: mirror of west
- Material: reuse steel texture from walls, slightly darker tint
- Gable ends (north/south): triangular mesh fills from wall top edges to ridge point
- Optional 0.2m eave overhang beyond walls (cosmetic)

**Foundation strip** (`HallFoundation.tsx`):
- Dark gray strip around hall perimeter at ground level
- 4 box geometries: 0.3m wide × 0.15m tall, along each wall
- Material: dark concrete/gray (`meshStandardMaterial`, roughness 0.95, metalness 0)
- Position: Y = -0.075 (half below ground, half above)
- Gated by environment layer + viewport

**Mount point**: All in `ThreeDOnlyContent.tsx`, gated by environment layer

**Tests**:
- Roof uses `hall.firstHeight` as ridge height
- Roof plane count (2 slopes + 2 gable triangles)
- Exterior wall meshes use `BackSide`
- Foundation strip dimensions and positioning
- All gated by environment layer and viewport

---

### Section 7: Sky & Fog

**Goal**: Add gradient sky background (normal mode), preserve dark void (UV mode), configure fog for ground edge fade.

**Sky component** (`SkyEnvironment.tsx`):
- **Normal mode**: drei `<Sky>` component
  - `sunPosition`: computed from existing sun calculator data. Convert altitude/azimuth to Vector3: `new Vector3().setFromSphericalCoords(1, degToRad(90 - altitude), degToRad(azimuth))`
  - `turbidity`: 3, `rayleigh`: 0.5, `distance`: 450000
- **UV mode**: no Sky — existing `<Environment preset="night">` in ThreeDOnlyContent stays unchanged
- Conditional render: `{!uvMode && shouldShowSky(uvMode, gpuTier) && <Sky .../>}`

**Background color**:
- Normal mode: light blue-gray (#b0c4d8) matching sky horizon
- UV mode: existing #07071A
- Set via `<color attach="background" args={[bgColor]} />` in SkyEnvironment

**Fog**:
- **Critical constraint**: Fog is scene-level and bleeds into 2D pane in dual mode. Fog only enabled in `3d-only` viewport layout (including walkthrough which forces 3d-only).
- Normal mode fog: linear `<fog>` with color=#b0c4d8, near=25, far=55
- UV mode fog: existing `fogExp2` with color=#07071A, density=0.04
- In dual mode: NO fog (ground plane simply stops at geometry edge — acceptable visual limitation since users can collapse to 3d-only for full immersion)
- Gating function: `shouldEnableNormalFog(viewportLayout, uvMode, envLayerVisible)`
- Update existing `shouldEnableFog()` to include normal-mode fog path

**Shadow on ground**:
- Existing directional light has `castShadow`, ground has `receiveShadow` — shadows work automatically
- Shadow camera frustum: keep existing size for indoor use. Accept that ground shadows outside hall perimeter may be clipped. This avoids reducing shadow resolution for indoor scenes on mobile.

**Tests**:
- Sky renders in normal mode, hidden in UV mode
- Sun position vector computation from altitude/azimuth
- Fog only in 3d-only layout (NOT dual mode)
- Fog color matches background color per mode
- Background color switches with UV mode
- `shouldEnableNormalFog` returns correct values

---

### Section 8: Camera Enhancements

**Goal**: Add exterior camera preset, ground clamp for orbit mode.

**Camera preset — "Overview"**:
- Add 7th preset to `cameraPresets.ts`: exterior view showing full building + surroundings
- Position: offset from hall center, elevated, looking at hall. Distance: `diagonal * 2.0`
- Keyboard: key 7 triggers overview preset
- Add button to `CameraPresets.tsx` UI

**Ground clamp** (orbit mode):
- Prevent orbit camera from going below ground plane (Y < 0)
- In `DualViewport.tsx`, add `useFrame` hook that clamps `camera.position.y` to `Math.max(camera.position.y, 0.5)` when NOT in walkthrough mode
- Alternative: CameraControls `maxPolarAngle` set to prevent looking from underground

**Tests**:
- Overview preset position shows exterior
- Camera Y never goes below 0.5 in orbit mode
- Ground clamp does NOT interfere with walkthrough (walkthrough Y is locked to 1.7m)

---

### Section 9: Performance, Polish & Edge Cases

**Goal**: Verify all GPU tiers work, polish transitions, handle edge cases.

**Texture loading verification**:
- New textures: asphalt (color + normal + roughness) — ~750KB total compressed
- Verify progressive loading: flat color shown during Suspense, texture swap on load
- Verify error fallback: flat color remains if textures fail

**GPU tier gating verification**:
| Feature | Low | Mid | High |
|---------|-----|-----|------|
| Walkthrough | Yes | Yes | Yes |
| Ground plane | Flat color | Textured (color) | Textured (color+normal+roughness) |
| Hall exterior | BackSide walls | + Roof + foundation | Full |
| Sky | Color background only | Sky component | Sky component |
| Fog (3d-only) | Basic | Standard | Standard |

**Mobile**: Walkthrough button hidden, `enterWalkthrough()` no-ops. All environment components render normally in mobile 3D view.

**Edge cases**:
- Entering walkthrough from 2D-only layout: `enterWalkthrough()` sets layout to 3d-only (works because 2D-only → 3d-only is a valid transition)
- UV mode toggle during walkthrough: Sky appears/disappears, fog switches type, background color changes — all reactive via store selectors
- Window resize during walkthrough: R3F handles camera aspect ratio automatically
- Walkthrough exit restores previous layout (including "dual" or "2d-only")

**Transition polish**:
- Enter walkthrough: smooth animated camera descent from orbit to eye level (~0.5s lerp). Save orbit position, animate position.y from current to 1.7m, position.xz to spawn point.
- Exit walkthrough: reverse animation (~0.5s) back to saved orbit position

**Performance verification**:
- Measure draw call count before/after (target: <15 increase)
- Verify frameloop returns to "demand" after walkthrough exit (no leaked "always")
- Full test suite passes (639+ existing tests + new tests)

**Tests**:
- GPU tier gating for each environment component
- Frameloop correctly returns to previous mode after walkthrough exit
- UV mode toggle during walkthrough doesn't crash
- All 639+ existing tests still pass
- New tests for walkthrough + environment utilities

---

## Implementation Order

1. **Section 1**: Walkthrough state + store (foundation)
2. **Section 2**: Walkthrough camera controller (killer feature core)
3. **Section 3**: Walkthrough collision (complete the experience)
4. **Section 4**: Walkthrough UI + keyboard (make it accessible)
5. **Section 5**: Ground plane + environment layer type (first environment component)
6. **Section 6**: Hall exterior (walls + roof + foundation)
7. **Section 7**: Sky & fog (atmosphere)
8. **Section 8**: Camera enhancements (overview preset, ground clamp)
9. **Section 9**: Performance, polish & edge cases (final verification)

Sections 1-4 form the walkthrough feature (Priority 1).
Sections 5-7 form the environment (Priority 2-4).
Sections 8-9 are integration and polish.

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Click-drag look feels sluggish | Tune sensitivity constant (0.002-0.005 range), add optional smoothing |
| Hole collision causes jitter | Use resolved position (push-out via shortest axis), smooth with lerp |
| Ground z-fighting with floor | Ground at Y=-0.01, floor at Y=0 — sufficient gap |
| Sky looks wrong with UV lamps | Sky only renders in normal mode, hidden in UV |
| Fog bleeds into 2D pane | Fog only in 3d-only layout (including walkthrough) |
| Thin wall z-fighting | Separate BackSide exterior meshes instead of DoubleSide |
| Camera restore race condition | Deferred restoration via rAF after layout transition |
| WASD conflict | WalkthroughController handles its own keys; useKeyboardControls early-returns during walkthrough |
| Mobile walkthrough | Disabled (hidden button, early-return in store action) |

---

## Texture Assets Needed

| Texture | Resolution | Maps | Source |
|---------|-----------|------|--------|
| Asphalt | 512×512 | color + normal + roughness | CC0 (Poly Haven / ambientCG) |
| Steel roof | (reuse existing steel/) | — | Already in `public/textures/steel/` |

Total new texture data: ~750KB compressed. Download and commit as part of Section 5 implementation.

---

## Explicitly Deferred

- **PointerLock mode**: Escape key conflict, mobile issues. Deferred to future polish.
- **Mobile walkthrough**: Touch controls (virtual joystick). Deferred.
- **Environment props**: Parking, landscaping, trees. Zero user value for planning tool. Deferred indefinitely.
- **Dynamic time-of-day sky colors**: Sky color stays static. Deferred.
- **Separate shadow light for environment**: Accept clipped ground shadows. Deferred.
- **Ground texture detail blending**: Address tiling artifacts if visible during walkthrough. Deferred to polish.
