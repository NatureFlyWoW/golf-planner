import { describe, expect, it } from "vitest";

// Pure functions will be exported from the hall components
import {
	getFloorMaterialConfig,
	getFloorUVRepeat,
} from "../../../src/components/three/HallFloor";
import {
	getWallMaterialConfig,
	getWallUVRepeat,
	shouldLoadHallTextures,
} from "../../../src/components/three/HallWalls";

describe("Hall floor material config", () => {
	it("returns concrete texture paths for mid+ GPU tier in planning mode", () => {
		const config = getFloorMaterialConfig({ gpuTier: "mid", uvMode: false });
		expect(config.useTextures).toBe(true);
		expect(config.color).toBe("#E0E0E0");
	});

	it("returns dark color with no textures for UV mode (but textures still enabled)", () => {
		const config = getFloorMaterialConfig({ gpuTier: "mid", uvMode: true });
		expect(config.color).toBe("#07071A");
	});

	it("returns flat color for low GPU tier", () => {
		const config = getFloorMaterialConfig({ gpuTier: "low", uvMode: false });
		expect(config.useTextures).toBe(false);
		expect(config.color).toBe("#E0E0E0");
	});

	it("floor in UV mode uses dark color #07071A", () => {
		const config = getFloorMaterialConfig({
			gpuTier: "high",
			uvMode: true,
		});
		expect(config.color).toBe("#07071A");
	});
});

describe("Hall floor UV repeat", () => {
	it("returns [5, 10] for 10m x 20m hall (2m tile size)", () => {
		expect(getFloorUVRepeat(10, 20)).toEqual([5, 10]);
	});

	it("scales with hall dimensions", () => {
		expect(getFloorUVRepeat(20, 40)).toEqual([10, 20]);
	});
});

describe("Hall wall material config", () => {
	it("returns steel texture paths for mid+ GPU tier in planning mode", () => {
		const config = getWallMaterialConfig({ gpuTier: "mid", uvMode: false });
		expect(config.useTextures).toBe(true);
		expect(config.color).toBe("#B0B0B0");
	});

	it("returns dark color for UV mode", () => {
		const config = getWallMaterialConfig({ gpuTier: "mid", uvMode: true });
		expect(config.color).toBe("#1A1A2E");
	});

	it("returns flat color for low GPU tier", () => {
		const config = getWallMaterialConfig({ gpuTier: "low", uvMode: false });
		expect(config.useTextures).toBe(false);
	});

	it("walls in UV mode use dark color #1A1A2E", () => {
		const config = getWallMaterialConfig({
			gpuTier: "high",
			uvMode: true,
		});
		expect(config.color).toBe("#1A1A2E");
	});
});

describe("Hall wall UV repeat", () => {
	it("returns correct repeat for long wall (20m)", () => {
		expect(getWallUVRepeat(20)).toEqual([20, 1]);
	});

	it("returns correct repeat for short wall (10m)", () => {
		expect(getWallUVRepeat(10)).toEqual([10, 1]);
	});
});

describe("shouldLoadHallTextures", () => {
	it("returns false for low GPU tier", () => {
		expect(shouldLoadHallTextures("low")).toBe(false);
	});

	it("returns true for mid GPU tier", () => {
		expect(shouldLoadHallTextures("mid")).toBe(true);
	});

	it("returns true for high GPU tier", () => {
		expect(shouldLoadHallTextures("high")).toBe(true);
	});
});
