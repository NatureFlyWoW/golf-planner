import { useStore } from "../../store";
import { LayerPanel } from "./LayerPanel";

export function MobileLayerPanel() {
	const activePanel = useStore((s) => s.ui.activePanel);
	const setActivePanel = useStore((s) => s.setActivePanel);

	if (activePanel !== "layers") return null;

	function handleClose() {
		setActivePanel(null);
	}

	return (
		<div className="fixed inset-0 z-50 flex flex-col bg-surface md:hidden">
			{/* Header */}
			<div className="flex items-center justify-between border-b border-subtle px-4 py-3">
				<span className="text-base font-semibold">Layers</span>
				<button
					type="button"
					onClick={handleClose}
					aria-label="Close layers panel"
					className="rounded-lg p-2 text-text-muted hover:bg-plasma hover:text-text-secondary"
				>
					<span className="text-xl">&#x2715;</span>
				</button>
			</div>

			{/* Reuse LayerPanel content */}
			<div className="flex-1 overflow-y-auto p-4">
				<LayerPanel />
			</div>
		</div>
	);
}
