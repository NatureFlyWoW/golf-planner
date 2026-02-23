diff --git a/src/components/three/environment/WalkthroughController.tsx b/src/components/three/environment/WalkthroughController.tsx
index f0522b5..6735404 100644
--- a/src/components/three/environment/WalkthroughController.tsx
+++ b/src/components/three/environment/WalkthroughController.tsx
@@ -1,7 +1,9 @@
 import { useFrame, useThree } from "@react-three/fiber";
 import { useEffect, useRef } from "react";
-import { Euler } from "three";
+import { Euler, MathUtils } from "three";
+import { HOLE_TYPE_MAP } from "../../../constants/holeTypes";
 import { useStore } from "../../../store";
+import type { OBBInput } from "../../../utils/collision";
 import {
 	EYE_HEIGHT,
 	LOOK_SENSITIVITY,
@@ -10,6 +12,7 @@ import {
 	getWalkthroughSpawnPoint,
 } from "../../../utils/walkthroughCamera";
 import type { KeyState } from "../../../utils/walkthroughCamera";
+import { checkWalkthroughCollision } from "../../../utils/walkthroughCollision";
 
 type WalkthroughControllerProps = {
 	targetRef: React.RefObject<HTMLDivElement | null>;
@@ -43,6 +46,13 @@ export function WalkthroughController({
 	const isDraggingRef = useRef(false);
 	const lastPointerRef = useRef({ x: 0, y: 0 });
 
+	// Enter transition state (0.5s lerp from saved position to spawn)
+	const ENTER_DURATION = 0.5;
+	const enterElapsedRef = useRef(0);
+	const enterStartRef = useRef({ x: 0, y: 0, z: 0 });
+	const enterTargetRef = useRef({ x: 0, y: 0, z: 0 });
+	const enteringRef = useRef(true);
+
 	// Save camera state before walkthrough, restore on unmount
 	const savedCameraRef = useRef<{
 		px: number;
@@ -66,9 +76,18 @@ export function WalkthroughController({
 			qw: camera.quaternion.w,
 		};
 
-		// Teleport camera to spawn point
+		// Set up enter transition
 		const spawn = getWalkthroughSpawnPoint(hall);
-		camera.position.set(spawn.x, spawn.y, spawn.z);
+		enterStartRef.current = {
+			x: camera.position.x,
+			y: camera.position.y,
+			z: camera.position.z,
+		};
+		enterTargetRef.current = { x: spawn.x, y: spawn.y, z: spawn.z };
+		enterElapsedRef.current = 0;
+		enteringRef.current = true;
+
+		// Set facing direction immediately (no rotation lerp — prevents nausea)
 		eulerRef.current.set(0, 0, 0, "YXZ");
 		camera.quaternion.setFromEuler(eulerRef.current);
 
@@ -169,16 +188,68 @@ export function WalkthroughController({
 
 	// Per-frame movement
 	useFrame((_state, delta) => {
+		// Enter transition: lerp camera from saved position to spawn
+		if (enteringRef.current) {
+			enterElapsedRef.current += delta;
+			const t = Math.min(enterElapsedRef.current / ENTER_DURATION, 1);
+			const eased = MathUtils.smoothstep(t, 0, 1);
+
+			camera.position.x = MathUtils.lerp(
+				enterStartRef.current.x,
+				enterTargetRef.current.x,
+				eased,
+			);
+			camera.position.y = MathUtils.lerp(
+				enterStartRef.current.y,
+				enterTargetRef.current.y,
+				eased,
+			);
+			camera.position.z = MathUtils.lerp(
+				enterStartRef.current.z,
+				enterTargetRef.current.z,
+				eased,
+			);
+			camera.quaternion.setFromEuler(eulerRef.current);
+
+			if (t >= 1) {
+				enteringRef.current = false;
+			}
+			return; // No WASD movement during transition
+		}
+
 		camera.quaternion.setFromEuler(eulerRef.current);
 
-		// TODO: Section 03 — wrap with checkWalkthroughCollision
 		const mv = computeMovementVector(
 			keyStateRef.current,
 			eulerRef.current.y,
 			delta,
 		);
-		camera.position.x += mv.x;
-		camera.position.z += mv.z;
+		const desiredX = camera.position.x + mv.x;
+		const desiredZ = camera.position.z + mv.z;
+
+		// Build hole OBBs from store for collision
+		const { holes, holeOrder } = useStore.getState();
+		const holeOBBs: OBBInput[] = [];
+		for (const id of holeOrder) {
+			const hole = holes[id];
+			if (!hole) continue;
+			const typeDef = HOLE_TYPE_MAP[hole.type];
+			if (!typeDef) continue;
+			holeOBBs.push({
+				pos: { x: hole.position.x, z: hole.position.z },
+				rot: hole.rotation,
+				w: typeDef.dimensions.width,
+				l: typeDef.dimensions.length,
+			});
+		}
+
+		const resolved = checkWalkthroughCollision(
+			{ x: desiredX, z: desiredZ },
+			holeOBBs,
+			hall,
+		);
+		camera.position.x = resolved.x;
+		camera.position.z = resolved.z;
 		camera.position.y = EYE_HEIGHT;
 	});
 
diff --git a/tests/store/walkthrough.test.ts b/tests/store/walkthrough.test.ts
index 8229310..d09f019 100644
--- a/tests/store/walkthrough.test.ts
+++ b/tests/store/walkthrough.test.ts
@@ -161,6 +161,53 @@ describe("exitWalkthrough", () => {
 	});
 });
 
+describe("Walkthrough lifecycle integration (section 09)", () => {
+	it("enterWalkthrough from 3d-only layout stays 3d-only", () => {
+		useStore.setState((state) => ({
+			ui: { ...state.ui, viewportLayout: "3d-only" },
+		}));
+		useStore.getState().enterWalkthrough();
+		expect(useStore.getState().ui.viewportLayout).toBe("3d-only");
+		expect(useStore.getState().ui.walkthroughMode).toBe(true);
+		expect(useStore.getState().ui.previousViewportLayout).toBe("3d-only");
+	});
+
+	it("exitWalkthrough from stored 3d-only restores 3d-only", () => {
+		const rafCallbacks: Array<() => void> = [];
+		vi.stubGlobal("requestAnimationFrame", (cb: () => void) => {
+			rafCallbacks.push(cb);
+			return rafCallbacks.length;
+		});
+
+		useStore.setState((state) => ({
+			ui: { ...state.ui, viewportLayout: "3d-only" },
+		}));
+		useStore.getState().enterWalkthrough();
+		useStore.getState().exitWalkthrough();
+		for (const cb of rafCallbacks) cb();
+		expect(useStore.getState().ui.viewportLayout).toBe("3d-only");
+		expect(useStore.getState().ui.walkthroughMode).toBe(false);
+
+		vi.unstubAllGlobals();
+	});
+
+	it("walkthroughMode is false after exitWalkthrough", () => {
+		const rafCallbacks: Array<() => void> = [];
+		vi.stubGlobal("requestAnimationFrame", (cb: () => void) => {
+			rafCallbacks.push(cb);
+			return rafCallbacks.length;
+		});
+
+		useStore.getState().enterWalkthrough();
+		expect(useStore.getState().ui.walkthroughMode).toBe(true);
+		useStore.getState().exitWalkthrough();
+		for (const cb of rafCallbacks) cb();
+		expect(useStore.getState().ui.walkthroughMode).toBe(false);
+
+		vi.unstubAllGlobals();
+	});
+});
+
 describe("Persistence exclusion", () => {
 	it("walkthroughMode is not included in persisted state", () => {
 		// The partialize function picks specific top-level keys.
diff --git a/tests/utils/environment.test.ts b/tests/utils/environment.test.ts
index 107afd9..7fa36c5 100644
--- a/tests/utils/environment.test.ts
+++ b/tests/utils/environment.test.ts
@@ -2,9 +2,11 @@ import { describe, expect, it } from "vitest";
 import {
 	deriveFrameloop,
 	shouldEnableFog,
+	shouldEnableNormalFog,
 	shouldEnablePostProcessing,
 	shouldEnableSoftShadows,
 	shouldShowGroundTexture,
+	shouldShowSky,
 } from "../../src/utils/environmentGating";
 
 describe("shouldEnableFog (with viewportLayout)", () => {
@@ -162,3 +164,38 @@ describe("shouldShowGroundTexture", () => {
 		expect(shouldShowGroundTexture("high")).toBe(true);
 	});
 });
+
+describe("shouldShowSky (section 09 cross-check)", () => {
+	it("returns true for normal mode + mid/high GPU", () => {
+		expect(shouldShowSky(false, "mid")).toBe(true);
+		expect(shouldShowSky(false, "high")).toBe(true);
+	});
+
+	it("returns false in UV mode regardless of tier", () => {
+		expect(shouldShowSky(true, "mid")).toBe(false);
+		expect(shouldShowSky(true, "high")).toBe(false);
+		expect(shouldShowSky(true, "low")).toBe(false);
+	});
+
+	it("returns false for low tier in normal mode", () => {
+		expect(shouldShowSky(false, "low")).toBe(false);
+	});
+});
+
+describe("shouldEnableNormalFog (section 09 cross-check)", () => {
+	it('returns true for ("3d-only", uvMode=false, envVisible=true)', () => {
+		expect(shouldEnableNormalFog("3d-only", false, true)).toBe(true);
+	});
+
+	it('returns false in "dual" layout (fog bleeds into 2D pane)', () => {
+		expect(shouldEnableNormalFog("dual", false, true)).toBe(false);
+	});
+
+	it("returns false in UV mode (UV mode uses its own fogExp2)", () => {
+		expect(shouldEnableNormalFog("3d-only", true, true)).toBe(false);
+	});
+
+	it("returns false when environment layer hidden", () => {
+		expect(shouldEnableNormalFog("3d-only", false, false)).toBe(false);
+	});
+});
