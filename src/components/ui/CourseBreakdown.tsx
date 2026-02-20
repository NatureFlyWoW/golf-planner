import { useState } from "react";
import { COURSE_CATEGORY_ID } from "../../constants/budget";
import { useStore } from "../../store";
import { selectCourseBreakdown, selectCourseCost } from "../../store/selectors";

function formatEur(n: number): string {
	return `€${n.toLocaleString("de-AT", { maximumFractionDigits: 0 })}`;
}

type Props = {
	onOpenSettings: () => void;
};

export function CourseBreakdown({ onOpenSettings }: Props) {
	const [expanded, setExpanded] = useState(true);
	const breakdown = useStore(selectCourseBreakdown);
	const courseCost = useStore(selectCourseCost);
	const holeCount = useStore((s) => s.holeOrder.length);
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
