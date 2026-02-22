import { describe, expect, it } from "vitest";
import { computeScale } from "../../src/utils/zoomScale";

describe("computeScale", () => {
	it("returns a standard scale string at zoom=20", () => {
		const result = computeScale(20);
		expect(["1:10", "1:20", "1:25", "1:50", "1:100", "1:200"]).toContain(
			result,
		);
	});

	it("rounds to nearest standard scale", () => {
		const result = computeScale(35);
		expect(["1:10", "1:20", "1:25", "1:50", "1:100", "1:200"]).toContain(
			result,
		);
	});

	it("returns small scale at very high zoom", () => {
		const result = computeScale(120);
		// zoom=120 → denominator ≈ 16.7 → rounds to 1:20
		expect(result).toBe("1:20");
	});

	it("returns '1:200' at very low zoom", () => {
		const result = computeScale(5);
		expect(result).toBe("1:200");
	});

	it("higher zoom produces smaller scale denominator", () => {
		const lowZoom = computeScale(20);
		const highZoom = computeScale(80);
		const lowDenom = Number.parseInt(lowZoom.split(":")[1]);
		const highDenom = Number.parseInt(highZoom.split(":")[1]);
		expect(highDenom).toBeLessThanOrEqual(lowDenom);
	});
});
