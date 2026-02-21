import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
	UV_LAMP_COLOR,
	UV_LAMP_HEIGHT,
	UV_LAMP_INTENSITY,
	UV_LAMP_POSITIONS,
	UV_LAMP_WIDTH,
} from "../src/constants/uvLamps";
import { shouldShowFixtures } from "../src/components/three/UVLamps";

describe("UV Lamps", () => {
	describe("UV_LAMP_POSITIONS", () => {
		it("has 4 entries", () => {
			expect(UV_LAMP_POSITIONS).toHaveLength(4);
		});

		it("positions match expected coordinates", () => {
			expect(UV_LAMP_POSITIONS).toEqual([
				[2.5, 4.3, 5],
				[7.5, 4.3, 5],
				[2.5, 4.3, 15],
				[7.5, 4.3, 15],
			]);
		});
	});

	it("UV lamp color is #8800FF", () => {
		expect(UV_LAMP_COLOR).toBe("#8800FF");
	});

	it("UV lamp intensity is 0.8", () => {
		expect(UV_LAMP_INTENSITY).toBe(0.8);
	});

	it("UV lamp dimensions — width 0.3, height 2", () => {
		expect(UV_LAMP_WIDTH).toBe(0.3);
		expect(UV_LAMP_HEIGHT).toBe(2);
	});

	describe("fixture visibility gating", () => {
		it("visible when view='3d'", () => {
			expect(shouldShowFixtures("3d")).toBe(true);
		});

		it("hidden when view='top'", () => {
			expect(shouldShowFixtures("top")).toBe(false);
		});
	});

	it("lamp fixture has NO transparent/depthWrite props", () => {
		const src = readFileSync(
			resolve(__dirname, "../src/components/three/UVLamps.tsx"),
			"utf-8",
		);
		expect(src).not.toContain("transparent");
		expect(src).not.toContain("depthWrite");
	});
});
