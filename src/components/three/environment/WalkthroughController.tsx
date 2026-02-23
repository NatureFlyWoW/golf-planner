import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Euler, MathUtils } from "three";
import { HOLE_TYPE_MAP } from "../../../constants/holeTypes";
import { useStore } from "../../../store";
import { computeTemplateBounds } from "../../../utils/chainCompute";
import type { OBBInput } from "../../../utils/collision";
import {
	EYE_HEIGHT,
	LOOK_SENSITIVITY,
	clampPitch,
	computeMovementVector,
	getWalkthroughSpawnPoint,
} from "../../../utils/walkthroughCamera";
import type { KeyState } from "../../../utils/walkthroughCamera";
import { checkWalkthroughCollision } from "../../../utils/walkthroughCollision";

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

/** Duration of the enter transition lerp (seconds). */
const ENTER_DURATION = 0.5;

/**
 * Build OBB inputs for all placed holes, handling both legacy types and templates.
 */
function buildHoleOBBs(): OBBInput[] {
	const { holes, holeOrder, holeTemplates } = useStore.getState();
	const obbs: OBBInput[] = [];
	for (const id of holeOrder) {
		const hole = holes[id];
		if (!hole) continue;

		let w: number;
		let l: number;

		if (hole.templateId && holeTemplates[hole.templateId]) {
			const bounds = computeTemplateBounds(holeTemplates[hole.templateId]);
			w = bounds.width;
			l = bounds.length;
		} else {
			const typeDef = HOLE_TYPE_MAP[hole.type];
			if (!typeDef) continue;
			w = typeDef.dimensions.width;
			l = typeDef.dimensions.length;
		}

		obbs.push({
			pos: { x: hole.position.x, z: hole.position.z },
			rot: hole.rotation,
			w,
			l,
		});
	}
	return obbs;
}

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

	// Enter transition state (lerp from saved position to spawn)
	const enterElapsedRef = useRef(0);
	const enterStartRef = useRef({ x: 0, y: 0, z: 0 });
	const enterTargetRef = useRef({ x: 0, y: 0, z: 0 });
	const enteringRef = useRef(true);

	// Cached collision data (computed once on mount, static during walkthrough)
	const holeOBBsRef = useRef<OBBInput[]>([]);

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

		// Cache collision data (holes don't move during walkthrough)
		holeOBBsRef.current = buildHoleOBBs();

		// Set up enter transition
		const spawn = getWalkthroughSpawnPoint(hall);
		enterStartRef.current = {
			x: camera.position.x,
			y: camera.position.y,
			z: camera.position.z,
		};
		enterTargetRef.current = { x: spawn.x, y: spawn.y, z: spawn.z };
		enterElapsedRef.current = 0;
		enteringRef.current = true;

		// Set facing direction immediately (no rotation lerp — prevents nausea)
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
		// Enter transition: lerp camera from saved position to spawn
		if (enteringRef.current) {
			enterElapsedRef.current += delta;
			const t = Math.min(enterElapsedRef.current / ENTER_DURATION, 1);
			const eased = MathUtils.smoothstep(t, 0, 1);

			camera.position.x = MathUtils.lerp(
				enterStartRef.current.x,
				enterTargetRef.current.x,
				eased,
			);
			camera.position.y = MathUtils.lerp(
				enterStartRef.current.y,
				enterTargetRef.current.y,
				eased,
			);
			camera.position.z = MathUtils.lerp(
				enterStartRef.current.z,
				enterTargetRef.current.z,
				eased,
			);
			camera.quaternion.setFromEuler(eulerRef.current);

			if (t >= 1) {
				enteringRef.current = false;
			}
			return; // No WASD movement during transition
		}

		camera.quaternion.setFromEuler(eulerRef.current);

		const mv = computeMovementVector(
			keyStateRef.current,
			eulerRef.current.y,
			delta,
		);
		const desiredX = camera.position.x + mv.x;
		const desiredZ = camera.position.z + mv.z;

		const resolved = checkWalkthroughCollision(
			{ x: desiredX, z: desiredZ },
			holeOBBsRef.current,
			hall,
		);
		camera.position.x = resolved.x;
		camera.position.z = resolved.z;
		camera.position.y = EYE_HEIGHT;
	});

	return null;
}
