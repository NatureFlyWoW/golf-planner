import { useMemo } from "react";
import * as THREE from "three";
import { useStore } from "../../../store";
import {
	BUMPER_HEIGHT,
	BUMPER_THICKNESS,
	CUP_RADIUS,
	SURFACE_THICKNESS,
	TEE_RADIUS,
} from "./shared";
import { useMaterials } from "./useMaterials";

// ── Windmill obstacle constants ───────────────────────────────────────────────
const PILLAR_RADIUS = 0.05;
const PILLAR_HEIGHT = 0.3;
const BLADE_LENGTH = 0.25;
const BLADE_WIDTH = 0.06;
const BLADE_THICKNESS = 0.015;
const BLADE_Y = 0.2;
const BLADE_OFFSET_DEG = 22.5;
const LANE_WIDTH = 0.5;

// Blade angles: 0°/90°/180°/270° each offset by 22.5° for visual interest.
// Frozen (no animation) — the windmill is a static obstacle.
const BLADE_ANGLES = [0, 90, 180, 270].map(
	(deg) => ((deg + BLADE_OFFSET_DEG) * Math.PI) / 180,
);

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

	// Gray cylinder material for the central pillar
	const pillarMaterial = useMemo(
		() =>
			new THREE.MeshStandardMaterial(
				uvMode
					? {
							color: "#1A0011",
							emissive: "#FF1493",
							emissiveIntensity: 0.3,
							roughness: 0.4,
							metalness: 0.3,
						}
					: { color: "#757575", roughness: 0.4, metalness: 0.3 },
			),
		[uvMode],
	);

	// Blade material uses the hole's accent color (typically pink/magenta)
	const bladeMaterial = useMemo(
		() =>
			new THREE.MeshStandardMaterial(
				uvMode
					? {
							color: "#1A0011",
							emissive: "#FF1493",
							emissiveIntensity: 0.5,
							roughness: 0.5,
							metalness: 0.1,
						}
					: { color, roughness: 0.5, metalness: 0.1 },
			),
		[color, uvMode],
	);

	return (
		<group>
			{/* ── Felt surface — narrow lane, inset by bumper thickness at each end ── */}
			<mesh position={[0, st / 2, 0]} material={felt}>
				<boxGeometry args={[LANE_WIDTH, st, length - bt * 2]} />
			</mesh>

			{/* ── Central pillar ── */}
			<mesh position={[0, st + PILLAR_HEIGHT / 2, 0]} material={pillarMaterial}>
				<cylinderGeometry
					args={[PILLAR_RADIUS, PILLAR_RADIUS, PILLAR_HEIGHT, 12]}
				/>
			</mesh>

			{/* ── Windmill blades (static, frozen at BLADE_OFFSET_DEG) ── */}
			{BLADE_ANGLES.map((angle) => (
				<mesh
					key={angle.toFixed(5)}
					position={[
						Math.sin(angle) * (BLADE_LENGTH / 2 + PILLAR_RADIUS),
						st + BLADE_Y,
						Math.cos(angle) * (BLADE_LENGTH / 2 + PILLAR_RADIUS),
					]}
					rotation={[0, angle, 0]}
					material={bladeMaterial}
				>
					{/* BLADE_THICKNESS on X (thin radially), BLADE_WIDTH on Y (tall), BLADE_LENGTH on Z (long outward) */}
					<boxGeometry args={[BLADE_THICKNESS, BLADE_WIDTH, BLADE_LENGTH]} />
				</mesh>
			))}

			{/* ── Left side bumper (full length) ── */}
			<mesh
				position={[-halfLaneW - bt / 2, st + BUMPER_HEIGHT / 2, 0]}
				material={bumper}
			>
				<boxGeometry args={[bt, BUMPER_HEIGHT, length]} />
			</mesh>

			{/* ── Right side bumper (full length) ── */}
			<mesh
				position={[halfLaneW + bt / 2, st + BUMPER_HEIGHT / 2, 0]}
				material={bumper}
			>
				<boxGeometry args={[bt, BUMPER_HEIGHT, length]} />
			</mesh>

			{/* ── Back end bumper (-Z, tee end) ── */}
			<mesh
				position={[0, st + BUMPER_HEIGHT / 2, -halfL + bt / 2]}
				material={bumper}
			>
				<boxGeometry args={[LANE_WIDTH, BUMPER_HEIGHT, bt]} />
			</mesh>

			{/* ── Front end bumper (+Z, cup end) ── */}
			<mesh
				position={[0, st + BUMPER_HEIGHT / 2, halfL - bt / 2]}
				material={bumper}
			>
				<boxGeometry args={[LANE_WIDTH, BUMPER_HEIGHT, bt]} />
			</mesh>

			{/* ── Tee marker — yellow disc at -Z end ── */}
			<mesh
				position={[0, st + 0.001, -halfL + 0.15]}
				rotation={[-Math.PI / 2, 0, 0]}
				material={tee}
			>
				<circleGeometry args={[TEE_RADIUS, 16]} />
			</mesh>

			{/* ── Cup marker — black disc at +Z end ── */}
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
