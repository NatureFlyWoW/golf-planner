import { HOLE_TYPE_MAP } from "../../constants";
import { useStore } from "../../store";
import { computeTemplateBounds } from "../../utils/chainCompute";

export function MobileDetailPanel() {
	const activePanel = useStore((s) => s.ui.activePanel);
	const setActivePanel = useStore((s) => s.setActivePanel);
	const selectedId = useStore((s) => s.selectedId);
	const holes = useStore((s) => s.holes);
	const holeOrder = useStore((s) => s.holeOrder);
	const holeTemplates = useStore((s) => s.holeTemplates);
	const updateHole = useStore((s) => s.updateHole);
	const removeHole = useStore((s) => s.removeHole);
	const enterBuilder = useStore((s) => s.enterBuilder);

	if (activePanel !== "detail" || !selectedId) return null;

	const hole = holes[selectedId];
	if (!hole) return null;

	const template = hole.templateId ? holeTemplates[hole.templateId] : null;
	const definition = template ? null : HOLE_TYPE_MAP[hole.type];
	const orderIndex = holeOrder.indexOf(selectedId);

	const swatchColor = template ? template.color : (definition?.color ?? "#999");
	const headerLabel = template ? template.name : (definition?.label ?? hole.type);

	let dimensionLabel: string;
	if (template) {
		const bounds = computeTemplateBounds(template);
		dimensionLabel = `${bounds.width.toFixed(1)} × ${bounds.length.toFixed(1)} m`;
	} else if (definition) {
		dimensionLabel = `${definition.dimensions.width} × ${definition.dimensions.length} m`;
	} else {
		dimensionLabel = "";
	}

	function handleClose() {
		setActivePanel(null);
	}

	function handleDelete() {
		if (selectedId && window.confirm(`Delete ${hole.name}?`)) {
			removeHole(selectedId);
			setActivePanel(null);
		}
	}

	function handleEditInBuilder() {
		if (template) {
			enterBuilder(template.id);
			setActivePanel(null);
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex flex-col bg-white md:hidden">
			{/* Header */}
			<div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
				<div className="flex items-center gap-2">
					<div
						className="h-6 w-6 rounded"
						style={{ backgroundColor: swatchColor }}
					/>
					<span className="text-base font-semibold">
						#{orderIndex + 1} &middot; {headerLabel}
					</span>
				</div>
				<button
					type="button"
					onClick={handleClose}
					className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
				>
					<span className="text-xl">&#x2715;</span>
				</button>
			</div>

			{/* Content */}
			<div className="flex-1 overflow-y-auto p-4">
				<div className="flex flex-col gap-5">
					{/* Name */}
					<label className="flex flex-col gap-1.5">
						<span className="text-sm font-medium text-gray-500">Name</span>
						<input
							type="text"
							value={hole.name}
							onChange={(e) => updateHole(selectedId, { name: e.target.value })}
							className="rounded-lg border border-gray-200 px-3 py-2.5 text-base"
						/>
					</label>

					{/* Par */}
					<label className="flex flex-col gap-1.5">
						<span className="text-sm font-medium text-gray-500">Par</span>
						<input
							type="number"
							value={hole.par}
							min={1}
							max={6}
							onChange={(e) =>
								updateHole(selectedId, {
									par: Math.min(6, Math.max(1, Number(e.target.value))),
								})
							}
							className="w-24 rounded-lg border border-gray-200 px-3 py-2.5 text-base"
						/>
					</label>

					{/* Rotation — large preset buttons as primary */}
					<div className="flex flex-col gap-1.5">
						<span className="text-sm font-medium text-gray-500">Rotation</span>
						<div className="flex gap-2">
							{[0, 90, 180, 270].map((r) => (
								<button
									key={r}
									type="button"
									onClick={() => updateHole(selectedId, { rotation: r })}
									className={`h-11 flex-1 rounded-lg text-sm font-medium ${
										hole.rotation === r
											? "bg-blue-600 text-white"
											: "bg-gray-100 text-gray-600 active:bg-gray-200"
									}`}
								>
									{r}&deg;
								</button>
							))}
						</div>
						<input
							type="number"
							value={hole.rotation}
							min={0}
							max={359}
							step={15}
							onChange={(e) =>
								updateHole(selectedId, {
									rotation: ((Number(e.target.value) % 360) + 360) % 360,
								})
							}
							className="mt-1 w-24 rounded-lg border border-gray-200 px-3 py-2 text-sm"
						/>
					</div>

					{/* Position (read-only) */}
					<div className="text-sm text-gray-400">
						Position: ({hole.position.x.toFixed(1)},{" "}
						{hole.position.z.toFixed(1)})
					</div>

					{/* Dimensions (read-only) */}
					{dimensionLabel ? (
						<div className="text-sm text-gray-400">Size: {dimensionLabel}</div>
					) : null}

					{/* Template info */}
					{template ? (
						<div className="flex flex-col gap-2 rounded-lg border border-gray-100 bg-gray-50 p-3">
							<div className="text-sm text-gray-500">
								Template:{" "}
								<span className="font-medium text-gray-700">{template.name}</span>
							</div>
							<div className="text-sm text-gray-500">
								Segments:{" "}
								<span className="font-medium text-gray-700">
									{template.segments.length}
								</span>
							</div>
							<button
								type="button"
								onClick={handleEditInBuilder}
								className="rounded-lg bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-600 active:bg-blue-100"
							>
								Edit in Builder
							</button>
						</div>
					) : null}

					{/* Delete */}
					<button
						type="button"
						onClick={handleDelete}
						className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-base font-medium text-red-600 active:bg-red-100"
					>
						Delete Hole
					</button>
				</div>
			</div>
		</div>
	);
}
