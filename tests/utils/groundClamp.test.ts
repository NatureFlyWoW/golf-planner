import { describe, expect, it } from "vitest";
import { clampCameraY } from "../../src/utils/groundClamp";

describe("clampCameraY", () => {
	it("clamps Y below 0.5 to 0.5 when not in walkthrough", () => {
		expect(clampCameraY(-1.0, false)).toBe(0.5);
		expect(clampCameraY(0.0, false)).toBe(0.5);
		expect(clampCameraY(0.4, false)).toBe(0.5);
	});

	it("does not clamp Y above 0.5 when not in walkthrough", () => {
		expect(clampCameraY(0.6, false)).toBe(0.6);
		expect(clampCameraY(100, false)).toBe(100);
	});

	it("does NOT clamp during walkthrough mode", () => {
		expect(clampCameraY(-1.0, true)).toBe(-1.0);
		expect(clampCameraY(0.3, true)).toBe(0.3);
	});
});
