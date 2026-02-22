import { Suspense } from "react";
import type { SunData } from "../../hooks/useSunPosition";
import { useViewportId } from "../../hooks/useViewportId";
import { useStore } from "../../store";
import { HallFloor } from "./HallFloor";
import { HallOpenings } from "./HallOpenings";
import { HallWalls } from "./HallWalls";

type HallProps = {
	sunData?: SunData;
};

export function Hall({ sunData }: HallProps) {
	const wallsLayer = useStore((s) => s.ui.layers.walls);
	const viewportId = useViewportId();
	const is2D = viewportId === "2d";

	return (
		<Suspense fallback={null}>
			<group>
				<HallFloor />
				{/* 3D box-geometry walls: only in 3D viewport (or mobile/null) */}
				{!is2D && wallsLayer.visible && (
					<HallWalls layerOpacity={wallsLayer.opacity} />
				)}
				{!is2D && wallsLayer.visible && <HallOpenings sunData={sunData} />}
			</group>
		</Suspense>
	);
}
