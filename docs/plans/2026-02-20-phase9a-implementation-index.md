# Phase 9A: Material-Aware Rendering & Cost Precision — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add material profile cost multipliers, 3D visual overhaul (shadows/bloom/fog), inflation wiring, quote expiry tracking, SVG floor plan export, code-splitting, and screenshot export.

**Architecture:** Global material profiles (3 presets) drive cost multipliers in selectors and PBR material properties in 3D. Bloom + fog + vignette activate with UV mode. Code-splitting via Vite `manualChunks`. All new features backward-compatible via optional fields + store v5 migration.

**Tech Stack:** React 19, TypeScript, Vite, @react-three/fiber, @react-three/postprocessing (new), Zustand, Tailwind CSS, Vitest

**Design doc:** `docs/plans/2026-02-20-phase9a-material-rendering-design.md`

---

## Wave Structure for Parallelism

- **Wave 1** (Tasks 1, 3, 4 — independent, can run in parallel)
- **Wave 2** (Task 2 — depends on Task 1 for material profile type)
- **Wave 3** (Tasks 5, 6 — depend on Task 2 for lazy Canvas + postprocessing)

---

### Task 1: Material Profile Selector (Cost Side)

**Files:**
- Modify: `src/types/budget.ts:69-72` — add MaterialProfile type, extend BudgetConfigV2
- Modify: `src/types/index.ts:1-14` — re-export MaterialProfile
- Modify: `src/constants/budget.ts:148-151` — add MATERIAL_PROFILE_MULTIPLIERS, update DEFAULT_BUDGET_CONFIG_V2
- Modify: `src/store/selectors.ts:1-27` — apply material multiplier in selectCourseCost + selectCourseBreakdown
- Modify: `src/store/store.ts:429,438-460` — bump version to 5, add v5 migration
- Modify: `src/utils/exportLayout.ts:31` — bump export version to 5
- Modify: `src/components/ui/CostSettingsModal.tsx` — add Material Tier dropdown
- Test: `tests/utils/budgetSelectors.test.ts` — add material profile tests
- Test: `tests/utils/exportLayout.test.ts` — update version assertions

**Step 1: Add MaterialProfile type and extend BudgetConfigV2**

Add to `src/types/budget.ts` after the existing `BudgetConfigV2` type:

```typescript
// After line 72 (end of BudgetConfigV2), replace the type:
export type MaterialProfile = "budget_diy" | "standard_diy" | "semi_pro";

export type BudgetConfigV2 = {
	costPerType: Record<string, number>;
	costPerTypeDiy: Record<string, number>;
	materialProfile: MaterialProfile;
};
```

Re-export from `src/types/index.ts` — add `MaterialProfile` to the budget exports:

```typescript
export type {
	BudgetCategory,
	BudgetCategoryV2,
	BudgetConfig,
	BudgetConfigV2,
	BuildMode,
	ConfidenceTier,
	ConstructionPhase,
	ExpenseEntry,
	FinancialSettings,
	MaterialProfile,
	RiskTolerance,
	UncertaintyParams,
	VatProfile,
} from "./budget";
```

**Step 2: Add MATERIAL_PROFILE_MULTIPLIERS constant and update default config**

In `src/constants/budget.ts`, add after `DEFAULT_COST_PER_TYPE_DIY` (after line 146):

```typescript
import type { MaterialProfile } from "../types/budget";
// (add MaterialProfile to existing import)

export const MATERIAL_PROFILE_MULTIPLIERS: Record<MaterialProfile, number> = {
	budget_diy: 0.65,
	standard_diy: 1.0,
	semi_pro: 1.8,
};
```

Update `DEFAULT_BUDGET_CONFIG_V2` (line 148-151):

```typescript
export const DEFAULT_BUDGET_CONFIG_V2: BudgetConfigV2 = {
	costPerType: DEFAULT_COST_PER_TYPE,
	costPerTypeDiy: DEFAULT_COST_PER_TYPE_DIY,
	materialProfile: "standard_diy",
};
```

**Step 3: Write failing tests for material profile cost multiplier**

Add to `tests/utils/budgetSelectors.test.ts`:

```typescript
import { MATERIAL_PROFILE_MULTIPLIERS } from "../../src/constants/budget";

// Inside describe("selectCourseCost"):

it("applies material profile multiplier in DIY mode", () => {
	const store = useStore.getState();
	store.addHole("straight", { x: 1, z: 1 }); // DIY base: €800

	useStore.setState({
		financialSettings: {
			...useStore.getState().financialSettings,
			buildMode: "diy",
		},
		budgetConfig: {
			...useStore.getState().budgetConfig,
			materialProfile: "semi_pro",
		},
	});

	const cost = selectCourseCost(useStore.getState());
	expect(cost).toBe(Math.round(800 * 1.8)); // €1,440
});

it("does not apply material multiplier in professional mode", () => {
	const store = useStore.getState();
	store.addHole("straight", { x: 1, z: 1 }); // Pro: €2,000

	useStore.setState({
		financialSettings: {
			...useStore.getState().financialSettings,
			buildMode: "professional",
		},
		budgetConfig: {
			...useStore.getState().budgetConfig,
			materialProfile: "semi_pro",
		},
	});

	const cost = selectCourseCost(useStore.getState());
	expect(cost).toBe(2000); // No multiplier in pro mode
});

it("applies budget_diy multiplier (0.65x) in DIY mode", () => {
	const store = useStore.getState();
	store.addHole("windmill", { x: 1, z: 1 }); // DIY base: €1,800

	useStore.setState({
		financialSettings: {
			...useStore.getState().financialSettings,
			buildMode: "diy",
		},
		budgetConfig: {
			...useStore.getState().budgetConfig,
			materialProfile: "budget_diy",
		},
	});

	const cost = selectCourseCost(useStore.getState());
	expect(cost).toBe(Math.round(1800 * 0.65)); // €1,170
});
```

**Step 4: Run tests to verify they fail**

Run: `cd /mnt/c/Users/Caus/Golf_Plan/golf-planner && export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)" && npx vitest run tests/utils/budgetSelectors.test.ts`

Expected: FAIL — `materialProfile` property doesn't exist on budgetConfig yet.

**Step 5: Implement material multiplier in selectors**

Modify `src/store/selectors.ts`:

```typescript
import {
	COURSE_CATEGORY_ID,
	DEFAULT_COST_PER_TYPE,
	DEFAULT_HOLE_COST,
	MATERIAL_PROFILE_MULTIPLIERS,
} from "../constants/budget";
// ... (keep existing imports)

export function selectCourseCost(state: Store): number {
	const cat = state.budget[COURSE_CATEGORY_ID];
	if (cat?.manualOverride) return cat.estimatedNet;

	const { buildMode } = state.financialSettings;
	const costMap =
		buildMode === "diy"
			? state.budgetConfig.costPerTypeDiy
			: buildMode === "professional"
				? DEFAULT_COST_PER_TYPE
				: state.budgetConfig.costPerType; // mixed = user-editable

	const materialMultiplier =
		buildMode === "professional"
			? 1.0
			: MATERIAL_PROFILE_MULTIPLIERS[state.budgetConfig.materialProfile] ?? 1.0;

	return Math.round(
		state.holeOrder.reduce(
			(sum, id) =>
				sum + (costMap[state.holes[id]?.type] ?? DEFAULT_HOLE_COST) * materialMultiplier,
			0,
		),
	);
}

// Also update selectCourseBreakdown similarly:
export function selectCourseBreakdown(state: Store): CourseBreakdownItem[] {
	const { buildMode } = state.financialSettings;
	const costMap =
		buildMode === "diy"
			? state.budgetConfig.costPerTypeDiy
			: buildMode === "professional"
				? DEFAULT_COST_PER_TYPE
				: state.budgetConfig.costPerType;

	const materialMultiplier =
		buildMode === "professional"
			? 1.0
			: MATERIAL_PROFILE_MULTIPLIERS[state.budgetConfig.materialProfile] ?? 1.0;

	const counts: Record<string, number> = {};
	for (const id of state.holeOrder) {
		const hole = state.holes[id];
		if (hole) {
			counts[hole.type] = (counts[hole.type] ?? 0) + 1;
		}
	}

	return Object.entries(counts)
		.map(([type, count]) => {
			const baseCost = costMap[type] ?? DEFAULT_HOLE_COST;
			const unitCost = Math.round(baseCost * materialMultiplier);
			return {
				type,
				label: HOLE_TYPE_MAP[type]?.label ?? type,
				count,
				unitCost,
				subtotal: count * unitCost,
			};
		})
		.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}
```

**Step 6: Update store v5 migration**

In `src/store/store.ts`:

1. Change `version: 4` (line 429) to `version: 5`
2. Add v5 migration block after the v4 block (after line 457):

```typescript
if (version < 5 && p) {
	// Add materialProfile if missing
	if (p.budgetConfig && !("materialProfile" in p.budgetConfig)) {
		(p.budgetConfig as Record<string, unknown>).materialProfile =
			"standard_diy";
	}
}
```

**Step 7: Update export version**

In `src/utils/exportLayout.ts`, change `version: 4` (line 31) to `version: 5`.

Update `tests/utils/exportLayout.test.ts` — change `expect(result.version).toBe(4)` to `expect(result.version).toBe(5)`.

**Step 8: Update resetStore in budgetSelectors.test.ts**

Add `materialProfile: "standard_diy"` to the `budgetConfig` in `resetStore()`:

```typescript
budgetConfig: {
	costPerType: { ...DEFAULT_COST_PER_TYPE },
	costPerTypeDiy: { ...DEFAULT_COST_PER_TYPE_DIY },
	materialProfile: "standard_diy",
},
```

**Step 9: Add Material Tier dropdown to CostSettingsModal**

In `src/components/ui/CostSettingsModal.tsx`, add a dropdown before the cost fields:

```typescript
// Add to imports:
import type { MaterialProfile } from "../../types/budget";
import { MATERIAL_PROFILE_MULTIPLIERS } from "../../constants/budget";

// Inside the component, add new store selectors:
const materialProfile = useStore((s) => s.budgetConfig.materialProfile);

// Add after the header div and before the cost fields:
{/* Material Tier selector */}
{buildMode !== "professional" && (
	<div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
		<span className="text-[10px] text-gray-500 uppercase font-medium">
			Material Tier
		</span>
		<select
			value={materialProfile}
			onChange={(e) =>
				setBudgetConfig({ materialProfile: e.target.value as MaterialProfile })
			}
			className="rounded border border-gray-200 px-2 py-1 text-xs"
		>
			<option value="budget_diy">Budget DIY (0.65×)</option>
			<option value="standard_diy">Standard DIY (1.0×)</option>
			<option value="semi_pro">Semi-Pro (1.8×)</option>
		</select>
	</div>
)}
```

**Step 10: Run all tests**

Run: `cd /mnt/c/Users/Caus/Golf_Plan/golf-planner && export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)" && npx vitest run`

Expected: ALL PASS

**Step 11: Type check**

Run: `cd /mnt/c/Users/Caus/Golf_Plan/golf-planner && export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)" && npx tsc --noEmit`

Expected: No errors

**Step 12: Commit**

```bash
cd /mnt/c/Users/Caus/Golf_Plan/golf-planner && git add src/types/budget.ts src/types/index.ts src/constants/budget.ts src/store/selectors.ts src/store/store.ts src/utils/exportLayout.ts src/components/ui/CostSettingsModal.tsx tests/utils/budgetSelectors.test.ts tests/utils/exportLayout.test.ts && git commit -m "feat: add material profile selector with cost multipliers (0.65x/1.0x/1.8x)"
```

---

### Task 2: 3D Visual Overhaul (Shadows, Fog, Bloom, Material PBR)

**Files:**
- Modify: `src/App.tsx:51-72` — add `shadows="soft"`, sun-driven light, fog, UVEffects
- Modify: `src/components/three/HallFloor.tsx:8` — add receiveShadow
- Modify: `src/components/three/holes/shared.ts:55-87` — bump UV emissiveIntensity to 0.8
- Create: `src/components/three/holes/materialPresets.ts` — PBR presets per MaterialProfile
- Modify: `src/components/three/holes/useMaterials.ts` — consume materialProfile from store
- Create: `src/components/three/UVPostProcessing.tsx` — Bloom + Vignette
- Create: `src/components/three/UVEffects.tsx` — lazy loader
- Create: `src/components/three/ScreenshotCapture.tsx` — screenshot registration (used by Task 6)
- Modify: `package.json` — add `@react-three/postprocessing` dependency

**Step 1: Install @react-three/postprocessing**

Run: `cd /mnt/c/Users/Caus/Golf_Plan/golf-planner && export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)" && npm install @react-three/postprocessing`

**Step 2: Create materialPresets.ts**

Create `src/components/three/holes/materialPresets.ts`:

```typescript
import type { MaterialProfile } from "../../../types/budget";

export type PBRProps = {
	color: string;
	roughness: number;
	metalness: number;
};

export const BUMPER_PBR: Record<MaterialProfile, PBRProps> = {
	budget_diy: { color: "#C8B99A", roughness: 0.65, metalness: 0.0 },
	standard_diy: { color: "#F5F5F5", roughness: 0.3, metalness: 0.1 },
	semi_pro: { color: "#A0A8A0", roughness: 0.25, metalness: 0.75 },
};

export const FELT_PBR: Record<MaterialProfile, PBRProps> = {
	budget_diy: { color: "#3D8B37", roughness: 0.5, metalness: 0.0 },
	standard_diy: { color: "#2E7D32", roughness: 0.95, metalness: 0.0 },
	semi_pro: { color: "#1B5E20", roughness: 0.95, metalness: 0.0 },
};

export const UV_EMISSIVE_INTENSITY = 0.8;
```

**Step 3: Bump UV emissiveIntensity in shared.ts**

In `src/components/three/holes/shared.ts`, change all 4 UV material `emissiveIntensity` values from `0.5` to `0.8` (lines 58, 68, 76, 84).

**Step 4: Update useMaterials hook**

Replace `src/components/three/holes/useMaterials.ts`:

```typescript
import { useMemo } from "react";
import * as THREE from "three";
import { useStore } from "../../../store";
import type { MaterialProfile } from "../../../types/budget";
import { BUMPER_PBR, FELT_PBR } from "./materialPresets";
import {
	cupMaterial,
	teeMaterial,
	uvBumperMaterial,
	uvCupMaterial,
	uvFeltMaterial,
	uvTeeMaterial,
} from "./shared";

export type MaterialSet = {
	felt: THREE.MeshStandardMaterial;
	bumper: THREE.MeshStandardMaterial;
	tee: THREE.MeshStandardMaterial;
	cup: THREE.MeshStandardMaterial;
};

const uvMaterials: MaterialSet = {
	felt: uvFeltMaterial,
	bumper: uvBumperMaterial,
	tee: uvTeeMaterial,
	cup: uvCupMaterial,
};

/** Returns the correct material set based on UV mode and material profile. */
export function useMaterials(): MaterialSet {
	const uvMode = useStore((s) => s.ui.uvMode);
	const materialProfile: MaterialProfile = useStore(
		(s) => s.budgetConfig.materialProfile,
	);

	const planningMaterials = useMemo(() => {
		const feltProps = FELT_PBR[materialProfile];
		const bumperProps = BUMPER_PBR[materialProfile];

		const felt = new THREE.MeshStandardMaterial({
			color: feltProps.color,
			roughness: feltProps.roughness,
			metalness: feltProps.metalness,
			polygonOffset: true,
			polygonOffsetFactor: -1,
		});

		const bumper = new THREE.MeshStandardMaterial({
			color: bumperProps.color,
			roughness: bumperProps.roughness,
			metalness: bumperProps.metalness,
		});

		return { felt, bumper, tee: teeMaterial, cup: cupMaterial };
	}, [materialProfile]);

	return uvMode ? uvMaterials : planningMaterials;
}
```

**Step 5: Create UVPostProcessing.tsx**

Create `src/components/three/UVPostProcessing.tsx`:

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

**Step 6: Create UVEffects.tsx (lazy wrapper)**

Create `src/components/three/UVEffects.tsx`:

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

**Step 7: Update App.tsx — shadows, sun-driven light, fog, UVEffects**

Replace `src/App.tsx` Canvas section. Key changes:

1. Add `shadows="soft"` to Canvas props
2. Replace static `directionalLight` with sun-driven position (planning mode) / UV light
3. Add fog in UV mode
4. Add `<UVEffects />` inside Canvas
5. Add `receiveShadow` on HallFloor (done separately)

```typescript
// Add import at top of App.tsx:
import { UVEffects } from "./components/three/UVEffects";

// Replace Canvas block (lines 51-72):
<Canvas
	dpr={isMobile ? [1, 1.5] : [1, 2]}
	frameloop="demand"
	gl={{ antialias: !isMobile, preserveDrawingBuffer: true }}
	shadows={uvMode ? false : "soft"}
>
	{uvMode && <fog attach="fog" args={["#0A0A1A", 8, 25]} />}
	{!uvMode && !uvMode && <fog attach="fog" args={[null]} />}
	<ambientLight
		color={uvMode ? "#220044" : "#ffffff"}
		intensity={uvMode ? 0.3 : 0.8}
	/>
	{uvMode ? (
		<directionalLight
			position={[10, 20, 5]}
			color="#6600CC"
			intensity={0.4}
		/>
	) : (
		<directionalLight
			position={
				sunData
					? [
							-Math.sin(sunData.azimuth) *
								Math.cos(sunData.altitude) *
								30 +
								5,
							Math.sin(sunData.altitude) * 30,
							Math.cos(sunData.azimuth) *
								Math.cos(sunData.altitude) *
								30 +
								10,
						]
					: [10, 20, 5]
			}
			color="#ffffff"
			intensity={0.5}
			castShadow
			shadow-mapSize-width={isMobile ? 512 : 1024}
			shadow-mapSize-height={isMobile ? 512 : 1024}
			shadow-camera-left={-12}
			shadow-camera-right={12}
			shadow-camera-top={25}
			shadow-camera-bottom={-15}
			shadow-bias={-0.001}
		/>
	)}
	<CameraControls />
	<FloorGrid />
	<Hall sunData={sunData} />
	<PlacementHandler />
	<PlacedHoles />
	<FlowPath />
	<SunIndicator sunData={sunData} />
	<UVEffects />
</Canvas>
```

Note: `preserveDrawingBuffer: true` is needed for screenshot capture (Task 6).

Also remove the fog null-clear line — use conditional rendering to only attach fog in UV mode. Simplify to just:

```typescript
{uvMode && <fog attach="fog" args={["#0A0A1A", 8, 25]} />}
```

**Step 8: Add receiveShadow to HallFloor**

In `src/components/three/HallFloor.tsx`, add `receiveShadow` to the mesh:

```typescript
<mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[width / 2, 0, length / 2]}>
```

**Step 9: Add castShadow to obstacle meshes**

In each hole model component (e.g., the bumper/obstacle group meshes), add `castShadow` prop. This is done in the shared bumper-creation patterns in the hole model files. Check which meshes are obstacles (bumpers, windmill house, tunnel arch, loop arch) and add `castShadow` to them. Felt surfaces (flat) should NOT cast shadows.

The exact files are the 7 hole model components in `src/components/three/holes/`:
- `StraightHole.tsx`, `LShapeHole.tsx`, `DoglegHole.tsx`, `RampHole.tsx`, `LoopHole.tsx`, `WindmillHole.tsx`, `TunnelHole.tsx`

For each, add `castShadow` to meshes that use `bumperMaterial` or obstacle meshes. Do NOT add to felt surfaces.

**Step 10: Run type check + build**

Run: `cd /mnt/c/Users/Caus/Golf_Plan/golf-planner && export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)" && npx tsc --noEmit && npm run build`

Expected: No TS errors. Build succeeds. Bloom chunk lazy-loaded.

**Step 11: Run all tests**

Run: `cd /mnt/c/Users/Caus/Golf_Plan/golf-planner && export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)" && npx vitest run`

Expected: ALL PASS

**Step 12: Commit**

```bash
cd /mnt/c/Users/Caus/Golf_Plan/golf-planner && git add -A && git commit -m "feat: 3D visual overhaul — shadows, UV bloom/fog/vignette, material PBR presets"
```

---

### Task 3: Financial Quick Wins (Inflation Wiring + Quote Expiry)

**Files:**
- Modify: `src/utils/financial.ts` — add `inflatedEstimate` function
- Modify: `src/types/budget.ts` — add QuoteInfo type, extend BudgetCategoryV2
- Modify: `src/types/index.ts` — re-export QuoteInfo
- Modify: `src/components/ui/BudgetPanel.tsx` — show inflation adjustment, quote badges
- Modify: `src/store/selectors.ts:69-81` — inflation-aware subtotal
- Test: `tests/utils/financial.test.ts` (create) — test inflatedEstimate
- Test: `tests/utils/budgetSelectors.test.ts` — test inflation in subtotal

**Step 1: Add QuoteInfo type**

In `src/types/budget.ts`, add after the `UncertaintyParams` type (after line 37):

```typescript
export type QuoteInfo = {
	vendor: string;
	quoteDate: string;
	validUntil: string;
	quoteRef: string;
	isBinding: boolean;
};
```

Extend `BudgetCategoryV2` (add after `phase` field on line 49):

```typescript
export type BudgetCategoryV2 = {
	id: string;
	name: string;
	estimatedNet: number;
	notes: string;
	manualOverride?: boolean;
	vatProfile: VatProfile;
	confidenceTier: ConfidenceTier;
	uncertainty: UncertaintyParams;
	mandatory: boolean;
	phase: ConstructionPhase;
	quote?: QuoteInfo;
};
```

Re-export `QuoteInfo` from `src/types/index.ts`:

```typescript
export type {
	// ... existing exports
	QuoteInfo,
	// ...
} from "./budget";
```

**Step 2: Add inflatedEstimate to financial.ts**

Add to `src/utils/financial.ts` after the `formatEur` function (after line 42):

```typescript
/** Apply inflation factor to non-fixed categories */
export function inflatedEstimate(
	estimatedNet: number,
	tier: ConfidenceTier,
	factor: number,
): number {
	if (tier === "fixed") return estimatedNet;
	return roundEur(estimatedNet * factor);
}
```

**Step 3: Write failing test for inflatedEstimate**

Create `tests/utils/financial.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { inflatedEstimate, roundEur } from "../../src/utils/financial";

describe("inflatedEstimate", () => {
	it("returns original amount for fixed tier", () => {
		expect(inflatedEstimate(90000, "fixed", 1.05)).toBe(90000);
	});

	it("applies inflation factor for non-fixed tiers", () => {
		expect(inflatedEstimate(10000, "medium", 1.025)).toBe(
			roundEur(10000 * 1.025),
		);
	});

	it("returns original when factor is 1.0", () => {
		expect(inflatedEstimate(10000, "high", 1.0)).toBe(10000);
	});

	it("handles all non-fixed tiers", () => {
		for (const tier of ["low", "medium", "high", "very_high"] as const) {
			const result = inflatedEstimate(1000, tier, 1.1);
			expect(result).toBe(roundEur(1000 * 1.1));
		}
	});
});
```

**Step 4: Run test to verify it fails**

Run: `cd /mnt/c/Users/Caus/Golf_Plan/golf-planner && export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)" && npx vitest run tests/utils/financial.test.ts`

Expected: FAIL — `inflatedEstimate` not exported yet.

**Step 5: Implement inflatedEstimate (already defined in Step 2)**

After implementing, run test again:

Run: `cd /mnt/c/Users/Caus/Golf_Plan/golf-planner && export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)" && npx vitest run tests/utils/financial.test.ts`

Expected: PASS

**Step 6: Update BudgetPanel to show inflation adjustment**

In `src/components/ui/BudgetPanel.tsx`:

Add import:
```typescript
import { inflatedEstimate } from "../../utils/financial";
```

After `subtotalNet` calculation (around line 57), add:

```typescript
const { inflationFactor } = financialSettings;
const hasInflation = inflationFactor > 1.0;
const inflationPct = Math.round((inflationFactor - 1) * 100);

// Compute inflated subtotal
const inflatedSubtotalNet = hasInflation
	? roundEur(
			Object.values(budget).reduce((sum, cat) => {
				const net =
					cat.id === COURSE_CATEGORY_ID ? courseCost : cat.estimatedNet;
				return sum + inflatedEstimate(net, cat.confidenceTier, inflationFactor);
			}, 0),
		)
	: subtotalNet;
```

Add `roundEur` to imports from `../../utils/financial`.

In the summary header, after the "Subtotal (net)" display (line 175-179), add:

```typescript
{hasInflation && (
	<div className="flex items-baseline justify-between">
		<span className="text-xs text-amber-600">
			Inflated (+{inflationPct}%)
		</span>
		<span className="text-xs font-medium text-amber-600">
			{displayEur(inflatedSubtotalNet)}
		</span>
	</div>
)}
```

**Step 7: Add quote expiry badge helper**

Add to `BudgetPanel.tsx` (before the component):

```typescript
function quoteStatusBadge(quote: QuoteInfo | undefined): {
	label: string;
	className: string;
} | null {
	if (!quote) return null;

	const now = new Date();
	const validUntil = new Date(quote.validUntil);
	const daysRemaining = Math.ceil(
		(validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
	);

	if (daysRemaining < 0) {
		return {
			label: `Expired ${Math.abs(daysRemaining)}d ago`,
			className: "bg-red-100 text-red-700",
		};
	}
	if (daysRemaining <= 14) {
		return {
			label: `Expires in ${daysRemaining}d`,
			className: "bg-amber-100 text-amber-700",
		};
	}
	return {
		label: "Quoted",
		className: "bg-green-100 text-green-700",
	};
}
```

Add import for QuoteInfo:
```typescript
import type { ConfidenceTier, QuoteInfo } from "../../types/budget";
```

In the category card header (around line 251, after the confidence tier badge), add:

```typescript
{(() => {
	const badge = quoteStatusBadge(cat.quote);
	if (!badge) return null;
	return (
		<span
			className={`rounded px-1 py-0.5 text-[9px] font-medium ${badge.className}`}
		>
			{badge.label}
		</span>
	);
})()}
```

**Step 8: Pre-seed BORGA hall category with quote**

In `src/constants/budget.ts`, update the `hall` category in `DEFAULT_BUDGET_CATEGORIES_V2` (around line 184):

```typescript
{
	id: "hall",
	name: "BORGA Hall",
	estimatedNet: 90000,
	notes: "BORGA offer Nr. 015-659208. Fixed-price turnkey.",
	vatProfile: "standard_20",
	confidenceTier: "fixed",
	uncertainty: { min: 88200, mode: 90000, max: 91800 },
	mandatory: true,
	phase: "construction",
	quote: {
		vendor: "BORGA Stahlhallen",
		quoteDate: "2026-02-15",
		validUntil: "2026-03-17",
		quoteRef: "015-659208",
		isBinding: true,
	},
},
```

**Step 9: Run all tests**

Run: `cd /mnt/c/Users/Caus/Golf_Plan/golf-planner && export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)" && npx vitest run`

Expected: ALL PASS

**Step 10: Type check**

Run: `cd /mnt/c/Users/Caus/Golf_Plan/golf-planner && export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)" && npx tsc --noEmit`

Expected: No errors

**Step 11: Commit**

```bash
cd /mnt/c/Users/Caus/Golf_Plan/golf-planner && git add src/types/budget.ts src/types/index.ts src/utils/financial.ts src/components/ui/BudgetPanel.tsx src/constants/budget.ts tests/utils/financial.test.ts && git commit -m "feat: wire inflation factor to display + add quote expiry tracking"
```

---

### Task 4: SVG Floor Plan Export

**Files:**
- Create: `src/utils/floorPlanExport.ts` — SVG generation
- Test: `tests/utils/floorPlanExport.test.ts` — SVG generation tests
- Modify: `src/components/ui/Toolbar.tsx` — add "Floor Plan" export button
- Modify: `src/components/ui/BottomToolbar.tsx` — add mobile floor plan button (optional)

**Step 1: Write failing tests for SVG generation**

Create `tests/utils/floorPlanExport.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { generateFloorPlanSVG } from "../../src/utils/floorPlanExport";
import type { Hole } from "../../src/types";

describe("generateFloorPlanSVG", () => {
	const hall = { width: 10, length: 20 };

	it("returns a valid SVG string", () => {
		const svg = generateFloorPlanSVG(hall, {}, []);
		expect(svg).toContain("<svg");
		expect(svg).toContain("</svg>");
	});

	it("includes hall boundary with correct dimensions", () => {
		const svg = generateFloorPlanSVG(hall, {}, []);
		// 50px per metre: width=500, height=1000
		expect(svg).toContain('width="500"');
		expect(svg).toContain('height="1000"');
		expect(svg).toContain("10.0m");
		expect(svg).toContain("20.0m");
	});

	it("renders placed holes with type labels", () => {
		const holes: Record<string, Hole> = {
			h1: {
				id: "h1",
				type: "straight",
				position: { x: 2, z: 5 },
				rotation: 0,
				name: "Hole 1",
				par: 2,
			},
		};

		const svg = generateFloorPlanSVG(hall, holes, ["h1"]);
		expect(svg).toContain("Straight");
		expect(svg).toContain("#1");
	});

	it("renders flow path as dashed polyline", () => {
		const holes: Record<string, Hole> = {
			h1: {
				id: "h1",
				type: "straight",
				position: { x: 2, z: 5 },
				rotation: 0,
				name: "Hole 1",
				par: 2,
			},
			h2: {
				id: "h2",
				type: "ramp",
				position: { x: 5, z: 10 },
				rotation: 0,
				name: "Hole 2",
				par: 3,
			},
		};

		const svg = generateFloorPlanSVG(hall, holes, ["h1", "h2"]);
		expect(svg).toContain("stroke-dasharray");
		expect(svg).toContain("<polyline");
	});

	it("includes scale bar", () => {
		const svg = generateFloorPlanSVG(hall, {}, []);
		expect(svg).toContain("1m");
	});

	it("applies rotation to holes", () => {
		const holes: Record<string, Hole> = {
			h1: {
				id: "h1",
				type: "straight",
				position: { x: 3, z: 4 },
				rotation: 90,
				name: "Hole 1",
				par: 2,
			},
		};

		const svg = generateFloorPlanSVG(hall, holes, ["h1"]);
		expect(svg).toContain("rotate(90");
	});
});
```

**Step 2: Run tests to verify they fail**

Run: `cd /mnt/c/Users/Caus/Golf_Plan/golf-planner && export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)" && npx vitest run tests/utils/floorPlanExport.test.ts`

Expected: FAIL — module not found

**Step 3: Implement generateFloorPlanSVG**

Create `src/utils/floorPlanExport.ts`:

```typescript
import { HOLE_TYPE_MAP } from "../constants/holeTypes";
import type { Hole } from "../types";

const PX_PER_M = 50;
const MARGIN = 40;
const HOLE_COLORS: Record<string, string> = {
	straight: "#4CAF50",
	"l-shape": "#2196F3",
	dogleg: "#FF9800",
	ramp: "#9C27B0",
	loop: "#00BCD4",
	windmill: "#E91E63",
	tunnel: "#607D8B",
};

export function generateFloorPlanSVG(
	hall: { width: number; length: number },
	holes: Record<string, Hole>,
	holeOrder: string[],
): string {
	const hallW = hall.width * PX_PER_M;
	const hallH = hall.length * PX_PER_M;
	const svgW = hallW + MARGIN * 2;
	const svgH = hallH + MARGIN * 2 + 30; // extra for scale bar

	const lines: string[] = [];

	lines.push(
		`<svg xmlns="http://www.w3.org/2000/svg" width="${hallW}" height="${hallH}" viewBox="0 0 ${svgW} ${svgH}">`,
	);
	lines.push(
		`<style>text{font-family:Arial,sans-serif}rect,line,polyline{shape-rendering:crispEdges}</style>`,
	);

	// Background
	lines.push(`<rect width="${svgW}" height="${svgH}" fill="#f8f8f8"/>`);

	// Hall boundary
	lines.push(
		`<rect x="${MARGIN}" y="${MARGIN}" width="${hallW}" height="${hallH}" fill="#e0e0e0" stroke="#333" stroke-width="2"/>`,
	);

	// Dimension labels
	lines.push(
		`<text x="${MARGIN + hallW / 2}" y="${MARGIN - 10}" text-anchor="middle" font-size="12" fill="#333">${hall.width.toFixed(1)}m</text>`,
	);
	lines.push(
		`<text x="${MARGIN - 10}" y="${MARGIN + hallH / 2}" text-anchor="middle" font-size="12" fill="#333" transform="rotate(-90,${MARGIN - 10},${MARGIN + hallH / 2})">${hall.length.toFixed(1)}m</text>`,
	);

	// Holes
	const orderedHoles = holeOrder
		.map((id) => holes[id])
		.filter(Boolean);

	// Flow path (dashed polyline)
	if (orderedHoles.length >= 2) {
		const points = orderedHoles
			.map((h) => {
				const def = HOLE_TYPE_MAP[h.type];
				const cx = MARGIN + h.position.x * PX_PER_M;
				const cy = MARGIN + h.position.z * PX_PER_M;
				return `${cx},${cy}`;
			})
			.join(" ");
		lines.push(
			`<polyline points="${points}" fill="none" stroke="#999" stroke-width="1" stroke-dasharray="6,4"/>`,
		);
	}

	// Hole rectangles
	for (let i = 0; i < orderedHoles.length; i++) {
		const hole = orderedHoles[i];
		const def = HOLE_TYPE_MAP[hole.type];
		if (!def) continue;

		const cx = MARGIN + hole.position.x * PX_PER_M;
		const cy = MARGIN + hole.position.z * PX_PER_M;
		const w = def.dimensions.width * PX_PER_M;
		const h = def.dimensions.length * PX_PER_M;
		const color = HOLE_COLORS[hole.type] ?? "#888";

		lines.push(`<g transform="translate(${cx},${cy}) rotate(${hole.rotation})">`);
		lines.push(
			`<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="${color}" fill-opacity="0.3" stroke="${color}" stroke-width="1.5" rx="2"/>`,
		);
		lines.push(
			`<text x="0" y="-4" text-anchor="middle" font-size="10" font-weight="bold" fill="#333">#${i + 1}</text>`,
		);
		lines.push(
			`<text x="0" y="8" text-anchor="middle" font-size="8" fill="#555">${def.label}</text>`,
		);
		lines.push(
			`<text x="0" y="${h / 2 - 4}" text-anchor="middle" font-size="7" fill="#777">${def.dimensions.width}×${def.dimensions.length}m</text>`,
		);
		lines.push(`</g>`);
	}

	// Scale bar
	const scaleY = MARGIN + hallH + 20;
	const scaleBarPx = PX_PER_M;
	lines.push(
		`<line x1="${MARGIN}" y1="${scaleY}" x2="${MARGIN + scaleBarPx}" y2="${scaleY}" stroke="#333" stroke-width="2"/>`,
	);
	lines.push(
		`<line x1="${MARGIN}" y1="${scaleY - 4}" x2="${MARGIN}" y2="${scaleY + 4}" stroke="#333" stroke-width="2"/>`,
	);
	lines.push(
		`<line x1="${MARGIN + scaleBarPx}" y1="${scaleY - 4}" x2="${MARGIN + scaleBarPx}" y2="${scaleY + 4}" stroke="#333" stroke-width="2"/>`,
	);
	lines.push(
		`<text x="${MARGIN + scaleBarPx / 2}" y="${scaleY + 14}" text-anchor="middle" font-size="10" fill="#333">1m</text>`,
	);

	lines.push(`</svg>`);

	return lines.join("\n");
}

export function downloadSVG(svgContent: string): void {
	const blob = new Blob([svgContent], { type: "image/svg+xml" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `floor-plan-${new Date().toISOString().split("T")[0]}.svg`;
	a.click();
	URL.revokeObjectURL(url);
}
```

**Step 4: Run tests to verify they pass**

Run: `cd /mnt/c/Users/Caus/Golf_Plan/golf-planner && export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)" && npx vitest run tests/utils/floorPlanExport.test.ts`

Expected: PASS

**Step 5: Add Floor Plan export button to Toolbar**

In `src/components/ui/Toolbar.tsx`, add import and handler:

```typescript
import { useStore } from "../../store";
import { HOLE_TYPE_MAP } from "../../constants/holeTypes";
import { downloadSVG, generateFloorPlanSVG } from "../../utils/floorPlanExport";
```

Add handler inside the Toolbar component:

```typescript
const holes = useStore((s) => s.holes);
const holeOrder = useStore((s) => s.holeOrder);
const hall = useStore((s) => s.hall);

function handleFloorPlanExport() {
	const svg = generateFloorPlanSVG(
		{ width: hall.width, length: hall.length },
		holes,
		holeOrder,
	);
	downloadSVG(svg);
}
```

Add a button in the `ml-auto` div (line 149), before SaveManager:

```typescript
<div className="ml-auto flex items-center gap-1">
	<button
		type="button"
		onClick={handleFloorPlanExport}
		className={neutralBtnClass}
		title="Export floor plan as SVG"
	>
		SVG
	</button>
	<SaveManager />
	<ExportButton />
</div>
```

**Step 6: Run all tests + type check**

Run: `cd /mnt/c/Users/Caus/Golf_Plan/golf-planner && export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)" && npx vitest run && npx tsc --noEmit`

Expected: ALL PASS, no TS errors

**Step 7: Commit**

```bash
cd /mnt/c/Users/Caus/Golf_Plan/golf-planner && git add src/utils/floorPlanExport.ts tests/utils/floorPlanExport.test.ts src/components/ui/Toolbar.tsx && git commit -m "feat: SVG floor plan export with hole positions, flow path, and scale bar"
```

---

### Task 5: Code-Splitting

**Files:**
- Modify: `vite.config.ts` — add `manualChunks`
- Modify: `src/App.tsx` — lazy-load Canvas content
- Create: `src/components/three/ThreeCanvas.tsx` — extracted Canvas internals
- Create: `src/components/ui/CanvasSkeleton.tsx` — loading placeholder

**Step 1: Add manualChunks to Vite config**

In `vite.config.ts`, add `build` section:

```typescript
export default defineConfig({
	plugins: [
		// ... existing plugins
	],
	build: {
		rollupOptions: {
			output: {
				manualChunks: {
					"vendor-three": ["three", "@react-three/fiber", "@react-three/drei"],
					"vendor-react": ["react", "react-dom"],
					"vendor-state": ["zustand", "zundo"],
				},
			},
		},
	},
	server: {
		// ... existing server config
	},
});
```

**Step 2: Extract Canvas internals into ThreeCanvas**

Create `src/components/three/ThreeCanvas.tsx`:

```typescript
import type { SunData } from "../../hooks/useSunPosition";
import { useStore } from "../../store";
import { isMobile } from "../../utils/isMobile";
import { CameraControls } from "./CameraControls";
import { FloorGrid } from "./FloorGrid";
import { FlowPath } from "./FlowPath";
import { Hall } from "./Hall";
import { PlacedHoles } from "./PlacedHoles";
import { PlacementHandler } from "./PlacementHandler";
import { SunIndicator } from "./SunIndicator";
import { UVEffects } from "./UVEffects";

type Props = {
	sunData?: SunData;
};

export default function ThreeCanvas({ sunData }: Props) {
	const uvMode = useStore((s) => s.ui.uvMode);

	return (
		<>
			{uvMode && <fog attach="fog" args={["#0A0A1A", 8, 25]} />}
			<ambientLight
				color={uvMode ? "#220044" : "#ffffff"}
				intensity={uvMode ? 0.3 : 0.8}
			/>
			{uvMode ? (
				<directionalLight
					position={[10, 20, 5]}
					color="#6600CC"
					intensity={0.4}
				/>
			) : (
				<directionalLight
					position={
						sunData
							? [
									-Math.sin(sunData.azimuth) *
										Math.cos(sunData.altitude) *
										30 +
										5,
									Math.sin(sunData.altitude) * 30,
									Math.cos(sunData.azimuth) *
										Math.cos(sunData.altitude) *
										30 +
										10,
								]
							: [10, 20, 5]
					}
					color="#ffffff"
					intensity={0.5}
					castShadow
					shadow-mapSize-width={isMobile ? 512 : 1024}
					shadow-mapSize-height={isMobile ? 512 : 1024}
					shadow-camera-left={-12}
					shadow-camera-right={12}
					shadow-camera-top={25}
					shadow-camera-bottom={-15}
					shadow-bias={-0.001}
				/>
			)}
			<CameraControls />
			<FloorGrid />
			<Hall sunData={sunData} />
			<PlacementHandler />
			<PlacedHoles />
			<FlowPath />
			<SunIndicator sunData={sunData} />
			<UVEffects />
		</>
	);
}
```

**Step 3: Create CanvasSkeleton**

Create `src/components/ui/CanvasSkeleton.tsx`:

```typescript
export function CanvasSkeleton() {
	return (
		<div className="flex h-full w-full items-center justify-center bg-gray-100">
			<div className="flex flex-col items-center gap-2">
				<div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
				<span className="text-xs text-gray-400">Loading 3D view...</span>
			</div>
		</div>
	);
}
```

**Step 4: Update App.tsx to use lazy Canvas**

Replace the Canvas section in `src/App.tsx`:

```typescript
import { Canvas } from "@react-three/fiber";
import { Suspense, lazy, useEffect } from "react";
// ... other imports stay

// Remove individual Three component imports (CameraControls, FloorGrid, etc.)
// Add:
import { CanvasSkeleton } from "./components/ui/CanvasSkeleton";

const ThreeCanvas = lazy(
	() => import("./components/three/ThreeCanvas"),
);

// In JSX, replace the <Canvas> block with:
<Canvas
	dpr={isMobile ? [1, 1.5] : [1, 2]}
	frameloop="demand"
	gl={{ antialias: !isMobile, preserveDrawingBuffer: true }}
	shadows={uvMode ? false : "soft"}
>
	<Suspense fallback={null}>
		<ThreeCanvas sunData={sunData} />
	</Suspense>
</Canvas>
```

Note: The `<Suspense>` wraps the lazy-loaded content inside Canvas. The `<CanvasSkeleton>` should be used outside Canvas as a fallback for the entire canvas area if needed. Since `<Canvas>` itself mounts immediately (just the R3F context), the inner `<Suspense>` handles the lazy content.

**Step 5: Build and verify chunk splitting**

Run: `cd /mnt/c/Users/Caus/Golf_Plan/golf-planner && export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)" && npm run build 2>&1 | tail -30`

Expected: Multiple chunks in output — `vendor-three`, `vendor-react`, `vendor-state`, main app chunk. No single chunk > 1000KB.

**Step 6: Run all tests**

Run: `cd /mnt/c/Users/Caus/Golf_Plan/golf-planner && export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)" && npx vitest run`

Expected: ALL PASS

**Step 7: Commit**

```bash
cd /mnt/c/Users/Caus/Golf_Plan/golf-planner && git add vite.config.ts src/App.tsx src/components/three/ThreeCanvas.tsx src/components/ui/CanvasSkeleton.tsx && git commit -m "feat: code-split Three.js, React, Zustand into separate vendor chunks"
```

---

### Task 6: Screenshot Export

**Files:**
- Modify: `src/store/store.ts` — add captureScreenshot callback + registerScreenshotCapture action
- Create: `src/components/three/ScreenshotCapture.tsx` — register capture function
- Modify: `src/components/three/ThreeCanvas.tsx` — include ScreenshotCapture
- Modify: `src/components/ui/Toolbar.tsx` — add screenshot button

**Step 1: Add screenshot state to store**

In `src/store/store.ts`:

Add to `StoreState` (after `ui: UIState`):

```typescript
captureScreenshot: (() => void) | null;
```

Add to `StoreActions`:

```typescript
registerScreenshotCapture: (fn: () => void) => void;
```

Add to the store initializer (after `ui: DEFAULT_UI`):

```typescript
captureScreenshot: null,
```

Add action (after `updateCategoryTier`):

```typescript
registerScreenshotCapture: (fn) =>
	set({ captureScreenshot: fn }),
```

Exclude `captureScreenshot` from persist `partialize` — it's already excluded since `partialize` only includes `holes`, `holeOrder`, `budget`, `budgetConfig`, `financialSettings`, `expenses`. No change needed.

Also exclude from temporal `partialize` — no change needed since temporal only tracks `holes`, `holeOrder`, `selectedId`.

**Step 2: Create ScreenshotCapture component**

Create `src/components/three/ScreenshotCapture.tsx`:

```typescript
import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { useStore } from "../../store";

export function ScreenshotCapture() {
	const { gl, scene, camera } = useThree();
	const register = useStore((s) => s.registerScreenshotCapture);

	useEffect(() => {
		register(() => {
			const dpr = gl.getPixelRatio();
			gl.setPixelRatio(Math.min(window.devicePixelRatio * 2, 4));
			gl.render(scene, camera);
			gl.domElement.toBlob(
				(blob) => {
					if (blob) {
						const url = URL.createObjectURL(blob);
						const a = document.createElement("a");
						a.href = url;
						a.download = `golf-plan-${Date.now()}.png`;
						a.click();
						URL.revokeObjectURL(url);
					} else {
						const dataUrl = gl.domElement.toDataURL("image/png");
						const a = document.createElement("a");
						a.href = dataUrl;
						a.download = `golf-plan-${Date.now()}.png`;
						a.click();
					}
					gl.setPixelRatio(dpr);
				},
				"image/png",
			);
		});
	}, [gl, scene, camera, register]);

	return null;
}
```

**Step 3: Add ScreenshotCapture to ThreeCanvas**

In `src/components/three/ThreeCanvas.tsx`, add:

```typescript
import { ScreenshotCapture } from "./ScreenshotCapture";

// Add at end of JSX, before </>:
<ScreenshotCapture />
```

**Step 4: Add screenshot button to Toolbar**

In `src/components/ui/Toolbar.tsx`:

```typescript
const captureScreenshot = useStore((s) => s.captureScreenshot);

// In the ml-auto div, add before SVG button:
<button
	type="button"
	onClick={() => captureScreenshot?.()}
	className={neutralBtnClass}
	title="Capture screenshot"
	disabled={!captureScreenshot}
>
	&#x1F4F7;
</button>
```

Note: The camera emoji (&#x1F4F7;) renders as a camera icon. If the user prefers no emoji in code, use "Screenshot" text or a simple unicode char.

**Step 5: Type check + build**

Run: `cd /mnt/c/Users/Caus/Golf_Plan/golf-planner && export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)" && npx tsc --noEmit && npm run build`

Expected: No errors. Build succeeds.

**Step 6: Run all tests**

Run: `cd /mnt/c/Users/Caus/Golf_Plan/golf-planner && export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)" && npx vitest run`

Expected: ALL PASS

**Step 7: Commit**

```bash
cd /mnt/c/Users/Caus/Golf_Plan/golf-planner && git add src/store/store.ts src/components/three/ScreenshotCapture.tsx src/components/three/ThreeCanvas.tsx src/components/ui/Toolbar.tsx && git commit -m "feat: add screenshot export capturing 3D view including UV bloom effects"
```

---

## Final Verification

After all 6 tasks:

1. Run full test suite: `npx vitest run` — all pass
2. Run type check: `npx tsc --noEmit` — no errors
3. Run lint: `npx biome check src/` — no new errors
4. Build: `npm run build` — succeeds with multiple chunks, no single chunk > 700KB
5. Push: `git push origin master`

## File Change Summary

| Action | File |
|--------|------|
| Modify | `src/types/budget.ts` — MaterialProfile, QuoteInfo types |
| Modify | `src/types/index.ts` — re-export new types |
| Modify | `src/constants/budget.ts` — MATERIAL_PROFILE_MULTIPLIERS, BORGA quote |
| Modify | `src/store/selectors.ts` — material multiplier in course cost |
| Modify | `src/store/store.ts` — v5 migration, screenshot capture |
| Modify | `src/utils/exportLayout.ts` — v5 export |
| Modify | `src/utils/financial.ts` — inflatedEstimate |
| Create | `src/utils/floorPlanExport.ts` — SVG generation |
| Modify | `src/App.tsx` — lazy Canvas, shadows |
| Create | `src/components/three/ThreeCanvas.tsx` — extracted Canvas content |
| Create | `src/components/three/UVPostProcessing.tsx` — Bloom + Vignette |
| Create | `src/components/three/UVEffects.tsx` — lazy wrapper |
| Create | `src/components/three/ScreenshotCapture.tsx` — screenshot |
| Create | `src/components/three/holes/materialPresets.ts` — PBR presets |
| Modify | `src/components/three/holes/shared.ts` — bump emissiveIntensity |
| Modify | `src/components/three/holes/useMaterials.ts` — profile-aware |
| Modify | `src/components/three/HallFloor.tsx` — receiveShadow |
| Modify | `src/components/ui/Toolbar.tsx` — SVG + screenshot buttons |
| Modify | `src/components/ui/CostSettingsModal.tsx` — material dropdown |
| Modify | `src/components/ui/BudgetPanel.tsx` — inflation + quote badges |
| Create | `src/components/ui/CanvasSkeleton.tsx` — loading placeholder |
| Modify | `vite.config.ts` — manualChunks |
| Create | `tests/utils/financial.test.ts` |
| Create | `tests/utils/floorPlanExport.test.ts` |
| Modify | `tests/utils/budgetSelectors.test.ts` |
| Modify | `tests/utils/exportLayout.test.ts` |
