Now I have all the context I need. Let me generate the section content.

# Section 06: PostProcessing + Sparkles + Effects

## Overview

This section creates the new `PostProcessing` component that replaces the existing `UVPostProcessing` component. The new component implements a tier-aware effect stack using a single `EffectComposer`, adds `Sparkles` for UV-reactive dust particles, updates emissive intensity values for selective bloom, and sets renderer tone mapping to `NoToneMapping` to avoid double tone mapping.

## Dependencies

- **Section 05 (Environment)** must be completed first. That section establishes the frameloop strategy (`needsAlwaysFrameloop`), Canvas `gl` props, and the `<Environment>` component. This section adds post-processing effects that run alongside those scene-level features.
- **Section 01 (GPU Tier)** must be completed first. This section reads `gpuTier` from Zustand to gate effects per tier level.

## Background

### Current State

The existing post-processing is in two files:

**`/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/UVPostProcessing.tsx`** (to be removed):
```typescript
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { KernelSize } from "postprocessing";
import { isMobile } from "../../utils/isMobile";

export default function UVPostProcessing() {
	return (
		<EffectComposer>
			<Bloom
				intensity={isMobile ? 0.7 : 1.2}
				luminanceThreshold={0.2}
				luminanceSmoothing={0.4}
				kernelSize={isMobile ? KernelSize.SMALL : KernelSize.LARGE}
				mipmapBlur
			/>
			<Vignette offset={0.3} darkness={0.8} />
		</EffectComposer>
	);
}
```

**`/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/UVEffects.tsx`** (to be updated):
```typescript
import { Suspense, lazy } from "react";
import { useStore } from "../../store";

const UVPostProcessing = lazy(() => import("./UVPostProcessing"));

export function UVEffects() {
	const uvMode = useStore((s) => s.ui.uvMode);
	if (!uvMode) return null;
	return (
		<Suspense fallback={null}>
			<UVPostProcessing />
		</Suspense>
	);
}
```

The current setup only applies Bloom and Vignette when UV mode is active, with a luminance threshold of 0.2 (too low -- causes "everything glows" effect).

### UV Emissive Materials

Shared UV materials in `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/shared.ts` currently use `emissiveIntensity: 0.8`. These must be updated to `2.0` for selective bloom to work (higher threshold filters out low-emissive surfaces).

The constant in `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/materialPresets.ts` is:
```typescript
export const UV_EMISSIVE_INTENSITY = 0.8;
```

This must be updated to `2.0`.

### Effect Stack Architecture

The full effect stack runs through a **single** `EffectComposer` with `multisampling={0}` (MSAA is redundant with postprocessing). Effects are ordered as follows:

| Order | Effect | Tier Requirement | Notes |
|-------|--------|------------------|-------|
| 1 | N8AO | high only | Ambient occlusion, `quality="medium"`, `halfRes` |
| 2 | GodRays | high only | Requires `godRaysLampRef` from Zustand (null = skip). Section 09 responsibility |
| 3 | Bloom | all tiers | `mipmapBlur`, `luminanceThreshold=0.8`, intensity 0.6-1.0 |
| 4 | ChromaticAberration | mid+ only | `offset=[0.0015, 0.0015]` |
| 5 | Vignette | all tiers | `offset=0.3`, `darkness=0.8` |
| 6 | ToneMapping | all tiers | `mode=ACES_FILMIC` |

### Max Effects Per Tier Policy

To prevent feature creep, cap the total active postprocessing effects per tier:
- **low**: 2 effects (Bloom + Vignette). Note: ToneMapping is always-on baseline.
- **mid**: 4 effects (add ChromaticAberration + ToneMapping as counted optional)
- **high**: 6 effects (add N8AO + GodRays)

Scene-level features (SoftShadows, Sparkles, MeshReflectorMaterial, Fog) are budgeted separately -- they are drei components or Three.js features, not EffectComposer effects. Any new postprocessing effect added after Phase 11A must replace an existing one at its tier level.

### Sparkles

`<Sparkles>` from drei renders floating UV-reactive dust particles constrained to the hall volume:
- `count={400}`, `color="#9D00FF"`, `size={2}`, `speed={0.3}`
- `scale={[10, 4.3, 20]}`, `position={[5, 2.15, 10]}` (centered in hall)
- Mid+high tier only, UV mode only
- Requires `frameloop="always"` (handled by Section 05's frameloop strategy)

### Renderer Tone Mapping

Set `renderer.toneMapping = THREE.NoToneMapping` on the Canvas `gl` prop to avoid double tone mapping. The `ToneMapping` effect in the EffectComposer handles tone mapping -- if the renderer also applies its own, colors get washed out. This is set via Canvas `gl` prop: `toneMapping: THREE.NoToneMapping`.

Note: Section 05 already modifies Canvas `gl` props (adding `powerPreference`). This section adds `toneMapping: NoToneMapping` to those same props.

### GodRays Ref Wiring

The `PostProcessing` component reads `godRaysLampRef` from Zustand UIState. This ref is set by the `GodRaysSource` component (Section 09). When the ref is `null` (before Section 09 is implemented, or when GodRays conditions are not met), the GodRays effect is simply not rendered. This makes Section 06 and Section 09 cleanly decoupled.

The `godRaysLampRef` field should be added to UIState as part of this section (or as part of Section 09 -- coordinate so only one section adds it). It is an ephemeral field (not persisted) of type `React.RefObject<THREE.Mesh> | null`, defaulting to `null`.

## Tests First

Create test file at `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/postprocessing.test.ts`.

All tests are pure logic tests (no R3F rendering). They test the gating functions and configuration constants that the `PostProcessing` component uses.

### Test: Effect stack tier gating

```
File: /mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/postprocessing.test.ts

describe("PostProcessing effect stack", () => {
  // Test: effect stack includes Bloom at all tiers
  // Verify getEffectsForTier("low") includes "bloom"
  // Verify getEffectsForTier("mid") includes "bloom"
  // Verify getEffectsForTier("high") includes "bloom"

  // Test: effect stack includes Vignette at all tiers
  // Verify getEffectsForTier("low") includes "vignette"
  // Verify getEffectsForTier("mid") includes "vignette"
  // Verify getEffectsForTier("high") includes "vignette"

  // Test: effect stack includes ToneMapping at all tiers
  // Verify getEffectsForTier("low") includes "toneMapping"
  // Verify getEffectsForTier("mid") includes "toneMapping"
  // Verify getEffectsForTier("high") includes "toneMapping"

  // Test: effect stack includes ChromaticAberration at mid+ only
  // Verify getEffectsForTier("low") does NOT include "chromaticAberration"
  // Verify getEffectsForTier("mid") includes "chromaticAberration"
  // Verify getEffectsForTier("high") includes "chromaticAberration"

  // Test: effect stack includes N8AO at high only
  // Verify getEffectsForTier("low") does NOT include "n8ao"
  // Verify getEffectsForTier("mid") does NOT include "n8ao"
  // Verify getEffectsForTier("high") includes "n8ao"

  // Test: effect stack includes GodRays at high only (when lampRef available)
  // Verify getEffectsForTier("high", { hasGodRaysRef: true }) includes "godRays"
  // Verify getEffectsForTier("high", { hasGodRaysRef: false }) does NOT include "godRays"
  // Verify getEffectsForTier("mid", { hasGodRaysRef: true }) does NOT include "godRays"
});
```

### Test: Sparkles gating

```
describe("Sparkles gating", () => {
  // Test: Sparkles enabled for mid tier + uvMode
  // Verify shouldShowSparkles({ gpuTier: "mid", uvMode: true }) === true

  // Test: Sparkles enabled for high tier + uvMode
  // Verify shouldShowSparkles({ gpuTier: "high", uvMode: true }) === true

  // Test: Sparkles disabled for low tier
  // Verify shouldShowSparkles({ gpuTier: "low", uvMode: true }) === false

  // Test: Sparkles disabled when uvMode=false
  // Verify shouldShowSparkles({ gpuTier: "mid", uvMode: false }) === false
  // Verify shouldShowSparkles({ gpuTier: "high", uvMode: false }) === false
});
```

### Test: Bloom and emissive constants

```
describe("Bloom and emissive configuration", () => {
  // Test: bloom luminanceThreshold is 0.8 (not 0.2)
  // Import BLOOM_CONFIG and verify threshold === 0.8

  // Test: UV_EMISSIVE_INTENSITY constant is 2.0 (not 0.8)
  // Import UV_EMISSIVE_INTENSITY from materialPresets and verify === 2.0

  // Test: EffectComposer multisampling is 0
  // Import EFFECT_COMPOSER_CONFIG and verify multisampling === 0
});
```

## Implementation

### Step 1: Extract testable gating logic

Create a utility file with pure functions that determine which effects are active for a given tier. This enables unit testing without R3F.

**File: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/utils/postprocessingConfig.ts`** (new)

Export these items:
- `GpuTier` type: `"low" | "mid" | "high"` (re-export or import from types)
- `getEffectsForTier(tier: GpuTier, options?: { hasGodRaysRef?: boolean }): string[]` -- returns array of effect names active for the given tier
- `shouldShowSparkles(state: { gpuTier: GpuTier; uvMode: boolean }): boolean` -- returns true when Sparkles should render
- `BLOOM_CONFIG` constant: `{ luminanceThreshold: 0.8, luminanceSmoothing: 0.4, intensity: { mobile: 0.7, desktop: 1.0 } }`
- `EFFECT_COMPOSER_CONFIG` constant: `{ multisampling: 0 }`

The `getEffectsForTier` function logic:
- Always include: `"bloom"`, `"vignette"`, `"toneMapping"`
- Mid+ include: `"chromaticAberration"`
- High only: `"n8ao"`
- High only + hasGodRaysRef: `"godRays"`

The `shouldShowSparkles` function logic:
- Return `state.uvMode && state.gpuTier !== "low"`

### Step 2: Update emissive intensity constants

**File: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/materialPresets.ts`** (modify)

Change `UV_EMISSIVE_INTENSITY` from `0.8` to `2.0`.

**File: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/shared.ts`** (modify)

Update all four UV material singletons (`uvFeltMaterial`, `uvBumperMaterial`, `uvTeeMaterial`, `uvCupMaterial`) to use `emissiveIntensity: 2.0` instead of `0.8`.

**File: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/useMaterials.ts`** (verify)

Verify that `useMaterials` references the shared UV material singletons and does not override `emissiveIntensity`. No changes expected here -- it already uses the singletons from `shared.ts`.

### Step 3: Add godRaysLampRef to UIState

**File: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/types/ui.ts`** (modify)

Add `godRaysLampRef` field to `UIState`. Since this is a Three.js mesh ref and not serializable, it is ephemeral (not persisted). After Section 01 is complete, UIState already has `gpuTier` and `transitioning`. Add:

```typescript
godRaysLampRef: React.RefObject<THREE.Mesh> | null;
```

Default to `null` in the store's `DEFAULT_UI`.

**File: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/store/store.ts`** (modify)

Add `godRaysLampRef: null` to `DEFAULT_UI`. Add a `setGodRaysLampRef` action so Section 09's `GodRaysSource` component can set the ref.

Ensure `godRaysLampRef` is NOT included in `partialize` (it is ephemeral).

### Step 4: Create PostProcessing component

**File: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/PostProcessing.tsx`** (new)

This component replaces `UVPostProcessing.tsx`. It renders a single `EffectComposer` with tier-gated effects.

Key implementation points:
- Import `EffectComposer`, `Bloom`, `Vignette`, `ChromaticAberration`, `ToneMapping`, `N8AO` from `@react-three/postprocessing`
- Import `GodRays` from `@react-three/postprocessing` (for high-tier rendering when ref is available)
- Read `gpuTier` and `godRaysLampRef` from Zustand
- Read `uvMode` from Zustand
- Use `BLOOM_CONFIG` and `EFFECT_COMPOSER_CONFIG` from the config utility
- Use `getEffectsForTier` logic to conditionally render effects
- Set `multisampling={0}` on `EffectComposer`

Effect ordering inside the single EffectComposer (order matters):
1. `{gpuTier === "high" && <N8AO quality="medium" halfRes />}`
2. `{gpuTier === "high" && godRaysLampRef && <GodRays sun={godRaysLampRef} samples={30} density={0.96} decay={0.9} weight={0.4} blur />}`
3. `<Bloom mipmapBlur luminanceThreshold={0.8} luminanceSmoothing={0.4} intensity={isMobile ? 0.7 : 1.0} />`
4. `{gpuTier !== "low" && <ChromaticAberration offset={[0.0015, 0.0015]} />}`
5. `<Vignette offset={0.3} darkness={0.8} />`
6. `<ToneMapping mode={ToneMappingMode.ACES_FILMIC} />`

Note on GodRays: If integrating GodRays into the single EffectComposer causes rendering artifacts during implementation, remove the GodRays effect and delete the `GodRaysSource` ref read. This is the cut contingency described in Section 09.

### Step 5: Add Sparkles to scene

Sparkles are a drei scene-level component, not a postprocessing effect. They should be added in the scene graph, not inside `EffectComposer`.

**Option A** (preferred): Add Sparkles inside `ThreeCanvas.tsx` alongside other scene components, gated by `shouldShowSparkles`.

**Option B**: Create a separate `UVSparkles.tsx` component and render it from `ThreeCanvas.tsx`.

Either way, the Sparkles component renders:
```tsx
{shouldShowSparkles({ gpuTier, uvMode }) && (
  <Sparkles
    count={400}
    color="#9D00FF"
    size={2}
    speed={0.3}
    scale={[10, 4.3, 20]}
    position={[5, 2.15, 10]}
  />
)}
```

The `scale` constrains particles to the hall volume (10m wide, 4.3m tall, 20m long). The `position` centers them in the hall.

### Step 6: Update UVEffects to use PostProcessing

**File: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/UVEffects.tsx`** (modify)

Change the lazy import from `UVPostProcessing` to `PostProcessing`:

```typescript
const PostProcessing = lazy(() => import("./PostProcessing"));
```

Update the render to use `<PostProcessing />` instead of `<UVPostProcessing />`.

The UV mode gating stays -- `PostProcessing` only renders when `uvMode` is true.

### Step 7: Delete old UVPostProcessing

**File: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/UVPostProcessing.tsx`** (delete)

Remove this file entirely. Its functionality is replaced by `PostProcessing.tsx`.

### Step 8: Set renderer toneMapping to NoToneMapping

**File: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/App.tsx`** (modify)

In the `<Canvas>` component's `gl` prop, add `toneMapping: THREE.NoToneMapping` (import `NoToneMapping` from `three`). After Section 05, the `gl` prop already has `powerPreference: "high-performance"`. Add alongside it:

```tsx
gl={{
  antialias: !isMobile,
  preserveDrawingBuffer: true,
  powerPreference: "high-performance",
  toneMapping: THREE.NoToneMapping,
}}
```

This prevents the Three.js renderer from applying its own tone mapping on top of the `ToneMapping` postprocessing effect.

## Files Summary

| File | Action | Description |
|------|--------|-------------|
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/postprocessing.test.ts` | Create | Unit tests for effect gating, sparkles gating, bloom config |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/utils/postprocessingConfig.ts` | Create | Pure functions: `getEffectsForTier`, `shouldShowSparkles`, config constants |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/PostProcessing.tsx` | Create | Tier-aware EffectComposer replacing UVPostProcessing |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/materialPresets.ts` | Modify | `UV_EMISSIVE_INTENSITY`: 0.8 -> 2.0 |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/shared.ts` | Modify | All 4 UV materials: `emissiveIntensity`: 0.8 -> 2.0 |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/types/ui.ts` | Modify | Add `godRaysLampRef` field (ephemeral) |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/store/store.ts` | Modify | Add `godRaysLampRef: null` to DEFAULT_UI, add `setGodRaysLampRef` action |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/UVEffects.tsx` | Modify | Swap lazy import from UVPostProcessing to PostProcessing |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/ThreeCanvas.tsx` | Modify | Add Sparkles (tier+uvMode gated) |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/App.tsx` | Modify | Add `toneMapping: THREE.NoToneMapping` to Canvas gl prop |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/UVPostProcessing.tsx` | Delete | Replaced by PostProcessing.tsx |

## Verification Checklist

1. All tests in `tests/postprocessing.test.ts` pass
2. `npx tsc --noEmit` passes with no type errors
3. `npm run check` (Biome) passes
4. `UV_EMISSIVE_INTENSITY` in materialPresets.ts is `2.0`
5. All four UV material singletons in shared.ts have `emissiveIntensity: 2.0`
6. `UVPostProcessing.tsx` is deleted and no imports reference it
7. `UVEffects.tsx` lazy-imports `PostProcessing` instead
8. Canvas `gl` prop includes `toneMapping: NoToneMapping`
9. Sparkles render only when `gpuTier !== "low" && uvMode === true`
10. `EffectComposer` uses `multisampling={0}`
11. Bloom `luminanceThreshold` is `0.8` (not `0.2`)
12. `godRaysLampRef` defaults to `null` and is not in `partialize`
13. Existing 304 tests continue to pass (317 total with 13 new)

## Implementation Notes (Post-Implementation)

### Deviations from Plan

1. **GodRays not wired in PostProcessing**: The `GodRays` effect import and rendering was deferred to Section 09. A `// TODO(Section-09)` comment marks the integration point. The `godRaysLampRef` store field and `setGodRaysLampRef` action are in place and ready.

2. **`getEffectsForTier` not consumed by PostProcessing component**: The function exists as a testable abstraction for the tier policy. PostProcessing uses inline tier checks (`gpuTier === "high"`, `gpuTier !== "low"`) which are simpler for the R3F JSX rendering pattern. Both are tested and verified to match.

3. **`App.tsx` toneMapping already set**: The `toneMapping: NoToneMapping` Canvas gl prop was already present from Section 05. No change needed.

4. **`godRaysLampRef` type**: Used `RefObject<Mesh | null>` (with explicit import) instead of plan's `React.RefObject<THREE.Mesh>`. More correct for React 19's useRef API.

5. **Pre-existing Biome fix**: Fixed Lightformer `key={i}` to position-based string key to resolve `noArrayIndexKey` lint error from Section 05.

### Test Results
- 13 new tests in `tests/postprocessing.test.ts`
- Total: 317 tests across 26 files, all passing