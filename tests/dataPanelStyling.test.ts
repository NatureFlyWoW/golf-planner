import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const DATA_PANEL_FILES = [
	"src/components/ui/BudgetPanel.tsx",
	"src/components/ui/CostSettingsModal.tsx",
	"src/components/ui/CourseBreakdown.tsx",
	"src/components/ui/ExpenseList.tsx",
];

function readSrc(relativePath: string): string {
	return readFileSync(relativePath, "utf-8");
}

describe("High-Contrast Data Panels", () => {
	describe("BudgetPanel financial styling", () => {
		const src = readSrc("src/components/ui/BudgetPanel.tsx");

		it("contains neon-amber text class for financial figures", () => {
			expect(src).toContain("text-neon-amber");
		});

		it("uses deep-space background for summary sections", () => {
			expect(src).toContain("bg-surface-raised");
		});

		it("uses monospace font for numeric values", () => {
			expect(src).toContain("font-mono");
		});
	});

	describe("CostSettingsModal financial styling", () => {
		const src = readSrc("src/components/ui/CostSettingsModal.tsx");

		it("uses neon-amber text for cost values", () => {
			expect(src).toContain("text-neon-amber");
		});

		it("uses monospace font for cost data", () => {
			expect(src).toContain("font-mono");
		});
	});

	describe("CourseBreakdown financial styling", () => {
		const src = readSrc("src/components/ui/CourseBreakdown.tsx");

		it("uses neon-amber for subtotals and totals", () => {
			expect(src).toContain("text-neon-amber");
		});

		it("uses monospace font for financial figures", () => {
			expect(src).toContain("font-mono");
		});
	});

	describe("ExpenseList financial styling", () => {
		const src = readSrc("src/components/ui/ExpenseList.tsx");

		it("uses neon-amber for expense amounts", () => {
			expect(src).toContain("text-neon-amber");
		});

		it("uses monospace font for amounts", () => {
			expect(src).toContain("font-mono");
		});
	});

	describe("no light-only classes remain", () => {
		it.each(
			DATA_PANEL_FILES,
		)("%s has no bg-gray-50 or bg-gray-100 classes", (filePath) => {
			const src = readSrc(filePath);
			expect(src).not.toMatch(/bg-gray-(?:50|100)\b/);
		});
	});

	describe("contrast safety", () => {
		it.each(
			DATA_PANEL_FILES,
		)("%s does not use text-neon-violet for readable body text", (filePath) => {
			const src = readSrc(filePath);
			expect(src).not.toMatch(/text-neon-violet/);
		});
	});
});
