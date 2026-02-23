import { useEffect } from "react";
import type { Group, Material, Mesh } from "three";

/**
 * Imperatively applies opacity to all mesh materials in a Three.js group.
 * Stores original values and restores them on cleanup or when opacity returns to 1.
 */

const originals = new WeakMap<
	Material,
	{ transparent: boolean; opacity: number }
>();

function storeOriginal(mat: Material) {
	if (!originals.has(mat)) {
		originals.set(mat, {
			transparent: mat.transparent,
			opacity: mat.opacity,
		});
	}
}

function restoreOriginal(mat: Material) {
	const orig = originals.get(mat);
	if (orig) {
		mat.transparent = orig.transparent;
		mat.opacity = orig.opacity;
		mat.needsUpdate = true;
	}
}

export function useGroupOpacity(
	groupRef: React.RefObject<Group | null>,
	opacity: number,
) {
	useEffect(() => {
		const group = groupRef.current;
		if (!group) return;

		const needsTransparency = opacity < 1;
		const affected: Material[] = [];

		group.traverse((child) => {
			if ((child as Mesh).isMesh) {
				const mesh = child as Mesh;
				const materials = Array.isArray(mesh.material)
					? mesh.material
					: [mesh.material];
				for (const mat of materials) {
					if (mat && "opacity" in mat) {
						storeOriginal(mat as Material);
						(mat as Material).transparent = needsTransparency;
						(mat as Material).opacity = opacity;
						(mat as Material).needsUpdate = true;
						affected.push(mat as Material);
					}
				}
			}
		});

		return () => {
			for (const mat of affected) {
				restoreOriginal(mat);
			}
		};
	}, [opacity]); // groupRef is a stable ref — not needed in deps
}
