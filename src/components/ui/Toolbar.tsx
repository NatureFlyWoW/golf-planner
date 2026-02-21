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
	const toggleUvMode = useStore((s) => s.toggleUvMode);
	const uvMode = useStore((s) => s.ui.uvMode);
	const transitioning = useStore((s) => s.ui.transitioning);
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

	const barClass = "hidden items-center gap-1 border-b border-subtle bg-surface-raised px-3 py-2 md:flex";

	const btnClass = (active: boolean) =>
		`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
			active
				? "bg-accent-text text-white"
				: "bg-plasma text-text-secondary hover:bg-grid-ghost"
		}`;

	const neutralBtnClass = "rounded bg-plasma px-3 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-grid-ghost";

	const smallBtnClass = "rounded bg-plasma px-2 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-grid-ghost";

	const dividerClass = "mx-2 h-6 w-px bg-grid-ghost";

	const snapBtnClass = `rounded px-3 py-1.5 text-sm font-medium transition-colors ${
		snapEnabled
			? "bg-accent-text text-white"
			: "bg-plasma text-text-secondary hover:bg-grid-ghost"
	}`;

	const flowBtnClass = `rounded px-3 py-1.5 text-sm font-medium transition-colors ${
		showFlowPath
			? "bg-accent-text text-white"
			: "bg-plasma text-text-secondary hover:bg-grid-ghost"
	}`;

	return (
		<div className={barClass}>
			<span className="font-display text-sm font-bold tracking-wider text-accent-text" style={{ textShadow: "0 0 8px #9D00FF, 0 0 16px #9D00FF40" }}>GOLF FORGE</span>
			<div className="mx-2 h-6 w-px bg-grid-ghost" />

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
				disabled={transitioning}
				className={`${btnClass(uvMode)}${uvMode && !transitioning ? " uv-button-pulse" : ""}`}
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
