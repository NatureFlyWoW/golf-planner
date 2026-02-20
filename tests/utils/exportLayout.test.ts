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
