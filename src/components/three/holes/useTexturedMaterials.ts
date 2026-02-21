import { useTexture } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useStore } from "../../../store";
import type { MaterialProfile } from "../../../types/budget";
import type { GpuTier } from "../../../types/ui";
import { BUMPER_PBR, FELT_PBR } from "./materialPresets";
import { cupMaterial, teeMaterial } from "./shared";
import type { MaterialSet } from "./useMaterials";

/** Surface types that have texture assets */
export type TextureSurface = "felt" | "wood" | "rubber";

/**
 * Whether textures should be loaded for this GPU tier.
 * Low tier = no textures (flat-color fallback).
 */
export function shouldLoadTextures(tier: GpuTier): boolean {
	return tier !== "low";
}

/**
 * Returns array of texture file paths to load for a given surface and GPU tier.
 * High: [color, normal, roughness]
 * Mid: [color, normal] (no roughness)
 * Low: [] (empty)
 */
export function getTexturePathsForTier(
	tier: GpuTier,
	surface: TextureSurface,
): string[] {
	if (tier === "low") return [];

	const base = `/textures/${surface}`;

	// Rubber has no color map (uses material color)
	if (surface === "rubber") {
		const paths = [`${base}/normal.jpg`, `${base}/roughness.jpg`];
		if (tier === "mid") return [paths[0]]; // normal only
		return paths; // high: normal + roughness
	}

	const paths = [`${base}/color.jpg`, `${base}/normal.jpg`];
	if (tier === "high") {
		paths.push(`${base}/roughness.jpg`);
	}
	return paths;
}

function configureTexture(
	texture: THREE.Texture,
	repeatX: number,
	repeatY: number,
): void {
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;
	texture.repeat.set(repeatX, repeatY);
}

/**
 * React hook that returns a MaterialSet with PBR texture maps applied.
 * Must be called inside a Suspense boundary.
 */
export function useTexturedMaterials(): MaterialSet {
	const gpuTier = useStore((s) => s.ui.gpuTier);
	const materialProfile: MaterialProfile = useStore(
		(s) => s.budgetConfig.materialProfile,
	);

	// Load felt textures
	const feltPaths = getTexturePathsForTier(gpuTier, "felt");
	const feltTextures = useTexture(
		feltPaths.length > 0 ? feltPaths : ["/textures/felt/color.jpg"],
	);

	// Load wood textures
	const woodPaths = getTexturePathsForTier(gpuTier, "wood");
	const woodTextures = useTexture(
		woodPaths.length > 0 ? woodPaths : ["/textures/wood/color.jpg"],
	);

	const materials = useMemo(() => {
		const feltProps = FELT_PBR[materialProfile];
		const bumperProps = BUMPER_PBR[materialProfile];

		// Configure felt textures
		const feltArr = Array.isArray(feltTextures) ? feltTextures : [feltTextures];
		for (const tex of feltArr) {
			configureTexture(tex, 2, 2);
		}

		const felt = new THREE.MeshStandardMaterial({
			color: feltProps.color,
			roughness: feltProps.roughness,
			metalness: feltProps.metalness,
			map: feltArr[0] ?? null,
			normalMap: feltArr[1] ?? null,
			roughnessMap: feltArr[2] ?? null,
			polygonOffset: true,
			polygonOffsetFactor: -1,
		});

		// Configure wood textures
		const woodArr = Array.isArray(woodTextures) ? woodTextures : [woodTextures];
		for (const tex of woodArr) {
			configureTexture(tex, 1, 4);
		}

		const bumper = new THREE.MeshStandardMaterial({
			color: bumperProps.color,
			roughness: bumperProps.roughness,
			metalness: bumperProps.metalness,
			map: woodArr[0] ?? null,
			normalMap: woodArr[1] ?? null,
			roughnessMap: woodArr[2] ?? null,
		});

		return { felt, bumper, tee: teeMaterial, cup: cupMaterial };
	}, [materialProfile, feltTextures, woodTextures]);

	useEffect(() => {
		return () => {
			materials.felt.dispose();
			materials.bumper.dispose();
		};
	}, [materials]);

	return materials;
}

// Preload critical textures
useTexture.preload("/textures/felt/color.jpg");
useTexture.preload("/textures/felt/normal.jpg");
useTexture.preload("/textures/wood/color.jpg");
useTexture.preload("/textures/wood/normal.jpg");
