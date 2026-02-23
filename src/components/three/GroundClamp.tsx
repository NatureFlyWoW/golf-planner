import { useThree } from "@react-three/fiber";
import type CameraControlsImpl from "camera-controls";
import { useEffect } from "react";
import { useStore } from "../../store";

const MAX_POLAR_ORBIT = Math.PI / 2 - 0.05;
const MAX_POLAR_UNCLAMPED = Math.PI;

/**
 * GroundClamp — prevents orbit camera from going below the horizon.
 * Sets maxPolarAngle on CameraControls (made default via drei).
 * Releases the constraint during walkthrough mode.
 */
export function GroundClamp(): null {
	const controls = useThree(
		(s) => s.controls,
	) as CameraControlsImpl | null;
	const walkthroughMode = useStore((s) => s.ui.walkthroughMode);

	useEffect(() => {
		if (!controls) return;
		if (walkthroughMode) {
			controls.maxPolarAngle = MAX_POLAR_UNCLAMPED;
		} else {
			controls.maxPolarAngle = MAX_POLAR_ORBIT;
		}
	}, [controls, walkthroughMode]);

	return null;
}
