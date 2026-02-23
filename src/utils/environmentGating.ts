import type { GpuTier } from "../types/ui";
import type { ViewportLayout } from "../types/viewport";

/**
 * Fog is scene-level (shared between Views) — cannot be scoped to one View.
 * Only enable in "3d-only" mode (fullscreen 3D pane) when UV mode is active.
 * In "dual" mode, fog would bleed into the 2D pane since both Views share one scene.
 */
export function shouldEnableFog(
	uvMode: boolean,
	viewportLayout: ViewportLayout,
): boolean {
	if (viewportLayout !== "3d-only") return false;
	return uvMode;
}

/**
 * Derive the Canvas frameloop mode from current state.
 * "always" when UV effects need continuous rendering, during transitions,
 * or in dual-pane mode (View rendering requires continuous frames).
 * Low-tier GPUs always use "demand" in UV mode (static effects only).
 */
export function deriveFrameloop(
	uvMode: boolean,
	gpuTier: GpuTier,
	transitioning: boolean,
	viewportLayout: ViewportLayout,
	walkthroughMode: boolean,
): "always" | "demand" {
	// Walkthrough always needs continuous rendering (FPS camera)
	if (walkthroughMode) return "always";

	// Transitioning always needs continuous rendering
	if (transitioning) return "always";

	// Dual mode: View rendering requires continuous frames
	if (viewportLayout === "dual") return "always";

	// 2d-only mode: no 3D animations, use demand
	if (viewportLayout === "2d-only") return "demand";

	// 3d-only mode: UV effects with capable GPU need "always"
	if (uvMode && gpuTier !== "low") return "always";

	return "demand";
}

/**
 * PostProcessing (EffectComposer) cannot be scoped to a single View —
 * it takes over the entire Canvas rendering pipeline.
 * Only enable when the 3D pane is fullscreen (no View splitting).
 */
export function shouldEnablePostProcessing(
	viewportLayout: ViewportLayout,
): boolean {
	return viewportLayout === "3d-only";
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
export function getShadowType(
	gpuTier: GpuTier,
	mobile: boolean,
): true | "soft" {
	return shouldEnableSoftShadows(gpuTier) && !mobile ? "soft" : true;
}

/**
 * Ground texture: only load on mid+ GPU tiers.
 * Low tier uses flat gray meshBasicMaterial (no texture maps).
 * Mid tier: color map only.
 * High tier: color + normal + roughness maps.
 */
export function shouldShowGroundTexture(gpuTier: GpuTier): boolean {
	return gpuTier === "mid" || gpuTier === "high";
}
