# Section 02 Code Review Interview: Walkthrough Camera Controller

## Triage Summary

| # | Finding | Severity | Action |
|---|---------|----------|--------|
| 1 | Camera restore on unmount missing | HIGH | Auto-fix |
| 2 | Unused imports (Vector3, HALL) | LOW | Auto-fix |
| 3 | Missing barrel export index.ts | MEDIUM | Auto-fix |
| 4 | Key state not reset on unmount | MEDIUM | Auto-fix |
| 5 | No zero-movement optimization in useFrame | LOW | Let go |
| 6 | Test gaps (zero-input, non-zero yaw, fallback spawn) | MEDIUM | Auto-fix |

## Auto-Fixes Applied

### 1. Camera restore on unmount (CRITICAL)
Added `savedCameraRef` that captures camera position + quaternion on mount.
Cleanup function in the mount useEffect restores camera to saved pose.

### 2. Removed unused imports
Removed `Vector3` from three import and `HALL` constant import — neither used in component.

### 3. Created barrel export
Created `src/components/three/environment/index.ts` exporting WalkthroughController.
Updated DualViewport.tsx import to use barrel: `from "../three/environment"`.

### 4. Key state + drag state reset on unmount
Added cleanup to keyboard useEffect that resets all keyStateRef fields to false
and isDraggingRef to false on unmount.

### 5. Added 3 missing tests
- `computeMovementVector` — zero-input returns zero movement (uses toBeCloseTo for -0)
- `computeMovementVector` — non-zero yaw (90°) rotates movement direction
- `getWalkthroughSpawnPoint` — falls back to hall center X when no PVC door exists

Total tests: 17 → 20

## Items Let Go

### 5. Zero-movement optimization in useFrame
The review suggested skipping quaternion/position updates when no keys are pressed.
This adds complexity for negligible gain — useFrame already runs every frame for the
quaternion sync (needed for mouse look), and the position addition of (0,0,0) is
essentially free. Not worth the conditional branching.
