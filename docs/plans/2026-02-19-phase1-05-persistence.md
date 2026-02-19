# Phase 1 — Tasks 18–19: Persistence (Auto-Save + JSON Export)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Auto-save layout state to localStorage so work survives page reloads, and provide JSON export for backup/sharing.

**Prereqs:** Task 17 complete (all interaction mechanics working).

---

### Task 18: Add Auto-Save with zustand/persist + partialize

**Files:**
- Modify: `src/store/store.ts`

**Step 1: Add persist middleware to the store**

Modify `src/store/store.ts`:

Add import:
```typescript
import { persist } from "zustand/middleware";
```

Wrap the store creator with `persist`. Change:

```typescript
export const useStore = create<Store>()((set, get) => ({
```

To:

```typescript
export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      // ... all existing state and actions unchanged ...
    }),
    {
      name: "golf-planner-state",
      partialize: (state) => ({
        holes: state.holes,
        holeOrder: state.holeOrder,
        budget: state.budget,
      }),
    },
  ),
);
```

**Important:** Only `holes`, `holeOrder`, and `budget` are persisted. All UI state (`selectedId`, `ui.*`) resets to defaults on reload. This is intentional — you don't want to reopen the app with "delete" tool active and a stale selection.

**Step 2: Verify persistence**

Run: `npm run dev`
1. Place 3-4 holes, arrange them
2. Refresh the page (F5)
Expected: All holes are still there in the same positions.
3. Open browser DevTools → Application → Local Storage
Expected: Key `golf-planner-state` with JSON containing `holes`, `holeOrder`.

**Step 3: Verify store tests still pass**

Run: `npx vitest run tests/utils/store.test.ts`
Expected: All tests pass. (Persist middleware doesn't affect in-memory test behavior.)

**Step 4: Commit**

```bash
git add src/store/store.ts
git commit -m "feat: add auto-save to localStorage with partialize (holes + budget only)"
```

---

### Task 19: Add JSON Export Button

**Files:**
- Create: `src/utils/exportLayout.ts`
- Create: `tests/utils/exportLayout.test.ts`
- Create: `src/components/ui/ExportButton.tsx`
- Modify: `src/components/ui/Toolbar.tsx`

**Step 1: Write failing test for export utility**

Create `tests/utils/exportLayout.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { buildExportData } from "../src/utils/exportLayout";
import type { Hole, BudgetCategory, Hall } from "../src/types";

describe("buildExportData", () => {
  it("builds a complete export object", () => {
    const holes: Record<string, Hole> = {
      "abc-123": {
        id: "abc-123",
        type: "straight",
        position: { x: 3, z: 5 },
        rotation: 0,
        name: "Hole 1",
        par: 2,
      },
      "def-456": {
        id: "def-456",
        type: "ramp",
        position: { x: 7, z: 12 },
        rotation: 90,
        name: "Hole 2",
        par: 3,
      },
    };
    const holeOrder = ["abc-123", "def-456"];
    const budget: Record<string, BudgetCategory> = {};
    const hall = { width: 10, length: 20 } as Hall;

    const result = buildExportData(holes, holeOrder, budget, hall);

    expect(result.version).toBe(1);
    expect(result.exportedAt).toBeDefined();
    expect(result.hall.width).toBe(10);
    expect(result.holes).toHaveLength(2);
    expect(result.holes[0].name).toBe("Hole 1");
    expect(result.holes[1].name).toBe("Hole 2");
  });

  it("exports holes in holeOrder sequence", () => {
    const holes: Record<string, Hole> = {
      "b": {
        id: "b", type: "ramp", position: { x: 1, z: 1 },
        rotation: 0, name: "Second", par: 3,
      },
      "a": {
        id: "a", type: "straight", position: { x: 2, z: 2 },
        rotation: 0, name: "First", par: 2,
      },
    };
    const holeOrder = ["a", "b"];

    const result = buildExportData(holes, holeOrder, {}, { width: 10, length: 20 } as Hall);

    expect(result.holes[0].name).toBe("First");
    expect(result.holes[1].name).toBe("Second");
  });
});
```

**Step 2: Run test — verify failure**

Run: `npx vitest run tests/utils/exportLayout.test.ts`
Expected: FAIL — `buildExportData` doesn't exist.

**Step 3: Implement export utility**

Create `src/utils/exportLayout.ts`:

```typescript
import type { Hole, BudgetCategory, Hall } from "../types";

export type ExportData = {
  version: number;
  exportedAt: string;
  hall: { width: number; length: number };
  holes: Hole[];
  budget: BudgetCategory[];
};

export function buildExportData(
  holes: Record<string, Hole>,
  holeOrder: string[],
  budget: Record<string, BudgetCategory>,
  hall: Hall,
): ExportData {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    hall: { width: hall.width, length: hall.length },
    holes: holeOrder.map((id) => holes[id]).filter(Boolean),
    budget: Object.values(budget),
  };
}

export function downloadJson(data: ExportData) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `golf-layout-${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
```

**Step 4: Run test — verify pass**

Run: `npx vitest run tests/utils/exportLayout.test.ts`
Expected: All tests PASS.

**Step 5: Create ExportButton component**

Create `src/components/ui/ExportButton.tsx`:

```tsx
import { useStore } from "../../store";
import { buildExportData, downloadJson } from "../../utils/exportLayout";

export function ExportButton() {
  const holes = useStore((s) => s.holes);
  const holeOrder = useStore((s) => s.holeOrder);
  const budget = useStore((s) => s.budget);
  const hall = useStore((s) => s.hall);

  function handleExport() {
    const data = buildExportData(holes, holeOrder, budget, hall);
    downloadJson(data);
  }

  return (
    <button
      onClick={handleExport}
      className="rounded bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
    >
      Export JSON
    </button>
  );
}
```

**Step 6: Add ExportButton to Toolbar**

In `src/components/ui/Toolbar.tsx`, import and add after the tool buttons:

```tsx
import { ExportButton } from "./ExportButton";
```

Add inside the toolbar div, after the tool buttons with a separator:

```tsx
<div className="ml-auto">
  <ExportButton />
</div>
```

**Step 7: Verify the full flow**

Run: `npm run dev`
1. Place a few holes
2. Click "Export JSON" in toolbar
Expected: Browser downloads a `golf-layout-2026-02-19.json` file containing version, hall dimensions, and all holes in order.

**Step 8: Run all tests**

Run: `npx vitest run`
Expected: All tests pass (store tests + export tests).

**Step 9: Final build check**

Run: `npm run build`
Expected: Build succeeds, no errors.

**Step 10: Commit**

```bash
git add src/utils/ src/components/ui/ExportButton.tsx src/components/ui/Toolbar.tsx tests/
git commit -m "feat: add JSON export with layout data and auto-save to localStorage"
```

---

## Phase 1 Complete

At this point, the app supports:
- Viewing the BORGA hall from top-down with walls, doors, windows, and grid
- Browsing 4 hole types in the sidebar library
- Placing holes by clicking on the floor
- Selecting holes to view/edit details (name, par, rotation)
- Dragging holes to reposition within hall bounds
- Deleting holes via the delete tool or detail panel
- Auto-saving to localStorage (survives page refresh)
- Exporting layout as JSON file

**Next:** See `docs/plans/06-phases.md` for Phase 2 scope (3D toggle, collision, flow path, snap, undo/redo).
