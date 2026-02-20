import { useMemo } from "react";
import * as THREE from "three";
import { HOLE_TYPE_MAP } from "../../constants";
import { useStore } from "../../store";
import type { HoleType } from "../../types";

const HOLE_HEIGHT = 0.3;
const GREEN = new THREE.Color("#4CAF50");
const RED = new THREE.Color("#EF5350");
const UV_GREEN = new THREE.Color("#00FF66");
const UV_RED = new THREE.Color("#FF3333");

type GhostHoleProps = {
	type: HoleType;
	position: { x: number; z: number };
	rotation: number;
	isValid: boolean;
};

export function GhostHole({
	type,
	position,
	rotation,
	isValid,
}: GhostHoleProps) {
	const uvMode = useStore((s) => s.ui.uvMode);
	const definition = HOLE_TYPE_MAP[type];
	const color = isValid ? (uvMode ? UV_GREEN : GREEN) : uvMode ? UV_RED : RED;
	const rotationRad = (rotation * Math.PI) / 180;

	const material = useMemo(
		() =>
			new THREE.MeshStandardMaterial({
				color,
				transparent: true,
				opacity: 0.4,
				depthWrite: false,
			}),
		[color],
	);

	if (!definition) return null;

	const { width, length } = definition.dimensions;

	return (
		<group
			position={[position.x, HOLE_HEIGHT / 2, position.z]}
			rotation={[0, rotationRad, 0]}
		>
			<mesh material={material}>
				<boxGeometry args={[width, HOLE_HEIGHT, length]} />
			</mesh>
		</group>
	);
}
