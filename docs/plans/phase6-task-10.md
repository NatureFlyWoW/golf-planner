# Phase 6 — Task 10: Visual Review, Lint, Test, Final Commit

**Depends on:** All of Tasks 3-9 being complete

## Step 1: Verify all types are wired in HoleModel

Open `src/components/three/holes/HoleModel.tsx` and verify it has cases for all 7 types:
- `straight` → `HoleStraight`
- `l-shape` → `HoleLShape`
- `dogleg` → `HoleDogleg`
- `ramp` → `HoleRamp`
- `loop` → `HoleLoop`
- `windmill` → `HoleWindmill`
- `tunnel` → `HoleTunnel`

The fallback box should still exist for safety but should never be reached.

## Step 2: Run full test suite

```bash
cd /mnt/c/Users/Caus/Golf_Plan/golf-planner
export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)"
npm run test
```

Expected: All existing tests pass (66+). No new tests needed — this is a visual-only change with no logic to unit test.

## Step 3: Run lint and type check

```bash
npm run check && npx tsc --noEmit
```

Expected: Clean. Fix any issues.

## Step 4: Run production build

```bash
npm run build
```

Expected: Build passes. Note the bundle size — it will be slightly larger due to additional components, but should not increase dramatically (these are small components with no new dependencies).

## Step 5: Visual verification — Top-down view

Run: `npm run dev`

Place one of each hole type (all 7). In top-down view, verify:
- Each hole type is visually distinguishable from the others
- Green felt surfaces are visible
- White bumper outlines visible
- Tee markers (yellow dots) and cups (black dots) visible
- The layout is readable — you can tell what type each hole is

**If any type looks confusing from above**, note it but don't fix now — this is expected per the design review. We can add LOD or top-down simplification in a future phase.

## Step 6: Visual verification — 3D view

Toggle to 3D view (the view toggle button in toolbar). Verify:
- All 7 types have distinct, recognizable geometry
- Straight: flat green lane with white bumpers
- L-Shape: visible 90-degree turn
- Dogleg: wider lane with guide bumpers suggesting S-curve
- Ramp: visible uphill slope → plateau → downhill slope (purple)
- Loop: vertical cyan arch with support pillars
- Windmill: gray pillar with 4 pink blades
- Tunnel: dark gray half-cylinder arch over the middle section

## Step 7: Interaction verification

Test all interaction states with 3D models:
- **Select**: Click a hole → amber overlay appears, orange selection outline
- **Drag**: Select then drag → yellow overlay, hole moves with cursor
- **Rotate**: Select → rotation handle appears around the hole, drag handle to rotate
- **Delete**: Switch to delete tool, hover over hole → red overlay. Click to delete.
- **Placement**: Select a hole type from the library, move cursor → ghost box follows. Click to place.

**Known:** GhostHole still shows a simple transparent box. This is intentional.

## Step 8: Mobile check

Open dev tools, toggle mobile viewport (375×667). Verify:
- Holes render correctly at mobile resolution
- Touch interactions still work (tap to select, drag to move)
- Performance is acceptable (no visible lag with 10+ holes)

## Step 9: Fix any issues found

If visual verification reveals problems:
- Geometry misaligned → adjust position/rotation values in the specific HoleType component
- Material issues → check shared.ts constants
- Interaction broken → check MiniGolfHole.tsx overlay mesh logic
- Performance → check for unnecessary re-renders or excessive geometry

## Step 10: Update session handoff

Update `docs/session-handoff.md` with Phase 6 completion status.

## Step 11: Final commit (if any fixes were made)

```bash
npm run check
git add -A
git commit -m "fix(phase6): visual adjustments from review"
```

## Step 12: Push to GitHub

```bash
git push origin master
```
