import { BumperRail } from "./BumperRail";
import { Cup } from "./Cup";
import { TeePad } from "./TeePad";
import { BUMPER_HEIGHT, BUMPER_THICKNESS, SURFACE_THICKNESS } from "./shared";
import { useMaterials } from "./useMaterials";

const LANE_WIDTH = 0.6;
const OFFSET = 0.15;

export function HoleDogleg({ width, length }: { width: number; length: number }) {
	const { felt, bumper, tee, cup } = useMaterials();
	const halfW = width / 2;
	const halfL = length / 2;
	const BT = BUMPER_THICKNESS;
	const ST = SURFACE_THICKNESS;

	const innerL = length - BT * 2;
	const segLen = innerL / 3;

	const zEntry = -halfL + BT + segLen / 2;
	const zMid = 0;
	const zExit = halfL - BT - segLen / 2;
	const zBend1 = -halfL + BT + segLen;
	const zBend2 = halfL - BT - segLen;

	const transitionW = LANE_WIDTH + OFFSET;
	const transitionL = BT;

	const guideBumperH = BUMPER_HEIGHT * 0.6;
	const guideBumperLen = BT * 1.5;

	return (
		<group>
			{/* Felt surfaces */}
			<mesh position={[OFFSET, ST / 2, zEntry]} material={felt}>
				<boxGeometry args={[LANE_WIDTH, ST, segLen]} />
			</mesh>
			<mesh position={[0, ST / 2, zMid]} material={felt}>
				<boxGeometry args={[LANE_WIDTH, ST, segLen]} />
			</mesh>
			<mesh position={[-OFFSET, ST / 2, zExit]} material={felt}>
				<boxGeometry args={[LANE_WIDTH, ST, segLen]} />
			</mesh>
			<mesh position={[OFFSET / 2, ST / 2, zBend1]} material={felt}>
				<boxGeometry args={[transitionW, ST, transitionL]} />
			</mesh>
			<mesh position={[-OFFSET / 2, ST / 2, zBend2]} material={felt}>
				<boxGeometry args={[transitionW, ST, transitionL]} />
			</mesh>

			{/* Outer bumpers */}
			<BumperRail length={length} position={[-halfW + BT / 2, ST, -halfL]} material={bumper} />
			<BumperRail length={length} position={[halfW - BT / 2, ST, -halfL]} material={bumper} />
			{/* End bumpers */}
			<BumperRail
				length={width}
				position={[-halfW, ST, -halfL + BT / 2]}
				rotation={[0, -Math.PI / 2, 0]}
				material={bumper}
			/>
			<BumperRail
				length={width}
				position={[-halfW, ST, halfL - BT / 2]}
				rotation={[0, -Math.PI / 2, 0]}
				material={bumper}
			/>

			{/* Guide bumpers at bends */}
			<BumperRail
				length={guideBumperLen}
				position={[OFFSET + LANE_WIDTH / 2 + BT / 2, ST, zBend1 - guideBumperLen / 2]}
				height={guideBumperH}
				material={bumper}
			/>
			<BumperRail
				length={guideBumperLen}
				position={[-OFFSET - LANE_WIDTH / 2 - BT / 2, ST, zBend2 - guideBumperLen / 2]}
				height={guideBumperH}
				material={bumper}
			/>

			<TeePad position={[OFFSET, 0, -halfL + 0.15]} material={tee} />
			<Cup position={[-OFFSET, 0, halfL - 0.15]} material={cup} />
		</group>
	);
}
