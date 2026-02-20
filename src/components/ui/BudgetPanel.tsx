import { useRef, useState } from "react";
import { BUDGET_HINTS, COURSE_CATEGORY_ID } from "../../constants/budget";
import { useStore } from "../../store";
import {
	computeActualTotal,
	computeCategoryActual,
	selectCourseCost,
} from "../../store/selectors";
import { CostSettingsModal } from "./CostSettingsModal";
import { CourseBreakdown } from "./CourseBreakdown";
import { ExpenseList } from "./ExpenseList";
import { FinancialSettingsModal } from "./FinancialSettingsModal";

/** Format number as EUR X,XXX for display */
function formatEur(n: number): string {
	return `\u20AC${n.toLocaleString("de-AT", { maximumFractionDigits: 0 })}`;
}

/** Progress bar color based on actual/estimated ratio */
function progressColor(ratio: number): string {
	if (ratio > 1) return "bg-red-500";
	if (ratio > 0.8) return "bg-amber-500";
	return "bg-blue-500";
}

export function BudgetPanel() {
	const budget = useStore((s) => s.budget);
	const updateBudget = useStore((s) => s.updateBudget);
	const courseCost = useStore(selectCourseCost);
	const toggleCourseOverride = useStore((s) => s.toggleCourseOverride);
	const expenses = useStore((s) => s.expenses);

	const [expandedId, setExpandedId] = useState<string | null>(null);
	const [showSettings, setShowSettings] = useState(false);
	const [showFinancialSettings, setShowFinancialSettings] = useState(false);
	const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

	const categories = Object.values(budget);
	const subtotal = categories.reduce(
		(sum, c) =>
			c.id === COURSE_CATEGORY_ID ? sum + courseCost : sum + c.estimatedNet,
		0,
	);
	const actualTotal = computeActualTotal(expenses);
	const contingency = subtotal * 0.1;
	const grandTotal = subtotal + contingency;
	const variance = grandTotal - actualTotal;

	function handleExpand(id: string) {
		const nextId = expandedId === id ? null : id;
		setExpandedId(nextId);
		if (nextId) {
			// Scroll expanded card into view after render
			requestAnimationFrame(() => {
				cardRefs.current[nextId]?.scrollIntoView({
					behavior: "smooth",
					block: "nearest",
				});
			});
		}
	}

	return (
		<div className="flex h-full flex-col">
			{/* Summary header */}
			<div className="border-b border-gray-200 px-3 py-2">
				<div className="flex items-center justify-between">
					<span className="text-xs font-semibold text-gray-700">Budget</span>
					<button
						type="button"
						onClick={() => setShowFinancialSettings(true)}
						className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
						title="Financial Settings"
					>
						<span className="text-sm">{"\u2699"}</span>
					</button>
				</div>
				<div className="flex items-baseline justify-between">
					<span className="text-xs text-gray-500">Estimated</span>
					<span className="text-sm font-semibold">{formatEur(grandTotal)}</span>
				</div>
				<div className="flex items-baseline justify-between">
					<span className="text-xs text-gray-500">Actual</span>
					<span className="text-sm font-semibold">
						{formatEur(actualTotal)}
					</span>
				</div>
				<div className="mt-1 flex items-baseline justify-between">
					<span className="text-xs text-gray-500">Variance</span>
					<span
						className={`text-xs font-medium ${
							variance >= 0 ? "text-green-600" : "text-red-600"
						}`}
					>
						{variance >= 0 ? "\u25BC" : "\u25B2"}{" "}
						{formatEur(Math.abs(variance))}
						{variance >= 0 ? " under" : " over"}
					</span>
				</div>
			</div>

			{/* Category cards -- scrollable */}
			<div className="flex-1 overflow-y-auto p-2">
				<CourseBreakdown onOpenSettings={() => setShowSettings(true)} />
				<div className="flex flex-col gap-2">
					{categories.map((cat) => {
						const isCourse = cat.id === COURSE_CATEGORY_ID;
						const displayNet = isCourse ? courseCost : cat.estimatedNet;
						const catActual = computeCategoryActual(expenses, cat.id);
						const ratio = displayNet > 0 ? catActual / displayNet : 0;
						const isExpanded = expandedId === cat.id;

						return (
							<div
								key={cat.id}
								ref={(el) => {
									cardRefs.current[cat.id] = el;
								}}
								className="rounded-lg border border-gray-200 bg-white"
							>
								{/* Card header */}
								<div className="flex items-center gap-1 px-2.5 pt-2">
									<button
										type="button"
										onClick={() => handleExpand(cat.id)}
										className="flex-1 text-left text-xs font-medium text-gray-700"
									>
										{cat.name}
									</button>
									{isCourse && (
										<button
											type="button"
											onClick={() => toggleCourseOverride()}
											className="rounded p-0.5 text-gray-400 hover:text-gray-600"
											title={
												cat.manualOverride
													? "Unlock auto-calculation"
													: "Pin estimate"
											}
										>
											<span className="text-xs">
												{cat.manualOverride ? "\uD83D\uDD12" : "\uD83D\uDD13"}
											</span>
										</button>
									)}
								</div>
								<button
									type="button"
									onClick={() => handleExpand(cat.id)}
									className="w-full px-2.5 pb-2 text-left"
								>
									{BUDGET_HINTS[cat.id] && (
										<div className="text-[10px] text-gray-400 italic">
											{BUDGET_HINTS[cat.id]}
										</div>
									)}
									<div className="mt-1 flex gap-2">
										<div className="flex items-center gap-1">
											<span className="text-[10px] text-gray-400">Est</span>
											<span className="text-xs font-medium">
												{formatEur(displayNet)}
											</span>
										</div>
										<div className="flex items-center gap-1">
											<span className="text-[10px] text-gray-400">Spent</span>
											<span className="text-xs font-medium">
												{formatEur(catActual)}
											</span>
										</div>
									</div>
									{/* Progress bar */}
									<div className="mt-1.5 h-1 w-full rounded-full bg-gray-100">
										<div
											className={`h-1 rounded-full transition-all ${progressColor(ratio)}`}
											style={{
												width: `${Math.min(100, ratio * 100)}%`,
											}}
										/>
									</div>
								</button>

								{/* Expanded: edit fields */}
								{isExpanded && (
									<div className="border-t border-gray-100 px-2.5 py-2">
										<div className="flex flex-col gap-2">
											{isCourse && !cat.manualOverride ? (
												<div className="flex flex-col gap-0.5">
													<span className="text-[10px] text-gray-400">
														Estimated (auto)
													</span>
													<span className="text-xs font-medium">
														{formatEur(courseCost)}
													</span>
												</div>
											) : (
												<label className="flex flex-col gap-0.5">
													<span className="text-[10px] text-gray-400">
														Estimated
														{isCourse ? " (pinned)" : ""}
													</span>
													<div className="flex items-center gap-1">
														<span className="text-xs text-gray-400">
															{"\u20AC"}
														</span>
														<input
															type="number"
															value={cat.estimatedNet}
															min={0}
															onChange={(e) =>
																updateBudget(cat.id, {
																	estimatedNet: Math.max(
																		0,
																		Number(e.target.value),
																	),
																})
															}
															className="w-full rounded border border-gray-200 px-1.5 py-1 text-xs"
														/>
													</div>
												</label>
											)}
											<label className="flex flex-col gap-0.5">
												<span className="text-[10px] text-gray-400">Notes</span>
												<textarea
													value={cat.notes}
													onChange={(e) =>
														updateBudget(cat.id, {
															notes: e.target.value,
														})
													}
													rows={2}
													className="w-full rounded border border-gray-200 px-1.5 py-1 text-xs"
												/>
											</label>
											{/* Expense tracking */}
											<ExpenseList categoryId={cat.id} />
										</div>
									</div>
								)}
							</div>
						);
					})}
				</div>
			</div>

			{/* Footer: contingency + total */}
			<div className="border-t border-gray-200 px-3 py-2">
				<div className="flex items-baseline justify-between">
					<span className="text-[10px] text-gray-400">Contingency (10%)</span>
					<span className="text-xs text-gray-600">
						{formatEur(contingency)}
					</span>
				</div>
				<div className="mt-0.5 flex items-baseline justify-between">
					<span className="text-xs font-semibold text-gray-700">
						Grand Total
					</span>
					<span className="text-sm font-bold">{formatEur(grandTotal)}</span>
				</div>
			</div>

			{showSettings && (
				<CostSettingsModal onClose={() => setShowSettings(false)} />
			)}
			{showFinancialSettings && (
				<FinancialSettingsModal
					onClose={() => setShowFinancialSettings(false)}
				/>
			)}
		</div>
	);
}
