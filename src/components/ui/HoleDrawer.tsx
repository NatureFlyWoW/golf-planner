import { HOLE_TYPES } from "../../constants";
import { useStore } from "../../store";
import type { HoleType } from "../../types";

export function HoleDrawer() {
	const activePanel = useStore((s) => s.ui.activePanel);
	const setActivePanel = useStore((s) => s.setActivePanel);
	const setPlacingType = useStore((s) => s.setPlacingType);
	const placingType = useStore((s) => s.ui.placingType);

	if (activePanel !== "holes") return null;

	function handleSelect(type: HoleType) {
		setPlacingType(type);
		setActivePanel(null);
	}

	function handleClose() {
		setActivePanel(null);
	}

	return (
		<>
			{/* Backdrop — tapping outside closes drawer */}
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: mobile drawer backdrop */}
			{/* biome-ignore lint/a11y/noStaticElementInteractions: backdrop dismiss pattern */}
			<div
				className="fixed inset-0 z-30 bg-black/20 md:hidden"
				onClick={handleClose}
			/>
			{/* Drawer */}
			<div className="fixed inset-x-0 bottom-0 z-40 flex max-h-[40vh] flex-col rounded-t-2xl bg-white shadow-2xl md:hidden">
				{/* Handle bar */}
				<div className="flex justify-center py-2">
					<div className="h-1 w-10 rounded-full bg-gray-300" />
				</div>
				{/* Header */}
				<div className="flex items-center justify-between border-b border-gray-100 px-4 pb-2">
					<span className="text-sm font-semibold">Choose Hole Type</span>
					<button
						type="button"
						onClick={handleClose}
						className="text-gray-400 hover:text-gray-600"
					>
						&#x2715;
					</button>
				</div>
				{/* Hole type list */}
				<div className="flex-1 overflow-y-auto p-3">
					<div className="flex flex-col gap-2">
						{HOLE_TYPES.map((ht) => (
							<button
								key={ht.type}
								type="button"
								onClick={() => handleSelect(ht.type)}
								className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
									placingType === ht.type
										? "border-blue-500 bg-blue-50"
										: "border-gray-200 active:bg-gray-50"
								}`}
							>
								<div
									className="h-10 w-10 rounded"
									style={{ backgroundColor: ht.color }}
								/>
								<div>
									<p className="text-sm font-medium">{ht.label}</p>
									<p className="text-xs text-gray-400">
										{ht.dimensions.width}m &times; {ht.dimensions.length}m
										&middot; Par {ht.defaultPar}
									</p>
								</div>
							</button>
						))}
					</div>
				</div>
			</div>
		</>
	);
}
