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

const LOOP_RADIUS = 0.3; // main radius of torus ring
const TUBE_RADIUS = 0.04; // tube cross-section thickness
const PILLAR_RADIUS = 0.04;
const PILLAR_HEIGHT = 0.15;
const LANE_WIDTH = 0.5; // playable lane width (narrower than bounding box)

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

	// Color material for the loop arch and pillars — recreated only when color changes
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

	// Base Y of the torus center: sits on top of the pillars
	const torusCenterY = st + PILLAR_HEIGHT + LOOP_RADIUS;

	return (
		<group>
			{/* ── Felt surface (lane-width only, full hole length minus bumper ends) ── */}
			<mesh position={[0, st / 2, 0]} material={felt}>
				<boxGeometry args={[LANE_WIDTH, st, length - bt * 2]} />
			</mesh>

			{/* ── Loop arch (half-torus) ────────────────────────────────────────────
			 *
			 *  Three.js TorusGeometry default: ring lies flat in the XZ plane, tube
			 *  wraps around Y axis.  Arc = Math.PI → a 180° semicircle, open ends
			 *  pointing along ±X by default.
			 *
			 *  Goal: a vertical arch standing over the lane (lane runs along Z).
			 *  The two open feet should be at Z = −LOOP_RADIUS and Z = +LOOP_RADIUS,
			 *  with the arch peak rising in +Y.
			 *
			 *  Rotation strategy:
			 *    rotation.x = Math.PI/2  →  tilts the flat ring upright into the YZ
			 *                               plane. The original ±X feet become ±Z feet.
			 *    rotation.y = Math.PI/2  →  applied AFTER x-rotation; rotates so the
			 *                               arc sweep starts in the correct half so the
			 *                               dome is above rather than below the lane.
			 *
			 *  Net result: feet at [0, st+PILLAR_HEIGHT, ±LOOP_RADIUS], peak at
			 *  [0, st+PILLAR_HEIGHT+LOOP_RADIUS, 0].
			 * ─────────────────────────────────────────────────────────────────────── */}
			<mesh
				castShadow
				position={[0, torusCenterY, 0]}
				rotation={[Math.PI / 2, Math.PI / 2, 0]}
				material={loopMaterial}
			>
				<torusGeometry args={[LOOP_RADIUS, TUBE_RADIUS, 12, 24, Math.PI]} />
			</mesh>

			{/* ── Support pillars ───────────────────────────────────────────────── */}
			{/* Back pillar (-Z foot of arch) */}
			<mesh
				castShadow
				position={[0, st + PILLAR_HEIGHT / 2, -LOOP_RADIUS]}
				material={loopMaterial}
			>
				<cylinderGeometry
					args={[PILLAR_RADIUS, PILLAR_RADIUS, PILLAR_HEIGHT, 8]}
				/>
			</mesh>

			{/* Front pillar (+Z foot of arch) */}
			<mesh
				castShadow
				position={[0, st + PILLAR_HEIGHT / 2, LOOP_RADIUS]}
				material={loopMaterial}
			>
				<cylinderGeometry
					args={[PILLAR_RADIUS, PILLAR_RADIUS, PILLAR_HEIGHT, 8]}
				/>
			</mesh>

			{/* ── Bumper walls ─────────────────────────────────────────────────── */}
			{/* Left side bumper — full hole length */}
			<mesh
				castShadow
				position={[-halfW + bt / 2, st + BUMPER_HEIGHT / 2, 0]}
				material={bumper}
			>
				<boxGeometry args={[bt, BUMPER_HEIGHT, length]} />
			</mesh>

			{/* Right side bumper — full hole length */}
			<mesh
				castShadow
				position={[halfW - bt / 2, st + BUMPER_HEIGHT / 2, 0]}
				material={bumper}
			>
				<boxGeometry args={[bt, BUMPER_HEIGHT, length]} />
			</mesh>

			{/* Back end bumper (-Z) — lane width only */}
			<mesh
				castShadow
				position={[0, st + BUMPER_HEIGHT / 2, -halfL + bt / 2]}
				material={bumper}
			>
				<boxGeometry args={[LANE_WIDTH, BUMPER_HEIGHT, bt]} />
			</mesh>

			{/* Front end bumper (+Z) — lane width only */}
			<mesh
				castShadow
				position={[0, st + BUMPER_HEIGHT / 2, halfL - bt / 2]}
				material={bumper}
			>
				<boxGeometry args={[LANE_WIDTH, BUMPER_HEIGHT, bt]} />
			</mesh>

			{/* ── Tee marker (yellow disc, tee end at −Z) ────────────────────── */}
			<mesh
				position={[0, st + 0.001, -halfL + 0.15]}
				rotation={[-Math.PI / 2, 0, 0]}
				material={tee}
			>
				<circleGeometry args={[TEE_RADIUS, 16]} />
			</mesh>

			{/* ── Cup marker (black disc, cup end at +Z) ─────────────────────── */}
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
