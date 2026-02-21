import { useEffect, useMemo } from "react";
import type * as THREE from "three";
import { createCornerFilletGeometry } from "../../../utils/filletGeometry";

type CornerFilletProps = {
	position: [number, number, number];
	rotation?: [number, number, number];
	radius: number;
	height: number;
	material: THREE.MeshStandardMaterial;
};

export function CornerFillet({
	position,
	rotation,
	radius,
	height,
	material,
}: CornerFilletProps) {
	const geometry = useMemo(
		() => createCornerFilletGeometry(radius, height),
		[radius, height],
	);

	useEffect(() => {
		return () => {
			geometry.dispose();
		};
	}, [geometry]);

	return (
		<mesh
			geometry={geometry}
			material={material}
			position={position}
			rotation={rotation}
		/>
	);
}
