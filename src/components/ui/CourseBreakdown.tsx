import { useMemo, useState } from "react";
import { COURSE_CATEGORY_ID, DEFAULT_HOLE_COST } from "../../constants/budget";
import { HOLE_TYPE_MAP } from "../../constants/holeTypes";
import { useStore } from "../../store";
import type { CourseBreakdownItem } from "../../store/selectors";
import { selectCourseCost } from "../../store/selectors";

function formatEur(n: number): string {
	return `€${n.toLocaleString("de-AT", { maximumFractionDigits: 0 })}`;
}

type Props = {
	onOpenSettings: () => void;
};

export function CourseBreakdown({ onOpenSettings }: Props) {
	const [expanded, setExpanded] = useState(true);
	const holeOrder = useStore((s) => s.holeOrder);
	const holes = useStore((s) => s.holes);
	const costPerType = useStore((s) => s.budgetConfig.costPerType);
	const courseCost = useStore(selectCourseCost);
	const holeCount = holeOrder.length;

	const breakdown: CourseBreakdownItem[] = useMemo(() => {
		const counts: Record<string, number> = {};
		for (const id of holeOrder) {
			const hole = holes[id];
			if (hole) counts[hole.type] = (counts[hole.type] ?? 0) + 1;
		}
		return Object.entries(counts)
			.map(([type, count]) => {
				const unitCost = costPerType[type] ?? DEFAULT_HOLE_COST;
				return {
					type,
					label: HOLE_TYPE_MAP[type]?.label ?? type,
					count,
					unitCost,
					subtotal: count * unitCost,
				};
			})
			.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
	}, [holeOrder, holes, costPerType]);
	const manualOverride = useStore(
		(s) => s.budget[COURSE_CATEGORY_ID]?.manualOverride ?? false,
	);

	if (holeCount === 0) {
		return (
			<div className="px-3 py-2 text-center text-xs text-gray-400 italic">
				Place holes to see course cost estimate
			</div>
		);
	}

	return (
		<div className="border-b border-gray-200">
			<div className="flex items-center justify-between px-3 py-2">
				<button
					type="button"
					onClick={() => setExpanded(!expanded)}
					className="flex items-center gap-1 text-xs font-medium text-gray-700"
				>
					<span>{expanded ? "▼" : "▶"}</span>
					<span>Course Cost Breakdown</span>
				</button>
				<button
					type="button"
					onClick={onOpenSettings}
					className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
					title="Edit per-type costs"
				>
					<span className="text-sm">⚙</span>
				</button>
			</div>

			{expanded && (
				<div className="px-3 pb-2">
					<div className="flex flex-col gap-0.5">
						{breakdown.map((item) => (
							<div
								key={item.type}
								className="flex items-baseline justify-between text-xs"
							>
								<span className="text-gray-600">
									{item.count}× {item.label}
								</span>
								<span className="text-gray-500">
									@ {formatEur(item.unitCost)} ={" "}
									<span className="font-medium text-gray-700">
										{formatEur(item.subtotal)}
									</span>
								</span>
							</div>
						))}
					</div>

					<div className="my-1 border-t border-gray-100" />
					<div className="flex items-baseline justify-between text-xs">
						<span className="font-medium text-gray-700">
							Course total ({holeCount} holes)
						</span>
						<span className="font-semibold">{formatEur(courseCost)}</span>
					</div>

					{manualOverride && (
						<div className="mt-1 text-[10px] text-amber-600 italic">
							Pinned estimate — unlock to auto-calculate
						</div>
					)}

					{!manualOverride && (
						<div className="mt-1 text-[10px] text-gray-400 italic">
							Planning estimates — replace with real quotes when available
						</div>
					)}
				</div>
			)}
		</div>
	);
}
