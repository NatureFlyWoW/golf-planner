import { describe, expect, it } from "vitest";
import {
	deriveFrameloop,
	shouldEnableFog,
	shouldEnablePostProcessing,
	shouldEnableSoftShadows,
	shouldShowGroundTexture,
} from "../../src/utils/environmentGating";

describe("shouldEnableFog (with viewportLayout)", () => {
	it('returns false when viewportLayout is "2d-only" regardless of uvMode', () => {
		expect(shouldEnableFog(true, "2d-only")).toBe(false);
		expect(shouldEnableFog(false, "2d-only")).toBe(false);
	});

	it('returns false when viewportLayout is "dual" (fog is scene-level, shared between Views)', () => {
		expect(shouldEnableFog(true, "dual")).toBe(false);
		expect(shouldEnableFog(false, "dual")).toBe(false);
	});

	it('returns true when uvMode=true AND viewportLayout is "3d-only"', () => {
		expect(shouldEnableFog(true, "3d-only")).toBe(true);
	});

	it('returns false when uvMode=false AND viewportLayout is "3d-only"', () => {
		expect(shouldEnableFog(false, "3d-only")).toBe(false);
	});
});

describe("deriveFrameloop (with viewportLayout)", () => {
	it('returns "always" when viewportLayout="dual" (View rendering requires continuous frames)', () => {
		expect(deriveFrameloop(false, "low", false, "dual", false)).toBe(
			"always",
		);
		expect(deriveFrameloop(false, "mid", false, "dual", false)).toBe(
			"always",
		);
	});

	it('returns "demand" when uvMode=false AND viewportLayout="3d-only"', () => {
		expect(deriveFrameloop(false, "low", false, "3d-only", false)).toBe(
			"demand",
		);
	});

	it('returns "demand" when uvMode=true + gpuTier="low" AND viewportLayout="3d-only"', () => {
		expect(deriveFrameloop(true, "low", false, "3d-only", false)).toBe(
			"demand",
		);
	});

	it('returns "always" when uvMode=true + gpuTier="mid" AND viewportLayout="3d-only"', () => {
		expect(deriveFrameloop(true, "mid", false, "3d-only", false)).toBe(
			"always",
		);
	});

	it('returns "always" when uvMode=true + gpuTier="high" AND viewportLayout="3d-only"', () => {
		expect(deriveFrameloop(true, "high", false, "3d-only", false)).toBe(
			"always",
		);
	});

	it('returns "always" when transitioning=true regardless of viewportLayout', () => {
		expect(deriveFrameloop(false, "low", true, "3d-only", false)).toBe(
			"always",
		);
		expect(deriveFrameloop(false, "mid", true, "dual", false)).toBe(
			"always",
		);
		expect(deriveFrameloop(false, "high", true, "2d-only", false)).toBe(
			"always",
		);
	});

	it('returns "demand" when viewportLayout="2d-only" and not transitioning', () => {
		expect(deriveFrameloop(false, "mid", false, "2d-only", false)).toBe(
			"demand",
		);
		expect(deriveFrameloop(true, "high", false, "2d-only", false)).toBe(
			"demand",
		);
	});
});

describe("deriveFrameloop with walkthroughMode", () => {
	it('returns "always" when walkthroughMode=true, regardless of other params', () => {
		expect(deriveFrameloop(false, "low", false, "3d-only", true)).toBe(
			"always",
		);
	});

	it('walkthroughMode=true + uvMode=false + gpuTier="low" + viewportLayout="3d-only" → "always"', () => {
		expect(deriveFrameloop(false, "low", false, "3d-only", true)).toBe(
			"always",
		);
	});

	it('walkthroughMode=true + uvMode=true + gpuTier="high" + viewportLayout="3d-only" → "always"', () => {
		expect(deriveFrameloop(true, "high", false, "3d-only", true)).toBe(
			"always",
		);
	});

	it('walkthroughMode=true + transitioning=false + viewportLayout="2d-only" → "always"', () => {
		expect(deriveFrameloop(false, "mid", false, "2d-only", true)).toBe(
			"always",
		);
	});

	it('walkthroughMode=false preserves existing behavior: dual → "always"', () => {
		expect(deriveFrameloop(false, "mid", false, "dual", false)).toBe(
			"always",
		);
	});

	it('walkthroughMode=false preserves existing behavior: 3d-only + low GPU → "demand"', () => {
		expect(deriveFrameloop(false, "low", false, "3d-only", false)).toBe(
			"demand",
		);
	});
});

describe("shouldEnablePostProcessing", () => {
	it('returns false when viewportLayout is "dual"', () => {
		expect(shouldEnablePostProcessing("dual")).toBe(false);
	});

	it('returns true when viewportLayout is "3d-only"', () => {
		expect(shouldEnablePostProcessing("3d-only")).toBe(true);
	});

	it('returns false when viewportLayout is "2d-only"', () => {
		expect(shouldEnablePostProcessing("2d-only")).toBe(false);
	});
});

describe("shouldEnableSoftShadows", () => {
	it("returns true for mid tier", () => {
		expect(shouldEnableSoftShadows("mid")).toBe(true);
	});

	it("returns true for high tier", () => {
		expect(shouldEnableSoftShadows("high")).toBe(true);
	});

	it("returns false for low tier", () => {
		expect(shouldEnableSoftShadows("low")).toBe(false);
	});
});

describe("shouldShowGroundTexture", () => {
	it('returns false for "low" GPU tier', () => {
		expect(shouldShowGroundTexture("low")).toBe(false);
	});

	it('returns true for "mid" GPU tier', () => {
		expect(shouldShowGroundTexture("mid")).toBe(true);
	});

	it('returns true for "high" GPU tier', () => {
		expect(shouldShowGroundTexture("high")).toBe(true);
	});
});
