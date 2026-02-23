Now I have all the context needed. Let me generate the section content.

# Section 8: Camera Enhancements

## Overview

This section adds two focused improvements to the 3D camera system:

1. A 7th camera preset called "Overview" that shows the full hall exterior from outside the building, accessed via keyboard shortcut `7` and a new toolbar button.
2. A ground clamp to prevent the orbit camera from going below Y=0 (underground) in non-walkthrough mode.

This section has **no dependencies** on other sections in this split and can be implemented in Batch 1 (in parallel with sections 01, 05, 06).

---

## Dependencies

- **Section 01** (Walkthrough State) — the ground clamp must NOT interfere with walkthrough mode. After section 01 lands, read `walkthroughMode` from the store to gate the ground clamp. If section 01 is not yet merged, skip the `walkthroughMode` guard and add it as a follow-up.
- **No other dependencies** — `getCameraPresets`, `CameraPreset` type, `CameraPresets.tsx`, and `useKeyboardControls.ts` already exist.

---

## Tests First

**Test file to update**: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/utils/cameraPresets.test.ts`

The existing test at line 9 asserts 6 presets. This test must be updated and new tests added:

```ts
// In tests/utils/cameraPresets.test.ts

it("returns all 7 presets (top, front, back, left, right, isometric, overview)", () => {
    expect(Object.keys(presets)).toHaveLength(7);
    expect(presets).toHaveProperty("overview");
    // ... existing assertions for top, front, back, left, right, isometric
});

it('"overview" preset position is outside hall perimeter', () => {
    // The overview position should be further from center than any wall
    // With hall 10x20, diagonal ≈ 22.4, dist = diagonal * 2.0 ≈ 44.7
    // Position should have at least one coordinate far outside [0, hallWidth] or [0, hallLength]
    const pos = presets.overview.position;
    const outsideX = pos[0] < 0 || pos[0] > hallWidth;
    const outsideZ = pos[2] < 0 || pos[2] > hallLength;
    expect(outsideX || outsideZ).toBe(true);
});

it('"overview" preset target is hall center', () => {
    const cx = hallWidth / 2;
    const cz = hallLength / 2;
    expect(presets.overview.target[0]).toBeCloseTo(cx);
    expect(presets.overview.target[2]).toBeCloseTo(cz);
});

it('"overview" preset Y position is elevated (above hall roof)', () => {
    // Should be high enough to see the full building exterior
    expect(presets.overview.position[1]).toBeGreaterThan(10);
});
```

Update the existing "returns all 6 presets" test to expect 7, and update the "all presets have targets at approximately hall center" loop — the overview preset target should also be at hall center.

---

## Implementation

### 1. Extend `CameraPreset` Type

**File**: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/types/viewport.ts`

Add `"overview"` to the union:

```ts
export type CameraPreset =
    | "top"
    | "front"
    | "back"
    | "left"
    | "right"
    | "isometric"
    | "overview";
```

### 2. Add Overview Preset to `getCameraPresets`

**File**: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/utils/cameraPresets.ts`

The overview preset positions the camera outside the building at a distance of `diagonal * 2.0` from the hall center, elevated so the full exterior (walls + roof) is visible. Use the same corner angle as isometric but farther out and higher.

```ts
overview: {
    position: [cx + dist * 1.4, dist * 1.0, cz + dist * 1.4],
    target: [...target],
},
```

Where `dist = diagonal * 1.2` (same as other presets — distance is already scaled enough to show exterior). The factor `1.4` on X/Z and `1.0` on Y gives a perspective from outside the building showing all four exterior walls and roof. Adjust multipliers if needed so the full hall + surrounding ground plane is visible.

### 3. Add Key `7` to `useKeyboardControls`

**File**: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/hooks/useKeyboardControls.ts`

Extend `PRESET_KEYS` and `PRESET_NAMES`:

```ts
const PRESET_KEYS: Record<string, number> = {
    "1": 0,
    "2": 1,
    "3": 2,
    "4": 3,
    "5": 4,
    "6": 5,
    "7": 6,   // ← add this
};

const PRESET_NAMES = [
    "top",
    "front",
    "back",
    "left",
    "right",
    "isometric",
    "overview",   // ← add this at index 6
] as const;
```

The existing `PRESET_KEYS` lookup and `setLookAt` call in the key handler (around line 119-136) need no other changes — the index lookup drives everything.

### 4. Add Overview Button to `CameraPresets.tsx`

**File**: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/CameraPresets.tsx`

Add the overview entry to `PRESET_BUTTONS`:

```ts
const PRESET_BUTTONS = [
    { key: "top",        label: "Top",      shortcut: "1" },
    { key: "front",      label: "Front",    shortcut: "2" },
    { key: "back",       label: "Back",     shortcut: "3" },
    { key: "left",       label: "Left",     shortcut: "4" },
    { key: "right",      label: "Right",    shortcut: "5" },
    { key: "isometric",  label: "Iso",      shortcut: "6" },
    { key: "overview",   label: "Overview", shortcut: "7" },
] as const;
```

The `handlePresetClick` function already accepts the key and looks it up via `getCameraPresets` — no further changes needed in that function. The button renders in the same list as the other 6 presets.

### 5. Add Ground Clamp

**Goal**: Prevent the orbit camera from going underground (Y < 0.5) when NOT in walkthrough mode. The walkthrough camera separately locks Y at 1.7m and must not be affected.

**Approach**: Use `CameraControls.minPolarAngle` / `maxPolarAngle` to prevent the camera from rotating below horizontal, OR use a per-frame clamp on `camera.position.y`. The plan calls for a `useFrame` hook that clamps `camera.position.y` to `Math.max(camera.position.y, 0.5)` when NOT in walkthrough mode.

**File to modify**: The ground clamp should live in a small R3F component or a `useFrame` hook inside the 3D scene. Good candidates:
- A new `GroundClamp.tsx` in `src/components/three/` that renders null but runs a `useFrame` hook, mounted in `ThreeDOnlyContent.tsx`.
- Or inline in an existing 3D content component that already uses `useFrame`.

Recommend a small dedicated component for clarity:

**New file**: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/GroundClamp.tsx`

```tsx
/**
 * GroundClamp — prevents orbit camera from going below Y = 0.5m.
 * No-ops during walkthrough mode (WalkthroughController locks Y to 1.7m separately).
 * Renders null.
 */
export function GroundClamp(): null {
    // useThree to get camera, useStore to get walkthroughMode
    // In useFrame: if !walkthroughMode, clamp camera.position.y to >= 0.5
    return null;
}
```

The minimum Y of 0.5m (rather than 0) gives a small buffer above the ground plane (Y=-0.01) so the camera never clips through the ground texture.

**Mount point**: Add `<GroundClamp />` in `ThreeDOnlyContent.tsx` (always mounted in 3D scene).

**Ground clamp tests**: Ground clamp logic is tied to camera state and R3F — not easily unit-tested as a pure function. Verify manually that the camera cannot be dragged underground. If a testable utility is extracted (e.g., `clampCameraY(y: number, walkthroughMode: boolean): number`), add a test:

```ts
// tests/utils/groundClamp.test.ts (optional — only if utility is extracted)
it("clamps Y below 0.5 to 0.5 when not in walkthrough", () => {
    expect(clampCameraY(-1.0, false)).toBe(0.5);
    expect(clampCameraY(0.0, false)).toBe(0.5);
    expect(clampCameraY(0.4, false)).toBe(0.5);
    expect(clampCameraY(0.6, false)).toBe(0.6); // no clamp needed
});

it("does NOT clamp during walkthrough mode", () => {
    // walkthrough controller manages Y itself; don't interfere
    expect(clampCameraY(-1.0, true)).toBe(-1.0);
    expect(clampCameraY(0.3, true)).toBe(0.3);
});
```

---

## File Summary

| File | Action | Notes |
|------|--------|-------|
| `src/types/viewport.ts` | Modify | Add `"overview"` to `CameraPreset` union |
| `src/utils/cameraPresets.ts` | Modify | Add 7th preset to `getCameraPresets` return value |
| `src/hooks/useKeyboardControls.ts` | Modify | Add `"7": 6` to `PRESET_KEYS`, add `"overview"` to `PRESET_NAMES` |
| `src/components/three/CameraPresets.tsx` | Modify | Add overview entry to `PRESET_BUTTONS` array |
| `src/components/three/GroundClamp.tsx` | Create | New R3F component with `useFrame` Y-clamp; renders null |
| `src/components/three/ThreeDOnlyContent.tsx` | Modify | Mount `<GroundClamp />` |
| `tests/utils/cameraPresets.test.ts` | Modify | Update preset count to 7, add 3 overview-specific tests |

---

## Implementation Deviations

### D1: GroundClamp uses maxPolarAngle instead of useFrame Y-clamp

**Plan called for:** `useFrame` hook that clamps `camera.position.y >= 0.5` per frame.

**Actually implemented:** `useEffect` that sets `controls.maxPolarAngle = Math.PI / 2 - 0.05` on CameraControls.

**Reason:** Code review (M1) found that CameraControls maintains internal spherical coordinate state and writes to `camera.position` each frame. Direct `camera.position.y` mutation in `useFrame` causes jitter and gets overwritten. Using CameraControls' built-in constraint is the correct approach.

**The pure utility `groundClamp.ts` (`clampCameraY`) was still created** and tested (3 tests) as planned, but is no longer called by the component. Retained for potential future use.

### D2: groundClamp.test.ts created (was marked optional in plan)

The plan marked `tests/utils/groundClamp.test.ts` as optional ("only if utility is extracted"). The utility was extracted, so 3 tests were added.

### D3: Test count

**Plan said:** "All 639+ existing tests still pass." **Actual:** 775 tests (68 files) — many tests added by sections 01-07.

---

## Acceptance Criteria

1. Pressing `7` in the 3D viewport triggers the overview camera preset (shows building exterior from outside).
2. Clicking the "Overview (7)" button in the camera preset panel does the same.
3. The overview preset target is the hall center `[width/2, 0, length/2]`.
4. The overview position is visibly outside the hall perimeter (not inside the building).
5. In orbit mode, dragging the camera below ground level is prevented (Y never goes below 0.5m).
6. In walkthrough mode, the Y clamp does NOT fire (walkthrough controller manages eye level at 1.7m independently).
7. All 639+ existing tests still pass (`npm run test`).
8. TypeScript checks pass (`npx tsc --noEmit`).