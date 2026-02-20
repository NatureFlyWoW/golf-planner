# Phase 7 — Task 3: Hole Components — Shared Material Users

**Depends on:** Task 2 (useMaterials hook must exist)

These 3 components ONLY use the 4 shared materials (`feltMaterial`, `bumperMaterial`, `teeMaterial`, `cupMaterial`). No component-local accent materials.

The pattern is identical for all 3:
1. Remove individual material imports from `./shared`
2. Import `useMaterials` from `./useMaterials`
3. Call `const { felt, bumper, tee, cup } = useMaterials();` at the top of the component
4. Replace `feltMaterial` → `felt`, `bumperMaterial` → `bumper`, `teeMaterial` → `tee`, `cupMaterial` → `cup` throughout

---

## File 1: HoleStraight.tsx

**File:** `src/components/three/holes/HoleStraight.tsx`

### Current imports (lines 1-11):
```typescript
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
import {
	BUMPER_HEIGHT,
	BUMPER_THICKNESS,
	CUP_RADIUS,
	SURFACE_THICKNESS,
	TEE_RADIUS,
} from "./shared";
import { useMaterials } from "./useMaterials";
```

### Add at top of component body (after line 15 `export function HoleStraight({ width, length }: Props) {`):
```typescript
	const { felt, bumper, tee, cup } = useMaterials();
```

### Replace all material references in JSX:
- `material={feltMaterial}` → `material={felt}`
- `material={bumperMaterial}` → `material={bumper}`
- `material={teeMaterial}` → `material={tee}`
- `material={cupMaterial}` → `material={cup}`

There are 7 occurrences total: 1 felt, 4 bumper, 1 tee, 1 cup.

---

## File 2: HoleLShape.tsx

**File:** `src/components/three/holes/HoleLShape.tsx`

### Current imports (lines 1-11):
```typescript
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
import {
	BUMPER_HEIGHT,
	BUMPER_THICKNESS,
	CUP_RADIUS,
	SURFACE_THICKNESS,
	TEE_RADIUS,
} from "./shared";
import { useMaterials } from "./useMaterials";
```

### Add at top of component body (after `export function HoleLShape({ width, length }: Props) {`):
```typescript
	const { felt, bumper, tee, cup } = useMaterials();
```

### Replace all material references:
- `material={feltMaterial}` → `material={felt}` (2 occurrences — entry + exit lane)
- `material={bumperMaterial}` → `material={bumper}` (6 occurrences)
- `material={teeMaterial}` → `material={tee}` (1 occurrence)
- `material={cupMaterial}` → `material={cup}` (1 occurrence)

---

## File 3: HoleDogleg.tsx

**File:** `src/components/three/holes/HoleDogleg.tsx`

### Current imports (lines 1-11):
```typescript
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
import {
	BUMPER_HEIGHT,
	BUMPER_THICKNESS,
	CUP_RADIUS,
	SURFACE_THICKNESS,
	TEE_RADIUS,
} from "./shared";
import { useMaterials } from "./useMaterials";
```

### Add at top of component body (after `export function HoleDogleg({`... `}) {`):
```typescript
	const { felt, bumper, tee, cup } = useMaterials();
```

### Replace all material references:
- `material={feltMaterial}` → `material={felt}` (5 occurrences — 3 segments + 2 transition patches)
- `material={bumperMaterial}` → `material={bumper}` (6 occurrences — 2 outer + 2 end + 2 guide)
- `material={teeMaterial}` → `material={tee}` (1 occurrence)
- `material={cupMaterial}` → `material={cup}` (1 occurrence)

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
git add src/components/three/holes/HoleStraight.tsx src/components/three/holes/HoleLShape.tsx src/components/three/holes/HoleDogleg.tsx
git commit -m "feat(phase7): wire useMaterials hook into Straight, LShape, Dogleg"
```
