Good. Now I have full context. Let me generate the section content.

# Section 04: High-Contrast Data Panels

## Overview

This section applies high-contrast amber-on-dark styling to all financial data panels: BudgetPanel, CostSettingsModal, CourseBreakdown, ExpenseList, FinancialSettingsModal, and MobileBudgetPanel. Financial figures get neon-amber (#FFB700) text, numeric data uses JetBrains Mono font, and panel backgrounds use deep-space (#0F0F2E). The goal is WCAG AAA contrast compliance (9.2:1 on void, 7.7:1 on deep-space) for all financial data.

**Estimated effort**: 0.5 day

## Dependencies

- **section-02-theme-tokens** (must be complete): Provides the `@theme` block in `src/index.css` with all 11 base tokens, semantic mappings, and font tokens (`font-display`, `font-body`, `font-mono`). Also provides `@font-face` declarations for JetBrains Mono (400, 500) in `public/fonts/`.
- **section-03-dark-theme** (must be complete): Provides the big-bang Tailwind class replacement across all UI components. After section-03, all components already use dark semantic tokens (bg-surface, bg-surface-raised, text-primary, text-secondary, border-subtle, etc.) instead of the old light-theme classes (bg-white, bg-gray-*, text-gray-*). The `uvMode ?` ternaries in UI components have been removed.

This section applies **additional** data-panel-specific styling on top of the dark theme conversion. It does NOT re-do the dark theme work -- it refines financial panels with amber data coloring and monospace fonts that section-03 would not have applied.

## Semantic Tokens Reference (from section-02)

These tokens are defined in `src/index.css` and available as Tailwind utilities:

| Token | Hex | Use |
|-------|-----|-----|
| `void` | #07071A | Primary bg (bg-surface) |
| `deep-space` | #0F0F2E | Panels bg (bg-surface-raised) |
| `plasma` | #1A1A4A | Cards bg (bg-surface-elevated) |
| `grid-ghost` | #2A2A5E | Borders (border-subtle) |
| `neon-violet` | #9D00FF | Decorative accent only (borders, glows) |
| `accent-text` | #B94FFF | Accented readable text (~5.2:1 on void) |
| `neon-cyan` | #00F5FF | Data values |
| `neon-green` | #00FF88 | Success indicators |
| `neon-amber` | #FFB700 | Financial figures / warnings |
| `neon-pink` | #FF0090 | Errors |
| `felt-white` | #E8E8FF | Body text |

**Contrast on deep-space (#0F0F2E)** -- the panel background:
- neon-amber (#FFB700): ~7.7:1 (AAA) -- financial figures
- felt-white (#E8E8FF): ~11.5:1 (AAA) -- body text/labels
- accent-text (#B94FFF): ~4.3:1 (AA large/bold) -- accented labels
- neon-cyan (#00F5FF): ~9.5:1 (AAA) -- data values

**Font tokens**:
- `font-display` maps to "Orbitron" (branding only)
- `font-body` maps to "Inter" (general UI)
- `font-mono` maps to "JetBrains Mono" (numeric data)

## Tests (Write First)

All tests go in a new file: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/dataPanelStyling.test.ts`

These are grep-based verification tests that ensure the correct Tailwind classes appear in the data panel source files. This follows the same pattern as section-03's class auditing tests.

```
File: tests/dataPanelStyling.test.ts

Test suite: "High-Contrast Data Panels"

  describe "BudgetPanel financial styling"
    # Test: BudgetPanel contains neon-amber text class for financial figures
    - Read the source of BudgetPanel.tsx
    - Verify it contains references to the neon-amber color token for EUR amounts
    - The specific class name depends on how section-02 maps tokens (e.g., text-neon-amber or text-data)

    # Test: BudgetPanel containers use deep-space background
    - The summary header and footer sections should use bg-surface-raised (deep-space)

    # Test: BudgetPanel uses monospace font for numeric values
    - Financial figures (displayEur outputs) should be wrapped in elements with the font-mono class

  describe "CostSettingsModal financial styling"
    # Test: CostSettingsModal cost fields use neon-amber for prices
    - EUR values in the per-type cost list should use neon-amber text

    # Test: CostSettingsModal uses monospace font for cost inputs
    - Number inputs and display values should have font-mono applied

  describe "CourseBreakdown financial styling"
    # Test: CourseBreakdown subtotals use neon-amber text
    - Unit costs and subtotal amounts should use neon-amber

    # Test: CourseBreakdown total line uses neon-amber with font-mono
    - The "Course total" figure should be monospaced and amber-colored

  describe "ExpenseList financial styling"
    # Test: ExpenseList amounts use neon-amber text
    - Each expense row amount should use neon-amber

    # Test: ExpenseList uses monospace font for amounts
    - Amount figures should have font-mono class

  describe "No remaining light-only financial classes"
    # Test: No bg-gray-50 or bg-gray-100 in data panel files
    - Grep BudgetPanel.tsx, CostSettingsModal.tsx, CourseBreakdown.tsx, ExpenseList.tsx
    - These should have been removed in section-03, verify they stay removed

  describe "Contrast verification"
    # Test: Financial figures never use neon-violet for text color
    - neon-violet (#9D00FF) is 3.1:1 on void -- WCAG fail for text
    - Grep all data panel files, ensure no text-accent is used for readable text
```

### Test Implementation Notes

These tests read source files as strings (using `fs.readFileSync`) and verify the presence/absence of specific Tailwind class patterns. This is a practical approach for CSS-in-markup verification where rendering tests are not feasible (no @testing-library/react in this project).

The test stubs should look like:

```typescript
// tests/dataPanelStyling.test.ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const DATA_PANEL_FILES = [
  "src/components/ui/BudgetPanel.tsx",
  "src/components/ui/CostSettingsModal.tsx",
  "src/components/ui/CourseBreakdown.tsx",
  "src/components/ui/ExpenseList.tsx",
];

/** Read a source file as a string */
function readSrc(relativePath: string): string {
  return readFileSync(relativePath, "utf-8");
}

describe("High-Contrast Data Panels", () => {
  describe("BudgetPanel financial styling", () => {
    it("contains neon-amber text class for financial figures", () => {
      // Verify BudgetPanel.tsx contains the amber token class on EUR amount elements
    });

    it("uses deep-space background for summary sections", () => {
      // Verify bg-surface-raised appears in summary header/footer
    });

    it("uses monospace font for numeric values", () => {
      // Verify font-mono class appears for financial figure elements
    });
  });

  describe("CostSettingsModal financial styling", () => {
    it("uses neon-amber text for cost values", () => {
      // Verify amber token class on EUR values in cost list
    });

    it("uses monospace font for cost data", () => {
      // Verify font-mono on number inputs/displays
    });
  });

  describe("CourseBreakdown financial styling", () => {
    it("uses neon-amber for subtotals and totals", () => {
      // Verify amber token class on financial amounts
    });

    it("uses monospace font for financial figures", () => {
      // Verify font-mono on amount elements
    });
  });

  describe("ExpenseList financial styling", () => {
    it("uses neon-amber for expense amounts", () => {
      // Verify amber token class on individual expense amounts
    });

    it("uses monospace font for amounts", () => {
      // Verify font-mono on amount elements
    });
  });

  describe("no light-only classes remain", () => {
    it.each(DATA_PANEL_FILES)(
      "%s has no bg-gray-50 or bg-gray-100 classes",
      (filePath) => {
        // Read file, ensure no bg-gray-50 or bg-gray-100
      },
    );
  });

  describe("contrast safety", () => {
    it.each(DATA_PANEL_FILES)(
      "%s does not use text-accent for readable body text",
      (filePath) => {
        // Ensure neon-violet is not used as text color on financial data
      },
    );
  });
});
```

## Implementation Details

### Files to Modify

1. `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/ui/BudgetPanel.tsx`
2. `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/ui/MobileBudgetPanel.tsx`
3. `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/ui/CostSettingsModal.tsx`
4. `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/ui/CourseBreakdown.tsx`
5. `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/ui/ExpenseList.tsx`
6. `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/ui/FinancialSettingsModal.tsx`

### File to Create

1. `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/dataPanelStyling.test.ts`

### Styling Strategy

After section-03, these files will already have the base dark theme applied (bg-surface-raised instead of bg-white, text-primary instead of text-gray-700, etc.). This section applies an **additional layer** of data-panel-specific treatment:

1. **Financial figures get neon-amber text**: Every EUR amount display (the output of `displayEur()` / `formatEur()`) should use the neon-amber text token instead of the generic text-primary. This includes:
   - Subtotal (net) value
   - Risk buffer value
   - Budget Target value
   - Actual (spent) value
   - Inflated subtotal value
   - Per-category estimated/spent amounts
   - Per-category progress bar adjacent values
   - Course breakdown unit costs and subtotals
   - Expense amounts
   - Cost settings per-type values

2. **Monospace font for all numeric data**: Apply `font-mono` (which maps to JetBrains Mono per section-02's font tokens) to all elements displaying numeric financial data. Use 14px (`text-sm`) as the base size for financial figures -- this ensures readability with the monospace font on the dark background.

3. **Panel section backgrounds**: The BudgetPanel summary header (containing subtotal, risk buffer, budget target) and footer (containing the repeated risk buffer + budget target) should use `bg-surface-raised` (deep-space). Category cards should use `bg-surface-elevated` (plasma) to create visual hierarchy. The expanded edit sections within cards should use a slightly different treatment -- `bg-surface-raised` with a border-subtle top border.

4. **Warning/status badges**: The confidence tier badges, quote status badges, and budget health warnings need dark-theme-appropriate colors. Since the base Tailwind colors (bg-red-500, bg-amber-500, bg-green-100, etc.) are still available (section-02 preserves defaults), these can remain as-is OR be converted to use the theme tokens:
   - Critical warnings: neon-pink background with felt-white text
   - Warnings: neon-amber with void text  
   - Info: neon-cyan background with void text
   - The `progressColor()` function returns `bg-red-500`, `bg-amber-500`, `bg-blue-500` -- these remain functional since Tailwind defaults are preserved. However, consider switching to theme-token equivalents for visual consistency.

5. **Confidence tier badge updates**: Replace light-theme badge colors:
   - `fixed` tier: neon-green background (low opacity) with neon-green text
   - `low` tier: neon-cyan background (low opacity) with neon-cyan text
   - `medium` tier: neon-amber background (low opacity) with neon-amber text
   - `high` tier: neon-pink background (low opacity) with neon-pink text
   - `very_high` tier: neon-pink solid background with felt-white text

   Since Tailwind v4 with custom tokens may not auto-generate opacity variants, use explicit `bg-[#00FF8820]` arbitrary values or define additional tokens if needed.

6. **Quote status badge updates**: Similar to confidence tiers, convert from light-theme to dark-theme colors:
   - Expired: neon-pink text with dark pink tinted background
   - Expiring soon: neon-amber text with dark amber tinted background  
   - Quoted (valid): neon-green text with dark green tinted background

7. **Form inputs in expanded cards**: Input fields (`<input>`, `<textarea>`, `<select>`) need dark styling:
   - Background: a subtle elevation above the card (e.g., `bg-void` or `bg-[#0A0A25]`)
   - Border: border-subtle (grid-ghost)
   - Text: felt-white for input text, neon-amber for number inputs specifically
   - Placeholder text: a muted color (grid-ghost or similar)

8. **Reclaimable Vorsteuer**: Currently uses `text-green-600`. Switch to `text-neon-green` for consistency.

9. **Inflation adjustment display**: Currently uses `text-amber-600`. Switch to `text-neon-amber` for consistency.

### BudgetPanel.tsx Specific Changes

After section-03 has applied the base dark theme, apply these data-panel-specific refinements:

**Summary header section** (lines ~180-261 in current file):
- The "Subtotal (net)" label stays text-secondary (muted label)
- The subtotal **value** gets `text-neon-amber font-mono`
- The "Risk buffer" label stays text-secondary
- The risk buffer **value** gets `text-neon-amber font-mono`
- The "Budget Target" label gets `text-primary font-semibold`
- The budget target **value** gets `text-neon-amber font-mono text-sm font-bold`
- The "Actual (spent)" value gets `text-neon-amber font-mono`
- Inflation line values get `text-neon-amber font-mono`
- Reclaimable Vorsteuer values get `text-neon-green font-mono`

**Warning badges** (lines ~196-210):
- Critical: replace `bg-red-50 text-red-700` with dark equivalents
- Warning: replace `bg-amber-50 text-amber-700` with dark equivalents
- Info: replace `bg-blue-50 text-blue-700` with dark equivalents

**Category cards** (lines ~274-480):
- Card container: `bg-surface-elevated border-subtle` (already from section-03)
- Financial values within cards: add `font-mono text-neon-amber`
- Progress bar track: replace any remaining `bg-gray-100` with a darker track color
- Expanded section border: `border-subtle` (already from section-03)
- Input fields: dark-styled with `bg-void border-subtle text-primary` base, `font-mono text-neon-amber` for number inputs

**Footer section** (lines ~487-513):
- Same treatment as summary header for financial values

### CostSettingsModal.tsx Specific Changes

- Modal background: `bg-surface-raised` (already from section-03)
- Per-type cost values: `text-neon-amber font-mono` for both editable inputs and read-only displays
- Number inputs: `bg-void border-subtle font-mono text-neon-amber`
- Material tier select: dark-styled select element
- Override warning text: `text-neon-amber` (already amber-ish, just use theme token)

### CourseBreakdown.tsx Specific Changes

- Section border: `border-subtle`
- Breakdown line items: type label stays text-secondary, amounts get `text-neon-amber font-mono`
- Unit cost ("@ EUR X"): `text-neon-amber font-mono`
- Subtotal per type: `text-neon-amber font-mono font-medium`
- Course total value: `text-neon-amber font-mono font-semibold`
- Empty state text: text-secondary italic
- Override warning: `text-neon-amber`

### ExpenseList.tsx Specific Changes

- Expense count label: text-secondary
- Total amount: `text-neon-amber font-mono font-medium`
- Individual expense rows: `bg-surface-elevated` (replace `bg-gray-50`)
- Expense amounts: `text-neon-amber font-mono`
- Date/vendor text: text-secondary
- Note text: text-secondary (muted)
- Delete button hover: `hover:text-neon-pink`
- Add expense form inputs: `bg-void border-subtle text-primary`
- Add button: accent-styled (use neon-violet bg with felt-white text, or keep the existing blue but mapped to a theme token)
- "Add expense" dashed button: `border-subtle text-secondary`

### FinancialSettingsModal.tsx Specific Changes

- Modal background: `bg-surface-raised` (already from section-03)
- Section labels (uppercase): text-secondary
- Option buttons active state: replace `bg-blue-50 ring-blue-500` with neon-violet accent ring on plasma background
- Option buttons inactive state: `bg-surface-elevated` with hover treatment
- Percentage input: `font-mono` for the inflation number
- Inflation warning text: `text-neon-amber`
- Done button: accent-styled (neon-violet bg or keep blue mapped to accent)
- Checkbox: dark-styled

### MobileBudgetPanel.tsx Specific Changes

- Full-screen container: `bg-surface` (replace `bg-white`)
- Header border: `border-subtle`
- Close button: text-secondary with hover treatment
- Body: wraps BudgetPanel, which inherits the above changes

### Progress Bar Color Function

The `progressColor()` function in BudgetPanel.tsx returns `bg-red-500`, `bg-amber-500`, or `bg-blue-500`. These are standard Tailwind colors that are preserved (section-02 does NOT clear defaults). Options:
- **Keep as-is**: The red/amber/blue progress bars provide intuitive status indication even on dark backgrounds.
- **Map to theme tokens**: Use `bg-neon-pink` (overspent), `bg-neon-amber` (approaching limit), `bg-neon-cyan` (healthy). This provides more visual consistency with the blacklight aesthetic.

The recommended approach is to map to theme tokens for visual consistency.

The progress bar **track** (background of the bar) needs to change from `bg-gray-100` to a dark equivalent like `bg-[#1A1A3A]` or `bg-surface-elevated`.

### Implementation Checklist

1. Write the test file `tests/dataPanelStyling.test.ts`
2. Run tests (they will fail -- no amber/mono styling yet)
3. Update BudgetPanel.tsx:
   - Add `font-mono` and neon-amber classes to all `displayEur()` output elements
   - Update warning badge colors for dark theme
   - Update confidence tier badge colors
   - Update quote status badge colors
   - Update progress bar colors and track
   - Update form inputs in expanded sections
   - Update Vorsteuer display to use neon-green
4. Update CostSettingsModal.tsx:
   - Add `font-mono` and neon-amber to cost values
   - Dark-style form inputs
5. Update CourseBreakdown.tsx:
   - Add `font-mono` and neon-amber to financial figures
   - Update labels and borders
6. Update ExpenseList.tsx:
   - Add `font-mono` and neon-amber to amounts
   - Dark-style expense rows and form
7. Update FinancialSettingsModal.tsx:
   - Dark-style option buttons (active/inactive states)
   - Add font-mono to inflation input
   - Update inflation warning color
8. Update MobileBudgetPanel.tsx:
   - Ensure container uses dark theme (may already be done by section-03)
9. Run tests again (should pass)
10. Run `npx tsc --noEmit` to verify no TypeScript errors
11. Run `npm run check` (Biome lint + format) to verify code quality
12. Visual verification in browser: open Budget tab, verify amber numbers on dark background, verify JetBrains Mono renders for financial data

### Visual Tests (Deferred to Section 12)

The following Playwright screenshot tests will be created in section-12 to capture the final visual state of data panels:

- Screenshot: BudgetPanel with amber-on-dark styling (summary + category cards)
- Screenshot: CostPanel (CostSettingsModal) with financial data display
- Screenshot: ExpenseList with JetBrains Mono amounts
- Screenshot: CourseBreakdown with amber cost figures