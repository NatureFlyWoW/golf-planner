import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useStore } from "../../../store";
import {
	createBumperGeometry,
	createBumperProfile,
} from "../../../utils/bumperProfile";
import {
	CUP_DEPTH,
	createCupGeometry,
	createFlagPinGeometry,
	createTeeGeometry,
	FLAG_PIN_HEIGHT,
} from "../../../utils/holeGeometry";
import {
	BUMPER_HEIGHT,
	BUMPER_THICKNESS,
	CUP_RADIUS,
	SURFACE_THICKNESS,
	TEE_RADIUS,
} from "./shared";
import { useTexturedMaterials } from "./useTexturedMaterials";

type Props = { width: number; length: number };

const BEVEL_RADIUS = 0.008;
const FLAG_COLOR = "#FF1744";

export function HoleStraightTextured({ width, length }: Props) {
	const { felt, bumper, tee, cup } = useTexturedMaterials();
	const view = useStore((s) => s.ui.view);

	const halfW = width / 2;
	const halfL = length / 2;
	const laneW = width - BUMPER_THICKNESS * 2;
	const laneL = length - BUMPER_THICKNESS * 2;

	// Create bumper profile and geometries
	const bumperProfile = useMemo(
		() => createBumperProfile(BUMPER_HEIGHT, BUMPER_THICKNESS, BEVEL_RADIUS),
		[],
	);

	const leftRightGeom = useMemo(
		() => createBumperGeometry(bumperProfile, length),
		[bumperProfile, length],
	);

	const frontBackGeom = useMemo(
		() => createBumperGeometry(bumperProfile, laneW),
		[bumperProfile, laneW],
	);

	const cupGeom = useMemo(() => createCupGeometry(CUP_RADIUS), []);
	const teeGeom = useMemo(() => createTeeGeometry(TEE_RADIUS), []);
	const flagPinGeom = useMemo(() => createFlagPinGeometry(), []);

	// Flag cloth geometry
	const flagClothGeom = useMemo(() => new THREE.PlaneGeometry(0.03, 0.02), []);

	// Flag pin material (white/metallic)
	const flagPinMat = useMemo(
		() =>
			new THREE.MeshStandardMaterial({
				color: "#E0E0E0",
				metalness: 0.8,
				roughness: 0.2,
			}),
		[],
	);

	// Flag cloth material
	const flagClothMat = useMemo(
		() =>
			new THREE.MeshStandardMaterial({
				color: FLAG_COLOR,
				side: THREE.DoubleSide,
			}),
		[],
	);

	useEffect(() => {
		return () => {
			leftRightGeom.dispose();
			frontBackGeom.dispose();
			cupGeom.dispose();
			teeGeom.dispose();
			flagPinGeom.dispose();
			flagClothGeom.dispose();
			flagPinMat.dispose();
			flagClothMat.dispose();
		};
	}, [
		leftRightGeom,
		frontBackGeom,
		cupGeom,
		teeGeom,
		flagPinGeom,
		flagClothGeom,
		flagPinMat,
		flagClothMat,
	]);

	return (
		<group>
			{/* Green felt surface */}
			<mesh position={[0, SURFACE_THICKNESS / 2, 0]} material={felt}>
				<boxGeometry args={[laneW, SURFACE_THICKNESS, laneL]} />
			</mesh>

			{/* Left bumper — extrusion along Z, centered at -halfW */}
			<mesh
				castShadow
				geometry={leftRightGeom}
				material={bumper}
				position={[-halfW + BUMPER_THICKNESS / 2, SURFACE_THICKNESS, -halfL]}
			/>

			{/* Right bumper */}
			<mesh
				castShadow
				geometry={leftRightGeom}
				material={bumper}
				position={[halfW - BUMPER_THICKNESS / 2, SURFACE_THICKNESS, -halfL]}
			/>

			{/* Back bumper (-Z) — rotated 90° around Y */}
			<mesh
				castShadow
				geometry={frontBackGeom}
				material={bumper}
				position={[
					-laneW / 2,
					SURFACE_THICKNESS,
					-halfL + BUMPER_THICKNESS / 2,
				]}
				rotation={[0, -Math.PI / 2, 0]}
			/>

			{/* Front bumper (+Z) */}
			<mesh
				castShadow
				geometry={frontBackGeom}
				material={bumper}
				position={[-laneW / 2, SURFACE_THICKNESS, halfL - BUMPER_THICKNESS / 2]}
				rotation={[0, -Math.PI / 2, 0]}
			/>

			{/* Recessed cup */}
			<mesh
				geometry={cupGeom}
				material={cup}
				position={[0, SURFACE_THICKNESS - CUP_DEPTH / 2, halfL - 0.15]}
			/>

			{/* Tee pad */}
			<mesh
				geometry={teeGeom}
				material={tee}
				position={[0, SURFACE_THICKNESS + 0.0015, -halfL + 0.15]}
			/>

			{/* Flag pin — only visible in 3D view */}
			{view !== "top" && (
				<group
					position={[0, SURFACE_THICKNESS + FLAG_PIN_HEIGHT / 2, halfL - 0.15]}
				>
					<mesh geometry={flagPinGeom} material={flagPinMat} />
					<mesh
						geometry={flagClothGeom}
						material={flagClothMat}
						position={[0.015, FLAG_PIN_HEIGHT / 2 - 0.015, 0]}
					/>
				</group>
			)}
		</group>
	);
}
