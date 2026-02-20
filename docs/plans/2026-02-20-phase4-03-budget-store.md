# Phase 4 — Tasks 6–8: Budget Store & Types

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add BudgetConfig type, default budget categories constant, store actions (initBudget, setBudgetConfig), update persistence and JSON export, and auto-initialize budget on first load.

**Prereqs:** Task 5 (mobile sun) committed. Budget store slice already exists: `budget: Record<string, BudgetCategory>` with `updateBudget` action.

**Environment:** In every Bash call: `export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)"`

---

### Task 6: Add BudgetConfig type + DEFAULT_BUDGET_CATEGORIES

**Files:**
- Modify: `src/types/budget.ts`
- Modify: `src/types/index.ts`
- Create: `src/constants/budget.ts`
- Modify: `src/constants/index.ts` (if barrel exists, otherwise skip)

**Step 1: Add BudgetConfig type**

In `src/types/budget.ts`, add after BudgetCategory:

```ts
export type BudgetConfig = {
	costPerHole: number;
};
```

**Step 2: Export from barrel**

In `src/types/index.ts`, update the budget export:

```ts
export type { BudgetCategory, BudgetConfig } from "./budget";
```

**Step 3: Create default budget categories constant**

Create `src/constants/budget.ts`:

```ts
import type { BudgetCategory, BudgetConfig } from "../types";

export const DEFAULT_BUDGET_CONFIG: BudgetConfig = {
	costPerHole: 2700,
};

export const DEFAULT_BUDGET_CATEGORIES: BudgetCategory[] = [
	{
		id: "hall",
		name: "BORGA Hall",
		estimated: 108000,
		actual: 0,
		notes: "",
	},
	{
		id: "course",
		name: "Mini golf course",
		estimated: 37800,
		actual: 0,
		notes: "",
	},
	{
		id: "uv-lighting",
		name: "UV lighting system",
		estimated: 5500,
		actual: 0,
		notes: "",
	},
	{
		id: "emergency-lighting",
		name: "Emergency lighting",
		estimated: 2000,
		actual: 0,
		notes: "",
	},
	{
		id: "heat-pumps",
		name: "Heat pumps (heating/cooling)",
		estimated: 10000,
		actual: 0,
		notes: "",
	},
	{
		id: "ventilation",
		name: "Ventilation with heat recovery",
		estimated: 4500,
		actual: 0,
		notes: "",
	},
	{
		id: "electrical",
		name: "Electrical installation",
		estimated: 12500,
		actual: 0,
		notes: "",
	},
	{
		id: "plumbing",
		name: "Plumbing & WC facilities",
		estimated: 15000,
		actual: 0,
		notes: "",
	},
	{
		id: "wall-art",
		name: "UV graffiti / wall art",
		estimated: 15000,
		actual: 0,
		notes: "",
	},
	{
		id: "finishing",
		name: "Interior finishing & flooring",
		estimated: 10000,
		actual: 0,
		notes: "",
	},
	{
		id: "equipment",
		name: "Sound, POS, furniture",
		estimated: 10000,
		actual: 0,
		notes: "",
	},
	{
		id: "fire-safety",
		name: "Fire safety & emergency systems",
		estimated: 3500,
		actual: 0,
		notes: "",
	},
	{
		id: "permits",
		name: "Permits, architect, fees",
		estimated: 9500,
		actual: 0,
		notes: "",
	},
	{
		id: "insurance",
		name: "Insurance (annual)",
		estimated: 2200,
		actual: 0,
		notes: "Annual Betriebshaftpflicht — multiply by operating years for total",
	},
];
```

**Step 4: Verify**

Run:
```bash
npm run check
```
Expected: Lint clean.

**Step 5: Commit**

```bash
git add src/types/budget.ts src/types/index.ts src/constants/budget.ts && git commit -m "feat: add BudgetConfig type and default budget categories"
```

---

### Task 7: Extend store with budgetConfig, initBudget, setBudgetConfig

**Files:**
- Modify: `src/store/store.ts`

**Step 1: Add imports**

Add to imports at top of `src/store/store.ts`:

```ts
import {
	DEFAULT_BUDGET_CATEGORIES,
	DEFAULT_BUDGET_CONFIG,
} from "../constants/budget";
import type { BudgetCategory, BudgetConfig, Hall, Hole, HoleType, UIState } from "../types";
```

(Update the existing types import to include `BudgetConfig`.)

**Step 2: Add budgetConfig to StoreState**

In `StoreState`, add after `budget`:

```ts
budgetConfig: BudgetConfig;
```

**Step 3: Add new actions to StoreActions**

Add after `updateBudget`:

```ts
initBudget: () => void;
setBudgetConfig: (updates: Partial<BudgetConfig>) => void;
```

**Step 4: Add default budgetConfig to state initializer**

In the store creation (after `budget: {}`), add:

```ts
budgetConfig: DEFAULT_BUDGET_CONFIG,
```

**Step 5: Implement initBudget action**

Add after the `updateBudget` action. **CRITICAL:** Use `set()` directly with full objects, NOT `updateBudget()`. The existing `updateBudget` spreads `state.budget[id]` which is `undefined` for new IDs.

```ts
initBudget: () => {
	const budget: Record<string, BudgetCategory> = {};
	for (const cat of DEFAULT_BUDGET_CATEGORIES) {
		budget[cat.id] = { ...cat };
	}
	set({ budget });
},
```

**Step 6: Implement setBudgetConfig action**

```ts
setBudgetConfig: (updates) => {
	set((state) => ({
		budgetConfig: { ...state.budgetConfig, ...updates },
	}));
},
```

**Step 7: Add budgetConfig to persist partialize**

Update the persist `partialize` (currently at lines 173-177) to include `budgetConfig`:

```ts
partialize: (state) => ({
	holes: state.holes,
	holeOrder: state.holeOrder,
	budget: state.budget,
	budgetConfig: state.budgetConfig,
}),
```

**Step 8: Verify**

Run:
```bash
npm run check && npm run test
```
Expected: Lint clean, all tests pass.

**Step 9: Commit**

```bash
git add src/store/store.ts && git commit -m "feat: add budgetConfig, initBudget, setBudgetConfig to store"
```

---

### Task 8: Update export + add auto-init

**Files:**
- Modify: `src/utils/exportLayout.ts`
- Modify: `src/App.tsx`

**Step 1: Update ExportData type**

In `src/utils/exportLayout.ts`, update the type:

```ts
import type { BudgetCategory, BudgetConfig, Hall, Hole } from "../types";

export type ExportData = {
	version: number;
	exportedAt: string;
	hall: { width: number; length: number };
	holes: Hole[];
	budget: BudgetCategory[];
	budgetConfig: BudgetConfig;
};
```

**Step 2: Update buildExportData function**

Update the function signature and body:

```ts
export function buildExportData(
	holes: Record<string, Hole>,
	holeOrder: string[],
	budget: Record<string, BudgetCategory>,
	hall: Hall,
	budgetConfig: BudgetConfig,
): ExportData {
	return {
		version: 2,
		exportedAt: new Date().toISOString(),
		hall: { width: hall.width, length: hall.length },
		holes: holeOrder.map((id) => holes[id]).filter(Boolean),
		budget: Object.values(budget),
		budgetConfig,
	};
}
```

Note: version bumped from 1 to 2.

**Step 3: Update all callsites of buildExportData**

In `src/components/ui/BottomToolbar.tsx`, the OverflowPopover already reads `budget` and `hall` from the store. Add `budgetConfig`:

Add to OverflowPopover:
```tsx
const budgetConfig = useStore((s) => s.budgetConfig);
```

Update the export button onClick:
```tsx
const data = buildExportData(holes, holeOrder, budget, hall, budgetConfig);
```

Check for any other callsites of `buildExportData` (search the codebase). If there's an ExportButton or Toolbar export, update those too.

**Step 4: Add auto-init useEffect to App.tsx**

In `src/App.tsx`, add the budget auto-init. Import `useEffect` from React (may already be imported):

```tsx
import { useEffect } from "react";
```

Add at the top of the `App` function body (after the existing selectors):

```tsx
const budgetSize = useStore((s) => Object.keys(s.budget).length);
const initBudget = useStore((s) => s.initBudget);

useEffect(() => {
	if (budgetSize === 0) {
		initBudget();
	}
}, [budgetSize, initBudget]);
```

This runs once on first load when budget is empty. Users with existing budget data skip it.

**Step 5: Update existing export test (if any)**

Search for tests referencing `buildExportData` or `ExportData`. If found, update to pass the new `budgetConfig` parameter.

Run:
```bash
npm run check && npm run test
```
Expected: Lint clean, all tests pass.

**Step 6: Commit**

```bash
git add src/utils/exportLayout.ts src/components/ui/BottomToolbar.tsx src/App.tsx && git commit -m "feat: add budgetConfig to export and auto-init budget on first load"
```
