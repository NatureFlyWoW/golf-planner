# Split 05: 3D Environment — Usage Guide

## Quick Start

All features from Split 05 are integrated into the existing Golf Planner app. Run:

```bash
npm run dev
```

## New Features

### Walkthrough Mode (Sections 01-04)

Press **F** in the 3D viewport to enter first-person walkthrough mode. Navigate with:
- **WASD** / Arrow keys: Move forward/backward/left/right
- **Shift**: Sprint (2x speed)
- **Click + drag**: Look around
- **Escape** or **F**: Exit walkthrough

The camera spawns at the hall door (south wall center, Y=1.7m) facing north. Collision detection prevents walking through walls and placed holes. Door zones allow passage through doorways.

Desktop only — hidden on mobile.

### 3D Environment (Sections 05-08)

- **Ground Plane**: Textured asphalt/concrete ground extending beyond the hall (mid+ GPU). Low GPU: flat gray.
- **Hall Exterior**: Roof, foundation, and exterior walls visible from outside. GPU-tiered materials (flat → textured → full PBR).
- **Sky & Fog**: drei `<Sky>` component with sun position driven by `sunDate` store. Linear fog for ground edge fade (3D-only mode). UV mode retains existing fogExp2.
- **Overview Camera**: Press **7** or click "Overview" button for a wide exterior view of the full hall.
- **Ground Clamp**: Orbit camera cannot go below horizon in non-walkthrough mode (`maxPolarAngle` constraint).

### Environment Layer

A new `"environment"` layer (6th layer) controls visibility of ground plane, roof, foundation, and exterior walls together. Toggle via the Layers panel.

## Key Architecture Decisions

- **Scene-global state gating**: `scene.background`, `scene.fog` are scene-global — gated by `viewportLayout === "3d-only"` to prevent bleeding into 2D pane in dual mode.
- **GPU tier gating**: All environment components respect `gpuTier` (low/mid/high) for progressive material quality.
- **Module-level material singletons**: Flat materials created once at module level, not per-render.
- **Texture disposal**: Cloned textures tracked in arrays and disposed in `useEffect` cleanups.
- **CameraControls integration**: Ground clamp uses `maxPolarAngle` (not direct position mutation) to avoid fighting with camera-controls internal state.
- **Collision caching**: Hole OBBs and door zones computed once on walkthrough mount, not per frame.

## API Reference (Key Exports)

### Store Actions
- `enterWalkthrough()` — Enter walkthrough mode (sets 3D-only, saves previous layout)
- `exitWalkthrough()` — Exit walkthrough (restores layout via deferred rAF)

### Utility Functions
- `getWalkthroughSpawnPoint(hall)` — Returns spawn {x, y, z} at south door
- `computeMovementVector(keyState, yaw, delta)` — WASD movement calculation
- `checkWalkthroughCollision(pos, holeOBBs, hall)` — Wall + hole collision resolver
- `shouldShowSky(uvMode, gpuTier)` — Sky rendering gating
- `shouldEnableNormalFog(layout, uvMode, envVisible)` — Normal-mode fog gating
- `shouldShowGroundTexture(gpuTier)` — Ground texture gating
- `sunAltAzToVector3(altitude, azimuth)` — Sun position conversion for drei Sky
- `getCameraPresets(width, length)` — Returns 7 camera presets (now includes "overview")
- `clampCameraY(y, walkthroughMode)` — Y-clamp utility (retained, not used by component)

### Components
- `WalkthroughController` — FPS camera with WASD, pointer look, collision, enter transition
- `WalkthroughOverlay` — Crosshair + instruction HUD during walkthrough
- `GroundPlane` — Textured ground plane with GPU tier branching
- `HallRoof` — Dual-slope roof geometry with GPU tier materials
- `HallFoundation` — Foundation slab below hall
- `HallWallsExterior` — Exterior-facing wall meshes (BackSide)
- `SkyEnvironment` — drei Sky + sun position + background color
- `GroundClamp` — CameraControls maxPolarAngle constraint

## Test Coverage

785 tests across 68 test files. Key test files for Split 05:
- `tests/store/walkthrough.test.ts` (21 tests)
- `tests/utils/walkthroughCamera.test.ts` (25 tests)
- `tests/utils/walkthroughCollision.test.ts` (27 tests)
- `tests/hooks/walkthroughKeyboard.test.ts` (11 tests)
- `tests/utils/skyEnvironment.test.ts` (16 tests)
- `tests/utils/environment.test.ts` (35 tests)
- `tests/components/three/groundPlane.test.ts` (11 tests)
- `tests/components/three/hallEnvironment.test.ts` (15 tests)
- `tests/components/three/hallExterior.test.ts` (16 tests)
- `tests/utils/cameraPresets.test.ts` (13 tests)
- `tests/utils/groundClamp.test.ts` (3 tests)
