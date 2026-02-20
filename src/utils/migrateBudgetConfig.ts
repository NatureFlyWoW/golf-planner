import { COURSE_CATEGORY_ID, DEFAULT_COST_PER_TYPE } from "../constants/budget";
import type { BudgetCategory, BudgetConfig } from "../types";

type V2Config = { costPerHole: number };
type LegacyConfig = BudgetConfig | V2Config | Record<string, never>;

export function migrateBudgetConfig(config: LegacyConfig): BudgetConfig {
	if (!config) {
		return { costPerType: { ...DEFAULT_COST_PER_TYPE } };
	}

	if ("costPerType" in config && config.costPerType) {
		return { costPerType: (config as BudgetConfig).costPerType };
	}

	if (!("costPerHole" in config)) {
		return { costPerType: { ...DEFAULT_COST_PER_TYPE } };
	}

	const perHole = (config as V2Config).costPerHole ?? 2700;
	const costPerType: Record<string, number> = {};
	for (const type of Object.keys(DEFAULT_COST_PER_TYPE)) {
		costPerType[type] = perHole;
	}

	return { costPerType };
}

export function migrateBudgetCategories(
	budget: Record<string, BudgetCategory>,
): Record<string, BudgetCategory> {
	if (!budget) return budget;

	const course = budget[COURSE_CATEGORY_ID];
	if (!course || course.manualOverride !== undefined) return budget;

	return {
		...budget,
		[COURSE_CATEGORY_ID]: {
			...course,
			manualOverride: true,
		},
	};
}
