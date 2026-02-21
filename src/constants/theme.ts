/**
 * GOLF FORGE blacklight palette — 11 base tokens.
 * These values are mirrored in src/index.css @theme block.
 * Any changes here MUST be reflected in index.css and vice versa.
 */
export const BLACKLIGHT_PALETTE: Record<string, string> = {
	void: "#07071A",
	"deep-space": "#0F0F2E",
	plasma: "#1A1A4A",
	"grid-ghost": "#2A2A5E",
	"neon-violet": "#9D00FF",
	"accent-text": "#B94FFF",
	"neon-cyan": "#00F5FF",
	"neon-green": "#00FF88",
	"neon-amber": "#FFB700",
	"neon-pink": "#FF0090",
	"felt-white": "#E8E8FF",
};

/**
 * Semantic mappings — purpose-driven aliases to base tokens.
 * Values are base token NAMES (not hex), enabling indirection.
 */
export const SEMANTIC_MAPPINGS: Record<string, string> = {
	surface: "void",
	"surface-raised": "deep-space",
	"surface-elevated": "plasma",
	"border-subtle": "grid-ghost",
	"text-primary": "felt-white",
	accent: "neon-violet",
	"accent-text": "accent-text",
	data: "neon-cyan",
	success: "neon-green",
	warning: "neon-amber",
	error: "neon-pink",
};

/**
 * Font family stacks for the three typographic roles.
 * Fallbacks included for graceful degradation.
 */
export const FONT_FAMILIES = {
	display: '"Orbitron", ui-sans-serif, system-ui, sans-serif',
	body: '"Inter", ui-sans-serif, system-ui, sans-serif',
	mono: '"JetBrains Mono", ui-monospace, monospace',
} as const;
