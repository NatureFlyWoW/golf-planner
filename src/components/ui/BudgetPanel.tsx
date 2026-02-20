import { useRef, useState } from "react";
import { BUDGET_HINTS, COURSE_CATEGORY_ID } from "../../constants/budget";
import { useStore } from "../../store";
import {
	computeActualTotal,
	computeCategoryActual,
	computeRiskBuffer,
	computeSubtotalNet,
	computeTotalReclaimableVat,
	selectCourseCost,
} from "../../store/selectors";
import type { ConfidenceTier, QuoteInfo } from "../../types/budget";
import { inflatedEstimate } from "../../utils/financial";
import { CostSettingsModal } from "./CostSettingsModal";
import { CourseBreakdown } from "./CourseBreakdown";
import { ExpenseList } from "./ExpenseList";
import { FinancialSettingsModal } from "./FinancialSettingsModal";

/** Format number as EUR X,XXX for display */
function displayEur(n: number): string {
	return `\u20AC${n.toLocaleString("de-AT", { maximumFractionDigits: 0 })}`;
}

/** Progress bar color based on actual/estimated ratio */
function progressColor(ratio: number): string {
	if (ratio > 1) return "bg-red-500";
	if (ratio > 0.8) return "bg-amber-500";
	return "bg-blue-500";
}

type BudgetWarning = {
	id: string;
	severity: "critical" | "warning" | "info";
	title: string;
};

function quoteStatusBadge(quote: QuoteInfo | undefined): {
	label: string;
	className: string;
} | null {
	if (!quote) return null;
	const now = new Date();
	const validUntil = new Date(quote.validUntil);
	const daysRemaining = Math.ceil(
		(validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
	);
	if (daysRemaining < 0) {
		return {
			label: `Expired ${Math.abs(daysRemaining)}d ago`,
			className: "bg-red-100 text-red-700",
		};
	}
	if (daysRemaining <= 14) {
		return {
			label: `Expires in ${daysRemaining}d`,
			className: "bg-amber-100 text-amber-700",
		};
	}
	return { label: "Quoted", className: "bg-green-100 text-green-700" };
}

export function BudgetPanel() {
	const budget = useStore((s) => s.budget);
	const updateBudget = useStore((s) => s.updateBudget);
	const courseCost = useStore(selectCourseCost);
	const toggleCourseOverride = useStore((s) => s.toggleCourseOverride);
	const updateCategoryTier = useStore((s) => s.updateCategoryTier);
	const financialSettings = useStore((s) => s.financialSettings);
	const expenses = useStore((s) => s.expenses);

	const [expandedId, setExpandedId] = useState<string | null>(null);
	const [showSettings, setShowSettings] = useState(false);
	const [showFinancialSettings, setShowFinancialSettings] = useState(false);
	const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

	const categories = Object.values(budget);

	// Net-basis totals
	const subtotalNet = computeSubtotalNet(
		budget,
		courseCost,
		COURSE_CATEGORY_ID,
	);
	const riskBuffer = computeRiskBuffer(
		budget,
		courseCost,
		COURSE_CATEGORY_ID,
		financialSettings.riskTolerance,
	);
	const riskPercent =
		subtotalNet > 0 ? Math.round((riskBuffer / subtotalNet) * 100) : 0;
	const budgetTargetNet = subtotalNet + riskBuffer;

	// Actuals from expenses
	const actualTotal = computeActualTotal(expenses);

	// VAT display
	const reclaimableVat = computeTotalReclaimableVat(
		budget,
		financialSettings.vatRegistered,
	);

	// Inflation adjustment
	const { inflationFactor } = financialSettings;
	const hasInflation = inflationFactor > 1.0;
	const inflationPct = hasInflation
		? Math.round((inflationFactor - 1.0) * 1000) / 10
		: 0;
	const inflatedSubtotalNet = categories.reduce((sum, cat) => {
		const catNet =
			cat.id === COURSE_CATEGORY_ID ? courseCost : cat.estimatedNet;
		return sum + inflatedEstimate(catNet, cat.confidenceTier, inflationFactor);
	}, 0);

	// Risk tolerance label
	const toleranceLabel =
		financialSettings.riskTolerance.charAt(0).toUpperCase() +
		financialSettings.riskTolerance.slice(1);

	// Budget health warnings
	const warnings: BudgetWarning[] = [];

	// Check mandatory categories with zero estimate
	for (const cat of categories) {
		if (
			cat.mandatory &&
			cat.estimatedNet === 0 &&
			cat.id !== COURSE_CATEGORY_ID
		) {
			warnings.push({
				id: `zero-${cat.id}`,
				severity: "critical",
				title: `${cat.name}: estimate is \u20AC0`,
			});
		}
	}

	// Check total bounds (feasibility study)
	if (subtotalNet > 0 && subtotalNet < 150000) {
		warnings.push({
			id: "total-low",
			severity: "warning",
			title: "Total below \u20AC150k feasibility study minimum",
		});
	}
	if (subtotalNet > 350000) {
		warnings.push({
			id: "total-high",
			severity: "warning",
			title: "Total exceeds \u20AC350k feasibility study maximum",
		});
	}

	// VAT not configured hint
	if (!financialSettings.vatRegistered) {
		warnings.push({
			id: "vat-hint",
			severity: "info",
			title: `VAT registered? Could save ~${displayEur(computeTotalReclaimableVat(budget, true))} Vorsteuer`,
		});
	}

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

				{/* Budget warnings */}
				{warnings.length > 0 && (
					<div className="mt-1 flex flex-col gap-1">
						{warnings.map((w) => (
							<div
								key={w.id}
								className={`rounded px-2 py-1 text-[10px] ${
									w.severity === "critical"
										? "bg-red-50 text-red-700"
										: w.severity === "warning"
											? "bg-amber-50 text-amber-700"
											: "bg-blue-50 text-blue-700"
								}`}
							>
								{w.title}
							</div>
						))}
					</div>
				)}

				<div className="mt-1 flex items-baseline justify-between">
					<span className="text-xs text-gray-500">Subtotal (net)</span>
					<span className="text-sm font-semibold">
						{displayEur(subtotalNet)}
					</span>
				</div>
				{hasInflation && (
					<div className="flex items-baseline justify-between">
						<span className="text-xs text-amber-600">
							Inflated (+{inflationPct}%)
						</span>
						<span className="text-xs font-medium text-amber-600">
							{displayEur(inflatedSubtotalNet)}
						</span>
					</div>
				)}
				<div className="flex items-baseline justify-between">
					<span className="text-xs text-gray-500">
						Risk buffer ({toleranceLabel}, {riskPercent}%)
					</span>
					<span className="text-xs text-gray-600">
						{displayEur(riskBuffer)}
					</span>
				</div>
				<div className="mt-0.5 flex items-baseline justify-between">
					<span className="text-xs font-semibold text-gray-700">
						Budget Target
					</span>
					<span className="text-sm font-bold">
						{displayEur(budgetTargetNet)}
					</span>
				</div>
				<div className="flex items-baseline justify-between">
					<span className="text-xs text-gray-500">Actual (spent)</span>
					<span className="text-sm font-semibold">
						{displayEur(actualTotal)}
					</span>
				</div>
				{financialSettings.vatRegistered && reclaimableVat > 0 && (
					<div className="mt-0.5 flex items-baseline justify-between">
						<span className="text-[10px] text-green-600">
							Reclaimable Vorsteuer
						</span>
						<span className="text-xs font-medium text-green-600">
							{displayEur(reclaimableVat)}
						</span>
					</div>
				)}
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
									{cat.mandatory && (
										<span
											className="text-[10px] text-gray-400"
											title="Mandatory"
										>
											{"\uD83D\uDD12"}
										</span>
									)}
									<button
										type="button"
										onClick={() => handleExpand(cat.id)}
										className="flex-1 text-left text-xs font-medium text-gray-700"
									>
										{cat.name}
									</button>
									{/* Confidence tier badge */}
									<span
										className={`rounded px-1 py-0.5 text-[9px] font-medium ${
											cat.confidenceTier === "fixed"
												? "bg-green-100 text-green-700"
												: cat.confidenceTier === "low"
													? "bg-blue-100 text-blue-700"
													: cat.confidenceTier === "medium"
														? "bg-yellow-100 text-yellow-700"
														: cat.confidenceTier === "high"
															? "bg-orange-100 text-orange-700"
															: "bg-red-100 text-red-700"
										}`}
									>
										{cat.confidenceTier === "very_high"
											? "V.High"
											: cat.confidenceTier.charAt(0).toUpperCase() +
												cat.confidenceTier.slice(1)}
									</span>
									{(() => {
										const badge = quoteStatusBadge(cat.quote);
										if (!badge) return null;
										return (
											<span
												className={`rounded px-1 py-0.5 text-[9px] font-medium ${badge.className}`}
											>
												{badge.label}
											</span>
										);
									})()}
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
											<span className="text-[10px] text-gray-400">Net</span>
											<span className="text-xs font-medium">
												{displayEur(displayNet)}
											</span>
										</div>
										{financialSettings.displayMode !== "net" &&
											cat.vatProfile === "standard_20" && (
												<div className="flex items-center gap-1">
													<span className="text-[10px] text-gray-400">
														Gross
													</span>
													<span className="text-xs text-gray-500">
														{displayEur(Math.round(displayNet * 1.2))}
													</span>
												</div>
											)}
										<div className="flex items-center gap-1">
											<span className="text-[10px] text-gray-400">Spent</span>
											<span className="text-xs font-medium">
												{displayEur(catActual)}
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
														{displayEur(courseCost)}
													</span>
												</div>
											) : (
												<label className="flex flex-col gap-0.5">
													<span className="text-[10px] text-gray-400">
														Estimated (net)
														{isCourse ? " \u2014 pinned" : ""}
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
											{/* Confidence tier selector */}
											<label className="flex flex-col gap-0.5">
												<span className="text-[10px] text-gray-400">
													Confidence Tier
												</span>
												<select
													value={cat.confidenceTier}
													onChange={(e) =>
														updateCategoryTier(
															cat.id,
															e.target.value as ConfidenceTier,
														)
													}
													className="w-full rounded border border-gray-200 px-1.5 py-1 text-xs"
												>
													<option value="fixed">Fixed price (\u00B12%)</option>
													<option value="low">
														Low uncertainty (\u00B110-15%)
													</option>
													<option value="medium">
														Medium uncertainty (\u00B120-30%)
													</option>
													<option value="high">
														High uncertainty (\u00B140-60%)
													</option>
													<option value="very_high">
														Very high (\u00B150-100%)
													</option>
												</select>
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

			{/* Footer: risk buffer + budget target */}
			<div className="border-t border-gray-200 px-3 py-2">
				<div className="flex items-baseline justify-between">
					<span className="text-[10px] text-gray-400">
						Risk buffer ({toleranceLabel}, {riskPercent}%)
					</span>
					<span className="text-xs text-gray-600">
						{displayEur(riskBuffer)}
					</span>
				</div>
				<div className="mt-0.5 flex items-baseline justify-between">
					<span className="text-xs font-semibold text-gray-700">
						Budget Target
					</span>
					<span className="text-sm font-bold">
						{displayEur(budgetTargetNet)}
					</span>
				</div>
				{financialSettings.vatRegistered && reclaimableVat > 0 && (
					<div className="mt-0.5 flex items-baseline justify-between">
						<span className="text-[10px] text-green-600">
							Reclaimable Vorsteuer
						</span>
						<span className="text-xs font-medium text-green-600">
							{displayEur(reclaimableVat)}
						</span>
					</div>
				)}
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
