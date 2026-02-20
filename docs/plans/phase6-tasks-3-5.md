# Phase 6 — Tasks 3-5: Straight, Ramp, Tunnel (Axis-Aligned Types)

These three types use only axis-aligned geometry (no angled segments). They can be implemented in parallel after Tasks 1-2.

**Shared reference:**
- Import constants/materials from `./shared`
- All models sit at Y=0 within the parent group (MiniGolfHole positions the group)
- Lane runs along the Z axis (length), bumpers on the X axis (width)
- "Start" end is at negative Z (tee marker), "far" end is at positive Z (hole cup)
- Bumper walls sit ON TOP of the felt surface

**Coordinate system within each model:**
```
        +Z (far end, cup)
        ↑
   ─────┼───── +X (right)
        │
        ↓ -Z (start end, tee)
```
The model is centered at (0, 0, 0). Width spans [-width/2, +width/2] on X. Length spans [-length/2, +length/2] on Z. Y=0 is the floor.

---

## Task 3: HoleStraight — Flat Lane with Bumpers

**Files:**
- Create: `src/components/three/holes/HoleStraight.tsx`
- Modify: `src/components/three/holes/HoleModel.tsx` (add case)

**Dimensions:** 0.6m wide × 3.0m long

### Step 1: Create HoleStraight component

```tsx
// src/components/three/holes/HoleStraight.tsx
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

type Props = { width: number; length: number };

export function HoleStraight({ width, length }: Props) {
	const halfW = width / 2;
	const halfL = length / 2;
	const laneW = width - BUMPER_THICKNESS * 2; // inner lane width
	const laneL = length - BUMPER_THICKNESS * 2; // inner lane length

	return (
		<group>
			{/* Felt playing surface */}
			<mesh
				position={[0, SURFACE_THICKNESS / 2, 0]}
				material={feltMaterial}
			>
				<boxGeometry args={[laneW, SURFACE_THICKNESS, laneL]} />
			</mesh>

			{/* Left bumper wall */}
			<mesh
				position={[
					-halfW + BUMPER_THICKNESS / 2,
					SURFACE_THICKNESS + BUMPER_HEIGHT / 2,
					0,
				]}
				material={bumperMaterial}
			>
				<boxGeometry args={[BUMPER_THICKNESS, BUMPER_HEIGHT, length]} />
			</mesh>

			{/* Right bumper wall */}
			<mesh
				position={[
					halfW - BUMPER_THICKNESS / 2,
					SURFACE_THICKNESS + BUMPER_HEIGHT / 2,
					0,
				]}
				material={bumperMaterial}
			>
				<boxGeometry args={[BUMPER_THICKNESS, BUMPER_HEIGHT, length]} />
			</mesh>

			{/* Back bumper (start end, -Z) */}
			<mesh
				position={[
					0,
					SURFACE_THICKNESS + BUMPER_HEIGHT / 2,
					-halfL + BUMPER_THICKNESS / 2,
				]}
				material={bumperMaterial}
			>
				<boxGeometry args={[laneW, BUMPER_HEIGHT, BUMPER_THICKNESS]} />
			</mesh>

			{/* Front bumper (far end, +Z) */}
			<mesh
				position={[
					0,
					SURFACE_THICKNESS + BUMPER_HEIGHT / 2,
					halfL - BUMPER_THICKNESS / 2,
				]}
				material={bumperMaterial}
			>
				<boxGeometry args={[laneW, BUMPER_HEIGHT, BUMPER_THICKNESS]} />
			</mesh>

			{/* Tee marker (start end) — flush with felt surface */}
			<mesh
				position={[0, SURFACE_THICKNESS + 0.001, -halfL + 0.15]}
				rotation={[-Math.PI / 2, 0, 0]}
				material={teeMaterial}
			>
				<circleGeometry args={[TEE_RADIUS, 16]} />
			</mesh>

			{/* Hole cup (far end) — flush with felt surface */}
			<mesh
				position={[0, SURFACE_THICKNESS + 0.001, halfL - 0.15]}
				rotation={[-Math.PI / 2, 0, 0]}
				material={cupMaterial}
			>
				<circleGeometry args={[CUP_RADIUS, 16]} />
			</mesh>
		</group>
	);
}
```

### Step 2: Wire into HoleModel dispatcher

In `src/components/three/holes/HoleModel.tsx`, add:

```tsx
import { HoleStraight } from "./HoleStraight";

// In the HoleModel function body, before the fallback:
if (type === "straight") {
	return <HoleStraight width={width} length={length} />;
}
```

### Step 3: Verify visually

Run: `npm run dev`
- Place a Straight hole
- In top-down view: should see green rectangle with white border (bumpers), yellow dot (tee), black dot (cup)
- In 3D view: should see low-profile green lane with raised white bumper walls
- Select/drag/delete should work via the overlay mesh

### Step 4: Lint check

Run: `npm run check`
Expected: Clean

### Step 5: Commit

```bash
git add src/components/three/holes/HoleStraight.tsx src/components/three/holes/HoleModel.tsx
git commit -m "feat(phase6): add HoleStraight 3D model"
```

---

## Task 4: HoleRamp — Elevated Slope Obstacle

**Files:**
- Create: `src/components/three/holes/HoleRamp.tsx`
- Modify: `src/components/three/holes/HoleModel.tsx` (add case)

**Dimensions:** 0.6m wide × 3.0m long
**Obstacle:** Ramp up (wedge) → flat plateau at 0.15m → ramp down (wedge)

### Step 1: Create HoleRamp component

The ramp uses `ExtrudeGeometry` for the wedge shapes. Each wedge is a right triangle cross-section extruded across the lane width.

```tsx
// src/components/three/holes/HoleRamp.tsx
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

const RAMP_HEIGHT = 0.15; // plateau height
const RAMP_SLOPE_LENGTH = 0.5; // slope run length
const PLATEAU_LENGTH = 0.4; // flat top length

export function HoleRamp({ width, length, color }: Props) {
	const halfW = width / 2;
	const halfL = length / 2;
	const laneW = width - BUMPER_THICKNESS * 2;

	const rampMaterial = useMemo(
		() =>
			new THREE.MeshStandardMaterial({
				color,
				roughness: 0.7,
				metalness: 0,
			}),
		[color],
	);

	// Ramp-up wedge: triangular cross-section
	// Positioned so the slope starts at z = -0.5 (relative to center) and rises going +Z
	const rampUpGeo = useMemo(() => {
		const shape = new THREE.Shape();
		shape.moveTo(0, 0); // bottom-front
		shape.lineTo(RAMP_SLOPE_LENGTH, 0); // bottom-back
		shape.lineTo(RAMP_SLOPE_LENGTH, RAMP_HEIGHT); // top-back
		shape.closePath(); // slope face

		return new THREE.ExtrudeGeometry(shape, {
			depth: laneW,
			bevelEnabled: false,
		});
	}, [laneW]);

	// Ramp-down wedge: mirror of ramp-up
	const rampDownGeo = useMemo(() => {
		const shape = new THREE.Shape();
		shape.moveTo(0, RAMP_HEIGHT); // top-front
		shape.lineTo(0, 0); // bottom-front
		shape.lineTo(RAMP_SLOPE_LENGTH, 0); // bottom-back
		shape.closePath();

		return new THREE.ExtrudeGeometry(shape, {
			depth: laneW,
			bevelEnabled: false,
		});
	}, [laneW]);

	// Lane layout (along Z axis, centered):
	// -halfL ... entryEnd: flat entry
	// entryEnd ... rampUpEnd: ramp up slope
	// rampUpEnd ... plateauEnd: flat plateau
	// plateauEnd ... rampDownEnd: ramp down slope
	// rampDownEnd ... +halfL: flat exit
	const entryLength = (length - RAMP_SLOPE_LENGTH * 2 - PLATEAU_LENGTH) / 2;
	const rampUpStartZ = -halfL + entryLength + BUMPER_THICKNESS;

	return (
		<group>
			{/* Flat felt surface (entry + exit sections) */}
			<mesh
				position={[0, SURFACE_THICKNESS / 2, 0]}
				material={feltMaterial}
			>
				<boxGeometry args={[laneW, SURFACE_THICKNESS, length - BUMPER_THICKNESS * 2]} />
			</mesh>

			{/* Ramp up slope — extruded shape, rotated to align with Z axis */}
			<mesh
				geometry={rampUpGeo}
				material={rampMaterial}
				position={[
					-laneW / 2,
					SURFACE_THICKNESS,
					rampUpStartZ,
				]}
				rotation={[0, 0, 0]}
			/>

			{/* Plateau — flat top */}
			<mesh
				position={[
					0,
					SURFACE_THICKNESS + RAMP_HEIGHT / 2,
					rampUpStartZ + RAMP_SLOPE_LENGTH + PLATEAU_LENGTH / 2,
				]}
				material={rampMaterial}
			>
				<boxGeometry args={[laneW, RAMP_HEIGHT, PLATEAU_LENGTH]} />
			</mesh>

			{/* Ramp down slope */}
			<mesh
				geometry={rampDownGeo}
				material={rampMaterial}
				position={[
					-laneW / 2,
					SURFACE_THICKNESS,
					rampUpStartZ + RAMP_SLOPE_LENGTH + PLATEAU_LENGTH,
				]}
			/>

			{/* Left bumper */}
			<mesh
				position={[
					-halfW + BUMPER_THICKNESS / 2,
					SURFACE_THICKNESS + BUMPER_HEIGHT / 2,
					0,
				]}
				material={bumperMaterial}
			>
				<boxGeometry args={[BUMPER_THICKNESS, BUMPER_HEIGHT + RAMP_HEIGHT, length]} />
			</mesh>

			{/* Right bumper */}
			<mesh
				position={[
					halfW - BUMPER_THICKNESS / 2,
					SURFACE_THICKNESS + BUMPER_HEIGHT / 2,
					0,
				]}
				material={bumperMaterial}
			>
				<boxGeometry args={[BUMPER_THICKNESS, BUMPER_HEIGHT + RAMP_HEIGHT, length]} />
			</mesh>

			{/* Back bumper */}
			<mesh
				position={[
					0,
					SURFACE_THICKNESS + BUMPER_HEIGHT / 2,
					-halfL + BUMPER_THICKNESS / 2,
				]}
				material={bumperMaterial}
			>
				<boxGeometry args={[laneW, BUMPER_HEIGHT, BUMPER_THICKNESS]} />
			</mesh>

			{/* Front bumper */}
			<mesh
				position={[
					0,
					SURFACE_THICKNESS + BUMPER_HEIGHT / 2,
					halfL - BUMPER_THICKNESS / 2,
				]}
				material={bumperMaterial}
			>
				<boxGeometry args={[laneW, BUMPER_HEIGHT, BUMPER_THICKNESS]} />
			</mesh>

			{/* Tee marker */}
			<mesh
				position={[0, SURFACE_THICKNESS + 0.001, -halfL + 0.15]}
				rotation={[-Math.PI / 2, 0, 0]}
				material={teeMaterial}
			>
				<circleGeometry args={[TEE_RADIUS, 16]} />
			</mesh>

			{/* Cup */}
			<mesh
				position={[0, SURFACE_THICKNESS + 0.001, halfL - 0.15]}
				rotation={[-Math.PI / 2, 0, 0]}
				material={cupMaterial}
			>
				<circleGeometry args={[CUP_RADIUS, 16]} />
			</mesh>
		</group>
	);
}
```

**Note on ExtrudeGeometry orientation:** The `Shape` is defined in the XY plane. `ExtrudeGeometry` extrudes along +Z by default. The shape's X maps to the model's Z (length direction), Y maps to the model's Y (height). The extrude `depth` maps to the model's X (width direction). The mesh is positioned so the bottom-left-front corner aligns correctly. You may need to adjust rotation — if the ramp faces the wrong direction, add `rotation={[-Math.PI / 2, 0, Math.PI / 2]}` or similar. **Verify visually.**

### Step 2: Wire into HoleModel

```tsx
import { HoleRamp } from "./HoleRamp";

if (type === "ramp") {
	return <HoleRamp width={width} length={length} color={color} />;
}
```

### Step 3: Verify visually

Run app, place a Ramp hole:
- In 3D view: should see a lane with a visible slope up, flat top, slope down
- The ramp slope should be purple (#9C27B0)
- Bumpers should be taller to accommodate the ramp height

**If ExtrudeGeometry orientation is wrong**, adjust the rotation or swap shape coordinates. The key is: the slope must run along the Z axis (length of the lane), and the extrusion must span the X axis (width of the lane).

### Step 4: Lint + commit

```bash
npm run check
git add src/components/three/holes/HoleRamp.tsx src/components/three/holes/HoleModel.tsx
git commit -m "feat(phase6): add HoleRamp 3D model with slope geometry"
```

---

## Task 5: HoleTunnel — Enclosed Half-Cylinder Passage

**Files:**
- Create: `src/components/three/holes/HoleTunnel.tsx`
- Modify: `src/components/three/holes/HoleModel.tsx` (add case)

**Dimensions:** 0.6m wide × 4.0m long
**Obstacle:** Half-cylinder arch over the middle 1.6m section. Fully opaque (no transparency).

### Step 1: Create HoleTunnel component

The tunnel arch is a half-cylinder: `CylinderGeometry` with `thetaLength = Math.PI`, rotated to arch over the lane.

```tsx
// src/components/three/holes/HoleTunnel.tsx
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

const TUNNEL_LENGTH = 1.6; // middle section
const TUNNEL_HEIGHT = 0.3; // arch peak height above felt
const TUNNEL_SEGMENTS = 16;

export function HoleTunnel({ width, length, color }: Props) {
	const halfW = width / 2;
	const halfL = length / 2;
	const laneW = width - BUMPER_THICKNESS * 2;
	const openLength = (length - TUNNEL_LENGTH) / 2; // entry/exit section length

	const tunnelMaterial = useMemo(
		() =>
			new THREE.MeshStandardMaterial({
				color: "#455A64", // darker gray, fully opaque
				roughness: 0.6,
				metalness: 0.1,
			}),
		[],
	);

	// Half-cylinder for the tunnel arch
	// CylinderGeometry(radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded, thetaStart, thetaLength)
	// We use it as a half-pipe: radius = laneW/2, height = TUNNEL_LENGTH
	// The cylinder's axis runs along Y by default; we need it along Z (length)
	// So: create cylinder along Y, then rotate -90° around X
	const archRadius = laneW / 2;

	return (
		<group>
			{/* Felt surface — full length */}
			<mesh
				position={[0, SURFACE_THICKNESS / 2, 0]}
				material={feltMaterial}
			>
				<boxGeometry args={[laneW, SURFACE_THICKNESS, length - BUMPER_THICKNESS * 2]} />
			</mesh>

			{/* Tunnel arch — half cylinder */}
			<mesh
				position={[0, SURFACE_THICKNESS, 0]}
				rotation={[Math.PI / 2, 0, 0]}
				material={tunnelMaterial}
			>
				<cylinderGeometry
					args={[
						archRadius,     // radiusTop
						archRadius,     // radiusBottom
						TUNNEL_LENGTH,  // height (becomes Z-length after rotation)
						TUNNEL_SEGMENTS,// radial segments
						1,              // height segments
						true,           // openEnded (no caps — you can see through the ends)
						0,              // thetaStart
						Math.PI,        // thetaLength (half circle)
					]}
				/>
			</mesh>

			{/* Left bumper (entry section only) */}
			<mesh
				position={[
					-halfW + BUMPER_THICKNESS / 2,
					SURFACE_THICKNESS + BUMPER_HEIGHT / 2,
					-halfL + openLength / 2,
				]}
				material={bumperMaterial}
			>
				<boxGeometry args={[BUMPER_THICKNESS, BUMPER_HEIGHT, openLength]} />
			</mesh>

			{/* Left bumper (exit section only) */}
			<mesh
				position={[
					-halfW + BUMPER_THICKNESS / 2,
					SURFACE_THICKNESS + BUMPER_HEIGHT / 2,
					halfL - openLength / 2,
				]}
				material={bumperMaterial}
			>
				<boxGeometry args={[BUMPER_THICKNESS, BUMPER_HEIGHT, openLength]} />
			</mesh>

			{/* Right bumper (entry section only) */}
			<mesh
				position={[
					halfW - BUMPER_THICKNESS / 2,
					SURFACE_THICKNESS + BUMPER_HEIGHT / 2,
					-halfL + openLength / 2,
				]}
				material={bumperMaterial}
			>
				<boxGeometry args={[BUMPER_THICKNESS, BUMPER_HEIGHT, openLength]} />
			</mesh>

			{/* Right bumper (exit section only) */}
			<mesh
				position={[
					halfW - BUMPER_THICKNESS / 2,
					SURFACE_THICKNESS + BUMPER_HEIGHT / 2,
					halfL - openLength / 2,
				]}
				material={bumperMaterial}
			>
				<boxGeometry args={[BUMPER_THICKNESS, BUMPER_HEIGHT, openLength]} />
			</mesh>

			{/* Back bumper */}
			<mesh
				position={[
					0,
					SURFACE_THICKNESS + BUMPER_HEIGHT / 2,
					-halfL + BUMPER_THICKNESS / 2,
				]}
				material={bumperMaterial}
			>
				<boxGeometry args={[laneW, BUMPER_HEIGHT, BUMPER_THICKNESS]} />
			</mesh>

			{/* Front bumper */}
			<mesh
				position={[
					0,
					SURFACE_THICKNESS + BUMPER_HEIGHT / 2,
					halfL - BUMPER_THICKNESS / 2,
				]}
				material={bumperMaterial}
			>
				<boxGeometry args={[laneW, BUMPER_HEIGHT, BUMPER_THICKNESS]} />
			</mesh>

			{/* Tee marker */}
			<mesh
				position={[0, SURFACE_THICKNESS + 0.001, -halfL + 0.15]}
				rotation={[-Math.PI / 2, 0, 0]}
				material={teeMaterial}
			>
				<circleGeometry args={[TEE_RADIUS, 16]} />
			</mesh>

			{/* Cup */}
			<mesh
				position={[0, SURFACE_THICKNESS + 0.001, halfL - 0.15]}
				rotation={[-Math.PI / 2, 0, 0]}
				material={cupMaterial}
			>
				<circleGeometry args={[CUP_RADIUS, 16]} />
			</mesh>
		</group>
	);
}
```

**Note:** The `CylinderGeometry` rotation may need adjustment. If the arch opens downward or sideways, try `rotation={[-Math.PI / 2, 0, 0]}` or `rotation={[Math.PI / 2, Math.PI, 0]}`. The goal is: arch curves upward from the felt surface, spans the lane width, and runs along Z for TUNNEL_LENGTH. **Verify visually.**

### Step 2: Wire into HoleModel

```tsx
import { HoleTunnel } from "./HoleTunnel";

if (type === "tunnel") {
	return <HoleTunnel width={width} length={length} color={color} />;
}
```

### Step 3: Verify visually

- Place a Tunnel hole
- In 3D view: should see open entry → dark gray arch → open exit
- The arch should curve upward, you can see through the entry/exit openings
- Bumpers only on the open sections (the tunnel walls enclose the middle)

### Step 4: Lint + commit

```bash
npm run check
git add src/components/three/holes/HoleTunnel.tsx src/components/three/holes/HoleModel.tsx
git commit -m "feat(phase6): add HoleTunnel 3D model with half-cylinder arch"
```
