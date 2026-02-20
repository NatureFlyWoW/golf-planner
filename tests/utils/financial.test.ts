import { describe, expect, it } from "vitest";
import { inflatedEstimate, roundEur } from "../../src/utils/financial";

describe("inflatedEstimate", () => {
	it("returns original amount for fixed tier", () => {
		expect(inflatedEstimate(90000, "fixed", 1.05)).toBe(90000);
	});

	it("applies inflation factor for non-fixed tiers", () => {
		expect(inflatedEstimate(10000, "medium", 1.025)).toBe(
			roundEur(10000 * 1.025),
		);
	});

	it("returns original when factor is 1.0", () => {
		expect(inflatedEstimate(10000, "high", 1.0)).toBe(10000);
	});

	it("handles all non-fixed tiers", () => {
		for (const tier of ["low", "medium", "high", "very_high"] as const) {
			const result = inflatedEstimate(1000, tier, 1.1);
			expect(result).toBe(roundEur(1000 * 1.1));
		}
	});
});
