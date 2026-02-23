# Section 07: Sky & Fog — Code Review Interview Transcript

## Review Summary
- 2 HIGH, 3 MEDIUM, 3 LOW, 2 INFO findings
- All HIGH and MEDIUM issues addressed via auto-fix

## Triage Decisions

### AUTO-FIX (Applied)

**HIGH: sunAltAzToVector3 X-axis sign wrong**
- `x = cosAlt * Math.sin(azimuth)` gives positive X for west azimuth, but scene convention is X+=east
- Existing `getSunDirection()` and `SharedScene.tsx` both use `x = -Math.sin(azimuth)`
- Fix: Negated X component to `-cosAlt * Math.sin(azimuth)`
- Added 3 new directional tests (azimuth=PI/2 west, -PI/2 east, PI north) to catch sign issues

**HIGH: scene.background bleeds into 2D pane in dual mode**
- `<color attach="background">` sets `scene.background` which is scene-global (same problem as fog)
- In dual-viewport mode, both Views share the scene, so blue-gray background would show in 2D pane
- Fix: Added `viewportLayout` selector to SkyEnvironment, only render `<color>` when `viewportLayout === "3d-only"`

**MEDIUM: Missing test coverage for non-zero azimuth**
- All original tests used azimuth=0, making sin(0)=0 and the sign bug invisible
- Fix: Added 3 tests with PI/2, -PI/2, PI azimuth values

### LET GO (Acceptable)

**MEDIUM: FogController cleanup race between normal fog and UV fog**
- Theoretically, both `<fog>` and `<fogExp2>` use `attach="fog"` and R3F reconciler order isn't guaranteed during mode switch
- Acceptable: conditions are mutually exclusive (`uvMode` determines which), so both can't be active simultaneously in the same render. R3F batches state updates, so unmount+mount happens in one commit. Observed behavior is correct.

**MEDIUM: Background not gated by envLayerVisible**
- When env layer hidden, sky dome disappears but background color persists
- Acceptable: background color is a reasonable neutral default even when env layer is off. A completely black/missing background would be worse UX than a blue-gray one.

**LOW: Duplicate envLayerVisible selectors in SkyEnvironment and ThreeDOnlyContent**
- Both components independently read `s.ui.layers.environment?.visible`
- Acceptable: Zustand selectors are cheap; keeping components self-contained is cleaner than prop drilling

**LOW: Magic numbers for fog distances (25, 55)**
- Not extracted to named constants
- Acceptable: values are used once, documented contextually (near=25 starts past 20m hall, far=55 full fade)

**LOW: shouldShowGroundTexture already existed**
- Plan noted to verify; implementation correctly skipped adding it. No issue.

## Test Results
- 769 tests pass after fixes (16 in skyEnvironment.test.ts)
- 3 new directional azimuth tests added for sign validation
