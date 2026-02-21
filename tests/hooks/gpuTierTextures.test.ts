import { describe, expect, it } from "vitest";
import {
	type TextureMapSet,
	getTextureMapSet,
} from "../../src/utils/textureGating";

describe("GPU tier texture gating", () => {
	it("GPU tier 'low' returns no texture maps", () => {
		const result: TextureMapSet = getTextureMapSet("low");
		expect(result.color).toBe(false);
		expect(result.normal).toBe(false);
		expect(result.roughness).toBe(false);
	});

	it("GPU tier 'mid' returns color + normal only (no roughness)", () => {
		const result = getTextureMapSet("mid");
		expect(result.color).toBe(true);
		expect(result.normal).toBe(true);
		expect(result.roughness).toBe(false);
	});

	it("GPU tier 'high' returns all texture maps", () => {
		const result = getTextureMapSet("high");
		expect(result.color).toBe(true);
		expect(result.normal).toBe(true);
		expect(result.roughness).toBe(true);
	});

	it("top-down view disables normal map even on 'high' tier", () => {
		const result = getTextureMapSet("high", true);
		expect(result.color).toBe(true);
		expect(result.normal).toBe(false);
		expect(result.roughness).toBe(false);
	});

	it("top-down view disables normal map on 'mid' tier", () => {
		const result = getTextureMapSet("mid", true);
		expect(result.color).toBe(true);
		expect(result.normal).toBe(false);
		expect(result.roughness).toBe(false);
	});

	it("top-down view on 'low' tier still returns no maps", () => {
		const result = getTextureMapSet("low", true);
		expect(result.color).toBe(false);
		expect(result.normal).toBe(false);
		expect(result.roughness).toBe(false);
	});
});
