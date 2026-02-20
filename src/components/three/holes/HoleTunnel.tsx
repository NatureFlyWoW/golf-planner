import { useMemo } from "react";
import * as THREE from "three";
import { useStore } from "../../../store";
import { UV_EMISSIVE_INTENSITY } from "./materialPresets";
import {
	BUMPER_HEIGHT,
	BUMPER_THICKNESS,
	CUP_RADIUS,
	SURFACE_THICKNESS,
	TEE_RADIUS,
} from "./shared";
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

	// Arch radius spans the lane width (half-cylinder sits on the felt surface)
	const archRadius = laneW / 2;

	// Each open section (entry + exit) outside the tunnel
	const openLength = (length - TUNNEL_LENGTH) / 2;

	// Z centres of the two open bumper segments per side
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
			{/* Green felt surface — full lane, inset by bumper thickness at each end */}
			<mesh position={[0, st / 2, 0]} material={felt}>
				<boxGeometry args={[laneW, st, length - bt * 2]} />
			</mesh>

			{/* Tunnel arch — half-cylinder spanning the centre 1.6 m
			    CylinderGeometry axis is Y by default.
			    Rotating [-PI/2, 0, 0] maps: Y→-Z and Z→+Y, so the
			    arch's radial peak (+Z in cylinder space) becomes +Y in
			    world space — curving upward over the felt.
			    thetaStart=0, thetaLength=PI gives the top semicircle. */}
			<mesh
				castShadow
				position={[0, st, 0]}
				rotation={[-Math.PI / 2, 0, 0]}
				material={tunnelMaterial}
			>
				<cylinderGeometry
					args={[
						archRadius,
						archRadius,
						TUNNEL_LENGTH,
						TUNNEL_SEGMENTS,
						1,
						true,
						0,
						Math.PI,
					]}
				/>
			</mesh>

			{/* ── Side bumpers — entry zone (left and right) ── */}
			<mesh
				castShadow
				position={[-halfW + bt / 2, st + BUMPER_HEIGHT / 2, entryCenterZ]}
				material={bumper}
			>
				<boxGeometry args={[bt, BUMPER_HEIGHT, openLength]} />
			</mesh>
			<mesh
				castShadow
				position={[halfW - bt / 2, st + BUMPER_HEIGHT / 2, entryCenterZ]}
				material={bumper}
			>
				<boxGeometry args={[bt, BUMPER_HEIGHT, openLength]} />
			</mesh>

			{/* ── Side bumpers — exit zone (left and right) ── */}
			<mesh
				castShadow
				position={[-halfW + bt / 2, st + BUMPER_HEIGHT / 2, exitCenterZ]}
				material={bumper}
			>
				<boxGeometry args={[bt, BUMPER_HEIGHT, openLength]} />
			</mesh>
			<mesh
				castShadow
				position={[halfW - bt / 2, st + BUMPER_HEIGHT / 2, exitCenterZ]}
				material={bumper}
			>
				<boxGeometry args={[bt, BUMPER_HEIGHT, openLength]} />
			</mesh>

			{/* Back end bumper (-Z, full lane width) */}
			<mesh
				castShadow
				position={[0, st + BUMPER_HEIGHT / 2, -halfL + bt / 2]}
				material={bumper}
			>
				<boxGeometry args={[laneW, BUMPER_HEIGHT, bt]} />
			</mesh>

			{/* Front end bumper (+Z, full lane width) */}
			<mesh
				castShadow
				position={[0, st + BUMPER_HEIGHT / 2, halfL - bt / 2]}
				material={bumper}
			>
				<boxGeometry args={[laneW, BUMPER_HEIGHT, bt]} />
			</mesh>

			{/* Tee marker — yellow circle at the -Z (entry) end */}
			<mesh
				position={[0, st + 0.001, -halfL + 0.15]}
				rotation={[-Math.PI / 2, 0, 0]}
				material={tee}
			>
				<circleGeometry args={[TEE_RADIUS, 16]} />
			</mesh>

			{/* Cup marker — black circle at the +Z (exit) end */}
			<mesh
				position={[0, st + 0.001, halfL - 0.15]}
				rotation={[-Math.PI / 2, 0, 0]}
				material={cup}
			>
				<circleGeometry args={[CUP_RADIUS, 16]} />
			</mesh>
		</group>
	);
}
