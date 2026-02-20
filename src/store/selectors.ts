import { COURSE_CATEGORY_ID, DEFAULT_HOLE_COST } from "../constants/budget";
import { HOLE_TYPE_MAP } from "../constants/holeTypes";
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
