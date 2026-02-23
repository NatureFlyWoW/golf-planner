import { describe, expect, it } from "vitest";
import { shouldSuppressForWalkthrough } from "../../src/hooks/useKeyboardControls";

describe("shouldSuppressForWalkthrough", () => {
	it("suppresses camera preset key '1' when walkthroughMode is true", () => {
		expect(shouldSuppressForWalkthrough("1", true)).toBe(true);
	});

	it("suppresses camera preset key '6' when walkthroughMode is true", () => {
		expect(shouldSuppressForWalkthrough("6", true)).toBe(true);
	});

	it("does NOT suppress '1' when walkthroughMode is false", () => {
		expect(shouldSuppressForWalkthrough("1", false)).toBe(false);
	});

	it("suppresses 'r' (reset camera) when walkthroughMode is true", () => {
		expect(shouldSuppressForWalkthrough("r", true)).toBe(true);
	});

	it("suppresses 'f' (fit holes) when walkthroughMode is true", () => {
		expect(shouldSuppressForWalkthrough("f", true)).toBe(true);
	});

	it("does NOT suppress 'z' (undo) during walkthrough", () => {
		expect(shouldSuppressForWalkthrough("z", true)).toBe(false);
	});

	it("does NOT suppress 'Z' (redo) during walkthrough", () => {
		expect(shouldSuppressForWalkthrough("Z", true)).toBe(false);
	});

	it("does NOT suppress 'g' (snap toggle) during walkthrough", () => {
		expect(shouldSuppressForWalkthrough("g", true)).toBe(false);
	});

	it("does NOT suppress 'G' during walkthrough", () => {
		expect(shouldSuppressForWalkthrough("G", true)).toBe(false);
	});

	it("suppresses arrow keys during walkthrough", () => {
		expect(shouldSuppressForWalkthrough("ArrowUp", true)).toBe(true);
		expect(shouldSuppressForWalkthrough("ArrowDown", true)).toBe(true);
	});

	it("returns false for any key when walkthroughMode is false", () => {
		expect(shouldSuppressForWalkthrough("r", false)).toBe(false);
		expect(shouldSuppressForWalkthrough("ArrowUp", false)).toBe(false);
	});
});
