import { describe, expect, it } from "vitest";
import {
	getWallMaterial,
	planningWallMaterial,
	uvWallMaterial,
} from "../src/components/three/HallWalls";
import { getShadowType } from "../src/utils/environmentGating";

describe("HallWalls singleton materials", () => {
	it("planning material is a module-level singleton (same reference)", () => {
		const a = planningWallMaterial;
		const b = planningWallMaterial;
		expect(a).toBe(b);
	});

	it("UV material is a module-level singleton (same reference)", () => {
		const a = uvWallMaterial;
		const b = uvWallMaterial;
		expect(a).toBe(b);
	});

	it("planning material and UV material are different instances", () => {
		expect(planningWallMaterial).not.toBe(uvWallMaterial);
	});

	it("returns planning material when uvMode is false", () => {
		expect(getWallMaterial(false)).toBe(planningWallMaterial);
	});

	it("returns UV material when uvMode is true", () => {
		expect(getWallMaterial(true)).toBe(uvWallMaterial);
	});
});

describe("Mobile shadow optimization", () => {
	it("uses shadows={true} on mobile regardless of GPU tier", () => {
		expect(getShadowType("high", true)).toBe(true);
		expect(getShadowType("mid", true)).toBe(true);
		expect(getShadowType("low", true)).toBe(true);
	});

	it("uses shadows='soft' on desktop with mid+ GPU tier", () => {
		expect(getShadowType("high", false)).toBe("soft");
		expect(getShadowType("mid", false)).toBe("soft");
	});

	it("uses shadows={true} on desktop with low GPU tier", () => {
		expect(getShadowType("low", false)).toBe(true);
	});
});
