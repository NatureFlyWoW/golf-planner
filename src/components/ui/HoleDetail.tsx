import { HOLE_TYPE_MAP } from "../../constants";
import { useStore } from "../../store";
import { computeTemplateBounds } from "../../utils/chainCompute";

export function HoleDetail() {
	const selectedId = useStore((s) => s.selectedId);
	const holes = useStore((s) => s.holes);
	const holeOrder = useStore((s) => s.holeOrder);
	const holeTemplates = useStore((s) => s.holeTemplates);
	const updateHole = useStore((s) => s.updateHole);
	const removeHole = useStore((s) => s.removeHole);
	const enterBuilder = useStore((s) => s.enterBuilder);

	if (!selectedId) {
		return (
			<p className="text-xs text-gray-400">Select a hole to see details</p>
		);
	}

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

	return (
		<div className="flex flex-col gap-3">
			<div className="flex items-center gap-2">
				<div
					className="h-6 w-6 rounded"
					style={{ backgroundColor: swatchColor }}
				/>
				<span className="text-sm font-medium">
					#{orderIndex + 1} · {headerLabel}
				</span>
			</div>

			<label className="flex flex-col gap-1">
				<span className="text-xs text-gray-500">Name</span>
				<input
					type="text"
					value={hole.name}
					onChange={(e) => updateHole(selectedId, { name: e.target.value })}
					className="rounded border border-gray-200 px-2 py-1 text-sm"
				/>
			</label>

			<label className="flex flex-col gap-1">
				<span className="text-xs text-gray-500">Par</span>
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
					className="w-20 rounded border border-gray-200 px-2 py-1 text-sm"
				/>
			</label>

			<div className="flex flex-col gap-1">
				<span className="text-xs text-gray-500">Rotation</span>
				<div className="flex items-center gap-2">
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
						className="w-20 rounded border border-gray-200 px-2 py-1 text-sm"
					/>
					<span className="text-xs text-gray-400">°</span>
				</div>
				<div className="flex gap-1">
					{[0, 90, 180, 270].map((r) => (
						<button
							key={r}
							type="button"
							onClick={() => updateHole(selectedId, { rotation: r })}
							className={`rounded px-2.5 py-1 text-xs font-medium ${
								hole.rotation === r
									? "bg-blue-600 text-white"
									: "bg-gray-100 text-gray-600 hover:bg-gray-200"
							}`}
						>
							{r}°
						</button>
					))}
				</div>
			</div>

			<div className="text-xs text-gray-400">
				Position: ({hole.position.x.toFixed(1)}, {hole.position.z.toFixed(1)})
			</div>

			{dimensionLabel ? (
				<div className="text-xs text-gray-400">Size: {dimensionLabel}</div>
			) : null}

			{template ? (
				<div className="flex flex-col gap-1 rounded border border-gray-100 bg-gray-50 p-2">
					<div className="text-xs text-gray-500">
						Template: <span className="font-medium text-gray-700">{template.name}</span>
					</div>
					<div className="text-xs text-gray-500">
						Segments: <span className="font-medium text-gray-700">{template.segments.length}</span>
					</div>
					<button
						type="button"
						onClick={() => enterBuilder(template.id)}
						className="mt-1 rounded bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100"
					>
						Edit in Builder
					</button>
				</div>
			) : null}

			<button
				type="button"
				onClick={() => removeHole(selectedId)}
				className="mt-2 rounded bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100"
			>
				Delete Hole
			</button>
		</div>
	);
}
