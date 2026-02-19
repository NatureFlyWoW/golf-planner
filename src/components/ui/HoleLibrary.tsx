import { HOLE_TYPES } from "../../constants";
import { useStore } from "../../store";
import type { HoleType } from "../../types";

export function HoleLibrary() {
	const placingType = useStore((s) => s.ui.placingType);
	const setPlacingType = useStore((s) => s.setPlacingType);

	function handleSelect(type: HoleType) {
		if (placingType === type) {
			setPlacingType(null);
		} else {
			setPlacingType(type);
		}
	}

	return (
		<div className="flex flex-col gap-2">
			<p className="text-xs font-medium text-gray-500 uppercase">Hole Types</p>
			{HOLE_TYPES.map((ht) => (
				<button
					key={ht.type}
					type="button"
					onClick={() => handleSelect(ht.type)}
					className={`flex items-center gap-3 rounded-lg border p-2.5 text-left transition-colors ${
						placingType === ht.type
							? "border-blue-500 bg-blue-50"
							: "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
					}`}
				>
					<div
						className="h-8 w-8 rounded"
						style={{ backgroundColor: ht.color }}
					/>
					<div>
						<p className="text-sm font-medium">{ht.label}</p>
						<p className="text-xs text-gray-400">
							{ht.dimensions.width}m x {ht.dimensions.length}m · Par{" "}
							{ht.defaultPar}
						</p>
					</div>
				</button>
			))}
		</div>
	);
}
