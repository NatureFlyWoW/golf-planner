import {
	COURSE_CATEGORY_ID,
	DEFAULT_COST_PER_TYPE,
	DEFAULT_COST_PER_TYPE_DIY,
} from "../../constants/budget";
import { HOLE_TYPES } from "../../constants/holeTypes";
import { useStore } from "../../store";
import type { MaterialProfile } from "../../types/budget";

type Props = {
	onClose: () => void;
};

export function CostSettingsModal({ onClose }: Props) {
	const budgetConfig = useStore((s) => s.budgetConfig);
	const setBudgetConfig = useStore((s) => s.setBudgetConfig);
	const buildMode = useStore((s) => s.financialSettings.buildMode);
	const materialProfile = useStore((s) => s.budgetConfig.materialProfile);
	const manualOverride = useStore(
		(s) => s.budget[COURSE_CATEGORY_ID]?.manualOverride ?? false,
	);

	const isEditable = buildMode === "mixed" || buildMode === "diy";
	const costMap =
		buildMode === "diy"
			? budgetConfig.costPerTypeDiy
			: buildMode === "professional"
				? DEFAULT_COST_PER_TYPE
				: budgetConfig.costPerType;

	function handleCostChange(type: string, value: number) {
		if (buildMode === "diy") {
			setBudgetConfig({
				costPerTypeDiy: {
					...budgetConfig.costPerTypeDiy,
					[type]: Math.max(0, value),
				},
			});
		} else {
			setBudgetConfig({
				costPerType: {
					...budgetConfig.costPerType,
					[type]: Math.max(0, value),
				},
			});
		}
	}

	function handleReset() {
		if (buildMode === "diy") {
			setBudgetConfig({
				costPerTypeDiy: { ...DEFAULT_COST_PER_TYPE_DIY },
			});
		} else {
			setBudgetConfig({
				costPerType: { ...DEFAULT_COST_PER_TYPE },
			});
		}
	}

	const modeLabel =
		buildMode === "diy"
			? "DIY (materials only)"
			: buildMode === "professional"
				? "Professional (installed)"
				: "Mixed (custom)";

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: backdrop dismiss
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
			role="presentation"
			onClick={onClose}
		>
			{/* biome-ignore lint/a11y/noStaticElementInteractions: modal content */}
			<div
				className="mx-4 w-full max-w-sm rounded-xl bg-surface-raised shadow-xl"
				role="presentation"
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className="flex items-center justify-between border-b border-subtle px-4 py-3">
					<div className="flex flex-col">
						<span className="text-sm font-semibold">Per-Type Hole Costs</span>
						<span className="text-[10px] text-text-muted">{modeLabel}</span>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg p-1 text-text-muted hover:bg-plasma hover:text-text-secondary"
					>
						<span className="text-lg">✕</span>
					</button>
				</div>

				{/* Material Tier */}
				{buildMode !== "professional" && (
					<div className="flex items-center justify-between px-4 py-2 border-b border-subtle">
						<span className="text-[10px] text-text-secondary uppercase font-medium">
							Material Tier
						</span>
						<select
							value={materialProfile}
							onChange={(e) =>
								setBudgetConfig({
									materialProfile: e.target
										.value as MaterialProfile,
								})
							}
							className="rounded border border-subtle px-2 py-1 text-xs"
						>
							<option value="budget_diy">
								Budget DIY (0.65x)
							</option>
							<option value="standard_diy">
								Standard DIY (1.0x)
							</option>
							<option value="semi_pro">Semi-Pro (1.8x)</option>
						</select>
					</div>
				)}

				{/* Cost fields */}
				<div className="flex flex-col gap-2 px-4 py-3">
					{HOLE_TYPES.map((ht) => (
						// biome-ignore lint/a11y/noLabelWithoutControl: input is conditionally rendered inside
						<label key={ht.type} className="flex items-center justify-between">
							<span className="text-xs text-primary">{ht.label}</span>
							<div className="flex items-center gap-1">
								<span className="text-xs text-text-muted">€</span>
								{isEditable ? (
									<input
										type="number"
										value={costMap[ht.type] ?? 0}
										min={0}
										onChange={(e) =>
											handleCostChange(ht.type, Number(e.target.value))
										}
										className="w-24 rounded border border-subtle px-1.5 py-1 text-right text-xs"
									/>
								) : (
									<span className="w-24 text-right text-xs text-text-secondary">
										{(costMap[ht.type] ?? 0).toLocaleString("de-AT")}
									</span>
								)}
							</div>
						</label>
					))}
				</div>

				{/* Build mode info */}
				{buildMode === "professional" && (
					<div className="px-4 pb-2 text-[10px] text-text-muted italic">
						Professional costs are fixed. Switch to DIY or Mixed in Financial
						Settings to edit.
					</div>
				)}

				{/* Override warning */}
				{manualOverride && (
					<div className="px-4 pb-2 text-[10px] text-neon-amber italic">
						Course estimate is pinned. Changes here apply when you unlock it.
					</div>
				)}

				{/* Footer */}
				<div className="flex justify-end gap-2 border-t border-subtle px-4 py-3">
					{isEditable && (
						<button
							type="button"
							onClick={handleReset}
							className="rounded-lg px-3 py-1.5 text-xs text-text-secondary hover:bg-plasma"
						>
							Reset Defaults
						</button>
					)}
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg bg-accent-text px-3 py-1.5 text-xs text-white hover:bg-accent-text/80"
					>
						Close
					</button>
				</div>
			</div>
		</div>
	);
}
