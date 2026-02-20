# Phase 7 — Task 4: Hole Components — Accent Material Users

**Depends on:** Task 2 (useMaterials hook must exist)

These 4 components use the 4 shared materials PLUS component-local accent materials created with `useMemo`. The accent materials need to switch colors based on `uvMode`.

**Pattern for each:**
1. Remove individual material imports from `./shared`, import constants only
2. Import `useMaterials` from `./useMaterials`
3. Import `useStore` from `../../../store`
4. Call `const { felt, bumper, tee, cup } = useMaterials();` at top of component
5. Read `const uvMode = useStore((s) => s.ui.uvMode);`
6. Update each `useMemo` for accent materials to key on `uvMode` and return UV variant when true
7. Replace shared material references as in Task 3

---

## File 1: HoleRamp.tsx

**File:** `src/components/three/holes/HoleRamp.tsx`

### Current imports (lines 1-13):
```typescript
import { useMemo } from "react";
import * as THREE from "three";
import {
	BUMPER_HEIGHT,
	BUMPER_THICKNESS,
	bumperMaterial,
	CUP_RADIUS,
	cupMaterial,
	feltMaterial,
	SURFACE_THICKNESS,
	TEE_RADIUS,
	teeMaterial,
} from "./shared";
```

### Replace with:
```typescript
import { useMemo } from "react";
import * as THREE from "three";
import { useStore } from "../../../store";
import {
	BUMPER_HEIGHT,
	BUMPER_THICKNESS,
	CUP_RADIUS,
	SURFACE_THICKNESS,
	TEE_RADIUS,
} from "./shared";
import { useMaterials } from "./useMaterials";
```

**Note:** Biome sorts imports. `useStore` import goes before `./shared` because `../../../store` sorts before `./shared`.

### Add at top of component body (after `export function HoleRamp({... }) {`):
```typescript
	const { felt, bumper, tee, cup } = useMaterials();
	const uvMode = useStore((s) => s.ui.uvMode);
```

### Update rampMaterial useMemo (currently lines 85-93):

**Current:**
```typescript
	const rampMaterial = useMemo(
		() =>
			new THREE.MeshStandardMaterial({
				color,
				roughness: 0.7,
				metalness: 0,
			}),
		[color],
	);
```

**Replace with:**
```typescript
	const rampMaterial = useMemo(
		() =>
			new THREE.MeshStandardMaterial(
				uvMode
					? {
							color: "#1A001A",
							emissive: "#FF00FF",
							emissiveIntensity: 0.5,
							roughness: 0.7,
							metalness: 0,
						}
					: { color, roughness: 0.7, metalness: 0 },
			),
		[color, uvMode],
	);
```

### Replace shared material references:
- `material={feltMaterial}` → `material={felt}` (1 — base surface)
- `material={bumperMaterial}` → `material={bumper}` (4 — side + end bumpers)
- `material={teeMaterial}` → `material={tee}` (1)
- `material={cupMaterial}` → `material={cup}` (1)

---

## File 2: HoleLoop.tsx

**File:** `src/components/three/holes/HoleLoop.tsx`

### Current imports (lines 1-13):
```typescript
import { useMemo } from "react";
import * as THREE from "three";
import {
	BUMPER_HEIGHT,
	BUMPER_THICKNESS,
	bumperMaterial,
	CUP_RADIUS,
	cupMaterial,
	feltMaterial,
	SURFACE_THICKNESS,
	TEE_RADIUS,
	teeMaterial,
} from "./shared";
```

### Replace with:
```typescript
import { useMemo } from "react";
import * as THREE from "three";
import { useStore } from "../../../store";
import {
	BUMPER_HEIGHT,
	BUMPER_THICKNESS,
	CUP_RADIUS,
	SURFACE_THICKNESS,
	TEE_RADIUS,
} from "./shared";
import { useMaterials } from "./useMaterials";
```

### Add at top of component body:
```typescript
	const { felt, bumper, tee, cup } = useMaterials();
	const uvMode = useStore((s) => s.ui.uvMode);
```

### Update loopMaterial useMemo (currently lines 36-44):

**Current:**
```typescript
	const loopMaterial = useMemo(
		() =>
			new THREE.MeshStandardMaterial({
				color,
				roughness: 0.4,
				metalness: 0.2,
			}),
		[color],
	);
```

**Replace with:**
```typescript
	const loopMaterial = useMemo(
		() =>
			new THREE.MeshStandardMaterial(
				uvMode
					? {
							color: "#001A1A",
							emissive: "#00FFFF",
							emissiveIntensity: 0.5,
							roughness: 0.4,
							metalness: 0.2,
						}
					: { color, roughness: 0.4, metalness: 0.2 },
			),
		[color, uvMode],
	);
```

### Replace shared material references:
- `material={feltMaterial}` → `material={felt}` (1)
- `material={bumperMaterial}` → `material={bumper}` (4)
- `material={teeMaterial}` → `material={tee}` (1)
- `material={cupMaterial}` → `material={cup}` (1)

---

## File 3: HoleWindmill.tsx

**File:** `src/components/three/holes/HoleWindmill.tsx`

### Current imports (lines 1-13):
```typescript
import { useMemo } from "react";
import * as THREE from "three";
import {
	BUMPER_HEIGHT,
	BUMPER_THICKNESS,
	bumperMaterial,
	CUP_RADIUS,
	cupMaterial,
	feltMaterial,
	SURFACE_THICKNESS,
	TEE_RADIUS,
	teeMaterial,
} from "./shared";
```

### Replace with:
```typescript
import { useMemo } from "react";
import * as THREE from "three";
import { useStore } from "../../../store";
import {
	BUMPER_HEIGHT,
	BUMPER_THICKNESS,
	CUP_RADIUS,
	SURFACE_THICKNESS,
	TEE_RADIUS,
} from "./shared";
import { useMaterials } from "./useMaterials";
```

### Add at top of component body:
```typescript
	const { felt, bumper, tee, cup } = useMaterials();
	const uvMode = useStore((s) => s.ui.uvMode);
```

### Update pillarMaterial useMemo (currently lines 46-54):

**Current:**
```typescript
	const pillarMaterial = useMemo(
		() =>
			new THREE.MeshStandardMaterial({
				color: "#757575",
				roughness: 0.4,
				metalness: 0.3,
			}),
		[],
	);
```

**Replace with:**
```typescript
	const pillarMaterial = useMemo(
		() =>
			new THREE.MeshStandardMaterial(
				uvMode
					? {
							color: "#1A0011",
							emissive: "#FF1493",
							emissiveIntensity: 0.3,
							roughness: 0.4,
							metalness: 0.3,
						}
					: { color: "#757575", roughness: 0.4, metalness: 0.3 },
			),
		[uvMode],
	);
```

### Update bladeMaterial useMemo (currently lines 57-65):

**Current:**
```typescript
	const bladeMaterial = useMemo(
		() =>
			new THREE.MeshStandardMaterial({
				color,
				roughness: 0.5,
				metalness: 0.1,
			}),
		[color],
	);
```

**Replace with:**
```typescript
	const bladeMaterial = useMemo(
		() =>
			new THREE.MeshStandardMaterial(
				uvMode
					? {
							color: "#1A0011",
							emissive: "#FF1493",
							emissiveIntensity: 0.5,
							roughness: 0.5,
							metalness: 0.1,
						}
					: { color, roughness: 0.5, metalness: 0.1 },
			),
		[color, uvMode],
	);
```

### Replace shared material references:
- `material={feltMaterial}` → `material={felt}` (1)
- `material={bumperMaterial}` → `material={bumper}` (4)
- `material={teeMaterial}` → `material={tee}` (1)
- `material={cupMaterial}` → `material={cup}` (1)

---

## File 4: HoleTunnel.tsx

**File:** `src/components/three/holes/HoleTunnel.tsx`

### Current imports (lines 1-13):
```typescript
import { useMemo } from "react";
import * as THREE from "three";
import {
	BUMPER_HEIGHT,
	BUMPER_THICKNESS,
	bumperMaterial,
	CUP_RADIUS,
	cupMaterial,
	feltMaterial,
	SURFACE_THICKNESS,
	TEE_RADIUS,
	teeMaterial,
} from "./shared";
```

### Replace with:
```typescript
import { useMemo } from "react";
import * as THREE from "three";
import { useStore } from "../../../store";
import {
	BUMPER_HEIGHT,
	BUMPER_THICKNESS,
	CUP_RADIUS,
	SURFACE_THICKNESS,
	TEE_RADIUS,
} from "./shared";
import { useMaterials } from "./useMaterials";
```

### Add at top of component body:
```typescript
	const { felt, bumper, tee, cup } = useMaterials();
	const uvMode = useStore((s) => s.ui.uvMode);
```

### Update tunnelMaterial useMemo (currently lines 43-51):

**Current:**
```typescript
	const tunnelMaterial = useMemo(
		() =>
			new THREE.MeshStandardMaterial({
				color: "#455A64",
				roughness: 0.6,
				metalness: 0.1,
			}),
		[],
	);
```

**Replace with:**
```typescript
	const tunnelMaterial = useMemo(
		() =>
			new THREE.MeshStandardMaterial(
				uvMode
					? {
							color: "#0D001A",
							emissive: "#9933FF",
							emissiveIntensity: 0.5,
							roughness: 0.6,
							metalness: 0.1,
						}
					: { color: "#455A64", roughness: 0.6, metalness: 0.1 },
			),
		[uvMode],
	);
```

### Also: the `color: _color` prop alias is now potentially useful — remove the underscore since we no longer need it:

Actually, leave the `_color` alias as-is. The `color` prop still isn't used directly (the tunnel has its own hardcoded color). Changing the prop name would ripple to `HoleModel.tsx`. Leave it.

### Replace shared material references:
- `material={feltMaterial}` → `material={felt}` (1)
- `material={bumperMaterial}` → `material={bumper}` (6 — entry left/right, exit left/right, back, front)
- `material={teeMaterial}` → `material={tee}` (1)
- `material={cupMaterial}` → `material={cup}` (1)

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
git add src/components/three/holes/HoleRamp.tsx src/components/three/holes/HoleLoop.tsx src/components/three/holes/HoleWindmill.tsx src/components/three/holes/HoleTunnel.tsx
git commit -m "feat(phase7): wire useMaterials + UV accents into Ramp, Loop, Windmill, Tunnel"
```
