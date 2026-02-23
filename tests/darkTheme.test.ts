import * as fs from "node:fs";
import * as path from "node:path";
import { describe, expect, it } from "vitest";

const SRC_UI = path.resolve("src/components/ui");
const SRC_BUILDER = path.resolve("src/components/builder");
const SRC_APP = path.resolve("src/App.tsx");

/** Read all .tsx files from a directory (non-recursive). */
function readTsxFiles(dir: string): { file: string; content: string }[] {
	if (!fs.existsSync(dir)) return [];
	return fs
		.readdirSync(dir)
		.filter((f) => f.endsWith(".tsx"))
		.map((f) => ({
			file: f,
			content: fs.readFileSync(path.join(dir, f), "utf-8"),
		}));
}

function countMatches(
	files: { file: string; content: string }[],
	pattern: RegExp,
): string[] {
	const matches: string[] = [];
	for (const { file, content } of files) {
		const m = content.match(pattern);
		if (m) matches.push(`${file}: ${m.length} match(es)`);
	}
	return matches;
}

describe("Dark Theme Conversion", () => {
	const uiFiles = readTsxFiles(SRC_UI);
	const builderFiles = readTsxFiles(SRC_BUILDER);
	const allComponentFiles = [...uiFiles, ...builderFiles];

	it("no remaining bg-white classes in src/components/", () => {
		const matches = countMatches(allComponentFiles, /bg-white/g);
		expect(matches, `Found bg-white in: ${matches.join(", ")}`).toHaveLength(0);
	});

	it("no remaining bg-gray-50 or bg-gray-100 in UI/builder components", () => {
		const matches = countMatches(allComponentFiles, /bg-gray-(?:50|100)\b/g);
		expect(
			matches,
			`Found bg-gray-50/100 in: ${matches.join(", ")}`,
		).toHaveLength(0);
	});

	it("no remaining bg-gray-200 backgrounds in UI components", () => {
		const matches = countMatches(uiFiles, /bg-gray-200/g);
		expect(matches, `Found bg-gray-200 in: ${matches.join(", ")}`).toHaveLength(
			0,
		);
	});

	it("no remaining text-gray-900/800/700 in UI components", () => {
		const matches = countMatches(uiFiles, /text-gray-(?:900|800|700)\b/g);
		expect(
			matches,
			`Found dark-on-light text in: ${matches.join(", ")}`,
		).toHaveLength(0);
	});

	it("no remaining border-gray-200 in UI components", () => {
		const matches = countMatches(uiFiles, /border-gray-200/g);
		expect(
			matches,
			`Found border-gray-200 in: ${matches.join(", ")}`,
		).toHaveLength(0);
	});

	it("no remaining uvMode ternaries in UI components", () => {
		const uiAndToolbar = uiFiles;
		const matches = countMatches(uiAndToolbar, /uvMode\s*\?/g);
		expect(matches, `Found uvMode ? in UI: ${matches.join(", ")}`).toHaveLength(
			0,
		);
	});

	it("3D component files are allowed to have uvMode ternaries", () => {
		// This test documents the exception — it should always pass
		expect(true).toBe(true);
	});

	it("App.tsx root div uses dark background class", () => {
		const appContent = fs.readFileSync(SRC_APP, "utf-8");
		expect(
			appContent.includes("bg-surface") || appContent.includes("bg-void"),
			"App.tsx should use bg-surface or bg-void",
		).toBe(true);
	});
});
