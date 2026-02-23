import { describe, expect, it } from "vitest";
import { LAYER_DEFINITIONS } from "../../src/constants/layers";
import { DEFAULT_LAYERS } from "../../src/store/store";

describe("Environment layer — LAYER_DEFINITIONS", () => {
	it('includes "environment" layer definition', () => {
		const ids = LAYER_DEFINITIONS.map((l) => l.id);
		expect(ids).toContain("environment");
	});

	it('"environment" layer has label "Environment"', () => {
		const def = LAYER_DEFINITIONS.find((l) => l.id === "environment");
		expect(def?.label).toBe("Environment");
	});

	it('"environment" layer has non-emoji icon string', () => {
		const def = LAYER_DEFINITIONS.find((l) => l.id === "environment");
		expect(def?.icon).toBeTruthy();
		expect(typeof def?.icon).toBe("string");
	});
});

describe("Environment layer — DEFAULT_LAYERS", () => {
	it('has "environment" entry in DEFAULT_LAYERS', () => {
		expect(DEFAULT_LAYERS).toHaveProperty("environment");
	});

	it('"environment" defaults to visible=true', () => {
		expect(DEFAULT_LAYERS.environment.visible).toBe(true);
	});

	it('"environment" defaults to opacity=1', () => {
		expect(DEFAULT_LAYERS.environment.opacity).toBe(1);
	});

	it('"environment" defaults to locked=false', () => {
		expect(DEFAULT_LAYERS.environment.locked).toBe(false);
	});

	it("now has 6 total layers (was 5, added environment)", () => {
		expect(Object.keys(DEFAULT_LAYERS)).toHaveLength(6);
	});
});
