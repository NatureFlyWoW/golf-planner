# Phase 6 — Tasks 1-2: Shared Module + Dispatcher + Integration

## Task 1: Create shared.ts — Constants, Materials, and Reusable Components

**Files:**
- Create: `src/components/three/holes/shared.ts`

**Context:** Every hole model shares the same visual language: green felt playing surface, white bumpers, yellow tee marker, black cup. This module exports everything shared so individual hole components stay DRY.

**Step 1: Create the shared module**

```typescript
// src/components/three/holes/shared.ts
import * as THREE from "three";

// ── Colors ──────────────────────────────────────────────
export const FELT_COLOR = "#2E7D32"; // dark green
export const BUMPER_COLOR = "#F5F5F5"; // near-white
export const TEE_COLOR = "#FDD835"; // yellow
export const CUP_COLOR = "#212121"; // near-black

// ── Dimensions ──────────────────────────────────────────
export const BUMPER_HEIGHT = 0.08; // 8cm tall
export const BUMPER_THICKNESS = 0.05; // 5cm wide
export const SURFACE_THICKNESS = 0.02; // 2cm thick felt
export const TEE_RADIUS = 0.03; // 3cm
export const CUP_RADIUS = 0.054; // 5.4cm

// ── Model Heights (max Y extent per type, for selection outline) ──
export const MODEL_HEIGHTS: Record<string, number> = {
	straight: BUMPER_HEIGHT + SURFACE_THICKNESS,
	"l-shape": BUMPER_HEIGHT + SURFACE_THICKNESS,
	dogleg: BUMPER_HEIGHT + SURFACE_THICKNESS,
	ramp: 0.15 + BUMPER_HEIGHT + SURFACE_THICKNESS, // ramp plateau + bumper
	loop: 0.7, // torus arch extends ~0.6m + base
	windmill: 0.35, // pillar height
	tunnel: 0.35, // half-cylinder arch height
};

// ── Shared Materials (module-level singletons — DO NOT set emissive on these) ──
export const feltMaterial = new THREE.MeshStandardMaterial({
	color: FELT_COLOR,
	roughness: 0.9,
	metalness: 0,
	polygonOffset: true,
	polygonOffsetFactor: -1,
});

export const bumperMaterial = new THREE.MeshStandardMaterial({
	color: BUMPER_COLOR,
	roughness: 0.3,
	metalness: 0.1,
});

export const teeMaterial = new THREE.MeshStandardMaterial({
	color: TEE_COLOR,
	roughness: 0.5,
	metalness: 0,
});

export const cupMaterial = new THREE.MeshStandardMaterial({
	color: CUP_COLOR,
	roughness: 0.5,
	metalness: 0,
});
```

**Step 2: Verify it compiles**

Run: `cd /mnt/c/Users/Caus/Golf_Plan/golf-planner && export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)" && npx tsc --noEmit`
Expected: No errors from shared.ts

**Step 3: Commit**

```bash
git add src/components/three/holes/shared.ts
git commit -m "feat(phase6): add shared constants and materials for 3D hole models"
```

---

## Task 2: Create HoleModel Dispatcher + Integrate into MiniGolfHole

**Files:**
- Create: `src/components/three/holes/HoleModel.tsx`
- Modify: `src/components/three/MiniGolfHole.tsx`

**Context:** `HoleModel` dispatches to the correct per-type component. Initially, all types fall back to a simple colored box (placeholder) so the app works identically to before. Individual type components are added in Tasks 3-9.

`MiniGolfHole.tsx` changes:
1. The interaction mesh becomes **invisible** (`visible` toggles based on state)
2. The interaction mesh material shows tint color during drag/select/delete-hover
3. `HoleModel` renders as a sibling visual child
4. Selection outline uses `MODEL_HEIGHTS[type]` instead of fixed `HOLE_HEIGHT`

### Step 1: Create HoleModel dispatcher with fallback box

```tsx
// src/components/three/holes/HoleModel.tsx
import { FELT_COLOR, SURFACE_THICKNESS } from "./shared";

export type HoleModelProps = {
	type: string;
	width: number;
	length: number;
	color: string;
};

/**
 * Dispatches to per-type 3D model component.
 * Falls back to a simple colored box for types not yet implemented.
 */
export function HoleModel({ type, width, length, color }: HoleModelProps) {
	// Fallback: simple box matching the old rendering
	return (
		<mesh position={[0, 0, 0]}>
			<boxGeometry args={[width, SURFACE_THICKNESS, length]} />
			<meshStandardMaterial color={color} />
		</mesh>
	);
}
```

Note: The fallback box uses `SURFACE_THICKNESS` (0.02) height instead of the old `HOLE_HEIGHT` (0.3). This is intentional — the detailed models are low-profile with tall bumpers/obstacles, not tall solid blocks. The invisible interaction mesh retains `HOLE_HEIGHT` for click targeting.

### Step 2: Modify MiniGolfHole.tsx

Replace the current single visible mesh + material with:
1. An interaction mesh that is invisible by default, visible with tint during states
2. A `HoleModel` child for the visual representation
3. Updated selection outline using `MODEL_HEIGHTS`

**Current code to replace** (lines 133-181 of `MiniGolfHole.tsx`):

```tsx
// REPLACE the entire return block
```

**New return block:**

```tsx
import { HoleModel } from "./holes/HoleModel";
import { MODEL_HEIGHTS } from "./holes/shared";

// Add at top of file, after HOLE_HEIGHT:
const INTERACTION_HEIGHT = 0.3; // keep original height for click targeting

// ... existing handler code stays unchanged ...

// Determine interaction state
const showOverlay = isDragging || isSelected || (tool === "delete" && isHovered);
const overlayColor = isDragging
	? "#FFE082"
	: tool === "delete" && isHovered
		? "#EF5350"
		: "#FFC107"; // selected

const modelHeight = MODEL_HEIGHTS[hole.type] ?? INTERACTION_HEIGHT;

return (
	<group
		position={[hole.position.x, 0, hole.position.z]}
		rotation={[0, rotationRad, 0]}
	>
		{/* Interaction mesh — invisible unless state-tinted */}
		{/* biome-ignore lint/a11y/noStaticElementInteractions: R3F mesh element, not HTML */}
		<mesh
			position={[0, INTERACTION_HEIGHT / 2, 0]}
			visible={showOverlay}
			onClick={(e) => {
				e.stopPropagation();
				if (tool === "delete") {
					removeHole(hole.id);
				} else {
					onClick();
				}
			}}
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
			onPointerEnter={() => setIsHovered(true)}
			onPointerLeave={() => setIsHovered(false)}
		>
			<boxGeometry args={[width, INTERACTION_HEIGHT, length]} />
			<meshStandardMaterial
				color={overlayColor}
				transparent
				opacity={0.35}
				depthWrite={false}
			/>
		</mesh>

		{/* Visual model */}
		<HoleModel
			type={hole.type}
			width={width}
			length={length}
			color={definition.color}
		/>

		{/* Selection outline — sized to model height */}
		{isSelected && (
			<lineSegments position={[0, modelHeight / 2, 0]}>
				<edgesGeometry
					args={[
						new THREE.BoxGeometry(
							width + 0.05,
							modelHeight + 0.05,
							length + 0.05,
						),
					]}
				/>
				<lineBasicMaterial color="#FF9800" />
			</lineSegments>
		)}
	</group>
);
```

**IMPORTANT changes from current code:**
1. Group `position.y` changed from `HOLE_HEIGHT / 2` to `0` — models sit on the floor, each sub-component manages its own Y offset
2. Interaction mesh has `position={[0, INTERACTION_HEIGHT / 2, 0]}` to center it vertically
3. Interaction mesh is `visible={showOverlay}` — invisible by default so models show through
4. Interaction mesh material is transparent with opacity 0.35 — tints the model underneath
5. Selection outline uses `modelHeight` and is centered at `modelHeight / 2`
6. `HoleModel` renders at Y=0 (its children position themselves)

**CRITICAL: The interaction mesh must still capture pointer events even when invisible.** In Three.js/R3F, `visible={false}` also disables raycasting. We need a different approach — use a transparent material instead:

```tsx
{/* Interaction mesh — always captures events, tinted overlay when active */}
<mesh
	position={[0, INTERACTION_HEIGHT / 2, 0]}
	onClick={...}
	onPointerDown={handlePointerDown}
	onPointerMove={handlePointerMove}
	onPointerUp={handlePointerUp}
	onPointerEnter={() => setIsHovered(true)}
	onPointerLeave={() => setIsHovered(false)}
>
	<boxGeometry args={[width, INTERACTION_HEIGHT, length]} />
	<meshStandardMaterial
		color={showOverlay ? overlayColor : "#000000"}
		transparent
		opacity={showOverlay ? 0.35 : 0}
		depthWrite={false}
	/>
</mesh>
```

This keeps the mesh always raycastable but only visible when showing state feedback.

### Step 3: Verify app still works

Run: `npm run dev`
- Open the app in browser
- Place holes — should appear as low-profile colored rectangles (the fallback box)
- Select, drag, rotate, delete should all still work
- Selection outline should appear around holes
- GhostHole placement preview still works (unchanged)

### Step 4: Run lint and type check

Run: `npm run check && npx tsc --noEmit`
Expected: Clean

### Step 5: Commit

```bash
git add src/components/three/holes/HoleModel.tsx src/components/three/MiniGolfHole.tsx
git commit -m "feat(phase6): integrate HoleModel dispatcher with interaction overlay"
```

---

## After Tasks 1-2

The app looks slightly different (holes are thinner rectangles instead of tall blocks) but functions identically. All interaction (click, drag, rotate, delete, select) works through the transparent overlay mesh. Tasks 3-9 can now be parallelized — each replaces the fallback box in `HoleModel` with a detailed model.
