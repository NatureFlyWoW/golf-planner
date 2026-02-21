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
				<div className="rounded-md bg-orange-50 px-2 py-1.5 text-center text-xs font-medium text-orange-700 ring-1 ring-orange-200">
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
								? "bg-green-600 text-white"
								: "bg-gray-200 text-gray-700 hover:bg-gray-300"
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
								? "border-green-500 bg-green-50 text-green-700"
								: replaceMode
									? "border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100"
									: "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
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
