import { useState } from "react";
import { useStore } from "../../store";
import type { Tool } from "../../types";
import { buildExportData, downloadJson } from "../../utils/exportLayout";
import { saveLayout } from "../../utils/saveManager";

const tools: { tool: Tool; label: string; icon: string }[] = [
	{ tool: "select", label: "Sel", icon: "\u2196" },
	{ tool: "place", label: "Place", icon: "+" },
	{ tool: "delete", label: "Del", icon: "\u2715" },
];

export function BottomToolbar() {
	const activeTool = useStore((s) => s.ui.tool);
	const setTool = useStore((s) => s.setTool);
	const placingType = useStore((s) => s.ui.placingType);
	const setPlacingType = useStore((s) => s.setPlacingType);
	const selectedId = useStore((s) => s.selectedId);
	const holes = useStore((s) => s.holes);
	const holeOrder = useStore((s) => s.holeOrder);
	const activePanel = useStore((s) => s.ui.activePanel);
	const setActivePanel = useStore((s) => s.setActivePanel);
	const [showOverflow, setShowOverflow] = useState(false);

	const selectedHole = selectedId ? holes[selectedId] : null;
	const selectedIndex = selectedId ? holeOrder.indexOf(selectedId) : -1;

	const selectHole = useStore((s) => s.selectHole);

	const snapEnabled = useStore((s) => s.ui.snapEnabled);
	const showFlowPath = useStore((s) => s.ui.showFlowPath);
	const hasActiveToggles = snapEnabled || showFlowPath;

	function handleToolTap(tool: Tool) {
		if (tool === "place") {
			// Toggle the hole drawer
			if (activePanel === "holes") {
				setActivePanel(null);
			} else {
				setActivePanel("holes");
			}
		} else {
			setTool(tool);
			setActivePanel(null);
			// Deselect hole when switching to Select/Delete tool
			if (tool === "select") {
				selectHole(null);
			}
		}
	}

	function handleInfoChipTap() {
		if (activePanel === "detail") {
			setActivePanel(null);
		} else {
			setActivePanel("detail");
		}
	}

	return (
		<div
			className="flex flex-col border-t border-gray-200 bg-white md:hidden"
			style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
		>
			{/* Info chip row — only when hole selected */}
			{selectedHole && (
				<button
					type="button"
					onClick={handleInfoChipTap}
					className="flex items-center gap-2 border-b border-gray-100 px-3 py-1.5"
				>
					<span className="text-xs font-medium text-gray-700">
						Hole {selectedIndex + 1} &middot; {selectedHole.type}
					</span>
					<span className="text-[10px] text-gray-400">tap for details</span>
				</button>
			)}

			{/* Placing type chip */}
			{placingType && (
				<div className="flex items-center gap-2 border-b border-gray-100 px-3 py-1">
					<span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
						{placingType}
					</span>
					<button
						type="button"
						onClick={() => {
							setPlacingType(null);
							setTool("select");
						}}
						className="text-xs text-gray-400 hover:text-gray-600"
					>
						&#x2715;
					</button>
				</div>
			)}

			{/* Primary toolbar rail */}
			<div className="flex h-14 items-center justify-around px-2">
				{tools.map(({ tool, label, icon }) => (
					<button
						type="button"
						key={tool}
						onClick={() => handleToolTap(tool)}
						className={`flex min-w-[48px] flex-col items-center justify-center rounded-lg px-2 py-1 ${
							activeTool === tool ||
							(tool === "place" && activePanel === "holes")
								? "bg-blue-600 text-white"
								: "text-gray-600"
						}`}
					>
						<span className="text-lg">{icon}</span>
						<span className="text-[10px]">{label}</span>
					</button>
				))}

				<div className="h-8 w-px bg-gray-200" />

				{/* Undo */}
				<button
					type="button"
					onClick={() => useStore.temporal?.getState()?.undo()}
					className="flex min-w-[48px] flex-col items-center justify-center rounded-lg px-2 py-1 text-gray-600"
				>
					<span className="text-lg">&#x21A9;</span>
					<span className="text-[10px]">Undo</span>
				</button>

				{/* Redo */}
				<button
					type="button"
					onClick={() => useStore.temporal?.getState()?.redo()}
					className="flex min-w-[48px] flex-col items-center justify-center rounded-lg px-2 py-1 text-gray-600"
				>
					<span className="text-lg">&#x21AA;</span>
					<span className="text-[10px]">Redo</span>
				</button>

				<div className="h-8 w-px bg-gray-200" />

				{/* More (overflow) */}
				<button
					type="button"
					onClick={() => setShowOverflow((v) => !v)}
					className={`relative flex min-w-[48px] flex-col items-center justify-center rounded-lg px-2 py-1 ${
						showOverflow ? "bg-gray-200 text-gray-800" : "text-gray-600"
					}`}
				>
					<span className="text-lg">&middot;&middot;&middot;</span>
					<span className="text-[10px]">More</span>
					{hasActiveToggles && (
						<span className="absolute right-1 top-0 h-2 w-2 rounded-full bg-blue-500" />
					)}
				</button>
			</div>

			{/* Overflow popover rendered in Task 6 */}
			{showOverflow && (
				<OverflowPopover onClose={() => setShowOverflow(false)} />
			)}
		</div>
	);
}

function OverflowPopover({ onClose }: { onClose: () => void }) {
	const snapEnabled = useStore((s) => s.ui.snapEnabled);
	const toggleSnap = useStore((s) => s.toggleSnap);
	const showFlowPath = useStore((s) => s.ui.showFlowPath);
	const toggleFlowPath = useStore((s) => s.toggleFlowPath);
	const view = useStore((s) => s.ui.view);
	const setView = useStore((s) => s.setView);
	const holes = useStore((s) => s.holes);
	const holeOrder = useStore((s) => s.holeOrder);
	const budget = useStore((s) => s.budget);
	const hall = useStore((s) => s.hall);

	return (
		<>
			{/* Backdrop */}
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: mobile backdrop */}
			{/* biome-ignore lint/a11y/noStaticElementInteractions: mobile backdrop */}
			<div className="fixed inset-0 z-40" onClick={onClose} />
			{/* Popover */}
			<div className="absolute bottom-16 right-2 z-50 grid grid-cols-2 gap-2 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
				<ToggleBtn label="Snap" active={snapEnabled} onTap={toggleSnap} />
				<ToggleBtn label="Flow" active={showFlowPath} onTap={toggleFlowPath} />
				<ToggleBtn
					label={view === "top" ? "3D" : "2D"}
					active={false}
					onTap={() => setView(view === "top" ? "3d" : "top")}
				/>
				<ToggleBtn
					label="Sun"
					active={false}
					onTap={() => {
						/* TODO: open sun controls overlay in future iteration */
					}}
				/>
				<button
					type="button"
					onClick={() => {
						const name = window.prompt("Save name:");
						if (name?.trim()) {
							saveLayout(name.trim(), holes, holeOrder);
						}
						onClose();
					}}
					className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700"
				>
					Save
				</button>
				<button
					type="button"
					onClick={() => {
						const data = buildExportData(holes, holeOrder, budget, hall);
						downloadJson(data);
						onClose();
					}}
					className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700"
				>
					Export
				</button>
			</div>
		</>
	);
}

function ToggleBtn({
	label,
	active,
	onTap,
}: {
	label: string;
	active: boolean;
	onTap: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onTap}
			className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
				active ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
			}`}
		>
			{label}
		</button>
	);
}
