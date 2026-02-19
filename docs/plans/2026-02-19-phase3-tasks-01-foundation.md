# Phase 3 — Tasks 1–3: Foundation

> Part of [Phase 3 Implementation Plan](./2026-02-19-phase3-implementation-index.md)
> Design: [Phase 3 Mobile + PWA Design](./2026-02-19-phase3-mobile-pwa-design.md) §1, §5

---

## Task 1: Add `activePanel` to UIState + Store

**Files:**
- Modify: `src/types/ui.ts`
- Modify: `src/store/store.ts`
- Create: `tests/store/activePanel.test.ts`

### Step 1: Write the failing test

Create `tests/store/activePanel.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { useStore } from "../../src/store";

describe("activePanel", () => {
	beforeEach(() => {
		useStore.setState({
			holes: {},
			holeOrder: [],
			selectedId: null,
			ui: {
				tool: "select",
				placingType: null,
				view: "top",
				sidebarTab: "holes",
				snapEnabled: false,
				showFlowPath: true,
				activePanel: null,
			},
		});
	});

	it("defaults to null", () => {
		expect(useStore.getState().ui.activePanel).toBeNull();
	});

	it("setActivePanel sets the panel", () => {
		useStore.getState().setActivePanel("holes");
		expect(useStore.getState().ui.activePanel).toBe("holes");
	});

	it("setActivePanel(null) clears the panel", () => {
		useStore.getState().setActivePanel("detail");
		useStore.getState().setActivePanel(null);
		expect(useStore.getState().ui.activePanel).toBeNull();
	});

	it("setActivePanel cycles through all valid values", () => {
		for (const panel of ["holes", "detail", "budget"] as const) {
			useStore.getState().setActivePanel(panel);
			expect(useStore.getState().ui.activePanel).toBe(panel);
		}
	});
});
```

### Step 2: Run test to verify it fails

```bash
npx vitest run tests/store/activePanel.test.ts
```

Expected: FAIL — `activePanel` doesn't exist on `UIState` yet.

### Step 3: Add `ActivePanel` type to `src/types/ui.ts`

Current file (`src/types/ui.ts`):
```ts
import type { HoleType } from "./hole";

export type Tool = "select" | "place" | "move" | "delete";
export type ViewMode = "top" | "3d";
export type SidebarTab = "holes" | "detail" | "budget";

export type UIState = {
	tool: Tool;
	placingType: HoleType | null;
	view: ViewMode;
	sidebarTab: SidebarTab;
	snapEnabled: boolean;
	showFlowPath: boolean;
};
```

Replace with:
```ts
import type { HoleType } from "./hole";

export type Tool = "select" | "place" | "move" | "delete";
export type ViewMode = "top" | "3d";
export type SidebarTab = "holes" | "detail" | "budget";
export type ActivePanel = "holes" | "detail" | "budget" | null;

export type UIState = {
	tool: Tool;
	placingType: HoleType | null;
	view: ViewMode;
	sidebarTab: SidebarTab;
	snapEnabled: boolean;
	showFlowPath: boolean;
	activePanel: ActivePanel;
};
```

### Step 4: Add `activePanel` to store defaults + action

In `src/store/store.ts`:

1. Add to `StoreActions` type (after `toggleFlowPath`):
```ts
setActivePanel: (panel: UIState["activePanel"]) => void;
```

2. Add to `DEFAULT_UI`:
```ts
const DEFAULT_UI: UIState = {
	tool: "select",
	placingType: null,
	view: "top",
	sidebarTab: "holes",
	snapEnabled: false,
	showFlowPath: true,
	activePanel: null,
};
```

3. Add action implementation (after `toggleFlowPath` action):
```ts
setActivePanel: (panel) => {
	set((state) => ({
		ui: { ...state.ui, activePanel: panel },
	}));
},
```

4. Update the `ActivePanel` import in store if needed — the type comes from `UIState["activePanel"]` so no extra import needed.

5. Update `tests/utils/store.test.ts` — add `activePanel: null` to the `beforeEach` reset object so existing tests don't break.

### Step 5: Run tests to verify they pass

```bash
npx vitest run
```

Expected: ALL tests pass (existing + new activePanel tests).

### Step 6: Also export `ActivePanel` from barrel

Check `src/types/index.ts` — if it re-exports from `ui.ts`, the new `ActivePanel` type should be included. Biome will auto-sort.

### Step 7: Commit

```bash
git add src/types/ui.ts src/store/store.ts tests/store/activePanel.test.ts tests/utils/store.test.ts
git commit -m "feat: add activePanel to UIState for mobile panel management"
```

---

## Task 2: Create `isMobile` Utility

**Files:**
- Create: `src/utils/isMobile.ts`
- Create: `tests/utils/isMobile.test.ts`

### Step 1: Write the test

Create `tests/utils/isMobile.test.ts`:

```ts
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
```

### Step 2: Run test to verify it fails

```bash
npx vitest run tests/utils/isMobile.test.ts
```

Expected: FAIL — module doesn't exist.

### Step 3: Create the utility

Create `src/utils/isMobile.ts`:

```ts
export const isMobile =
	typeof window !== "undefined"
		? window.matchMedia("(pointer: coarse)").matches
		: false;
```

### Step 4: Run tests to verify they pass

```bash
npx vitest run tests/utils/isMobile.test.ts
```

Expected: PASS.

### Step 5: Commit

```bash
git add src/utils/isMobile.ts tests/utils/isMobile.test.ts
git commit -m "feat: add isMobile utility for touch device detection"
```

---

## Task 3: CSS + HTML Meta Fixes

**Files:**
- Modify: `src/index.css`
- Modify: `index.html`

### Step 1: Update `src/index.css`

Current:
```css
@import "tailwindcss";
```

Replace with:
```css
@import "tailwindcss";

html,
body {
	overscroll-behavior: none;
}
```

This prevents pull-to-refresh and rubber-banding on mobile browsers that would interfere with canvas gestures.

### Step 2: Update `index.html` viewport meta

Current (`index.html:5`):
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

Replace with:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

`viewport-fit=cover` is needed for `env(safe-area-inset-bottom)` to work on iPhones with the home indicator bar.

### Step 3: Verify build

```bash
npm run build
```

Expected: Build succeeds with no errors.

### Step 4: Commit

```bash
git add src/index.css index.html
git commit -m "feat: add mobile CSS fixes (overscroll, viewport-fit)"
```
