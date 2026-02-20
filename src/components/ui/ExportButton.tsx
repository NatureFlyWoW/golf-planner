import { useStore } from "../../store";
import { buildExportData, downloadJson } from "../../utils/exportLayout";

export function ExportButton() {
	const holes = useStore((s) => s.holes);
	const holeOrder = useStore((s) => s.holeOrder);
	const budget = useStore((s) => s.budget);
	const hall = useStore((s) => s.hall);
	const budgetConfig = useStore((s) => s.budgetConfig);
	const expenses = useStore((s) => s.expenses);

	function handleExport() {
		const data = buildExportData(
			holes,
			holeOrder,
			budget,
			hall,
			budgetConfig,
			expenses,
		);
		downloadJson(data);
	}

	return (
		<button
			type="button"
			onClick={handleExport}
			className="rounded bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
		>
			Export JSON
		</button>
	);
}
