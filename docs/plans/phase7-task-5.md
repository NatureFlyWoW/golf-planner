# Phase 7 — Task 5: Hall + Canvas Elements

**Depends on:** Task 1 (uvMode must exist in store)

7 files, each reads `uvMode` from store and conditionally swaps colors.

---

## File 1: HallFloor.tsx

**File:** `src/components/three/HallFloor.tsx`

### Current (full file, 12 lines):
```typescript
import { useStore } from "../../store";

export function HallFloor() {
	const { width, length } = useStore((s) => s.hall);

	return (
		<mesh rotation={[-Math.PI / 2, 0, 0]} position={[width / 2, 0, length / 2]}>
			<planeGeometry args={[width, length]} />
			<meshStandardMaterial color="#E0E0E0" />
		</mesh>
	);
}
```

### Replace with:
```typescript
import { useStore } from "../../store";

export function HallFloor() {
	const { width, length } = useStore((s) => s.hall);
	const uvMode = useStore((s) => s.ui.uvMode);

	return (
		<mesh rotation={[-Math.PI / 2, 0, 0]} position={[width / 2, 0, length / 2]}>
			<planeGeometry args={[width, length]} />
			<meshStandardMaterial color={uvMode ? "#0A0A1A" : "#E0E0E0"} />
		</mesh>
	);
}
```

---

## File 2: HallWalls.tsx

**File:** `src/components/three/HallWalls.tsx`

### Current line 6:
```typescript
	const color = "#B0B0B0";
```

### Replace with:
```typescript
	const uvMode = useStore((s) => s.ui.uvMode);
	const color = uvMode ? "#1A1A2E" : "#B0B0B0";
```

No other changes. The `useStore` import is already present.

---

## File 3: HallOpenings.tsx

**File:** `src/components/three/HallOpenings.tsx`

Two sub-components need UV colors: `Door` and `Window`.

### Door component — add uvMode prop

Update the `Door` function signature to accept `uvMode`:

**Current (lines 41-68):**
```typescript
function Door({
	door,
	hallWidth,
	hallLength,
}: {
	door: DoorSpec;
	hallWidth: number;
	hallLength: number;
}) {
	// ...
	const color = door.type === "sectional" ? "#4CAF50" : "#81C784";
	// ...
}
```

**Replace the color line with:**
```typescript
function Door({
	door,
	hallWidth,
	hallLength,
	uvMode,
}: {
	door: DoorSpec;
	hallWidth: number;
	hallLength: number;
	uvMode: boolean;
}) {
	// ...
	const color = uvMode
		? "#001A00"
		: door.type === "sectional"
			? "#4CAF50"
			: "#81C784";
	// ...
```

And add emissive properties to the door material if in UV mode. Replace the `<meshStandardMaterial>` line:

**Current:**
```tsx
<meshStandardMaterial color={color} side={2} />
```

**Replace with:**
```tsx
<meshStandardMaterial
	color={color}
	side={2}
	emissive={uvMode ? "#00FF44" : "#000000"}
	emissiveIntensity={uvMode ? 0.3 : 0}
/>
```

### Window component — add uvMode prop

**Current signature (lines 70-80):**
```typescript
function Window({
	window: win,
	hallWidth,
	hallLength,
	sunExposure,
}: {
	window: WindowSpec;
	hallWidth: number;
	hallLength: number;
	sunExposure: number;
}) {
```

**Add `uvMode: boolean` to props.**

Replace the color logic:

**Current (line 93):**
```typescript
	const color = sunExposure > 0 ? "#FFD54F" : "#64B5F6";
```

**Replace with:**
```typescript
	const color = uvMode ? "#3300AA" : sunExposure > 0 ? "#FFD54F" : "#64B5F6";
```

Replace the material:

**Current:**
```tsx
<meshStandardMaterial
	color={color}
	opacity={sunExposure > 0 ? 0.8 : 1}
	transparent={sunExposure > 0}
	side={2}
/>
```

**Replace with:**
```tsx
<meshStandardMaterial
	color={color}
	opacity={uvMode ? 0.6 : sunExposure > 0 ? 0.8 : 1}
	transparent={uvMode || sunExposure > 0}
	side={2}
/>
```

### HallOpenings parent — read uvMode and pass down

**In `HallOpenings` function (line 112):**

Add after the `exposure` calculation:
```typescript
	const uvMode = useStore((s) => s.ui.uvMode);
```

**Pass `uvMode` to Door and Window:**

Change Door render:
```tsx
<Door key={door.id} door={door} hallWidth={width} hallLength={length} uvMode={uvMode} />
```

Change Window render:
```tsx
<Window
	key={win.id}
	window={win}
	hallWidth={width}
	hallLength={length}
	sunExposure={exposure[win.wall as keyof typeof exposure] ?? 0}
	uvMode={uvMode}
/>
```

---

## File 4: FloorGrid.tsx

**File:** `src/components/three/FloorGrid.tsx`

### Current (full file):
```typescript
import { Grid } from "@react-three/drei";
import { useStore } from "../../store";

export function FloorGrid() {
	const { width, length } = useStore((s) => s.hall);

	return (
		<Grid
			position={[width / 2, 0.01, length / 2]}
			args={[width, length]}
			cellSize={1}
			cellThickness={0.5}
			cellColor="#cccccc"
			sectionSize={5}
			sectionThickness={1}
			sectionColor="#999999"
			fadeDistance={50}
			infiniteGrid={false}
		/>
	);
}
```

### Replace with:
```typescript
import { Grid } from "@react-three/drei";
import { useStore } from "../../store";

export function FloorGrid() {
	const { width, length } = useStore((s) => s.hall);
	const uvMode = useStore((s) => s.ui.uvMode);

	return (
		<Grid
			position={[width / 2, 0.01, length / 2]}
			args={[width, length]}
			cellSize={1}
			cellThickness={uvMode ? 0.3 : 0.5}
			cellColor={uvMode ? "#2A2A5E" : "#cccccc"}
			sectionSize={5}
			sectionThickness={uvMode ? 0.5 : 1}
			sectionColor={uvMode ? "#2A2A5E" : "#999999"}
			fadeDistance={50}
			infiniteGrid={false}
		/>
	);
}
```

---

## File 5: FlowPath.tsx

**File:** `src/components/three/FlowPath.tsx`

### Add `uvMode` read (after existing `useStore` calls, around line 9):
```typescript
	const uvMode = useStore((s) => s.ui.uvMode);
```

### Update Line color (line 27):
**Current:** `color="white"`
**Replace:** `color={uvMode ? "#00FFFF" : "white"}`

### Update Text color and outlineColor (lines 46-50):
**Current:**
```tsx
<Text
	fontSize={0.35}
	color="white"
	anchorX="center"
	anchorY="middle"
	outlineWidth={0.03}
	outlineColor="black"
>
```

**Replace:**
```tsx
<Text
	fontSize={0.35}
	color={uvMode ? "#00FFFF" : "white"}
	anchorX="center"
	anchorY="middle"
	outlineWidth={0.03}
	outlineColor={uvMode ? "#0A0A1A" : "black"}
>
```

---

## File 6: GhostHole.tsx

**File:** `src/components/three/GhostHole.tsx`

### Add store import and uvMode read

**Add import (after existing imports, line 4):**
```typescript
import { useStore } from "../../store";
```

**Add at top of component body (after line 22):**
```typescript
	const uvMode = useStore((s) => s.ui.uvMode);
```

### Update color constants (lines 7-8):

**Current:**
```typescript
const GREEN = new THREE.Color("#4CAF50");
const RED = new THREE.Color("#EF5350");
```

These are module-level constants and can't read uvMode. Instead, compute color inline:

**Replace lines 7-8 with:**
```typescript
const GREEN = new THREE.Color("#4CAF50");
const RED = new THREE.Color("#EF5350");
const UV_GREEN = new THREE.Color("#00FF66");
const UV_RED = new THREE.Color("#FF3333");
```

**Update the color assignment (currently line 24):**
```typescript
	const color = isValid ? GREEN : RED;
```
**Replace with:**
```typescript
	const color = isValid
		? (uvMode ? UV_GREEN : GREEN)
		: (uvMode ? UV_RED : RED);
```

**Update the useMemo deps (currently line 35 `[color]`):**
The `color` variable now depends on `uvMode` and `isValid`. The existing dep `[color]` is correct since `color` changes when `uvMode` or `isValid` changes.

---

## File 7: SunIndicator.tsx

**File:** `src/components/three/SunIndicator.tsx`

### Add uvMode read at top of component:
```typescript
	const uvMode = useStore((s) => s.ui.uvMode);
```

`useStore` is already imported.

### Hide in UV mode — early return after hooks:

**Add after the `useMemo` block (before the existing `if (!visible) return null;` on line 48):**
```typescript
	if (uvMode) return null;
```

**Important:** This must come AFTER all hooks (useEffect, useMemo) to avoid conditional hook calls. Place it right before the existing `if (!visible)` check.

---

## Verify

```bash
cd /mnt/c/Users/Caus/Golf_Plan/golf-planner
export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)"
npm run check && npx tsc --noEmit
```

Expected: Clean pass.

## Commit

```bash
git add src/components/three/HallFloor.tsx src/components/three/HallWalls.tsx src/components/three/HallOpenings.tsx src/components/three/FloorGrid.tsx src/components/three/FlowPath.tsx src/components/three/GhostHole.tsx src/components/three/SunIndicator.tsx
git commit -m "feat(phase7): add UV color switching to hall, grid, flow path, ghost, sun indicator"
```
