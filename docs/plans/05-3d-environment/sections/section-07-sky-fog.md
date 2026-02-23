Now I have all the context I need. Let me write the complete section.

# Section 7: Sky & Fog

## Overview

This section adds visual atmosphere to the 3D environment: a gradient sky behind the hall in normal mode, correctly switching to the existing dark void in UV mode, and scene-level fog that fades the ground plane edges — but only when the layout is 3d-only, to prevent fog bleeding into the 2D pane.

**Dependencies**: Section 5 (ground plane + environment layer type) must be complete before this section, because `SkyEnvironment` reads `layers.environment.visible` and the `LayerId` type must already include `"environment"`.

**User-visible result**: When the user switches to 3D-only view in normal mode, they see a realistic blue sky behind the steel hall exterior with ground fog fading into the horizon. In UV mode, the existing dark night environment is unchanged.

---

## Background Context

### Scene-Level Fog Constraint

Fog in Three.js (`scene.fog`) is scene-global, not per-object or per-View. In dual-viewport mode, both the 2D pane and 3D pane share the same Three.js scene via `@react-three/drei`'s `View`. Adding fog in dual mode makes it bleed into the 2D floor plan — the architectural lines become hazy. Therefore:

- **Normal-mode fog**: only when `viewportLayout === "3d-only"`
- **UV-mode fog (fogExp2)**: already gated by `shouldEnableFog()` in `ThreeDOnlyContent.tsx`, which also only allows "3d-only"
- In dual mode, the ground plane simply has a hard visual edge — this is an acceptable limitation

### Existing Pattern

`ThreeDOnlyContent.tsx` already handles UV-mode fog using `shouldEnableFog(uvMode, viewportLayout)` from `src/utils/environmentGating.ts`. The existing `FogController` component removes fog from scene when disabled. This section extends that pattern with a second normal-mode fog path and a new `SkyEnvironment` component.

### Sun Data Format

`SunData` (from `src/hooks/useSunPosition.ts`):
- `azimuth: number` — radians, suncalc convention (0=south, clockwise)
- `altitude: number` — radians above horizon

The `<Sky>` component from drei needs `sunPosition` as a `Vector3`. The conversion is:
```
sunPosition = new Vector3().setFromSphericalCoords(
  1,
  degToRad(90 - altitudeDeg),   // polar angle from zenith
  degToRad(azimuthDeg)          // azimuthal angle
)
```
Or equivalently from radians:
```
sunPosition = new Vector3(
  Math.sin(altitude) * Math.cos(azimuth),  // x
  Math.cos(altitude),                       // y (elevation)
  Math.sin(altitude) * Math.sin(azimuth)   // z
)
```

The simpler direct computation:
```
x = Math.cos(altitude) * Math.sin(azimuth)
y = Math.sin(altitude)
z = Math.cos(altitude) * Math.cos(azimuth)
```

Expose this as a pure utility function `sunAltAzToVector3(altitude: number, azimuth: number): [number, number, number]` in `src/utils/environmentGating.ts` so it can be tested without R3F.

### GPU Tier Gating

| Feature | Low | Mid | High |
|---------|-----|-----|------|
| Sky component | No (background color only) | Yes | Yes |
| Normal-mode fog | Basic | Standard | Standard |

Low tier only sets the background color; no `<Sky>` component (saves draw calls and shader complexity on old hardware).

---

## Files to Create / Modify

### New file: `src/components/three/environment/SkyEnvironment.tsx`

Component that:
- Reads `uvMode`, `gpuTier`, `viewportLayout`, and `layers.environment.visible` from Zustand store
- In normal mode with mid/high GPU: renders drei `<Sky>` with sun position derived from `sunData`
- Sets scene background color via `<color attach="background" />`:
  - Normal mode: `#b0c4d8` (light blue-gray, matching sky horizon)
  - UV mode: `#07071A` (existing dark color)
- Handles normal-mode fog via `<fog>` or delegates to `ThreeDOnlyContent`

Note: This component is purely declarative — it attaches to the scene. No pointer events needed.

### Modified file: `src/utils/environmentGating.ts`

Add three new exported functions:

```typescript
/**
 * Whether to render the drei <Sky> component.
 * False on low GPU tier (too expensive) and in UV mode (dark void instead).
 */
export function shouldShowSky(uvMode: boolean, gpuTier: GpuTier): boolean

/**
 * Whether to show textured ground vs flat color.
 * Low tier gets flat gray; mid+ get texture maps.
 */
export function shouldShowGroundTexture(gpuTier: GpuTier): boolean

/**
 * Normal-mode fog gating.
 * Only enabled in 3d-only layout, not UV mode, and only when env layer visible.
 */
export function shouldEnableNormalFog(
  viewportLayout: ViewportLayout,
  uvMode: boolean,
  envLayerVisible: boolean,
): boolean

/**
 * Convert sun altitude (radians above horizon) and azimuth (radians, suncalc convention)
 * to a Three.js-compatible sunPosition Vector3 tuple.
 * suncalc azimuth: 0=south, PI/2=west. Scene: X+=east, Z+=south.
 */
export function sunAltAzToVector3(
  altitude: number,
  azimuth: number,
): [number, number, number]
```

`shouldShowGroundTexture` is defined here even though it is primarily used by Section 5 (ground plane) — it belongs in the same gating utility module. If Section 5 is already complete, this function may already exist; verify before adding.

### Modified file: `src/components/three/ThreeDOnlyContent.tsx`

- Import `shouldEnableNormalFog` from `environmentGating`
- Import `SkyEnvironment` from `environment/SkyEnvironment`
- Add `<SkyEnvironment sunData={sunData} />` inside the fragment
- Add normal-mode fog: when `shouldEnableNormalFog(viewportLayout, uvMode, envLayerVisible)` is true, render `<fog attach="fog" args={["#b0c4d8", 25, 55]} />`
- The existing UV-mode `<fogExp2>` path stays intact; both fog paths are mutually exclusive

The component already reads `uvMode`, `gpuTier`, `viewportLayout` from the store. Add `layers.environment.visible` selector for fog gating.

---

## Tests

**Test file**: `tests/utils/skyEnvironment.test.ts` (new file)

```typescript
import { describe, expect, it } from "vitest";
import {
  shouldShowSky,
  shouldEnableNormalFog,
  sunAltAzToVector3,
} from "../../src/utils/environmentGating";

describe("shouldShowSky", () => {
  it("returns true for mid GPU in normal mode", ...);
  it("returns true for high GPU in normal mode", ...);
  it("returns false for low GPU (too expensive)", ...);
  it("returns false when uvMode=true regardless of GPU tier", ...);
});

describe("shouldEnableNormalFog", () => {
  it('returns true for 3d-only layout, normal mode, env layer visible', ...);
  it('returns false for dual layout (fog bleeds into 2D pane)', ...);
  it('returns false for 2d-only layout', ...);
  it('returns false when uvMode=true (UV uses fogExp2 instead)', ...);
  it('returns false when env layer is hidden', ...);
});

describe("sunAltAzToVector3", () => {
  it("altitude=90° (zenith) produces y=1, x≈0, z≈0", ...);
  it("altitude=0° (horizon) produces y≈0", ...);
  it("altitude=45°, azimuth=0° (south) produces correct south+up vector", ...);
  it("returns tuple of 3 numbers", ...);
});
```

The test expectations:

**`shouldShowSky`**:
- `shouldShowSky(false, "mid")` → `true`
- `shouldShowSky(false, "high")` → `true`
- `shouldShowSky(false, "low")` → `false`
- `shouldShowSky(true, "high")` → `false`
- `shouldShowSky(true, "mid")` → `false`

**`shouldEnableNormalFog`**:
- `shouldEnableNormalFog("3d-only", false, true)` → `true`
- `shouldEnableNormalFog("dual", false, true)` → `false`
- `shouldEnableNormalFog("2d-only", false, true)` → `false`
- `shouldEnableNormalFog("3d-only", true, true)` → `false` (UV mode uses fogExp2)
- `shouldEnableNormalFog("3d-only", false, false)` → `false` (env layer hidden)

**`sunAltAzToVector3`**:
- `sunAltAzToVector3(Math.PI/2, 0)` → y component ≈ 1 (sun at zenith)
- `sunAltAzToVector3(0, 0)` → y component ≈ 0 (sun on horizon)
- Returns an array of length 3 with all number values

---

## Implementation Details

### `shouldShowSky(uvMode, gpuTier)`

```typescript
export function shouldShowSky(uvMode: boolean, gpuTier: GpuTier): boolean {
  if (uvMode) return false;
  return gpuTier === "mid" || gpuTier === "high";
}
```

### `shouldEnableNormalFog(viewportLayout, uvMode, envLayerVisible)`

```typescript
export function shouldEnableNormalFog(
  viewportLayout: ViewportLayout,
  uvMode: boolean,
  envLayerVisible: boolean,
): boolean {
  if (viewportLayout !== "3d-only") return false;
  if (uvMode) return false;
  if (!envLayerVisible) return false;
  return true;
}
```

### `sunAltAzToVector3(altitude, azimuth)`

Convert suncalc altitude (radians above horizon) and azimuth (radians, 0=south clockwise) to a Three.js scene-space position vector. The result is suitable for the drei `<Sky sunPosition={...}>` prop.

```typescript
export function sunAltAzToVector3(
  altitude: number,
  azimuth: number,
): [number, number, number] {
  // altitude: radians above horizon → y component
  // azimuth in suncalc: 0=south, PI/2=west
  // Three.js scene: X+=east, Z+=south
  const cosAlt = Math.cos(altitude);
  return [
    cosAlt * Math.sin(azimuth),  // x: east-west
    Math.sin(altitude),           // y: elevation
    cosAlt * Math.cos(azimuth),  // z: south-north
  ];
}
```

### `SkyEnvironment.tsx` Component

Create at `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/environment/SkyEnvironment.tsx`.

```typescript
import { Sky } from "@react-three/drei";
import { useStore } from "../../../store";
import {
  shouldEnableNormalFog,
  shouldShowSky,
  sunAltAzToVector3,
} from "../../../utils/environmentGating";
import type { SunData } from "../../../hooks/useSunPosition";

type SkyEnvironmentProps = {
  sunData: SunData;
};

/**
 * SkyEnvironment — sets background color, renders drei <Sky> in normal mode,
 * and adds normal-mode fog. Only active outside UV mode.
 * Sky/fog are only shown when the environment layer is visible and GPU tier allows.
 */
export function SkyEnvironment({ sunData }: SkyEnvironmentProps) {
  // ... reads uvMode, gpuTier, viewportLayout, layers.environment.visible
  // ... conditionally renders:
  //   <color attach="background" args={[bgColor]} />
  //   <Sky ...> when shouldShowSky
  //   <fog ...> when shouldEnableNormalFog
}
```

Key implementation notes:
- `bgColor`: `"#b0c4d8"` in normal mode, `"#07071A"` in UV mode
- `<Sky>` props: `sunPosition={sunAltAzToVector3(sunData.altitude, sunData.azimuth)}`, `turbidity={3}`, `rayleigh={0.5}`, `distance={450000}`
- Background color is always set (even on low GPU) — only the `<Sky>` component is gated by GPU tier
- The `<color attach="background">` element changes the scene background. In UV mode the scene background should already be dark — check if `ThreeDOnlyContent` or `SharedScene` already sets it; avoid double-setting if so

### Mounting in `ThreeDOnlyContent.tsx`

`ThreeDOnlyContent` already has access to `uvMode`, `gpuTier`, `viewportLayout`. Add:

1. Import `SkyEnvironment` and pass `sunData` from `useSunPosition(useStore(s => s.ui.sunDate))`
2. Import `shouldEnableNormalFog` from `environmentGating`
3. Add `envLayerVisible` selector: `useStore((s) => s.ui.layers.environment?.visible ?? true)`
4. Add normal fog render path before the existing UV fog:
   ```tsx
   {shouldEnableNormalFog(viewportLayout, uvMode, envLayerVisible) && (
     <fog attach="fog" args={["#b0c4d8", 25, 55]} />
   )}
   {fogEnabled && <fogExp2 attach="fog" args={["#07071A", 0.04]} />}
   <FogController enabled={fogEnabled || shouldEnableNormalFog(...)} />
   ```
5. Mount `<SkyEnvironment sunData={sunData} />` after the fog elements

Note: The `<fog>` and `<fogExp2>` JSX elements are Three.js object shortcuts available via R3F's extend mechanism. They use `attach="fog"` to set `scene.fog`. Only one will be active at a time since the conditions are mutually exclusive (`uvMode` determines which branch runs).

---

## Integration Checks

After implementing, verify:

1. Run `npm run test` — all existing 639+ tests pass plus new sky/fog tests
2. Run `npx tsc --noEmit` — no TypeScript errors
3. In the browser, switch to 3d-only layout in normal mode: sky visible behind hall, ground fades at distance
4. Toggle UV mode: sky disappears, dark void + fogExp2 returns
5. Switch to dual layout: sky visible but fog absent (ground has hard edge — expected)
6. Toggle environment layer off: sky and fog both disappear

---

## Implementation Deviations

### sunAltAzToVector3 X-axis negated
Plan formula had `x = cosAlt * Math.sin(azimuth)` but existing codebase convention (`getSunDirection()`, `SharedScene.tsx` directional light) uses `x = -Math.sin(azimuth)`. X component negated to match: `x = -cosAlt * Math.sin(azimuth)`. Three additional directional tests added with non-zero azimuth to validate.

### scene.background gated by viewportLayout
Plan rendered `<color attach="background">` unconditionally. Code review found `scene.background` is scene-global and bleeds into 2D pane in dual-viewport mode. Fixed by only rendering when `viewportLayout === "3d-only"`, matching the existing fog constraint.

### SkyEnvironment reads viewportLayout (not in original plan)
Added `viewportLayout` selector to `SkyEnvironment` to support the background gating fix above.

### Files created
- `src/components/three/environment/SkyEnvironment.tsx`
- `tests/utils/skyEnvironment.test.ts` (16 tests)

### Files modified
- `src/utils/environmentGating.ts` (added shouldShowSky, shouldEnableNormalFog, sunAltAzToVector3)
- `src/components/three/ThreeDOnlyContent.tsx` (mounted SkyEnvironment, added normal fog path)
- `src/components/three/environment/index.ts` (barrel export)

### Test count
- 16 new tests in skyEnvironment.test.ts
- 769 total tests passing (67 files)

## Known Limitations (Explicitly Deferred)

- **Dynamic time-of-day sky colors**: Sky is static; no animated sun movement through the sky
- **Shadow light frustum for exterior**: Ground shadows outside hall may be clipped at shadow camera boundary — acceptable for now
- **Sky in dual mode**: `<Sky>` can still render in dual mode (it is not scene-level like fog). However, if it causes visual issues with the 2D pane, gate it with `viewportLayout !== "2d-only"` as a defensive measure