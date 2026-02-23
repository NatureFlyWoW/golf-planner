diff --git a/src/components/layout/DualViewport.tsx b/src/components/layout/DualViewport.tsx
index c185ed0..fd256fd 100644
--- a/src/components/layout/DualViewport.tsx
+++ b/src/components/layout/DualViewport.tsx
@@ -33,6 +33,7 @@ import { ViewportContext } from "../../contexts/ViewportContext";
 import type { ViewportInfo } from "../../contexts/ViewportContext";
 import { useMouseStatusStore } from "../../stores/mouseStatusStore";
 import { canvasPointerEvents } from "../../utils/uvTransitionConfig";
+import { WalkthroughController } from "../three/environment/WalkthroughController";
 import { CameraPresets } from "../three/CameraPresets";
 import { PlacementHandler } from "../three/PlacementHandler";
 import { SharedScene } from "../three/SharedScene";
@@ -395,7 +396,14 @@ export function DualViewport({ sunData }: DualViewportProps) {
 								near={0.1}
 								far={500}
 							/>
-							<CameraControls ref={controls3DRef} makeDefault />
+							<CameraControls
+								ref={controls3DRef}
+								makeDefault
+								enabled={!walkthroughMode}
+							/>
+							{walkthroughMode && (
+								<WalkthroughController targetRef={pane3DRef} />
+							)}
 							<SharedScene sunData={sunData} />
 							<ThreeDOnlyContent />
 							{!show2D && <PlacementHandler />}
diff --git a/src/components/three/environment/WalkthroughController.tsx b/src/components/three/environment/WalkthroughController.tsx
new file mode 100644
index 0000000..8f8256e
--- /dev/null
+++ b/src/components/three/environment/WalkthroughController.tsx
@@ -0,0 +1,147 @@
+import { useFrame, useThree } from "@react-three/fiber";
+import { useEffect, useRef } from "react";
+import { Euler, Vector3 } from "three";
+import { HALL } from "../../../constants/hall";
+import { useStore } from "../../../store";
+import {
+	EYE_HEIGHT,
+	LOOK_SENSITIVITY,
+	clampPitch,
+	computeMovementVector,
+	getWalkthroughSpawnPoint,
+} from "../../../utils/walkthroughCamera";
+import type { KeyState } from "../../../utils/walkthroughCamera";
+
+type WalkthroughControllerProps = {
+	targetRef: React.RefObject<HTMLDivElement | null>;
+};
+
+const KEY_MAP: Record<string, keyof Omit<KeyState, "shift">> = {
+	w: "forward",
+	arrowup: "forward",
+	s: "backward",
+	arrowdown: "backward",
+	a: "left",
+	arrowleft: "left",
+	d: "right",
+	arrowright: "right",
+};
+
+export function WalkthroughController({
+	targetRef,
+}: WalkthroughControllerProps) {
+	const { camera } = useThree();
+	const hall = useStore((s) => s.hall);
+
+	const eulerRef = useRef(new Euler(0, 0, 0, "YXZ"));
+	const keyStateRef = useRef<KeyState>({
+		forward: false,
+		backward: false,
+		left: false,
+		right: false,
+		shift: false,
+	});
+	const isDraggingRef = useRef(false);
+	const lastPointerRef = useRef({ x: 0, y: 0 });
+
+	// Mount: teleport camera to spawn point
+	useEffect(() => {
+		const spawn = getWalkthroughSpawnPoint(hall);
+		camera.position.set(spawn.x, spawn.y, spawn.z);
+		eulerRef.current.set(0, 0, 0, "YXZ");
+		camera.quaternion.setFromEuler(eulerRef.current);
+	}, [camera, hall]);
+
+	// Keyboard listeners
+	useEffect(() => {
+		function handleKeyDown(e: KeyboardEvent) {
+			const key = e.key.toLowerCase();
+			if (key === "shift") {
+				keyStateRef.current.shift = true;
+				e.stopPropagation();
+				return;
+			}
+			const mapped = KEY_MAP[key];
+			if (mapped) {
+				keyStateRef.current[mapped] = true;
+				e.stopPropagation();
+			}
+		}
+
+		function handleKeyUp(e: KeyboardEvent) {
+			const key = e.key.toLowerCase();
+			if (key === "shift") {
+				keyStateRef.current.shift = false;
+				e.stopPropagation();
+				return;
+			}
+			const mapped = KEY_MAP[key];
+			if (mapped) {
+				keyStateRef.current[mapped] = false;
+				e.stopPropagation();
+			}
+		}
+
+		window.addEventListener("keydown", handleKeyDown, true);
+		window.addEventListener("keyup", handleKeyUp, true);
+		return () => {
+			window.removeEventListener("keydown", handleKeyDown, true);
+			window.removeEventListener("keyup", handleKeyUp, true);
+		};
+	}, []);
+
+	// Pointer listeners for look (click-drag)
+	useEffect(() => {
+		const el = targetRef.current;
+		if (!el) return;
+
+		function handlePointerDown(e: PointerEvent) {
+			isDraggingRef.current = true;
+			lastPointerRef.current = { x: e.clientX, y: e.clientY };
+			(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
+		}
+
+		function handlePointerMove(e: PointerEvent) {
+			if (!isDraggingRef.current) return;
+			const dx = e.clientX - lastPointerRef.current.x;
+			const dy = e.clientY - lastPointerRef.current.y;
+			eulerRef.current.y -= dx * LOOK_SENSITIVITY;
+			eulerRef.current.x = clampPitch(
+				eulerRef.current.x - dy * LOOK_SENSITIVITY,
+			);
+			lastPointerRef.current = { x: e.clientX, y: e.clientY };
+		}
+
+		function handlePointerUp() {
+			isDraggingRef.current = false;
+		}
+
+		el.addEventListener("pointerdown", handlePointerDown);
+		el.addEventListener("pointermove", handlePointerMove);
+		el.addEventListener("pointerup", handlePointerUp);
+		el.addEventListener("pointercancel", handlePointerUp);
+		return () => {
+			el.removeEventListener("pointerdown", handlePointerDown);
+			el.removeEventListener("pointermove", handlePointerMove);
+			el.removeEventListener("pointerup", handlePointerUp);
+			el.removeEventListener("pointercancel", handlePointerUp);
+		};
+	}, [targetRef]);
+
+	// Per-frame movement
+	useFrame((_state, delta) => {
+		camera.quaternion.setFromEuler(eulerRef.current);
+
+		// TODO: Section 03 — wrap with checkWalkthroughCollision
+		const mv = computeMovementVector(
+			keyStateRef.current,
+			eulerRef.current.y,
+			delta,
+		);
+		camera.position.x += mv.x;
+		camera.position.z += mv.z;
+		camera.position.y = EYE_HEIGHT;
+	});
+
+	return null;
+}
diff --git a/src/utils/walkthroughCamera.ts b/src/utils/walkthroughCamera.ts
new file mode 100644
index 0000000..3b23ee7
--- /dev/null
+++ b/src/utils/walkthroughCamera.ts
@@ -0,0 +1,79 @@
+import type { Hall } from "../types/hall";
+
+export const WALK_SPEED = 2.0;
+export const RUN_SPEED = 4.0;
+export const EYE_HEIGHT = 1.7;
+export const LOOK_SENSITIVITY = 0.003;
+export const MAX_PITCH = (85 * Math.PI) / 180;
+const SPAWN_OFFSET_FROM_SOUTH_WALL = 0.5;
+
+export type KeyState = {
+	forward: boolean;
+	backward: boolean;
+	left: boolean;
+	right: boolean;
+	shift: boolean;
+};
+
+type MovementResult = { x: number; y: number; z: number };
+
+/**
+ * Compute world-space movement delta for one frame.
+ * Yaw angle (radians) describes camera horizontal facing (Y-axis rotation).
+ * Returns a vector ready to be added to camera position.
+ * Y is always 0 — vertical position is locked to EYE_HEIGHT externally.
+ */
+export function computeMovementVector(
+	keys: KeyState,
+	yaw: number,
+	delta: number,
+): MovementResult {
+	// Front vector: -Z is forward at yaw=0 (Three.js convention)
+	const fx = -Math.sin(yaw);
+	const fz = -Math.cos(yaw);
+
+	// Side vector (right): perpendicular to front on XZ plane
+	const sx = Math.cos(yaw);
+	const sz = -Math.sin(yaw);
+
+	const fb = (keys.forward ? 1 : 0) - (keys.backward ? 1 : 0);
+	const rl = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
+
+	let dx = fx * fb + sx * rl;
+	let dz = fz * fb + sz * rl;
+
+	const len = Math.sqrt(dx * dx + dz * dz);
+	if (len > 0) {
+		dx /= len;
+		dz /= len;
+	}
+
+	const speed = keys.shift ? RUN_SPEED : WALK_SPEED;
+	return { x: dx * speed * delta, y: 0, z: dz * speed * delta };
+}
+
+/**
+ * Clamp pitch angle (radians) to prevent camera flip.
+ * Positive pitch = looking up, negative pitch = looking down.
+ */
+export function clampPitch(pitch: number): number {
+	return Math.max(-MAX_PITCH, Math.min(MAX_PITCH, pitch));
+}
+
+/**
+ * Compute the camera spawn position for walkthrough mode.
+ * Places the camera just inside the south wall near the PVC entrance door.
+ */
+export function getWalkthroughSpawnPoint(hall: Hall): {
+	x: number;
+	y: number;
+	z: number;
+} {
+	const pvcDoor = hall.doors.find((d) => d.type === "pvc");
+	const x = pvcDoor ? pvcDoor.offset : hall.width / 2;
+	return {
+		x,
+		y: EYE_HEIGHT,
+		z: hall.length - SPAWN_OFFSET_FROM_SOUTH_WALL,
+	};
+}
diff --git a/tests/utils/walkthroughCamera.test.ts b/tests/utils/walkthroughCamera.test.ts
new file mode 100644
index 0000000..5d9ce1f
--- /dev/null
+++ b/tests/utils/walkthroughCamera.test.ts
@@ -0,0 +1,155 @@
+import { describe, expect, it } from "vitest";
+import { HALL } from "../../src/constants/hall";
+import {
+	EYE_HEIGHT,
+	RUN_SPEED,
+	WALK_SPEED,
+	clampPitch,
+	computeMovementVector,
+	getWalkthroughSpawnPoint,
+} from "../../src/utils/walkthroughCamera";
+
+const noKeys = {
+	forward: false,
+	backward: false,
+	left: false,
+	right: false,
+	shift: false,
+};
+
+describe("computeMovementVector", () => {
+	it("forward key produces movement in -Z direction at 0° yaw", () => {
+		const mv = computeMovementVector(
+			{ ...noKeys, forward: true },
+			0,
+			1,
+		);
+		expect(mv.z).toBeLessThan(0);
+		expect(Math.abs(mv.x)).toBeLessThan(0.001);
+	});
+
+	it("backward key produces movement in +Z direction at 0° yaw", () => {
+		const mv = computeMovementVector(
+			{ ...noKeys, backward: true },
+			0,
+			1,
+		);
+		expect(mv.z).toBeGreaterThan(0);
+		expect(Math.abs(mv.x)).toBeLessThan(0.001);
+	});
+
+	it("left strafe produces movement in -X direction at 0° yaw", () => {
+		const mv = computeMovementVector({ ...noKeys, left: true }, 0, 1);
+		expect(mv.x).toBeLessThan(0);
+		expect(Math.abs(mv.z)).toBeLessThan(0.001);
+	});
+
+	it("right strafe produces movement in +X direction at 0° yaw", () => {
+		const mv = computeMovementVector({ ...noKeys, right: true }, 0, 1);
+		expect(mv.x).toBeGreaterThan(0);
+		expect(Math.abs(mv.z)).toBeLessThan(0.001);
+	});
+
+	it("diagonal movement (forward + left) normalizes to unit length × speed", () => {
+		const mv = computeMovementVector(
+			{ ...noKeys, forward: true, left: true },
+			0,
+			1,
+		);
+		const len = Math.sqrt(mv.x ** 2 + mv.z ** 2);
+		expect(len).toBeCloseTo(WALK_SPEED, 3);
+	});
+
+	it("movement scales with delta time (0.016s vs 0.032s = double distance)", () => {
+		const mv1 = computeMovementVector(
+			{ ...noKeys, forward: true },
+			0,
+			0.016,
+		);
+		const mv2 = computeMovementVector(
+			{ ...noKeys, forward: true },
+			0,
+			0.032,
+		);
+		expect(Math.abs(mv2.z)).toBeCloseTo(Math.abs(mv1.z) * 2, 5);
+	});
+
+	it("walk speed is 2.0 m/s", () => {
+		expect(WALK_SPEED).toBe(2.0);
+		const mv = computeMovementVector(
+			{ ...noKeys, forward: true },
+			0,
+			1,
+		);
+		const len = Math.sqrt(mv.x ** 2 + mv.z ** 2);
+		expect(len).toBeCloseTo(2.0, 3);
+	});
+
+	it("run speed (shift held) is 4.0 m/s", () => {
+		expect(RUN_SPEED).toBe(4.0);
+		const mv = computeMovementVector(
+			{ ...noKeys, forward: true, shift: true },
+			0,
+			1,
+		);
+		const len = Math.sqrt(mv.x ** 2 + mv.z ** 2);
+		expect(len).toBeCloseTo(4.0, 3);
+	});
+
+	it("Y component of movement vector is always 0", () => {
+		const mv = computeMovementVector(
+			{ ...noKeys, forward: true, left: true, shift: true },
+			Math.PI / 4,
+			0.016,
+		);
+		expect(mv.y).toBe(0);
+	});
+});
+
+describe("clampPitch", () => {
+	const MAX_PITCH = (85 * Math.PI) / 180;
+
+	it("clamps at +85° (looking nearly straight up)", () => {
+		expect(clampPitch(Math.PI / 2)).toBeCloseTo(MAX_PITCH, 5);
+	});
+
+	it("clamps at -85° (looking nearly straight down)", () => {
+		expect(clampPitch(-Math.PI / 2)).toBeCloseTo(-MAX_PITCH, 5);
+	});
+
+	it("leaves pitch unchanged when within range", () => {
+		expect(clampPitch(0.5)).toBeCloseTo(0.5, 5);
+		expect(clampPitch(-0.3)).toBeCloseTo(-0.3, 5);
+	});
+
+	it("returns exact boundary values at limits", () => {
+		expect(clampPitch(MAX_PITCH)).toBeCloseTo(MAX_PITCH, 10);
+		expect(clampPitch(-MAX_PITCH)).toBeCloseTo(-MAX_PITCH, 10);
+	});
+});
+
+describe("getWalkthroughSpawnPoint", () => {
+	it("returns position near PVC door (x≈8.1, y=1.7, z≈19.5)", () => {
+		const sp = getWalkthroughSpawnPoint(HALL);
+		expect(sp.x).toBeCloseTo(8.1, 1);
+		expect(sp.y).toBeCloseTo(EYE_HEIGHT, 1);
+		expect(sp.z).toBeCloseTo(19.5, 1);
+	});
+
+	it("spawn point Y is exactly 1.7m (eye level)", () => {
+		const sp = getWalkthroughSpawnPoint(HALL);
+		expect(sp.y).toBe(EYE_HEIGHT);
+	});
+
+	it("spawn point X is within hall boundaries [0, hall.width]", () => {
+		const sp = getWalkthroughSpawnPoint(HALL);
+		expect(sp.x).toBeGreaterThanOrEqual(0);
+		expect(sp.x).toBeLessThanOrEqual(HALL.width);
+	});
+
+	it("spawn point Z is inside hall (not beyond south wall)", () => {
+		const sp = getWalkthroughSpawnPoint(HALL);
+		expect(sp.z).toBeLessThan(HALL.length);
+		expect(sp.z).toBeGreaterThan(0);
+	});
+});
