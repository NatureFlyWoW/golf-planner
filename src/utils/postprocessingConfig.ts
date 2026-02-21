import type { GpuTier } from "../types/ui";

export type { GpuTier };

export type EffectOptions = {
	hasGodRaysRef?: boolean;
};

/**
 * Returns the list of postprocessing effect names active for a given GPU tier.
 * Always-on: bloom, vignette, toneMapping.
 * Mid+: chromaticAberration.
 * High only: n8ao, godRays (when lamp ref is available).
 */
export function getEffectsForTier(
	tier: GpuTier,
	options?: EffectOptions,
): string[] {
	const effects: string[] = ["bloom", "vignette", "toneMapping"];

	if (tier === "mid" || tier === "high") {
		effects.push("chromaticAberration");
	}

	if (tier === "high") {
		effects.push("n8ao");
		if (options?.hasGodRaysRef) {
			effects.push("godRays");
		}
	}

	return effects;
}

/**
 * Returns true when Sparkles should render (mid+ tier, UV mode active).
 */
export function shouldShowSparkles(state: {
	gpuTier: GpuTier;
	uvMode: boolean;
}): boolean {
	return state.uvMode && state.gpuTier !== "low";
}

export const BLOOM_CONFIG = {
	luminanceThreshold: 0.8,
	luminanceSmoothing: 0.4,
	intensity: { mobile: 0.7, desktop: 1.0 },
} as const;

export const EFFECT_COMPOSER_CONFIG = {
	multisampling: 0,
} as const;
