Now I have all the context I need. Let me generate the complete section content.

# Section 01: GPU Tier Classifier

## Overview

This section implements the GPU tier detection and classification system that serves as the foundation for all GPU-adaptive visual effects in Phase 11A. Every subsequent rendering section (environment, post-processing, reflections, lighting, transitions) depends on the tier system established here.

**Estimated effort**: 0.5 day

**Dependencies**: None (this is a root section)

**Blocks**: section-05 (Environment), section-06 (PostProcessing), section-07 (Reflections), section-08 (UV Lighting), section-09 (GodRays), section-10 (UV Transition), section-11 (Perf Fixes)

**Parallelizable with**: section-02 (Theme Tokens)

---

## Background

The Golf Planner app is a React 19 + TypeScript indoor blacklight mini golf hall layout tool using React Three Fiber (R3F) 9.5.0, Three.js 0.183.0, @react-three/drei 10.7.7, and @react-three/postprocessing 3.0.4 for 3D rendering, with Zustand 5.0.11 for state management. Phase 11A transforms it into "GOLF FORGE" with GPU-adaptive 3D effects.

All visual effects are gated by a three-tier GPU classification system:

| App Tier | detect-gpu Tiers | Effects Budget |
|----------|-----------------|----------------|
| low | 0, 1 | Bloom + Vignette + ToneMapping, no shadows, DPR 1.0 |
| mid | 2 | + ChromaticAberration + SoftShadows + Sparkles, PCF shadows 512, DPR 1.5 |
| high | 3 | + N8AO + GodRays + Reflections, PCSS 2048, DPR 2.0 |

---

## Tests First

Create test file: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/hooks/gpuTier.test.ts`

All tests use Vitest (the project's existing test framework). The tests cover four concerns: tier mapping logic, override/caching behavior, store migration (v6 to v7), and frameloop derivation.

### Tier Mapping Tests

```typescript
import { describe, expect, it } from "vitest";
import { mapDetectGpuToAppTier } from "../../src/hooks/useGpuTier";

describe("mapDetectGpuToAppTier", () => {
	it("maps tier 0 to 'low'", () => {
		expect(mapDetectGpuToAppTier(0)).toBe("low");
	});

	it("maps tier 1 to 'low'", () => {
		expect(mapDetectGpuToAppTier(1)).toBe("low");
	});

	it("maps tier 2 to 'mid'", () => {
		expect(mapDetectGpuToAppTier(2)).toBe("mid");
	});

	it("maps tier 3 to 'high'", () => {
		expect(mapDetectGpuToAppTier(3)).toBe("high");
	});

	it("handles undefined input by returning 'low'", () => {
		expect(mapDetectGpuToAppTier(undefined as unknown as number)).toBe("low");
	});

	it("handles null input by returning 'low'", () => {
		expect(mapDetectGpuToAppTier(null as unknown as number)).toBe("low");
	});
});
```

### Override Logic Tests

```typescript
import { describe, expect, it } from "vitest";
import { resolveGpuTier } from "../../src/hooks/useGpuTier";

describe("resolveGpuTier (override logic)", () => {
	it("returns detected tier when override is 'auto'", () => {
		expect(resolveGpuTier("auto", "high")).toBe("high");
	});

	it("override 'low' overrides detected 'high'", () => {
		expect(resolveGpuTier("low", "high")).toBe("low");
	});

	it("override 'high' overrides detected 'low'", () => {
		expect(resolveGpuTier("high", "low")).toBe("high");
	});
});
```

### LocalStorage Caching Tests

```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	GPU_TIER_CACHE_KEY,
	readCachedTier,
	writeCachedTier,
} from "../../src/hooks/useGpuTier";

describe("GPU tier localStorage caching", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	afterEach(() => {
		localStorage.clear();
	});

	it("writes tier after first detection", () => {
		writeCachedTier("mid");
		expect(localStorage.getItem(GPU_TIER_CACHE_KEY)).toBe("mid");
	});

	it("reads cached tier on subsequent loads", () => {
		localStorage.setItem(GPU_TIER_CACHE_KEY, "high");
		expect(readCachedTier()).toBe("high");
	});

	it("returns null when no cached tier exists", () => {
		expect(readCachedTier()).toBeNull();
	});
});
```

### Store Migration Tests (v6 to v7)

Add to the existing migration test file or create a new describe block in: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/store/migration.test.ts`

```typescript
// Add to existing migration.test.ts file:

describe("v6 -> v7 migration: gpuTierOverride field", () => {
	it("adds gpuTierOverride: 'auto' to existing v6 state", () => {
		const v6 = makeV6State();
		const result = migratePersistedState(v6, 6) as Record<string, unknown>;
		expect(result.gpuTierOverride).toBe("auto");
	});

	it("corrupted state falls back to gpuTierOverride: 'auto'", () => {
		// Simulate corrupted/unexpected state shape
		const corrupted = null;
		const result = migratePersistedState(corrupted, 6) as Record<string, unknown>;
		// Should not throw; should handle gracefully
		expect(result).toBeDefined();
	});

	it("preserves all existing v6 fields unchanged", () => {
		const v6 = makeV6State({
			holes: { "h1": { id: "h1", type: "straight", position: { x: 1, z: 2 }, rotation: 0, name: "Hole 1", par: 2 } },
			holeOrder: ["h1"],
		});
		const result = migratePersistedState(v6, 6) as Record<string, unknown>;
		expect(result.holes).toEqual(v6.holes);
		expect(result.holeOrder).toEqual(v6.holeOrder);
		expect(result.holeTemplates).toEqual(v6.holeTemplates);
	});
});
```

A helper `makeV6State` should be created in the test file following the existing pattern (see `makeV5State` already present).

### Frameloop Derivation Tests

```typescript
import { describe, expect, it } from "vitest";
import { needsAlwaysFrameloop } from "../../src/hooks/useGpuTier";

describe("needsAlwaysFrameloop", () => {
	it("returns false when uvMode=false", () => {
		expect(needsAlwaysFrameloop(false, "high", false)).toBe(false);
	});

	it("returns false when uvMode=true + gpuTier='low'", () => {
		expect(needsAlwaysFrameloop(true, "low", false)).toBe(false);
	});

	it("returns true when uvMode=true + gpuTier='mid'", () => {
		expect(needsAlwaysFrameloop(true, "mid", false)).toBe(true);
	});

	it("returns true when uvMode=true + gpuTier='high'", () => {
		expect(needsAlwaysFrameloop(true, "high", false)).toBe(true);
	});

	it("returns true when transitioning=true regardless of tier", () => {
		expect(needsAlwaysFrameloop(false, "low", true)).toBe(true);
	});
});
```

---

## Implementation Details

### 1. Install `@pmndrs/detect-gpu`

Run `npm install @pmndrs/detect-gpu` in the `golf-planner/` directory.

### 2. Pin Three.js Ecosystem Versions

In `/mnt/c/Users/Caus/Golf_Plan/golf-planner/package.json`, change the `^` ranges to exact versions for the Three.js ecosystem packages to prevent mid-implementation breakage:

```json
"dependencies": {
    "@react-three/drei": "10.7.7",
    "@react-three/fiber": "9.5.0",
    "@react-three/postprocessing": "3.0.4",
    "three": "0.183.0",
    ...
}
```

Also pin `@types/three` in devDependencies:

```json
"devDependencies": {
    "@types/three": "0.183.0",
    ...
}
```

After modifying package.json, run `npm install` to regenerate the lock file.

### 3. Update UIState Type

File: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/types/ui.ts`

Add `gpuTier` and `transitioning` to the `UIState` type. These are ephemeral (not persisted, not undo-tracked):

```typescript
export type GpuTier = "low" | "mid" | "high";
export type GpuTierOverride = "auto" | "low" | "mid" | "high";

export type UIState = {
	// ... existing fields ...
	gpuTier: GpuTier;
	transitioning: boolean;
};
```

Export `GpuTier` and `GpuTierOverride` from the types index file at `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/types/index.ts`.

### 4. Add `gpuTierOverride` to Persisted State

File: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/store/store.ts`

The `gpuTierOverride` field must be persisted so user preferences survive page reloads. Add it to the `PersistedSlice` type and the `partialize` function.

Add `gpuTierOverride` as a top-level field on `StoreState` (not inside `ui`, since `ui` is ephemeral):

```typescript
type StoreState = {
	// ... existing fields ...
	gpuTierOverride: GpuTierOverride;
};
```

Default value: `"auto"`.

Add store actions:

```typescript
type StoreActions = {
	// ... existing actions ...
	setGpuTier: (tier: GpuTier) => void;
	setGpuTierOverride: (override: GpuTierOverride) => void;
	setTransitioning: (transitioning: boolean) => void;
};
```

Update `DEFAULT_UI` to include the new fields:

```typescript
const DEFAULT_UI: UIState = {
	// ... existing fields ...
	gpuTier: "low",       // safe default until detection completes
	transitioning: false,
};
```

### 5. Store Version Bump to v7 with Migration

File: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/store/store.ts`

Bump the persist version from `6` to `7`. Add a migration block inside `migratePersistedState`:

```typescript
if (version < 7 && p) {
	try {
		if (!("gpuTierOverride" in (p as Record<string, unknown>))) {
			(p as Record<string, unknown>).gpuTierOverride = "auto";
		}
	} catch {
		// Field-level fallback on corruption
		(p as Record<string, unknown>).gpuTierOverride = "auto";
	}
}
```

The try/catch wraps the migration. On failure, it falls back to the field-level default (`"auto"`) rather than corrupting the store. No full-store backup is needed (localStorage bloat risk with 5MB limit). The migration only adds one field, so corruption risk is near-zero.

Update `partialize` to include `gpuTierOverride`:

```typescript
partialize: (state) => ({
	// ... existing fields ...
	gpuTierOverride: state.gpuTierOverride,
}),
```

### 6. Create `useGpuTier` Hook

File: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/hooks/useGpuTier.ts`

This file exports:
- `mapDetectGpuToAppTier(tier: number): GpuTier` -- Pure function mapping detect-gpu tiers (0-3) to app tiers (low/mid/high)
- `resolveGpuTier(override: GpuTierOverride, detected: GpuTier): GpuTier` -- Pure function resolving the effective tier
- `GPU_TIER_CACHE_KEY` -- String constant for localStorage key (e.g., `"golf-planner-gpu-tier"`)
- `readCachedTier(): GpuTier | null` -- Reads cached tier from localStorage
- `writeCachedTier(tier: GpuTier): void` -- Writes tier to localStorage cache
- `needsAlwaysFrameloop(uvMode: boolean, gpuTier: GpuTier, transitioning: boolean): boolean` -- Pure function deriving frameloop mode
- `useGpuTier(): void` -- React hook that runs GPU detection on mount

The `useGpuTier` hook logic:

1. On mount, check if `gpuTierOverride !== "auto"`. If so, set `gpuTier` to the override value and return.
2. Check localStorage cache via `readCachedTier()`. If a cached value exists, set `gpuTier` to the resolved value and return.
3. Otherwise, call `getGPUTier()` from `@pmndrs/detect-gpu` (async). While detection runs, `gpuTier` stays at `"low"` (the safe default from `DEFAULT_UI`).
4. When detection completes, map the result via `mapDetectGpuToAppTier`, cache it via `writeCachedTier`, and update the store via `setGpuTier`.

The hook reads `gpuTierOverride` from the Zustand store and writes `gpuTier` back. It is called once at the app level (in `App.tsx`). The Hole Builder's separate R3F Canvas reads `gpuTier` from the shared Zustand store -- it does NOT re-detect.

### 7. Integrate `useGpuTier` in App.tsx

File: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/App.tsx`

Call `useGpuTier()` at the top of the `App` component (before the Canvas). This ensures detection runs once on app init.

Update the Canvas `dpr` prop to be tier-aware:

```typescript
const gpuTier = useStore((s) => s.ui.gpuTier);
// DPR by tier: low=1.0, mid=1.5, high=2.0
const dpr: [number, number] = gpuTier === "high" ? [1, 2] : gpuTier === "mid" ? [1, 1.5] : [1, 1];
```

Update the Canvas `frameloop` prop to use the derived value:

```typescript
const uvMode = useStore((s) => s.ui.uvMode);
const transitioning = useStore((s) => s.ui.transitioning);
const frameloop = needsAlwaysFrameloop(uvMode, gpuTier, transitioning) ? "always" : "demand";
```

Add `PerformanceMonitor` from `@react-three/drei` inside the Canvas. This provides runtime FPS monitoring that downstream sections (reflections, effects) will use for adaptive degradation:

```tsx
import { PerformanceMonitor } from "@react-three/drei";

<Canvas dpr={dpr} frameloop={frameloop} /* ... */>
	<PerformanceMonitor>
		<Suspense fallback={null}>
			<ThreeCanvas sunData={sunData} />
		</Suspense>
	</PerformanceMonitor>
</Canvas>
```

### 8. Add GPU Tier Override Dropdown to Settings Panel

File: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/ui/FinancialSettingsModal.tsx`

Add a "GPU Quality" dropdown section to the existing FinancialSettingsModal (the project's settings panel). The dropdown has four options: Auto (detected), Low, Mid, High. When changed, it calls `setGpuTierOverride` on the store and also immediately resolves the effective tier.

The dropdown should show the currently detected tier when "Auto" is selected (e.g., "Auto (detected: Mid)") so the user knows what their GPU was classified as.

This is a simple `<select>` or button-group addition to the existing modal, following the same styling pattern as the existing Display Mode and Risk Tolerance selectors.

---

## File Summary

| File | Action | Description |
|------|--------|-------------|
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/package.json` | Modify | Add `@pmndrs/detect-gpu`, pin Three.js ecosystem versions |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/types/ui.ts` | Modify | Add `GpuTier`, `GpuTierOverride` types, add `gpuTier` and `transitioning` to `UIState` |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/types/index.ts` | Modify | Export `GpuTier`, `GpuTierOverride` |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/store/store.ts` | Modify | Add `gpuTierOverride` to state + persisted slice, add actions (`setGpuTier`, `setGpuTierOverride`, `setTransitioning`), bump version to v7, add migration, update `partialize`, update `DEFAULT_UI` |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/hooks/useGpuTier.ts` | Create | GPU detection hook with caching, mapping, override resolution, frameloop derivation |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/App.tsx` | Modify | Call `useGpuTier()`, tier-aware `dpr`, derived `frameloop`, add `PerformanceMonitor` |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/ui/FinancialSettingsModal.tsx` | Modify | Add GPU tier override dropdown |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/hooks/gpuTier.test.ts` | Create | All unit tests for tier mapping, override logic, caching, frameloop derivation |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/store/migration.test.ts` | Modify | Add v6 to v7 migration tests |

---

## Implementation Checklist

1. Install `@pmndrs/detect-gpu` dependency
2. Pin exact versions for `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`, `@types/three` in package.json (remove `^` prefixes)
3. Run `npm install` to regenerate lock file
4. Add `GpuTier` and `GpuTierOverride` types to `src/types/ui.ts`
5. Export new types from `src/types/index.ts`
6. Add `gpuTier` and `transitioning` to `UIState` with defaults (`"low"` and `false`)
7. Add `gpuTierOverride` to `StoreState` (default `"auto"`)
8. Add store actions: `setGpuTier`, `setGpuTierOverride`, `setTransitioning`
9. Bump store version to `7`, add v7 migration with try/catch
10. Update `partialize` to include `gpuTierOverride`
11. Create `src/hooks/useGpuTier.ts` with all exported functions and the hook
12. Call `useGpuTier()` in `App.tsx`
13. Update Canvas `dpr` to be tier-aware
14. Update Canvas `frameloop` to use `needsAlwaysFrameloop` derivation
15. Add `PerformanceMonitor` from drei inside Canvas
16. Add GPU tier override dropdown to `FinancialSettingsModal`
17. Write all tests in `tests/hooks/gpuTier.test.ts`
18. Add v6-to-v7 migration tests to `tests/store/migration.test.ts`
19. Run `npm test` to verify all tests pass (existing 229 + new tests)
20. Run `npx tsc --noEmit` to verify no type errors
21. Commit: `feat: add GPU tier classifier with detection, caching, and store v7 migration`

---

## Implementation Notes (What Was Actually Built)

**All 21 checklist items completed.** Deviations from plan:

### Files Created
- `src/hooks/useGpuTier.ts` — GPU detection hook with 7 exports
- `tests/hooks/gpuTier.test.ts` — 17 tests (tier mapping, override, caching, frameloop)

### Files Modified
- `package.json` — @pmndrs/detect-gpu 6.0.0 (plan said 5.0.72, doesn't exist), pinned three ecosystem
- `src/types/ui.ts` — GpuTier, GpuTierOverride types, gpuTier + transitioning in UIState
- `src/types/index.ts` — re-exports
- `src/store/store.ts` — v7 migration, gpuTierOverride state, 3 new actions, partialize update
- `src/App.tsx` — useGpuTier(), tier-aware dpr/frameloop, PerformanceMonitor
- `src/components/ui/FinancialSettingsModal.tsx` — GPU Quality dropdown
- `tests/store/migration.test.ts` — 8 new migration tests (v6→v7, v3→v7, v7 passthrough)

### Code Review Fixes Applied
1. **DOM nesting bug** in FinancialSettingsModal — GPU section was outside flex-col wrapper, footer outside modal. Fixed.
2. **Missing .catch()** on getGPUTier() promise — prevents unhandled rejection on WebGL-less devices. Fixed.
3. **Removed redundant resolveGpuTier import** in modal — simplified to direct setGpuTier(opt.value).

### Decisions
- Auto→manual switch lag accepted (useEffect resolves shortly after)
- Cache TTL not added (over-engineering for personal tool)
- Shadow tier-gating deferred to section-05-environment
- PerformanceMonitor callbacks deferred to later sections

### Test Results
- 252 tests passing (21 files), up from 229
- TypeScript: clean (0 errors)
- jsdom worker timeout in WSL2: worked around with vi.stubGlobal localStorage mock