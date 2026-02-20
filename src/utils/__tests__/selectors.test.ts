import { describe, expect, it } from "vitest";
import {
	computeActualTotal,
	computeCategoryActual,
	computeRiskBuffer,
	computeSubtotalNet,
	computeTotalReclaimableVat,
} from "../../store/selectors";
import type { BudgetCategoryV2 } from "../../types/budget";

const mockCategory = (
	overrides: Partial<BudgetCategoryV2>,
): BudgetCategoryV2 => ({
	id: "test",
	name: "Test",
	estimatedNet: 10000,
	notes: "",
	vatProfile: "standard_20",
	confidenceTier: "medium",
	uncertainty: { min: 8000, mode: 10000, max: 13000 },
	mandatory: false,
	phase: "construction",
	...overrides,
});

describe("computeSubtotalNet", () => {
	it("sums estimatedNet of all categories", () => {
		const cats: Record<string, BudgetCategoryV2> = {
			a: mockCategory({ id: "a", estimatedNet: 90000 }),
			b: mockCategory({ id: "b", estimatedNet: 10000 }),
		};
		expect(computeSubtotalNet(cats, 0, "course")).toBe(100000);
	});

	it("uses courseCost for the course category", () => {
		const cats: Record<string, BudgetCategoryV2> = {
			course: mockCategory({ id: "course", estimatedNet: 0 }),
			b: mockCategory({ id: "b", estimatedNet: 5000 }),
		};
		expect(computeSubtotalNet(cats, 15000, "course")).toBe(20000);
	});

	it("returns 0 for empty budget", () => {
		expect(computeSubtotalNet({}, 0, "course")).toBe(0);
	});
});

describe("computeRiskBuffer", () => {
	it("returns near-zero for all-fixed categories", () => {
		const cats: Record<string, BudgetCategoryV2> = {
			a: mockCategory({
				id: "a",
				estimatedNet: 90000,
				confidenceTier: "fixed",
			}),
		};
		const buffer = computeRiskBuffer(cats, 0, "course", "balanced");
		expect(buffer).toBe(1800); // 90000 * 0.02 * 1.0
	});

	it("returns higher buffer for high-uncertainty categories", () => {
		const cats: Record<string, BudgetCategoryV2> = {
			a: mockCategory({
				id: "a",
				estimatedNet: 12500,
				confidenceTier: "very_high",
			}),
		};
		const buffer = computeRiskBuffer(cats, 0, "course", "balanced");
		expect(buffer).toBe(5000); // 12500 * 0.40 * 1.0
	});

	it("scales with tolerance level", () => {
		const cats: Record<string, BudgetCategoryV2> = {
			a: mockCategory({
				id: "a",
				estimatedNet: 10000,
				confidenceTier: "medium",
			}),
		};
		const optimistic = computeRiskBuffer(cats, 0, "course", "optimistic");
		const conservative = computeRiskBuffer(cats, 0, "course", "conservative");
		expect(conservative).toBeGreaterThan(optimistic);
	});

	it("uses courseCost for course category in buffer", () => {
		const cats: Record<string, BudgetCategoryV2> = {
			course: mockCategory({
				id: "course",
				estimatedNet: 0,
				confidenceTier: "high",
			}),
		};
		const buffer = computeRiskBuffer(cats, 20000, "course", "balanced");
		// 20000 * 0.25 * 1.0 = 5000
		expect(buffer).toBe(5000);
	});

	it("returns 0 for empty budget", () => {
		expect(computeRiskBuffer({}, 0, "course", "balanced")).toBe(0);
	});
});

describe("computeTotalReclaimableVat", () => {
	it("sums 20% of net for standard categories when registered", () => {
		const cats: Record<string, BudgetCategoryV2> = {
			a: mockCategory({
				id: "a",
				estimatedNet: 90000,
				vatProfile: "standard_20",
			}),
			b: mockCategory({
				id: "b",
				estimatedNet: 9500,
				vatProfile: "exempt",
			}),
		};
		expect(computeTotalReclaimableVat(cats, true)).toBe(18000);
	});

	it("returns 0 when not registered", () => {
		const cats: Record<string, BudgetCategoryV2> = {
			a: mockCategory({ id: "a", estimatedNet: 90000 }),
		};
		expect(computeTotalReclaimableVat(cats, false)).toBe(0);
	});

	it("returns 0 for empty budget", () => {
		expect(computeTotalReclaimableVat({}, true)).toBe(0);
	});
});

describe("computeActualTotal", () => {
	it("sums all expense amounts", () => {
		const expenses = [
			{ categoryId: "hall", amount: 50000 },
			{ categoryId: "course", amount: 20000 },
			{ categoryId: "hall", amount: 10000 },
		];
		expect(computeActualTotal(expenses)).toBe(80000);
	});

	it("returns 0 for empty expenses", () => {
		expect(computeActualTotal([])).toBe(0);
	});
});

describe("computeCategoryActual", () => {
	it("sums expenses for a specific category", () => {
		const expenses = [
			{ categoryId: "hall", amount: 50000 },
			{ categoryId: "course", amount: 20000 },
			{ categoryId: "hall", amount: 10000 },
		];
		expect(computeCategoryActual(expenses, "hall")).toBe(60000);
	});

	it("returns 0 for category with no expenses", () => {
		const expenses = [{ categoryId: "hall", amount: 50000 }];
		expect(computeCategoryActual(expenses, "course")).toBe(0);
	});

	it("returns 0 for empty expenses", () => {
		expect(computeCategoryActual([], "hall")).toBe(0);
	});
});
