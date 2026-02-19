import { describe, expect, it } from "vitest";
import { shouldHandleKey } from "../../src/hooks/useKeyboardControls";

describe("shouldHandleKey", () => {
	it("returns true when active element is body", () => {
		expect(shouldHandleKey("BODY")).toBe(true);
	});

	it("returns true when active element is a div", () => {
		expect(shouldHandleKey("DIV")).toBe(true);
	});

	it("returns false when active element is an input", () => {
		expect(shouldHandleKey("INPUT")).toBe(false);
	});

	it("returns false when active element is a textarea", () => {
		expect(shouldHandleKey("TEXTAREA")).toBe(false);
	});

	it("returns false when active element is a select", () => {
		expect(shouldHandleKey("SELECT")).toBe(false);
	});
});
