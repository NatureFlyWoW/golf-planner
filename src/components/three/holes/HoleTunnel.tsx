import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useStore } from "../../../store";
import { createTunnelArchGeometry } from "../../../utils/tunnelGeometry";
import { UV_EMISSIVE_INTENSITY } from "./materialPresets";
import { BumperRail } from "./BumperRail";
import { Cup } from "./Cup";
import { TeePad } from "./TeePad";
import { BUMPER_THICKNESS, SURFACE_THICKNESS } from "./shared";
import { useMaterials } from "./useMaterials";

const TUNNEL_LENGTH = 1.6;
const WALL_THICKNESS = 0.05;
const FRAME_THICKNESS = 0.03;
const FRAME_SCALE = 1.05;

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

	// ── Materials ───────────────────────────────────────────
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
					: {
							color: "#8B7355",
							roughness: 0.85,
							metalness: 0.05,
						},
			),
		[uvMode],
	);

	// ── Geometries ──────────────────────────────────────────
	const archGeometry = useMemo(
		() => createTunnelArchGeometry(archRadius, TUNNEL_LENGTH, WALL_THICKNESS),
		[archRadius],
	);

	const frameGeometry = useMemo(
		() =>
			createTunnelArchGeometry(
				archRadius * FRAME_SCALE,
				FRAME_THICKNESS,
				WALL_THICKNESS,
			),
		[archRadius],
	);

	// ── Geometry Disposal ───────────────────────────────────
	useEffect(() => {
		return () => {
			archGeometry.dispose();
			frameGeometry.dispose();
		};
	}, [archGeometry, frameGeometry]);

	// Position the arch so it's centered on the hole
	const archZ = -TUNNEL_LENGTH / 2;

	return (
		<group>
			{/* Felt surface */}
			<mesh position={[0, st / 2, 0]} material={felt}>
				<boxGeometry args={[laneW, st, length - bt * 2]} />
			</mesh>

			{/* Tunnel arch (ExtrudeGeometry archway) */}
			<mesh
				castShadow
				geometry={archGeometry}
				material={tunnelMaterial}
				position={[0, st, archZ]}
			/>

			{/* Entrance frame */}
			<mesh
				castShadow
				geometry={frameGeometry}
				material={tunnelMaterial}
				position={[0, st, archZ - FRAME_THICKNESS]}
			/>

			{/* Exit frame */}
			<mesh
				castShadow
				geometry={frameGeometry}
				material={tunnelMaterial}
				position={[0, st, archZ + TUNNEL_LENGTH]}
			/>

			{/* Entry zone side bumpers */}
			<BumperRail
				length={openLength}
				position={[-halfW + bt / 2, st, -halfL]}
				material={bumper}
			/>
			<BumperRail
				length={openLength}
				position={[halfW - bt / 2, st, -halfL]}
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
