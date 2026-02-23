const MIN_CAMERA_Y = 0.5;

/** Clamp camera Y to prevent going underground. No-ops in walkthrough mode. */
export function clampCameraY(y: number, walkthroughMode: boolean): number {
	if (walkthroughMode) return y;
	return Math.max(y, MIN_CAMERA_Y);
}
