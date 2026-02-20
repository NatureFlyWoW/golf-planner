import { describe, expect, it } from "vitest";
import {
	effectiveCost,
	formatEur,
	grossToNet,
	netToGross,
	reclaimableVat,
	riskBuffer,
	roundEur,
	uncertaintyFromTier,
} from "../financial";

describe("roundEur", () => {
	it("rounds to 2 decimal places", () => {
		// Note: 1.005 * 100 = 100.49999… in IEEE 754, so Math.round gives 100 → 1.00
		expect(roundEur(1.005)).toBe(1);
		expect(roundEur(1.004)).toBe(1);
		expect(roundEur(100.999)).toBe(101);
	});

	it("handles whole numbers", () => {
		expect(roundEur(90000)).toBe(90000);
	});
});

describe("netToGross", () => {
	it("applies 20% for standard_20", () => {
		expect(netToGross(90000, "standard_20")).toBe(108000);
		expect(netToGross(100, "standard_20")).toBe(120);
	});

	it("returns same value for exempt", () => {
		expect(netToGross(9500, "exempt")).toBe(9500);
	});
});

describe("grossToNet", () => {
	it("removes 20% for standard_20", () => {
		expect(grossToNet(108000, "standard_20")).toBe(90000);
		expect(grossToNet(120, "standard_20")).toBe(100);
	});

	it("returns same value for exempt", () => {
		expect(grossToNet(9500, "exempt")).toBe(9500);
	});
});

describe("effectiveCost", () => {
	it("returns net when VAT registered", () => {
		expect(effectiveCost(90000, "standard_20", true)).toBe(90000);
	});

	it("returns gross when not VAT registered", () => {
		expect(effectiveCost(90000, "standard_20", false)).toBe(108000);
	});

	it("returns same for exempt regardless", () => {
		expect(effectiveCost(9500, "exempt", true)).toBe(9500);
		expect(effectiveCost(9500, "exempt", false)).toBe(9500);
	});
});

describe("reclaimableVat", () => {
	it("returns 20% of net when registered and standard", () => {
		expect(reclaimableVat(90000, "standard_20", true)).toBe(18000);
	});

	it("returns 0 when not registered", () => {
		expect(reclaimableVat(90000, "standard_20", false)).toBe(0);
	});

	it("returns 0 for exempt categories", () => {
		expect(reclaimableVat(9500, "exempt", true)).toBe(0);
	});
});

describe("riskBuffer", () => {
	it("returns near-zero for fixed tier", () => {
		expect(riskBuffer(90000, "fixed", "balanced")).toBe(1800);
	});

	it("returns higher buffer for very_high tier", () => {
		expect(riskBuffer(12500, "very_high", "balanced")).toBe(5000);
	});

	it("scales with tolerance", () => {
		const balanced = riskBuffer(10000, "medium", "balanced");
		const conservative = riskBuffer(10000, "medium", "conservative");
		expect(conservative).toBeGreaterThan(balanced);
	});

	it("optimistic returns lower buffer", () => {
		const optimistic = riskBuffer(10000, "medium", "optimistic");
		const balanced = riskBuffer(10000, "medium", "balanced");
		expect(optimistic).toBeLessThan(balanced);
	});
});

describe("uncertaintyFromTier", () => {
	it("generates tight range for fixed tier", () => {
		const u = uncertaintyFromTier(108000, "fixed");
		expect(u.min).toBe(105840);
		expect(u.mode).toBe(108000);
		expect(u.max).toBe(110160);
	});

	it("generates wide range for very_high tier", () => {
		const u = uncertaintyFromTier(12500, "very_high");
		expect(u.min).toBe(6250);
		expect(u.mode).toBe(12500);
		expect(u.max).toBe(25000);
	});
});

describe("formatEur", () => {
	it("formats in de-AT locale with EUR symbol", () => {
		const result = formatEur(108000);
		// de-AT format: € 108.000 (may vary by runtime)
		expect(result).toContain("108");
		expect(result).toContain("€");
	});
});
