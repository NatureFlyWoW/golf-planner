import { useStore } from "../../store";
import type { SidebarTab } from "../../types";
import { BudgetPanel } from "./BudgetPanel";
import { HoleDetail } from "./HoleDetail";
import { HoleLibrary } from "./HoleLibrary";
import { LayerPanel } from "./LayerPanel";

const tabs: { tab: SidebarTab; label: string }[] = [
	{ tab: "holes", label: "Holes" },
	{ tab: "detail", label: "Detail" },
	{ tab: "budget", label: "Budget" },
	{ tab: "layers", label: "Layers" },
];

export function Sidebar() {
	const activeTab = useStore((s) => s.ui.sidebarTab);
	const setSidebarTab = useStore((s) => s.setSidebarTab);

	return (
		<div className="hidden h-full w-64 flex-col border-r border-subtle bg-surface-raised md:flex" data-testid="sidebar">
			<div className="flex border-b border-subtle">
				{tabs.map(({ tab, label }) => (
					<button
						type="button"
						key={tab}
						onClick={() => setSidebarTab(tab)}
						className={`flex-1 px-2 py-2 text-xs font-medium transition-colors ${
							activeTab === tab
								? "border-b-2 border-accent-text text-accent-text"
								: "text-text-secondary hover:text-primary"
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
				{activeTab === "layers" && <LayerPanel />}
			</div>
		</div>
	);
}
