import { describe, expect, it } from "vitest";
import { UV_EMISSIVE_INTENSITY } from "../src/components/three/holes/materialPresets";

describe("materialPresets", () => {
	it("UV_EMISSIVE_INTENSITY is 2.0", () => {
		expect(UV_EMISSIVE_INTENSITY).toBe(2.0);
	});
});
