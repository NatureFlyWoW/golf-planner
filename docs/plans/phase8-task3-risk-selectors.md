# Task 3: Risk-Weighted Contingency Selectors

**Goal:** Replace the flat 10% contingency calculation with risk-weighted selectors that use per-category confidence tiers, and update the course cost selector for DIY/Pro mode.

**Files:**
- Modify: `src/store/selectors.ts` (47 lines — extend with new selectors)
- Create: `src/utils/__tests__/selectors.test.ts` (tests for new selectors)

**Depends on:** Task 1 (types, financial utils), Task 2 (store v4)

---

## Step 1: Write failing tests for new selectors

Create `src/utils/__tests__/selectors.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import {
	computeRiskBuffer,
	computeSubtotalNet,
	computeTotalReclaimableVat,
} from "../../store/selectors";
import type { BudgetCategoryV2, FinancialSettings } from "../../types/budget";

const mockCategory = (
	overrides: Partial<BudgetCategoryV2>,
): BudgetCategoryV2 => ({
	id: "test",
	name: "Test",
	estimatedNet: 10000,
	notes: "",
	vatProfile: "standard_20",
	confidenceTier: "medium",
	uncertainty: { min: 8000, mode: 10000, max: 13000 },
	mandatory: false,
	phase: "construction",
	...overrides,
});

describe("computeSubtotalNet", () => {
	it("sums estimatedNet of all categories", () => {
		const cats: Record<string, BudgetCategoryV2> = {
			a: mockCategory({ id: "a", estimatedNet: 90000 }),
			b: mockCategory({ id: "b", estimatedNet: 10000 }),
		};
		expect(computeSubtotalNet(cats, 0, "course")).toBe(100000);
	});

	it("uses courseCost for the course category", () => {
		const cats: Record<string, BudgetCategoryV2> = {
			course: mockCategory({ id: "course", estimatedNet: 0 }),
			b: mockCategory({ id: "b", estimatedNet: 5000 }),
		};
		expect(computeSubtotalNet(cats, 15000, "course")).toBe(20000);
	});
});

describe("computeRiskBuffer", () => {
	it("returns near-zero for all-fixed categories", () => {
		const cats: Record<string, BudgetCategoryV2> = {
			a: mockCategory({ id: "a", estimatedNet: 90000, confidenceTier: "fixed" }),
		};
		const buffer = computeRiskBuffer(cats, 0, "course", "balanced");
		expect(buffer).toBe(1800); // 90000 * 0.02 * 1.0
	});

	it("returns higher buffer for high-uncertainty categories", () => {
		const cats: Record<string, BudgetCategoryV2> = {
			a: mockCategory({
				id: "a",
				estimatedNet: 12500,
				confidenceTier: "very_high",
			}),
		};
		const buffer = computeRiskBuffer(cats, 0, "course", "balanced");
		expect(buffer).toBe(5000); // 12500 * 0.40 * 1.0
	});

	it("scales with tolerance level", () => {
		const cats: Record<string, BudgetCategoryV2> = {
			a: mockCategory({ id: "a", estimatedNet: 10000, confidenceTier: "medium" }),
		};
		const optimistic = computeRiskBuffer(cats, 0, "course", "optimistic");
		const conservative = computeRiskBuffer(cats, 0, "course", "conservative");
		expect(conservative).toBeGreaterThan(optimistic);
	});
});

describe("computeTotalReclaimableVat", () => {
	it("sums 20% of net for standard categories when registered", () => {
		const cats: Record<string, BudgetCategoryV2> = {
			a: mockCategory({ id: "a", estimatedNet: 90000, vatProfile: "standard_20" }),
			b: mockCategory({ id: "b", estimatedNet: 9500, vatProfile: "exempt" }),
		};
		expect(computeTotalReclaimableVat(cats, true)).toBe(18000);
	});

	it("returns 0 when not registered", () => {
		const cats: Record<string, BudgetCategoryV2> = {
			a: mockCategory({ id: "a", estimatedNet: 90000 }),
		};
		expect(computeTotalReclaimableVat(cats, false)).toBe(0);
	});
});
```

## Step 2: Run tests to verify they fail

```bash
cd golf-planner && npm run test -- --run src/utils/__tests__/selectors.test.ts
```

Expected: FAIL — functions not exported yet.

## Step 3: Implement new selectors

Modify `src/store/selectors.ts`. Add new imports and functions:

```typescript
import type {
	BudgetCategoryV2,
	RiskTolerance,
} from "../types/budget";
import {
	reclaimableVat,
	riskBuffer,
	roundEur,
} from "../utils/financial";

// ... existing selectCourseCost and selectCourseBreakdown stay unchanged ...

/** Sum of estimatedNet across all categories, using courseCost for the course category */
export function computeSubtotalNet(
	budget: Record<string, BudgetCategoryV2>,
	courseCost: number,
	courseId: string,
): number {
	return roundEur(
		Object.values(budget).reduce(
			(sum, cat) =>
				cat.id === courseId ? sum + courseCost : sum + cat.estimatedNet,
			0,
		),
	);
}

/** Risk-weighted contingency buffer */
export function computeRiskBuffer(
	budget: Record<string, BudgetCategoryV2>,
	courseCost: number,
	courseId: string,
	tolerance: RiskTolerance,
): number {
	return roundEur(
		Object.values(budget).reduce((sum, cat) => {
			const net = cat.id === courseId ? courseCost : cat.estimatedNet;
			return sum + riskBuffer(net, cat.confidenceTier, tolerance);
		}, 0),
	);
}

/** Total reclaimable Vorsteuer across all categories */
export function computeTotalReclaimableVat(
	budget: Record<string, BudgetCategoryV2>,
	vatRegistered: boolean,
): number {
	return roundEur(
		Object.values(budget).reduce(
			(sum, cat) =>
				sum + reclaimableVat(cat.estimatedNet, cat.vatProfile, vatRegistered),
			0,
		),
	);
}

/** Actual total from expenses */
export function computeActualTotal(
	expenses: Array<{ categoryId: string; amount: number }>,
): number {
	return roundEur(expenses.reduce((sum, e) => sum + e.amount, 0));
}

/** Actual for a single category */
export function computeCategoryActual(
	expenses: Array<{ categoryId: string; amount: number }>,
	categoryId: string,
): number {
	return roundEur(
		expenses
			.filter((e) => e.categoryId === categoryId)
			.reduce((sum, e) => sum + e.amount, 0),
	);
}
```

## Step 4: Run tests to verify they pass

```bash
cd golf-planner && npm run test -- --run src/utils/__tests__/selectors.test.ts
```

Expected: All pass.

## Step 5: Run full test suite

```bash
cd golf-planner && npm run test -- --run
```

Expected: All 66+ tests pass (existing + new).

## Step 6: Commit

```bash
git add src/store/selectors.ts src/utils/__tests__/selectors.test.ts
git commit -m "feat(phase8): add risk-weighted contingency and VAT selectors"
```
