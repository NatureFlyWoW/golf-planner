import { HOLE_TYPES } from "../../constants";
import { useStore } from "../../store";
import type { HoleType } from "../../types";

export function HoleLibrary() {
	const placingType = useStore((s) => s.ui.placingType);
	const placingTemplateId = useStore((s) => s.ui.placingTemplateId);
	const setPlacingType = useStore((s) => s.setPlacingType);
	const setPlacingTemplateId = useStore((s) => s.setPlacingTemplateId);
	const holeTemplates = useStore((s) => s.holeTemplates);
	const enterBuilder = useStore((s) => s.enterBuilder);

	function handleSelect(type: HoleType) {
		if (placingType === type) {
			setPlacingType(null);
		} else {
			setPlacingType(type);
		}
	}

	const templateList = Object.values(holeTemplates);

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

			{templateList.length > 0 && (
				<>
					<p className="mt-4 text-xs font-medium text-gray-500 uppercase">
						My Holes
					</p>
					{templateList.map((template) => (
						<div key={template.id} className="flex items-center gap-2">
							<button
								type="button"
								onClick={() => {
									if (placingTemplateId === template.id) {
										setPlacingTemplateId(null);
									} else {
										setPlacingTemplateId(template.id);
									}
								}}
								className={`flex flex-1 items-center gap-3 rounded-lg border p-2.5 text-left transition-colors ${
									placingTemplateId === template.id
										? "border-blue-500 bg-blue-50"
										: "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
								}`}
							>
								<div
									className="h-8 w-8 rounded"
									style={{ backgroundColor: template.color }}
								/>
								<div>
									<p className="text-sm font-medium">{template.name}</p>
									<p className="text-xs text-gray-400">
										{template.segments.length} segments · Par{" "}
										{template.defaultPar}
									</p>
								</div>
							</button>
							<button
								type="button"
								onClick={() => enterBuilder(template.id)}
								className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
								title="Edit template"
							>
								&#x270E;
							</button>
						</div>
					))}
				</>
			)}

			<button
				type="button"
				onClick={() => enterBuilder()}
				className="mt-4 w-full rounded-lg border-2 border-dashed border-gray-300 p-3 text-center text-sm font-medium text-gray-500 transition-colors hover:border-green-400 hover:text-green-600"
			>
				+ Build Custom Hole
			</button>
		</div>
	);
}
