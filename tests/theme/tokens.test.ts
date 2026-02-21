import { describe, expect, it } from "vitest";
import {
	BLACKLIGHT_PALETTE,
	FONT_FAMILIES,
	SEMANTIC_MAPPINGS,
} from "../../src/constants/theme";

// ---------------------------------------------------------------------------
// Palette completeness
// ---------------------------------------------------------------------------

describe("BLACKLIGHT_PALETTE", () => {
	const EXPECTED_TOKENS = [
		"void",
		"deep-space",
		"plasma",
		"grid-ghost",
		"neon-violet",
		"accent-text",
		"neon-cyan",
		"neon-green",
		"neon-amber",
		"neon-pink",
		"felt-white",
	];

	it("defines all 11 base tokens", () => {
		for (const token of EXPECTED_TOKENS) {
			expect(BLACKLIGHT_PALETTE).toHaveProperty(token);
		}
		expect(Object.keys(BLACKLIGHT_PALETTE)).toHaveLength(11);
	});

	it("accent-text token value is #B94FFF (contrast-safe)", () => {
		expect(BLACKLIGHT_PALETTE["accent-text"].toLowerCase()).toBe("#b94fff");
	});

	it("void token value is #07071A", () => {
		expect(BLACKLIGHT_PALETTE.void.toLowerCase()).toBe("#07071a");
	});

	it("neon-violet is #9D00FF (decorative only)", () => {
		expect(BLACKLIGHT_PALETTE["neon-violet"].toLowerCase()).toBe("#9d00ff");
	});
});

// ---------------------------------------------------------------------------
// Semantic mappings
// ---------------------------------------------------------------------------

describe("SEMANTIC_MAPPINGS", () => {
	it("surface maps to void", () => {
		expect(SEMANTIC_MAPPINGS.surface).toBe("void");
	});

	it("surface-raised maps to deep-space", () => {
		expect(SEMANTIC_MAPPINGS["surface-raised"]).toBe("deep-space");
	});

	it("surface-elevated maps to plasma", () => {
		expect(SEMANTIC_MAPPINGS["surface-elevated"]).toBe("plasma");
	});

	it("border-subtle maps to grid-ghost", () => {
		expect(SEMANTIC_MAPPINGS["border-subtle"]).toBe("grid-ghost");
	});

	it("text-primary maps to felt-white", () => {
		expect(SEMANTIC_MAPPINGS["text-primary"]).toBe("felt-white");
	});

	it("accent maps to neon-violet (decorative)", () => {
		expect(SEMANTIC_MAPPINGS.accent).toBe("neon-violet");
	});

	it("accent-text maps to accent-text (#B94FFF for readable text)", () => {
		expect(SEMANTIC_MAPPINGS["accent-text"]).toBe("accent-text");
	});
});

// ---------------------------------------------------------------------------
// Font families
// ---------------------------------------------------------------------------

describe("FONT_FAMILIES", () => {
	it("font-display maps to Orbitron", () => {
		expect(FONT_FAMILIES.display).toMatch(/Orbitron/);
	});

	it("font-body maps to Inter", () => {
		expect(FONT_FAMILIES.body).toMatch(/Inter/);
	});

	it("font-mono maps to JetBrains Mono", () => {
		expect(FONT_FAMILIES.mono).toMatch(/JetBrains Mono/);
	});
});
