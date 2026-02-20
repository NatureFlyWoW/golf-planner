# Phase 7: UV/Blacklight Theme — Design Document

**Date:** 2026-02-20
**Status:** Approved (3-round adversarial review complete)

## Goal

Add a toggle between **Planning mode** (current bright look) and **UV Preview mode** (dark canvas + toolbar with neon emissive hole models) to visualize how the hall will look under blacklight.

## Key Decisions

- **Toggle**, not permanent — planning mode stays for readability, UV mode for visualization
- **Canvas + toolbar** go dark; sidebar panels stay bright
- **Emissive materials** (self-illuminating), no bloom post-processing
- **Toolbar button** labeled "UV" next to 2D/3D toggle
- **Not persisted** — ephemeral UI state like sunDate

## State

```typescript
// types/ui.ts
export type UIState = {
  // ... existing fields ...
  uvMode: boolean;
};

// store.ts — DEFAULT_UI
uvMode: false,

// store.ts — new action
toggleUvMode: () => void;
```

`uvMode` is NOT persisted (excluded by partialize) and NOT undo-tracked (UI state).

## Color Palettes

### 3D Canvas

| Element | Planning Mode | UV Mode |
|---------|--------------|---------|
| Hall floor | `#E0E0E0` | `#0A0A1A` (near-black) |
| Hall walls | `#B0B0B0` | `#1A1A2E` (dark indigo) |
| Ambient light | white @ 0.8 | `#220044` @ 0.3 |
| Directional light | white @ 0.5 | `#6600CC` @ 0.4 |
| Felt surface | `#2E7D32` | `#003300` base + `#00FF66` emissive @ 0.5 |
| Bumpers | `#F5F5F5` | `#001A33` base + `#00CCFF` emissive @ 0.5 |
| Tee markers | `#FDD835` | `#333300` base + `#FFFF00` emissive @ 0.5 |
| Cups | `#212121` | `#331A00` base + `#FF6600` emissive @ 0.5 |
| Ramp accent | `#7B1FA2` | `#1A001A` base + `#FF00FF` emissive @ 0.5 |
| Loop accent | `#00838F` | `#001A1A` base + `#00FFFF` emissive @ 0.5 |
| Windmill blades | `#E91E63` | `#1A0011` base + `#FF1493` emissive @ 0.5 |
| Tunnel arch | `#455A64` | `#0D001A` base + `#9933FF` emissive @ 0.5 |
| Grid | `#cccccc` / `#999999` | `#2A2A5E` @ 0.4 opacity |
| Flow path | white | `#00FFFF` (neon cyan) |
| Ghost hole | green/red | neon green/neon red |
| Doors | `#4CAF50` | `#001A00` base + `#00FF44` emissive @ 0.3 |
| Windows | sun-dependent | `#3300AA` (dim indigo) |

### Toolbar (Desktop + Mobile)

| Element | Planning Mode | UV Mode |
|---------|--------------|---------|
| Background | `bg-white` | `bg-gray-900` |
| Border | `border-gray-200` | `border-indigo-900` |
| Button inactive | `bg-gray-100 text-gray-700` | `bg-gray-800 text-gray-300` |
| Button active | `bg-blue-600 text-white` | `bg-purple-600 text-white` |
| Dividers | `bg-gray-200` | `bg-gray-700` |
| UV toggle active | — | `bg-purple-600 text-white` |

### Unchanged in UV Mode

- Sidebar panels (stay bright)
- Budget panel
- Mobile drawer/detail panels
- LocationBar (stays bright)
- MiniMap (stays as-is)
- Sun indicator (hidden in UV mode)
- Sun controls (accessible but sun indicator hidden)

## Material Strategy

### Shared Materials (4 types: felt, bumper, tee, cup)

Two sets of module-level singletons in `shared.ts`:

```typescript
// Planning materials (existing)
export const feltMaterial = new THREE.MeshStandardMaterial({ color: "#2E7D32", ... });

// UV materials (new)
export const uvFeltMaterial = new THREE.MeshStandardMaterial({
  color: "#003300", emissive: "#00FF66", emissiveIntensity: 0.5, ...
});
```

### Material Selection Hook

New file: `src/components/three/holes/useMaterials.ts`

```typescript
import { useStore } from "../../../store";

export type MaterialSet = {
  felt: THREE.MeshStandardMaterial;
  bumper: THREE.MeshStandardMaterial;
  tee: THREE.MeshStandardMaterial;
  cup: THREE.MeshStandardMaterial;
};

export function useMaterials(): MaterialSet {
  const uvMode = useStore((s) => s.ui.uvMode);
  return uvMode ? uvMaterials : planningMaterials;
}
```

### Per-Type Accent Materials (ramp, loop, windmill, tunnel)

Handled locally in each component with `useMemo` keyed on `uvMode`:

```typescript
const uvMode = useStore((s) => s.ui.uvMode);
const rampMat = useMemo(() =>
  new THREE.MeshStandardMaterial(
    uvMode
      ? { color: "#1A001A", emissive: "#FF00FF", emissiveIntensity: 0.5 }
      : { color: "#7B1FA2", roughness: 0.5 }
  ),
  [uvMode]
);
```

## Toolbar UI

UV toggle button sits after the 2D/3D toggle:

```
[Select] [Place] [Delete] | [Snap] [Flow] [3D] [UV] | [Undo] [Redo] | [Save] [Export]
```

- Label: "UV"
- Active state: `bg-purple-600 text-white`
- Inactive state: same as other toolbar buttons
- Mobile: included in BottomToolbar, same styling rules

## Canvas Invalidation

Since `frameloop="demand"`, toggling UV mode must trigger a re-render. Zustand state change → React re-render of subscribed components → R3F automatic invalidation. This should work without explicit `invalidate()` calls, but verify during visual testing.

## Testing

- **Unit**: `useMaterials()` returns planning set when `uvMode=false`, UV set when `uvMode=true`
- **Unit**: `toggleUvMode()` flips the boolean
- **Visual**: Toggle in both 2D and 3D views, verify all 7 hole types change appearance
- **Visual**: Toolbar styling switches correctly
- **Visual**: Grid visibility in UV mode (should be faint but present)

## Files Touched (~19)

1. `src/types/ui.ts` — add `uvMode: boolean`
2. `src/store/store.ts` — add `toggleUvMode`, default `uvMode: false`
3. `src/components/three/holes/shared.ts` — add UV material singletons
4. `src/components/three/holes/useMaterials.ts` — new hook file
5. `src/components/three/holes/HoleStraight.tsx` — use `useMaterials()`
6. `src/components/three/holes/HoleLShape.tsx` — use `useMaterials()`
7. `src/components/three/holes/HoleDogleg.tsx` — use `useMaterials()`
8. `src/components/three/holes/HoleRamp.tsx` — use `useMaterials()` + UV accent
9. `src/components/three/holes/HoleLoop.tsx` — use `useMaterials()` + UV accent
10. `src/components/three/holes/HoleWindmill.tsx` — use `useMaterials()` + UV accent
11. `src/components/three/holes/HoleTunnel.tsx` — use `useMaterials()` + UV accent
12. `src/components/three/HallFloor.tsx` — UV floor color
13. `src/components/three/HallWalls.tsx` — UV wall color
14. `src/components/three/HallOpenings.tsx` — UV door/window colors
15. `src/components/three/FloorGrid.tsx` — UV grid color/opacity
16. `src/components/three/FlowPath.tsx` — UV path color
17. `src/components/three/GhostHole.tsx` — UV ghost colors
18. `src/components/three/SunIndicator.tsx` — hidden in UV mode
19. `src/App.tsx` — UV lighting (ambient + directional)
20. `src/components/ui/Toolbar.tsx` — UV toolbar styling + UV toggle button
21. `src/components/ui/BottomToolbar.tsx` — UV mobile toolbar styling

## Review History

- **DA Round 1**: Found useMaterials architecture gap, per-type accent materials, file count underestimate, door/window colors missing
- **Blue Team**: Steel-manned the parallel-singleton approach, proposed hybrid material strategy (shared singletons + local useMemo), lowered emissive intensity to 0.5, brightened UV grid
- **DA Round 2**: Confirmed synthesis is solid, no critical issues, clarified LocationBar stays bright
