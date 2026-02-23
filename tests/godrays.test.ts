import { describe, expect, it } from "vitest";
import { UV_LAMP_POSITIONS } from "../src/constants/uvLamps";
import {
	GODRAYS_EFFECT_CONFIG,
	GODRAYS_SOURCE_CONFIG,
	GODRAYS_SOURCE_POSITIONS,
	shouldShowGodRays,
} from "../src/utils/godraysConfig";
import { getEffectsForTier } from "../src/utils/postprocessingConfig";

describe("GodRays gating", () => {
	it("renders when gpuTier=high AND uvMode=true", () => {
		expect(shouldShowGodRays({ gpuTier: "high", uvMode: true })).toBe(true);
	});

	it("does not render when gpuTier=mid even if uvMode=true", () => {
		expect(shouldShowGodRays({ gpuTier: "mid", uvMode: true })).toBe(false);
	});

	it("does not render when gpuTier=low even if uvMode=true", () => {
		expect(shouldShowGodRays({ gpuTier: "low", uvMode: true })).toBe(false);
	});

	it("does not render when uvMode=false even if gpuTier=high", () => {
		expect(shouldShowGodRays({ gpuTier: "high", uvMode: false })).toBe(false);
	});
});

describe("GodRays source mesh configuration", () => {
	it("has transparent=true", () => {
		expect(GODRAYS_SOURCE_CONFIG.transparent).toBe(true);
	});

	it("has depthWrite=false", () => {
		expect(GODRAYS_SOURCE_CONFIG.depthWrite).toBe(false);
	});

	it("has sphere radius of 0.1", () => {
		expect(GODRAYS_SOURCE_CONFIG.radius).toBe(0.1);
	});

	it("has emissiveColor matching UV lamp color", () => {
		expect(GODRAYS_SOURCE_CONFIG.emissiveColor).toBe("#8800FF");
	});
});

describe("GodRays source positions", () => {
	it("has 4 positions matching UV lamp positions", () => {
		expect(GODRAYS_SOURCE_POSITIONS).toHaveLength(4);
		expect(GODRAYS_SOURCE_POSITIONS).toEqual(UV_LAMP_POSITIONS);
	});

	it("positions are at ceiling height y=4.3", () => {
		for (const pos of GODRAYS_SOURCE_POSITIONS) {
			expect(pos[1]).toBe(4.3);
		}
	});
});

describe("GodRays ref wiring via getEffectsForTier", () => {
	it("excludes godRays when hasGodRaysRef=false", () => {
		expect(getEffectsForTier("high", { hasGodRaysRef: false })).not.toContain(
			"godRays",
		);
	});

	it("includes godRays when hasGodRaysRef=true on high tier", () => {
		expect(getEffectsForTier("high", { hasGodRaysRef: true })).toContain(
			"godRays",
		);
	});

	it("excludes godRays on mid tier even with hasGodRaysRef=true", () => {
		expect(getEffectsForTier("mid", { hasGodRaysRef: true })).not.toContain(
			"godRays",
		);
	});
});

describe("GodRays effect configuration", () => {
	it("samples is 30", () => {
		expect(GODRAYS_EFFECT_CONFIG.samples).toBe(30);
	});

	it("density is 0.96", () => {
		expect(GODRAYS_EFFECT_CONFIG.density).toBe(0.96);
	});

	it("decay is 0.9", () => {
		expect(GODRAYS_EFFECT_CONFIG.decay).toBe(0.9);
	});

	it("weight is 0.4", () => {
		expect(GODRAYS_EFFECT_CONFIG.weight).toBe(0.4);
	});

	it("blur is true", () => {
		expect(GODRAYS_EFFECT_CONFIG.blur).toBe(true);
	});
});
