# Phase 5 — Task File 02: Selectors & Store Actions

## Task 3: Create selectCourseCost selector with tests

**Files:**
- Create: `src/store/selectors.ts`
- Create: `tests/utils/budgetSelectors.test.ts`

**Step 1: Write the failing tests**

Create `tests/utils/budgetSelectors.test.ts`:

```typescript
import { beforeEach, describe, expect, it } from "vitest";
import {
	COURSE_CATEGORY_ID,
	DEFAULT_COST_PER_TYPE,
	DEFAULT_HOLE_COST,
} from "../../src/constants/budget";
import { selectCourseCost } from "../../src/store/selectors";
import { useStore } from "../../src/store";

function resetStore() {
	useStore.setState({
		holes: {},
		holeOrder: [],
		selectedId: null,
		budget: {},
		budgetConfig: { costPerType: { ...DEFAULT_COST_PER_TYPE } },
	});
}

describe("selectCourseCost", () => {
	beforeEach(resetStore);

	it("returns 0 when no holes are placed", () => {
		const cost = selectCourseCost(useStore.getState());
		expect(cost).toBe(0);
	});

	it("sums per-type costs for placed holes", () => {
		const store = useStore.getState();
		store.addHole("straight", { x: 1, z: 1 }); // €2,000
		store.addHole("windmill", { x: 3, z: 3 }); // €3,500
		store.addHole("straight", { x: 5, z: 5 }); // €2,000

		const cost = selectCourseCost(useStore.getState());
		expect(cost).toBe(7500);
	});

	it("uses DEFAULT_HOLE_COST for unknown hole types", () => {
		useStore.setState({
			holes: {
				x: {
					id: "x",
					type: "unknown-future-type" as any,
					position: { x: 0, z: 0 },
					rotation: 0,
					name: "Mystery",
					par: 3,
				},
			},
			holeOrder: ["x"],
		});

		const cost = selectCourseCost(useStore.getState());
		expect(cost).toBe(DEFAULT_HOLE_COST);
	});

	it("returns stored estimated when manualOverride is true", () => {
		const store = useStore.getState();
		store.addHole("straight", { x: 1, z: 1 }); // Would compute €2,000

		// Set up course category with manual override
		useStore.setState({
			budget: {
				[COURSE_CATEGORY_ID]: {
					id: COURSE_CATEGORY_ID,
					name: "Mini golf course",
					estimated: 50000,
					actual: 0,
					notes: "",
					manualOverride: true,
				},
			},
		});

		const cost = selectCourseCost(useStore.getState());
		expect(cost).toBe(50000);
	});

	it("computes from holes when manualOverride is false", () => {
		const store = useStore.getState();
		store.addHole("ramp", { x: 1, z: 1 }); // €3,000

		useStore.setState({
			budget: {
				[COURSE_CATEGORY_ID]: {
					id: COURSE_CATEGORY_ID,
					name: "Mini golf course",
					estimated: 99999,
					actual: 0,
					notes: "",
					manualOverride: false,
				},
			},
		});

		const cost = selectCourseCost(useStore.getState());
		expect(cost).toBe(3000);
	});

	it("respects custom costPerType values", () => {
		const store = useStore.getState();
		store.addHole("straight", { x: 1, z: 1 });

		useStore.setState({
			budgetConfig: {
				costPerType: { ...DEFAULT_COST_PER_TYPE, straight: 5000 },
			},
		});

		const cost = selectCourseCost(useStore.getState());
		expect(cost).toBe(5000);
	});
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- --run tests/utils/budgetSelectors.test.ts`
Expected: FAIL — `selectCourseCost` does not exist

**Step 3: Write the selector**

Create `src/store/selectors.ts`:

```typescript
import {
	COURSE_CATEGORY_ID,
	DEFAULT_HOLE_COST,
} from "../constants/budget";
import type { Store } from "./store";

export function selectCourseCost(state: Store): number {
	const cat = state.budget[COURSE_CATEGORY_ID];
	if (cat?.manualOverride) return cat.estimated;
	return state.holeOrder.reduce(
		(sum, id) =>
			sum +
			(state.budgetConfig.costPerType[state.holes[id]?.type] ??
				DEFAULT_HOLE_COST),
		0,
	);
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- --run tests/utils/budgetSelectors.test.ts`
Expected: All 6 tests pass

**Step 5: Run lint**

Run: `npx biome check src/store/selectors.ts tests/utils/budgetSelectors.test.ts`
Expected: Clean

**Step 6: Commit**

```bash
git add src/store/selectors.ts tests/utils/budgetSelectors.test.ts
git commit -m "feat: add selectCourseCost derived selector with tests"
```

---

## Task 4: Add selectCourseBreakdown selector and toggleManualOverride action

**Files:**
- Modify: `src/store/selectors.ts`
- Modify: `src/store/store.ts`
- Modify: `tests/utils/budgetSelectors.test.ts`

**Step 1: Write failing tests for selectCourseBreakdown**

Append to `tests/utils/budgetSelectors.test.ts`:

```typescript
import { selectCourseBreakdown } from "../../src/store/selectors";

describe("selectCourseBreakdown", () => {
	beforeEach(resetStore);

	it("returns empty array when no holes placed", () => {
		const breakdown = selectCourseBreakdown(useStore.getState());
		expect(breakdown).toEqual([]);
	});

	it("groups holes by type with count and subtotal", () => {
		const store = useStore.getState();
		store.addHole("straight", { x: 1, z: 1 });
		store.addHole("straight", { x: 3, z: 3 });
		store.addHole("windmill", { x: 5, z: 5 });

		const breakdown = selectCourseBreakdown(useStore.getState());
		// Sorted by count descending
		expect(breakdown).toEqual([
			{ type: "straight", label: "Straight", count: 2, unitCost: 2000, subtotal: 4000 },
			{ type: "windmill", label: "Windmill", count: 1, unitCost: 3500, subtotal: 3500 },
		]);
	});

	it("sorts by count descending, then alphabetically", () => {
		const store = useStore.getState();
		store.addHole("tunnel", { x: 1, z: 1 });
		store.addHole("ramp", { x: 3, z: 3 });

		const breakdown = selectCourseBreakdown(useStore.getState());
		// Same count (1 each), alphabetical by label
		expect(breakdown[0].type).toBe("ramp");
		expect(breakdown[1].type).toBe("tunnel");
	});
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- --run tests/utils/budgetSelectors.test.ts`
Expected: FAIL — `selectCourseBreakdown` does not exist

**Step 3: Implement selectCourseBreakdown**

Add to `src/store/selectors.ts`:

```typescript
import { HOLE_TYPE_MAP } from "../constants/holeTypes";

export type CourseBreakdownItem = {
	type: string;
	label: string;
	count: number;
	unitCost: number;
	subtotal: number;
};

export function selectCourseBreakdown(state: Store): CourseBreakdownItem[] {
	const counts: Record<string, number> = {};
	for (const id of state.holeOrder) {
		const hole = state.holes[id];
		if (hole) {
			counts[hole.type] = (counts[hole.type] ?? 0) + 1;
		}
	}

	return Object.entries(counts)
		.map(([type, count]) => {
			const unitCost =
				state.budgetConfig.costPerType[type] ?? DEFAULT_HOLE_COST;
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

**Step 4: Run tests to verify they pass**

Run: `npm test -- --run tests/utils/budgetSelectors.test.ts`
Expected: All tests pass

**Step 5: Add toggleManualOverride action to store**

In `src/store/store.ts`, add to `StoreActions`:

```typescript
toggleCourseOverride: () => void;
```

And implement it in the store creator:

```typescript
toggleCourseOverride: () => {
	set((state) => {
		const courseId = COURSE_CATEGORY_ID;
		const cat = state.budget[courseId];
		if (!cat) return state;
		return {
			budget: {
				...state.budget,
				[courseId]: {
					...cat,
					manualOverride: !cat.manualOverride,
				},
			},
		};
	});
},
```

Add `COURSE_CATEGORY_ID` to the imports from `"../constants/budget"`.

**Step 6: Run all tests**

Run: `npm test -- --run`
Expected: Pass (or export tests may fail — expected, fixed in Task 9)

**Step 7: Commit**

```bash
git add src/store/selectors.ts src/store/store.ts tests/utils/budgetSelectors.test.ts
git commit -m "feat: add course breakdown selector and toggleCourseOverride action"
```
