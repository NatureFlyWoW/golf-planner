import { useMemo } from "react";
import * as THREE from "three";
import { useStore } from "../../../store";
import { UV_EMISSIVE_INTENSITY } from "./materialPresets";
import { BumperRail } from "./BumperRail";
import { Cup } from "./Cup";
import { TeePad } from "./TeePad";
import { BUMPER_THICKNESS, SURFACE_THICKNESS } from "./shared";
import { useMaterials } from "./useMaterials";

const LOOP_RADIUS = 0.3;
const TUBE_RADIUS = 0.04;
const PILLAR_RADIUS = 0.04;
const PILLAR_HEIGHT = 0.15;
const LANE_WIDTH = 0.5;

export function HoleLoop({
	width,
	length,
	color,
}: {
	width: number;
	length: number;
	color: string;
}) {
	const { felt, bumper, tee, cup } = useMaterials();
	const uvMode = useStore((s) => s.ui.uvMode);

	const halfW = width / 2;
	const halfL = length / 2;
	const bt = BUMPER_THICKNESS;
	const st = SURFACE_THICKNESS;

	const loopMaterial = useMemo(
		() =>
			new THREE.MeshStandardMaterial(
				uvMode
					? {
							color: "#001A1A",
							emissive: "#00FFFF",
							emissiveIntensity: UV_EMISSIVE_INTENSITY,
							roughness: 0.4,
							metalness: 0.2,
						}
					: { color, roughness: 0.4, metalness: 0.2 },
			),
		[color, uvMode],
	);

	const torusCenterY = st + PILLAR_HEIGHT + LOOP_RADIUS;

	return (
		<group>
			{/* Felt surface */}
			<mesh position={[0, st / 2, 0]} material={felt}>
				<boxGeometry args={[LANE_WIDTH, st, length - bt * 2]} />
			</mesh>

			{/* Loop arch (obstacle geometry unchanged) */}
			<mesh
				castShadow
				position={[0, torusCenterY, 0]}
				rotation={[Math.PI / 2, Math.PI / 2, 0]}
				material={loopMaterial}
			>
				<torusGeometry args={[LOOP_RADIUS, TUBE_RADIUS, 12, 24, Math.PI]} />
			</mesh>

			{/* Support pillars */}
			<mesh castShadow position={[0, st + PILLAR_HEIGHT / 2, -LOOP_RADIUS]} material={loopMaterial}>
				<cylinderGeometry args={[PILLAR_RADIUS, PILLAR_RADIUS, PILLAR_HEIGHT, 8]} />
			</mesh>
			<mesh castShadow position={[0, st + PILLAR_HEIGHT / 2, LOOP_RADIUS]} material={loopMaterial}>
				<cylinderGeometry args={[PILLAR_RADIUS, PILLAR_RADIUS, PILLAR_HEIGHT, 8]} />
			</mesh>

			{/* Bumper rails */}
			<BumperRail length={length} position={[-halfW + bt / 2, st, -halfL]} material={bumper} />
			<BumperRail length={length} position={[halfW - bt / 2, st, -halfL]} material={bumper} />
			<BumperRail
				length={LANE_WIDTH}
				position={[-LANE_WIDTH / 2, st, -halfL + bt / 2]}
				rotation={[0, -Math.PI / 2, 0]}
				material={bumper}
			/>
			<BumperRail
				length={LANE_WIDTH}
				position={[-LANE_WIDTH / 2, st, halfL - bt / 2]}
				rotation={[0, -Math.PI / 2, 0]}
				material={bumper}
			/>

			<TeePad position={[0, 0, -halfL + 0.15]} material={tee} />
			<Cup position={[0, 0, halfL - 0.15]} material={cup} />
		</group>
	);
}
