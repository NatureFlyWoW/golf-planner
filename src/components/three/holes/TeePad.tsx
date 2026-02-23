import { useEffect, useMemo } from "react";
import type * as THREE from "three";
import { createTeeGeometry } from "../../../utils/holeGeometry";
import { SURFACE_THICKNESS, TEE_RADIUS } from "./shared";

type TeePadProps = {
	position: [number, number, number];
	material: THREE.MeshStandardMaterial;
};

export function TeePad({ position, material }: TeePadProps) {
	const geom = useMemo(() => createTeeGeometry(TEE_RADIUS), []);

	useEffect(() => {
		return () => {
			geom.dispose();
		};
	}, [geom]);

	const [px, , pz] = position;

	return (
		<mesh
			geometry={geom}
			material={material}
			position={[px, SURFACE_THICKNESS + 0.0015, pz]}
		/>
	);
}
