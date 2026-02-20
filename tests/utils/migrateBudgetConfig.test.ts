import { describe, expect, it } from "vitest";
import { DEFAULT_COST_PER_TYPE } from "../../src/constants/budget";
import {
	migrateBudgetCategories,
	migrateBudgetConfig,
} from "../../src/utils/migrateBudgetConfig";

describe("migrateBudgetConfig", () => {
	it("migrates v2 config (costPerHole) to v3 (costPerType)", () => {
		const v2Config = { costPerHole: 3000 };
		const result = migrateBudgetConfig(v2Config as any);

		expect(result.costPerType).toBeDefined();
		expect((result as any).costPerHole).toBeUndefined();
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

		const result = migrateBudgetCategories(budget as any);

		expect(result.course.manualOverride).toBe(true);
		expect((result.hall as any).manualOverride).toBeUndefined();
	});

	it("does not override existing manualOverride value", () => {
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
