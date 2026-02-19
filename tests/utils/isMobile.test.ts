// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";

describe("isMobile", () => {
	it("exports a boolean", async () => {
		// Mock matchMedia for test environment (jsdom doesn't have it)
		Object.defineProperty(window, "matchMedia", {
			writable: true,
			value: vi.fn().mockImplementation((query: string) => ({
				matches: false,
				media: query,
				addEventListener: vi.fn(),
				removeEventListener: vi.fn(),
			})),
		});
		// Dynamic import to pick up the mock
		const { isMobile } = await import("../../src/utils/isMobile");
		expect(typeof isMobile).toBe("boolean");
	});
});
