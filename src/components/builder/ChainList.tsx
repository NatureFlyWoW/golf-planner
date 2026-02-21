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
			<div className="flex h-24 items-center justify-center text-sm text-text-muted">
				Add segments to build your hole
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-1">
			<div className="text-xs text-text-secondary">
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
								? "bg-neon-green/15 text-neon-green"
								: "text-primary hover:bg-plasma"
						}`}
						onClick={() =>
							onSelectSegment(selectedSegmentId === seg.id ? null : seg.id)
						}
					>
						<span className="text-text-muted">{i + 1}.</span>
						<span>{SEGMENT_SPECS[seg.specId].label}</span>
					</button>
				))}
			</div>
		</div>
	);
}
