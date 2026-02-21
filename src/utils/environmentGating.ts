import type { GpuTier, ViewMode } from "../types/ui";

/**
 * Fog should only render in UV mode AND 3D perspective view.
 * Exponential fog in orthographic view creates uniform darkening
 * with no atmospheric value.
 */
export function shouldEnableFog(uvMode: boolean, view: ViewMode): boolean {
	return uvMode && view === "3d";
}

/**
 * Derive the Canvas frameloop mode from current state.
 * "always" when UV effects need continuous rendering or during transitions.
 * Low-tier GPUs always use "demand" in UV mode (static effects only).
 */
export function deriveFrameloop(
	uvMode: boolean,
	gpuTier: GpuTier,
	transitioning: boolean,
): "always" | "demand" {
	const needsAlways = transitioning || (uvMode && gpuTier !== "low");
	return needsAlways ? "always" : "demand";
}

/**
 * SoftShadows (PCSS) only on mid+ tier GPUs — too expensive for low-tier.
 */
export function shouldEnableSoftShadows(gpuTier: GpuTier): boolean {
	return gpuTier === "mid" || gpuTier === "high";
}

/**
 * Shadow type: mobile gets basic boolean shadows (cheaper),
 * desktop gets "soft" (PCSS) when GPU tier allows it.
 */
export function getShadowType(gpuTier: GpuTier, mobile: boolean): true | "soft" {
	return shouldEnableSoftShadows(gpuTier) && !mobile ? "soft" : true;
}
