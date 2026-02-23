import type { CameraPreset } from "../types/viewport";

export type CameraPresetConfig = {
	position: [number, number, number];
	target: [number, number, number];
};

// Camera-related constants
export const DEFAULT_ORTHO_ZOOM = 40;
export const MIN_ORTHO_ZOOM = 15;
export const MAX_ORTHO_ZOOM = 120;
export const PERSPECTIVE_FOV = 60;

export function getCameraPresets(
	hallWidth: number,
	hallLength: number,
): Record<CameraPreset, CameraPresetConfig> {
	const cx = hallWidth / 2;
	const cz = hallLength / 2;
	const diagonal = Math.sqrt(hallWidth ** 2 + hallLength ** 2);
	const dist = diagonal * 1.2;
	const eyeHeight = dist * 0.5;
	const target: [number, number, number] = [cx, 0, cz];

	return {
		top: {
			position: [cx, dist * 1.8, cz],
			target: [...target],
		},
		front: {
			position: [cx, eyeHeight, cz - dist],
			target: [...target],
		},
		back: {
			position: [cx, eyeHeight, cz + dist],
			target: [...target],
		},
		left: {
			position: [cx - dist, eyeHeight, cz],
			target: [...target],
		},
		right: {
			position: [cx + dist, eyeHeight, cz],
			target: [...target],
		},
		isometric: {
			position: [cx + dist * 0.7, dist * 0.8, cz + dist * 0.7],
			target: [...target],
		},
		overview: {
			position: [cx + dist * 1.4, dist * 1.0, cz + dist * 1.4],
			target: [...target],
		},
	};
}
