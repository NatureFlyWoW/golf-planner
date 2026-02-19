import type { SunData } from "../../hooks/useSunPosition";
import { HallFloor } from "./HallFloor";
import { HallOpenings } from "./HallOpenings";
import { HallWalls } from "./HallWalls";

type HallProps = {
	sunData?: SunData;
};

export function Hall({ sunData }: HallProps) {
	return (
		<group>
			<HallFloor />
			<HallWalls />
			<HallOpenings sunData={sunData} />
		</group>
	);
}
