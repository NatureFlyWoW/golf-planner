# Task 1: Types, Constants, and VAT Utilities

**Goal:** Define the v4 data model types, extend budget constants with new categories and confidence tiers, and implement VAT utility functions with tests.

**Files:**
- Modify: `src/types/budget.ts` (currently 13 lines — rewrite with v2 types)
- Modify: `src/constants/budget.ts` (currently 129 lines — add new categories, tiers, DIY costs)
- Create: `src/utils/financial.ts` (VAT and rounding utilities)
- Create: `src/utils/__tests__/financial.test.ts` (tests for utilities)

---

## Step 1: Extend budget types

Modify `src/types/budget.ts`. Keep the existing types for backward compat and add v2 types:

```typescript
// === Existing types (preserved for migration) ===

export type BudgetCategory = {
	id: string;
	name: string;
	estimated: number;
	actual: number;
	notes: string;
	manualOverride?: boolean;
};

export type BudgetConfig = {
	costPerType: Record<string, number>;
};

// === V2 types (Phase 8) ===

export type VatProfile = "standard_20" | "exempt";

export type ConfidenceTier = "fixed" | "low" | "medium" | "high" | "very_high";

export type ConstructionPhase =
	| "pre-construction"
	| "construction"
	| "fit-out"
	| "commissioning"
	| "ongoing";

export type RiskTolerance = "optimistic" | "balanced" | "conservative";

export type BuildMode = "diy" | "professional" | "mixed";

export type UncertaintyParams = {
	min: number;
	mode: number;
	max: number;
};

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
};

export type ExpenseEntry = {
	id: string;
	categoryId: string;
	date: string;
	amount: number;
	vendor: string;
	note: string;
};

export type FinancialSettings = {
	vatRegistered: boolean;
	displayMode: "net" | "gross" | "both";
	inflationFactor: number;
	riskTolerance: RiskTolerance;
	buildMode: BuildMode;
};

export type BudgetConfigV2 = {
	costPerType: Record<string, number>;
	costPerTypeDiy: Record<string, number>;
};
```

## Step 2: Create VAT utility functions

Create `src/utils/financial.ts`:

```typescript
import type { ConfidenceTier, RiskTolerance, VatProfile } from "../types/budget";

export function roundEur(n: number): number {
	return Math.round(n * 100) / 100;
}

export function netToGross(net: number, profile: VatProfile): number {
	return profile === "standard_20" ? roundEur(net * 1.2) : net;
}

export function grossToNet(gross: number, profile: VatProfile): number {
	return profile === "standard_20" ? roundEur(gross / 1.2) : gross;
}

export function effectiveCost(
	net: number,
	profile: VatProfile,
	vatRegistered: boolean,
): number {
	return vatRegistered ? net : netToGross(net, profile);
}

export function reclaimableVat(
	net: number,
	profile: VatProfile,
	vatRegistered: boolean,
): number {
	if (!vatRegistered || profile === "exempt") return 0;
	return roundEur(net * 0.2);
}

export function formatEur(n: number): string {
	return n.toLocaleString("de-AT", {
		style: "currency",
		currency: "EUR",
		maximumFractionDigits: 0,
	});
}

/** Risk multiplier per confidence tier at the given tolerance level */
const RISK_MULTIPLIERS: Record<ConfidenceTier, number> = {
	fixed: 1.02,
	low: 1.1,
	medium: 1.15,
	high: 1.25,
	very_high: 1.4,
};

const TOLERANCE_SCALE: Record<RiskTolerance, number> = {
	optimistic: 0.6,
	balanced: 1.0,
	conservative: 1.6,
};

export function riskBuffer(
	estimatedNet: number,
	tier: ConfidenceTier,
	tolerance: RiskTolerance,
): number {
	const base = estimatedNet * (RISK_MULTIPLIERS[tier] - 1.0);
	return roundEur(base * TOLERANCE_SCALE[tolerance]);
}

/** Auto-generate min/mode/max from mode and confidence tier */
const TIER_SPREAD: Record<ConfidenceTier, { minMult: number; maxMult: number }> = {
	fixed: { minMult: 0.98, maxMult: 1.02 },
	low: { minMult: 0.9, maxMult: 1.15 },
	medium: { minMult: 0.8, maxMult: 1.3 },
	high: { minMult: 0.6, maxMult: 1.6 },
	very_high: { minMult: 0.5, maxMult: 2.0 },
};

export function uncertaintyFromTier(
	mode: number,
	tier: ConfidenceTier,
): { min: number; mode: number; max: number } {
	const spread = TIER_SPREAD[tier];
	return {
		min: roundEur(mode * spread.minMult),
		mode,
		max: roundEur(mode * spread.maxMult),
	};
}
```

## Step 3: Write tests for financial utilities

Create `src/utils/__tests__/financial.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import {
	effectiveCost,
	formatEur,
	grossToNet,
	netToGross,
	reclaimableVat,
	riskBuffer,
	roundEur,
	uncertaintyFromTier,
} from "../financial";

describe("roundEur", () => {
	it("rounds to 2 decimal places", () => {
		expect(roundEur(1.005)).toBe(1.01);
		expect(roundEur(1.004)).toBe(1);
		expect(roundEur(100.999)).toBe(101);
	});

	it("handles whole numbers", () => {
		expect(roundEur(90000)).toBe(90000);
	});
});

describe("netToGross", () => {
	it("applies 20% for standard_20", () => {
		expect(netToGross(90000, "standard_20")).toBe(108000);
		expect(netToGross(100, "standard_20")).toBe(120);
	});

	it("returns same value for exempt", () => {
		expect(netToGross(9500, "exempt")).toBe(9500);
	});
});

describe("grossToNet", () => {
	it("removes 20% for standard_20", () => {
		expect(grossToNet(108000, "standard_20")).toBe(90000);
		expect(grossToNet(120, "standard_20")).toBe(100);
	});

	it("returns same value for exempt", () => {
		expect(grossToNet(9500, "exempt")).toBe(9500);
	});
});

describe("effectiveCost", () => {
	it("returns net when VAT registered", () => {
		expect(effectiveCost(90000, "standard_20", true)).toBe(90000);
	});

	it("returns gross when not VAT registered", () => {
		expect(effectiveCost(90000, "standard_20", false)).toBe(108000);
	});

	it("returns same for exempt regardless", () => {
		expect(effectiveCost(9500, "exempt", true)).toBe(9500);
		expect(effectiveCost(9500, "exempt", false)).toBe(9500);
	});
});

describe("reclaimableVat", () => {
	it("returns 20% of net when registered and standard", () => {
		expect(reclaimableVat(90000, "standard_20", true)).toBe(18000);
	});

	it("returns 0 when not registered", () => {
		expect(reclaimableVat(90000, "standard_20", false)).toBe(0);
	});

	it("returns 0 for exempt categories", () => {
		expect(reclaimableVat(9500, "exempt", true)).toBe(0);
	});
});

describe("riskBuffer", () => {
	it("returns near-zero for fixed tier", () => {
		expect(riskBuffer(90000, "fixed", "balanced")).toBe(1800);
	});

	it("returns higher buffer for very_high tier", () => {
		expect(riskBuffer(12500, "very_high", "balanced")).toBe(5000);
	});

	it("scales with tolerance", () => {
		const balanced = riskBuffer(10000, "medium", "balanced");
		const conservative = riskBuffer(10000, "medium", "conservative");
		expect(conservative).toBeGreaterThan(balanced);
	});

	it("optimistic returns lower buffer", () => {
		const optimistic = riskBuffer(10000, "medium", "optimistic");
		const balanced = riskBuffer(10000, "medium", "balanced");
		expect(optimistic).toBeLessThan(balanced);
	});
});

describe("uncertaintyFromTier", () => {
	it("generates tight range for fixed tier", () => {
		const u = uncertaintyFromTier(108000, "fixed");
		expect(u.min).toBe(105840);
		expect(u.mode).toBe(108000);
		expect(u.max).toBe(110160);
	});

	it("generates wide range for very_high tier", () => {
		const u = uncertaintyFromTier(12500, "very_high");
		expect(u.min).toBe(6250);
		expect(u.mode).toBe(12500);
		expect(u.max).toBe(25000);
	});
});

describe("formatEur", () => {
	it("formats in de-AT locale with EUR symbol", () => {
		const result = formatEur(108000);
		// de-AT format: € 108.000 (may vary by runtime)
		expect(result).toContain("108");
		expect(result).toContain("€");
	});
});
```

## Step 4: Run tests to verify they pass

```bash
cd golf-planner && npm run test -- --run src/utils/__tests__/financial.test.ts
```

Expected: All tests pass.

## Step 5: Add new budget category constants and tier defaults

Modify `src/constants/budget.ts`. Add after the existing exports:

```typescript
// Add these imports at top:
import type {
	BudgetCategoryV2,
	BudgetConfigV2,
	ConfidenceTier,
	FinancialSettings,
} from "../types/budget";

// Add after DEFAULT_BUDGET_CONFIG:

export const DEFAULT_COST_PER_TYPE_DIY: Record<string, number> = {
	straight: 800,
	"l-shape": 1000,
	dogleg: 1100,
	ramp: 1200,
	loop: 1500,
	windmill: 1800,
	tunnel: 1100,
};

export const DEFAULT_BUDGET_CONFIG_V2: BudgetConfigV2 = {
	costPerType: DEFAULT_COST_PER_TYPE,
	costPerTypeDiy: DEFAULT_COST_PER_TYPE_DIY,
};

export const DEFAULT_FINANCIAL_SETTINGS: FinancialSettings = {
	vatRegistered: false,
	displayMode: "gross",
	inflationFactor: 1.0,
	riskTolerance: "balanced",
	buildMode: "diy",
};

export const DEFAULT_CONFIDENCE_TIERS: Record<string, ConfidenceTier> = {
	hall: "fixed",
	foundation: "high",
	course: "high",
	"uv-lighting": "medium",
	"emergency-lighting": "low",
	"heat-pumps": "medium",
	ventilation: "low",
	electrical: "medium",
	plumbing: "medium",
	"wall-art": "very_high",
	finishing: "high",
	equipment: "high",
	"fire-safety": "low",
	permits: "medium",
	insurance: "fixed",
	"lightning-protection": "medium",
	"grid-connection": "medium",
	"water-connection": "medium",
};

// Full v2 category defaults — 18 categories
export const DEFAULT_BUDGET_CATEGORIES_V2: BudgetCategoryV2[] = [
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
	},
	{
		id: "foundation",
		name: "Foundation & earthworks",
		estimatedNet: 20000,
		notes: "Strip foundations + Bodenplatte. Excluded from BORGA offer. Consult BORGA for specs.",
		vatProfile: "standard_20",
		confidenceTier: "high",
		uncertainty: { min: 12000, mode: 20000, max: 32000 },
		mandatory: true,
		phase: "construction",
	},
	{
		id: "course",
		name: "Mini golf course",
		estimatedNet: 0,
		notes: "Auto-calculated from placed holes. Lock to override.",
		manualOverride: false,
		vatProfile: "standard_20",
		confidenceTier: "high",
		uncertainty: { min: 0, mode: 0, max: 0 },
		mandatory: true,
		phase: "fit-out",
	},
	{
		id: "uv-lighting",
		name: "UV lighting system",
		estimatedNet: 4583,
		notes: "Industry mid-range: €5,500–€9,000 for 12–18 holes",
		vatProfile: "standard_20",
		confidenceTier: "medium",
		uncertainty: { min: 3666, mode: 4583, max: 5958 },
		mandatory: false,
		phase: "fit-out",
	},
	{
		id: "emergency-lighting",
		name: "Emergency lighting",
		estimatedNet: 1667,
		notes: "ÖNORM EN 1838: min 1 lux on escape routes, 60 min battery.",
		vatProfile: "standard_20",
		confidenceTier: "low",
		uncertainty: { min: 1500, mode: 1667, max: 1917 },
		mandatory: true,
		phase: "fit-out",
	},
	{
		id: "heat-pumps",
		name: "Heat pumps (heating/cooling)",
		estimatedNet: 8333,
		notes: "2-3 air-to-air split units (Daikin/Mitsubishi).",
		vatProfile: "standard_20",
		confidenceTier: "medium",
		uncertainty: { min: 6666, mode: 8333, max: 10833 },
		mandatory: false,
		phase: "construction",
	},
	{
		id: "ventilation",
		name: "Ventilation with heat recovery",
		estimatedNet: 3750,
		notes: "Essential for blacklight venue (windows blacked out). 900 m³/h for 30 occupants.",
		vatProfile: "standard_20",
		confidenceTier: "low",
		uncertainty: { min: 3375, mode: 3750, max: 4313 },
		mandatory: false,
		phase: "construction",
	},
	{
		id: "electrical",
		name: "Electrical installation",
		estimatedNet: 10417,
		notes: "Industry mid-range: €10,000–€15,000. Licensed Elektrotechniker required.",
		vatProfile: "standard_20",
		confidenceTier: "medium",
		uncertainty: { min: 8334, mode: 10417, max: 13542 },
		mandatory: true,
		phase: "construction",
	},
	{
		id: "plumbing",
		name: "Plumbing & WC facilities",
		estimatedNet: 12500,
		notes: "Min 3 WCs (men, women, accessible). Licensed Installateur required.",
		vatProfile: "standard_20",
		confidenceTier: "medium",
		uncertainty: { min: 10000, mode: 12500, max: 16250 },
		mandatory: true,
		phase: "construction",
	},
	{
		id: "wall-art",
		name: "UV graffiti / wall art",
		estimatedNet: 12500,
		notes: "€150-300/m² for professional UV murals. ~180m² wall area. Highest variance.",
		vatProfile: "standard_20",
		confidenceTier: "very_high",
		uncertainty: { min: 6250, mode: 12500, max: 25000 },
		mandatory: false,
		phase: "commissioning",
	},
	{
		id: "finishing",
		name: "Interior finishing & flooring",
		estimatedNet: 8333,
		notes: "Epoxy floor coating, wall treatment, ceiling paint.",
		vatProfile: "standard_20",
		confidenceTier: "high",
		uncertainty: { min: 5000, mode: 8333, max: 13333 },
		mandatory: false,
		phase: "fit-out",
	},
	{
		id: "equipment",
		name: "Sound, POS, furniture",
		estimatedNet: 8333,
		notes: "Industry mid-range: €10,000–€15,000.",
		vatProfile: "standard_20",
		confidenceTier: "high",
		uncertainty: { min: 5000, mode: 8333, max: 13333 },
		mandatory: false,
		phase: "commissioning",
	},
	{
		id: "fire-safety",
		name: "Fire safety & emergency systems",
		estimatedNet: 2917,
		notes: "TRVB 124 F: 1× 6kg ABC per 200m². Brandschutzplaner required.",
		vatProfile: "standard_20",
		confidenceTier: "low",
		uncertainty: { min: 2625, mode: 2917, max: 3355 },
		mandatory: true,
		phase: "fit-out",
	},
	{
		id: "permits",
		name: "Permits, architect, fees",
		estimatedNet: 9500,
		notes: "Baubewilligung, Energieausweis, structural calculations. Gov fees are VAT-exempt.",
		vatProfile: "exempt",
		confidenceTier: "medium",
		uncertainty: { min: 7600, mode: 9500, max: 12350 },
		mandatory: true,
		phase: "pre-construction",
	},
	{
		id: "insurance",
		name: "Insurance (annual)",
		estimatedNet: 2200,
		notes: "Betriebshaftpflicht. Annual — multiply by operating years for total.",
		vatProfile: "exempt",
		confidenceTier: "fixed",
		uncertainty: { min: 2156, mode: 2200, max: 2244 },
		mandatory: true,
		phase: "ongoing",
	},
	{
		id: "lightning-protection",
		name: "Lightning protection (Blitzschutz)",
		estimatedNet: 3500,
		notes: "Explicitly excluded from BORGA offer. Required for commercial buildings.",
		vatProfile: "standard_20",
		confidenceTier: "medium",
		uncertainty: { min: 2800, mode: 3500, max: 4550 },
		mandatory: true,
		phase: "construction",
	},
	{
		id: "grid-connection",
		name: "Grid connection (Stromanschluss)",
		estimatedNet: 2500,
		notes: "Netz OÖ connection fee. Varies by distance from supply.",
		vatProfile: "standard_20",
		confidenceTier: "medium",
		uncertainty: { min: 2000, mode: 2500, max: 3250 },
		mandatory: true,
		phase: "pre-construction",
	},
	{
		id: "water-connection",
		name: "Water & sewer connection",
		estimatedNet: 1500,
		notes: "Municipal water/Kanal connection. Varies by Gemeinde.",
		vatProfile: "standard_20",
		confidenceTier: "medium",
		uncertainty: { min: 1200, mode: 1500, max: 1950 },
		mandatory: true,
		phase: "pre-construction",
	},
];
```

## Step 6: Run type check and lint

```bash
cd golf-planner && npx tsc --noEmit && npm run check
```

Expected: Zero errors.

## Step 7: Commit

```bash
git add src/types/budget.ts src/constants/budget.ts src/utils/financial.ts src/utils/__tests__/financial.test.ts
git commit -m "feat(phase8): add v2 budget types, constants, and VAT utilities"
```
