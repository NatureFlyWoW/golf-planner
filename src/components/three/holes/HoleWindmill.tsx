import { useMemo } from "react";
import * as THREE from "three";
import { useStore } from "../../../store";
import { UV_EMISSIVE_INTENSITY } from "./materialPresets";
import { BumperRail } from "./BumperRail";
import { Cup } from "./Cup";
import { TeePad } from "./TeePad";
import { BUMPER_THICKNESS, SURFACE_THICKNESS } from "./shared";
import { useMaterials } from "./useMaterials";

const PILLAR_RADIUS = 0.05;
const PILLAR_HEIGHT = 0.3;
const BLADE_LENGTH = 0.25;
const BLADE_WIDTH = 0.06;
const BLADE_THICKNESS = 0.015;
const BLADE_Y = 0.2;
const BLADE_OFFSET_DEG = 22.5;
const LANE_WIDTH = 0.5;

const BLADE_ANGLES = [0, 90, 180, 270].map((deg) => ((deg + BLADE_OFFSET_DEG) * Math.PI) / 180);

export function HoleWindmill({
	width: _width,
	length,
	color,
}: {
	width: number;
	length: number;
	color: string;
}) {
	const { felt, bumper, tee, cup } = useMaterials();
	const uvMode = useStore((s) => s.ui.uvMode);

	const bt = BUMPER_THICKNESS;
	const st = SURFACE_THICKNESS;
	const halfL = length / 2;
	const halfLaneW = LANE_WIDTH / 2;

	const pillarMaterial = useMemo(
		() =>
			new THREE.MeshStandardMaterial(
				uvMode
					? {
							color: "#1A0011",
							emissive: "#FF1493",
							emissiveIntensity: UV_EMISSIVE_INTENSITY,
							roughness: 0.4,
							metalness: 0.3,
						}
					: { color: "#757575", roughness: 0.4, metalness: 0.3 },
			),
		[uvMode],
	);

	const bladeMaterial = useMemo(
		() =>
			new THREE.MeshStandardMaterial(
				uvMode
					? {
							color: "#1A0011",
							emissive: "#FF1493",
							emissiveIntensity: UV_EMISSIVE_INTENSITY,
							roughness: 0.5,
							metalness: 0.1,
						}
					: { color, roughness: 0.5, metalness: 0.1 },
			),
		[color, uvMode],
	);

	return (
		<group>
			{/* Felt surface */}
			<mesh position={[0, st / 2, 0]} material={felt}>
				<boxGeometry args={[LANE_WIDTH, st, length - bt * 2]} />
			</mesh>

			{/* Windmill obstacle (unchanged) */}
			<mesh castShadow position={[0, st + PILLAR_HEIGHT / 2, 0]} material={pillarMaterial}>
				<cylinderGeometry args={[PILLAR_RADIUS, PILLAR_RADIUS, PILLAR_HEIGHT, 12]} />
			</mesh>
			{BLADE_ANGLES.map((angle) => (
				<mesh
					castShadow
					key={angle.toFixed(5)}
					position={[
						Math.sin(angle) * (BLADE_LENGTH / 2 + PILLAR_RADIUS),
						st + BLADE_Y,
						Math.cos(angle) * (BLADE_LENGTH / 2 + PILLAR_RADIUS),
					]}
					rotation={[0, angle, 0]}
					material={bladeMaterial}
				>
					<boxGeometry args={[BLADE_THICKNESS, BLADE_WIDTH, BLADE_LENGTH]} />
				</mesh>
			))}

			{/* Bumper rails */}
			<BumperRail length={length} position={[-halfLaneW - bt / 2, st, -halfL]} material={bumper} />
			<BumperRail length={length} position={[halfLaneW + bt / 2, st, -halfL]} material={bumper} />
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
