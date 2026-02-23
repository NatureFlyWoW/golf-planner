# Section 09 Code Review

## Critical Issues

### 1. OBB construction ignores template holes (HIGH)
WalkthroughController only uses `HOLE_TYPE_MAP[hole.type].dimensions` — template holes with custom dimensions via `computeTemplateBounds()` get wrong collision bounds. The existing `buildOBBMap` in `PlacementHandler.tsx` correctly handles this by checking `hole.templateId`.

### 2. OBBs rebuilt every frame — GC pressure (MEDIUM)
Inside `useFrame`, builds fresh `holeOBBs` array every frame. Hole layout is static during walkthrough — should compute once on mount and store in ref.

### 3. `getDoorZones()` called every frame (LOW-MEDIUM)
`checkWalkthroughCollision` calls `getDoorZones(hall)` each frame. Hall doors are static.

## Plan Compliance

### 4. Missing `deriveFrameloop` cross-check in lifecycle tests
Plan specifies calling `deriveFrameloop` inside walkthrough lifecycle tests to verify round-trip frameloop behavior. Tests only check store state.

## Minor

### 7. `ENTER_DURATION` should be module-level constant
### 10. RAF stubbing pattern duplicated in section 09 tests
