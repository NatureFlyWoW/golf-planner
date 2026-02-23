# Section 03 Code Review Interview

## Triage Summary

| # | Finding | Severity | Action |
|---|---------|----------|--------|
| 1 | Hole push-out can eject camera through walls | HIGH | Auto-fix: added wall re-clamping after hole push-out |
| 2 | `_currentPos` parameter unused | MEDIUM | Auto-fix: removed parameter |
| 3 | `halfExtents` array unused | MEDIUM | Auto-fix: removed dead code |
| 4 | X-axis clamping when outside hall | MEDIUM | Auto-fix: only skip clamping when in door zone AND far outside |
| 5 | `getWalkthroughSpawnPoint` not in this file | LOW | Let go: already exists in walkthroughCamera.ts from section 02 |
| 6 | North wall door zones not checked | LOW | Let go: no north doors exist |

## Auto-Fixes Applied

### 1. Wall re-clamping after hole push-out
Added `resolved = clampToWalls(resolved, hall, doorZones)` as Step 3 after hole collision loop. Prevents holes near walls from ejecting camera outside the hall.

### 2. Removed `_currentPos` parameter
Changed `checkWalkthroughCollision` signature from 4 params to 3. Updated all test calls.

### 3. Removed unused `halfExtents` array
Deleted the `halfExtents` array from `resolveHoleCollision` — was dead code never referenced.

### 4. Fixed outside-hall check
Changed `isOutsideHall` to inline check that requires BOTH `z > hall.length + CAMERA_RADIUS` AND `isInDoorZone(x, doorZones, "south")`. Camera at x=5.5 z=20.5 (not in door zone) is now correctly clamped.

### 5. Simplified camHalfOnAxis computation
Simplified from `Math.abs(CAMERA_RADIUS * (axis[0] * 1 + axis[1] * 0)) + Math.abs(CAMERA_RADIUS * (axis[0] * 0 + axis[1] * 1))` to `Math.abs(CAMERA_RADIUS * axis[0]) + Math.abs(CAMERA_RADIUS * axis[1])`.
