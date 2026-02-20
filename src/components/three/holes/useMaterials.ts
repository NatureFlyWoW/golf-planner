import type * as THREE from "three";
import { useStore } from "../../../store";
import {
	bumperMaterial,
	cupMaterial,
	feltMaterial,
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

const planningMaterials: MaterialSet = {
	felt: feltMaterial,
	bumper: bumperMaterial,
	tee: teeMaterial,
	cup: cupMaterial,
};

const uvMaterials: MaterialSet = {
	felt: uvFeltMaterial,
	bumper: uvBumperMaterial,
	tee: uvTeeMaterial,
	cup: uvCupMaterial,
};

/** Returns the correct material set based on UV mode state. */
export function useMaterials(): MaterialSet {
	const uvMode = useStore((s) => s.ui.uvMode);
	return uvMode ? uvMaterials : planningMaterials;
}
