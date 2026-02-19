import { OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { MOUSE, TOUCH } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useKeyboardControls } from "../../hooks/useKeyboardControls";
import { useStore } from "../../store";

const DEFAULT_ZOOM = 40;

export function CameraControls() {
	const { width, length } = useStore((s) => s.hall);
	const controlsRef = useRef<OrbitControlsImpl>(null);
	const defaultTarget: [number, number, number] = useMemo(
		() => [width / 2, 0, length / 2],
		[width, length],
	);
	const gl = useThree((s) => s.gl);

	useKeyboardControls({
		controlsRef,
		defaultZoom: DEFAULT_ZOOM,
		defaultTarget,
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
				if (!("zoom" in cam)) return;
				ctrl.target.set(...defaultTarget);
				cam.position.set(defaultTarget[0], 50, defaultTarget[2]);
				cam.zoom = DEFAULT_ZOOM;
				cam.updateProjectionMatrix();
				ctrl.update();
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
	}, [gl, defaultTarget]);

	return (
		<OrbitControls
			ref={controlsRef}
			target={defaultTarget}
			enableRotate={false}
			enablePan={true}
			enableZoom={true}
			minZoom={15}
			maxZoom={120}
			mouseButtons={{
				LEFT: undefined,
				MIDDLE: MOUSE.PAN,
				RIGHT: MOUSE.PAN,
			}}
			touches={{
				ONE: undefined,
				TWO: TOUCH.DOLLY_PAN,
			}}
			makeDefault
		/>
	);
}
