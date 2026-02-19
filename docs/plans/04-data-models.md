# 04 - Data Models

## Hole Types

```typescript
type HoleType =
  | 'straight'
  | 'l-shape'
  | 'dogleg'
  | 'ramp'
  | 'loop'
  | 'windmill'
  | 'tunnel'

type HoleTypeDefinition = {
  type: HoleType
  label: string
  dimensions: { width: number; length: number }  // meters
  color: string                                   // hex, for 3D block
  defaultPar: number
}
```

### Phase 1 Hole Types (start with these)

| Type | Dimensions (w×l) | Color | Default Par |
|---|---|---|---|
| `straight` | 0.6 × 3.0m | `#4CAF50` (green) | 2 |
| `l-shape` | 1.2 × 2.5m | `#2196F3` (blue) | 3 |
| `dogleg` | 1.5 × 3.3m | `#FF9800` (orange) | 3 |
| `ramp` | 0.6 × 3.0m | `#9C27B0` (purple) | 3 |

Add `loop`, `windmill`, `tunnel` in Phase 2 when actual obstacle choices are made.

## Hole Instance

```typescript
type Hole = {
  id: string              // nanoid or crypto.randomUUID()
  type: HoleType
  position: {
    x: number             // meters from hall origin (left wall)
    z: number             // meters from hall origin (front wall)
  }
  rotation: 0 | 90 | 180 | 270   // degrees, cardinal only
  name: string                     // "Hole 1", "The Volcano", etc.
  par: number                      // 2-5, defaults from HoleTypeDefinition
}
```

## Hall (BORGA Specs — read-only)

```typescript
type Hall = {
  width: number           // 10.00m
  length: number          // 20.00m
  wallHeight: number      // 4.30m
  firstHeight: number     // 4.90m
  roofPitch: number       // 7 degrees
  wallThickness: number   // 0.10m (for rendering)
  frameSpacing: number[]  // [4.80, 5.00, 5.00, 4.80]
  doors: DoorSpec[]
  windows: WindowSpec[]
}

type DoorSpec = {
  id: string
  type: 'sectional' | 'pvc'
  width: number           // meters
  height: number          // meters
  wall: 'north' | 'south' | 'east' | 'west'
  offset: number          // meters from left edge of wall
}

type WindowSpec = {
  id: string
  width: number           // 3.00m
  height: number          // 1.10m
  wall: 'north' | 'south' | 'east' | 'west'
  offset: number          // meters from left edge of wall
  sillHeight: number      // meters from floor
}
```

**Note:** Exact door/window positions along walls are not specified in the BORGA offer. These will need to be decided during planning (or confirmed with BORGA). The data model supports arbitrary placement.

## Budget

```typescript
type BudgetCategory = {
  id: string
  name: string
  estimated: number       // EUR, pre-populated from feasibility study
  actual: number          // EUR, user enters as quotes come in
  notes: string
}
```

### Default Budget Categories (mid-range from feasibility study)

| Category | Estimated (EUR) |
|---|---|
| Hall (BORGA) | 108,000 |
| Mini golf course | 37,500 |
| Lighting (UV + emergency) | 7,500 |
| HVAC (heat pumps + ventilation) | 13,000 |
| Electrical installation | 12,500 |
| Plumbing and WC | 15,000 |
| Interior theming | 25,000 |
| Sound, POS, furniture | 10,000 |
| Fire safety | 3,450 |
| Permits and professional fees | 9,500 |
| Contingency (10%) | 13,250 |

## Zustand Store Shape

```typescript
type Store = {
  // Hall (read-only)
  hall: Hall

  // Holes
  holes: Record<string, Hole>
  holeOrder: string[]             // player flow sequence
  selectedId: string | null

  // Budget
  budget: Record<string, BudgetCategory>

  // UI (transient, NOT persisted)
  ui: {
    tool: 'select' | 'place' | 'move' | 'delete'
    placingType: HoleType | null  // set when tool is 'place'
    view: 'top' | '3d'
    sidebarTab: 'holes' | 'detail' | 'budget'
    snapEnabled: boolean
    showFlowPath: boolean
    isMobile: boolean             // derived from viewport width
  }

  // Actions
  addHole: (type: HoleType, position: { x: number; z: number }) => void
  removeHole: (id: string) => void
  updateHole: (id: string, updates: Partial<Hole>) => void
  reorderHoles: (fromIndex: number, toIndex: number) => void
  selectHole: (id: string | null) => void
  setTool: (tool: Store['ui']['tool']) => void
  updateBudget: (id: string, updates: Partial<BudgetCategory>) => void
}
```

### Persistence Config

```typescript
persist(storeCreator, {
  name: 'golf-planner-state',
  partialize: (state) => ({
    holes: state.holes,
    holeOrder: state.holeOrder,
    budget: state.budget,
  }),
})
```

Only layout and budget data survives page reload. UI state resets to defaults.
