import { describe, expect, it } from "vitest";
import {
	shouldShowFlagPin,
	shouldSkipNormalMaps,
	shouldUseSimpleBumpers,
} from "../../../src/utils/topDownGating";

describe("Top-down view optimization", () => {
	it("shouldShowFlagPin returns true in 3D mode", () => {
		expect(shouldShowFlagPin("3d")).toBe(true);
	});

	it("shouldShowFlagPin returns false in top-down mode", () => {
		expect(shouldShowFlagPin("top")).toBe(false);
	});

	it("shouldUseSimpleBumpers returns false in 3D mode", () => {
		expect(shouldUseSimpleBumpers("3d")).toBe(false);
	});

	it("shouldUseSimpleBumpers returns true in top-down mode", () => {
		expect(shouldUseSimpleBumpers("top")).toBe(true);
	});

	it("shouldSkipNormalMaps returns false in 3D mode", () => {
		expect(shouldSkipNormalMaps("3d")).toBe(false);
	});

	it("shouldSkipNormalMaps returns true in top-down mode", () => {
		expect(shouldSkipNormalMaps("top")).toBe(true);
	});
});
