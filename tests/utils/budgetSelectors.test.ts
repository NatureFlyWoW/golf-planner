import { beforeEach, describe, expect, it } from "vitest";
import {
	COURSE_CATEGORY_ID,
	DEFAULT_COST_PER_TYPE,
	DEFAULT_HOLE_COST,
} from "../../src/constants/budget";
import { useStore } from "../../src/store";
import { selectCourseCost } from "../../src/store/selectors";

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
