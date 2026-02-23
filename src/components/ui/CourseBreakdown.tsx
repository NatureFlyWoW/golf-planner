import { useMemo, useState } from "react";
import {
	COURSE_CATEGORY_ID,
	DEFAULT_COST_PER_TYPE,
	DEFAULT_HOLE_COST,
} from "../../constants/budget";
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
	const buildMode = useStore((s) => s.financialSettings.buildMode);
	const budgetConfig = useStore((s) => s.budgetConfig);
	const courseCost = useStore(selectCourseCost);
	const holeCount = holeOrder.length;

	const costMap =
		buildMode === "diy"
			? budgetConfig.costPerTypeDiy
			: buildMode === "professional"
				? DEFAULT_COST_PER_TYPE
				: budgetConfig.costPerType;

	const breakdown: CourseBreakdownItem[] = useMemo(() => {
		const counts: Record<string, number> = {};
		for (const id of holeOrder) {
			const hole = holes[id];
			if (hole) counts[hole.type] = (counts[hole.type] ?? 0) + 1;
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
	}, [holeOrder, holes, costMap]);
	const manualOverride = useStore(
		(s) => s.budget[COURSE_CATEGORY_ID]?.manualOverride ?? false,
	);

	if (holeCount === 0) {
		return (
			<div className="px-3 py-2 text-center text-xs text-text-muted italic">
				Place holes to see course cost estimate
			</div>
		);
	}

	return (
		<div className="border-b border-subtle">
			<div className="flex items-center justify-between px-3 py-2">
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={() => setExpanded(!expanded)}
						className="flex items-center gap-1 text-xs font-medium text-primary"
					>
						<span>{expanded ? "▼" : "▶"}</span>
						<span>Course Cost Breakdown</span>
					</button>
					<span className="text-[10px] text-text-muted">
						(
						{buildMode === "diy"
							? "DIY"
							: buildMode === "professional"
								? "Pro"
								: "Mixed"}{" "}
						costs)
					</span>
				</div>
				<button
					type="button"
					onClick={onOpenSettings}
					className="rounded p-1 text-text-muted hover:bg-plasma hover:text-text-secondary"
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
								<span className="text-text-secondary">
									{item.count}× {item.label}
								</span>
								<span className="font-mono text-text-secondary">
									@ {formatEur(item.unitCost)} ={" "}
									<span className="font-medium font-mono text-primary">
										{formatEur(item.subtotal)}
									</span>
								</span>
							</div>
						))}
					</div>

					<div className="my-1 border-t border-subtle" />
					<div className="flex items-baseline justify-between text-xs">
						<span className="font-medium text-primary">
							Course total ({holeCount} holes)
						</span>
						<span className="font-mono font-semibold text-neon-amber">
							{formatEur(courseCost)}
						</span>
					</div>

					{manualOverride && (
						<div className="mt-1 text-[10px] text-neon-amber italic">
							Pinned estimate — unlock to auto-calculate
						</div>
					)}

					{!manualOverride && (
						<div className="mt-1 text-[10px] text-text-muted italic">
							Planning estimates — replace with real quotes when available
						</div>
					)}
				</div>
			)}
		</div>
	);
}
