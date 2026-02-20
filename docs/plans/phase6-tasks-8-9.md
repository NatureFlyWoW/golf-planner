# Phase 6 — Tasks 8-9: Loop, Windmill (Complex Obstacle Features)

These types have distinctive obstacle geometry that defines their identity.

---

## Task 8: HoleLoop — Vertical Loop Arch

**Files:**
- Create: `src/components/three/holes/HoleLoop.tsx`
- Modify: `src/components/three/holes/HoleModel.tsx` (add case)

**Dimensions:** 1.8m wide × 2.0m long
**Obstacle:** Half-torus (vertical loop arch) standing upright at the center, with two support pillars.

### Geometry Specification

```
Side view (looking from +X):

          ╭───╮           ← torus arch (half ring, 180°)
         ╱     ╲
        │       │
        │       │         ← support pillars
  ──────┴───────┴──────── ← felt surface
  entry              exit

Plan view (looking down):

  -0.9        0.0        +0.9  (X)
   │           │           │
   ├───────────┼───────────┤ +1.0 (Z)
   │  BUMPER   │  BUMPER   │
   │    ┌──────┤           │ +0.6
   │    │ LANE │           │
   │    │  ◯◯  │           │ ← torus arch footprint (two circles)
   │    │ LANE │           │
   │    └──────┤           │ -0.6
   │           │           │
   ├───────────┼───────────┤ -1.0
```

The lane runs through the center. The torus arch stands vertically, perpendicular to the lane.

### Step 1: Create HoleLoop component

```tsx
// src/components/three/holes/HoleLoop.tsx
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

const LOOP_RADIUS = 0.3; // main radius of the torus (center of tube to center of torus)
const TUBE_RADIUS = 0.04; // radius of the tube
const PILLAR_RADIUS = 0.04;
const PILLAR_HEIGHT = 0.15; // supports under the torus base
const LANE_WIDTH = 0.5;

export function HoleLoop({ width, length, color }: Props) {
	const halfW = width / 2;
	const halfL = length / 2;
	const bt = BUMPER_THICKNESS;
	const bh = BUMPER_HEIGHT;
	const st = SURFACE_THICKNESS;

	const loopMaterial = useMemo(
		() =>
			new THREE.MeshStandardMaterial({
				color,
				roughness: 0.4,
				metalness: 0.2,
			}),
		[color],
	);

	return (
		<group>
			{/* Felt surface — full footprint minus bumpers */}
			<mesh position={[0, st / 2, 0]} material={feltMaterial}>
				<boxGeometry args={[LANE_WIDTH, st, length - bt * 2]} />
			</mesh>

			{/* Torus arch — half ring standing vertical */}
			{/* TorusGeometry(radius, tube, radialSegments, tubularSegments, arc) */}
			{/* The torus lies flat in XZ by default. We need it standing in XY. */}
			{/* Rotate 90° around X to stand it up, then position at center */}
			<mesh
				position={[0, st + PILLAR_HEIGHT + LOOP_RADIUS, 0]}
				rotation={[0, Math.PI / 2, 0]}
				material={loopMaterial}
			>
				<torusGeometry args={[LOOP_RADIUS, TUBE_RADIUS, 12, 24, Math.PI]} />
			</mesh>

			{/* Left support pillar */}
			<mesh
				position={[0, st + PILLAR_HEIGHT / 2, -LOOP_RADIUS]}
				material={loopMaterial}
			>
				<cylinderGeometry args={[PILLAR_RADIUS, PILLAR_RADIUS, PILLAR_HEIGHT, 8]} />
			</mesh>

			{/* Right support pillar */}
			<mesh
				position={[0, st + PILLAR_HEIGHT / 2, LOOP_RADIUS]}
				material={loopMaterial}
			>
				<cylinderGeometry args={[PILLAR_RADIUS, PILLAR_RADIUS, PILLAR_HEIGHT, 8]} />
			</mesh>

			{/* Left bumper */}
			<mesh
				position={[-halfW + bt / 2, st + bh / 2, 0]}
				material={bumperMaterial}
			>
				<boxGeometry args={[bt, bh, length]} />
			</mesh>

			{/* Right bumper */}
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
				<boxGeometry args={[LANE_WIDTH, bh, bt]} />
			</mesh>

			{/* Front bumper */}
			<mesh
				position={[0, st + bh / 2, halfL - bt / 2]}
				material={bumperMaterial}
			>
				<boxGeometry args={[LANE_WIDTH, bh, bt]} />
			</mesh>

			{/* Tee marker */}
			<mesh
				position={[0, st + 0.001, -halfL + 0.15]}
				rotation={[-Math.PI / 2, 0, 0]}
				material={teeMaterial}
			>
				<circleGeometry args={[TEE_RADIUS, 16]} />
			</mesh>

			{/* Cup */}
			<mesh
				position={[0, st + 0.001, halfL - 0.15]}
				rotation={[-Math.PI / 2, 0, 0]}
				material={cupMaterial}
			>
				<circleGeometry args={[CUP_RADIUS, 16]} />
			</mesh>
		</group>
	);
}
```

**Note on torus orientation:** The `TorusGeometry` default orientation is flat in XZ. We want the arch standing vertical (in XY or YZ plane), arching over the lane. The rotation and position above are approximations. If the arch faces the wrong direction:
- Try `rotation={[Math.PI / 2, 0, 0]}` to stand it up in XY
- Adjust `position.y` so the base of the arch meets the pillar tops
- The pillars should be at the two endpoints of the half-torus

**Verify visually.** The loop is the most visually distinctive model — it should look like a vertical arch/ring that a ball would theoretically roll through.

### Step 2: Wire into HoleModel

```tsx
import { HoleLoop } from "./HoleLoop";

if (type === "loop") {
	return <HoleLoop width={width} length={length} color={color} />;
}
```

### Step 3: Verify visually

- Place a Loop hole
- In 3D: should see a cyan half-ring standing vertical over the lane, with two small pillars
- The arch should be visually impressive — the "showpiece" model
- From top-down: the torus appears as a circle or arc shape over the lane

### Step 4: Lint + commit

```bash
npm run check
git add src/components/three/holes/HoleLoop.tsx src/components/three/holes/HoleModel.tsx
git commit -m "feat(phase6): add HoleLoop 3D model with vertical torus arch"
```

---

## Task 9: HoleWindmill — Classic Blade Obstacle

**Files:**
- Create: `src/components/three/holes/HoleWindmill.tsx`
- Modify: `src/components/three/holes/HoleModel.tsx` (add case)

**Dimensions:** 1.2m wide × 2.5m long
**Obstacle:** Central pillar with 4 flat blades, frozen at a 22.5° offset for visual interest.

### Geometry Specification

```
Side view:

     ┼──── blade (flat panel)
     │
     │    ← pillar (cylinder)
     │
  ───┴──────────────── felt surface

Plan view:

          ╲   ╱
           ╲ ╱
     ───────●─────── ← pillar center + 4 blades at 22.5°, 112.5°, 202.5°, 292.5°
           ╱ ╲
          ╱   ╲
```

The blades are static — frozen at a fixed angle. They are thin flat rectangles radiating from the pillar.

### Step 1: Create HoleWindmill component

```tsx
// src/components/three/holes/HoleWindmill.tsx
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

const PILLAR_RADIUS = 0.05;
const PILLAR_HEIGHT = 0.30;
const BLADE_LENGTH = 0.25; // from pillar center to blade tip
const BLADE_WIDTH = 0.06;
const BLADE_THICKNESS = 0.015;
const BLADE_Y = 0.20; // height at which blades are attached
const BLADE_OFFSET_DEG = 22.5; // frozen rotation offset
const LANE_WIDTH = 0.5;

const BLADE_ANGLES = [0, 90, 180, 270].map(
	(deg) => ((deg + BLADE_OFFSET_DEG) * Math.PI) / 180,
);

export function HoleWindmill({ width, length, color }: Props) {
	const halfW = width / 2;
	const halfL = length / 2;
	const bt = BUMPER_THICKNESS;
	const bh = BUMPER_HEIGHT;
	const st = SURFACE_THICKNESS;

	const bladeMaterial = useMemo(
		() =>
			new THREE.MeshStandardMaterial({
				color,
				roughness: 0.5,
				metalness: 0.1,
			}),
		[color],
	);

	const pillarMaterial = useMemo(
		() =>
			new THREE.MeshStandardMaterial({
				color: "#757575", // medium gray
				roughness: 0.4,
				metalness: 0.3,
			}),
		[],
	);

	return (
		<group>
			{/* Felt surface */}
			<mesh position={[0, st / 2, 0]} material={feltMaterial}>
				<boxGeometry args={[LANE_WIDTH, st, length - bt * 2]} />
			</mesh>

			{/* Central pillar */}
			<mesh
				position={[0, st + PILLAR_HEIGHT / 2, 0]}
				material={pillarMaterial}
			>
				<cylinderGeometry args={[PILLAR_RADIUS, PILLAR_RADIUS, PILLAR_HEIGHT, 12]} />
			</mesh>

			{/* 4 blades — flat rectangular panels radiating from pillar */}
			{BLADE_ANGLES.map((angle, i) => (
				<mesh
					key={`blade-${
						// biome-ignore lint/suspicious/noArrayIndexKey: static array
						i
					}`}
					position={[
						Math.sin(angle) * (BLADE_LENGTH / 2 + PILLAR_RADIUS),
						st + BLADE_Y,
						Math.cos(angle) * (BLADE_LENGTH / 2 + PILLAR_RADIUS),
					]}
					rotation={[0, angle, 0]}
					material={bladeMaterial}
				>
					<boxGeometry args={[BLADE_THICKNESS, BLADE_WIDTH, BLADE_LENGTH]} />
				</mesh>
			))}

			{/* Left bumper */}
			<mesh
				position={[-halfW + bt / 2, st + bh / 2, 0]}
				material={bumperMaterial}
			>
				<boxGeometry args={[bt, bh, length]} />
			</mesh>

			{/* Right bumper */}
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
				<boxGeometry args={[LANE_WIDTH, bh, bt]} />
			</mesh>

			{/* Front bumper */}
			<mesh
				position={[0, st + bh / 2, halfL - bt / 2]}
				material={bumperMaterial}
			>
				<boxGeometry args={[LANE_WIDTH, bh, bt]} />
			</mesh>

			{/* Tee marker */}
			<mesh
				position={[0, st + 0.001, -halfL + 0.15]}
				rotation={[-Math.PI / 2, 0, 0]}
				material={teeMaterial}
			>
				<circleGeometry args={[TEE_RADIUS, 16]} />
			</mesh>

			{/* Cup */}
			<mesh
				position={[0, st + 0.001, halfL - 0.15]}
				rotation={[-Math.PI / 2, 0, 0]}
				material={cupMaterial}
			>
				<circleGeometry args={[CUP_RADIUS, 16]} />
			</mesh>
		</group>
	);
}
```

**Note on blade positioning:** Each blade is positioned at `(sin(angle) * offset, BLADE_Y, cos(angle) * offset)` and rotated `[0, angle, 0]`. This places the blade radiating outward from the pillar. The blade's geometry is `[BLADE_THICKNESS, BLADE_WIDTH, BLADE_LENGTH]` — thin in X, tall in Y, long in Z. The rotation around Y aligns each blade along its radial direction.

If blades appear perpendicular to expected (pointing up instead of out), swap the box geometry args: `[BLADE_LENGTH, BLADE_WIDTH, BLADE_THICKNESS]`. **Verify visually.**

The `noArrayIndexKey` biome ignore is needed because the blade array is static and never reorders.

### Step 2: Wire into HoleModel

```tsx
import { HoleWindmill } from "./HoleWindmill";

if (type === "windmill") {
	return <HoleWindmill width={width} length={length} color={color} />;
}
```

### Step 3: Verify visually

- Place a Windmill hole
- In 3D: should see a gray pillar with 4 pink blades radiating outward, frozen at an angle
- The blades should be flat panels, NOT rotating
- From top-down: pillar appears as a dot, blades as 4 thin lines in an X pattern

### Step 4: Lint + commit

```bash
npm run check
git add src/components/three/holes/HoleWindmill.tsx src/components/three/holes/HoleModel.tsx
git commit -m "feat(phase6): add HoleWindmill 3D model with static blades"
```
