# Phase 7 — Task 8: Lint, Test, Build, Visual Review

**Depends on:** All of Tasks 3-7 being complete

## Step 1: Run full test suite

```bash
cd /mnt/c/Users/Caus/Golf_Plan/golf-planner
export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)"
npm run test
```

Expected: All existing tests pass (66+). No new tests needed for this phase — the changes are visual-only color/material swaps with no testable logic.

## Step 2: Run lint and type check

```bash
npm run check && npx tsc --noEmit
```

Expected: Clean. Fix any issues.

## Step 3: Run production build

```bash
npm run build
```

Expected: Build passes. Bundle size should increase minimally (a few KB for UV material constants). Note the bundle size.

## Step 4: Visual verification — Planning mode

Run: `npm run dev`

Open in browser. Verify everything still looks exactly the same as before (no UV-mode-related regressions in planning mode):
- Hall floor: light gray
- Walls: gray
- All 7 hole types: green felt, white bumpers, yellow tee, black cup
- Grid: visible light gray lines
- Flow path: white dashed line
- Sun indicator: orange arrow (when sun controls active)

## Step 5: Visual verification — UV toggle

Click the "UV" button in the toolbar. Verify:

### Canvas:
- Hall floor: near-black (`#0A0A1A`)
- Hall walls: dark indigo (`#1A1A2E`)
- Lighting: dim purple ambient, purple-tinted directional
- Grid: very faint purple lines (still visible)
- Sun indicator: hidden

### Hole models (place at least 3 different types):
- **Felt surfaces**: neon green glow
- **Bumpers**: neon cyan glow
- **Tee markers**: neon yellow glow
- **Cups**: neon orange glow
- **Ramp slopes/plateau**: neon magenta glow
- **Loop arch/pillars**: neon cyan glow
- **Windmill pillar/blades**: neon pink glow
- **Tunnel arch**: neon purple glow

### Toolbar:
- Background: dark (`bg-gray-900`)
- Active buttons: purple
- Inactive buttons: dark gray with light text
- UV button itself: purple when active

### Flow path:
- Neon cyan dashed line
- Number labels: neon cyan text

### Ghost hole (switch to Place mode):
- Green ghost: neon green instead of standard green
- Red ghost (when colliding): neon red

## Step 6: Visual verification — 3D view + UV mode

Toggle to 3D view while in UV mode. Verify:
- Emissive materials visible from perspective angle
- Holes look like they're glowing under blacklight
- Selection outline still visible (orange wireframe on dark background)

## Step 7: Toggle back to Planning mode

Click UV button again. Verify:
- All colors revert to normal planning mode
- No visual artifacts or stuck colors
- Grid returns to normal visibility
- Sun indicator reappears (if sun controls were active)

## Step 8: Mobile toolbar check

Open dev tools, toggle mobile viewport (375×667). Verify:
- Bottom toolbar styling changes in UV mode
- UV toggle available in overflow menu (tap "..." → UV)
- All overflow buttons get dark styling in UV mode

## Step 9: Fix any issues found

If visual verification reveals problems:
- Color wrong → check the hex values in the specific component
- Emissive not visible → check `emissiveIntensity` value
- Material not switching → verify `useMaterials()` hook is called, check `uvMode` subscription
- Toolbar class not switching → check ternary logic
- Canvas not re-rendering → `frameloop="demand"` may need explicit invalidation (check if Zustand→React→R3F path works)

## Step 10: Update session handoff

Update `docs/session-handoff.md` with Phase 7 completion status.

## Step 11: Final commit (if any fixes were made)

```bash
npm run check
git add -A
git commit -m "fix(phase7): visual adjustments from review"
```

## Step 12: Push to GitHub

```bash
git push origin master
```
