import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useStore } from "../../../store";
import { UV_EMISSIVE_INTENSITY } from "./materialPresets";
import { BumperRail } from "./BumperRail";
import { Cup } from "./Cup";
import { TeePad } from "./TeePad";
import { BUMPER_THICKNESS, SURFACE_THICKNESS } from "./shared";
import { useMaterials } from "./useMaterials";

// ── Loop Constants ─────────────────────────────────────────
const LOOP_RADIUS = 0.3;
const TUBE_RADIUS = 0.04;
const PILLAR_RADIUS = 0.04;
const PILLAR_HEIGHT = 0.15;
const LANE_WIDTH = 0.5;

// New constants for enhanced loop
const PILLAR_RADIUS_TOP = PILLAR_RADIUS * 0.7;
const PILLAR_RADIUS_BOTTOM = PILLAR_RADIUS * 1.3;
const BRACE_SIZE = 0.02;
const TUBE_SEGMENTS = 48;
const TUBE_RADIAL_SEGMENTS = 12;

function createLoopCurve(): THREE.CatmullRomCurve3 {
	const points: THREE.Vector3[] = [];
	const segments = 12;
	for (let i = 0; i <= segments; i++) {
		const t = (i / segments) * Math.PI;
		points.push(
			new THREE.Vector3(
				0,
				LOOP_RADIUS * Math.sin(t),
				-LOOP_RADIUS * Math.cos(t),
			),
		);
	}
	return new THREE.CatmullRomCurve3(points);
}

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

	// ── Materials ───────────────────────────────────────────
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
					: { color, roughness: 0.3, metalness: 0.6 },
			),
		[color, uvMode],
	);

	// ── Geometries ──────────────────────────────────────────
	const loopTubeGeo = useMemo(() => {
		const curve = createLoopCurve();
		return new THREE.TubeGeometry(
			curve,
			TUBE_SEGMENTS,
			TUBE_RADIUS,
			TUBE_RADIAL_SEGMENTS,
			false,
		);
	}, []);

	const pillarGeo = useMemo(
		() =>
			new THREE.CylinderGeometry(
				PILLAR_RADIUS_TOP,
				PILLAR_RADIUS_BOTTOM,
				PILLAR_HEIGHT,
				8,
			),
		[],
	);

	const braceGeo = useMemo(
		() => new THREE.BoxGeometry(BRACE_SIZE, BRACE_SIZE, 2 * LOOP_RADIUS),
		[],
	);

	// ── Geometry Disposal ───────────────────────────────────
	useEffect(() => {
		return () => {
			loopTubeGeo.dispose();
			pillarGeo.dispose();
			braceGeo.dispose();
		};
	}, [loopTubeGeo, pillarGeo, braceGeo]);

	const torusCenterY = st + PILLAR_HEIGHT + LOOP_RADIUS;

	return (
		<group>
			{/* Felt surface */}
			<mesh position={[0, st / 2, 0]} material={felt}>
				<boxGeometry args={[LANE_WIDTH, st, length - bt * 2]} />
			</mesh>

			{/* Loop arch (TubeGeometry along semicircular path) */}
			<mesh
				castShadow
				geometry={loopTubeGeo}
				material={loopMaterial}
				position={[0, torusCenterY, 0]}
				rotation={[Math.PI / 2, Math.PI / 2, 0]}
			/>

			{/* Tapered support pillars */}
			<mesh
				castShadow
				geometry={pillarGeo}
				material={loopMaterial}
				position={[0, st + PILLAR_HEIGHT / 2, -LOOP_RADIUS]}
			/>
			<mesh
				castShadow
				geometry={pillarGeo}
				material={loopMaterial}
				position={[0, st + PILLAR_HEIGHT / 2, LOOP_RADIUS]}
			/>

			{/* Cross-brace between pillars */}
			<mesh
				castShadow
				geometry={braceGeo}
				material={loopMaterial}
				position={[0, st + PILLAR_HEIGHT * 0.5, 0]}
			/>

			{/* Bumper rails */}
			<BumperRail
				length={length}
				position={[-halfW + bt / 2, st, -halfL]}
				material={bumper}
			/>
			<BumperRail
				length={length}
				position={[halfW - bt / 2, st, -halfL]}
				material={bumper}
			/>
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
