import { useStore } from "../../store";
import type { Tool } from "../../types";
import { ExportButton } from "./ExportButton";
import { SaveManager } from "./SaveManager";

const tools: { tool: Tool; label: string; icon: string }[] = [
	{ tool: "select", label: "Select", icon: "\u2196" },
	{ tool: "place", label: "Place", icon: "+" },
	{ tool: "delete", label: "Delete", icon: "\u2715" },
];

export function Toolbar() {
	const activeTool = useStore((s) => s.ui.tool);
	const setTool = useStore((s) => s.setTool);
	const snapEnabled = useStore((s) => s.ui.snapEnabled);
	const toggleSnap = useStore((s) => s.toggleSnap);
	const showFlowPath = useStore((s) => s.ui.showFlowPath);
	const toggleFlowPath = useStore((s) => s.toggleFlowPath);
	const view = useStore((s) => s.ui.view);
	const setView = useStore((s) => s.setView);

	return (
		<div className="hidden items-center gap-1 border-b border-gray-200 bg-white px-3 py-2 md:flex">
			{tools.map(({ tool, label, icon }) => (
				<button
					type="button"
					key={tool}
					onClick={() => setTool(tool)}
					className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
						activeTool === tool
							? "bg-blue-600 text-white"
							: "bg-gray-100 text-gray-700 hover:bg-gray-200"
					}`}
				>
					<span className="mr-1">{icon}</span>
					{label}
				</button>
			))}

			<div className="mx-2 h-6 w-px bg-gray-200" />

			<button
				type="button"
				onClick={toggleSnap}
				className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
					snapEnabled
						? "bg-green-600 text-white"
						: "bg-gray-100 text-gray-700 hover:bg-gray-200"
				}`}
				title="Toggle grid snap (G)"
			>
				Snap
			</button>

			<button
				type="button"
				onClick={toggleFlowPath}
				className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
					showFlowPath
						? "bg-purple-600 text-white"
						: "bg-gray-100 text-gray-700 hover:bg-gray-200"
				}`}
				title="Toggle player flow path"
			>
				Flow
			</button>

			<button
				type="button"
				onClick={() => setView(view === "top" ? "3d" : "top")}
				className="rounded bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
				title="Toggle 2D/3D view"
			>
				{view === "top" ? "3D" : "2D"}
			</button>

			<div className="mx-2 h-6 w-px bg-gray-200" />

			<button
				type="button"
				onClick={() => useStore.temporal?.getState()?.undo()}
				className="rounded bg-gray-100 px-2 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
				title="Undo (Ctrl+Z)"
			>
				&#x21A9;
			</button>

			<button
				type="button"
				onClick={() => useStore.temporal?.getState()?.redo()}
				className="rounded bg-gray-100 px-2 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
				title="Redo (Ctrl+Shift+Z)"
			>
				&#x21AA;
			</button>

			<div className="ml-auto flex items-center gap-1">
				<SaveManager />
				<ExportButton />
			</div>
		</div>
	);
}
