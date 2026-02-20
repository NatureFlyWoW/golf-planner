# Phase 7 — Task 2: UV Materials + useMaterials Hook

**Depends on:** Task 1 (uvMode must exist in store)

## Step 1: Add UV material singletons to shared.ts

**File:** `src/components/three/holes/shared.ts`

After the existing planning materials (after line 52), add UV material singletons:

```typescript
// ── UV Materials (neon emissive for blacklight preview) ──
export const uvFeltMaterial = new THREE.MeshStandardMaterial({
	color: "#003300",
	emissive: "#00FF66",
	emissiveIntensity: 0.5,
	roughness: 0.9,
	metalness: 0,
	polygonOffset: true,
	polygonOffsetFactor: -1,
});

export const uvBumperMaterial = new THREE.MeshStandardMaterial({
	color: "#001A33",
	emissive: "#00CCFF",
	emissiveIntensity: 0.5,
	roughness: 0.3,
	metalness: 0.1,
});

export const uvTeeMaterial = new THREE.MeshStandardMaterial({
	color: "#333300",
	emissive: "#FFFF00",
	emissiveIntensity: 0.5,
	roughness: 0.5,
	metalness: 0,
});

export const uvCupMaterial = new THREE.MeshStandardMaterial({
	color: "#331A00",
	emissive: "#FF6600",
	emissiveIntensity: 0.5,
	roughness: 0.5,
	metalness: 0,
});
```

## Step 2: Create useMaterials hook

**File:** `src/components/three/holes/useMaterials.ts` (NEW)

```typescript
import type * as THREE from "three";
import { useStore } from "../../../store";
import {
	bumperMaterial,
	cupMaterial,
	feltMaterial,
	teeMaterial,
	uvBumperMaterial,
	uvCupMaterial,
	uvFeltMaterial,
	uvTeeMaterial,
} from "./shared";

export type MaterialSet = {
	felt: THREE.MeshStandardMaterial;
	bumper: THREE.MeshStandardMaterial;
	tee: THREE.MeshStandardMaterial;
	cup: THREE.MeshStandardMaterial;
};

const planningMaterials: MaterialSet = {
	felt: feltMaterial,
	bumper: bumperMaterial,
	tee: teeMaterial,
	cup: cupMaterial,
};

const uvMaterials: MaterialSet = {
	felt: uvFeltMaterial,
	bumper: uvBumperMaterial,
	tee: uvTeeMaterial,
	cup: uvCupMaterial,
};

/** Returns the correct material set based on UV mode state. */
export function useMaterials(): MaterialSet {
	const uvMode = useStore((s) => s.ui.uvMode);
	return uvMode ? uvMaterials : planningMaterials;
}
```

**Important:** Biome will auto-sort the imports alphabetically. Make sure `bumperMaterial` comes before `cupMaterial`, etc. The order above is already alphabetical.

## Step 3: Run lint + type check

```bash
cd /mnt/c/Users/Caus/Golf_Plan/golf-planner
export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)"
npm run check && npx tsc --noEmit
```

Expected: Clean pass. The UV materials and hook are created but not yet consumed.

## Step 4: Commit

```bash
git add src/components/three/holes/shared.ts src/components/three/holes/useMaterials.ts
git commit -m "feat(phase7): add UV material singletons and useMaterials hook"
```
