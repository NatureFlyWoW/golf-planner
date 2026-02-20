import { useStore } from "../../store";
import type { SidebarTab } from "../../types";
import { BudgetPanel } from "./BudgetPanel";
import { HoleDetail } from "./HoleDetail";
import { HoleLibrary } from "./HoleLibrary";

const tabs: { tab: SidebarTab; label: string }[] = [
	{ tab: "holes", label: "Holes" },
	{ tab: "detail", label: "Detail" },
	{ tab: "budget", label: "Budget" },
];

export function Sidebar() {
	const activeTab = useStore((s) => s.ui.sidebarTab);
	const setSidebarTab = useStore((s) => s.setSidebarTab);

	return (
		<div className="hidden h-full w-64 flex-col border-r border-gray-200 bg-white md:flex">
			<div className="flex border-b border-gray-200">
				{tabs.map(({ tab, label }) => (
					<button
						type="button"
						key={tab}
						onClick={() => setSidebarTab(tab)}
						className={`flex-1 px-2 py-2 text-xs font-medium transition-colors ${
							activeTab === tab
								? "border-b-2 border-blue-600 text-blue-600"
								: "text-gray-500 hover:text-gray-700"
						}`}
					>
						{label}
					</button>
				))}
			</div>
			<div
				className={`flex min-h-0 flex-1 flex-col ${activeTab === "budget" ? "" : "overflow-y-auto p-3"}`}
			>
				{activeTab === "holes" && <HoleLibrary />}
				{activeTab === "detail" && <HoleDetail />}
				{activeTab === "budget" && <BudgetPanel />}
			</div>
		</div>
	);
}
