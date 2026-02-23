import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Euler } from "three";
import { useStore } from "../../../store";
import {
	EYE_HEIGHT,
	LOOK_SENSITIVITY,
	clampPitch,
	computeMovementVector,
	getWalkthroughSpawnPoint,
} from "../../../utils/walkthroughCamera";
import type { KeyState } from "../../../utils/walkthroughCamera";

type WalkthroughControllerProps = {
	targetRef: React.RefObject<HTMLDivElement | null>;
};

const KEY_MAP: Record<string, keyof Omit<KeyState, "shift">> = {
	w: "forward",
	arrowup: "forward",
	s: "backward",
	arrowdown: "backward",
	a: "left",
	arrowleft: "left",
	d: "right",
	arrowright: "right",
};

export function WalkthroughController({
	targetRef,
}: WalkthroughControllerProps) {
	const { camera } = useThree();
	const hall = useStore((s) => s.hall);

	const eulerRef = useRef(new Euler(0, 0, 0, "YXZ"));
	const keyStateRef = useRef<KeyState>({
		forward: false,
		backward: false,
		left: false,
		right: false,
		shift: false,
	});
	const isDraggingRef = useRef(false);
	const lastPointerRef = useRef({ x: 0, y: 0 });

	// Save camera state before walkthrough, restore on unmount
	const savedCameraRef = useRef<{
		px: number;
		py: number;
		pz: number;
		qx: number;
		qy: number;
		qz: number;
		qw: number;
	} | null>(null);

	useEffect(() => {
		// Save current camera pose
		savedCameraRef.current = {
			px: camera.position.x,
			py: camera.position.y,
			pz: camera.position.z,
			qx: camera.quaternion.x,
			qy: camera.quaternion.y,
			qz: camera.quaternion.z,
			qw: camera.quaternion.w,
		};

		// Teleport camera to spawn point
		const spawn = getWalkthroughSpawnPoint(hall);
		camera.position.set(spawn.x, spawn.y, spawn.z);
		eulerRef.current.set(0, 0, 0, "YXZ");
		camera.quaternion.setFromEuler(eulerRef.current);

		return () => {
			// Restore camera to saved position
			const saved = savedCameraRef.current;
			if (saved) {
				camera.position.set(saved.px, saved.py, saved.pz);
				camera.quaternion.set(saved.qx, saved.qy, saved.qz, saved.qw);
			}
		};
	}, [camera, hall]);

	// Keyboard listeners
	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			const key = e.key.toLowerCase();
			if (key === "shift") {
				keyStateRef.current.shift = true;
				e.stopPropagation();
				return;
			}
			const mapped = KEY_MAP[key];
			if (mapped) {
				keyStateRef.current[mapped] = true;
				e.stopPropagation();
			}
		}

		function handleKeyUp(e: KeyboardEvent) {
			const key = e.key.toLowerCase();
			if (key === "shift") {
				keyStateRef.current.shift = false;
				e.stopPropagation();
				return;
			}
			const mapped = KEY_MAP[key];
			if (mapped) {
				keyStateRef.current[mapped] = false;
				e.stopPropagation();
			}
		}

		window.addEventListener("keydown", handleKeyDown, true);
		window.addEventListener("keyup", handleKeyUp, true);
		return () => {
			window.removeEventListener("keydown", handleKeyDown, true);
			window.removeEventListener("keyup", handleKeyUp, true);
			// Reset key state on unmount to avoid stale WASD
			keyStateRef.current = {
				forward: false,
				backward: false,
				left: false,
				right: false,
				shift: false,
			};
			isDraggingRef.current = false;
		};
	}, []);

	// Pointer listeners for look (click-drag)
	useEffect(() => {
		const el = targetRef.current;
		if (!el) return;

		function handlePointerDown(e: PointerEvent) {
			isDraggingRef.current = true;
			lastPointerRef.current = { x: e.clientX, y: e.clientY };
			(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		}

		function handlePointerMove(e: PointerEvent) {
			if (!isDraggingRef.current) return;
			const dx = e.clientX - lastPointerRef.current.x;
			const dy = e.clientY - lastPointerRef.current.y;
			eulerRef.current.y -= dx * LOOK_SENSITIVITY;
			eulerRef.current.x = clampPitch(
				eulerRef.current.x - dy * LOOK_SENSITIVITY,
			);
			lastPointerRef.current = { x: e.clientX, y: e.clientY };
		}

		function handlePointerUp() {
			isDraggingRef.current = false;
		}

		el.addEventListener("pointerdown", handlePointerDown);
		el.addEventListener("pointermove", handlePointerMove);
		el.addEventListener("pointerup", handlePointerUp);
		el.addEventListener("pointercancel", handlePointerUp);
		return () => {
			el.removeEventListener("pointerdown", handlePointerDown);
			el.removeEventListener("pointermove", handlePointerMove);
			el.removeEventListener("pointerup", handlePointerUp);
			el.removeEventListener("pointercancel", handlePointerUp);
		};
	}, [targetRef]);

	// Per-frame movement
	useFrame((_state, delta) => {
		camera.quaternion.setFromEuler(eulerRef.current);

		// TODO: Section 03 — wrap with checkWalkthroughCollision
		const mv = computeMovementVector(
			keyStateRef.current,
			eulerRef.current.y,
			delta,
		);
		camera.position.x += mv.x;
		camera.position.z += mv.z;
		camera.position.y = EYE_HEIGHT;
	});

	return null;
}
