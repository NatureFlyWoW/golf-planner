<!-- PROJECT_CONFIG
runtime: typescript-npm
test_command: npm run test
END_PROJECT_CONFIG -->

<!-- SECTION_MANIFEST
section-01-walkthrough-state
section-02-walkthrough-camera
section-03-walkthrough-collision
section-04-walkthrough-ui
section-05-ground-plane
section-06-hall-exterior
section-07-sky-fog
section-08-camera-enhancements
section-09-performance-polish
END_MANIFEST -->

# Implementation Sections Index — Split 05: 3D Environment

## Dependency Graph

| Section | Depends On | Blocks | Parallelizable |
|---------|------------|--------|----------------|
| section-01-walkthrough-state | - | 02, 03, 04 | Yes (first) |
| section-02-walkthrough-camera | 01 | 04 | Yes (with 03) |
| section-03-walkthrough-collision | 01 | 04 | Yes (with 02) |
| section-04-walkthrough-ui | 01, 02, 03 | 09 | No |
| section-05-ground-plane | - | 07, 09 | Yes (with 01) |
| section-06-hall-exterior | - | 09 | Yes (with 01, 05) |
| section-07-sky-fog | 05 | 09 | Yes (with 04, 06) |
| section-08-camera-enhancements | - | 09 | Yes (with anything) |
| section-09-performance-polish | 01-08 | - | No (final) |

## Execution Order (Batches)

1. **Batch 1** (no dependencies): section-01-walkthrough-state, section-05-ground-plane, section-06-hall-exterior, section-08-camera-enhancements
2. **Batch 2** (after batch 1): section-02-walkthrough-camera, section-03-walkthrough-collision, section-07-sky-fog
3. **Batch 3** (after batch 2): section-04-walkthrough-ui
4. **Batch 4** (final): section-09-performance-polish

## Section Summaries

### section-01-walkthrough-state
Zustand store integration: `walkthroughMode`, `previousViewportLayout`, `enterWalkthrough()`, `exitWalkthrough()` actions. Extends `deriveFrameloop()` with `walkthroughMode` parameter. Mobile gating (disabled). Tests: store state transitions, frameloop derivation, partition exclusion.

### section-02-walkthrough-camera
FPS camera controller: click-drag look system (yaw/pitch with clamping), WASD movement vector computation relative to camera facing, run speed (Shift), delta-time scaling, eye-level height lock (1.7m). Spawn point computation from hall constants (near PVC door). Pure math utilities — no R3F component rendering tests.

### section-03-walkthrough-collision
Wall boundary clamping (hall AABB with margin), door zone exceptions computed from `hall.doors` array, OBB hole collision using existing `checkOBBCollision` pattern. Combined collision resolution: walls first, then holes. Tests: boundary clamping, door pass-through, hole push-out, corner cases.

### section-04-walkthrough-ui
Keyboard integration: F key toggles walkthrough in 3D viewport, Escape exits, WASD suppressed from 2D pan during walkthrough, camera presets (1-6) disabled during walkthrough. WalkthroughOverlay component: exit button, controls hint, crosshair. Pointer event attachment to pane div (not canvas). Deferred camera restoration via rAF on exit.

### section-05-ground-plane
Environment layer type added to `LayerId`, `LAYER_DEFINITIONS`, `DEFAULT_LAYERS`. Textured asphalt ground plane: `(hall.width + 30) × (hall.length + 30)`, Y=-0.01, repeating CC0 texture. GPU-tier gated: flat color on low, textured on mid+. `shouldShowGroundTexture()` utility.

### section-06-hall-exterior
Pitched roof geometry: two slope planes + two gable triangles, ridge at `hall.firstHeight` (4.9m). Foundation strip: 0.15m height, 0.3m width, perimeter placement. Separate exterior wall meshes with `side: BackSide` (avoids z-fighting on 0.1m walls). Mounted in ThreeDOnlyContent, gated by environment layer.

### section-07-sky-fog
drei `<Sky>` component in normal mode, existing dark `<Environment>` in UV mode. Sun position from existing calculator (altitude/azimuth → Vector3). Normal-mode linear fog (near=30, far=60) — only in 3d-only layout (bleeds into 2D pane otherwise). `shouldShowSky()`, `shouldEnableNormalFog()` utilities. Background color matching fog.

### section-08-camera-enhancements
"Overview" camera preset (7th preset): position outside hall perimeter, target at hall center. Ground clamp preventing orbit camera below Y=0. Extend `getCameraPresets()` to return 7 presets.

### section-09-performance-polish
Full regression suite (639+ existing tests). Verify walkthrough exit restores previous layout. Verify frameloop returns "demand" after exit. Cross-reference GPU tier gating across all environment components. Mobile walkthrough disabled confirmation. Integration smoke tests.
