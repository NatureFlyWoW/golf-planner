import { beforeEach, describe, expect, it } from "vitest";
import {
	COURSE_CATEGORY_ID,
	DEFAULT_COST_PER_TYPE,
	DEFAULT_COST_PER_TYPE_DIY,
	DEFAULT_HOLE_COST,
} from "../../src/constants/budget";
import { useStore } from "../../src/store";
import {
	selectCourseBreakdown,
	selectCourseCost,
} from "../../src/store/selectors";

function resetStore() {
	useStore.setState({
		holes: {},
		holeOrder: [],
		selectedId: null,
		budget: {},
		budgetConfig: {
			costPerType: { ...DEFAULT_COST_PER_TYPE },
			costPerTypeDiy: { ...DEFAULT_COST_PER_TYPE_DIY },
		},
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
					type: "unknown-future-type" as never,
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
		store.addHole("straight", { x: 1, z: 1 });

		useStore.setState({
			budget: {
				[COURSE_CATEGORY_ID]: {
					id: COURSE_CATEGORY_ID,
					name: "Mini golf course",
					estimatedNet: 50000,
					notes: "",
					manualOverride: true,
					vatProfile: "standard_20",
					confidenceTier: "high",
					uncertainty: { min: 30000, mode: 50000, max: 80000 },
					mandatory: true,
					phase: "fit-out",
				},
			},
		});

		const cost = selectCourseCost(useStore.getState());
		expect(cost).toBe(50000);
	});

	it("computes from holes when manualOverride is false", () => {
		const store = useStore.getState();
		store.addHole("ramp", { x: 1, z: 1 }); // EUR3,000

		useStore.setState({
			budget: {
				[COURSE_CATEGORY_ID]: {
					id: COURSE_CATEGORY_ID,
					name: "Mini golf course",
					estimatedNet: 99999,
					notes: "",
					manualOverride: false,
					vatProfile: "standard_20",
					confidenceTier: "high",
					uncertainty: { min: 0, mode: 99999, max: 99999 },
					mandatory: true,
					phase: "fit-out",
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
				costPerTypeDiy: { ...DEFAULT_COST_PER_TYPE_DIY },
			},
		});

		const cost = selectCourseCost(useStore.getState());
		expect(cost).toBe(5000);
	});
});

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
		expect(breakdown).toEqual([
			{
				type: "straight",
				label: "Straight",
				count: 2,
				unitCost: 2000,
				subtotal: 4000,
			},
			{
				type: "windmill",
				label: "Windmill",
				count: 1,
				unitCost: 3500,
				subtotal: 3500,
			},
		]);
	});

	it("sorts by count descending, then alphabetically", () => {
		const store = useStore.getState();
		store.addHole("tunnel", { x: 1, z: 1 });
		store.addHole("ramp", { x: 3, z: 3 });

		const breakdown = selectCourseBreakdown(useStore.getState());
		expect(breakdown[0].type).toBe("ramp");
		expect(breakdown[1].type).toBe("tunnel");
	});
});
