import { describe, expect, it } from "vitest";
import {
	deriveFrameloop,
	shouldEnableFog,
	shouldEnableSoftShadows,
} from "../../src/utils/environmentGating";

describe("shouldEnableFog", () => {
	it("returns true when uvMode=true AND view='3d'", () => {
		expect(shouldEnableFog(true, "3d")).toBe(true);
	});

	it("returns false when uvMode=true AND view='top'", () => {
		expect(shouldEnableFog(true, "top")).toBe(false);
	});

	it("returns false when uvMode=false AND view='3d'", () => {
		expect(shouldEnableFog(false, "3d")).toBe(false);
	});

	it("returns false when uvMode=false AND view='top'", () => {
		expect(shouldEnableFog(false, "top")).toBe(false);
	});
});

describe("deriveFrameloop", () => {
	it("returns 'demand' when uvMode=false", () => {
		expect(deriveFrameloop(false, "low", false)).toBe("demand");
	});

	it("returns 'demand' when uvMode=true + gpuTier='low'", () => {
		expect(deriveFrameloop(true, "low", false)).toBe("demand");
	});

	it("returns 'always' when uvMode=true + gpuTier='mid'", () => {
		expect(deriveFrameloop(true, "mid", false)).toBe("always");
	});

	it("returns 'always' when uvMode=true + gpuTier='high'", () => {
		expect(deriveFrameloop(true, "high", false)).toBe("always");
	});

	it("returns 'always' when transitioning=true regardless of tier", () => {
		expect(deriveFrameloop(false, "low", true)).toBe("always");
		expect(deriveFrameloop(false, "mid", true)).toBe("always");
		expect(deriveFrameloop(false, "high", true)).toBe("always");
	});

	it("returns 'always' when transitioning=true AND uvMode=true", () => {
		expect(deriveFrameloop(true, "mid", true)).toBe("always");
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
