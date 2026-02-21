import type * as THREE from "three";
import type { TextureMapSet } from "../utils/textureGating";

export type MaterialSet = {
	felt: THREE.MeshStandardMaterial;
	bumper: THREE.MeshStandardMaterial;
	tee: THREE.MeshStandardMaterial;
	cup: THREE.MeshStandardMaterial;
	textureMapSet: TextureMapSet;
	isTopDown: boolean;
};
