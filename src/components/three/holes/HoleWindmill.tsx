import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useStore } from "../../../store";
import { UV_EMISSIVE_INTENSITY } from "./materialPresets";
import { BumperRail } from "./BumperRail";
import { Cup } from "./Cup";
import { TeePad } from "./TeePad";
import { BUMPER_THICKNESS, SURFACE_THICKNESS } from "./shared";
import { useMaterials } from "./useMaterials";

// ── Windmill Constants ─────────────────────────────────────
const LANE_WIDTH = 0.5;

// Tower
const TOWER_BASE_RADIUS = 0.12;
const TOWER_TOP_RADIUS = 0.08;
const TOWER_HEIGHT = 0.5;

// Roof
const ROOF_RADIUS = 0.14;
const ROOF_HEIGHT = 0.18;

// Blade assembly
const BLADE_LENGTH = 0.28;
const BLADE_HUB_WIDTH = 0.04;
const BLADE_TIP_WIDTH = 0.06;
const BLADE_THICKNESS = 0.01;
const HUB_RADIUS = 0.03;
const HUB_DEPTH = 0.02;

// Door detail
const DOOR_WIDTH = 0.05;
const DOOR_HEIGHT = 0.1;

// Animation
export const ROTATION_SPEED = 0.5; // rad/sec

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
	const view = useStore((s) => s.ui.view);
	const invalidate = useThree((s) => s.invalidate);
	const bladeRef = useRef<THREE.Group>(null);

	const bt = BUMPER_THICKNESS;
	const st = SURFACE_THICKNESS;
	const halfL = length / 2;
	const halfLaneW = LANE_WIDTH / 2;

	// ── Materials ───────────────────────────────────────────
	const towerMaterial = useMemo(
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
					: { color: "#9E9E9E", roughness: 0.7, metalness: 0.1 },
			),
		[uvMode],
	);

	const roofMaterial = useMemo(
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
					: { color: "#5D4037", roughness: 0.8, metalness: 0 },
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

	const doorMaterial = useMemo(
		() =>
			new THREE.MeshStandardMaterial(
				uvMode
					? { color: "#0A0008", roughness: 0.9, metalness: 0 }
					: { color: "#3E2723", roughness: 0.9, metalness: 0 },
			),
		[uvMode],
	);

	// ── Geometries ──────────────────────────────────────────
	const towerGeometry = useMemo(
		() =>
			new THREE.CylinderGeometry(
				TOWER_TOP_RADIUS,
				TOWER_BASE_RADIUS,
				TOWER_HEIGHT,
				12,
			),
		[],
	);

	const roofGeometry = useMemo(
		() => new THREE.ConeGeometry(ROOF_RADIUS, ROOF_HEIGHT, 12),
		[],
	);

	const hubGeometry = useMemo(
		() => new THREE.CylinderGeometry(HUB_RADIUS, HUB_RADIUS, HUB_DEPTH, 8),
		[],
	);

	const bladeGeometry = useMemo(() => {
		const shape = new THREE.Shape();
		shape.moveTo(-BLADE_HUB_WIDTH / 2, 0);
		shape.lineTo(-BLADE_TIP_WIDTH / 2, BLADE_LENGTH);
		shape.lineTo(BLADE_TIP_WIDTH / 2, BLADE_LENGTH);
		shape.lineTo(BLADE_HUB_WIDTH / 2, 0);
		shape.closePath();
		return new THREE.ExtrudeGeometry(shape, {
			depth: BLADE_THICKNESS,
			bevelEnabled: false,
		});
	}, []);

	// ── Geometry Disposal ───────────────────────────────────
	useEffect(() => {
		return () => {
			towerGeometry.dispose();
			roofGeometry.dispose();
			hubGeometry.dispose();
			bladeGeometry.dispose();
		};
	}, [towerGeometry, roofGeometry, hubGeometry, bladeGeometry]);

	// ── Blade Animation ─────────────────────────────────────
	useFrame((_state, delta) => {
		if (view !== "3d" || !bladeRef.current) return;
		bladeRef.current.rotation.y += ROTATION_SPEED * delta;
		invalidate();
	});

	// ── Positions ───────────────────────────────────────────
	const towerY = st + TOWER_HEIGHT / 2;
	const roofY = st + TOWER_HEIGHT + ROOF_HEIGHT / 2;
	const bladeAssemblyY = st + TOWER_HEIGHT * 0.85;
	const doorY = st + DOOR_HEIGHT / 2;

	return (
		<group>
			{/* Felt surface */}
			<mesh position={[0, st / 2, 0]} material={felt}>
				<boxGeometry args={[LANE_WIDTH, st, length - bt * 2]} />
			</mesh>

			{/* ── Windmill Obstacle ─────────────────────────── */}
			<group position={[0, 0, 0]}>
				{/* Tower body (tapered cylinder) */}
				<mesh
					castShadow
					geometry={towerGeometry}
					material={towerMaterial}
					position={[0, towerY, 0]}
				/>

				{/* Cone roof */}
				<mesh
					castShadow
					geometry={roofGeometry}
					material={roofMaterial}
					position={[0, roofY, 0]}
				/>

				{/* Door detail */}
				<mesh
					position={[0, doorY, TOWER_BASE_RADIUS + 0.001]}
					material={doorMaterial}
				>
					<planeGeometry args={[DOOR_WIDTH, DOOR_HEIGHT]} />
				</mesh>

				{/* Blade assembly (rotating group) */}
				<group
					ref={bladeRef}
					position={[0, bladeAssemblyY, -TOWER_TOP_RADIUS - HUB_DEPTH / 2]}
				>
					{/* Hub */}
					<mesh
						castShadow
						geometry={hubGeometry}
						material={towerMaterial}
						rotation={[Math.PI / 2, 0, 0]}
					/>

					{/* 4 blades at 90-degree intervals */}
					{[0, 1, 2, 3].map((i) => (
						<mesh
							castShadow
							key={i}
							geometry={bladeGeometry}
							material={bladeMaterial}
							position={[0, 0, -BLADE_THICKNESS / 2]}
							rotation={[0, 0, (i * Math.PI) / 2]}
						/>
					))}
				</group>
			</group>

			{/* ── Bumper Rails ──────────────────────────────── */}
			<BumperRail
				length={length}
				position={[-halfLaneW - bt / 2, st, -halfL]}
				material={bumper}
			/>
			<BumperRail
				length={length}
				position={[halfLaneW + bt / 2, st, -halfL]}
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
