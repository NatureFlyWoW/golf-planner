import { useContext, useEffect, useMemo } from "react";
import * as THREE from "three";
import { useStore } from "../../../store";
import type { MaterialProfile } from "../../../types/budget";
import type { MaterialSet } from "../../../types/materials";
import { getTextureMapSet } from "../../../utils/textureGating";
import { BUMPER_PBR, FELT_PBR } from "./materialPresets";
import {
	cupMaterial,
	teeMaterial,
	uvBumperMaterial,
	uvCupMaterial,
	uvFeltMaterial,
	uvTeeMaterial,
} from "./shared";
import { TexturedMaterialsContext } from "./useTexturedMaterials";

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

	// Check if textured materials are provided via context (from TexturedMaterialsProvider)
	const texturedMaterials = useContext(TexturedMaterialsContext);

	const isTopDown = view === "top";
	const textureMapSet = useMemo(
		() => getTextureMapSet(gpuTier, isTopDown),
		[gpuTier, isTopDown],
	);

	const planningMaterials = useMemo(() => {
		// Skip creating flat materials if textured context is available
		if (texturedMaterials) return null;

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
	}, [materialProfile, texturedMaterials]);

	useEffect(() => {
		return () => {
			planningMaterials?.felt.dispose();
			planningMaterials?.bumper.dispose();
		};
	}, [planningMaterials]);

	// Priority: UV mode > textured context > flat planning materials
	if (uvMode) {
		return { ...uvMaterials, textureMapSet, isTopDown };
	}
	if (texturedMaterials) {
		return texturedMaterials;
	}
	return { ...planningMaterials!, textureMapSet, isTopDown };
}
