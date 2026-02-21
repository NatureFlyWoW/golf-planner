import { Canvas } from "@react-three/fiber";
import { Suspense, useState } from "react";
import { useStore } from "../../store";
import { isMobile } from "../../utils/isMobile";
import { BuilderCanvas } from "./BuilderCanvas";
import { BuilderUI } from "./BuilderUI";

export default function Builder() {
	const builderMode = useStore((s) => s.builderMode);
	const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(
		null,
	);

	if (!builderMode) return null;

	return (
		<div className="fixed inset-0 z-50 flex flex-col bg-surface">
			<BuilderUI
				selectedSegmentId={selectedSegmentId}
				onSelectSegment={setSelectedSegmentId}
			/>
			<div className="relative flex-1" style={{ touchAction: "none" }}>
				<Canvas
					orthographic
					camera={{ zoom: 80, position: [0, 10, 0], up: [0, 0, -1] }}
					dpr={isMobile ? [1, 1.5] : [1, 2]}
					frameloop="demand"
				>
					<Suspense fallback={null}>
						<BuilderCanvas
							selectedSegmentId={selectedSegmentId}
							onSelectSegment={setSelectedSegmentId}
						/>
					</Suspense>
				</Canvas>
			</div>
		</div>
	);
}
