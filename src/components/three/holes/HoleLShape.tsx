import { BumperRail } from "./BumperRail";
import { CornerFillet } from "./CornerFillet";
import { Cup } from "./Cup";
import { TeePad } from "./TeePad";
import { BUMPER_THICKNESS, SURFACE_THICKNESS } from "./shared";
import { useMaterials } from "./useMaterials";

const LANE_WIDTH = 0.5;

type Props = { width: number; length: number };

export function HoleLShape({ width, length }: Props) {
	const { felt, bumper, tee, cup } = useMaterials();
	const halfW = width / 2;
	const halfL = length / 2;
	const BT = BUMPER_THICKNESS;
	const ST = SURFACE_THICKNESS;

	const entryLaneCX = halfW - LANE_WIDTH / 2;
	const innerEdgeX = halfW - LANE_WIDTH;
	const exitLaneCZ = halfL - LANE_WIDTH / 2;
	const innerEdgeZ = halfL - LANE_WIDTH;
	const exitFeltW = innerEdgeX - -halfW;
	const exitFeltCX = -halfW + exitFeltW / 2;

	return (
		<group>
			{/* Felt surfaces */}
			<mesh position={[entryLaneCX, ST / 2, 0]} material={felt}>
				<boxGeometry args={[LANE_WIDTH, ST, length]} />
			</mesh>
			<mesh position={[exitFeltCX, ST / 2, exitLaneCZ]} material={felt}>
				<boxGeometry args={[exitFeltW, ST, LANE_WIDTH]} />
			</mesh>

			{/* Right wall — full length */}
			<BumperRail
				length={length}
				position={[halfW - BT / 2, ST, -halfL]}
				material={bumper}
			/>
			{/* Bottom wall — entry lane at -Z */}
			<BumperRail
				length={LANE_WIDTH}
				position={[entryLaneCX - LANE_WIDTH / 2, ST, -halfL + BT / 2]}
				rotation={[0, -Math.PI / 2, 0]}
				material={bumper}
			/>
			{/* Top wall — full width at +Z */}
			<BumperRail
				length={width}
				position={[-halfW, ST, halfL - BT / 2]}
				rotation={[0, -Math.PI / 2, 0]}
				material={bumper}
			/>
			{/* Left wall — exit lane section */}
			<BumperRail
				length={LANE_WIDTH}
				position={[-halfW + BT / 2, ST, innerEdgeZ]}
				material={bumper}
			/>
			{/* Inner bottom of exit lane */}
			<BumperRail
				length={exitFeltW}
				position={[-halfW, ST, innerEdgeZ + BT / 2]}
				rotation={[0, -Math.PI / 2, 0]}
				material={bumper}
			/>
			{/* Inner right of entry lane */}
			<BumperRail
				length={innerEdgeZ - -halfL}
				position={[innerEdgeX - BT / 2, ST, -halfL]}
				material={bumper}
			/>

			{/* Corner fillet at inner junction */}
			<CornerFillet
				position={[innerEdgeX, ST / 2, innerEdgeZ]}
				rotation={[Math.PI / 2, -Math.PI / 2, 0]}
				radius={LANE_WIDTH * 0.3}
				height={ST}
				material={felt}
			/>

			<TeePad position={[entryLaneCX, 0, -halfL + 0.15]} material={tee} />
			<Cup position={[-halfW + 0.15, 0, exitLaneCZ]} material={cup} />
		</group>
	);
}
