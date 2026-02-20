import type { BudgetCategory, BudgetConfig, Hall, Hole } from "../types";

export type ExportData = {
	version: number;
	exportedAt: string;
	hall: { width: number; length: number };
	holes: Hole[];
	budget: BudgetCategory[];
	budgetConfig: BudgetConfig;
};

export function buildExportData(
	holes: Record<string, Hole>,
	holeOrder: string[],
	budget: Record<string, BudgetCategory>,
	hall: Hall,
	budgetConfig: BudgetConfig,
): ExportData {
	return {
		version: 2,
		exportedAt: new Date().toISOString(),
		hall: { width: hall.width, length: hall.length },
		holes: holeOrder.map((id) => holes[id]).filter(Boolean),
		budget: Object.values(budget),
		budgetConfig,
	};
}

export function downloadJson(data: ExportData) {
	const json = JSON.stringify(data, null, 2);
	const blob = new Blob([json], { type: "application/json" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `golf-layout-${new Date().toISOString().split("T")[0]}.json`;
	a.click();
	URL.revokeObjectURL(url);
}
