# Phase 5 — Task File 05: Export v3 & Migration

## Task 9: Update export to v3 format

**Files:**
- Modify: `src/utils/exportLayout.ts`
- Modify: `tests/utils/exportLayout.test.ts`

**Step 1: Write the failing test**

Update `tests/utils/exportLayout.test.ts` to test v3 export:

Replace the `DEFAULT_BUDGET_CONFIG` import and update the test:

```typescript
import { describe, expect, it } from "vitest";
import { DEFAULT_BUDGET_CONFIG } from "../../src/constants/budget";
import type { BudgetCategory, Hall, Hole } from "../../src/types";
import { buildExportData } from "../../src/utils/exportLayout";

describe("buildExportData", () => {
	const hall = { width: 10, length: 20 } as Hall;

	it("builds a v3 export object", () => {
		const holes: Record<string, Hole> = {
			"abc-123": {
				id: "abc-123",
				type: "straight",
				position: { x: 3, z: 5 },
				rotation: 0,
				name: "Hole 1",
				par: 2,
			},
			"def-456": {
				id: "def-456",
				type: "ramp",
				position: { x: 7, z: 12 },
				rotation: 90,
				name: "Hole 2",
				par: 3,
			},
		};
		const holeOrder = ["abc-123", "def-456"];
		const budget: Record<string, BudgetCategory> = {};

		const result = buildExportData(
			holes,
			holeOrder,
			budget,
			hall,
			DEFAULT_BUDGET_CONFIG,
		);

		expect(result.version).toBe(3);
		expect(result.exportedAt).toBeDefined();
		expect(result.hall.width).toBe(10);
		expect(result.holes).toHaveLength(2);
		expect(result.holes[0].name).toBe("Hole 1");
		expect(result.holes[1].name).toBe("Hole 2");
		expect(result.budgetConfig.costPerType).toBeDefined();
		expect(result.budgetConfig.costPerType.straight).toBe(2000);
	});

	it("exports holes in holeOrder sequence", () => {
		const holes: Record<string, Hole> = {
			b: {
				id: "b",
				type: "ramp",
				position: { x: 1, z: 1 },
				rotation: 0,
				name: "Second",
				par: 3,
			},
			a: {
				id: "a",
				type: "straight",
				position: { x: 2, z: 2 },
				rotation: 0,
				name: "First",
				par: 2,
			},
		};
		const holeOrder = ["a", "b"];

		const result = buildExportData(
			holes,
			holeOrder,
			{},
			hall,
			DEFAULT_BUDGET_CONFIG,
		);

		expect(result.holes[0].name).toBe("First");
		expect(result.holes[1].name).toBe("Second");
	});

	it("includes manualOverride in exported budget categories", () => {
		const budget: Record<string, BudgetCategory> = {
			course: {
				id: "course",
				name: "Mini golf course",
				estimated: 50000,
				actual: 0,
				notes: "",
				manualOverride: true,
			},
		};

		const result = buildExportData({}, [], budget, hall, DEFAULT_BUDGET_CONFIG);

		const courseCat = result.budget.find((c) => c.id === "course");
		expect(courseCat?.manualOverride).toBe(true);
	});
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- --run tests/utils/exportLayout.test.ts`
Expected: FAIL — version is 2, not 3

**Step 3: Update export function**

In `src/utils/exportLayout.ts`, change `version: 2` to `version: 3`:

```typescript
export function buildExportData(
	holes: Record<string, Hole>,
	holeOrder: string[],
	budget: Record<string, BudgetCategory>,
	hall: Hall,
	budgetConfig: BudgetConfig,
): ExportData {
	return {
		version: 3,
		exportedAt: new Date().toISOString(),
		hall: { width: hall.width, length: hall.length },
		holes: holeOrder.map((id) => holes[id]).filter(Boolean),
		budget: Object.values(budget),
		budgetConfig,
	};
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- --run tests/utils/exportLayout.test.ts`
Expected: All 3 tests pass

**Step 5: Commit**

```bash
git add src/utils/exportLayout.ts tests/utils/exportLayout.test.ts
git commit -m "feat: update export to v3 format with costPerType and manualOverride"
```

---

## Task 10: Add localStorage migration from v2 to v3

**Files:**
- Create: `src/utils/migrateBudgetConfig.ts`
- Create: `tests/utils/migrateBudgetConfig.test.ts`
- Modify: `src/store/store.ts`

**Step 1: Write the failing tests**

Create `tests/utils/migrateBudgetConfig.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { DEFAULT_COST_PER_TYPE } from "../../src/constants/budget";
import { migrateBudgetConfig } from "../../src/utils/migrateBudgetConfig";

describe("migrateBudgetConfig", () => {
	it("migrates v2 config (costPerHole) to v3 (costPerType)", () => {
		const v2Config = { costPerHole: 3000 };
		const result = migrateBudgetConfig(v2Config as any);

		expect(result.costPerType).toBeDefined();
		expect((result as any).costPerHole).toBeUndefined();
		// All types get the uniform costPerHole value
		expect(result.costPerType.straight).toBe(3000);
		expect(result.costPerType.windmill).toBe(3000);
		expect(result.costPerType.tunnel).toBe(3000);
	});

	it("returns v3 config unchanged", () => {
		const v3Config = { costPerType: { straight: 5000, ramp: 4000 } };
		const result = migrateBudgetConfig(v3Config);

		expect(result.costPerType.straight).toBe(5000);
		expect(result.costPerType.ramp).toBe(4000);
	});

	it("handles empty/missing config with defaults", () => {
		const result = migrateBudgetConfig({} as any);

		expect(result.costPerType).toEqual(DEFAULT_COST_PER_TYPE);
	});

	it("handles undefined config", () => {
		const result = migrateBudgetConfig(undefined as any);

		expect(result.costPerType).toEqual(DEFAULT_COST_PER_TYPE);
	});
});

describe("migrateBudgetCategories", () => {
	it("sets manualOverride=true on existing course category", () => {
		const { migrateBudgetCategories } = require("../../src/utils/migrateBudgetConfig");
		const budget = {
			course: {
				id: "course",
				name: "Mini golf course",
				estimated: 37800,
				actual: 0,
				notes: "",
			},
			hall: {
				id: "hall",
				name: "BORGA Hall",
				estimated: 108000,
				actual: 0,
				notes: "",
			},
		};

		const result = migrateBudgetCategories(budget);

		expect(result.course.manualOverride).toBe(true);
		expect(result.hall.manualOverride).toBeUndefined();
	});

	it("does not override existing manualOverride value", () => {
		const { migrateBudgetCategories } = require("../../src/utils/migrateBudgetConfig");
		const budget = {
			course: {
				id: "course",
				name: "Mini golf course",
				estimated: 37800,
				actual: 0,
				notes: "",
				manualOverride: false,
			},
		};

		const result = migrateBudgetCategories(budget);
		expect(result.course.manualOverride).toBe(false);
	});
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- --run tests/utils/migrateBudgetConfig.test.ts`
Expected: FAIL — module does not exist

**Step 3: Implement migration functions**

Create `src/utils/migrateBudgetConfig.ts`:

```typescript
import {
	COURSE_CATEGORY_ID,
	DEFAULT_COST_PER_TYPE,
} from "../constants/budget";
import type { BudgetCategory, BudgetConfig } from "../types";

/**
 * Migrate budgetConfig from v2 (costPerHole) to v3 (costPerType).
 * If already v3, returns as-is.
 */
export function migrateBudgetConfig(
	config: BudgetConfig & { costPerHole?: number },
): BudgetConfig {
	if (!config) {
		return { costPerType: { ...DEFAULT_COST_PER_TYPE } };
	}

	// Already v3
	if (config.costPerType) {
		const { costPerHole: _, ...rest } = config as any;
		return rest;
	}

	// v2: uniform cost from costPerHole
	const perHole = (config as any).costPerHole ?? 2700;
	const costPerType: Record<string, number> = {};
	for (const type of Object.keys(DEFAULT_COST_PER_TYPE)) {
		costPerType[type] = perHole;
	}

	return { costPerType };
}

/**
 * Migrate budget categories: set manualOverride=true on existing course
 * category to preserve manually-entered estimates during upgrade.
 */
export function migrateBudgetCategories(
	budget: Record<string, BudgetCategory>,
): Record<string, BudgetCategory> {
	if (!budget) return budget;

	const course = budget[COURSE_CATEGORY_ID];
	if (!course || course.manualOverride !== undefined) return budget;

	return {
		...budget,
		[COURSE_CATEGORY_ID]: {
			...course,
			manualOverride: true,
		},
	};
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- --run tests/utils/migrateBudgetConfig.test.ts`
Expected: All tests pass

**Step 5: Wire migration into store's persist onRehydrateStorage**

In `src/store/store.ts`, add migration in the `persist` config's `onRehydrateStorage` callback. Alternatively, use Zustand's `migrate` option in the persist config:

Add to the `persist(...)` options object (after `partialize`):

```typescript
version: 3,
migrate: (persisted: any, version: number) => {
	if (version < 3 && persisted) {
		persisted.budgetConfig = migrateBudgetConfig(persisted.budgetConfig);
		persisted.budget = migrateBudgetCategories(persisted.budget);
	}
	return persisted;
},
```

Import `migrateBudgetConfig` and `migrateBudgetCategories` from `"../utils/migrateBudgetConfig"`.

**Note:** The existing persist config has no `version` field, which defaults to `0`. Setting it to `3` will trigger the migration for all existing data (version 0 < 3).

**Step 6: Run all tests**

Run: `npm test -- --run`
Expected: All tests pass (including updated export tests from Task 9)

**Step 7: Run lint**

Run: `npx biome check src/`
Expected: Clean

**Step 8: Commit**

```bash
git add src/utils/migrateBudgetConfig.ts tests/utils/migrateBudgetConfig.test.ts src/store/store.ts
git commit -m "feat: add v2→v3 localStorage migration for costPerType"
```
