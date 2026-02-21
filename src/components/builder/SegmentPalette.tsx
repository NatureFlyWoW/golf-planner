import { useState } from "react";
import {
	SEGMENT_CATEGORIES,
	SEGMENT_SPEC_LIST,
} from "../../constants/segmentSpecs";
import type { SegmentCategory, SegmentSpecId } from "../../types/template";

type Props = {
	onSelect: (specId: SegmentSpecId) => void;
	activeSpecId?: SegmentSpecId;
	/** When true, tapping a type replaces the selected segment rather than appending. */
	replaceMode?: boolean;
};

export function SegmentPalette({ onSelect, activeSpecId, replaceMode }: Props) {
	const [activeCategory, setActiveCategory] =
		useState<SegmentCategory>("straight");

	const categories = Object.entries(SEGMENT_CATEGORIES) as [
		SegmentCategory,
		string,
	][];
	const filteredSpecs = SEGMENT_SPEC_LIST.filter(
		(spec) => spec.category === activeCategory,
	);

	return (
		<div className="flex flex-col gap-2">
			{/* Replace mode banner */}
			{replaceMode && (
				<div className="rounded-md bg-neon-amber/10 px-2 py-1.5 text-center text-xs font-medium text-neon-amber ring-1 ring-neon-amber/30">
					Tap type to replace selected segment
				</div>
			)}

			{/* Category tabs */}
			<div className="flex gap-1">
				{categories.map(([id, label]) => (
					<button
						key={id}
						type="button"
						className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
							activeCategory === id
								? "bg-neon-green/80 text-surface"
								: "bg-plasma text-primary hover:bg-grid-ghost"
						}`}
						onClick={() => setActiveCategory(id)}
					>
						{label}
					</button>
				))}
			</div>

			{/* Segment type grid */}
			<div className="grid grid-cols-2 gap-1.5">
				{filteredSpecs.map((spec) => (
					<button
						key={spec.id}
						type="button"
						className={`rounded-md border px-2 py-2 text-xs font-medium transition-colors ${
							activeSpecId === spec.id
								? "border-neon-green bg-neon-green/10 text-neon-green"
								: replaceMode
									? "border-neon-amber/50 bg-neon-amber/10 text-neon-amber hover:bg-neon-amber/15"
									: "border-subtle bg-surface-raised text-primary hover:bg-plasma"
						}`}
						onClick={() => onSelect(spec.id)}
					>
						{spec.label}
					</button>
				))}
			</div>
		</div>
	);
}
