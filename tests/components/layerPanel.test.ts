import { describe, expect, it } from "vitest";
import { LAYER_DEFINITIONS } from "../../src/constants/layers";

describe("LAYER_DEFINITIONS", () => {
	it("contains exactly 5 entries", () => {
		expect(LAYER_DEFINITIONS).toHaveLength(5);
	});

	it("includes all expected layer IDs", () => {
		const ids = LAYER_DEFINITIONS.map((d) => d.id);
		expect(ids).toContain("holes");
		expect(ids).toContain("flowPath");
		expect(ids).toContain("grid");
		expect(ids).toContain("walls");
		expect(ids).toContain("sunIndicator");
	});

	it("each definition has id, label, and icon", () => {
		for (const def of LAYER_DEFINITIONS) {
			expect(def.id).toBeTruthy();
			expect(def.label).toBeTruthy();
			expect(def.icon).toBeTruthy();
		}
	});
});
