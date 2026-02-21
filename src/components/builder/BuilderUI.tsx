import { useState } from "react";
import { useStore } from "../../store";
import type { SegmentSpecId } from "../../types/template";
import { isMobile } from "../../utils/isMobile";
import { ChainList } from "./ChainList";
import { SegmentPalette } from "./SegmentPalette";

export function BuilderUI() {
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
	const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(
		null,
	);

	const handleSegmentSelect = (specId: SegmentSpecId) => {
		if (selectedSegmentId) {
			replaceSegment(selectedSegmentId, specId);
			setSelectedSegmentId(null);
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

	// Top bar
	const topBar = (
		<div className="flex items-center gap-2 border-b bg-white px-3 py-2">
			<input
				type="text"
				value={draft?.name ?? ""}
				onChange={(e) => setDraftName(e.target.value)}
				className="w-24 min-w-0 flex-shrink rounded border px-2 py-1 text-sm"
				placeholder="Hole name"
			/>

			<div className="flex items-center gap-1 text-xs text-gray-500">
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

			<div className="flex items-center gap-1 text-xs text-gray-500">
				<span>Par:</span>
				<select
					value={draft?.defaultPar ?? 3}
					onChange={(e) => setDraftPar(Number(e.target.value))}
					className="rounded border px-1 py-0.5 text-xs"
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
					className="rounded p-1 text-gray-500 hover:bg-gray-100"
					title="Undo"
				>
					&#x21A9;
				</button>
				<button
					type="button"
					onClick={builderRedo}
					className="rounded p-1 text-gray-500 hover:bg-gray-100"
					title="Redo"
				>
					&#x21AA;
				</button>
				<button
					type="button"
					onClick={removeLastSegment}
					className="rounded p-1 text-gray-500 hover:bg-gray-100"
					title="Remove last"
				>
					&#x232B;
				</button>
				<button
					type="button"
					onClick={handleCancel}
					className="rounded bg-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-300"
				>
					Cancel
				</button>
				<button
					type="button"
					onClick={saveTemplate}
					disabled={!canSave}
					className={`rounded px-2 py-1 text-xs font-medium ${
						canSave
							? "bg-green-600 text-white hover:bg-green-700"
							: "cursor-not-allowed bg-gray-300 text-gray-500"
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
				<div className="flex border-b">
					<button
						type="button"
						className={`flex-1 py-2 text-xs font-medium ${
							activeTab === "build"
								? "border-b-2 border-green-600 text-green-700"
								: "text-gray-500"
						}`}
						onClick={() => setActiveTab("build")}
					>
						Build
					</button>
					<button
						type="button"
						className={`flex-1 py-2 text-xs font-medium ${
							activeTab === "chain"
								? "border-b-2 border-green-600 text-green-700"
								: "text-gray-500"
						}`}
						onClick={() => setActiveTab("chain")}
					>
						Chain
					</button>
				</div>
			)}

			<div className="overflow-y-auto p-2">
				{(!isMobile || activeTab === "build") && (
					<SegmentPalette onSelect={handleSegmentSelect} />
				)}
				{(!isMobile || activeTab === "chain") && (
					<ChainList
						selectedSegmentId={selectedSegmentId}
						onSelectSegment={setSelectedSegmentId}
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
				<div className="absolute inset-x-0 bottom-0 z-10 flex max-h-[40vh] flex-col border-t bg-white">
					{panelContent}
				</div>
			</>
		);
	}

	// Desktop: sidebar + top bar
	return (
		<>
			{topBar}
			<div className="absolute inset-y-0 left-0 top-[41px] z-10 flex w-64 flex-col border-r bg-white">
				{panelContent}
			</div>
		</>
	);
}
