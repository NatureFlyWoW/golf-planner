# Section 05 Code Review Interview — Auto-resolved

User is away (brunch). All items resolved autonomously.

## Critical Issues — Fixed

### 1. Old CameraControls.tsx not deleted
**Decision:** Auto-fix — `git rm` the file. No imports remain.

### 2. Double-tap-to-reset dropped
**Decision:** Auto-fix — Created `useDoubleTapReset` hook in DualViewport. Attaches to pane divs (pane2DRef, pane3DRef). 2D resets to centered ortho, 3D resets to isometric preset via setLookAt.

### 3. Missing onChange={() => invalidate()} on OrbitControls
**Decision:** Let go — drei OrbitControls auto-invalidates on change when used inside a View. The old explicit callback was redundant. drei source confirms: it calls `invalidate()` internally on every 'change' event. No fix needed.

## Warnings — Fixed

### 4. SoftShadows conditional mount
**Decision:** Let go — gpuTier is set once on load (via GPU detection), never changes at runtime. PerformanceMonitor adjusts quality settings, not the tier enum. Existing pattern is safe. Will revisit in section-12 polish if needed.

### 5. CAMERA_TRANSITION_DURATION / PERSPECTIVE_FOV unused
**Decision:** Auto-fix — Removed `CAMERA_TRANSITION_DURATION` (camera-controls lib uses its own default). Used `PERSPECTIVE_FOV` constant in DualViewport instead of hardcoded `60`.

### 6. Bounding box computation duplicated
**Decision:** Auto-fix — Extracted `getHolesBoundingBox()` helper function in useKeyboardControls.ts. Used by both 2D and 3D 'F' key handlers.

### 7. Preset keys 1-6 fall-through in 2D mode
**Decision:** Let go — keys silently fall through with no effect. Adding explicit consume would be premature defensive coding.

### 8. activeViewport null on page load
**Decision:** Auto-fix — Added `resolveViewport()` helper that infers viewport from layout in single-pane modes (`2d-only` → "2d", `3d-only` → "3d"). Dual mode still requires hover.

## Nitpicks — Let go
- #9 (LEFT: undefined) — fine
- #10 (ThreeCanvas.tsx orphan) — cleaned in section-10
- #11 (test count) — all scenarios covered
- #12 (no keyboard routing tests) — plan said optional
