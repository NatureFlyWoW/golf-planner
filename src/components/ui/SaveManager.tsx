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
				className="rounded bg-plasma px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-grid-ghost"
			>
				Saves
			</button>
		);
	}

	return (
		<div className="absolute right-2 top-12 z-50 w-72 rounded-lg border border-subtle bg-surface-raised p-3 shadow-lg">
			<div className="mb-2 flex items-center justify-between">
				<span className="text-sm font-semibold">Saves ({saveCount}/10)</span>
				<button
					type="button"
					onClick={() => setOpen(false)}
					className="text-text-muted hover:text-text-secondary"
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
					className="flex-1 rounded border border-subtle bg-surface px-2 py-1 text-sm text-primary"
					maxLength={40}
				/>
				<button
					type="button"
					onClick={handleSave}
					disabled={!saveName.trim() || saveCount >= 10}
					className="rounded bg-accent-text px-2 py-1 text-sm text-white hover:bg-accent-text/80 disabled:opacity-50"
				>
					Save
				</button>
			</div>

			{error && <p className="mb-2 text-xs text-neon-pink">{error}</p>}

			{/* Save list */}
			{sortedSaves.length === 0 ? (
				<p className="text-center text-xs text-text-muted">
					No saved layouts yet
				</p>
			) : (
				<ul className="max-h-48 space-y-1 overflow-y-auto">
					{sortedSaves.map(([id, slot]) => (
						<li
							key={id}
							className="flex items-center gap-1 rounded bg-surface-raised px-2 py-1.5"
						>
							{editingId === id ? (
								<input
									type="text"
									value={editName}
									onChange={(e) => setEditName(e.target.value)}
									onKeyDown={(e) => e.key === "Enter" && handleRename(id)}
									onBlur={() => handleRename(id)}
									className="flex-1 rounded border border-subtle bg-surface px-1 text-xs text-primary"
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
									<span className="text-[10px] text-text-muted">
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
								className="text-xs text-text-muted hover:text-accent-text"
								title="Rename"
							>
								&#x270E;
							</button>
							<button
								type="button"
								onClick={() => handleDelete(id)}
								className="text-xs text-text-muted hover:text-neon-pink"
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
