# Phase 1 — Tasks 12–17: Interaction (Place, Select, Move, Rotate, Delete)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build all hole interaction mechanics — browsing the hole library, placing holes on the floor, selecting, dragging, rotating, and deleting them.

**Prereqs:** Task 11 complete (hall rendering, grid, camera all working).

---

### Task 12: Build Hole Library Panel in Sidebar

**Files:**
- Create: `src/components/ui/HoleLibrary.tsx`
- Modify: `src/components/ui/Sidebar.tsx`

**Step 1: Create HoleLibrary component**

Create `src/components/ui/HoleLibrary.tsx`:

```tsx
import { HOLE_TYPES } from "../../constants";
import { useStore } from "../../store";
import type { HoleType } from "../../types";

export function HoleLibrary() {
  const placingType = useStore((s) => s.ui.placingType);
  const setPlacingType = useStore((s) => s.setPlacingType);

  function handleSelect(type: HoleType) {
    if (placingType === type) {
      setPlacingType(null); // deselect
    } else {
      setPlacingType(type);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-gray-500 uppercase">Hole Types</p>
      {HOLE_TYPES.map((ht) => (
        <button
          key={ht.type}
          onClick={() => handleSelect(ht.type)}
          className={`flex items-center gap-3 rounded-lg border p-2.5 text-left transition-colors ${
            placingType === ht.type
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
          }`}
        >
          <div
            className="h-8 w-8 rounded"
            style={{ backgroundColor: ht.color }}
          />
          <div>
            <p className="text-sm font-medium">{ht.label}</p>
            <p className="text-xs text-gray-400">
              {ht.dimensions.width}m × {ht.dimensions.length}m · Par {ht.defaultPar}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
```

**Step 2: Wire HoleLibrary into Sidebar**

Modify `src/components/ui/Sidebar.tsx` — replace the placeholder content in the `"holes"` tab:

```tsx
import { HoleLibrary } from "./HoleLibrary";
```

In the content area, replace the placeholder `<p>` tags:

```tsx
<div className="flex-1 overflow-y-auto p-3">
  {activeTab === "holes" && <HoleLibrary />}
  {activeTab === "detail" && (
    <p className="text-xs text-gray-400">Select a hole to see details</p>
  )}
  {activeTab === "budget" && (
    <p className="text-xs text-gray-400">Budget tracker — Phase 4</p>
  )}
</div>
```

**Step 3: Verify visually**

Run: `npm run dev`
Expected: Holes tab in sidebar shows 4 hole type cards with colored squares, names, dimensions, and par. Clicking a type highlights it in blue and sets the toolbar to "Place" mode.

**Step 4: Commit**

```bash
git add src/components/ui/HoleLibrary.tsx src/components/ui/Sidebar.tsx
git commit -m "feat: add hole library panel with type selection"
```

---

### Task 13: Implement Click-to-Place Hole Mechanics

**Files:**
- Create: `src/components/three/PlacementHandler.tsx`
- Create: `src/components/three/MiniGolfHole.tsx`
- Create: `src/components/three/PlacedHoles.tsx`
- Modify: `src/App.tsx`

**Step 1: Create the MiniGolfHole component**

Create `src/components/three/MiniGolfHole.tsx`:

```tsx
import { HOLE_TYPE_MAP } from "../../constants";
import type { Hole } from "../../types";

type Props = {
  hole: Hole;
  isSelected: boolean;
  onClick: () => void;
};

const HOLE_HEIGHT = 0.3;

export function MiniGolfHole({ hole, isSelected, onClick }: Props) {
  const definition = HOLE_TYPE_MAP[hole.type];
  if (!definition) return null;

  const { width, length } = definition.dimensions;
  const rotationRad = (hole.rotation * Math.PI) / 180;

  return (
    <group
      position={[hole.position.x, HOLE_HEIGHT / 2, hole.position.z]}
      rotation={[0, rotationRad, 0]}
    >
      <mesh onClick={(e) => { e.stopPropagation(); onClick(); }}>
        <boxGeometry args={[width, HOLE_HEIGHT, length]} />
        <meshStandardMaterial
          color={isSelected ? "#FFC107" : definition.color}
        />
      </mesh>
      {isSelected && (
        <lineSegments>
          <edgesGeometry
            args={[new THREE.BoxGeometry(width + 0.05, HOLE_HEIGHT + 0.05, length + 0.05)]}
          />
          <lineBasicMaterial color="#FF9800" linewidth={2} />
        </lineSegments>
      )}
    </group>
  );
}
```

**Important:** Add Three.js import at top:

```tsx
import * as THREE from "three";
```

**Step 2: Create PlacedHoles container**

Create `src/components/three/PlacedHoles.tsx`:

```tsx
import { useStore } from "../../store";
import { MiniGolfHole } from "./MiniGolfHole";

export function PlacedHoles() {
  const holes = useStore((s) => s.holes);
  const holeOrder = useStore((s) => s.holeOrder);
  const selectedId = useStore((s) => s.selectedId);
  const selectHole = useStore((s) => s.selectHole);

  return (
    <group>
      {holeOrder.map((id) => {
        const hole = holes[id];
        if (!hole) return null;
        return (
          <MiniGolfHole
            key={id}
            hole={hole}
            isSelected={selectedId === id}
            onClick={() => selectHole(id)}
          />
        );
      })}
    </group>
  );
}
```

**Step 3: Create placement handler (floor click → add hole)**

Create `src/components/three/PlacementHandler.tsx`:

```tsx
import { useStore } from "../../store";
import { HOLE_TYPE_MAP } from "../../constants";
import type { ThreeEvent } from "@react-three/fiber";

export function PlacementHandler() {
  const hall = useStore((s) => s.hall);
  const tool = useStore((s) => s.ui.tool);
  const placingType = useStore((s) => s.ui.placingType);
  const addHole = useStore((s) => s.addHole);
  const selectHole = useStore((s) => s.selectHole);

  function handleClick(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation();
    const point = e.point;

    if (tool === "place" && placingType) {
      const definition = HOLE_TYPE_MAP[placingType];
      if (!definition) return;

      // Clamp to hall bounds (simple: just ensure center is inside)
      const x = Math.max(
        definition.dimensions.width / 2,
        Math.min(hall.width - definition.dimensions.width / 2, point.x),
      );
      const z = Math.max(
        definition.dimensions.length / 2,
        Math.min(hall.length - definition.dimensions.length / 2, point.z),
      );

      addHole(placingType, { x, z });
    } else if (tool === "select") {
      // Clicked on floor with select tool = deselect
      selectHole(null);
    }
  }

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[hall.width / 2, -0.01, hall.length / 2]}
      onClick={handleClick}
      visible={false}
    >
      <planeGeometry args={[hall.width, hall.length]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
}
```

Note: This is an invisible plane that sits on the floor and captures clicks for placement. It's positioned at y=-0.01 so it doesn't z-fight with the visible floor.

**Step 4: Add components to App canvas**

In `src/App.tsx`, import and add inside `<Canvas>`:

```tsx
import { PlacementHandler } from "./components/three/PlacementHandler";
import { PlacedHoles } from "./components/three/PlacedHoles";
```

Add after `<Hall />`:

```tsx
<PlacementHandler />
<PlacedHoles />
```

**Step 5: Verify the full flow**

Run: `npm run dev`
Expected:
1. Click "Straight" in hole library → toolbar shows "Place" active
2. Click on the hall floor → colored block appears at click position
3. Hole auto-selected (yellow), sidebar switches to Detail tab
4. Tool switches back to "Select"
5. Click another hole type → place another hole
6. Click on floor with Select tool → deselects current hole

**Step 6: Commit**

```bash
git add src/components/three/
git commit -m "feat: implement click-to-place hole mechanics with floor raycasting"
```

---

### Task 14: Implement Hole Selection

Already implemented in Tasks 12-13 (clicking a hole in the canvas selects it, clicking floor deselects). This task adds the **Inspector/Detail panel** so you can see and edit the selected hole.

**Files:**
- Create: `src/components/ui/HoleDetail.tsx`
- Modify: `src/components/ui/Sidebar.tsx`

**Step 1: Create HoleDetail component**

Create `src/components/ui/HoleDetail.tsx`:

```tsx
import { useStore } from "../../store";
import { HOLE_TYPE_MAP } from "../../constants";
import type { HoleRotation } from "../../types";

export function HoleDetail() {
  const selectedId = useStore((s) => s.selectedId);
  const holes = useStore((s) => s.holes);
  const holeOrder = useStore((s) => s.holeOrder);
  const updateHole = useStore((s) => s.updateHole);
  const removeHole = useStore((s) => s.removeHole);

  if (!selectedId) {
    return <p className="text-xs text-gray-400">Select a hole to see details</p>;
  }

  const hole = holes[selectedId];
  if (!hole) return null;

  const definition = HOLE_TYPE_MAP[hole.type];
  const orderIndex = holeOrder.indexOf(selectedId);

  const rotations: HoleRotation[] = [0, 90, 180, 270];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div
          className="h-6 w-6 rounded"
          style={{ backgroundColor: definition?.color ?? "#999" }}
        />
        <span className="text-sm font-medium">
          #{orderIndex + 1} · {definition?.label}
        </span>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">Name</span>
        <input
          type="text"
          value={hole.name}
          onChange={(e) => updateHole(selectedId, { name: e.target.value })}
          className="rounded border border-gray-200 px-2 py-1 text-sm"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">Par</span>
        <input
          type="number"
          value={hole.par}
          min={1}
          max={6}
          onChange={(e) => updateHole(selectedId, { par: Number(e.target.value) })}
          className="rounded border border-gray-200 px-2 py-1 text-sm w-20"
        />
      </label>

      <div className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">Rotation</span>
        <div className="flex gap-1">
          {rotations.map((r) => (
            <button
              key={r}
              onClick={() => updateHole(selectedId, { rotation: r })}
              className={`rounded px-2.5 py-1 text-xs font-medium ${
                hole.rotation === r
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {r}°
            </button>
          ))}
        </div>
      </div>

      <div className="text-xs text-gray-400">
        Position: ({hole.position.x.toFixed(1)}, {hole.position.z.toFixed(1)})
      </div>

      <button
        onClick={() => removeHole(selectedId)}
        className="mt-2 rounded bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100"
      >
        Delete Hole
      </button>
    </div>
  );
}
```

**Step 2: Wire into Sidebar**

In `src/components/ui/Sidebar.tsx`, import and replace detail placeholder:

```tsx
import { HoleDetail } from "./HoleDetail";
```

```tsx
{activeTab === "detail" && <HoleDetail />}
```

**Step 3: Verify**

Run: `npm run dev`
Expected: Place a hole → auto-selects → Detail tab shows name, par, rotation buttons, position, delete. Edit name → updates. Change rotation → hole rotates in 3D. Delete → hole removed.

**Step 4: Commit**

```bash
git add src/components/ui/HoleDetail.tsx src/components/ui/Sidebar.tsx
git commit -m "feat: add hole detail panel with name, par, rotation, and delete"
```

---

### Task 15: Implement Drag-to-Reposition

**Files:**
- Modify: `src/components/three/MiniGolfHole.tsx`
- Modify: `src/components/three/PlacementHandler.tsx`

**Step 1: Add drag handling to MiniGolfHole**

Modify `src/components/three/MiniGolfHole.tsx` to support dragging:

```tsx
import { useState, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { HOLE_TYPE_MAP } from "../../constants";
import { useStore } from "../../store";
import type { Hole } from "../../types";

type Props = {
  hole: Hole;
  isSelected: boolean;
  onClick: () => void;
};

const HOLE_HEIGHT = 0.3;
const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

export function MiniGolfHole({ hole, isSelected, onClick }: Props) {
  const definition = HOLE_TYPE_MAP[hole.type];
  const updateHole = useStore((s) => s.updateHole);
  const hall = useStore((s) => s.hall);
  const tool = useStore((s) => s.ui.tool);
  const { camera, raycaster } = useThree();
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ x: number; z: number } | null>(null);

  if (!definition) return null;

  const { width, length } = definition.dimensions;
  const rotationRad = (hole.rotation * Math.PI) / 180;

  function handlePointerDown(e: THREE.Event) {
    if (tool !== "select" || !isSelected) return;
    e.stopPropagation();
    (e as any).target?.setPointerCapture?.((e as any).pointerId);
    dragStart.current = { x: hole.position.x, z: hole.position.z };
    setIsDragging(true);
  }

  function handlePointerMove(e: THREE.Event) {
    if (!isDragging || !dragStart.current) return;
    e.stopPropagation();

    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(floorPlane, intersection);

    if (intersection) {
      const x = Math.max(
        width / 2,
        Math.min(hall.width - width / 2, intersection.x),
      );
      const z = Math.max(
        length / 2,
        Math.min(hall.length - length / 2, intersection.z),
      );
      updateHole(hole.id, { position: { x, z } });
    }
  }

  function handlePointerUp(e: THREE.Event) {
    if (!isDragging) return;
    e.stopPropagation();
    setIsDragging(false);
    dragStart.current = null;
  }

  return (
    <group
      position={[hole.position.x, HOLE_HEIGHT / 2, hole.position.z]}
      rotation={[0, rotationRad, 0]}
    >
      <mesh
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerDown={handlePointerDown as any}
        onPointerMove={handlePointerMove as any}
        onPointerUp={handlePointerUp as any}
      >
        <boxGeometry args={[width, HOLE_HEIGHT, length]} />
        <meshStandardMaterial
          color={isDragging ? "#FFE082" : isSelected ? "#FFC107" : definition.color}
        />
      </mesh>
      {isSelected && (
        <lineSegments>
          <edgesGeometry
            args={[new THREE.BoxGeometry(width + 0.05, HOLE_HEIGHT + 0.05, length + 0.05)]}
          />
          <lineBasicMaterial color="#FF9800" />
        </lineSegments>
      )}
    </group>
  );
}
```

**Note:** The drag uses raycasting against the floor plane, not the mesh itself. This means the hole tracks the mouse accurately even when the cursor moves off the hole during a fast drag. Position is clamped to hall bounds.

**Step 2: Verify**

Run: `npm run dev`
Expected:
1. Place a hole, select it (click)
2. Click and drag the selected hole → it follows the mouse, clamped to hall bounds
3. Release → hole stays at new position
4. Detail panel updates position in real-time during drag

**Step 3: Commit**

```bash
git add src/components/three/MiniGolfHole.tsx
git commit -m "feat: implement drag-to-reposition for selected holes"
```

---

### Task 16: Implement Hole Rotation (already done in Task 14)

Rotation via the Detail panel buttons was implemented in Task 14. No additional work needed for Phase 1. Phase 2 will add a visual rotation handle in the 3D view.

---

### Task 17: Implement Hole Deletion via Delete Tool

**Files:**
- Modify: `src/components/three/MiniGolfHole.tsx`

**Step 1: Add delete-on-click when delete tool is active**

In `src/components/three/MiniGolfHole.tsx`, modify the `onClick` handler:

Replace the existing onClick:
```tsx
onClick={(e) => { e.stopPropagation(); onClick(); }}
```

With:
```tsx
onClick={(e) => {
  e.stopPropagation();
  if (tool === "delete") {
    removeHole(hole.id);
  } else {
    onClick();
  }
}}
```

Add `removeHole` to the destructured store values at the top of the component:
```tsx
const removeHole = useStore((s) => s.removeHole);
```

**Step 2: Add visual feedback for delete tool**

Add a hover color change when delete tool is active. Add state:

```tsx
const [isHovered, setIsHovered] = useState(false);
```

Add to the mesh:
```tsx
onPointerEnter={() => setIsHovered(true)}
onPointerLeave={() => setIsHovered(false)}
```

Update the color logic:
```tsx
color={
  isDragging
    ? "#FFE082"
    : tool === "delete" && isHovered
      ? "#EF5350"
      : isSelected
        ? "#FFC107"
        : definition.color
}
```

**Step 3: Change cursor when delete tool is active**

In `src/App.tsx`, add cursor style to the canvas container:

```tsx
const tool = useStore((s) => s.ui.tool);
```

On the canvas wrapper div:
```tsx
<div className="flex-1" style={{ cursor: tool === "delete" ? "crosshair" : "default" }}>
```

**Step 4: Verify**

Run: `npm run dev`
Expected:
1. Place some holes
2. Click "Delete" in toolbar → cursor becomes crosshair
3. Hover over a hole → turns red
4. Click → hole deleted
5. Switch back to "Select" → normal behavior

**Step 5: Commit**

```bash
git add src/components/three/MiniGolfHole.tsx src/App.tsx
git commit -m "feat: implement delete tool with hover feedback"
```
