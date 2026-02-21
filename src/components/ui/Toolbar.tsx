import { useStore } from "../../store";
import type { Tool } from "../../types";
import {
	downloadSVG,
	generateFloorPlanSVG,
} from "../../utils/floorPlanExport";
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
	const uvMode = useStore((s) => s.ui.uvMode);
	const toggleUvMode = useStore((s) => s.toggleUvMode);
	const captureScreenshot = useStore((s) => s.captureScreenshot);
	const holes = useStore((s) => s.holes);
	const holeOrder = useStore((s) => s.holeOrder);
	const hall = useStore((s) => s.hall);
	const holeTemplates = useStore((s) => s.holeTemplates);

	function handleFloorPlanExport() {
		const svg = generateFloorPlanSVG(
			{ width: hall.width, length: hall.length },
			holes,
			holeOrder,
			holeTemplates,
		);
		downloadSVG(svg);
	}

	const barClass = uvMode
		? "hidden items-center gap-1 border-b border-indigo-900 bg-gray-900 px-3 py-2 md:flex"
		: "hidden items-center gap-1 border-b border-gray-200 bg-white px-3 py-2 md:flex";

	const btnClass = (active: boolean) =>
		uvMode
			? `rounded px-3 py-1.5 text-sm font-medium transition-colors ${
					active
						? "bg-purple-600 text-white"
						: "bg-gray-800 text-gray-300 hover:bg-gray-700"
				}`
			: `rounded px-3 py-1.5 text-sm font-medium transition-colors ${
					active
						? "bg-blue-600 text-white"
						: "bg-gray-100 text-gray-700 hover:bg-gray-200"
				}`;

	const neutralBtnClass = uvMode
		? "rounded bg-gray-800 px-3 py-1.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700"
		: "rounded bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200";

	const smallBtnClass = uvMode
		? "rounded bg-gray-800 px-2 py-1.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700"
		: "rounded bg-gray-100 px-2 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200";

	const dividerClass = uvMode
		? "mx-2 h-6 w-px bg-gray-700"
		: "mx-2 h-6 w-px bg-gray-200";

	const snapBtnClass = uvMode
		? `rounded px-3 py-1.5 text-sm font-medium transition-colors ${
				snapEnabled
					? "bg-purple-600 text-white"
					: "bg-gray-800 text-gray-300 hover:bg-gray-700"
			}`
		: `rounded px-3 py-1.5 text-sm font-medium transition-colors ${
				snapEnabled
					? "bg-green-600 text-white"
					: "bg-gray-100 text-gray-700 hover:bg-gray-200"
			}`;

	const flowBtnClass = uvMode
		? `rounded px-3 py-1.5 text-sm font-medium transition-colors ${
				showFlowPath
					? "bg-purple-600 text-white"
					: "bg-gray-800 text-gray-300 hover:bg-gray-700"
			}`
		: `rounded px-3 py-1.5 text-sm font-medium transition-colors ${
				showFlowPath
					? "bg-purple-600 text-white"
					: "bg-gray-100 text-gray-700 hover:bg-gray-200"
			}`;

	return (
		<div className={barClass}>
			{tools.map(({ tool, label, icon }) => (
				<button
					type="button"
					key={tool}
					onClick={() => setTool(tool)}
					className={btnClass(activeTool === tool)}
				>
					<span className="mr-1">{icon}</span>
					{label}
				</button>
			))}

			<div className={dividerClass} />

			<button
				type="button"
				onClick={toggleSnap}
				className={snapBtnClass}
				title="Toggle grid snap (G)"
			>
				Snap
			</button>

			<button
				type="button"
				onClick={toggleFlowPath}
				className={flowBtnClass}
				title="Toggle player flow path"
			>
				Flow
			</button>

			<button
				type="button"
				onClick={() => setView(view === "top" ? "3d" : "top")}
				className={neutralBtnClass}
				title="Toggle 2D/3D view"
			>
				{view === "top" ? "3D" : "2D"}
			</button>

			<button
				type="button"
				onClick={toggleUvMode}
				className={btnClass(uvMode)}
				title="Toggle UV preview mode"
			>
				UV
			</button>

			<div className={dividerClass} />

			<button
				type="button"
				onClick={() => useStore.temporal?.getState()?.undo()}
				className={smallBtnClass}
				title="Undo (Ctrl+Z)"
			>
				&#x21A9;
			</button>

			<button
				type="button"
				onClick={() => useStore.temporal?.getState()?.redo()}
				className={smallBtnClass}
				title="Redo (Ctrl+Shift+Z)"
			>
				&#x21AA;
			</button>

			<div className="ml-auto flex items-center gap-1">
				<button
					type="button"
					onClick={() => captureScreenshot?.()}
					className={neutralBtnClass}
					title="Capture screenshot"
					disabled={!captureScreenshot}
				>
					Snap
				</button>
				<button
					type="button"
					onClick={handleFloorPlanExport}
					className={neutralBtnClass}
					title="Export floor plan as SVG"
				>
					SVG
				</button>
				<SaveManager />
				<ExportButton />
			</div>
		</div>
	);
}
