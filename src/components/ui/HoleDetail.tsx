import { HOLE_TYPE_MAP } from "../../constants";
import { useStore } from "../../store";

export function HoleDetail() {
	const selectedId = useStore((s) => s.selectedId);
	const holes = useStore((s) => s.holes);
	const holeOrder = useStore((s) => s.holeOrder);
	const updateHole = useStore((s) => s.updateHole);
	const removeHole = useStore((s) => s.removeHole);

	if (!selectedId) {
		return (
			<p className="text-xs text-gray-400">Select a hole to see details</p>
		);
	}

	const hole = holes[selectedId];
	if (!hole) return null;

	const definition = HOLE_TYPE_MAP[hole.type];
	const orderIndex = holeOrder.indexOf(selectedId);

	return (
		<div className="flex flex-col gap-3">
			<div className="flex items-center gap-2">
				<div
					className="h-6 w-6 rounded"
					style={{ backgroundColor: definition?.color ?? "#999" }}
				/>
				<span className="text-sm font-medium">
					#{orderIndex + 1} · {definition?.label}
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
						updateHole(selectedId, { par: Number(e.target.value) })
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
