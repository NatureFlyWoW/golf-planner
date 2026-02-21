import { UV_LAMP_POSITIONS } from "../constants/uvLamps";
import type { GpuTier } from "../types/ui";

/** GodRays only render on high-tier GPUs in UV mode. */
export function shouldShowGodRays(state: {
	gpuTier: GpuTier;
	uvMode: boolean;
}): boolean {
	return state.gpuTier === "high" && state.uvMode;
}

export const GODRAYS_SOURCE_CONFIG = {
	radius: 0.1,
	transparent: true,
	depthWrite: false,
	emissiveColor: "#8800FF",
} as const;

/** Co-located with UV lamp ceiling positions from constants/uvLamps.ts */
export const GODRAYS_SOURCE_POSITIONS = UV_LAMP_POSITIONS;

export const GODRAYS_EFFECT_CONFIG = {
	samples: 30,
	density: 0.96,
	decay: 0.9,
	weight: 0.4,
	blur: true,
} as const;
