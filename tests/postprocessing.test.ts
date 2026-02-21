import { describe, expect, it } from "vitest";
import { UV_EMISSIVE_INTENSITY } from "../src/components/three/holes/materialPresets";
import {
	BLOOM_CONFIG,
	EFFECT_COMPOSER_CONFIG,
	getEffectsForTier,
	shouldShowSparkles,
} from "../src/utils/postprocessingConfig";

describe("PostProcessing effect stack", () => {
	it("includes Bloom at all tiers", () => {
		expect(getEffectsForTier("low")).toContain("bloom");
		expect(getEffectsForTier("mid")).toContain("bloom");
		expect(getEffectsForTier("high")).toContain("bloom");
	});

	it("includes Vignette at all tiers", () => {
		expect(getEffectsForTier("low")).toContain("vignette");
		expect(getEffectsForTier("mid")).toContain("vignette");
		expect(getEffectsForTier("high")).toContain("vignette");
	});

	it("includes ToneMapping at all tiers", () => {
		expect(getEffectsForTier("low")).toContain("toneMapping");
		expect(getEffectsForTier("mid")).toContain("toneMapping");
		expect(getEffectsForTier("high")).toContain("toneMapping");
	});

	it("includes ChromaticAberration at mid+ only", () => {
		expect(getEffectsForTier("low")).not.toContain("chromaticAberration");
		expect(getEffectsForTier("mid")).toContain("chromaticAberration");
		expect(getEffectsForTier("high")).toContain("chromaticAberration");
	});

	it("includes N8AO at high only", () => {
		expect(getEffectsForTier("low")).not.toContain("n8ao");
		expect(getEffectsForTier("mid")).not.toContain("n8ao");
		expect(getEffectsForTier("high")).toContain("n8ao");
	});

	it("includes GodRays at high only when lampRef available", () => {
		expect(getEffectsForTier("high", { hasGodRaysRef: true })).toContain(
			"godRays",
		);
		expect(getEffectsForTier("high", { hasGodRaysRef: false })).not.toContain(
			"godRays",
		);
		expect(getEffectsForTier("mid", { hasGodRaysRef: true })).not.toContain(
			"godRays",
		);
	});
});

describe("Sparkles gating", () => {
	it("enabled for mid tier + uvMode", () => {
		expect(shouldShowSparkles({ gpuTier: "mid", uvMode: true })).toBe(true);
	});

	it("enabled for high tier + uvMode", () => {
		expect(shouldShowSparkles({ gpuTier: "high", uvMode: true })).toBe(true);
	});

	it("disabled for low tier", () => {
		expect(shouldShowSparkles({ gpuTier: "low", uvMode: true })).toBe(false);
	});

	it("disabled when uvMode=false", () => {
		expect(shouldShowSparkles({ gpuTier: "mid", uvMode: false })).toBe(false);
		expect(shouldShowSparkles({ gpuTier: "high", uvMode: false })).toBe(false);
	});
});

describe("Bloom and emissive configuration", () => {
	it("bloom luminanceThreshold is 0.8", () => {
		expect(BLOOM_CONFIG.luminanceThreshold).toBe(0.8);
	});

	it("UV_EMISSIVE_INTENSITY constant is 2.0", () => {
		expect(UV_EMISSIVE_INTENSITY).toBe(2.0);
	});

	it("EffectComposer multisampling is 0", () => {
		expect(EFFECT_COMPOSER_CONFIG.multisampling).toBe(0);
	});
});
