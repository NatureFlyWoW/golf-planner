# Section 03 Code Review: Walkthrough Collision Detection

## Critical Issues

### 1. HIGH: Hole push-out can eject camera through walls
Wall clamping runs Step 1, hole push-out Step 2. A hole near a wall can push camera outside the hall boundary with no re-clamping.

### 2. MEDIUM: `_currentPos` parameter is unused
Accepted but never used. Dead weight in public API.

### 3. MEDIUM: `halfExtents` array declared but never used
Dead code, 6 lines of allocation per collision check.

### 4. MEDIUM: X-axis clamping applied even when camera is outside hall through door
Plan specifies open-ground freedom when far outside. Only z-axis gets door exception, x stays clamped.

## Low Issues

### 5. `getWalkthroughSpawnPoint` / `EYE_LEVEL` not in this file
Already exists in walkthroughCamera.ts from section 02 — plan duplication, not a real gap.

### 6. North wall door zones never checked
Only south wall has doors currently; cosmetic.

## Test Gaps
- No test for post-hole-push wall validity
- No test for re-entry through door (outside -> inside)
- Rotated hole push direction not validated

## What Looks Good
- MTV math core is correctly implemented
- Door zone computation is correct
- SAT reuse from existing collision.ts is clean
- 24 tests with good coverage of wall clamping and hole scenarios
