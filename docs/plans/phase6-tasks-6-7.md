# Phase 6 — Tasks 6-7: L-Shape, Dogleg (Angled Geometry Types)

These types require non-axis-aligned geometry. More geometry math involved.

**Coordinate system:** Same as Tasks 3-5. Model centered at (0,0,0), width on X, length on Z, Y=0 is floor. Tee at -Z, cup at +Z.

---

## Task 6: HoleLShape — 90-Degree Right Turn

**Files:**
- Create: `src/components/three/holes/HoleLShape.tsx`
- Modify: `src/components/three/holes/HoleModel.tsx` (add case)

**Dimensions:** 1.2m wide × 2.5m long

### Geometry Specification

The L-Shape is two lane segments meeting at a right-angle corner. The ball enters from the bottom (-Z), travels straight, then turns right (+X) to reach the cup.

```
Bounding box: 1.2m (X) × 2.5m (Z)
Lane width: 0.5m (inner, between bumpers)

Plan view (Y=0, looking down):

         -0.6        0.0        +0.6   (X)
          |           |           |
  +1.25 ──┬───────────┼───────────┤── +1.25
          │ BUMPER    │ BUMPER    │
  +0.75 ──│───────────┤     ┌────┤── +0.75
          │           │ CUP │    │
          │  exit     │  ●  │    │
          │  lane     │     │    │
  +0.25 ──│─────┬─────┘     │    │── +0.25
          │     │    FELT    │    │
          │     │ (turn area)│    │
  -0.25 ──│     │           │    │── -0.25
          │     │ BUMPER    │    │
          │     │ (inner    │    │
          │     │  corner)  │    │
  -0.75 ──│     │           │    │── -0.75
          │     │   entry   │    │
          │     │   lane    │    │
  -1.25 ──┴─────┴───────────┴────┘── -1.25
          |     |           |    |
        -0.6  -0.1        +0.4  +0.6
```

**Key coordinates:**
- Entry lane: X from -0.1 to +0.4 (0.5m wide), Z from -1.25 to +0.25
- Turn area: X from -0.1 to +0.6, Z from -0.25 to +0.25 (the corner where lanes meet)
- Exit lane: X from -0.6 to -0.1 (0.5m wide), Z from +0.25 to +0.75
- Tee: at (0.15, -1.1) — centered in entry lane
- Cup: at (-0.35, +0.5) — centered in exit lane

This is a simplified version — rather than precisely mitering corners, we use rectangular felt sections and rectangular bumper walls that form the L shape.

### Step 1: Create HoleLShape component

```tsx
// src/components/three/holes/HoleLShape.tsx
import { useMemo } from "react";
import * as THREE from "three";
import {
	BUMPER_HEIGHT,
	BUMPER_THICKNESS,
	CUP_RADIUS,
	SURFACE_THICKNESS,
	TEE_RADIUS,
	bumperMaterial,
	cupMaterial,
	feltMaterial,
	teeMaterial,
} from "./shared";

type Props = { width: number; length: number; color: string };

const LANE_WIDTH = 0.5;

export function HoleLShape({ width, length }: Props) {
	const halfW = width / 2; // 0.6
	const halfL = length / 2; // 1.25
	const bt = BUMPER_THICKNESS;
	const bh = BUMPER_HEIGHT;
	const st = SURFACE_THICKNESS;

	// Entry lane runs from bottom to the turn zone
	// Lane is right-of-center: X from (halfW - LANE_WIDTH - bt) to (halfW - bt)
	const laneRight = halfW - bt; // 0.55
	const laneLeft = laneRight - LANE_WIDTH; // 0.05
	const laneCenterX = (laneLeft + laneRight) / 2; // 0.3

	// Exit lane runs left from the turn zone
	const exitTop = halfL - bt; // top of exit lane (Z)
	const turnZ = 0; // Z coordinate where the turn happens
	const exitLaneCenterZ = (turnZ + exitTop) / 2;
	const exitLaneLength = exitTop - turnZ;
	const exitLaneCenterX = (-halfW + bt + (-halfW + bt + LANE_WIDTH)) / 2;
	const exitLaneLeft = -halfW + bt;
	const exitLaneRight = exitLaneLeft + LANE_WIDTH;

	// Entry lane Z extents
	const entryBottom = -halfL + bt;
	const entryTop = turnZ + LANE_WIDTH / 2;
	const entryLaneCenterZ = (entryBottom + entryTop) / 2;
	const entryLaneLength = entryTop - entryBottom;

	return (
		<group>
			{/* Entry lane felt (vertical segment) */}
			<mesh position={[laneCenterX, st / 2, entryLaneCenterZ]} material={feltMaterial}>
				<boxGeometry args={[LANE_WIDTH, st, entryLaneLength]} />
			</mesh>

			{/* Turn area felt (square where lanes meet) */}
			<mesh
				position={[
					(laneLeft + exitLaneRight) / 2,
					st / 2,
					turnZ,
				]}
				material={feltMaterial}
			>
				<boxGeometry
					args={[
						laneRight - exitLaneLeft,
						st,
						LANE_WIDTH,
					]}
				/>
			</mesh>

			{/* Exit lane felt (horizontal segment) */}
			<mesh
				position={[
					(exitLaneLeft + exitLaneRight) / 2,
					st / 2,
					exitLaneCenterZ,
				]}
				material={feltMaterial}
			>
				<boxGeometry args={[LANE_WIDTH, st, exitLaneLength]} />
			</mesh>

			{/* --- Bumper walls --- */}

			{/* Right wall of entry lane (full height of bounding box) */}
			<mesh
				position={[halfW - bt / 2, st + bh / 2, 0]}
				material={bumperMaterial}
			>
				<boxGeometry args={[bt, bh, length]} />
			</mesh>

			{/* Bottom wall */}
			<mesh
				position={[0, st + bh / 2, -halfL + bt / 2]}
				material={bumperMaterial}
			>
				<boxGeometry args={[width, bh, bt]} />
			</mesh>

			{/* Left wall of entry lane (from bottom to turn) */}
			<mesh
				position={[laneLeft - bt / 2, st + bh / 2, (-halfL + turnZ) / 2]}
				material={bumperMaterial}
			>
				<boxGeometry args={[bt, bh, halfL + turnZ]} />
			</mesh>

			{/* Inner corner wall (L-shape inner corner) */}
			<mesh
				position={[
					laneLeft - bt / 2,
					st + bh / 2,
					turnZ + LANE_WIDTH / 2 + (exitTop - turnZ - LANE_WIDTH / 2) / 2,
				]}
				material={bumperMaterial}
			>
				<boxGeometry
					args={[
						laneLeft - exitLaneRight + bt,
						bh,
						bt,
					]}
				/>
			</mesh>

			{/* Top wall */}
			<mesh
				position={[0, st + bh / 2, halfL - bt / 2]}
				material={bumperMaterial}
			>
				<boxGeometry args={[width, bh, bt]} />
			</mesh>

			{/* Left wall of exit lane */}
			<mesh
				position={[
					-halfW + bt / 2,
					st + bh / 2,
					(turnZ + halfL) / 2,
				]}
				material={bumperMaterial}
			>
				<boxGeometry args={[bt, bh, halfL - turnZ]} />
			</mesh>

			{/* Tee marker — in entry lane */}
			<mesh
				position={[laneCenterX, st + 0.001, -halfL + 0.15]}
				rotation={[-Math.PI / 2, 0, 0]}
				material={teeMaterial}
			>
				<circleGeometry args={[TEE_RADIUS, 16]} />
			</mesh>

			{/* Cup — in exit lane */}
			<mesh
				position={[
					(exitLaneLeft + exitLaneRight) / 2,
					st + 0.001,
					halfL - 0.15,
				]}
				rotation={[-Math.PI / 2, 0, 0]}
				material={cupMaterial}
			>
				<circleGeometry args={[CUP_RADIUS, 16]} />
			</mesh>
		</group>
	);
}
```

**IMPORTANT:** The bumper geometry for the L-shape inner corner is the hardest part. The exact positions above are approximations based on the geometry sketch. You WILL need to verify visually and adjust coordinates. The key principle: bumper walls form a continuous border around the L-shaped playing area with no gaps.

If the math gets complex, simplify: use fewer bumper segments and accept small visual gaps at corners. This is a planning tool, not a physics engine.

### Step 2: Wire into HoleModel

```tsx
import { HoleLShape } from "./HoleLShape";

if (type === "l-shape") {
	return <HoleLShape width={width} length={length} color={color} />;
}
```

### Step 3: Verify visually

- Place an L-Shape hole
- In 3D: should see entry lane going straight, then a right turn to the exit
- Bumper walls should form a continuous L-shaped border
- Tee in entry lane, cup in exit lane
- Rotate the hole — the L should rotate as a unit

### Step 4: Lint + commit

```bash
npm run check
git add src/components/three/holes/HoleLShape.tsx src/components/three/holes/HoleModel.tsx
git commit -m "feat(phase6): add HoleLShape 3D model with 90-degree turn"
```

---

## Task 7: HoleDogleg — Gentle Double-Bend

**Files:**
- Create: `src/components/three/holes/HoleDogleg.tsx`
- Modify: `src/components/three/holes/HoleModel.tsx` (add case)

**Dimensions:** 1.5m wide × 3.3m long

### Geometry Specification

The dogleg is a wider lane with two gentle bends forming a shallow S/Z curve. Rather than using angled geometry (which requires complex vertex math), we use a **simplified 3-segment approach**: three straight rectangular sections offset from each other, connected by the felt surface.

```
Bounding box: 1.5m (X) × 3.3m (Z)
Lane width: 0.6m (wider lane for the bends)

Plan view (simplified S-curve):

         -0.75       0.0       +0.75   (X)
          |           |           |
  +1.65 ──┬─────┬─────┼───────────┤── exit
          │     │FELT │           │
  +0.55 ──│     └─────┼─────┐    │──
          │           │FELT │    │
  -0.55 ──│     ┌─────┼─────┘    │──
          │     │FELT │           │
  -1.65 ──┴─────┴─────┼───────────┘── entry
```

The three segments are:
1. **Entry** (Z from -1.65 to -0.55): lane centered at X = +0.15 (right of center)
2. **Middle** (Z from -0.55 to +0.55): lane centered at X = 0.0 (center)
3. **Exit** (Z from +0.55 to +1.65): lane centered at X = -0.15 (left of center)

The offset is small (0.15m per segment) creating a gentle S-curve. Bumper walls follow the outer edge.

### Step 1: Create HoleDogleg component

```tsx
// src/components/three/holes/HoleDogleg.tsx
import { useMemo } from "react";
import * as THREE from "three";
import {
	BUMPER_HEIGHT,
	BUMPER_THICKNESS,
	CUP_RADIUS,
	SURFACE_THICKNESS,
	TEE_RADIUS,
	bumperMaterial,
	cupMaterial,
	feltMaterial,
	teeMaterial,
} from "./shared";

type Props = { width: number; length: number; color: string };

const LANE_WIDTH = 0.6;
const OFFSET = 0.15; // lateral offset per segment

export function HoleDogleg({ width, length }: Props) {
	const halfW = width / 2;
	const halfL = length / 2;
	const bt = BUMPER_THICKNESS;
	const bh = BUMPER_HEIGHT;
	const st = SURFACE_THICKNESS;
	const segLen = (length - bt * 2) / 3; // each segment length

	// Segment centers (Z positions)
	const seg1Z = -halfL + bt + segLen / 2; // entry
	const seg2Z = 0; // middle
	const seg3Z = halfL - bt - segLen / 2; // exit

	// Segment X offsets
	const seg1X = OFFSET; // right of center
	const seg2X = 0; // center
	const seg3X = -OFFSET; // left of center

	return (
		<group>
			{/* Entry segment felt */}
			<mesh position={[seg1X, st / 2, seg1Z]} material={feltMaterial}>
				<boxGeometry args={[LANE_WIDTH, st, segLen]} />
			</mesh>

			{/* Middle segment felt */}
			<mesh position={[seg2X, st / 2, seg2Z]} material={feltMaterial}>
				<boxGeometry args={[LANE_WIDTH + OFFSET * 2, st, segLen]} />
			</mesh>

			{/* Exit segment felt */}
			<mesh position={[seg3X, st / 2, seg3Z]} material={feltMaterial}>
				<boxGeometry args={[LANE_WIDTH, st, segLen]} />
			</mesh>

			{/* Transition felt patches (fill gaps between offset segments) */}
			<mesh
				position={[
					(seg1X + seg2X) / 2,
					st / 2,
					(seg1Z + segLen / 2 + seg2Z - segLen / 2) / 2,
				]}
				material={feltMaterial}
			>
				<boxGeometry args={[LANE_WIDTH + OFFSET, st, bt]} />
			</mesh>
			<mesh
				position={[
					(seg2X + seg3X) / 2,
					st / 2,
					(seg2Z + segLen / 2 + seg3Z - segLen / 2) / 2,
				]}
				material={feltMaterial}
			>
				<boxGeometry args={[LANE_WIDTH + OFFSET, st, bt]} />
			</mesh>

			{/* Outer bumper walls — simplified as full-length walls on left and right */}
			{/* Left wall */}
			<mesh
				position={[-halfW + bt / 2, st + bh / 2, 0]}
				material={bumperMaterial}
			>
				<boxGeometry args={[bt, bh, length]} />
			</mesh>

			{/* Right wall */}
			<mesh
				position={[halfW - bt / 2, st + bh / 2, 0]}
				material={bumperMaterial}
			>
				<boxGeometry args={[bt, bh, length]} />
			</mesh>

			{/* Back bumper */}
			<mesh
				position={[0, st + bh / 2, -halfL + bt / 2]}
				material={bumperMaterial}
			>
				<boxGeometry args={[width, bh, bt]} />
			</mesh>

			{/* Front bumper */}
			<mesh
				position={[0, st + bh / 2, halfL - bt / 2]}
				material={bumperMaterial}
			>
				<boxGeometry args={[width, bh, bt]} />
			</mesh>

			{/* Inner bumper guides at the bends */}
			{/* Right inner guide at first bend (pushes ball left) */}
			<mesh
				position={[
					seg1X + LANE_WIDTH / 2 + bt / 2,
					st + bh / 2,
					(seg1Z + seg2Z) / 2,
				]}
				material={bumperMaterial}
			>
				<boxGeometry args={[bt, bh * 0.6, segLen * 0.4]} />
			</mesh>

			{/* Left inner guide at second bend (pushes ball right) */}
			<mesh
				position={[
					seg3X - LANE_WIDTH / 2 - bt / 2,
					st + bh / 2,
					(seg2Z + seg3Z) / 2,
				]}
				material={bumperMaterial}
			>
				<boxGeometry args={[bt, bh * 0.6, segLen * 0.4]} />
			</mesh>

			{/* Tee marker — entry segment */}
			<mesh
				position={[seg1X, st + 0.001, -halfL + 0.15]}
				rotation={[-Math.PI / 2, 0, 0]}
				material={teeMaterial}
			>
				<circleGeometry args={[TEE_RADIUS, 16]} />
			</mesh>

			{/* Cup — exit segment */}
			<mesh
				position={[seg3X, st + 0.001, halfL - 0.15]}
				rotation={[-Math.PI / 2, 0, 0]}
				material={cupMaterial}
			>
				<circleGeometry args={[CUP_RADIUS, 16]} />
			</mesh>
		</group>
	);
}
```

**Note:** This is a simplified approach — real doglegs have angled walls, but rectangular segments with offset inner guides convey the S-curve intent clearly. The inner guide bumpers are shorter (60% height) to suggest direction rather than being full barriers. **Verify visually and adjust positions as needed.**

### Step 2: Wire into HoleModel

```tsx
import { HoleDogleg } from "./HoleDogleg";

if (type === "dogleg") {
	return <HoleDogleg width={width} length={length} color={color} />;
}
```

### Step 3: Verify visually

- Place a Dogleg hole
- In 3D: should see a wide lane with subtle inner guide bumpers suggesting an S-curve path
- The tee and cup should be slightly offset from each other (tee right of center, cup left of center)
- Orange accent color from the type is NOT used in the model (doglegs are just lane + bumpers)

### Step 4: Lint + commit

```bash
npm run check
git add src/components/three/holes/HoleDogleg.tsx src/components/three/holes/HoleModel.tsx
git commit -m "feat(phase6): add HoleDogleg 3D model with S-curve guide bumpers"
```
