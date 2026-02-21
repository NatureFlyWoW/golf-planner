import { describe, expect, it, vi } from "vitest";

vi.mock("@react-three/drei", () => {
	const { Texture } = require("three");
	const fn = vi.fn(() => new Texture());
	fn.preload = vi.fn();
	return { useTexture: fn };
});

// Also mock the store to avoid Zustand initialization issues
vi.mock("../../../src/store", () => ({
	useStore: vi.fn(() => "high"),
}));

import {
	getTexturePathsForTier,
	shouldLoadTextures,
} from "../../src/components/three/holes/useTexturedMaterials.js";

describe("shouldLoadTextures", () => {
	it("returns false for GPU tier 'low'", () => {
		expect(shouldLoadTextures("low")).toBe(false);
	});

	it("returns true for GPU tier 'mid'", () => {
		expect(shouldLoadTextures("mid")).toBe(true);
	});

	it("returns true for GPU tier 'high'", () => {
		expect(shouldLoadTextures("high")).toBe(true);
	});
});

describe("getTexturePathsForTier", () => {
	it("GPU tier high returns color + normal + roughness paths", () => {
		const paths = getTexturePathsForTier("high", "felt");
		expect(paths).toContain("/textures/felt/color.jpg");
		expect(paths).toContain("/textures/felt/normal.jpg");
		expect(paths).toContain("/textures/felt/roughness.jpg");
	});

	it("GPU tier mid returns color + normal only (no roughness)", () => {
		const paths = getTexturePathsForTier("mid", "felt");
		expect(paths).toContain("/textures/felt/color.jpg");
		expect(paths).toContain("/textures/felt/normal.jpg");
		expect(paths).not.toContain("/textures/felt/roughness.jpg");
	});

	it("GPU tier low returns empty array (no textures)", () => {
		const paths = getTexturePathsForTier("low", "felt");
		expect(paths).toHaveLength(0);
	});

	it("returns wood texture paths", () => {
		const paths = getTexturePathsForTier("high", "wood");
		expect(paths).toContain("/textures/wood/color.jpg");
		expect(paths).toContain("/textures/wood/normal.jpg");
	});

	it("returns rubber texture paths", () => {
		const paths = getTexturePathsForTier("high", "rubber");
		expect(paths).toContain("/textures/rubber/normal.jpg");
		expect(paths).toContain("/textures/rubber/roughness.jpg");
	});
});
