import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SOURCE_PATH = join(
	process.cwd(),
	"src/components/three/holes/TemplateHoleModel.tsx",
);
const source = readFileSync(SOURCE_PATH, "utf-8");

describe("TemplateHoleModel material migration", () => {
	it("imports useMaterials hook instead of singleton materials", () => {
		expect(source).toContain('from "./useMaterials"');
		expect(source).not.toContain("feltMaterial");
		expect(source).not.toContain("bumperMaterial");
	});

	it("does not import UV singleton materials from shared.ts", () => {
		expect(source).not.toContain("uvFeltMaterial");
		expect(source).not.toContain("uvBumperMaterial");
		expect(source).not.toContain("uvTeeMaterial");
		expect(source).not.toContain("uvCupMaterial");
	});

	it("uses shared Cup component instead of inline cylinderGeometry", () => {
		expect(source).toContain('from "./Cup"');
	});

	it("uses shared TeePad component instead of inline cylinderGeometry", () => {
		expect(source).toContain('from "./TeePad"');
	});

	it("includes geometry disposal via useEffect", () => {
		expect(source).toContain("dispose()");
		expect(source).toContain("useEffect");
	});

	it("does not directly read uvMode from store", () => {
		// useMaterials() handles UV mode internally
		expect(source).not.toMatch(/useStore.*uvMode/);
	});
});
