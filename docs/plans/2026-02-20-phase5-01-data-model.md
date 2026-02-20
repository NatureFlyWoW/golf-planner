# Phase 5 — Task File 01: Data Model

## Task 1: Update types and constants

**Files:**
- Modify: `src/types/budget.ts`
- Modify: `src/constants/budget.ts`

**Step 1: Update BudgetCategory type**

Add `manualOverride` to `BudgetCategory` in `src/types/budget.ts`:

```typescript
export type BudgetCategory = {
	id: string;
	name: string;
	estimated: number;
	actual: number;
	notes: string;
	manualOverride?: boolean;
};
```

**Step 2: Update BudgetConfig type**

Replace `costPerHole` with `costPerType` in `src/types/budget.ts`:

```typescript
export type BudgetConfig = {
	costPerType: Record<string, number>;
};
```

**Step 3: Add constants and update defaults in `src/constants/budget.ts`**

```typescript
import type { BudgetCategory, BudgetConfig } from "../types";

export const COURSE_CATEGORY_ID = "course";
export const DEFAULT_HOLE_COST = 2700;

export const DEFAULT_COST_PER_TYPE: Record<string, number> = {
	straight: 2000,
	"l-shape": 2500,
	dogleg: 2800,
	ramp: 3000,
	loop: 3200,
	windmill: 3500,
	tunnel: 2800,
};

export const DEFAULT_BUDGET_CONFIG: BudgetConfig = {
	costPerType: { ...DEFAULT_COST_PER_TYPE },
};

export const BUDGET_HINTS: Record<string, string> = {
	"uv-lighting": "Industry mid-range: €5,500–€9,000 for 12–18 holes",
	electrical: "Industry mid-range: €10,000–€15,000 for 12–18 holes",
	equipment: "Industry mid-range: €10,000–€15,000 for indoor mini golf",
};

// DEFAULT_BUDGET_CATEGORIES stays the same (no changes needed)
```

**Step 4: Run lint to verify**

Run: `npx biome check src/types/budget.ts src/constants/budget.ts`
Expected: No errors

**Step 5: Commit**

```bash
git add src/types/budget.ts src/constants/budget.ts
git commit -m "feat: update BudgetConfig to costPerType and add manualOverride"
```

---

## Task 2: Update store for new BudgetConfig shape

**Files:**
- Modify: `src/store/store.ts`

**Step 1: Fix type import**

The store imports `BudgetConfig` from `"../types"`. Since we changed the shape, the store should compile without import changes — but we need to:

1. Remove `costPerHole` references
2. Update `setBudgetConfig` (already uses `Partial<BudgetConfig>` spread — works as-is)
3. The `initBudget` function stays the same (categories don't change)

**Step 2: Update store — remove costPerHole references**

In `src/store/store.ts`, the `DEFAULT_BUDGET_CONFIG` import already comes from `"../constants/budget"` which we updated in Task 1. The store uses `budgetConfig: DEFAULT_BUDGET_CONFIG` as default — this now contains `costPerType` instead of `costPerHole`.

No code changes needed in `store.ts` for this task — the type change flows through automatically.

**Step 3: Run tests to verify nothing broke**

Run: `npm test -- --run`
Expected: All 50 tests pass. (The export test references `DEFAULT_BUDGET_CONFIG` which changed shape — this may fail. That's expected and will be fixed in Task 9.)

**Step 4: Run lint**

Run: `npx biome check src/`
Expected: Clean (or only export test failure)

**Step 5: Commit (if tests pass)**

```bash
git add src/store/store.ts
git commit -m "refactor: store uses new BudgetConfig shape"
```

If tests fail due to export changes, skip the commit — it will be combined with Task 9.
