import { useStore } from "../../store";
import { BudgetPanel } from "./BudgetPanel";

export function MobileBudgetPanel() {
	const activePanel = useStore((s) => s.ui.activePanel);
	const setActivePanel = useStore((s) => s.setActivePanel);

	if (activePanel !== "budget") return null;

	function handleClose() {
		setActivePanel(null);
	}

	return (
		<div className="fixed inset-0 z-50 flex flex-col bg-white md:hidden">
			{/* Header */}
			<div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
				<span className="text-base font-semibold">Budget</span>
				<button
					type="button"
					onClick={handleClose}
					className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
				>
					<span className="text-xl">&#x2715;</span>
				</button>
			</div>

			{/* Budget content — reuse shared component */}
			<div className="flex min-h-0 flex-1 flex-col">
				<BudgetPanel />
			</div>
		</div>
	);
}
