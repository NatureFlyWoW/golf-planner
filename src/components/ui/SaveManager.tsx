import { useCallback, useEffect, useState } from "react";
import { useStore } from "../../store";
import {
	deleteSave,
	getSaves,
	renameSave,
	type SaveSlot,
	saveLayout,
} from "../../utils/saveManager";

export function SaveManager() {
	const holes = useStore((s) => s.holes);
	const holeOrder = useStore((s) => s.holeOrder);
	const [open, setOpen] = useState(false);
	const [saves, setSaves] = useState<Record<string, SaveSlot>>({});
	const [saveName, setSaveName] = useState("");
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editName, setEditName] = useState("");
	const [error, setError] = useState<string | null>(null);

	const refreshSaves = useCallback(() => {
		setSaves(getSaves());
	}, []);

	useEffect(() => {
		if (open) refreshSaves();
	}, [open, refreshSaves]);

	function handleSave() {
		const name = saveName.trim();
		if (!name) return;
		try {
			saveLayout(name, holes, holeOrder);
			setSaveName("");
			setError(null);
			refreshSaves();
		} catch (e) {
			setError(e instanceof Error ? e.message : "Save failed");
		}
	}

	function handleLoad(id: string) {
		const slot = saves[id];
		if (!slot) return;
		const state = useStore.getState();
		// Replace holes and holeOrder in the store
		useStore.setState({
			holes: slot.holes,
			holeOrder: slot.holeOrder,
			selectedId: null,
		});
		// Clear selection UI
		state.setTool("select");
		setOpen(false);
	}

	function handleDelete(id: string) {
		deleteSave(id);
		refreshSaves();
	}

	function handleRename(id: string) {
		const name = editName.trim();
		if (!name) return;
		renameSave(id, name);
		setEditingId(null);
		setEditName("");
		refreshSaves();
	}

	const saveCount = Object.keys(saves).length;
	const sortedSaves = Object.entries(saves).sort(
		([, a], [, b]) =>
			new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime(),
	);

	if (!open) {
		return (
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="rounded bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
			>
				Saves
			</button>
		);
	}

	return (
		<div className="absolute right-2 top-12 z-50 w-72 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
			<div className="mb-2 flex items-center justify-between">
				<span className="text-sm font-semibold">Saves ({saveCount}/10)</span>
				<button
					type="button"
					onClick={() => setOpen(false)}
					className="text-gray-400 hover:text-gray-600"
				>
					&#x2715;
				</button>
			</div>

			{/* Save current layout */}
			<div className="mb-3 flex gap-1">
				<input
					type="text"
					value={saveName}
					onChange={(e) => setSaveName(e.target.value)}
					onKeyDown={(e) => e.key === "Enter" && handleSave()}
					placeholder="Save name..."
					className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
					maxLength={40}
				/>
				<button
					type="button"
					onClick={handleSave}
					disabled={!saveName.trim() || saveCount >= 10}
					className="rounded bg-blue-600 px-2 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
				>
					Save
				</button>
			</div>

			{error && <p className="mb-2 text-xs text-red-600">{error}</p>}

			{/* Save list */}
			{sortedSaves.length === 0 ? (
				<p className="text-center text-xs text-gray-400">
					No saved layouts yet
				</p>
			) : (
				<ul className="max-h-48 space-y-1 overflow-y-auto">
					{sortedSaves.map(([id, slot]) => (
						<li
							key={id}
							className="flex items-center gap-1 rounded bg-gray-50 px-2 py-1.5"
						>
							{editingId === id ? (
								<input
									type="text"
									value={editName}
									onChange={(e) => setEditName(e.target.value)}
									onKeyDown={(e) => e.key === "Enter" && handleRename(id)}
									onBlur={() => handleRename(id)}
									className="flex-1 rounded border border-gray-300 px-1 text-xs"
									maxLength={40}
								/>
							) : (
								<button
									type="button"
									onClick={() => handleLoad(id)}
									className="flex-1 text-left"
									title="Click to load"
								>
									<span className="block truncate text-xs font-medium">
										{slot.name}
									</span>
									<span className="text-[10px] text-gray-400">
										{new Date(slot.savedAt).toLocaleString()}
									</span>
								</button>
							)}
							<button
								type="button"
								onClick={() => {
									setEditingId(id);
									setEditName(slot.name);
								}}
								className="text-xs text-gray-400 hover:text-blue-600"
								title="Rename"
							>
								&#x270E;
							</button>
							<button
								type="button"
								onClick={() => handleDelete(id)}
								className="text-xs text-gray-400 hover:text-red-600"
								title="Delete"
							>
								&#x2715;
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
