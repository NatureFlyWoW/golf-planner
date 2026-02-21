import { SEGMENT_SPECS } from "../../constants/segmentSpecs";
import { useStore } from "../../store";

type Props = {
	selectedSegmentId: string | null;
	onSelectSegment: (id: string | null) => void;
};

export function ChainList({ selectedSegmentId, onSelectSegment }: Props) {
	const segments = useStore((s) => s.builderDraft?.segments ?? []);

	const totalLength = segments.reduce((sum, seg) => {
		return sum + SEGMENT_SPECS[seg.specId].length;
	}, 0);

	if (segments.length === 0) {
		return (
			<div className="flex h-24 items-center justify-center text-sm text-gray-400">
				Add segments to build your hole
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-1">
			<div className="text-xs text-gray-500">
				{segments.length} segments · {totalLength.toFixed(1)}m total
			</div>
			<div
				className="flex flex-col gap-0.5 overflow-y-auto"
				style={{ maxHeight: "200px" }}
			>
				{segments.map((seg, i) => (
					<button
						key={seg.id}
						type="button"
						className={`flex items-center gap-2 rounded px-2 py-1 text-left text-xs transition-colors ${
							selectedSegmentId === seg.id
								? "bg-green-100 text-green-800"
								: "text-gray-700 hover:bg-gray-100"
						}`}
						onClick={() =>
							onSelectSegment(selectedSegmentId === seg.id ? null : seg.id)
						}
					>
						<span className="text-gray-400">{i + 1}.</span>
						<span>{SEGMENT_SPECS[seg.specId].label}</span>
					</button>
				))}
			</div>
		</div>
	);
}
