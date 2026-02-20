import {
	COURSE_CATEGORY_ID,
	DEFAULT_COST_PER_TYPE,
} from "../../constants/budget";
import { HOLE_TYPES } from "../../constants/holeTypes";
import { useStore } from "../../store";

type Props = {
	onClose: () => void;
};

export function CostSettingsModal({ onClose }: Props) {
	const budgetConfig = useStore((s) => s.budgetConfig);
	const setBudgetConfig = useStore((s) => s.setBudgetConfig);
	const manualOverride = useStore(
		(s) => s.budget[COURSE_CATEGORY_ID]?.manualOverride ?? false,
	);

	function handleCostChange(type: string, value: number) {
		setBudgetConfig({
			costPerType: {
				...budgetConfig.costPerType,
				[type]: Math.max(0, value),
			},
		});
	}

	function handleReset() {
		setBudgetConfig({
			costPerType: { ...DEFAULT_COST_PER_TYPE },
		});
	}

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: backdrop dismiss
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
			role="presentation"
			onClick={onClose}
		>
			{/* biome-ignore lint/a11y/noStaticElementInteractions: modal content */}
			<div
				className="mx-4 w-full max-w-sm rounded-xl bg-white shadow-xl"
				role="presentation"
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
					<span className="text-sm font-semibold">Per-Type Hole Costs</span>
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
					>
						<span className="text-lg">✕</span>
					</button>
				</div>

				{/* Cost fields */}
				<div className="flex flex-col gap-2 px-4 py-3">
					{HOLE_TYPES.map((ht) => (
						<label key={ht.type} className="flex items-center justify-between">
							<span className="text-xs text-gray-700">{ht.label}</span>
							<div className="flex items-center gap-1">
								<span className="text-xs text-gray-400">€</span>
								<input
									type="number"
									value={budgetConfig.costPerType[ht.type] ?? 0}
									min={0}
									onChange={(e) =>
										handleCostChange(ht.type, Number(e.target.value))
									}
									className="w-24 rounded border border-gray-200 px-1.5 py-1 text-right text-xs"
								/>
							</div>
						</label>
					))}
				</div>

				{/* Override warning */}
				{manualOverride && (
					<div className="px-4 pb-2 text-[10px] text-amber-600 italic">
						Course estimate is pinned. Changes here apply when you unlock it.
					</div>
				)}

				{/* Footer */}
				<div className="flex justify-end gap-2 border-t border-gray-200 px-4 py-3">
					<button
						type="button"
						onClick={handleReset}
						className="rounded-lg px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100"
					>
						Reset Defaults
					</button>
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs text-white hover:bg-blue-600"
					>
						Close
					</button>
				</div>
			</div>
		</div>
	);
}
