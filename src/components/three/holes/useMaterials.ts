import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useStore } from "../../../store";
import type { MaterialProfile } from "../../../types/budget";
import {
	getTextureMapSet,
	type TextureMapSet,
} from "../../../utils/textureGating";
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
	textureMapSet: TextureMapSet;
	isTopDown: boolean;
};

const uvMaterials: MaterialSet = {
	felt: uvFeltMaterial,
	bumper: uvBumperMaterial,
	tee: uvTeeMaterial,
	cup: uvCupMaterial,
};

export function useMaterials(): MaterialSet {
	const uvMode = useStore((s) => s.ui.uvMode);
	const view = useStore((s) => s.ui.view);
	const gpuTier = useStore((s) => s.ui.gpuTier);
	const materialProfile: MaterialProfile = useStore(
		(s) => s.budgetConfig.materialProfile,
	);

	const isTopDown = view === "top";
	const textureMapSet = useMemo(
		() => getTextureMapSet(gpuTier, isTopDown),
		[gpuTier, isTopDown],
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

	const baseMaterials = uvMode ? uvMaterials : planningMaterials;
	return { ...baseMaterials, textureMapSet, isTopDown };
}
