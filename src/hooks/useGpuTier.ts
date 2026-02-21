import { getGPUTier } from "@pmndrs/detect-gpu";
import { useEffect } from "react";
import { useStore } from "../store";
import type { GpuTier, GpuTierOverride } from "../types/ui";

export const GPU_TIER_CACHE_KEY = "golf-planner-gpu-tier";

/** Maps detect-gpu tier (0-3) to app tier (low/mid/high). */
export function mapDetectGpuToAppTier(tier: number): GpuTier {
	if (tier == null || tier <= 1) return "low";
	if (tier === 2) return "mid";
	return "high";
}

/** Resolves effective tier from override preference + detected tier. */
export function resolveGpuTier(
	override: GpuTierOverride,
	detected: GpuTier,
): GpuTier {
	return override === "auto" ? detected : override;
}

/** Reads cached GPU tier from localStorage. */
export function readCachedTier(): GpuTier | null {
	try {
		const cached = localStorage.getItem(GPU_TIER_CACHE_KEY);
		if (cached === "low" || cached === "mid" || cached === "high")
			return cached;
	} catch {
		// localStorage unavailable (SSR, privacy mode)
	}
	return null;
}

/** Writes GPU tier to localStorage cache. */
export function writeCachedTier(tier: GpuTier): void {
	try {
		localStorage.setItem(GPU_TIER_CACHE_KEY, tier);
	} catch {
		// localStorage unavailable
	}
}

/**
 * Determines whether the R3F Canvas needs frameloop="always".
 * true when: transitioning, or uvMode active with mid/high tier effects.
 */
export function needsAlwaysFrameloop(
	uvMode: boolean,
	gpuTier: GpuTier,
	transitioning: boolean,
): boolean {
	if (transitioning) return true;
	if (uvMode && gpuTier !== "low") return true;
	return false;
}

/**
 * React hook: runs GPU detection on mount and writes tier to store.
 * Call once at app level (App.tsx). The Builder reads gpuTier from the
 * shared Zustand store — it does NOT re-detect.
 */
export function useGpuTier(): void {
	const gpuTierOverride = useStore((s) => s.gpuTierOverride);
	const setGpuTier = useStore((s) => s.setGpuTier);

	useEffect(() => {
		// If override is set, use it directly
		if (gpuTierOverride !== "auto") {
			setGpuTier(gpuTierOverride);
			return;
		}

		// Check localStorage cache
		const cached = readCachedTier();
		if (cached) {
			setGpuTier(cached);
			return;
		}

		// Async detection — gpuTier stays at "low" (safe default) until complete
		let cancelled = false;
		getGPUTier()
			.then((result) => {
				if (cancelled) return;
				const detected = mapDetectGpuToAppTier(result.tier);
				writeCachedTier(detected);
				setGpuTier(detected);
			})
			.catch(() => {
				// Detection failed (no WebGL, etc.) — gpuTier stays at "low" default
			});

		return () => {
			cancelled = true;
		};
	}, [gpuTierOverride, setGpuTier]);
}
