# Phase 1 — Tasks 4–7: Types, Constants, Store

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the data layer — TypeScript types, BORGA hall constants, hole type definitions, and the Zustand store with all actions.

**Prereqs:** Task 3 complete (project scaffold running).

---

### Task 4: Define Shared TypeScript Types

**Files:**
- Create: `src/types/hall.ts`
- Create: `src/types/hole.ts`
- Create: `src/types/budget.ts`
- Create: `src/types/ui.ts`
- Create: `src/types/index.ts`

**Step 1: Create hall types**

Create `src/types/hall.ts`:

```typescript
export type Wall = "north" | "south" | "east" | "west";

export type DoorSpec = {
  id: string;
  type: "sectional" | "pvc";
  width: number;
  height: number;
  wall: Wall;
  offset: number;
};

export type WindowSpec = {
  id: string;
  width: number;
  height: number;
  wall: Wall;
  offset: number;
  sillHeight: number;
};

export type Hall = {
  width: number;
  length: number;
  wallHeight: number;
  firstHeight: number;
  roofPitch: number;
  wallThickness: number;
  frameSpacing: number[];
  doors: DoorSpec[];
  windows: WindowSpec[];
};
```

**Step 2: Create hole types**

Create `src/types/hole.ts`:

```typescript
export type HoleType =
  | "straight"
  | "l-shape"
  | "dogleg"
  | "ramp"
  | "loop"
  | "windmill"
  | "tunnel";

export type HoleRotation = 0 | 90 | 180 | 270;

export type Hole = {
  id: string;
  type: HoleType;
  position: { x: number; z: number };
  rotation: HoleRotation;
  name: string;
  par: number;
};

export type HoleTypeDefinition = {
  type: HoleType;
  label: string;
  dimensions: { width: number; length: number };
  color: string;
  defaultPar: number;
};
```

**Step 3: Create budget types**

Create `src/types/budget.ts`:

```typescript
export type BudgetCategory = {
  id: string;
  name: string;
  estimated: number;
  actual: number;
  notes: string;
};
```

**Step 4: Create UI types**

Create `src/types/ui.ts`:

```typescript
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

**Step 5: Create barrel export**

Create `src/types/index.ts`:

```typescript
export type { Hall, DoorSpec, WindowSpec, Wall } from "./hall";
export type { Hole, HoleType, HoleRotation, HoleTypeDefinition } from "./hole";
export type { BudgetCategory } from "./budget";
export type { Tool, ViewMode, SidebarTab, UIState } from "./ui";
```

**Step 6: Verify — build still passes**

Run: `npm run build`
Expected: No TypeScript errors.

**Step 7: Commit**

```bash
git add src/types/
git commit -m "feat: define shared TypeScript types for hall, holes, budget, UI"
```

---

### Task 5: Create Hall Constants from BORGA Specs

**Files:**
- Create: `src/constants/hall.ts`

**Step 1: Create hall constants**

Create `src/constants/hall.ts`:

```typescript
import type { Hall } from "../types";

/**
 * BORGA hall specifications from offer #015-659208.
 * Canonical source of truth — CLAUDE.md references this file.
 *
 * Door/window wall assignments and offsets are planning decisions,
 * not from the BORGA offer (which doesn't specify placement).
 */
export const HALL: Hall = {
  width: 10.0,
  length: 20.0,
  wallHeight: 4.3,
  firstHeight: 4.9,
  roofPitch: 7,
  wallThickness: 0.1,
  frameSpacing: [4.8, 5.0, 5.0, 4.8],
  doors: [
    {
      id: "door-sectional",
      type: "sectional",
      width: 3.5,
      height: 3.5,
      wall: "south",
      offset: 3.25,
    },
    {
      id: "door-pvc",
      type: "pvc",
      width: 0.9,
      height: 2.0,
      wall: "south",
      offset: 8.1,
    },
  ],
  windows: [
    {
      id: "window-1",
      width: 3.0,
      height: 1.1,
      wall: "east",
      offset: 2.0,
      sillHeight: 1.5,
    },
    {
      id: "window-2",
      width: 3.0,
      height: 1.1,
      wall: "east",
      offset: 10.0,
      sillHeight: 1.5,
    },
    {
      id: "window-3",
      width: 3.0,
      height: 1.1,
      wall: "west",
      offset: 2.0,
      sillHeight: 1.5,
    },
    {
      id: "window-4",
      width: 3.0,
      height: 1.1,
      wall: "west",
      offset: 10.0,
      sillHeight: 1.5,
    },
  ],
};
```

**Note:** Door/window wall assignments and offsets are initial planning guesses. The BORGA offer doesn't specify placement — the user will adjust these during planning.

**Step 2: Verify build**

Run: `npm run build`
Expected: No errors.

**Step 3: Commit**

```bash
git add src/constants/
git commit -m "feat: add BORGA hall constants from offer specs"
```

---

### Task 6: Create Hole Type Definitions

**Files:**
- Create: `src/constants/holeTypes.ts`
- Create: `src/constants/index.ts`

**Step 1: Create hole type definitions**

Create `src/constants/holeTypes.ts`:

```typescript
import type { HoleTypeDefinition } from "../types";

export const HOLE_TYPES: HoleTypeDefinition[] = [
  {
    type: "straight",
    label: "Straight",
    dimensions: { width: 0.6, length: 3.0 },
    color: "#4CAF50",
    defaultPar: 2,
  },
  {
    type: "l-shape",
    label: "L-Shape",
    dimensions: { width: 1.2, length: 2.5 },
    color: "#2196F3",
    defaultPar: 3,
  },
  {
    type: "dogleg",
    label: "Dogleg",
    dimensions: { width: 1.5, length: 3.3 },
    color: "#FF9800",
    defaultPar: 3,
  },
  {
    type: "ramp",
    label: "Ramp",
    dimensions: { width: 0.6, length: 3.0 },
    color: "#9C27B0",
    defaultPar: 3,
  },
];

export const HOLE_TYPE_MAP = Object.fromEntries(
  HOLE_TYPES.map((ht) => [ht.type, ht]),
) as Record<string, HoleTypeDefinition>;
```

**Step 2: Create constants barrel export**

Create `src/constants/index.ts`:

```typescript
export { HALL } from "./hall";
export { HOLE_TYPES, HOLE_TYPE_MAP } from "./holeTypes";
```

**Step 3: Verify build**

Run: `npm run build`
Expected: No errors.

**Step 4: Commit**

```bash
git add src/constants/
git commit -m "feat: add hole type definitions (straight, l-shape, dogleg, ramp)"
```

---

### Task 7: Build Zustand Store

**Files:**
- Create: `src/store/store.ts`
- Create: `src/store/index.ts`
- Create: `tests/utils/store.test.ts`

**Step 1: Write failing tests for store actions**

Create `tests/utils/store.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { useStore } from "../src/store";

describe("store", () => {
  beforeEach(() => {
    // Reset store to initial state before each test
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
      },
    });
  });

  describe("addHole", () => {
    it("adds a hole to the store and appends to holeOrder", () => {
      useStore.getState().addHole("straight", { x: 5, z: 10 });

      const state = useStore.getState();
      const holeIds = Object.keys(state.holes);
      expect(holeIds).toHaveLength(1);
      expect(state.holeOrder).toHaveLength(1);
      expect(state.holeOrder[0]).toBe(holeIds[0]);

      const hole = state.holes[holeIds[0]];
      expect(hole.type).toBe("straight");
      expect(hole.position).toEqual({ x: 5, z: 10 });
      expect(hole.rotation).toBe(0);
      expect(hole.par).toBe(2);
      expect(hole.name).toBe("Hole 1");
    });

    it("auto-increments hole names", () => {
      const store = useStore.getState();
      store.addHole("straight", { x: 1, z: 1 });
      store.addHole("ramp", { x: 3, z: 3 });

      const state = useStore.getState();
      const holes = state.holeOrder.map((id) => state.holes[id]);
      expect(holes[0].name).toBe("Hole 1");
      expect(holes[1].name).toBe("Hole 2");
    });
  });

  describe("removeHole", () => {
    it("removes a hole and its order entry", () => {
      useStore.getState().addHole("straight", { x: 5, z: 10 });
      const id = useStore.getState().holeOrder[0];

      useStore.getState().removeHole(id);

      const state = useStore.getState();
      expect(Object.keys(state.holes)).toHaveLength(0);
      expect(state.holeOrder).toHaveLength(0);
    });

    it("clears selectedId if the removed hole was selected", () => {
      useStore.getState().addHole("straight", { x: 5, z: 10 });
      const id = useStore.getState().holeOrder[0];
      useStore.getState().selectHole(id);
      expect(useStore.getState().selectedId).toBe(id);

      useStore.getState().removeHole(id);
      expect(useStore.getState().selectedId).toBeNull();
    });
  });

  describe("updateHole", () => {
    it("updates hole properties", () => {
      useStore.getState().addHole("straight", { x: 5, z: 10 });
      const id = useStore.getState().holeOrder[0];

      useStore.getState().updateHole(id, {
        name: "The Volcano",
        rotation: 90,
        par: 4,
      });

      const hole = useStore.getState().holes[id];
      expect(hole.name).toBe("The Volcano");
      expect(hole.rotation).toBe(90);
      expect(hole.par).toBe(4);
      expect(hole.position).toEqual({ x: 5, z: 10 }); // unchanged
    });
  });

  describe("selectHole", () => {
    it("selects a hole and switches to detail tab", () => {
      useStore.getState().addHole("straight", { x: 5, z: 10 });
      const id = useStore.getState().holeOrder[0];

      useStore.getState().selectHole(id);

      expect(useStore.getState().selectedId).toBe(id);
      expect(useStore.getState().ui.sidebarTab).toBe("detail");
    });

    it("deselects when null is passed", () => {
      useStore.getState().addHole("straight", { x: 5, z: 10 });
      const id = useStore.getState().holeOrder[0];
      useStore.getState().selectHole(id);
      useStore.getState().selectHole(null);

      expect(useStore.getState().selectedId).toBeNull();
    });
  });

  describe("setTool", () => {
    it("sets the active tool", () => {
      useStore.getState().setTool("place");
      expect(useStore.getState().ui.tool).toBe("place");
    });
  });

  describe("reorderHoles", () => {
    it("moves a hole in the order", () => {
      const store = useStore.getState();
      store.addHole("straight", { x: 1, z: 1 });
      store.addHole("ramp", { x: 3, z: 3 });
      store.addHole("dogleg", { x: 5, z: 5 });

      const order = useStore.getState().holeOrder;
      const [a, b, c] = order;

      useStore.getState().reorderHoles(2, 0); // move C to front

      expect(useStore.getState().holeOrder).toEqual([c, a, b]);
    });
  });
});
```

**Step 2: Run tests — verify they fail**

Run: `npx vitest run tests/utils/store.test.ts`
Expected: FAIL — `useStore` doesn't exist yet.

**Step 3: Implement the store**

Create `src/store/store.ts`:

```typescript
import { create } from "zustand";
import type {
  Hole,
  HoleType,
  BudgetCategory,
  UIState,
  Hall,
} from "../types";
import { HALL } from "../constants/hall";
import { HOLE_TYPE_MAP } from "../constants/holeTypes";

type StoreState = {
  hall: Hall;
  holes: Record<string, Hole>;
  holeOrder: string[];
  selectedId: string | null;
  budget: Record<string, BudgetCategory>;
  ui: UIState;
};

type StoreActions = {
  addHole: (type: HoleType, position: { x: number; z: number }) => void;
  removeHole: (id: string) => void;
  updateHole: (id: string, updates: Partial<Hole>) => void;
  reorderHoles: (fromIndex: number, toIndex: number) => void;
  selectHole: (id: string | null) => void;
  setTool: (tool: UIState["tool"]) => void;
  setPlacingType: (type: HoleType | null) => void;
  setView: (view: UIState["view"]) => void;
  setSidebarTab: (tab: UIState["sidebarTab"]) => void;
  toggleSnap: () => void;
  toggleFlowPath: () => void;
  updateBudget: (id: string, updates: Partial<BudgetCategory>) => void;
};

export type Store = StoreState & StoreActions;

const DEFAULT_UI: UIState = {
  tool: "select",
  placingType: null,
  view: "top",
  sidebarTab: "holes",
  snapEnabled: false,
  showFlowPath: true,
};

export const useStore = create<Store>()((set, get) => ({
  hall: HALL,
  holes: {},
  holeOrder: [],
  selectedId: null,
  budget: {},
  ui: DEFAULT_UI,

  addHole: (type, position) => {
    const id = crypto.randomUUID();
    const definition = HOLE_TYPE_MAP[type];
    const holeNumber = get().holeOrder.length + 1;

    const hole: Hole = {
      id,
      type,
      position,
      rotation: 0,
      name: `Hole ${holeNumber}`,
      par: definition?.defaultPar ?? 3,
    };

    set((state) => ({
      holes: { ...state.holes, [id]: hole },
      holeOrder: [...state.holeOrder, id],
      selectedId: id,
      ui: { ...state.ui, tool: "select", placingType: null, sidebarTab: "detail" },
    }));
  },

  removeHole: (id) => {
    set((state) => {
      const { [id]: _, ...remainingHoles } = state.holes;
      return {
        holes: remainingHoles,
        holeOrder: state.holeOrder.filter((hid) => hid !== id),
        selectedId: state.selectedId === id ? null : state.selectedId,
      };
    });
  },

  updateHole: (id, updates) => {
    set((state) => ({
      holes: {
        ...state.holes,
        [id]: { ...state.holes[id], ...updates },
      },
    }));
  },

  reorderHoles: (fromIndex, toIndex) => {
    set((state) => {
      const order = [...state.holeOrder];
      const [moved] = order.splice(fromIndex, 1);
      order.splice(toIndex, 0, moved);
      return { holeOrder: order };
    });
  },

  selectHole: (id) => {
    set((state) => ({
      selectedId: id,
      ui: id ? { ...state.ui, sidebarTab: "detail" } : state.ui,
    }));
  },

  setTool: (tool) => {
    set((state) => ({ ui: { ...state.ui, tool } }));
  },

  setPlacingType: (type) => {
    set((state) => ({
      ui: { ...state.ui, placingType: type, tool: type ? "place" : "select" },
    }));
  },

  setView: (view) => {
    set((state) => ({ ui: { ...state.ui, view } }));
  },

  setSidebarTab: (tab) => {
    set((state) => ({ ui: { ...state.ui, sidebarTab: tab } }));
  },

  toggleSnap: () => {
    set((state) => ({
      ui: { ...state.ui, snapEnabled: !state.ui.snapEnabled },
    }));
  },

  toggleFlowPath: () => {
    set((state) => ({
      ui: { ...state.ui, showFlowPath: !state.ui.showFlowPath },
    }));
  },

  updateBudget: (id, updates) => {
    set((state) => ({
      budget: {
        ...state.budget,
        [id]: { ...state.budget[id], ...updates },
      },
    }));
  },
}));
```

**Step 4: Create barrel export**

Create `src/store/index.ts`:

```typescript
export { useStore } from "./store";
export type { Store } from "./store";
```

**Step 5: Run tests — verify they pass**

Run: `npx vitest run tests/utils/store.test.ts`
Expected: All tests PASS.

**Step 6: Verify build**

Run: `npm run build`
Expected: No errors.

**Step 7: Commit**

```bash
git add src/store/ src/types/ src/constants/ tests/
git commit -m "feat: add Zustand store with hole CRUD, selection, and tool management"
```
