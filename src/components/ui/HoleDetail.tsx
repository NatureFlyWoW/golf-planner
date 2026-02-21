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
			<p className="text-xs text-text-muted">Select a hole to see details</p>
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
				<span className="text-xs text-text-secondary">Name</span>
				<input
					type="text"
					value={hole.name}
					onChange={(e) => updateHole(selectedId, { name: e.target.value })}
					className="rounded border border-subtle bg-surface px-2 py-1 text-sm text-primary"
				/>
			</label>

			<label className="flex flex-col gap-1">
				<span className="text-xs text-text-secondary">Par</span>
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
					className="w-20 rounded border border-subtle px-2 py-1 text-sm"
				/>
			</label>

			<div className="flex flex-col gap-1">
				<span className="text-xs text-text-secondary">Rotation</span>
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
						className="w-20 rounded border border-subtle px-2 py-1 text-sm"
					/>
					<span className="text-xs text-text-muted">°</span>
				</div>
				<div className="flex gap-1">
					{[0, 90, 180, 270].map((r) => (
						<button
							key={r}
							type="button"
							onClick={() => updateHole(selectedId, { rotation: r })}
							className={`rounded px-2.5 py-1 text-xs font-medium ${
								hole.rotation === r
									? "bg-accent-text text-white"
									: "bg-surface text-text-secondary hover:bg-plasma"
							}`}
						>
							{r}°
						</button>
					))}
				</div>
			</div>

			<div className="text-xs text-text-muted">
				Position: ({hole.position.x.toFixed(1)}, {hole.position.z.toFixed(1)})
			</div>

			{dimensionLabel ? (
				<div className="text-xs text-text-muted">Size: {dimensionLabel}</div>
			) : null}

			{template ? (
				<div className="flex flex-col gap-1 rounded border border-subtle bg-surface-raised p-2">
					<div className="text-xs text-text-secondary">
						Template: <span className="font-medium text-primary">{template.name}</span>
					</div>
					<div className="text-xs text-text-secondary">
						Segments: <span className="font-medium text-primary">{template.segments.length}</span>
					</div>
					<button
						type="button"
						onClick={() => enterBuilder(template.id)}
						className="mt-1 rounded bg-plasma px-3 py-1.5 text-xs font-medium text-accent-text hover:bg-grid-ghost"
					>
						Edit in Builder
					</button>
				</div>
			) : null}

			<button
				type="button"
				onClick={() => removeHole(selectedId)}
				className="mt-2 rounded bg-neon-pink/10 px-3 py-1.5 text-xs font-medium text-neon-pink hover:bg-neon-pink/20"
			>
				Delete Hole
			</button>
		</div>
	);
}
