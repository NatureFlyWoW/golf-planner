# TDD Plan: Split 05 — 3D Environment

Testing framework: **Vitest** (existing project setup, 639 tests in 59 files).
Test location: `tests/` directory mirroring `src/` structure.
Patterns: Pure function unit tests, Zustand store tests via `useStore.getState()`, no R3F component rendering tests (test utilities/gating functions instead).

---

## Section 1: Walkthrough State & Store Integration

**Test file**: `tests/store/walkthrough.test.ts`

- Test: `enterWalkthrough` sets `walkthroughMode: true`
- Test: `enterWalkthrough` saves current `viewportLayout` to `previousViewportLayout`
- Test: `enterWalkthrough` sets `viewportLayout` to `"3d-only"`
- Test: `enterWalkthrough` from `"dual"` layout saves `"dual"` as previous
- Test: `enterWalkthrough` from `"2d-only"` layout saves `"2d-only"` as previous
- Test: `enterWalkthrough` no-ops when `isMobile()` returns true (mock isMobile)
- Test: `exitWalkthrough` sets `walkthroughMode: false`
- Test: `exitWalkthrough` restores `viewportLayout` from `previousViewportLayout`
- Test: `exitWalkthrough` clears `previousViewportLayout` to null
- Test: walkthrough state fields not in persisted partition (check partialize output)

**Test file**: `tests/utils/environmentGating.test.ts` (extend existing)

- Test: `deriveFrameloop` returns `"always"` when `walkthroughMode=true`, regardless of other params
- Test: `deriveFrameloop` with `walkthroughMode=false` preserves existing behavior (UV, dual, etc.)
- Test: `deriveFrameloop` with `walkthroughMode=true, uvMode=false, gpuTier="low"` still returns `"always"`

---

## Section 2: Walkthrough Camera Controller

**Test file**: `tests/utils/walkthroughCamera.test.ts`

Movement vector computation (pure math, no R3F):
- Test: forward key produces movement in -Z direction (relative to 0° yaw)
- Test: backward key produces movement in +Z direction
- Test: left strafe produces movement in -X direction (relative to 0° yaw)
- Test: right strafe produces movement in +X direction
- Test: diagonal movement (forward + left) normalizes to unit length × speed
- Test: movement scales with delta time (0.016s vs 0.032s = double distance)
- Test: walk speed is 2.0 m/s, run speed is 4.0 m/s
- Test: Y component of movement is always 0 (locked to eye level)

Look system (pure math):
- Test: pitch clamps at +85° (looking nearly straight up)
- Test: pitch clamps at -85° (looking nearly straight down)
- Test: yaw wraps correctly (no discontinuity at ±π)
- Test: euler order is 'YXZ'

Spawn point:
- Test: `getWalkthroughSpawnPoint(hall)` returns position near PVC door (x≈8.1, y=1.7, z≈19.5)
- Test: spawn point Y is 1.7m (eye level)
- Test: spawn point is inside hall boundaries

---

## Section 3: Walkthrough Collision Detection

**Test file**: `tests/utils/walkthroughCollision.test.ts`

Door zone computation:
- Test: `getDoorZones(hall)` returns zones for PVC door: x=[7.65, 8.55] on south wall
- Test: `getDoorZones(hall)` returns zones for sectional door: x=[1.5, 5.0] on south wall
- Test: door zones computed from `hall.doors` (offset ± width/2)

Wall collision:
- Test: position inside hall (5, 10) returns unchanged
- Test: position at north wall edge (5, 0.1) clamps to (5, margin)
- Test: position at south wall edge (5, 19.9) clamps to (5, hall.length - margin)
- Test: position at west wall edge (0.1, 10) clamps to (margin, 10)
- Test: position at east wall edge (9.9, 10) clamps to (hall.width - margin, 10)
- Test: position outside hall through PVC door zone (8.1, 20.5) is NOT clamped (door exception)
- Test: position outside hall NOT through door zone (5.5, 20.5) IS clamped to south wall
- Test: position far outside hall (8.1, 25) is unconstrained (open ground)

Hole collision:
- Test: camera position not overlapping any hole returns unchanged
- Test: camera position overlapping a hole pushes out along shortest axis
- Test: camera near hole edge but not overlapping returns unchanged
- Test: rotated hole collision works correctly (uses OBBInput format)
- Test: multiple holes — only colliding hole causes push-out

Combined:
- Test: `checkWalkthroughCollision` applies wall clamping before hole collision
- Test: `checkWalkthroughCollision` handles camera at hall corner (two walls)
- Test: `checkWalkthroughCollision` with no holes returns wall-clamped position

---

## Section 4: Walkthrough UI & Keyboard Integration

**Test file**: `tests/hooks/walkthroughKeyboard.test.ts`

- Test: F key in 3D viewport calls `enterWalkthrough()` when not in walkthrough
- Test: F key in 3D viewport calls `exitWalkthrough()` when in walkthrough
- Test: Escape key calls `exitWalkthrough()` when in walkthrough
- Test: Escape key does nothing when not in walkthrough
- Test: camera preset keys (1-6) suppressed during walkthrough
- Test: F key in 2D viewport does NOT trigger walkthrough (still does "fit all holes")

**Test file**: `tests/components/ui/walkthroughOverlay.test.ts` (optional — UI tests)

- Test: overlay visible when `walkthroughMode === true`
- Test: overlay hidden when `walkthroughMode === false`
- Test: exit button calls `exitWalkthrough()`

---

## Section 5: Ground Plane + Environment Layer Type

**Test file**: `tests/constants/layers.test.ts` (new or extend existing)

- Test: `LAYER_DEFINITIONS` includes "environment" layer
- Test: `DEFAULT_LAYERS` has environment entry with visible=true, opacity=1, locked=false
- Test: `LayerId` type includes "environment" (compile-time check)

**Test file**: `tests/components/three/groundPlane.test.ts`

- Test: ground plane size = (hall.width + 30) × (hall.length + 30)
- Test: ground plane Y position = -0.01
- Test: ground plane centered on hall center
- Test: texture repeat calculation: totalWidth / tileSize, totalLength / tileSize

**Test file**: `tests/utils/environmentGating.test.ts` (extend)

- Test: `shouldShowGroundTexture("low")` returns false
- Test: `shouldShowGroundTexture("mid")` returns true
- Test: `shouldShowGroundTexture("high")` returns true

---

## Section 6: Hall Exterior

**Test file**: `tests/components/three/hallExterior.test.ts`

Roof geometry:
- Test: roof ridge height = `hall.firstHeight` (4.9m)
- Test: roof has 2 slope planes + 2 gable triangles (4 mesh children)
- Test: west slope spans from (0, wallHeight) to (width/2, firstHeight)
- Test: east slope spans from (width, wallHeight) to (width/2, firstHeight)

Foundation:
- Test: foundation strip height = 0.15m
- Test: foundation strip width = 0.3m
- Test: foundation Y position = -0.075
- Test: 4 foundation strips (one per wall side)

Exterior walls:
- Test: exterior wall meshes use `THREE.BackSide` material side

---

## Section 7: Sky & Fog

**Test file**: `tests/utils/skyEnvironment.test.ts`

- Test: `shouldShowSky(uvMode=false, gpuTier="mid")` returns true
- Test: `shouldShowSky(uvMode=true, gpuTier="high")` returns false (UV = no sky)
- Test: `shouldShowSky(uvMode=false, gpuTier="low")` returns false (low tier = no sky)

Sun position conversion:
- Test: altitude=45°, azimuth=180° produces correct Vector3 (south, 45° elevation)
- Test: altitude=0° produces vector on horizon (y≈0)
- Test: altitude=90° produces vector at zenith (y=1)

Fog gating:
- Test: `shouldEnableNormalFog("3d-only", false, true)` returns true
- Test: `shouldEnableNormalFog("dual", false, true)` returns false (no fog in dual)
- Test: `shouldEnableNormalFog("3d-only", true, true)` returns false (UV mode uses existing fogExp2)
- Test: `shouldEnableNormalFog("3d-only", false, false)` returns false (env layer hidden)

---

## Section 8: Camera Enhancements

**Test file**: `tests/utils/cameraPresets.test.ts` (extend existing)

- Test: `getCameraPresets` returns 7 presets (was 6, now includes "overview")
- Test: overview preset position is outside hall perimeter
- Test: overview preset target is hall center

---

## Section 9: Performance & Polish

- Test: all 639+ existing tests still pass (regression)
- Test: `deriveFrameloop` returns "demand" after `exitWalkthrough()` (no leaked "always")
- Test: `enterWalkthrough` from "2d-only" layout sets "3d-only"
- Test: `exitWalkthrough` from stored "2d-only" restores "2d-only"
- Test: environment components respect GPU tier gating (cross-reference gating functions)
