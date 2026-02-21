import { BumperRail } from "./BumperRail";
import { Cup } from "./Cup";
import { TeePad } from "./TeePad";
import { BUMPER_THICKNESS, SURFACE_THICKNESS } from "./shared";
import { useMaterials } from "./useMaterials";

type Props = { width: number; length: number };

export function HoleStraight({ width, length }: Props) {
	const { felt, bumper, tee, cup } = useMaterials();
	const halfW = width / 2;
	const halfL = length / 2;
	const laneW = width - BUMPER_THICKNESS * 2;
	const laneL = length - BUMPER_THICKNESS * 2;

	return (
		<group>
			{/* Green felt surface */}
			<mesh position={[0, SURFACE_THICKNESS / 2, 0]} material={felt}>
				<boxGeometry args={[laneW, SURFACE_THICKNESS, laneL]} />
			</mesh>

			{/* Bumper rails */}
			<BumperRail
				length={length}
				position={[-halfW + BUMPER_THICKNESS / 2, SURFACE_THICKNESS, -halfL]}
				material={bumper}
			/>
			<BumperRail
				length={length}
				position={[halfW - BUMPER_THICKNESS / 2, SURFACE_THICKNESS, -halfL]}
				material={bumper}
			/>
			<BumperRail
				length={laneW}
				position={[-laneW / 2, SURFACE_THICKNESS, -halfL + BUMPER_THICKNESS / 2]}
				rotation={[0, -Math.PI / 2, 0]}
				material={bumper}
			/>
			<BumperRail
				length={laneW}
				position={[-laneW / 2, SURFACE_THICKNESS, halfL - BUMPER_THICKNESS / 2]}
				rotation={[0, -Math.PI / 2, 0]}
				material={bumper}
			/>

			<TeePad position={[0, 0, -halfL + 0.15]} material={tee} />
			<Cup position={[0, 0, halfL - 0.15]} material={cup} />
		</group>
	);
}
