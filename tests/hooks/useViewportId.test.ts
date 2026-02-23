import { describe, expect, it } from "vitest";
import { getViewportId } from "../../src/hooks/useViewportId";

describe("getViewportId", () => {
	it("returns '2d' when info has id='2d'", () => {
		expect(getViewportId({ id: "2d" })).toBe("2d");
	});

	it("returns '3d' when info has id='3d'", () => {
		expect(getViewportId({ id: "3d" })).toBe("3d");
	});

	it("returns null when info is null (mobile fallback)", () => {
		expect(getViewportId(null)).toBeNull();
	});
});
