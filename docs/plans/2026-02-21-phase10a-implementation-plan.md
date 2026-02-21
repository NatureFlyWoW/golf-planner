# Phase 10A: Segment Builder Core — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the core segment-based hole builder — types, chain computation, geometry, fullscreen mobile-first UI, save/load templates, and planner integration.

**Architecture:** New `HoleTemplate` type composed of chained `Segment` objects. Fullscreen R3F builder with orthographic camera, segment palette, and auto-chaining. Builder has its own undo stack, separate from planner. Templates rendered in planner via `TemplateHoleModel`. Lazy-loaded.

**Tech Stack:** React 19, TypeScript, @react-three/fiber, @react-three/drei, Zustand, Tailwind CSS, Vitest

**Design doc:** `docs/plans/2026-02-21-hole-builder-design.md`

**Environment:**
- fnm must be sourced: `export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)"`
- Biome uses tabs for indentation
- PostToolUse hook runs `npx tsc --noEmit` after edits
- Run tests: `npm test`
- Run build: `npm run build`
- Run lint: `npm run check`

---

### Task 1: Template Types & Segment Specs

**Files:**
- Create: `src/types/template.ts`
- Create: `src/constants/segmentSpecs.ts`
- Modify: `src/types/index.ts` (re-export new types)
- Test: `tests/constants/segmentSpecs.test.ts`

**Step 1: Create template types**

Create `src/types/template.ts`:

```typescript
export type SegmentSpecId =
	| "straight_1m"
	| "straight_2m"
	| "straight_3m"
	| "curve_90_left"
	| "curve_90_right"
	| "curve_45_left"
	| "curve_45_right"
	| "curve_30_wide"
	| "s_curve"
	| "u_turn"
	| "chicane";

export type SegmentCategory = "straight" | "curve" | "complex";

export type ConnectionPointDef = {
	x: number;
	z: number;
	angle: number; // degrees, outward direction
};

export type SegmentSpec = {
	id: SegmentSpecId;
	label: string;
	category: SegmentCategory;
	entryPoint: ConnectionPointDef;
	exitPoint: ConnectionPointDef;
	arcCenter?: { x: number; z: number };
	arcRadius?: number;
	arcSweep?: number; // degrees
	length: number; // approximate centerline length in meters
};

export type SegmentConnection = {
	segmentId: string | null;
};

export type Segment = {
	id: string;
	specId: SegmentSpecId;
	position: { x: number; z: number };
	rotation: number; // degrees
	connections: {
		entry: SegmentConnection;
		exit: SegmentConnection;
	};
};

export type PrefabId =
	| "windmill"
	| "ramp"
	| "tunnel"
	| "loop"
	| "bumper_post"
	| "wall_bank";

export type PrefabObstacle = {
	id: string;
	prefabId: PrefabId;
	position: { x: number; z: number };
	rotation: number;
};

export type Obstacle = PrefabObstacle;

export type HoleTemplate = {
	id: string;
	version: 1;
	name: string;
	feltWidth: number;
	segments: Segment[];
	obstacles: Obstacle[];
	defaultPar: number;
	color: string;
	createdAt: string;
};
```

**Step 2: Create segment specs**

Create `src/constants/segmentSpecs.ts` with all 11 segment type specs. Each spec defines entry/exit connection points in local coordinate space (entry is at origin facing -Z, exit faces the direction the path continues):

```typescript
import type { SegmentCategory, SegmentSpec, SegmentSpecId } from "../types/template";

// Convention: entry at origin facing -Z (angle=180), path continues in +Z direction
// All coordinates in meters, angles in degrees

const R_90 = 0.8; // radius for 90-degree curves
const R_45 = 1.2; // radius for 45-degree curves
const R_30 = 2.0; // radius for 30-degree wide curve

export const SEGMENT_SPECS: Record<SegmentSpecId, SegmentSpec> = {
	straight_1m: {
		id: "straight_1m",
		label: "Straight 1m",
		category: "straight",
		entryPoint: { x: 0, z: 0, angle: 180 },
		exitPoint: { x: 0, z: 1, angle: 0 },
		length: 1,
	},
	straight_2m: {
		id: "straight_2m",
		label: "Straight 2m",
		category: "straight",
		entryPoint: { x: 0, z: 0, angle: 180 },
		exitPoint: { x: 0, z: 2, angle: 0 },
		length: 2,
	},
	straight_3m: {
		id: "straight_3m",
		label: "Straight 3m",
		category: "straight",
		entryPoint: { x: 0, z: 0, angle: 180 },
		exitPoint: { x: 0, z: 3, angle: 0 },
		length: 3,
	},
	curve_90_left: {
		id: "curve_90_left",
		label: "90\u00b0 Left",
		category: "curve",
		entryPoint: { x: 0, z: 0, angle: 180 },
		exitPoint: {
			x: -R_90 + R_90 * Math.cos(Math.PI / 2),
			z: R_90 * Math.sin(Math.PI / 2),
			angle: 270,
		},
		arcCenter: { x: -R_90, z: 0 },
		arcRadius: R_90,
		arcSweep: 90,
		length: (Math.PI / 2) * R_90,
	},
	curve_90_right: {
		id: "curve_90_right",
		label: "90\u00b0 Right",
		category: "curve",
		entryPoint: { x: 0, z: 0, angle: 180 },
		exitPoint: {
			x: R_90 - R_90 * Math.cos(Math.PI / 2),
			z: R_90 * Math.sin(Math.PI / 2),
			angle: 90,
		},
		arcCenter: { x: R_90, z: 0 },
		arcRadius: R_90,
		arcSweep: 90,
		length: (Math.PI / 2) * R_90,
	},
	curve_45_left: {
		id: "curve_45_left",
		label: "45\u00b0 Left",
		category: "curve",
		entryPoint: { x: 0, z: 0, angle: 180 },
		exitPoint: {
			x: -R_45 + R_45 * Math.cos(Math.PI / 4),
			z: R_45 * Math.sin(Math.PI / 4),
			angle: 225,
		},
		arcCenter: { x: -R_45, z: 0 },
		arcRadius: R_45,
		arcSweep: 45,
		length: (Math.PI / 4) * R_45,
	},
	curve_45_right: {
		id: "curve_45_right",
		label: "45\u00b0 Right",
		category: "curve",
		entryPoint: { x: 0, z: 0, angle: 180 },
		exitPoint: {
			x: R_45 - R_45 * Math.cos(Math.PI / 4),
			z: R_45 * Math.sin(Math.PI / 4),
			angle: 135,
		},
		arcCenter: { x: R_45, z: 0 },
		arcRadius: R_45,
		arcSweep: 45,
		length: (Math.PI / 4) * R_45,
	},
	curve_30_wide: {
		id: "curve_30_wide",
		label: "30\u00b0 Wide",
		category: "curve",
		entryPoint: { x: 0, z: 0, angle: 180 },
		exitPoint: {
			x: -R_30 + R_30 * Math.cos(Math.PI / 6),
			z: R_30 * Math.sin(Math.PI / 6),
			angle: 210,
		},
		arcCenter: { x: -R_30, z: 0 },
		arcRadius: R_30,
		arcSweep: 30,
		length: (Math.PI / 6) * R_30,
	},
	s_curve: {
		id: "s_curve",
		label: "S-Curve",
		category: "complex",
		entryPoint: { x: 0, z: 0, angle: 180 },
		exitPoint: {
			x: -2 * R_90 + 2 * R_90 * Math.cos(Math.PI / 2),
			z: 2 * R_90 * Math.sin(Math.PI / 2),
			angle: 0,
		},
		length: Math.PI * R_90,
	},
	u_turn: {
		id: "u_turn",
		label: "U-Turn",
		category: "complex",
		entryPoint: { x: 0, z: 0, angle: 180 },
		exitPoint: { x: -2 * R_90, z: 0, angle: 180 },
		arcCenter: { x: -R_90, z: 0 },
		arcRadius: R_90,
		arcSweep: 180,
		length: Math.PI * R_90,
	},
	chicane: {
		id: "chicane",
		label: "Chicane",
		category: "complex",
		entryPoint: { x: 0, z: 0, angle: 180 },
		exitPoint: { x: -0.6, z: 2, angle: 0 },
		length: 2.2,
	},
};

export const SEGMENT_SPEC_LIST = Object.values(SEGMENT_SPECS);

export const SEGMENT_CATEGORIES: { id: SegmentCategory; label: string }[] = [
	{ id: "straight", label: "Straight" },
	{ id: "curve", label: "Curve" },
	{ id: "complex", label: "Complex" },
];
```

**Step 3: Add re-export to types index**

Modify `src/types/index.ts` — add at the end:

```typescript
export type {
	HoleTemplate,
	Segment,
	SegmentSpecId,
	SegmentSpec,
	Obstacle,
	PrefabObstacle,
	PrefabId,
	SegmentCategory,
} from "./template";
```

**Step 4: Write tests for segment specs**

Create `tests/constants/segmentSpecs.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { SEGMENT_SPECS, SEGMENT_SPEC_LIST } from "../../src/constants/segmentSpecs";

describe("SEGMENT_SPECS", () => {
	it("defines all 11 segment types", () => {
		expect(SEGMENT_SPEC_LIST).toHaveLength(11);
	});

	it("every spec has matching id key", () => {
		for (const [key, spec] of Object.entries(SEGMENT_SPECS)) {
			expect(spec.id).toBe(key);
		}
	});

	it("every spec has a positive length", () => {
		for (const spec of SEGMENT_SPEC_LIST) {
			expect(spec.length).toBeGreaterThan(0);
		}
	});

	it("every spec has entry angle of 180 (facing -Z)", () => {
		for (const spec of SEGMENT_SPEC_LIST) {
			expect(spec.entryPoint.angle).toBe(180);
		}
	});

	it("every spec has entry at origin", () => {
		for (const spec of SEGMENT_SPEC_LIST) {
			expect(spec.entryPoint.x).toBe(0);
			expect(spec.entryPoint.z).toBe(0);
		}
	});

	it("straight specs have exit along +Z axis", () => {
		const straights = SEGMENT_SPEC_LIST.filter((s) => s.category === "straight");
		for (const spec of straights) {
			expect(spec.exitPoint.x).toBe(0);
			expect(spec.exitPoint.z).toBeGreaterThan(0);
			expect(spec.exitPoint.angle).toBe(0);
		}
	});

	it("curve specs have arc properties", () => {
		const curves = SEGMENT_SPEC_LIST.filter((s) => s.category === "curve");
		for (const spec of curves) {
			expect(spec.arcRadius).toBeGreaterThan(0);
			expect(spec.arcSweep).toBeGreaterThan(0);
			expect(spec.arcCenter).toBeDefined();
		}
	});

	it("left/right curve pairs are mirrored on X axis", () => {
		const l90 = SEGMENT_SPECS.curve_90_left;
		const r90 = SEGMENT_SPECS.curve_90_right;
		expect(l90.exitPoint.x).toBeCloseTo(-r90.exitPoint.x, 5);
		expect(l90.exitPoint.z).toBeCloseTo(r90.exitPoint.z, 5);
	});
});
```

**Step 5: Run tests**

```bash
npm test -- tests/constants/segmentSpecs.test.ts
```

Expected: all tests pass.

**Step 6: Commit**

```bash
git add src/types/template.ts src/types/index.ts src/constants/segmentSpecs.ts tests/constants/segmentSpecs.test.ts
git commit -m "feat: add HoleTemplate types and 11 segment specs"
```

---

### Task 2: Chain Computation & Bounds

**Files:**
- Create: `src/utils/chainCompute.ts`
- Test: `tests/utils/chainCompute.test.ts`

**Step 1: Write failing tests**

Create `tests/utils/chainCompute.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { computeChainPositions, computeTemplateBounds } from "../../src/utils/chainCompute";
import type { HoleTemplate, Segment } from "../../src/types/template";

function makeSegment(specId: string, id?: string): Segment {
	return {
		id: id ?? `seg-${specId}`,
		specId: specId as Segment["specId"],
		position: { x: 0, z: 0 },
		rotation: 0,
		connections: { entry: { segmentId: null }, exit: { segmentId: null } },
	};
}

describe("computeChainPositions", () => {
	it("single straight segment stays at origin", () => {
		const segments = [makeSegment("straight_2m")];
		const result = computeChainPositions(segments);
		expect(result[0].position.x).toBeCloseTo(0);
		expect(result[0].position.z).toBeCloseTo(0);
		expect(result[0].rotation).toBeCloseTo(0);
	});

	it("two straight segments chain end-to-end", () => {
		const segments = [makeSegment("straight_1m", "a"), makeSegment("straight_2m", "b")];
		const result = computeChainPositions(segments);
		expect(result[0].position.z).toBeCloseTo(0);
		expect(result[1].position.z).toBeCloseTo(1); // 1m after first segment
	});

	it("three straight segments accumulate length", () => {
		const segments = [
			makeSegment("straight_1m", "a"),
			makeSegment("straight_2m", "b"),
			makeSegment("straight_3m", "c"),
		];
		const result = computeChainPositions(segments);
		expect(result[2].position.z).toBeCloseTo(3); // 1m + 2m
	});

	it("straight then 90-left turns the chain", () => {
		const segments = [
			makeSegment("straight_1m", "a"),
			makeSegment("curve_90_left", "b"),
		];
		const result = computeChainPositions(segments);
		// After 90-left, the chain should have turned left
		expect(result[1].position.z).toBeCloseTo(1);
		expect(result[1].rotation).toBeCloseTo(0); // curve placed at rotation 0
	});

	it("recomputes all positions from scratch (no drift)", () => {
		const segments = Array.from({ length: 20 }, (_, i) =>
			makeSegment("straight_1m", `s${i}`),
		);
		const result = computeChainPositions(segments);
		expect(result[19].position.z).toBeCloseTo(19);
	});
});

describe("computeTemplateBounds", () => {
	it("computes bounds for a single straight segment", () => {
		const template = {
			feltWidth: 0.6,
			segments: [makeSegment("straight_3m")],
		} as HoleTemplate;
		const bounds = computeTemplateBounds(template);
		expect(bounds.width).toBeCloseTo(0.6);
		expect(bounds.length).toBeCloseTo(3.0);
	});

	it("computes bounds for two straight segments", () => {
		const template = {
			feltWidth: 0.6,
			segments: [makeSegment("straight_2m", "a"), makeSegment("straight_1m", "b")],
		} as HoleTemplate;
		const bounds = computeTemplateBounds(template);
		expect(bounds.width).toBeCloseTo(0.6);
		expect(bounds.length).toBeCloseTo(3.0);
	});
});
```

**Step 2: Implement chain computation**

Create `src/utils/chainCompute.ts`:

```typescript
import { SEGMENT_SPECS } from "../constants/segmentSpecs";
import type { HoleTemplate, Segment } from "../types/template";

const DEG2RAD = Math.PI / 180;

function rotatePoint(
	x: number,
	z: number,
	angleDeg: number,
): { x: number; z: number } {
	const rad = angleDeg * DEG2RAD;
	const cos = Math.cos(rad);
	const sin = Math.sin(rad);
	return {
		x: x * cos - z * sin,
		z: x * sin + z * cos,
	};
}

/**
 * Recompute all segment positions and rotations from scratch.
 * Segment 0 is placed at origin with rotation 0.
 * Each subsequent segment snaps its entry to the previous segment's exit.
 * Returns a new array with updated position/rotation (does not mutate input).
 */
export function computeChainPositions(segments: Segment[]): Segment[] {
	if (segments.length === 0) return [];

	const result: Segment[] = [
		{ ...segments[0], position: { x: 0, z: 0 }, rotation: 0 },
	];

	for (let i = 1; i < segments.length; i++) {
		const prev = result[i - 1];
		const prevSpec = SEGMENT_SPECS[prev.specId];
		const currSpec = SEGMENT_SPECS[segments[i].specId];

		// Previous segment's exit in world space
		const prevExitLocal = rotatePoint(
			prevSpec.exitPoint.x,
			prevSpec.exitPoint.z,
			prev.rotation,
		);
		const prevExitWorld = {
			x: prev.position.x + prevExitLocal.x,
			z: prev.position.z + prevExitLocal.z,
		};
		const prevExitAngle = prevSpec.exitPoint.angle + prev.rotation;

		// Current segment's entry must align with previous exit
		// Entry angle (flipped 180 to face the connection) must match exit angle
		const currEntryAngle = currSpec.entryPoint.angle;
		const currRotation = prevExitAngle - (currEntryAngle + 180);

		// Current entry point in world space (after rotation)
		const currEntryLocal = rotatePoint(
			currSpec.entryPoint.x,
			currSpec.entryPoint.z,
			currRotation,
		);

		result.push({
			...segments[i],
			position: {
				x: prevExitWorld.x - currEntryLocal.x,
				z: prevExitWorld.z - currEntryLocal.z,
			},
			rotation: currRotation,
		});
	}

	return result;
}

/**
 * Compute the axis-aligned bounding box of a template.
 * Returns width (X extent) and length (Z extent) including felt width.
 */
export function computeTemplateBounds(
	template: Pick<HoleTemplate, "segments" | "feltWidth">,
): { width: number; length: number } {
	const positioned = computeChainPositions(template.segments);
	if (positioned.length === 0) return { width: 0, length: 0 };

	let minX = Number.POSITIVE_INFINITY;
	let maxX = Number.NEGATIVE_INFINITY;
	let minZ = Number.POSITIVE_INFINITY;
	let maxZ = Number.NEGATIVE_INFINITY;

	const hw = template.feltWidth / 2;

	for (const seg of positioned) {
		const spec = SEGMENT_SPECS[seg.specId];

		// Check entry and exit points (with felt width margin)
		for (const pt of [spec.entryPoint, spec.exitPoint]) {
			const world = rotatePoint(pt.x, pt.z, seg.rotation);
			const wx = seg.position.x + world.x;
			const wz = seg.position.z + world.z;

			minX = Math.min(minX, wx - hw);
			maxX = Math.max(maxX, wx + hw);
			minZ = Math.min(minZ, wz - hw);
			maxZ = Math.max(maxZ, wz + hw);
		}

		// For curves, also check the arc midpoint
		if (spec.arcCenter && spec.arcRadius && spec.arcSweep) {
			const midAngle = (spec.arcSweep / 2) * DEG2RAD;
			const midX = spec.arcCenter.x + spec.arcRadius * Math.sin(midAngle);
			const midZ = spec.arcCenter.z + spec.arcRadius * Math.cos(midAngle);
			const world = rotatePoint(midX, midZ, seg.rotation);
			const wx = seg.position.x + world.x;
			const wz = seg.position.z + world.z;

			minX = Math.min(minX, wx - hw);
			maxX = Math.max(maxX, wx + hw);
			minZ = Math.min(minZ, wz - hw);
			maxZ = Math.max(maxZ, wz + hw);
		}
	}

	return {
		width: maxX - minX,
		length: maxZ - minZ,
	};
}
```

**Step 3: Run tests**

```bash
npm test -- tests/utils/chainCompute.test.ts
```

Expected: all tests pass. If curve tests fail, adjust the rotation math — curves are the trickiest part.

**Step 4: Commit**

```bash
git add src/utils/chainCompute.ts tests/utils/chainCompute.test.ts
git commit -m "feat: add chain position computation and template bounds"
```

---

### Task 3: Builder Store Slice

**Files:**
- Create: `src/store/builderSlice.ts`
- Modify: `src/store/store.ts` (lines 33-72 for state type, ~432-442 for persistence, and initial state)
- Modify: `src/types/hole.ts` (add optional `templateId`)
- Test: `tests/store/builderSlice.test.ts`

This task adds the builder state, actions, and undo stack to the Zustand store. It also adds `templateId` to the `Hole` type and `holeTemplates` to persisted state.

**Step 1: Create builder slice**

Create `src/store/builderSlice.ts` with all builder state and actions. The slice pattern should match the existing store — actions are methods on the set/get pattern.

Key state fields:
- `holeTemplates: Record<string, HoleTemplate>` (persisted)
- `builderDraft: HoleTemplate | null` (persisted separately for crash recovery)
- `builderMode: boolean` (ephemeral)
- `editingTemplateId: string | null` (ephemeral)
- `builderUndoStack: HoleTemplate[]` (ephemeral)
- `builderRedoStack: HoleTemplate[]` (ephemeral)

Key actions:
- `enterBuilder(templateId?)` — sets builderMode, loads template or creates empty draft
- `exitBuilder()` — clears builderMode, draft, undo stacks
- `saveTemplate()` — validates and saves draft to holeTemplates, exits builder
- `deleteTemplate(id)` — removes template and all placed holes with that templateId
- `duplicateTemplate(id)` — copies with new ID
- `appendSegment(specId, end)` — adds segment to tee or cup end of draft
- `replaceSegment(segmentId, newSpecId)` — swaps segment in place, recomputes chain
- `removeLastSegment(end)` — removes from tee or cup end
- `setDraftName/Par/FeltWidth/Color` — update draft metadata
- `builderUndo/Redo` — snapshot-based undo

All segment operations must call `computeChainPositions()` after modifying the segments array, and push a snapshot to the undo stack before making changes.

**Step 2: Modify Hole type**

In `src/types/hole.ts`, add to the `Hole` type (after `par: number`):

```typescript
templateId?: string;
```

**Step 3: Integrate into store**

In `src/store/store.ts`:
- Add builder state fields to `StoreState` type (after `captureScreenshot`)
- Add `holeTemplates` to the `partialize` block (line ~435-442)
- Add `builderDraft` to the `partialize` block
- Bump persist version from `5` to `6`
- Add v5->v6 migration (adds empty `holeTemplates: {}` and `builderDraft: null`)
- Add builder actions to the store creation
- Do NOT add builder fields to the temporal partialize (builder has its own undo)

**Step 4: Write tests**

Create `tests/store/builderSlice.test.ts` testing:
- `enterBuilder()` creates empty draft with defaults
- `enterBuilder(templateId)` loads existing template
- `appendSegment` adds to chain and recomputes positions
- `replaceSegment` swaps and recomputes
- `removeLastSegment` removes from correct end
- `builderUndo` restores previous draft state
- `builderRedo` re-applies undone change
- `saveTemplate` validates (min 2 segments) and stores to holeTemplates
- `saveTemplate` rejects chain with < 2 segments
- `exitBuilder` clears all builder state
- `deleteTemplate` removes template and placed holes

**Step 5: Run tests**

```bash
npm test -- tests/store/builderSlice.test.ts
```

**Step 6: Commit**

```bash
git add src/store/builderSlice.ts src/store/store.ts src/types/hole.ts tests/store/builderSlice.test.ts
git commit -m "feat: add builder store slice with undo stack and template CRUD"
```

---

### Task 4: Segment Geometry Generation

**Files:**
- Create: `src/utils/segmentGeometry.ts`
- Test: `tests/utils/segmentGeometry.test.ts`

This task creates the 3D geometry generation functions for segments — felt surface, bumpers, tee marker, cup marker. This is the hardest technical task (especially curves) and should be prototyped early.

**Step 1: Implement geometry generation**

Create `src/utils/segmentGeometry.ts`:

For straight segments: box geometry for felt, two box geometries for bumpers. Uses constants from `shared.ts` (SURFACE_THICKNESS, BUMPER_HEIGHT, BUMPER_THICKNESS).

For curve segments: `RingGeometry` for felt surface (inner radius = arcRadius - feltWidth/2, outer radius = arcRadius + feltWidth/2, thetaStart/thetaLength from arcSweep). Curved bumpers via `TubeGeometry` or multiple small boxes along the arc.

For complex segments (s_curve, u_turn, chicane): composed of 2-3 sub-geometry calls internally, returned as a group.

The function signature should be:

```typescript
export function createSegmentGeometries(
	specId: SegmentSpecId,
	feltWidth: number,
): {
	felt: THREE.BufferGeometry;
	bumperLeft: THREE.BufferGeometry;
	bumperRight: THREE.BufferGeometry;
};
```

Note: The implementer should start with straight segments, verify they render correctly, then tackle curves. Curves may need increased tessellation (segments parameter on RingGeometry) to look smooth.

**Step 2: Write tests**

Create `tests/utils/segmentGeometry.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { createSegmentGeometries } from "../../src/utils/segmentGeometry";

describe("createSegmentGeometries", () => {
	it("creates geometries for straight_1m", () => {
		const geom = createSegmentGeometries("straight_1m", 0.6);
		expect(geom.felt).toBeDefined();
		expect(geom.bumperLeft).toBeDefined();
		expect(geom.bumperRight).toBeDefined();
	});

	it("creates geometries for curve_90_left", () => {
		const geom = createSegmentGeometries("curve_90_left", 0.6);
		expect(geom.felt).toBeDefined();
		expect(geom.bumperLeft).toBeDefined();
		expect(geom.bumperRight).toBeDefined();
	});

	it("creates geometries for all 11 specs without errors", () => {
		const specs = [
			"straight_1m", "straight_2m", "straight_3m",
			"curve_90_left", "curve_90_right", "curve_45_left", "curve_45_right",
			"curve_30_wide", "s_curve", "u_turn", "chicane",
		] as const;
		for (const specId of specs) {
			const geom = createSegmentGeometries(specId, 0.6);
			expect(geom.felt).toBeDefined();
		}
	});

	it("felt geometry has vertices", () => {
		const geom = createSegmentGeometries("straight_2m", 0.6);
		const posAttr = geom.felt.getAttribute("position");
		expect(posAttr.count).toBeGreaterThan(0);
	});
});
```

**Step 3: Run tests**

```bash
npm test -- tests/utils/segmentGeometry.test.ts
```

Note: These tests run in Node (Vitest), so Three.js geometries must work without a WebGL context. `BufferGeometry`, `BoxGeometry`, `RingGeometry` all work in Node — they're CPU-side data structures. If imports fail, the implementer may need to add `three` to Vitest's `deps.inline` config.

**Step 4: Commit**

```bash
git add src/utils/segmentGeometry.ts tests/utils/segmentGeometry.test.ts
git commit -m "feat: add segment geometry generation for all 11 types"
```

---

### Task 5: Builder Fullscreen Layout (Mobile-First)

**Files:**
- Create: `src/components/builder/Builder.tsx`
- Create: `src/components/builder/BuilderUI.tsx`
- Create: `src/components/builder/SegmentPalette.tsx`
- Create: `src/components/builder/ChainList.tsx`
- Modify: `src/App.tsx` (conditionally render Builder)

This task creates the Builder shell — the fullscreen layout with top bar, bottom panel (mobile), sidebar (desktop), segment palette with 3 categories, and chain list. No R3F canvas yet — that's Task 6.

**Step 1: Create SegmentPalette**

Create `src/components/builder/SegmentPalette.tsx`:
- Groups segments by category (Straight | Curve | Complex)
- Mobile: 3 category buttons, tap to expand showing segment types
- Desktop: collapsible sections
- Each segment type shows icon/label
- Calls `onSelect(specId)` prop when tapped
- Highlight when a segment is active (for replace mode)
- Uses `SEGMENT_SPEC_LIST` and `SEGMENT_CATEGORIES` from constants

**Step 2: Create ChainList**

Create `src/components/builder/ChainList.tsx`:
- Reads `builderDraft.segments` from store
- Renders numbered list: "1. Straight 2m -> 2. 90deg Left -> ..."
- Shows total hole length (sum of segment lengths)
- Tap/click to select a segment (for replace or delete)
- Highlights selected segment

**Step 3: Create BuilderUI**

Create `src/components/builder/BuilderUI.tsx`:
- Top bar: hole name (input), felt width slider (0.4-1.0m, step 0.1), par selector (1-6), undo/redo buttons, Fit button, Save/Cancel buttons
- Mobile bottom panel: tabbed (Build | Chain), uses SegmentPalette and ChainList
- Desktop: these components render in a left sidebar instead
- Uses `isMobile` from `src/utils/isMobile.ts` to switch layouts
- Save calls `saveTemplate()` from store, Cancel calls `exitBuilder()` with confirmation dialog if draft has segments

**Step 4: Create Builder**

Create `src/components/builder/Builder.tsx`:
- Fullscreen fixed overlay (`position: fixed, inset: 0, z-50`)
- Contains BuilderUI + a placeholder div for the canvas (grey background with "Canvas coming in Task 6" text)
- Reads `builderMode` from store — if false, returns null
- Default export (for lazy loading)

**Step 5: Integrate into App.tsx**

In `src/App.tsx`:
- Add lazy import: `const Builder = lazy(() => import("./components/builder/Builder"));`
- Add `builderMode` selector: `const builderMode = useStore((s) => s.builderMode);`
- Render `<Suspense fallback={null}><Builder /></Suspense>` after the main layout div (it's a fixed overlay, so position doesn't matter)

**Step 6: Verify**

- Run `npx tsc --noEmit` — no type errors
- Run `npm run build` — builds successfully
- Run `npm run check` — no lint errors
- Manually test: open app, call `useStore.getState().enterBuilder()` from console, verify fullscreen builder appears with palette and chain list

**Step 7: Commit**

```bash
git add src/components/builder/ src/App.tsx
git commit -m "feat: add builder fullscreen layout with segment palette and chain list"
```

---

### Task 6: Builder R3F Canvas

**Files:**
- Create: `src/components/builder/BuilderCanvas.tsx`
- Modify: `src/components/builder/Builder.tsx` (replace placeholder with canvas)

This task creates the 3D canvas inside the builder — orthographic top-down camera, segment mesh rendering, ghost preview at the active build point, pulsing connection dots, and the floating rotate button.

**Step 1: Create BuilderCanvas**

Create `src/components/builder/BuilderCanvas.tsx`:

Contains:
- `<Canvas>` with orthographic camera, top-down view, zoom/pan controls
- Renders each segment in `builderDraft.segments` as a `<SegmentMesh>` group:
  - Felt surface mesh (green/UV material based on uvMode)
  - Left + right bumper meshes
  - Tee marker on first segment, cup marker on last
  - Selection highlight (orange outline) on selected segment
- Grid floor for reference
- **GhostSegment**: semi-transparent preview of the next segment at the active open end
  - Green tint if valid, red if invalid (chain would go out of build area)
  - Rotation controlled by current ghost rotation state
- **ConnectionDots**: pulsing green circles at the two open ends (tee entry, cup exit)
  - Tap/click to set active build point
- **RotateButton** (mobile): floating button near the active build point
  - Tap to cycle ghost rotation in 90deg increments

Interaction:
- Click on empty canvas area at open end: place the ghost segment (calls `appendSegment`)
- Click on existing segment: select it (for replace/delete)
- Pinch to zoom, drag to pan (uses drei `MapControls` or `OrthographicCamera` with manual controls)

**Step 2: Integrate into Builder.tsx**

Replace the placeholder div with:
```tsx
<Canvas orthographic camera={{ zoom: 80, position: [0, 10, 0], up: [0, 0, -1] }}>
	<Suspense fallback={null}>
		<BuilderCanvas />
	</Suspense>
</Canvas>
```

**Step 3: Verify**

- Run `npx tsc --noEmit`
- Run `npm run build`
- Manually test: enter builder, verify segments render when added via store console
- Verify camera zoom/pan works on both desktop and mobile

**Step 4: Commit**

```bash
git add src/components/builder/BuilderCanvas.tsx src/components/builder/Builder.tsx
git commit -m "feat: add builder 3D canvas with segment rendering and ghost preview"
```

---

### Task 7: Builder Interaction — Place, Replace, Delete

**Files:**
- Modify: `src/components/builder/BuilderCanvas.tsx` (wire interactions)
- Modify: `src/components/builder/BuilderUI.tsx` (replace mode, delete button)
- Modify: `src/components/builder/SegmentPalette.tsx` (replace mode visual)

This task wires up the full interaction loop:
1. User taps segment type in palette -> ghost appears at open end
2. User taps/clicks to place -> segment added to chain
3. User taps existing segment -> selected (highlighted)
4. User taps a different type in palette while segment is selected -> replace-in-place
5. User taps Delete while segment is selected -> removes from end

**Key interactions to implement:**

- **Place flow**: palette selection -> ghost rendering at open end -> click/tap to confirm -> `appendSegment(specId, activeEnd)`
- **Replace flow**: select segment on canvas or chain list -> palette enters replace mode (banner on mobile) -> tap type -> `replaceSegment(segmentId, newSpecId)` -> exit replace mode
- **Delete flow**: select segment -> Delete key (desktop) or Delete button in bottom sheet (mobile) -> `removeLastSegment(end)` (only if selected segment is at an end)
- **Undo/Redo**: buttons in top bar call `builderUndo()` / `builderRedo()`
- **Fit to hole**: button in top bar adjusts camera zoom to fit all segments

**Step 1: Implement interactions**

Wire up event handlers in BuilderCanvas:
- Raycasting for segment selection (click on segment mesh -> select)
- Raycasting for placement (click near connection dot -> place ghost)
- Ghost rotation state (local state, R key or rotate button cycles it)

Wire up BuilderUI:
- Replace mode state: when a segment is selected and user taps palette, call replaceSegment
- Delete button: visible when segment is selected, only enabled if segment is at an end
- Mobile banner for replace mode: "Tap a type to replace" with dismiss

Wire up SegmentPalette:
- In replace mode: show swap icon on segment type buttons
- On select: call replace instead of setting ghost type

**Step 2: Verify**

- Run `npx tsc --noEmit`
- Manually test the full build flow:
  1. Enter builder
  2. Tap "Straight 2m" -> ghost appears -> tap to place
  3. Tap "90 Left" -> ghost at end -> tap to place
  4. Tap "Straight 1m" -> place
  5. Tap segment 2 -> replace with "90 Right"
  6. Undo -> segment 2 is back to "90 Left"
  7. Delete last segment
  8. Save -> verify template in store

**Step 3: Commit**

```bash
git add src/components/builder/
git commit -m "feat: wire builder interactions — place, replace, delete, undo"
```

---

### Task 8: Planner Integration — Place & Render Template Holes

**Files:**
- Create: `src/components/three/holes/TemplateHoleModel.tsx`
- Modify: `src/components/three/holes/HoleModel.tsx` (add templateId branch)
- Modify: `src/components/ui/HoleLibrary.tsx` (add "My Holes" section + "Build Hole" button)
- Modify: `src/utils/collision.ts` (handle template hole bounds)
- Modify: `src/store/store.ts` (`addHole` action — support templateId)

This task makes custom-built holes placeable and renderable in the main planner.

**Step 1: Create TemplateHoleModel**

Create `src/components/three/holes/TemplateHoleModel.tsx`:
- Takes `templateId: string` prop
- Reads template from `useStore(s => s.holeTemplates[templateId])`
- Calls `computeChainPositions()` on template segments
- Renders each segment's geometry (felt + bumpers) positioned according to chain computation
- Uses existing materials from `shared.ts` (respects uvMode and materialProfile)
- Renders tee marker on first segment, cup marker on last

**Step 2: Modify HoleModel dispatch**

In `src/components/three/holes/HoleModel.tsx`:
- Add `templateId?: string` to `HoleModelProps`
- At the top of the function, before the switch: `if (templateId) return <TemplateHoleModel templateId={templateId} />;`
- Then the existing switch handles legacy types as before

**Step 3: Modify HoleLibrary**

In `src/components/ui/HoleLibrary.tsx`:
- Read `holeTemplates` from store
- After the existing hole types list, add a "My Holes" section
- List each template with name, color swatch, segment count, par
- Tap/click to place (sets `placingType` to a special value, or use a new `placingTemplateId` UI state)
- Add "Build Hole" button at the bottom that calls `enterBuilder()`
- Add "Edit" icon button on each custom hole that calls `enterBuilder(templateId)`

**Step 4: Modify collision.ts**

In `src/utils/collision.ts`:
- Import `computeTemplateBounds`
- Where holes are converted to OBBInput for collision checking, handle holes with `templateId`:
  - Use `computeTemplateBounds(template)` for width/length instead of `HOLE_TYPE_MAP[hole.type].dimensions`

**Step 5: Modify addHole in store**

In `src/store/store.ts`, the `addHole` action:
- Accept optional `templateId` parameter
- When templateId is provided: look up template, compute bounds, create Hole with templateId set
- Set `type` to the first legacy type as placeholder (or keep it as `"straight"` — it's only used for legacy rendering which won't trigger when templateId is set)

**Step 6: Verify**

- Run `npx tsc --noEmit`
- Run `npm test` — all existing tests still pass
- Run `npm run build`
- Manually test: build a hole, save it, verify it appears in "My Holes", place it on the hall, verify it renders with segments, verify collision works

**Step 7: Commit**

```bash
git add src/components/three/holes/TemplateHoleModel.tsx src/components/three/holes/HoleModel.tsx src/components/ui/HoleLibrary.tsx src/utils/collision.ts src/store/store.ts
git commit -m "feat: integrate template holes into planner — place, render, collide"
```

---

### Task 9: Save Format v6 Migration & Persistence

**Files:**
- Modify: `src/store/store.ts` (migration function, persistence config)
- Test: `tests/store/migration.test.ts` (or add to existing migration test file)

**Step 1: Add v5->v6 migration**

In `src/store/store.ts`, in the `migrate` function inside `persist()`:
- Add case for version 5->6: set `holeTemplates = {}`, `builderDraft = null`
- Update persist version to `6`

**Step 2: Write migration test**

Add tests verifying:
- v5 state migrates to v6 with empty holeTemplates
- Existing holes, budget, expenses are preserved
- v6 state loads correctly with holeTemplates populated

**Step 3: Run tests**

```bash
npm test
```

All existing + new tests pass.

**Step 4: Commit**

```bash
git add src/store/store.ts tests/store/migration.test.ts
git commit -m "feat: add v5 to v6 save format migration with holeTemplates"
```

---

### Task 10: SVG Export & Final Integration

**Files:**
- Modify: `src/utils/floorPlanExport.ts` (handle template holes in SVG)
- Modify: `src/components/ui/DetailPanel.tsx` (show template info)

**Step 1: SVG export for template holes**

In `src/utils/floorPlanExport.ts`:
- When generating SVG for a hole with `templateId`:
  - Look up the template
  - Compute chain positions
  - Draw each segment as a filled rectangle/arc (2D projection of the 3D geometry)
  - Or simpler: draw the bounding box rectangle with the template's color, same as legacy holes
- Fall back to bounding box rectangle if segment rendering is too complex for SVG

**Step 2: Detail panel for template holes**

In `src/components/ui/DetailPanel.tsx`:
- When selected hole has `templateId`, show:
  - Template name
  - Segment count
  - Total length
  - "Edit in Builder" button (calls `enterBuilder(templateId)`)

**Step 3: Verify full flow**

- Run `npx tsc --noEmit`
- Run `npm test` — all tests pass
- Run `npm run build` — succeeds
- Manually test end-to-end:
  1. Open app
  2. Click "Build Hole"
  3. Build a 5-segment hole with a curve
  4. Save
  5. Place on hall
  6. Select it — detail panel shows template info
  7. Click "Edit in Builder" — builder opens with the hole loaded
  8. Export SVG — template hole appears
  9. Toggle UV mode — template hole renders with UV materials
  10. Toggle 3D view — template hole renders in 3D

**Step 4: Commit**

```bash
git add src/utils/floorPlanExport.ts src/components/ui/DetailPanel.tsx
git commit -m "feat: add SVG export and detail panel for template holes"
```

---

## Task Dependency Graph

```
Task 1 (Types + Specs)
  └─> Task 2 (Chain Computation)
       └─> Task 3 (Builder Store)
            ├─> Task 4 (Segment Geometry) [can parallel with 5]
            ├─> Task 5 (Builder Layout)
            │    └─> Task 6 (Builder Canvas)
            │         └─> Task 7 (Builder Interactions)
            └─> Task 8 (Planner Integration) [after 4, 6, 7]
                 └─> Task 9 (Migration)
                      └─> Task 10 (SVG + Detail)
```

Tasks 4 and 5 can run in parallel after Task 3 is complete.
