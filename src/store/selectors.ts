import {
	COURSE_CATEGORY_ID,
	DEFAULT_COST_PER_TYPE,
	DEFAULT_HOLE_COST,
} from "../constants/budget";
import { HOLE_TYPE_MAP } from "../constants/holeTypes";
import type { BudgetCategoryV2, RiskTolerance } from "../types/budget";
import { reclaimableVat, riskBuffer, roundEur } from "../utils/financial";
import type { Store } from "./store";

export function selectCourseCost(state: Store): number {
	const cat = state.budget[COURSE_CATEGORY_ID];
	if (cat?.manualOverride) return cat.estimatedNet;

	const { buildMode } = state.financialSettings;
	const costMap =
		buildMode === "diy"
			? state.budgetConfig.costPerTypeDiy
			: buildMode === "professional"
				? DEFAULT_COST_PER_TYPE
				: state.budgetConfig.costPerType; // mixed = user-editable

	return state.holeOrder.reduce(
		(sum, id) => sum + (costMap[state.holes[id]?.type] ?? DEFAULT_HOLE_COST),
		0,
	);
}

export type CourseBreakdownItem = {
	type: string;
	label: string;
	count: number;
	unitCost: number;
	subtotal: number;
};

export function selectCourseBreakdown(state: Store): CourseBreakdownItem[] {
	const { buildMode } = state.financialSettings;
	const costMap =
		buildMode === "diy"
			? state.budgetConfig.costPerTypeDiy
			: buildMode === "professional"
				? DEFAULT_COST_PER_TYPE
				: state.budgetConfig.costPerType;

	const counts: Record<string, number> = {};
	for (const id of state.holeOrder) {
		const hole = state.holes[id];
		if (hole) {
			counts[hole.type] = (counts[hole.type] ?? 0) + 1;
		}
	}

	return Object.entries(counts)
		.map(([type, count]) => {
			const unitCost = costMap[type] ?? DEFAULT_HOLE_COST;
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

/** Sum of estimatedNet across all categories, using courseCost for the course category */
export function computeSubtotalNet(
	budget: Record<string, BudgetCategoryV2>,
	courseCost: number,
	courseId: string,
): number {
	return roundEur(
		Object.values(budget).reduce(
			(sum, cat) =>
				cat.id === courseId ? sum + courseCost : sum + cat.estimatedNet,
			0,
		),
	);
}

/** Risk-weighted contingency buffer */
export function computeRiskBuffer(
	budget: Record<string, BudgetCategoryV2>,
	courseCost: number,
	courseId: string,
	tolerance: RiskTolerance,
): number {
	return roundEur(
		Object.values(budget).reduce((sum, cat) => {
			const net = cat.id === courseId ? courseCost : cat.estimatedNet;
			return sum + riskBuffer(net, cat.confidenceTier, tolerance);
		}, 0),
	);
}

/** Total reclaimable Vorsteuer across all categories */
export function computeTotalReclaimableVat(
	budget: Record<string, BudgetCategoryV2>,
	vatRegistered: boolean,
): number {
	return roundEur(
		Object.values(budget).reduce(
			(sum, cat) =>
				sum + reclaimableVat(cat.estimatedNet, cat.vatProfile, vatRegistered),
			0,
		),
	);
}

/** Actual total from expenses */
export function computeActualTotal(
	expenses: Array<{ categoryId: string; amount: number }>,
): number {
	return roundEur(expenses.reduce((sum, e) => sum + e.amount, 0));
}

/** Actual for a single category */
export function computeCategoryActual(
	expenses: Array<{ categoryId: string; amount: number }>,
	categoryId: string,
): number {
	return roundEur(
		expenses
			.filter((e) => e.categoryId === categoryId)
			.reduce((sum, e) => sum + e.amount, 0),
	);
}
