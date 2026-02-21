# Section 03: Dark Theme Conversion + Branding

## Implementation Status: COMPLETE

### Actual Files Modified
- `tests/darkTheme.test.ts` — 8 grep-based verification tests
- `src/index.css` — Added text-secondary (#B0B0D8) and text-muted (#6E6E9A) semantic tokens
- `src/App.tsx` — bg-gray-100 → bg-surface
- 25 UI/builder component files — full dark theme conversion
- Code review fixes: SegmentPalette (3 unconverted branches), BudgetPanel (confidence badges, progress bar, progressColor), HoleLibrary (broken hovers), ExportButton/SaveManager (wrong bg token), HoleDetail/MobileDetailPanel (broken hover/active), BuilderUI (cancel/save button text), all input fields (added bg-surface text-primary)

### Deviations from Plan
- text-white kept on accent buttons instead of text-primary (visually equivalent)
- Snap button kept as accent-text instead of neon-green (semantic distinction is minor)

## Overview

This section converts all UI components from the current light-gray theme to the permanent GOLF FORGE dark/blacklight theme. It is a big-bang find-and-replace of Tailwind color classes across all UI components, plus removal of `uvMode ?` ternary styling in UI-layer files, and addition of the GOLF FORGE brand mark to the toolbar.

**Dependencies**: Section 02 (Theme Tokens + Fonts) must be completed first. The semantic tokens (`bg-surface`, `bg-surface-raised`, `text-primary`, `text-secondary`, `text-accent-text`, `border-subtle`, etc.) and font tokens (`font-display`, `font-body`, `font-mono`) defined in section 02 are consumed here.

**Blocks**: Section 04 (Data Panels) runs after this section because both edit BudgetPanel/CostPanel.

## Tests First

All tests go in `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/darkTheme.test.ts`.

The tests are grep-based verification tests that scan the source tree for remaining light-theme classes and UI-level uvMode ternaries. They use Node.js `fs` and `child_process` (or simple string matching) to verify the codebase state after conversion.

```
File: /mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/darkTheme.test.ts

Tests to implement (describe "Dark Theme Conversion"):

# Test: no remaining bg-white classes in src/components/ (grep verification)
  - Scan all .tsx files under src/components/ for the literal class string "bg-white"
  - Exceptions: none expected after conversion
  - Assert: zero matches

# Test: no remaining bg-gray-50 or bg-gray-100 classes in src/components/ui/ and src/components/builder/
  - These are light-only background classes
  - Assert: zero matches in UI/builder components
  - Note: bg-gray-100 in src/App.tsx root div is also converted

# Test: no remaining bg-gray-200 used as backgrounds in src/components/ui/
  - bg-gray-200 was used for inactive button backgrounds
  - Assert: zero matches in UI components (replaced with bg-surface-raised or bg-plasma)

# Test: no remaining text-gray-900, text-gray-800, text-gray-700 in src/components/ui/
  - These dark-on-light text colors no longer make sense
  - Assert: zero matches in UI components

# Test: no remaining border-gray-200 in src/components/ui/
  - Light-theme borders replaced with border-subtle (grid-ghost) or border-grid-ghost
  - Assert: zero matches

# Test: no remaining uvMode ternaries in UI components
  - Scan Toolbar.tsx, BottomToolbar.tsx, SidebarPanel.tsx, and all src/components/ui/*.tsx for "uvMode ?"
  - Assert: zero matches in UI files

# Test: 3D component files ARE still allowed to have uvMode ternaries
  - Files like HallFloor.tsx, HallWalls.tsx, FlowPath.tsx, FloorGrid.tsx, GhostHole.tsx, etc. can still reference uvMode
  - This test just documents the exception — it does NOT fail if uvMode is found in three/ components

# Test: App.tsx root div uses dark background class (bg-surface or bg-void)
  - The root div should no longer be bg-gray-100
  - Assert: App.tsx contains "bg-surface" or "bg-void" in the root div
```

## Implementation Details

### Strategy

Big-bang find-and-replace after the semantic tokens from section 02 are defined. The approach is:

1. Build a mapping table from light-theme Tailwind classes to dark-theme semantic equivalents.
2. Apply replacements across all UI components in a single pass.
3. Remove `uvMode ?` ternary conditional styling from all UI-layer files (the theme is now permanently dark, so there is no light/dark conditional).
4. Add GOLF FORGE brand mark to the toolbar.
5. Audit Lucide icon usage.

### Class Mapping Table

Use this mapping when converting each file. The left column is the current light-theme class; the right column is the dark-theme replacement.

**Backgrounds:**
| Current | Replacement | Notes |
|---------|-------------|-------|
| `bg-white` | `bg-surface-raised` | Panels, sidebars, modals, cards |
| `bg-gray-50` | `bg-surface-raised` | Subtle raised surfaces |
| `bg-gray-100` | `bg-surface` (for root) or `bg-surface-raised` | Depends on context |
| `bg-gray-200` | `bg-plasma` | Inactive buttons, dividers |
| `bg-gray-300` | `bg-grid-ghost` | Handles, drag bars |
| `bg-gray-800` | `bg-plasma` | Already-dark elements in UV ternaries |
| `bg-gray-900` | `bg-surface` | Already-dark elements in UV ternaries |

**Text:**
| Current | Replacement | Notes |
|---------|-------------|-------|
| `text-gray-900` | `text-primary` | Primary headings (felt-white) |
| `text-gray-800` | `text-primary` | Headings |
| `text-gray-700` | `text-primary` | Body text, labels |
| `text-gray-600` | `text-secondary` | Secondary text (felt-white at ~80% opacity or a muted variant) |
| `text-gray-500` | `text-secondary` | Labels, descriptions |
| `text-gray-400` | `text-muted` | Tertiary text, hints |
| `text-gray-300` | `text-secondary` | Was dark-mode text in UV ternaries |
| `text-white` | `text-primary` | Keep as `text-white` for buttons with colored backgrounds |

**Borders:**
| Current | Replacement | Notes |
|---------|-------------|-------|
| `border-gray-200` | `border-subtle` | Panel/card borders |
| `border-gray-100` | `border-subtle` | Lighter internal borders |
| `border-gray-300` | `border-subtle` | Input borders, dashed borders |
| `border-gray-700` | `border-subtle` | Already-dark borders in UV ternaries |
| `border-indigo-900` | `border-subtle` | UV-mode borders (ternary removal) |

**Interactive states (buttons):**
| Current | Replacement | Notes |
|---------|-------------|-------|
| `bg-blue-600 text-white` (active tool) | `bg-accent-text text-primary` | Primary active state using accent-text purple |
| `bg-blue-500` | `bg-accent-text` | Primary buttons |
| `bg-blue-50` | `bg-plasma` | Subtle blue backgrounds |
| `bg-blue-100 text-blue-700` | `bg-plasma text-neon-cyan` | Badge/chip backgrounds |
| `text-blue-600` | `text-accent-text` | Active tab text |
| `border-blue-600` | `border-accent-text` | Active tab indicator |
| `border-blue-500` | `border-accent-text` | Selected item borders |
| `bg-green-600 text-white` | `bg-neon-green/80 text-surface` | Success/save buttons |
| `bg-purple-600 text-white` | `bg-accent-text text-primary` | UV active state (was already purple) |
| `hover:bg-gray-100` | `hover:bg-plasma` | Hover states |
| `hover:bg-gray-200` | `hover:bg-plasma` | Hover states |
| `hover:bg-gray-300` | `hover:bg-grid-ghost` | Stronger hover states |
| `active:bg-gray-200` | `active:bg-plasma` | Touch press states |

**Status/semantic colors** (keep these as-is or map minimally):
| Current | Replacement | Notes |
|---------|-------------|-------|
| `bg-red-50 text-red-600` | `bg-neon-pink/10 text-neon-pink` | Delete buttons, errors |
| `bg-red-100 text-red-700` | `bg-neon-pink/15 text-neon-pink` | Error badges |
| `bg-amber-50 text-amber-700` | `bg-neon-amber/10 text-neon-amber` | Warning badges |
| `bg-green-100 text-green-700` | `bg-neon-green/15 text-neon-green` | Success badges |
| `text-green-600` | `text-neon-green` | VAT reclaimable text |
| `text-amber-600` | `text-neon-amber` | Inflation/warning text |
| `text-red-600` | `text-neon-pink` | Error text |
| `bg-amber-500 text-white` | `bg-neon-amber text-surface` | Sun preset active button |

**Disabled/cursor states** remain largely unchanged (`cursor-not-allowed`, `disabled:opacity-50`).

### Files to Modify

The following is the complete list of files requiring changes, grouped by type.

#### Root Layout
- **`/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/App.tsx`**
  - Root div: `bg-gray-100` to `bg-surface`
  - Remove the `uvMode` selector (no longer needed for UI styling; 3D Canvas still uses it internally)
  - Note: Canvas `shadows` prop still uses uvMode conditionally (this is a 3D concern, keep it)

#### Toolbar Components
- **`/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/ui/Toolbar.tsx`**
  - Remove all `uvMode ?` ternaries (there are 7 ternary blocks: barClass, btnClass, neutralBtnClass, smallBtnClass, dividerClass, snapBtnClass, flowBtnClass)
  - Replace with single dark-theme classes using semantic tokens
  - `barClass`: `"hidden items-center gap-1 border-b border-subtle bg-surface-raised px-3 py-2 md:flex"`
  - `btnClass(active)`: active = `"bg-accent-text text-primary"`, inactive = `"bg-plasma text-secondary hover:bg-grid-ghost"`
  - `neutralBtnClass`: `"rounded bg-plasma px-3 py-1.5 text-sm font-medium text-secondary transition-colors hover:bg-grid-ghost"`
  - `smallBtnClass`: same pattern with `px-2`
  - `dividerClass`: `"mx-2 h-6 w-px bg-grid-ghost"`
  - `snapBtnClass`: active = `"bg-neon-green text-surface"`, inactive = same as neutral
  - `flowBtnClass`: active = `"bg-accent-text text-primary"`, inactive = same as neutral
  - Add GOLF FORGE brand mark (see Branding section below)
  - Remove the `uvMode` store selector (it is no longer needed in this component after ternary removal)

- **`/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/ui/BottomToolbar.tsx`**
  - Remove all `uvMode ?` ternaries in `BottomToolbar`, `OverflowPopover`, and `ToggleBtn`
  - Container div: `"flex flex-col border-t border-subtle bg-surface-raised md:hidden"`
  - Info chip: `border-subtle` border, `text-secondary` and `text-muted` text
  - Placing chip: `bg-plasma text-accent-text` rounded-full chip, `text-muted` for close button
  - Tool buttons: active = `"bg-accent-text text-primary"`, inactive = `"text-secondary"`
  - Dividers: `"bg-grid-ghost"`
  - More button: `showOverflow ? "bg-plasma text-primary" : "text-secondary"`
  - OverflowPopover: `"border-subtle bg-surface-raised"` container
  - ToggleBtn: active = `"bg-accent-text text-primary"`, inactive = `"bg-plasma text-secondary"`
  - Remove the `uvMode` store selectors from all three sub-components

#### Sidebar
- **`/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/ui/Sidebar.tsx`**
  - Outer div: `"hidden h-full w-64 flex-col border-r border-subtle bg-surface-raised md:flex"`
  - Tab buttons border: `border-subtle`
  - Active tab: `"border-b-2 border-accent-text text-accent-text"`
  - Inactive tab: `"text-secondary hover:text-primary"`

#### Tab Content Panels
- **`/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/ui/HoleLibrary.tsx`**
  - Section headers: `text-secondary uppercase`
  - Hole type buttons: selected = `"border-accent-text bg-plasma"`, default = `"border-subtle hover:border-grid-ghost hover:bg-plasma"`
  - Type label: `text-primary` font-medium
  - Dimension text: `text-muted`
  - Template edit button: `text-muted hover:bg-plasma hover:text-secondary`
  - Build Custom Hole button: `"border-dashed border-grid-ghost text-secondary hover:border-neon-green hover:text-neon-green"`

- **`/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/ui/HoleDetail.tsx`**
  - Empty state text: `text-muted`
  - Labels: `text-secondary`
  - Inputs: `border-subtle bg-surface px-2 py-1 text-sm text-primary`
  - Rotation preset buttons: active = `"bg-accent-text text-primary"`, inactive = `"bg-plasma text-secondary hover:bg-grid-ghost"`
  - Position/dimension info: `text-muted`
  - Template info box: `"border-subtle bg-plasma"` with `text-secondary` and `text-primary` font-medium
  - Edit in Builder button: `"bg-plasma text-accent-text hover:bg-grid-ghost"`
  - Delete button: `"bg-neon-pink/10 text-neon-pink hover:bg-neon-pink/20"`

- **`/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/ui/BudgetPanel.tsx`**
  - Note: Section 04 handles the amber data styling. This section only handles structural dark-theme conversion (borders, backgrounds, basic text).
  - Summary header border: `border-subtle`
  - "Budget" label: `text-primary` font-semibold
  - Settings gear button: `text-muted hover:bg-plasma hover:text-secondary`
  - Warning badges: `bg-neon-pink/10 text-neon-pink` (critical), `bg-neon-amber/10 text-neon-amber` (warning), `bg-plasma text-neon-cyan` (info)
  - Labels like "Subtotal (net)": `text-secondary`
  - Category cards: `"border-subtle bg-surface-raised"` (was `border-gray-200 bg-white`)
  - Card header text: `text-primary`
  - Confidence badges: use dark theme badge colors (see mapping above)
  - Progress bar track: `bg-plasma` (was `bg-gray-100`)
  - Expanded area border: `border-subtle`
  - Input fields: `border-subtle bg-surface text-primary`
  - Footer border: `border-subtle`

- **`/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/ui/CourseBreakdown.tsx`**
  - Border: `border-subtle`
  - Headers: `text-primary`
  - Secondary text: `text-secondary`
  - Muted text: `text-muted`
  - Settings button: `text-muted hover:bg-plasma hover:text-secondary`
  - Divider: `border-subtle`

- **`/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/ui/ExpenseList.tsx`**
  - Expense items: `bg-plasma` (was `bg-gray-50`)
  - Labels: `text-secondary`, `text-muted`
  - Add expense form: `"border-subtle bg-plasma"`
  - Input fields: `border-subtle bg-surface text-primary`
  - Cancel button: `text-secondary hover:bg-grid-ghost`
  - Add button: `bg-accent-text text-primary hover:bg-accent-text/80`
  - Dashed add expense button: `"border-dashed border-grid-ghost text-muted hover:bg-plasma hover:text-secondary"`
  - Delete expense button: `text-muted hover:text-neon-pink`

#### Modals
- **`/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/ui/FinancialSettingsModal.tsx`**
  - Modal backdrop: `bg-black/30` (keep)
  - Modal content: `bg-surface-raised` (was `bg-white`)
  - Header border: `border-subtle`
  - Close button: `text-muted hover:bg-plasma hover:text-secondary`
  - Checkbox border: `border-grid-ghost`
  - Labels: `text-primary` for main, `text-muted` for descriptions
  - Section headers: `text-secondary uppercase`
  - Display mode buttons: active = `"bg-accent-text text-primary"`, inactive = `"bg-plasma text-secondary hover:bg-grid-ghost"`
  - Risk/Build option buttons: active = `"bg-plasma ring-1 ring-accent-text"`, inactive = `"bg-surface hover:bg-plasma"`
  - Option labels: `text-primary` for name, `text-muted` for description
  - Inflation input: `border-subtle bg-surface text-primary`
  - Footer: `border-subtle`
  - Done button: `bg-accent-text text-primary hover:bg-accent-text/80`

- **`/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/ui/CostSettingsModal.tsx`**
  - Same modal pattern as FinancialSettingsModal
  - Content: `bg-surface-raised`
  - Headers, borders, inputs, buttons: follow same mapping
  - Material tier select: `border-subtle bg-surface text-primary`
  - Cost input fields: `border-subtle bg-surface text-primary`
  - Professional mode read-only values: `text-secondary`
  - Warning text: `text-neon-amber`
  - Reset button: `text-secondary hover:bg-plasma`
  - Close button: `bg-accent-text text-primary`

#### Mobile Panels
- **`/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/ui/MobileDetailPanel.tsx`**
  - Full-screen bg: `bg-surface` (was `bg-white`)
  - Header border: `border-subtle`
  - Close button: `text-muted hover:bg-plasma hover:text-secondary`
  - Labels: `text-secondary`
  - Inputs: `border-subtle bg-surface-raised text-primary`
  - Rotation buttons: active = `"bg-accent-text text-primary"`, inactive = `"bg-plasma text-secondary active:bg-grid-ghost"`
  - Position/dimension info: `text-muted`
  - Template info box: `"border-subtle bg-plasma"`
  - Edit in Builder button: `"bg-plasma text-accent-text active:bg-grid-ghost"`
  - Delete button: `"bg-neon-pink/10 text-neon-pink active:bg-neon-pink/20"`

- **`/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/ui/MobileBudgetPanel.tsx`**
  - Full-screen bg: `bg-surface` (was `bg-white`)
  - Header border: `border-subtle`
  - Close button: `text-muted hover:bg-plasma hover:text-secondary`

- **`/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/ui/MobileSunControls.tsx`**
  - Full-screen bg: `bg-surface` (was `bg-white`)
  - Header border: `border-subtle`
  - Close button: `text-muted hover:bg-plasma hover:text-secondary`
  - Labels: `text-secondary`
  - Preset buttons inactive: `"bg-plasma text-primary active:bg-grid-ghost"` (was `bg-gray-100 text-gray-700`)
  - Active preset: `"bg-neon-amber text-surface"` (keep amber for sun controls)
  - Custom Date & Time button: same inactive pattern
  - Date/time inputs: `border-subtle bg-surface-raised text-primary`

- **`/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/ui/HoleDrawer.tsx`**
  - Backdrop: `bg-black/20` (keep)
  - Drawer bg: `bg-surface-raised` (was `bg-white`)
  - Handle bar: `bg-grid-ghost` (was `bg-gray-300`)
  - Header border: `border-subtle`
  - Header text: `text-primary`
  - Close button: `text-muted hover:text-secondary`
  - Hole type buttons: selected = `"border-accent-text bg-plasma"`, default = `"border-subtle active:bg-plasma"`
  - Dimension text: `text-muted`

#### Save/Export
- **`/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/ui/SaveManager.tsx`**
  - Closed state button: `"bg-plasma text-secondary hover:bg-grid-ghost"`
  - Open popover: `"border-subtle bg-surface-raised shadow-lg"`
  - Header text: `text-primary`
  - Close button: `text-muted hover:text-secondary`
  - Input: `border-subtle bg-surface text-primary`
  - Save button: `bg-accent-text text-primary hover:bg-accent-text/80 disabled:opacity-50`
  - Error text: `text-neon-pink`
  - Empty state: `text-muted`
  - Save list items: `bg-plasma`
  - Save name text: `text-primary`
  - Date text: `text-muted`
  - Rename/delete buttons: `text-muted`, hover: `hover:text-accent-text` / `hover:text-neon-pink`

- **`/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/ui/ExportButton.tsx`**
  - Button: `"bg-plasma text-secondary hover:bg-grid-ghost"`

#### Canvas/Overlay Components
- **`/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/ui/CanvasSkeleton.tsx`**
  - Container: `bg-surface` (was `bg-gray-100`)
  - Spinner border: `border-grid-ghost border-t-accent-text` (was `border-gray-300 border-t-blue-500`)
  - Text: `text-muted`

- **`/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/ui/KeyboardHelp.tsx`**
  - Already uses dark classes (`bg-gray-800/70`, `bg-gray-900/90`, `text-gray-300`). Minimal changes needed.
  - Button: `bg-surface-raised/70 text-secondary hover:bg-plasma/70`
  - Popup: `bg-surface/90 text-secondary`

- **`/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/ui/LocationBar.tsx`**
  - Already uses dark classes. Minimal changes.
  - Keep `bg-gray-900` as `bg-surface` and border classes as `border-subtle`

- **`/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/ui/MiniMap.tsx`**
  - Attribution div: `bg-surface/80 text-secondary` (was `bg-white/80 text-gray-600`)

- **`/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/ui/SunControls.tsx`**
  - Already uses dark classes (`bg-gray-800/70`). Convert to semantic tokens.
  - Preset buttons: use `bg-plasma/70 text-secondary hover:bg-grid-ghost/70`

#### Builder Components
- **`/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/builder/Builder.tsx`**
  - Root div: `bg-surface` (was `bg-gray-100`)

- **`/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/builder/BuilderUI.tsx`**
  - Top bar: `"border-b border-subtle bg-surface-raised"`
  - Input: `"border-subtle bg-surface text-primary"`
  - Range input labels: `text-secondary`
  - Undo/redo/remove buttons: `text-secondary hover:bg-plasma`
  - Delete selected: enabled = `"text-neon-pink hover:bg-neon-pink/10"`, disabled = `"cursor-not-allowed text-muted"`
  - Cancel button: `"bg-plasma text-secondary hover:bg-grid-ghost"`
  - Save button: enabled = `"bg-neon-green/80 text-surface hover:bg-neon-green/90"`, disabled = `"cursor-not-allowed bg-plasma text-muted"`
  - Mobile tab buttons: active = `"border-b-2 border-neon-green text-neon-green"`, inactive = `"text-secondary"`
  - Bottom panel / sidebar: `"border-subtle bg-surface-raised"`

- **`/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/builder/SegmentPalette.tsx`**
  - Replace mode banner: `"bg-neon-amber/10 text-neon-amber ring-1 ring-neon-amber/30"`
  - Category tabs: active = `"bg-neon-green/80 text-surface"`, inactive = `"bg-plasma text-secondary hover:bg-grid-ghost"`
  - Segment type buttons: active = `"border-neon-green bg-neon-green/10 text-neon-green"`, replace mode = `"border-neon-amber/50 bg-neon-amber/10 text-neon-amber"`, default = `"border-subtle bg-surface-raised text-secondary hover:bg-plasma"`

- **`/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/builder/ChainList.tsx`**
  - Empty state: `text-muted`
  - Stats text: `text-secondary`
  - Segment index number: `text-muted`
  - Segment button: selected = `"bg-neon-green/15 text-neon-green"`, default = `"text-secondary hover:bg-plasma"`

### GOLF FORGE Branding

Add the brand mark to the Toolbar component. Insert it as the first element inside the toolbar bar div, before the tool buttons.

```
Location: /mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/ui/Toolbar.tsx

- Add a <span> element with text "GOLF FORGE"
- Apply classes: "font-display text-sm font-bold tracking-wider text-accent-text"
  (font-display maps to Orbitron Bold per section 02's font tokens)
- Add a decorative neon glow via inline style or Tailwind arbitrary value:
  style={{ textShadow: "0 0 8px #9D00FF, 0 0 16px #9D00FF40" }}
  This uses neon-violet (#9D00FF) as a shadow color (decorative, not text color)
- The text COLOR is accent-text (#B94FFF) which passes WCAG AA on void/deep-space
- Do NOT use neon-violet (#9D00FF) as the text color (fails AA at 3.1:1)
- Follow the brand mark with a divider (<div className="mx-2 h-6 w-px bg-grid-ghost" />)
```

### uvMode Ternary Removal Strategy

The following 11 files currently have `uvMode ?` conditional styling. Split them into two groups:

**UI files (REMOVE ternaries)** -- replace with the dark-theme (formerly "UV") branch unconditionally, then convert that branch to semantic tokens:
- `src/components/ui/Toolbar.tsx` -- 7 ternary blocks
- `src/components/ui/BottomToolbar.tsx` -- multiple ternaries across 3 sub-components
- `src/App.tsx` -- the root div class (Note: keep the Canvas-level uvMode for shadows prop)

**3D/Three files (KEEP ternaries)** -- these switch between different 3D materials/colors for planning vs UV lighting, which is a different concern from UI theming:
- `src/components/three/ThreeCanvas.tsx`
- `src/components/three/HallFloor.tsx`
- `src/components/three/HallWalls.tsx`
- `src/components/three/FlowPath.tsx`
- `src/components/three/FloorGrid.tsx`
- `src/components/three/GhostHole.tsx`
- `src/components/three/HallOpenings.tsx`
- `src/components/three/holes/TemplateHoleModel.tsx`
- `src/components/three/holes/useMaterials.ts`

### Lucide Icon Audit

Scan the codebase for any remaining Unicode character icons that should be replaced with Lucide React components. The project already uses some Unicode characters for icons (arrows, close buttons, etc.). After the dark theme conversion, verify that all icons render well against the dark background. Specifically look for:
- `\u2196` (Select tool arrow)
- `+` (Place tool)
- `\u2715` (Close / Delete)
- `&#x21A9;` / `&#x21AA;` (Undo/Redo arrows)
- `&#x232B;` (Delete/Backspace)
- `\u2699` (Gear/settings)
- `&#x270E;` (Edit pencil)

These Unicode characters generally render fine on dark backgrounds and are already well-established in the codebase. Unless specific rendering issues are found, keep them as-is. The key consideration is that text color for these icons uses the new semantic tokens (`text-secondary`, `text-muted`, etc.) which are all high-contrast on the dark backgrounds.

### Implementation Order

1. Run the test file first to establish a baseline (all tests should FAIL before conversion).
2. Convert `src/index.css` additions are already done by section 02 (verify tokens exist).
3. Convert `src/App.tsx` root div.
4. Convert `src/components/ui/Toolbar.tsx` (including GOLF FORGE brand mark and ternary removal).
5. Convert `src/components/ui/BottomToolbar.tsx` (including ternary removal).
6. Convert `src/components/ui/Sidebar.tsx`.
7. Convert tab content panels: HoleLibrary, HoleDetail, BudgetPanel (structural only), CourseBreakdown, ExpenseList.
8. Convert modals: FinancialSettingsModal, CostSettingsModal.
9. Convert mobile panels: MobileDetailPanel, MobileBudgetPanel, MobileSunControls, HoleDrawer.
10. Convert utility components: SaveManager, ExportButton, CanvasSkeleton, KeyboardHelp, LocationBar, MiniMap, SunControls.
11. Convert builder components: Builder, BuilderUI, SegmentPalette, ChainList.
12. Run all tests. All dark-theme grep tests should pass.
13. Run `npm run check` (Biome lint + format) and fix any issues.
14. Run `npx tsc --noEmit` to verify no type errors.
15. Run `npm test` to verify existing test suite still passes.

### Semantic Token Reference (from Section 02)

For quick reference during implementation, the semantic tokens expected to be available after section 02:

- `bg-surface` -- void (#07071A), primary background
- `bg-surface-raised` -- deep-space (#0F0F2E), panels/sidebars
- `bg-plasma` -- plasma (#1A1A4A), cards/inactive buttons
- `bg-grid-ghost` -- grid-ghost (#2A2A5E), borders used as backgrounds
- `text-primary` -- felt-white (#E8E8FF), main body text
- `text-secondary` -- felt-white at reduced opacity or a mid-tone, secondary text
- `text-muted` -- a dim variant for hints/placeholders
- `text-accent` -- neon-violet (#9D00FF), decorative only (NOT for readable text)
- `text-accent-text` -- accent-text (#B94FFF), contrast-safe accent text
- `text-neon-cyan` -- neon-cyan (#00F5FF), data emphasis
- `text-neon-green` -- neon-green (#00FF88), success
- `text-neon-amber` -- neon-amber (#FFB700), warnings/costs
- `text-neon-pink` -- neon-pink (#FF0090), errors
- `border-subtle` -- grid-ghost (#2A2A5E)
- `font-display` -- Orbitron (Bold 700)
- `font-body` -- Inter
- `font-mono` -- JetBrains Mono