import { useEffect, useMemo } from "react";
import type * as THREE from "three";
import {
	createBumperGeometry,
	createBumperProfile,
} from "../../../utils/bumperProfile";
import { BUMPER_HEIGHT, BUMPER_THICKNESS } from "./shared";

const BEVEL_RADIUS = 0.008;

type BumperRailProps = {
	length: number;
	position: [number, number, number];
	rotation?: [number, number, number];
	height?: number;
	thickness?: number;
	material: THREE.MeshStandardMaterial;
};

export function BumperRail({
	length,
	position,
	rotation,
	height = BUMPER_HEIGHT,
	thickness = BUMPER_THICKNESS,
	material,
}: BumperRailProps) {
	const geom = useMemo(() => {
		const profile = createBumperProfile(height, thickness, BEVEL_RADIUS);
		return createBumperGeometry(profile, length);
	}, [length, height, thickness]);

	useEffect(() => {
		return () => {
			geom.dispose();
		};
	}, [geom]);

	return (
		<mesh
			castShadow
			geometry={geom}
			material={material}
			position={position}
			rotation={rotation}
		/>
	);
}
