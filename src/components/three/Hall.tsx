import { Suspense } from "react";
import type { SunData } from "../../hooks/useSunPosition";
import { HallFloor } from "./HallFloor";
import { HallOpenings } from "./HallOpenings";
import { HallWalls } from "./HallWalls";

type HallProps = {
	sunData?: SunData;
};

export function Hall({ sunData }: HallProps) {
	return (
		<Suspense fallback={null}>
			<group>
				<HallFloor />
				<HallWalls />
				<HallOpenings sunData={sunData} />
			</group>
		</Suspense>
	);
}
