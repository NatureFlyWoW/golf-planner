import type { GpuTier } from "../types/ui";

export type TextureMapSet = {
	color: boolean;
	normal: boolean;
	roughness: boolean;
};

/**
 * Determines which texture maps to load based on GPU tier.
 * When isTopDown is true, normal and roughness maps are skipped
 * (not visible from orthographic top-down view).
 *
 * - high: color + normal + roughness
 * - mid: color + normal (no roughness)
 * - low: no textures
 */
export function getTextureMapSet(
	gpuTier: GpuTier,
	isTopDown = false,
): TextureMapSet {
	if (gpuTier === "low") {
		return { color: false, normal: false, roughness: false };
	}
	if (isTopDown) {
		return { color: true, normal: false, roughness: false };
	}
	if (gpuTier === "mid") {
		return { color: true, normal: true, roughness: false };
	}
	return { color: true, normal: true, roughness: true };
}
