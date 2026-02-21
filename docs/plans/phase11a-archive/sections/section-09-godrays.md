Good -- the UV lamp positions are not yet defined in the codebase, confirming T8 hasn't been implemented yet. Now I have complete context. Let me generate the section content.

# Section 09: GodRays

## Overview

This section creates the `GodRaysSource` component -- a set of small emissive sphere meshes co-located at the UV lamp positions defined in Section 08. These spheres serve as light sources for the `GodRays` postprocessing effect (high-tier GPUs only). The component is intentionally decoupled from the UV lamp fixture geometry (Section 08) so that if GodRays cause rendering issues, the entire feature can be deleted with zero impact on the lamp fixtures.

The section also wires the GodRays mesh ref into Zustand so the `PostProcessing` component (Section 06) can read it for the `GodRays` effect's `sun` prop.

## Dependencies

- **Section 06 (PostProcessing)** must be completed first. That section creates the `PostProcessing` component with the single `EffectComposer` and the conditional GodRays effect slot that reads `godRaysLampRef` from Zustand. It also adds the `godRaysLampRef` field to UIState and the `setGodRaysLampRef` action to the store.
- **Section 08 (UV Lighting)** must be completed first. That section creates the `UVLamps` component with 4x `RectAreaLight` and lamp fixture geometry at positions `[(2.5, 4.3, 5), (7.5, 4.3, 5), (2.5, 4.3, 15), (7.5, 4.3, 15)]`. The `GodRaysSource` meshes are placed at these same positions.
- **Section 01 (GPU Tier)** must be completed first. This section reads `gpuTier` from Zustand to gate the component to high-tier GPUs only.

## Background

### What GodRays Are

GodRays (also called volumetric light scattering or crepuscular rays) simulate visible beams of light radiating from a bright source through a medium (dust, fog). In the context of a blacklight mini golf hall, they simulate UV light tubes casting visible beams through floating dust particles.

The `GodRays` effect from `@react-three/postprocessing` works by:
1. Taking a reference to a "sun" mesh (the light source geometry)
2. Performing a screen-space radial blur from that source outward
3. Blending the result into the scene

### Why Decoupled from UV Lamps

The UV lamp fixtures (Section 08) are `RectAreaLight` elements with visible tube geometry. GodRays require a different kind of source mesh -- small emissive spheres with `transparent={true}` and `depthWrite={false}`. Mixing these properties into the lamp fixture geometry would create coupling that makes the cut contingency messy.

By keeping GodRays sources in a separate component:
- Section 08's lamp fixtures work perfectly with or without GodRays
- If GodRays cause rendering artifacts in the single EffectComposer, deleting `GodRaysSource.tsx` and removing the GodRays effect from `PostProcessing.tsx` leaves zero dead code
- The only connection point is the `godRaysLampRef` field in Zustand (already added by Section 06)

### UV Lamp Positions (from Section 08)

The 4 UV lamp positions at ceiling height are:
- `(2.5, 4.3, 5)`
- `(7.5, 4.3, 5)`
- `(2.5, 4.3, 15)`
- `(7.5, 4.3, 15)`

These are distributed evenly along the 10m x 20m hall at y=4.3m (ceiling height). The GodRays source spheres are placed at these same coordinates.

### GodRays Effect Configuration

From the postprocessing stack design (Section 06):
- `samples={30}` -- number of radial blur samples
- `density={0.96}` -- length of the god rays
- `decay={0.9}` -- falloff along ray length
- `weight={0.4}` -- overall intensity/brightness of the rays
- `blur={true}` -- smooths the rays

### Ref Wiring Strategy

The `GodRays` effect from `@react-three/postprocessing` takes a `sun` prop that expects a reference to a Three.js `Mesh` object. The wiring is:

1. `GodRaysSource` creates sphere meshes and attaches a ref to one of them (the "primary" source)
2. On mount, `GodRaysSource` calls `setGodRaysLampRef(meshRef)` to store the ref in Zustand
3. On unmount, `GodRaysSource` calls `setGodRaysLampRef(null)` to clear it
4. `PostProcessing` reads `godRaysLampRef` from Zustand and passes it to `<GodRays sun={...} />`
5. When `godRaysLampRef` is `null`, the GodRays effect is not rendered

This approach avoids prop drilling, React context, or forwardRef chains. Zustand is the single coordination point.

### State Already in Place (from Section 06)

Section 06 adds the following to the store (already implemented when this section runs):

In `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/types/ui.ts`:
```typescript
godRaysLampRef: React.RefObject<THREE.Mesh> | null;
```

In the Zustand store:
```typescript
// DEFAULT_UI
godRaysLampRef: null,

// Action
setGodRaysLampRef: (ref) => set((state) => ({
  ui: { ...state.ui, godRaysLampRef: ref }
})),
```

The `PostProcessing` component already has the conditional GodRays rendering:
```typescript
{gpuTier === "high" && godRaysLampRef && (
  <GodRays sun={godRaysLampRef} samples={30} density={0.96} decay={0.9} weight={0.4} blur />
)}
```

This section's job is to provide the component that sets `godRaysLampRef` to a real mesh ref.

## Tests First

Create test file at `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/godrays.test.ts`.

All tests are pure logic tests -- no R3F component rendering. They test the gating functions, configuration constants, and position data that the `GodRaysSource` component uses.

### Test: GodRaysSource rendering conditions

```
File: /mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/godrays.test.ts

import { describe, it, expect } from "vitest";

describe("GodRays gating", () => {
  // Test: GodRaysSource renders only when gpuTier="high" AND uvMode=true
  // Create a shouldShowGodRays(state) function that returns boolean
  // Verify shouldShowGodRays({ gpuTier: "high", uvMode: true }) === true

  // Test: GodRaysSource not rendered when gpuTier="mid" (even if uvMode=true)
  // Verify shouldShowGodRays({ gpuTier: "mid", uvMode: true }) === false

  // Test: GodRaysSource not rendered when gpuTier="low" (even if uvMode=true)
  // Verify shouldShowGodRays({ gpuTier: "low", uvMode: true }) === false

  // Test: GodRaysSource not rendered when uvMode=false (even if gpuTier="high")
  // Verify shouldShowGodRays({ gpuTier: "high", uvMode: false }) === false
});
```

### Test: GodRaysSource mesh properties

```
describe("GodRays source mesh configuration", () => {
  // Test: GodRaysSource meshes have transparent=true
  // Import GODRAYS_SOURCE_CONFIG and verify transparent === true

  // Test: GodRaysSource meshes have depthWrite=false
  // Import GODRAYS_SOURCE_CONFIG and verify depthWrite === false

  // Test: GodRaysSource sphere radius is approximately 0.1
  // Import GODRAYS_SOURCE_CONFIG and verify radius === 0.1
});
```

### Test: GodRaysSource positions match UV lamp positions

```
describe("GodRays source positions", () => {
  // Test: GodRaysSource positions co-locate with UV lamp positions
  // Import GODRAYS_SOURCE_POSITIONS and UV_LAMP_POSITIONS
  // Verify they have the same length (4)
  // Verify each position matches: [2.5,4.3,5], [7.5,4.3,5], [2.5,4.3,15], [7.5,4.3,15]
});
```

### Test: PostProcessing skips GodRays when ref is null

```
describe("GodRays ref wiring", () => {
  // Test: godRaysLampRef in Zustand store defaults to null
  // Import or inline getEffectsForTier from postprocessingConfig
  // Verify getEffectsForTier("high", { hasGodRaysRef: false }) does NOT include "godRays"

  // Test: godRaysLampRef allows GodRays when set
  // Verify getEffectsForTier("high", { hasGodRaysRef: true }) includes "godRays"

  // Test: PostProcessing skips GodRays even at high tier when ref is null
  // This is already tested by Section 06's tests, but verify the contract:
  // getEffectsForTier("high", { hasGodRaysRef: false }) should NOT contain "godRays"
});
```

### Test: GodRays effect configuration constants

```
describe("GodRays effect configuration", () => {
  // Test: GodRays samples is 30
  // Import GODRAYS_EFFECT_CONFIG and verify samples === 30

  // Test: GodRays density is 0.96
  // Verify density === 0.96

  // Test: GodRays decay is 0.9
  // Verify decay === 0.9

  // Test: GodRays weight is 0.4
  // Verify weight === 0.4

  // Test: GodRays blur is true
  // Verify blur === true
});
```

## Implementation

### Step 1: Create GodRays configuration utilities

**File: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/utils/godraysConfig.ts`** (new)

This file exports pure configuration constants and the gating function so they can be tested without R3F.

Export the following:

- `shouldShowGodRays(state: { gpuTier: GpuTier; uvMode: boolean }): boolean`
  - Returns `state.gpuTier === "high" && state.uvMode`
  - GodRays are the most expensive effect -- restricted to high-tier GPUs in UV mode only

- `GODRAYS_SOURCE_CONFIG` constant:
  ```typescript
  {
    radius: 0.1,         // Small sphere mesh
    transparent: true,   // Required by GodRays effect
    depthWrite: false,   // Required by GodRays effect
    emissiveColor: "#8800FF",  // Match UV lamp color
    emissiveIntensity: 3.0,    // High to stand out as light source
  }
  ```

- `GODRAYS_SOURCE_POSITIONS` constant:
  ```typescript
  // Must match UV lamp positions from Section 08 (UVLamps component)
  [
    [2.5, 4.3, 5] as const,
    [7.5, 4.3, 5] as const,
    [2.5, 4.3, 15] as const,
    [7.5, 4.3, 15] as const,
  ]
  ```
  
  Ideally, import the positions from the same constant that `UVLamps` uses (Section 08 should export `UV_LAMP_POSITIONS`). If Section 08 does not export the positions as a shared constant, define them here and add a code comment noting the coupling. Both components must stay in sync.

- `GODRAYS_EFFECT_CONFIG` constant:
  ```typescript
  {
    samples: 30,
    density: 0.96,
    decay: 0.9,
    weight: 0.4,
    blur: true,
  }
  ```

- `GpuTier` type import from wherever Section 01 defines it (likely `src/types/ui.ts` or `src/utils/gpuTierConfig.ts`)

### Step 2: Create GodRaysSource component

**File: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/GodRaysSource.tsx`** (new)

This component renders small emissive sphere meshes at the UV lamp positions. It wires the first mesh's ref into Zustand for the PostProcessing component's GodRays effect.

Key implementation points:

- **Conditional rendering**: The component itself should be rendered conditionally by its parent (ThreeCanvas or UVEffects). The gating check uses `shouldShowGodRays({ gpuTier, uvMode })`. If false, the component is not mounted at all.

- **Mesh geometry**: Use `<sphereGeometry args={[0.1, 16, 16]} />` for each source. The sphere is tiny (0.1m radius) -- it is a light source marker, not a visible object. Use 16 segments for acceptable roundness at this scale.

- **Material**: Use `<meshBasicMaterial>` (not `meshStandardMaterial`) with:
  - `color={GODRAYS_SOURCE_CONFIG.emissiveColor}` -- "#8800FF"
  - `transparent={true}` -- required by GodRays
  - `depthWrite={false}` -- required by GodRays
  - `toneMapped={false}` -- prevents tone mapping from dimming the source
  
  Note: `meshBasicMaterial` is used because these spheres need to be unlit, bright emitters. `meshStandardMaterial` with emissive would also work but is more expensive for an effect that just needs a bright pixel cluster.

- **Ref wiring**: Use `useRef` to capture the first sphere mesh. On mount, call `setGodRaysLampRef(meshRef)`. On unmount (cleanup function in `useEffect`), call `setGodRaysLampRef(null)`.

- **Positioning**: Map over `GODRAYS_SOURCE_POSITIONS` to render 4 spheres. The first sphere gets the ref (GodRays only needs one `sun` source -- using the first lamp position is sufficient for the radial blur origin).

- **Visibility in top-down**: These spheres are at ceiling height (y=4.3) and radius 0.1m -- they are effectively invisible in top-down view. No explicit visibility gating needed beyond the uvMode/gpuTier check.

Component skeleton:

```typescript
// GodRaysSource.tsx
// Emissive sphere meshes for GodRays effect (high-tier GPUs only)
// Decoupled from UVLamps -- can be deleted entirely if GodRays are cut

export function GodRaysSource() {
  // useRef for primary mesh (first lamp position)
  // useEffect to wire ref into Zustand on mount, clear on unmount
  // Map GODRAYS_SOURCE_POSITIONS to render 4 sphere meshes
  // Return group containing all spheres
}
```

### Step 3: Mount GodRaysSource in the scene

**File: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/ThreeCanvas.tsx`** (modify)

Add `GodRaysSource` to the scene graph, gated by the `shouldShowGodRays` check:

```tsx
import { GodRaysSource } from "./GodRaysSource";
import { shouldShowGodRays } from "../../utils/godraysConfig";

// Inside the component, read gpuTier from store:
const gpuTier = useStore((s) => s.ui.gpuTier);

// In the JSX return:
{shouldShowGodRays({ gpuTier, uvMode }) && <GodRaysSource />}
```

This placement ensures:
- `GodRaysSource` only mounts on high-tier GPUs with UV mode active
- On unmount (UV mode off or tier change), the cleanup effect clears the Zustand ref
- `PostProcessing` automatically stops rendering GodRays when the ref becomes null

### Step 4: Verify PostProcessing integration

No code changes needed in `PostProcessing.tsx` -- Section 06 already has the conditional GodRays rendering that reads `godRaysLampRef` from Zustand. However, verify at implementation time that:

1. The `GodRays` import from `@react-three/postprocessing` works correctly with the mesh ref type
2. The GodRays effect renders without artifacts in the single EffectComposer
3. The effect ordering (after N8AO, before Bloom) produces acceptable visual results

If any of these checks fail, execute the **cut contingency**.

### Cut Contingency

If GodRays integration causes rendering issues (visual artifacts, crashes, or unacceptable performance), follow these steps to cleanly remove the feature:

1. Delete `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/GodRaysSource.tsx`
2. Delete `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/utils/godraysConfig.ts`
3. Remove the `{shouldShowGodRays(...) && <GodRaysSource />}` line from `ThreeCanvas.tsx`
4. In `PostProcessing.tsx`, remove the GodRays conditional render block (the `{gpuTier === "high" && godRaysLampRef && <GodRays ... />}` JSX)
5. Optionally remove the `godRaysLampRef` field and `setGodRaysLampRef` action from the store (or leave them as harmless null fields)
6. Remove `godraysConfig.ts` imports from tests, delete or skip the GodRays test file
7. Remove the `GodRays` import from `PostProcessing.tsx`

Impact on other sections: zero. Section 08's UV lamp fixtures are unaffected. Section 06's PostProcessing component works fine without the GodRays block. The `godRaysLampRef` stays null and the conditional render evaluates to false.

## Files Summary

| File | Action | Description |
|------|--------|-------------|
| `tests/godrays.test.ts` | Created | 18 unit tests for gating, config, positions, ref wiring, emissiveColor |
| `src/utils/godraysConfig.ts` | Created | `shouldShowGodRays`, `GODRAYS_SOURCE_CONFIG`, `GODRAYS_SOURCE_POSITIONS`, `GODRAYS_EFFECT_CONFIG` |
| `src/components/three/GodRaysSource.tsx` | Created | Emissive sphere meshes + Zustand ref wiring |
| `src/components/three/PostProcessing.tsx` | Modified | Added GodRays import + conditional rendering with config constants |
| `src/components/three/ThreeCanvas.tsx` | Modified | Added gated `<GodRaysSource />` to scene graph |

## Implementation Notes

### Deviations from Plan
- Removed `emissiveIntensity` from `GODRAYS_SOURCE_CONFIG` — `meshBasicMaterial` doesn't support it (plan included it but component uses meshBasicMaterial per plan's own instruction)
- Added `emissiveColor` test (plan omitted it but it's an important config value)
- Mesh keys include all 3 coordinates (`x-y-z`) instead of just `x-z` for future safety
- PostProcessing passes `godRaysLampRef.current` (Mesh) rather than the RefObject — both work per library API, `.current` is more explicit

### Verification Results
- 18 tests pass in `tests/godrays.test.ts`
- 353 total tests pass (full suite)
- `tsc --noEmit` clean
- Complete decoupling from UVLamps maintained