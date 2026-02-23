# Section 08 — Code Review Interview Transcript

## Review Source
- Diff: `section-08-diff.md`
- Review: `section-08-review.md`

## Triage Summary

| # | Finding | Severity | Action |
|---|---------|----------|--------|
| M1 | GroundClamp mutates camera.position.y directly, fights CameraControls | MEDIUM | Auto-fix |
| L1 | Stale comment "1-6" should be "1-7" | LOW | Auto-fix |

## Auto-Fixes Applied

### M1: GroundClamp fights CameraControls (MEDIUM)

**Problem:** The original `GroundClamp` used `useFrame` to set `camera.position.y = clamped` every frame. CameraControls (camera-controls library) maintains its own internal spherical coordinate state and writes to camera.position each frame — direct mutation causes jitter and gets overwritten.

**Fix:** Rewrote `GroundClamp.tsx` to use CameraControls' built-in `maxPolarAngle` constraint:
- `maxPolarAngle = Math.PI / 2 - 0.05` in orbit mode (prevents looking below horizon)
- `maxPolarAngle = Math.PI` in walkthrough mode (full freedom)
- Uses `useEffect` instead of `useFrame` (no per-frame cost)
- Accesses controls via `useThree((s) => s.controls)` (drei makes CameraControls the default)

The pure utility `groundClamp.ts` (`clampCameraY`) is retained for potential future use but no longer called by the component.

### L1: Stale comment "1-6" (LOW)

**Problem:** Comment in `useKeyboardControls.ts` line 159 still said "Camera preset keys (1-6)" after adding key 7.

**Fix:** Updated to "Camera preset keys (1-7)".

## Verification

All 775 tests pass after fixes.
