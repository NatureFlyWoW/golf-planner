import { describe, expect, it } from "vitest";
import { DEFAULT_BUDGET_CONFIG } from "../../src/constants/budget";
import type { BudgetCategory, Hall, Hole } from "../../src/types";
import { buildExportData } from "../../src/utils/exportLayout";

describe("buildExportData", () => {
	it("builds a complete export object", () => {
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
		const hall = { width: 10, length: 20 } as Hall;

		const result = buildExportData(
			holes,
			holeOrder,
			budget,
			hall,
			DEFAULT_BUDGET_CONFIG,
		);

		expect(result.version).toBe(2);
		expect(result.exportedAt).toBeDefined();
		expect(result.hall.width).toBe(10);
		expect(result.holes).toHaveLength(2);
		expect(result.holes[0].name).toBe("Hole 1");
		expect(result.holes[1].name).toBe("Hole 2");
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
			{
				width: 10,
				length: 20,
			} as Hall,
			DEFAULT_BUDGET_CONFIG,
		);

		expect(result.holes[0].name).toBe("First");
		expect(result.holes[1].name).toBe("Second");
	});
});
