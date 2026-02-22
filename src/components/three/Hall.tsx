import { Suspense } from "react";
import type { SunData } from "../../hooks/useSunPosition";
import { useStore } from "../../store";
import { HallFloor } from "./HallFloor";
import { HallOpenings } from "./HallOpenings";
import { HallWalls } from "./HallWalls";

type HallProps = {
	sunData?: SunData;
};

export function Hall({ sunData }: HallProps) {
	const wallsLayer = useStore((s) => s.ui.layers.walls);

	return (
		<Suspense fallback={null}>
			<group>
				<HallFloor />
				{wallsLayer.visible && (
					<HallWalls layerOpacity={wallsLayer.opacity} />
				)}
				{wallsLayer.visible && <HallOpenings sunData={sunData} />}
			</group>
		</Suspense>
	);
}
