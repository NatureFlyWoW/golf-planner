import { describe, expect, it } from "vitest";
import {
	shouldEnableNormalFog,
	shouldShowSky,
	sunAltAzToVector3,
} from "../../src/utils/environmentGating";

describe("shouldShowSky", () => {
	it("returns true for mid GPU in normal mode", () => {
		expect(shouldShowSky(false, "mid")).toBe(true);
	});

	it("returns true for high GPU in normal mode", () => {
		expect(shouldShowSky(false, "high")).toBe(true);
	});

	it("returns false for low GPU (too expensive)", () => {
		expect(shouldShowSky(false, "low")).toBe(false);
	});

	it("returns false when uvMode=true regardless of GPU tier", () => {
		expect(shouldShowSky(true, "high")).toBe(false);
		expect(shouldShowSky(true, "mid")).toBe(false);
		expect(shouldShowSky(true, "low")).toBe(false);
	});
});

describe("shouldEnableNormalFog", () => {
	it("returns true for 3d-only layout, normal mode, env layer visible", () => {
		expect(shouldEnableNormalFog("3d-only", false, true)).toBe(true);
	});

	it("returns false for dual layout (fog bleeds into 2D pane)", () => {
		expect(shouldEnableNormalFog("dual", false, true)).toBe(false);
	});

	it("returns false for 2d-only layout", () => {
		expect(shouldEnableNormalFog("2d-only", false, true)).toBe(false);
	});

	it("returns false when uvMode=true (UV uses fogExp2 instead)", () => {
		expect(shouldEnableNormalFog("3d-only", true, true)).toBe(false);
	});

	it("returns false when env layer is hidden", () => {
		expect(shouldEnableNormalFog("3d-only", false, false)).toBe(false);
	});
});

describe("sunAltAzToVector3", () => {
	it("altitude=90° (zenith) produces y≈1, x≈0, z≈0", () => {
		const [x, y, z] = sunAltAzToVector3(Math.PI / 2, 0);
		expect(y).toBeCloseTo(1, 5);
		expect(x).toBeCloseTo(0, 5);
		expect(z).toBeCloseTo(0, 5);
	});

	it("altitude=0° (horizon) produces y≈0", () => {
		const [, y] = sunAltAzToVector3(0, 0);
		expect(y).toBeCloseTo(0, 5);
	});

	it("altitude=45°, azimuth=0° (south) produces correct south+up vector", () => {
		const [x, y, z] = sunAltAzToVector3(Math.PI / 4, 0);
		// At 45° elevation, sin(45°) = cos(45°) ≈ 0.7071
		expect(y).toBeCloseTo(Math.SQRT1_2, 5);
		// azimuth=0 (south), so x≈0, z≈cos(alt)*cos(0)≈cos(45°)
		expect(x).toBeCloseTo(0, 5);
		expect(z).toBeCloseTo(Math.SQRT1_2, 5);
	});

	it("returns tuple of 3 numbers", () => {
		const result = sunAltAzToVector3(0.5, 1.0);
		expect(result).toHaveLength(3);
		expect(typeof result[0]).toBe("number");
		expect(typeof result[1]).toBe("number");
		expect(typeof result[2]).toBe("number");
	});

	it("azimuth=PI/2 (west) produces negative X (matching getSunDirection convention)", () => {
		const [x] = sunAltAzToVector3(Math.PI / 4, Math.PI / 2);
		// suncalc: PI/2 = west. Scene: X+ = east, so west is negative X.
		expect(x).toBeLessThan(0);
	});

	it("azimuth=-PI/2 (east) produces positive X", () => {
		const [x] = sunAltAzToVector3(Math.PI / 4, -Math.PI / 2);
		expect(x).toBeGreaterThan(0);
	});

	it("azimuth=PI (north) produces negative Z", () => {
		const [, , z] = sunAltAzToVector3(Math.PI / 4, Math.PI);
		// suncalc: PI = north. Scene: Z+ = south, so north is negative Z.
		expect(z).toBeLessThan(0);
	});
});
