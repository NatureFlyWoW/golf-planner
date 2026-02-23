import { describe, expect, it } from "vitest";
import { computeLODLevel } from "../../src/hooks/useZoomLOD";

describe("computeLODLevel", () => {
	it("returns 'overview' when zoom < 15", () => {
		expect(computeLODLevel(5)).toBe("overview");
		expect(computeLODLevel(10)).toBe("overview");
		expect(computeLODLevel(14.9)).toBe("overview");
	});

	it("returns 'standard' when zoom is between 15 and 40", () => {
		expect(computeLODLevel(20)).toBe("standard");
		expect(computeLODLevel(30)).toBe("standard");
		expect(computeLODLevel(39.9)).toBe("standard");
	});

	it("returns 'detail' when zoom >= 40", () => {
		expect(computeLODLevel(40)).toBe("detail");
		expect(computeLODLevel(50)).toBe("detail");
		expect(computeLODLevel(100)).toBe("detail");
	});

	it("boundary at exactly 15 returns 'standard'", () => {
		expect(computeLODLevel(15)).toBe("standard");
	});

	it("boundary at exactly 40 returns 'detail'", () => {
		expect(computeLODLevel(40)).toBe("detail");
	});

	it("returns 'overview' for zoom of 0", () => {
		expect(computeLODLevel(0)).toBe("overview");
	});

	it("returns 'overview' for negative zoom (edge case)", () => {
		expect(computeLODLevel(-1)).toBe("overview");
	});
});
