import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useStore } from "../../../store";
import type { MaterialProfile } from "../../../types/budget";
import { BUMPER_PBR, FELT_PBR } from "./materialPresets";
import {
	cupMaterial,
	teeMaterial,
	uvBumperMaterial,
	uvCupMaterial,
	uvFeltMaterial,
	uvTeeMaterial,
} from "./shared";

export type MaterialSet = {
	felt: THREE.MeshStandardMaterial;
	bumper: THREE.MeshStandardMaterial;
	tee: THREE.MeshStandardMaterial;
	cup: THREE.MeshStandardMaterial;
};

const uvMaterials: MaterialSet = {
	felt: uvFeltMaterial,
	bumper: uvBumperMaterial,
	tee: uvTeeMaterial,
	cup: uvCupMaterial,
};

export function useMaterials(): MaterialSet {
	const uvMode = useStore((s) => s.ui.uvMode);
	const materialProfile: MaterialProfile = useStore(
		(s) => s.budgetConfig.materialProfile,
	);

	const planningMaterials = useMemo(() => {
		const feltProps = FELT_PBR[materialProfile];
		const bumperProps = BUMPER_PBR[materialProfile];

		const felt = new THREE.MeshStandardMaterial({
			color: feltProps.color,
			roughness: feltProps.roughness,
			metalness: feltProps.metalness,
			polygonOffset: true,
			polygonOffsetFactor: -1,
		});

		const bumper = new THREE.MeshStandardMaterial({
			color: bumperProps.color,
			roughness: bumperProps.roughness,
			metalness: bumperProps.metalness,
		});

		return { felt, bumper, tee: teeMaterial, cup: cupMaterial };
	}, [materialProfile]);

	useEffect(() => {
		return () => {
			planningMaterials.felt.dispose();
			planningMaterials.bumper.dispose();
		};
	}, [planningMaterials]);

	return uvMode ? uvMaterials : planningMaterials;
}
