import { useRef, useState } from "react";
import { BUDGET_HINTS, COURSE_CATEGORY_ID } from "../../constants/budget";
import { useStore } from "../../store";
import { selectCourseCost } from "../../store/selectors";
import { CourseBreakdown } from "./CourseBreakdown";

/** Format number as €X,XXX for display */
function formatEur(n: number): string {
	return `€${n.toLocaleString("de-AT", { maximumFractionDigits: 0 })}`;
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

	const [expandedId, setExpandedId] = useState<string | null>(null);
	const [showSettings, setShowSettings] = useState(false);
	const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

	const categories = Object.values(budget);
	const subtotal = categories.reduce(
		(sum, c) =>
			c.id === COURSE_CATEGORY_ID ? sum + courseCost : sum + c.estimated,
		0,
	);
	const actualTotal = categories.reduce((sum, c) => sum + c.actual, 0);
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
						{variance >= 0 ? "▼" : "▲"} {formatEur(Math.abs(variance))}
						{variance >= 0 ? " under" : " over"}
					</span>
				</div>
			</div>

			{/* Category cards — scrollable */}
			<div className="flex-1 overflow-y-auto p-2">
				<CourseBreakdown onOpenSettings={() => setShowSettings(true)} />
				<div className="flex flex-col gap-2">
					{categories.map((cat) => {
						const isCourse = cat.id === COURSE_CATEGORY_ID;
						const displayEst = isCourse ? courseCost : cat.estimated;
						const ratio = displayEst > 0 ? cat.actual / displayEst : 0;
						const isExpanded = expandedId === cat.id;

						return (
							<div
								key={cat.id}
								ref={(el) => {
									cardRefs.current[cat.id] = el;
								}}
								className="rounded-lg border border-gray-200 bg-white"
							>
								{/* Card header — clickable to expand */}
								<button
									type="button"
									onClick={() => handleExpand(cat.id)}
									className="w-full px-2.5 py-2 text-left"
								>
									<div className="flex items-center text-xs font-medium text-gray-700">
										<span>{cat.name}</span>
										{isCourse && (
											<button
												type="button"
												onClick={(e) => {
													e.stopPropagation();
													toggleCourseOverride();
												}}
												className="ml-auto rounded p-0.5 text-gray-400 hover:text-gray-600"
												title={
													cat.manualOverride
														? "Unlock auto-calculation"
														: "Pin estimate"
												}
											>
												<span className="text-xs">
													{cat.manualOverride ? "🔒" : "🔓"}
												</span>
											</button>
										)}
									</div>
									{BUDGET_HINTS[cat.id] && (
										<div className="text-[10px] text-gray-400 italic">
											{BUDGET_HINTS[cat.id]}
										</div>
									)}
									<div className="mt-1 flex gap-2">
										<div className="flex items-center gap-1">
											<span className="text-[10px] text-gray-400">Est</span>
											<span className="text-xs font-medium">
												{formatEur(displayEst)}
											</span>
										</div>
										<div className="flex items-center gap-1">
											<span className="text-[10px] text-gray-400">Act</span>
											<span className="text-xs font-medium">
												{formatEur(cat.actual)}
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
														Estimated{isCourse ? " (pinned)" : ""}
													</span>
													<div className="flex items-center gap-1">
														<span className="text-xs text-gray-400">€</span>
														<input
															type="number"
															value={cat.estimated}
															min={0}
															onChange={(e) =>
																updateBudget(cat.id, {
																	estimated: Math.max(
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
												<span className="text-[10px] text-gray-400">
													Actual
												</span>
												<div className="flex items-center gap-1">
													<span className="text-xs text-gray-400">€</span>
													<input
														type="number"
														value={cat.actual}
														min={0}
														onChange={(e) =>
															updateBudget(cat.id, {
																actual: Math.max(0, Number(e.target.value)),
															})
														}
														className="w-full rounded border border-gray-200 px-1.5 py-1 text-xs"
													/>
												</div>
											</label>
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

			{/* Settings panel placeholder — wired up in Task 6/7 */}
			{showSettings && <div className="hidden" aria-hidden="true" />}
		</div>
	);
}
