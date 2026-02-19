import {
	OrbitControls,
	OrthographicCamera,
	PerspectiveCamera,
} from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { MOUSE, TOUCH } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useKeyboardControls } from "../../hooks/useKeyboardControls";
import { useStore } from "../../store";

const DEFAULT_ZOOM = 40;
const PERSPECTIVE_DISTANCE = 25;
const PERSPECTIVE_ANGLE = Math.PI / 4;

export function CameraControls() {
	const { width, length } = useStore((s) => s.hall);
	const view = useStore((s) => s.ui.view);
	const controlsRef = useRef<OrbitControlsImpl>(null);
	const defaultTarget: [number, number, number] = useMemo(
		() => [width / 2, 0, length / 2],
		[width, length],
	);
	const gl = useThree((s) => s.gl);
	const invalidate = useThree((s) => s.invalidate);

	const is3D = view === "3d";

	const perspPos: [number, number, number] = useMemo(() => {
		const cx = width / 2;
		const cz = length / 2;
		return [
			cx,
			Math.sin(PERSPECTIVE_ANGLE) * PERSPECTIVE_DISTANCE,
			cz + Math.cos(PERSPECTIVE_ANGLE) * PERSPECTIVE_DISTANCE,
		];
	}, [width, length]);

	useKeyboardControls({
		controlsRef,
		defaultZoom: DEFAULT_ZOOM,
		defaultTarget,
		is3D,
		perspectiveDistance: PERSPECTIVE_DISTANCE,
		perspectiveAngle: PERSPECTIVE_ANGLE,
	});

	// Double-tap to reset camera (touch devices)
	useEffect(() => {
		const canvas = gl.domElement;
		let lastTapTime = 0;
		let wasSingleTouch = false;

		function handleTouchStart(e: TouchEvent) {
			wasSingleTouch = e.touches.length === 1;
		}

		function handleTouchEnd(e: TouchEvent) {
			if (e.touches.length > 0) return;
			if (!wasSingleTouch) return;

			const now = Date.now();
			if (now - lastTapTime < 300) {
				const ctrl = controlsRef.current;
				if (!ctrl) return;
				const cam = ctrl.object;
				ctrl.target.set(...defaultTarget);

				if ("zoom" in cam && !is3D) {
					cam.position.set(defaultTarget[0], 50, defaultTarget[2]);
					(cam as { zoom: number }).zoom = DEFAULT_ZOOM;
				} else {
					cam.position.set(...perspPos);
				}
				cam.updateProjectionMatrix();
				ctrl.update();
				invalidate();
				lastTapTime = 0;
			} else {
				lastTapTime = now;
			}
		}

		canvas.addEventListener("touchstart", handleTouchStart);
		canvas.addEventListener("touchend", handleTouchEnd);
		return () => {
			canvas.removeEventListener("touchstart", handleTouchStart);
			canvas.removeEventListener("touchend", handleTouchEnd);
		};
	}, [gl, defaultTarget, is3D, perspPos, invalidate]);

	// Invalidate on view change
	const [prevView, setPrevView] = useState(view);
	useEffect(() => {
		if (view !== prevView) {
			setPrevView(view);
			invalidate();
		}
	}, [view, prevView, invalidate]);

	return (
		<>
			<OrthographicCamera
				makeDefault={!is3D}
				position={[defaultTarget[0], 50, defaultTarget[2]]}
				zoom={DEFAULT_ZOOM}
				near={0.1}
				far={200}
			/>
			<PerspectiveCamera
				makeDefault={is3D}
				position={perspPos}
				fov={60}
				near={0.1}
				far={500}
			/>
			<OrbitControls
				ref={controlsRef}
				target={defaultTarget}
				enableRotate={is3D}
				enablePan={true}
				enableZoom={true}
				minZoom={is3D ? undefined : 15}
				maxZoom={is3D ? undefined : 120}
				minDistance={is3D ? 5 : undefined}
				maxDistance={is3D ? 80 : undefined}
				mouseButtons={{
					LEFT: is3D ? MOUSE.ROTATE : undefined,
					MIDDLE: MOUSE.PAN,
					RIGHT: MOUSE.PAN,
				}}
				touches={{
					ONE: is3D ? TOUCH.ROTATE : TOUCH.PAN,
					TWO: TOUCH.DOLLY_PAN,
				}}
				makeDefault
				onChange={() => invalidate()}
			/>
		</>
	);
}
