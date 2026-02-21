Now I have everything I need. Let me produce the section content.

# Section 02: Tailwind Semantic Tokens + Fonts + PWA Manifest

## Overview

This section defines the GOLF FORGE visual identity foundation: an 11-token blacklight color palette in Tailwind v4's `@theme` system, self-hosted WOFF2 fonts for offline PWA support, and updated PWA manifest branding. Everything here is additive -- it does NOT remove or override Tailwind's default color utilities, ensuring zero breakage of the 45+ existing uses of `bg-red-*`, `bg-amber-*`, `bg-blue-*`, etc. across 17 files.

**Dependencies**: None (Batch 1 -- parallelizable with section-01-gpu-tier).

**Blocks**: section-03-dark-theme and section-04-data-panels depend on the tokens and fonts defined here.

## Files to Create

- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/public/fonts/orbitron-v700.woff2`
- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/public/fonts/inter-v400.woff2`
- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/public/fonts/inter-v500.woff2`
- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/public/fonts/inter-v600.woff2`
- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/public/fonts/inter-v700.woff2`
- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/public/fonts/jetbrains-mono-v400.woff2`
- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/public/fonts/jetbrains-mono-v500.woff2`
- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/theme/tokens.test.ts`

## Files to Modify

- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/index.css` -- Add `@theme` block, semantic mappings, `@font-face` declarations
- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/vite.config.ts` -- Update PWA manifest fields

---

## Tests FIRST

Create the test file at `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/theme/tokens.test.ts`. These tests verify the palette constants and semantic mappings as pure data -- they do not test CSS rendering (which is visual / Playwright territory in section-12).

```ts
import { describe, expect, it } from "vitest";

/**
 * The BLACKLIGHT_PALETTE and SEMANTIC_MAPPINGS objects are extracted from
 * the @theme block in src/index.css as authoritative constants.
 * They live in a shared module so both CSS and tests reference the same source of truth.
 */
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
```

### Manual Verification Checklist (not automated)

These items must be confirmed visually or by file inspection after implementation:

- WOFF2 font files present in `public/fonts/` for all specified weights
- `@font-face` declarations have `font-display: swap`
- PWA manifest `theme_color` is `#07071A`
- PWA manifest `background_color` is `#07071A`
- PWA manifest `name` is `"GOLF FORGE"`
- PWA manifest `short_name` is `"FORGE"`
- Tailwind default colors (`bg-red-500`, `bg-amber-500`, etc.) still work after `@theme` additions -- verify by checking the app visually and confirming BudgetPanel progress bars still render in their original colors

---

## Implementation Details

### Step 1: Create the Theme Constants Module

Create `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/constants/theme.ts` as the single source of truth for palette values, used by both the CSS `@theme` block (manually mirrored) and the test suite.

```ts
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
```

### Step 2: Download and Place WOFF2 Font Files

Download WOFF2 font files from Google Fonts (or fontsource/github releases) and place them in `/mnt/c/Users/Caus/Golf_Plan/golf-planner/public/fonts/`. The specific files needed:

| File | Font | Weight |
|------|------|--------|
| `orbitron-v700.woff2` | Orbitron | 700 (Bold) |
| `inter-v400.woff2` | Inter | 400 (Regular) |
| `inter-v500.woff2` | Inter | 500 (Medium) |
| `inter-v600.woff2` | Inter | 600 (SemiBold) |
| `inter-v700.woff2` | Inter | 700 (Bold) |
| `jetbrains-mono-v400.woff2` | JetBrains Mono | 400 (Regular) |
| `jetbrains-mono-v500.woff2` | JetBrains Mono | 500 (Medium) |

Self-hosting is required because this is a PWA that must work offline. CDN fonts would fail in offline mode.

To obtain the files, use Google Fonts API or download directly from the `fontsource` npm packages:
- `@fontsource/orbitron` (extract `files/orbitron-latin-700-normal.woff2`)
- `@fontsource/inter` (extract `files/inter-latin-{400,500,600,700}-normal.woff2`)
- `@fontsource/jetbrains-mono` (extract `files/jetbrains-mono-latin-{400,500}-normal.woff2`)

Alternatively, fetch directly from Google Fonts CSS API and download the WOFF2 URLs.

### Step 3: Update `src/index.css`

Replace the current content of `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/index.css` with the following structure. The key principle is **additive** -- the `@theme` block adds new custom properties alongside Tailwind's defaults. Do NOT use `--color-*: initial` which would wipe out all built-in Tailwind color utilities.

```css
@import "tailwindcss";

/* =========================================================================
   @font-face — Self-hosted WOFF2 for offline PWA support
   ========================================================================= */

@font-face {
  font-family: "Orbitron";
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url("/fonts/orbitron-v700.woff2") format("woff2");
}

@font-face {
  font-family: "Inter";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("/fonts/inter-v400.woff2") format("woff2");
}

@font-face {
  font-family: "Inter";
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url("/fonts/inter-v500.woff2") format("woff2");
}

@font-face {
  font-family: "Inter";
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url("/fonts/inter-v600.woff2") format("woff2");
}

@font-face {
  font-family: "Inter";
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url("/fonts/inter-v700.woff2") format("woff2");
}

@font-face {
  font-family: "JetBrains Mono";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("/fonts/jetbrains-mono-v400.woff2") format("woff2");
}

@font-face {
  font-family: "JetBrains Mono";
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url("/fonts/jetbrains-mono-v500.woff2") format("woff2");
}

/* =========================================================================
   @theme — GOLF FORGE Blacklight Palette (additive, preserves Tailwind defaults)
   ========================================================================= */

@theme {
  /* Base color tokens — 11 blacklight palette colors */
  --color-void: #07071A;
  --color-deep-space: #0F0F2E;
  --color-plasma: #1A1A4A;
  --color-grid-ghost: #2A2A5E;
  --color-neon-violet: #9D00FF;
  --color-accent-text: #B94FFF;
  --color-neon-cyan: #00F5FF;
  --color-neon-green: #00FF88;
  --color-neon-amber: #FFB700;
  --color-neon-pink: #FF0090;
  --color-felt-white: #E8E8FF;

  /* Font family tokens */
  --font-display: "Orbitron", ui-sans-serif, system-ui, sans-serif;
  --font-body: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
}

/* =========================================================================
   Semantic tokens — purpose-driven aliases via @theme inline
   These resolve to the base tokens above, creating a semantic layer:
     bg-surface → bg-void, text-primary → text-felt-white, etc.
   ========================================================================= */

@theme inline {
  --color-surface: var(--color-void);
  --color-surface-raised: var(--color-deep-space);
  --color-surface-elevated: var(--color-plasma);
  --color-border-subtle: var(--color-grid-ghost);
  --color-text-primary: var(--color-felt-white);
  --color-accent: var(--color-neon-violet);
  /* accent-text already defined as a base token above */
  --color-data: var(--color-neon-cyan);
  --color-success: var(--color-neon-green);
  --color-warning: var(--color-neon-amber);
  --color-error: var(--color-neon-pink);
}

/* =========================================================================
   Global styles
   ========================================================================= */

html,
body {
  overscroll-behavior: none;
}
```

**How the `@theme` block works in Tailwind v4**: When you declare `--color-void: #07071A` inside `@theme { }`, Tailwind automatically generates utility classes `bg-void`, `text-void`, `border-void`, `ring-void`, etc. The `@theme inline` block works the same way but its values are inlined rather than generating standalone custom properties -- this is ideal for semantic aliases that reference other tokens via `var()`.

**Critical**: The `@theme` block is purely additive. It adds new color tokens (`void`, `deep-space`, `plasma`, etc.) WITHOUT clearing Tailwind's default palette. This means `bg-red-500`, `bg-amber-500`, `bg-blue-500`, and all other default Tailwind colors continue to work. There are 45+ uses of these default colors across 17 files (primarily in BudgetPanel progress bars) that would break if we used `--color-*: initial`.

### Step 4: Update PWA Manifest in `vite.config.ts`

Modify the `manifest` object in `/mnt/c/Users/Caus/Golf_Plan/golf-planner/vite.config.ts`:

```ts
manifest: {
  name: "GOLF FORGE",
  short_name: "FORGE",
  theme_color: "#07071A",
  background_color: "#07071A",
  display: "standalone",
  orientation: "landscape",
  icons: [
    // ... keep existing icons array unchanged
  ],
},
```

Only four fields change:
- `name`: `"Golf Planner"` becomes `"GOLF FORGE"`
- `short_name`: `"Golf"` becomes `"FORGE"`
- `theme_color`: `"#1d4ed8"` becomes `"#07071A"` (void)
- `background_color`: `"#f3f4f6"` becomes `"#07071A"` (void)

### Contrast Safety Reference

This is critical context for downstream sections (03, 04) that will use these tokens for text:

| Color | Hex | On Void (#07071A) | On Deep-Space (#0F0F2E) | Usage |
|-------|-----|-------------------|--------------------------|-------|
| felt-white | #E8E8FF | 13.8:1 (AAA) | ~11.5:1 (AAA) | Body text everywhere |
| neon-amber | #FFB700 | 9.2:1 (AAA) | ~7.7:1 (AAA) | Financial data |
| neon-green | #00FF88 | 10.1:1 (AAA) | -- | Success indicators |
| neon-cyan | #00F5FF | 11.4:1 (AAA) | ~9.5:1 (AAA) | Data values |
| accent-text | #B94FFF | ~5.2:1 (AA) | ~4.3:1 (AA large/bold) | Accented text labels |
| neon-pink | #FF0090 | 4.4:1 (AA large) | -- | Errors -- use with felt-white text |
| neon-violet | #9D00FF | 3.1:1 (FAILS AA) | -- | DECORATIVE ONLY: borders, glows, shadows |
| grid-ghost | #2A2A5E | ~1.8:1 (FAILS) | -- | Borders only, NEVER text |

**Rule**: Never use `text-neon-violet` or `text-accent` for readable text. Use `text-accent-text` instead. `neon-violet` is for decorative borders, box-shadows, icon fills, and glow effects only.

### Utility Classes Generated

After implementation, the following Tailwind utility classes become available (non-exhaustive):

**From base tokens**: `bg-void`, `text-void`, `border-void`, `bg-deep-space`, `text-deep-space`, `bg-plasma`, `text-plasma`, `bg-grid-ghost`, `border-grid-ghost`, `bg-neon-violet`, `text-neon-violet`, `border-neon-violet`, `bg-accent-text`, `text-accent-text`, `bg-neon-cyan`, `text-neon-cyan`, `bg-neon-green`, `text-neon-green`, `bg-neon-amber`, `text-neon-amber`, `bg-neon-pink`, `text-neon-pink`, `bg-felt-white`, `text-felt-white`

**From semantic tokens**: `bg-surface`, `bg-surface-raised`, `bg-surface-elevated`, `border-border-subtle`, `text-text-primary`, `bg-accent`, `text-data`, `text-success`, `text-warning`, `text-error`

**Font families**: `font-display` (Orbitron), `font-body` (Inter), `font-mono` (JetBrains Mono)

### Step 5: Add `public/fonts/` to PWA Glob Patterns

Update the workbox `globPatterns` in `vite.config.ts` to include WOFF2 files for offline caching:

```ts
globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
```

Add `woff2` to the existing pattern so the service worker precaches the font files.

---

## Verification Procedure

After implementing all steps:

1. Run `npm test` -- the new `tests/theme/tokens.test.ts` should pass.
2. Run `npm run build` -- verify no build errors.
3. Run `npm run dev` and inspect the browser:
   - Open DevTools, check that `--color-void`, `--color-deep-space`, etc. are defined on `:root`.
   - Verify `bg-red-500` still resolves correctly (inspect a BudgetPanel progress bar).
   - Check the Network tab for font file loads (should be 200 from local, not external CDN).
   - Check the Application tab > Manifest: verify `name`, `short_name`, `theme_color`, `background_color`.
4. Check offline mode: disconnect network, reload -- fonts should still render (service worker cache).

---

## Implementation Notes (What Was Actually Built)

**All plan items completed. No deviations.**

### Files Created
- `src/constants/theme.ts` — BLACKLIGHT_PALETTE (11 tokens), SEMANTIC_MAPPINGS (11), FONT_FAMILIES (3)
- `tests/theme/tokens.test.ts` — 14 tests (palette, semantic, font families)
- `public/fonts/` — 7 WOFF2 files (Orbitron 700, Inter 400/500/600/700, JetBrains Mono 400/500)

### Files Modified
- `src/index.css` — @font-face declarations, @theme block, @theme inline semantic tokens
- `vite.config.ts` — PWA manifest (GOLF FORGE, void colors), woff2 in globPatterns

### Code Review
Clean — no issues found. All plan items match implementation exactly.

### Test Results
- 266 tests passing (22 files), build passes
- Fonts extracted from @fontsource npm packages (installed temporarily, then removed)