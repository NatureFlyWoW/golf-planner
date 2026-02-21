import { useEffect, useState } from "react";
import { useStore } from "../../store";
import type { SegmentSpecId } from "../../types/template";
import { isMobile } from "../../utils/isMobile";
import { ChainList } from "./ChainList";
import { SegmentPalette } from "./SegmentPalette";

type Props = {
	selectedSegmentId: string | null;
	onSelectSegment: (id: string | null) => void;
};

export function BuilderUI({ selectedSegmentId, onSelectSegment }: Props) {
	const draft = useStore((s) => s.builderDraft);
	const appendSegment = useStore((s) => s.appendSegment);
	const removeLastSegment = useStore((s) => s.removeLastSegment);
	const replaceSegment = useStore((s) => s.replaceSegment);
	const builderUndo = useStore((s) => s.builderUndo);
	const builderRedo = useStore((s) => s.builderRedo);
	const saveTemplate = useStore((s) => s.saveTemplate);
	const exitBuilder = useStore((s) => s.exitBuilder);
	const setDraftName = useStore((s) => s.setDraftName);
	const setDraftPar = useStore((s) => s.setDraftPar);
	const setDraftFeltWidth = useStore((s) => s.setDraftFeltWidth);

	const [activeTab, setActiveTab] = useState<"build" | "chain">("build");

	const segments = draft?.segments ?? [];
	const lastSegmentId =
		segments.length > 0 ? segments[segments.length - 1].id : null;

	// Delete is enabled only when the selected segment is the last one.
	// (removeLastSegment is the only store action for single-segment removal.)
	const canDelete =
		selectedSegmentId !== null && selectedSegmentId === lastSegmentId;

	const handleDeleteSelected = () => {
		if (!canDelete) return;
		removeLastSegment();
		onSelectSegment(null);
	};

	const handleSegmentSelect = (specId: SegmentSpecId) => {
		if (selectedSegmentId) {
			replaceSegment(selectedSegmentId, specId);
			onSelectSegment(null);
		} else {
			appendSegment(specId);
		}
	};

	const handleCancel = () => {
		if (draft && draft.segments.length > 0) {
			if (!window.confirm("Discard unsaved changes?")) return;
		}
		exitBuilder();
	};

	const canSave = draft !== null && draft.segments.length >= 2;

	// Keyboard shortcuts
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Ignore when focus is in an input/select element
			const tag = (e.target as HTMLElement).tagName;
			if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;

			if (e.key === "Escape") {
				onSelectSegment(null);
			} else if (e.key === "Delete" || e.key === "Backspace") {
				handleDeleteSelected();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [canDelete, selectedSegmentId]);

	// Top bar
	const topBar = (
		<div className="flex items-center gap-2 border-b border-subtle bg-surface-raised px-3 py-2">
			<input
				type="text"
				value={draft?.name ?? ""}
				onChange={(e) => setDraftName(e.target.value)}
				className="w-24 min-w-0 flex-shrink rounded border border-subtle bg-surface px-2 py-1 text-sm text-primary"
				placeholder="Hole name"
			/>

			<div className="flex items-center gap-1 text-xs text-text-secondary">
				<span>W:</span>
				<input
					type="range"
					min={0.4}
					max={1.0}
					step={0.1}
					value={draft?.feltWidth ?? 0.6}
					onChange={(e) => setDraftFeltWidth(Number(e.target.value))}
					className="w-16"
				/>
				<span>{(draft?.feltWidth ?? 0.6).toFixed(1)}m</span>
			</div>

			<div className="flex items-center gap-1 text-xs text-text-secondary">
				<span>Par:</span>
				<select
					value={draft?.defaultPar ?? 3}
					onChange={(e) => setDraftPar(Number(e.target.value))}
					className="rounded border border-subtle bg-surface px-1 py-0.5 text-xs text-primary"
				>
					{[1, 2, 3, 4, 5, 6].map((p) => (
						<option key={p} value={p}>
							{p}
						</option>
					))}
				</select>
			</div>

			<div className="ml-auto flex items-center gap-1">
				<button
					type="button"
					onClick={builderUndo}
					className="rounded p-1 text-text-secondary hover:bg-plasma"
					title="Undo"
				>
					&#x21A9;
				</button>
				<button
					type="button"
					onClick={builderRedo}
					className="rounded p-1 text-text-secondary hover:bg-plasma"
					title="Redo"
				>
					&#x21AA;
				</button>
				<button
					type="button"
					onClick={removeLastSegment}
					className="rounded p-1 text-text-secondary hover:bg-plasma"
					title="Remove last segment"
				>
					&#x232B;
				</button>
				<button
					type="button"
					onClick={handleDeleteSelected}
					disabled={!canDelete}
					className={`rounded p-1 transition-colors ${
						canDelete
							? "text-neon-pink hover:bg-neon-pink/10"
							: "cursor-not-allowed text-text-muted"
					}`}
					title="Delete selected segment (Delete key)"
				>
					&#x1F5D1;
				</button>
				<button
					type="button"
					onClick={handleCancel}
					className="rounded bg-plasma px-2 py-1 text-xs text-text-secondary hover:bg-grid-ghost"
				>
					Cancel
				</button>
				<button
					type="button"
					onClick={saveTemplate}
					disabled={!canSave}
					className={`rounded px-2 py-1 text-xs font-medium ${
						canSave
							? "bg-neon-green/80 text-surface hover:bg-neon-green/90"
							: "cursor-not-allowed bg-plasma text-text-muted"
					}`}
				>
					Save
				</button>
			</div>
		</div>
	);

	// Panel content
	const panelContent = (
		<>
			{isMobile && (
				<div className="flex border-b border-subtle">
					<button
						type="button"
						className={`flex-1 py-2 text-xs font-medium ${
							activeTab === "build"
								? "border-b-2 border-neon-green text-neon-green"
								: "text-text-secondary"
						}`}
						onClick={() => setActiveTab("build")}
					>
						Build
					</button>
					<button
						type="button"
						className={`flex-1 py-2 text-xs font-medium ${
							activeTab === "chain"
								? "border-b-2 border-neon-green text-neon-green"
								: "text-text-secondary"
						}`}
						onClick={() => setActiveTab("chain")}
					>
						Chain
					</button>
				</div>
			)}

			<div className="overflow-y-auto p-2">
				{(!isMobile || activeTab === "build") && (
					<SegmentPalette
						onSelect={handleSegmentSelect}
						replaceMode={selectedSegmentId !== null}
					/>
				)}
				{(!isMobile || activeTab === "chain") && (
					<ChainList
						selectedSegmentId={selectedSegmentId}
						onSelectSegment={onSelectSegment}
					/>
				)}
			</div>
		</>
	);

	if (isMobile) {
		return (
			<>
				{topBar}
				{/* Bottom panel */}
				<div className="absolute inset-x-0 bottom-0 z-10 flex max-h-[40vh] flex-col border-t border-subtle bg-surface-raised">
					{panelContent}
				</div>
			</>
		);
	}

	// Desktop: sidebar + top bar
	return (
		<>
			{topBar}
			<div className="absolute inset-y-0 left-0 top-[41px] z-10 flex w-64 flex-col border-r border-subtle bg-surface-raised">
				{panelContent}
			</div>
		</>
	);
}
