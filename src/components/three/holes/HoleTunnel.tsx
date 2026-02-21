import { useMemo } from "react";
import * as THREE from "three";
import { useStore } from "../../../store";
import { UV_EMISSIVE_INTENSITY } from "./materialPresets";
import { BumperRail } from "./BumperRail";
import { Cup } from "./Cup";
import { TeePad } from "./TeePad";
import { BUMPER_THICKNESS, SURFACE_THICKNESS } from "./shared";
import { useMaterials } from "./useMaterials";

const TUNNEL_LENGTH = 1.6;
const TUNNEL_SEGMENTS = 16;

export function HoleTunnel({
	width,
	length,
	color: _color,
}: {
	width: number;
	length: number;
	color: string;
}) {
	const { felt, bumper, tee, cup } = useMaterials();
	const uvMode = useStore((s) => s.ui.uvMode);

	const bt = BUMPER_THICKNESS;
	const st = SURFACE_THICKNESS;
	const halfW = width / 2;
	const halfL = length / 2;
	const laneW = width - bt * 2;
	const archRadius = laneW / 2;
	const openLength = (length - TUNNEL_LENGTH) / 2;
	const entryCenterZ = -halfL + openLength / 2;
	const exitCenterZ = halfL - openLength / 2;

	const tunnelMaterial = useMemo(
		() =>
			new THREE.MeshStandardMaterial(
				uvMode
					? {
							color: "#0D001A",
							emissive: "#9933FF",
							emissiveIntensity: UV_EMISSIVE_INTENSITY,
							roughness: 0.6,
							metalness: 0.1,
						}
					: { color: "#455A64", roughness: 0.6, metalness: 0.1 },
			),
		[uvMode],
	);

	return (
		<group>
			{/* Felt surface */}
			<mesh position={[0, st / 2, 0]} material={felt}>
				<boxGeometry args={[laneW, st, length - bt * 2]} />
			</mesh>

			{/* Tunnel arch (obstacle geometry unchanged) */}
			<mesh castShadow position={[0, st, 0]} rotation={[-Math.PI / 2, 0, 0]} material={tunnelMaterial}>
				<cylinderGeometry
					args={[archRadius, archRadius, TUNNEL_LENGTH, TUNNEL_SEGMENTS, 1, true, 0, Math.PI]}
				/>
			</mesh>

			{/* Entry zone side bumpers */}
			<BumperRail
				length={openLength}
				position={[-halfW + bt / 2, st, -halfL + (openLength - openLength)]}
				material={bumper}
			/>
			<BumperRail
				length={openLength}
				position={[halfW - bt / 2, st, -halfL + (openLength - openLength)]}
				material={bumper}
			/>
			{/* Exit zone side bumpers */}
			<BumperRail
				length={openLength}
				position={[-halfW + bt / 2, st, halfL - openLength]}
				material={bumper}
			/>
			<BumperRail
				length={openLength}
				position={[halfW - bt / 2, st, halfL - openLength]}
				material={bumper}
			/>

			{/* End bumpers */}
			<BumperRail
				length={laneW}
				position={[-laneW / 2, st, -halfL + bt / 2]}
				rotation={[0, -Math.PI / 2, 0]}
				material={bumper}
			/>
			<BumperRail
				length={laneW}
				position={[-laneW / 2, st, halfL - bt / 2]}
				rotation={[0, -Math.PI / 2, 0]}
				material={bumper}
			/>

			<TeePad position={[0, 0, -halfL + 0.15]} material={tee} />
			<Cup position={[0, 0, halfL - 0.15]} material={cup} />
		</group>
	);
}
