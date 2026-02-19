import { HallFloor } from "./HallFloor";
import { HallOpenings } from "./HallOpenings";
import { HallWalls } from "./HallWalls";

export function Hall() {
	return (
		<group>
			<HallFloor />
			<HallWalls />
			<HallOpenings />
		</group>
	);
}
