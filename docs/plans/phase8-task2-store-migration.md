# Task 2: Store v4 Migration and New Actions

**Goal:** Bump the Zustand persist version to 4, add FinancialSettings and expenses to the store, migrate existing budget data to v2 format, and add new actions.

**Files:**
- Modify: `src/store/store.ts` (279 lines — extend state, actions, persist config, migration)
- Modify: `src/components/App.tsx:30-37` (update budget init useEffect for v2)

**Depends on:** Task 1 (types and constants)

---

## Step 1: Update store types and state

In `src/store/store.ts`, update imports to include v2 types:

```typescript
// Add to existing imports from "../types/budget":
import type {
	BudgetCategoryV2,
	BudgetConfigV2,
	ExpenseEntry,
	FinancialSettings,
} from "../types/budget";

// Add to existing imports from "../constants/budget":
import {
	DEFAULT_BUDGET_CATEGORIES_V2,
	DEFAULT_BUDGET_CONFIG_V2,
	DEFAULT_FINANCIAL_SETTINGS,
} from "../constants/budget";
```

## Step 2: Extend StoreState with new fields

Add to the `StoreState` type (after existing `budget` and `budgetConfig` fields):

```typescript
// Replace existing budget fields:
budget: Record<string, BudgetCategoryV2>;
budgetConfig: BudgetConfigV2;
// New fields:
financialSettings: FinancialSettings;
expenses: ExpenseEntry[];
```

Update `StoreActions` with new actions:

```typescript
// Keep existing: updateBudget, initBudget, setBudgetConfig, toggleCourseOverride
// Add:
setFinancialSettings: (updates: Partial<FinancialSettings>) => void;
addExpense: (expense: ExpenseEntry) => void;
deleteExpense: (expenseId: string) => void;
updateCategoryTier: (id: string, tier: ConfidenceTier) => void;
```

## Step 3: Set initial state for new fields

In the store creator, set initial state:

```typescript
financialSettings: DEFAULT_FINANCIAL_SETTINGS,
expenses: [],
```

## Step 4: Implement new actions

Add after existing `toggleCourseOverride` action:

```typescript
setFinancialSettings: (updates) =>
	set((state) => ({
		financialSettings: { ...state.financialSettings, ...updates },
	})),

addExpense: (expense) =>
	set((state) => ({
		expenses: [...state.expenses, expense],
	})),

deleteExpense: (expenseId) =>
	set((state) => ({
		expenses: state.expenses.filter((e) => e.id !== expenseId),
	})),

updateCategoryTier: (id, tier) =>
	set((state) => {
		const cat = state.budget[id];
		if (!cat) return state;
		const { uncertaintyFromTier } = require("../utils/financial");
		return {
			budget: {
				...state.budget,
				[id]: {
					...cat,
					confidenceTier: tier,
					uncertainty: uncertaintyFromTier(cat.estimatedNet, tier),
				},
			},
		};
	}),
```

**Note on `updateCategoryTier`:** The dynamic import is not ideal. Instead, import `uncertaintyFromTier` at the top of the file from `"../utils/financial"` and use it directly in the action.

## Step 5: Update `updateBudget` action

The existing `updateBudget` action merges `Partial<BudgetCategory>`. Update it to work with `BudgetCategoryV2`:

```typescript
updateBudget: (id, updates) =>
	set((state) => {
		const existing = state.budget[id];
		if (!existing) return state;
		return {
			budget: {
				...state.budget,
				[id]: { ...existing, ...updates },
			},
		};
	}),
```

The type of `updates` parameter changes from `Partial<BudgetCategory>` to `Partial<BudgetCategoryV2>`.

## Step 6: Update `initBudget` to use v2 defaults

```typescript
initBudget: () =>
	set(() => {
		const budget: Record<string, BudgetCategoryV2> = {};
		for (const cat of DEFAULT_BUDGET_CATEGORIES_V2) {
			budget[cat.id] = { ...cat };
		}
		return { budget };
	}),
```

## Step 7: Update persist config — version 4 and migration

Change the persist config:

```typescript
{
	name: "golf-planner-state",
	version: 4, // was: 3
	partialize: (state) => ({
		holes: state.holes,
		holeOrder: state.holeOrder,
		budget: state.budget,
		budgetConfig: state.budgetConfig,
		financialSettings: state.financialSettings,
		expenses: state.expenses,
	}),
	migrate: (persisted: unknown, version: number) => {
		const state = persisted as PersistedSlice;

		// Existing v2->v3 migrations
		if (version < 3) {
			migrateBudgetConfig(state);
			migrateBudgetCategories(state);
		}

		// New v3->v4 migration
		if (version < 4) {
			migrateToV4(state);
		}

		return state;
	},
}
```

## Step 8: Implement v3→v4 migration function

Add a new migration function. This converts old `BudgetCategory` records to `BudgetCategoryV2`:

```typescript
function migrateToV4(state: PersistedSlice): void {
	// Migrate budget categories to v2
	if (state.budget) {
		const DEFAULT_TIERS = DEFAULT_CONFIDENCE_TIERS; // from constants
		const VAT_PROFILES: Record<string, VatProfile> = {
			permits: "exempt",
			insurance: "exempt",
		};

		const PHASES: Record<string, ConstructionPhase> = {
			hall: "construction",
			foundation: "construction",
			course: "fit-out",
			"uv-lighting": "fit-out",
			"emergency-lighting": "fit-out",
			"heat-pumps": "construction",
			ventilation: "construction",
			electrical: "construction",
			plumbing: "construction",
			"wall-art": "commissioning",
			finishing: "fit-out",
			equipment: "commissioning",
			"fire-safety": "fit-out",
			permits: "pre-construction",
			insurance: "ongoing",
			"lightning-protection": "construction",
			"grid-connection": "pre-construction",
			"water-connection": "pre-construction",
		};

		const MANDATORY = new Set([
			"hall", "foundation", "emergency-lighting", "electrical",
			"plumbing", "fire-safety", "permits", "insurance",
			"lightning-protection", "grid-connection", "water-connection",
		]);

		for (const [id, cat] of Object.entries(state.budget)) {
			const oldCat = cat as Record<string, unknown>;
			const tier = DEFAULT_TIERS[id] ?? "medium";
			const vatProfile = VAT_PROFILES[id] ?? "standard_20";

			// If the category doesn't have v2 fields, add them
			if (!("estimatedNet" in oldCat)) {
				// Convert estimated (assumed gross) to net
				const estimated = (oldCat.estimated as number) ?? 0;
				const net = vatProfile === "standard_20"
					? Math.round((estimated / 1.2) * 100) / 100
					: estimated;

				(oldCat as Record<string, unknown>).estimatedNet = net;
				(oldCat as Record<string, unknown>).vatProfile = vatProfile;
				(oldCat as Record<string, unknown>).confidenceTier = tier;
				(oldCat as Record<string, unknown>).uncertainty =
					uncertaintyFromTier(net, tier);
				(oldCat as Record<string, unknown>).mandatory = MANDATORY.has(id);
				(oldCat as Record<string, unknown>).phase = PHASES[id] ?? "fit-out";
			}

			// Migrate actual to expenses
			const actual = (oldCat.actual as number) ?? 0;
			if (actual > 0 && !("expenses" in (state as Record<string, unknown>))) {
				// Will be handled below
			}
		}

		// Seed new categories that don't exist yet
		for (const defaultCat of DEFAULT_BUDGET_CATEGORIES_V2) {
			if (!state.budget[defaultCat.id]) {
				state.budget[defaultCat.id] = { ...defaultCat } as unknown as BudgetCategory;
			}
		}
	}

	// Add financialSettings if missing
	if (!("financialSettings" in (state as Record<string, unknown>))) {
		(state as Record<string, unknown>).financialSettings = { ...DEFAULT_FINANCIAL_SETTINGS };
	}

	// Add expenses array if missing
	if (!("expenses" in (state as Record<string, unknown>))) {
		const expenses: ExpenseEntry[] = [];

		// Migrate existing actual values to expense entries
		if (state.budget) {
			for (const [id, cat] of Object.entries(state.budget)) {
				const actual = (cat as Record<string, unknown>).actual as number;
				if (actual && actual > 0) {
					expenses.push({
						id: `migrated-${id}`,
						categoryId: id,
						date: new Date().toISOString().slice(0, 10),
						amount: actual,
						vendor: "Migrated from v3",
						note: "Auto-migrated from previous budget version",
					});
				}
			}
		}

		(state as Record<string, unknown>).expenses = expenses;
	}

	// Migrate budgetConfig to v2 (add costPerTypeDiy if missing)
	if (state.budgetConfig && !("costPerTypeDiy" in state.budgetConfig)) {
		(state.budgetConfig as Record<string, unknown>).costPerTypeDiy =
			{ ...DEFAULT_COST_PER_TYPE_DIY };
	}
}
```

## Step 9: Update PersistedSlice type

```typescript
type PersistedSlice = {
	holes: Record<string, Hole>;
	holeOrder: string[];
	budget: Record<string, BudgetCategoryV2>;
	budgetConfig: BudgetConfigV2;
	financialSettings: FinancialSettings;
	expenses: ExpenseEntry[];
	// Legacy fields for migration
	costPerHole?: number;
};
```

## Step 10: Update App.tsx budget init

In `src/components/App.tsx`, update the budget init useEffect to use v2:

```typescript
// The existing useEffect at lines 33-37 works as-is because
// initBudget() now seeds v2 categories. No change needed
// unless the size check needs to account for 18 vs 14 categories.
```

Actually, the existing check `if (budgetSize === 0)` still works — it only seeds when empty. No change needed.

## Step 11: Run type check and tests

```bash
cd golf-planner && npx tsc --noEmit && npm run test -- --run
```

Expected: All existing tests pass. Type check clean.

## Step 12: Commit

```bash
git add src/store/store.ts src/components/App.tsx
git commit -m "feat(phase8): migrate store to v4 with financial settings and expenses"
```
