Now I have all the context I need. Let me generate the section content.

# Section 11: Performance Fixes

## Overview

This section implements two targeted performance optimizations:

1. **HallWalls singleton materials** -- The current `HallWalls` component creates a new `MeshStandardMaterial` inline on every render via JSX (`<meshStandardMaterial color={color} />`). This means React Three Fiber creates and disposes material objects on each render cycle. The fix is to create module-level singleton materials (one for planning mode, one for UV mode) and select between them based on `uvMode`, following the same pattern already established in `src/components/three/holes/shared.ts`.

2. **Mobile shadow optimization** -- The Canvas currently uses `shadows="soft"` unconditionally (when not in UV mode). On mobile devices, soft shadows (PCSS) are approximately 40% more expensive than standard shadow mapping with minimal visual difference on small screens. The fix gates the shadow type based on the `isMobile` utility.

**Estimated effort**: 0.5 day

## Dependencies

- **section-01-gpu-tier**: Must be completed first. The GPU tier system (`gpuTier` in Zustand UIState) is referenced by the frameloop and shadow decisions. The `isMobile` utility already exists.
- **section-05-environment**: The frameloop strategy and Canvas GL props are set up there. This section's mobile shadow optimization modifies the same `<Canvas>` component, but the change is additive (modifying the `shadows` prop only).

## File Changes

### Modified Files

| File | Change |
|------|--------|
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/HallWalls.tsx` | Replace inline JSX materials with module-level singletons |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/App.tsx` | Gate `shadows` prop on `isMobile` |

### New Files

| File | Purpose |
|------|---------|
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/perfFixes.test.ts` | Unit tests for material singletons and shadow gating |

## Tests (Write First)

Create `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/perfFixes.test.ts` with the following test stubs. These tests validate the singleton material pattern and shadow type logic without rendering any 3D components (pure logic tests, consistent with the project's testing philosophy).

```ts
import { describe, expect, it } from "vitest";

describe("HallWalls singleton materials", () => {
  it("planning material is a module-level singleton (same reference across imports)", () => {
    // Import the planning material from HallWalls module twice
    // and verify they are the exact same object reference (===).
  });

  it("UV material is a module-level singleton (same reference across imports)", () => {
    // Import the UV material from HallWalls module twice
    // and verify they are the exact same object reference (===).
  });

  it("planning material and UV material are different instances", () => {
    // Verify planningMaterial !== uvMaterial
  });

  it("returns planning material when uvMode is false", () => {
    // Test the material selection function/logic:
    // getWallMaterial(false) === planningMaterial
  });

  it("returns UV material when uvMode is true", () => {
    // Test the material selection function/logic:
    // getWallMaterial(true) === uvMaterial
  });
});

describe("Mobile shadow optimization", () => {
  it("uses shadows={true} (not 'soft') on mobile viewport", () => {
    // Test the shadow type derivation logic:
    // getShadowType(isMobile=true) === true
  });

  it("uses shadows='soft' on desktop viewport", () => {
    // Test the shadow type derivation logic:
    // getShadowType(isMobile=false) === "soft"
  });
});
```

### Testing approach

The material singleton tests should import the exported material constants from `HallWalls.tsx` and verify object identity with `===`. The material selection tests should call a pure helper function (exported for testability) that takes `uvMode: boolean` and returns the correct material reference.

The shadow type tests should test a pure helper function that takes `isMobile: boolean` and returns the appropriate shadow prop value.

Both sets of tests are pure logic -- no R3F rendering, no DOM, no jsdom limitations.

## Implementation Details

### 1. HallWalls Singleton Materials

**Current problem** (in `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/HallWalls.tsx`):

Each of the four wall `<mesh>` elements contains an inline `<meshStandardMaterial color={color} />`. React Three Fiber treats these as declarative descriptions; on each render, it compares props and may create new material instances. When `uvMode` toggles, the `color` variable changes, causing all four materials to be recreated.

**Solution**: Define two module-level `MeshStandardMaterial` singletons at the top of the file (outside the component), following the exact pattern from `src/components/three/holes/shared.ts`. The component then assigns the correct singleton via the `material` prop on each `<mesh>` instead of using nested JSX material elements.

Key implementation notes:

- Create `planningWallMaterial` as a `new THREE.MeshStandardMaterial({ color: "#B0B0B0" })` at module scope.
- Create `uvWallMaterial` as a `new THREE.MeshStandardMaterial({ color: "#1A1A2E" })` at module scope. (Note: UV emissive properties may be added later by section-08-uv-lighting or section-06-postprocessing; for now, match the current color.)
- Export both materials and a `getWallMaterial(uvMode: boolean)` helper for testability.
- **Do NOT mutate singletons** at runtime. If the UV transition (section-10) needs animated material properties, it should clone temporarily -- but that is section-10's concern, not this section's.
- Use the `material` prop on `<mesh>`: `<mesh material={getWallMaterial(uvMode)} ...>` and remove the nested `<meshStandardMaterial>` JSX children.

**Resulting component structure** (sketch, not full implementation):

```tsx
import * as THREE from "three";
import { useStore } from "../../store";

// Module-level singletons — created once, never mutated
export const planningWallMaterial = new THREE.MeshStandardMaterial({
  color: "#B0B0B0",
});

export const uvWallMaterial = new THREE.MeshStandardMaterial({
  color: "#1A1A2E",
});

/** Pure selector for testability */
export function getWallMaterial(uvMode: boolean): THREE.MeshStandardMaterial {
  return uvMode ? uvWallMaterial : planningWallMaterial;
}

export function HallWalls() {
  const { width, length, wallHeight, wallThickness } = useStore((s) => s.hall);
  const uvMode = useStore((s) => s.ui.uvMode);
  const material = getWallMaterial(uvMode);
  const halfH = wallHeight / 2;

  return (
    <group>
      {/* North, South, West, East walls — each using material={material} prop */}
      {/* Remove inline <meshStandardMaterial> children */}
    </group>
  );
}
```

### 2. Mobile Shadow Optimization

**Current problem** (in `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/App.tsx`):

The Canvas uses `shadows={!uvMode ? "soft" : undefined}`. On mobile devices, `"soft"` triggers PCSS (Percentage-Closer Soft Shadows), which is approximately 40% more expensive than standard shadow mapping. On small mobile screens, the visual difference between soft and standard shadows is negligible.

**Solution**: Gate the shadow type on `isMobile`. The `isMobile` utility is already imported in `App.tsx`.

Export a pure helper function for testability:

```ts
/**
 * Determines the Canvas shadows prop value.
 * Mobile: standard shadows (shadows={true}) — 40% cheaper than PCSS.
 * Desktop: soft shadows (shadows="soft") — visually superior on large screens.
 */
export function getShadowType(mobile: boolean): true | "soft" {
  return mobile ? true : "soft";
}
```

Then in the Canvas JSX, replace the current `shadows` prop:

```tsx
// Before:
shadows={!uvMode ? "soft" : undefined}

// After:
shadows={!uvMode ? getShadowType(isMobile) : undefined}
```

Note: The `uvMode` gate on shadows remains -- when UV mode is active, shadows may be handled differently (section-05-environment handles this). This section only changes the non-UV shadow type.

**Important**: The `getShadowType` function should be exported from `App.tsx` (or placed in a small utility file like `src/utils/shadows.ts` if preferred) so that tests can import and verify it without rendering the full App component.

## Verification Checklist

After implementation, verify:

1. All tests in `tests/perfFixes.test.ts` pass (`npm test`).
2. `npx tsc --noEmit` passes with no type errors.
3. `npm run check` (Biome lint + format) passes.
4. The app renders correctly in planning mode (walls are light gray `#B0B0B0`).
5. The app renders correctly in UV mode (walls are dark blue `#1A1A2E`).
6. Toggling UV mode switches wall materials without visual regression.
7. On mobile (or with mobile emulation), shadows are standard (not soft).
8. On desktop, shadows remain soft.
9. No `MeshStandardMaterial` instances are created inside the `HallWalls` render function (verify via React DevTools or by adding a temporary `console.log` in the component body).

## Notes for Implementer

- This section is intentionally small (0.5 day). Both changes are surgical and low-risk.
- The singleton material pattern is already proven in `src/components/three/holes/shared.ts` -- follow that exact approach.
- The `isMobile` utility at `src/utils/isMobile.ts` evaluates `window.matchMedia("(pointer: coarse)").matches` at module load time. It is a static boolean, not reactive -- this is acceptable for shadow type decisions since viewport changes mid-session are rare.
- Use **tabs** for indentation (Biome convention for this project).
- Commit with message format: `perf: singleton wall materials + mobile shadow optimization`

## Implementation Notes

### Files Summary (Actual)

| File | Action | Description |
|------|--------|-------------|
| `src/components/three/HallWalls.tsx` | Modified | Module-level singleton materials, `getWallMaterial` helper |
| `src/utils/environmentGating.ts` | Modified | Added `getShadowType(gpuTier, mobile)` helper |
| `src/App.tsx` | Modified | Replaced inline shadow logic with `getShadowType` call |
| `tests/perfFixes.test.ts` | Created | 8 tests: 5 material singletons + 3 shadow type |

### Deviations from Plan
- `getShadowType` takes `(gpuTier, mobile)` instead of just `(mobile)` — because section-05 already combined GPU tier + mobile gating in App.tsx. The updated function composes `shouldEnableSoftShadows(gpuTier) && !mobile` to preserve both gates.
- Used named import `{ MeshStandardMaterial }` from `"three"` instead of `import * as THREE` — better tree-shaking.
- Plan suggested `getShadowType` could go in `App.tsx` or `src/utils/shadows.ts`; placed in `environmentGating.ts` alongside the related `shouldEnableSoftShadows` function.

### Verification Results
- 377 total tests pass (8 new perfFixes)
- `tsc --noEmit` clean