import type CameraControlsImpl from "camera-controls";
import { useEffect } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useStore } from "../store";
import {
	DEFAULT_ORTHO_ZOOM,
	MAX_ORTHO_ZOOM,
	MIN_ORTHO_ZOOM,
	getCameraPresets,
} from "../utils/cameraPresets";

const BLOCKED_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

/** Exported for testing — checks if keyboard shortcuts should fire */
export function shouldHandleKey(activeElementTag: string): boolean {
	return !BLOCKED_TAGS.has(activeElementTag);
}

const WALKTHROUGH_ALWAYS_ACTIVE = new Set(["z", "Z", "g", "G"]);

/**
 * Returns true if a key event should be suppressed because walkthrough
 * mode is active and the key belongs to camera/viewport controls.
 * Undo (z/Z) and snap toggle (g/G) remain active at all times.
 */
export function shouldSuppressForWalkthrough(
	key: string,
	walkthroughMode: boolean,
): boolean {
	if (!walkthroughMode) return false;
	if (WALKTHROUGH_ALWAYS_ACTIVE.has(key)) return false;
	return true;
}

/** Compute bounding box for all placed holes, with 2m padding. Falls back to hall bounds. */
function getHolesBoundingBox() {
	const { holes, hall } = useStore.getState();
	const holeIds = Object.keys(holes);
	let minX = 0;
	let maxX = hall.width;
	let minZ = 0;
	let maxZ = hall.length;

	if (holeIds.length > 0) {
		minX = Number.POSITIVE_INFINITY;
		maxX = Number.NEGATIVE_INFINITY;
		minZ = Number.POSITIVE_INFINITY;
		maxZ = Number.NEGATIVE_INFINITY;
		for (const id of holeIds) {
			const h = holes[id];
			minX = Math.min(minX, h.position.x);
			maxX = Math.max(maxX, h.position.x);
			minZ = Math.min(minZ, h.position.z);
			maxZ = Math.max(maxZ, h.position.z);
		}
		minX -= 2;
		maxX += 2;
		minZ -= 2;
		maxZ += 2;
	}

	return {
		centerX: (minX + maxX) / 2,
		centerZ: (minZ + maxZ) / 2,
		rangeX: maxX - minX,
		rangeZ: maxZ - minZ,
	};
}

type KeyboardControlsOptions = {
	controls2DRef: React.RefObject<OrbitControlsImpl | null>;
	controls3DRef: React.RefObject<CameraControlsImpl | null>;
	defaultTarget: [number, number, number];
};

const PRESET_KEYS: Record<string, number> = {
	"1": 0,
	"2": 1,
	"3": 2,
	"4": 3,
	"5": 4,
	"6": 5,
};
const PRESET_NAMES = [
	"top",
	"front",
	"back",
	"left",
	"right",
	"isometric",
] as const;

/**
 * Resolve the effective viewport. If activeViewport is null (user hasn't
 * hovered over any pane yet), infer from the layout — single-pane modes
 * have an obvious default.
 */
function resolveViewport(): "2d" | "3d" | null {
	const { activeViewport, viewportLayout } = useStore.getState().ui;
	if (activeViewport) return activeViewport;
	if (viewportLayout === "2d-only") return "2d";
	if (viewportLayout === "3d-only") return "3d";
	return null;
}

export function useKeyboardControls({
	controls2DRef,
	controls3DRef,
	defaultTarget,
}: KeyboardControlsOptions) {
	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			if (!shouldHandleKey(document.activeElement?.tagName ?? "BODY")) return;

			// Undo/redo shortcuts — always active
			if (e.key === "z" && (e.ctrlKey || e.metaKey)) {
				e.preventDefault();
				if (e.shiftKey) {
					useStore.temporal?.getState()?.redo();
				} else {
					useStore.temporal?.getState()?.undo();
				}
				return;
			}

			// Snap toggle — always active
			if (e.key === "g" || e.key === "G") {
				useStore.getState().toggleSnap();
				return;
			}

			// Escape key exits walkthrough (only consume when active)
			if (e.key === "Escape") {
				const { walkthroughMode } = useStore.getState().ui;
				if (walkthroughMode) {
					useStore.getState().exitWalkthrough();
					return;
				}
			}

			// F key exits walkthrough (must run before suppression guard)
			if ((e.key === "f" || e.key === "F") && useStore.getState().ui.walkthroughMode) {
				useStore.getState().exitWalkthrough();
				return;
			}

			const viewport = resolveViewport();

			// During walkthrough, suppress all camera/viewport shortcuts.
			// WalkthroughController handles its own WASD via window.addEventListener.
			const { walkthroughMode } = useStore.getState().ui;
			if (shouldSuppressForWalkthrough(e.key, walkthroughMode)) {
				e.stopPropagation();
				return;
			}

			// Camera preset keys (1-6) — 3D only
			if (e.key in PRESET_KEYS && viewport === "3d") {
				const ctrl3D = controls3DRef.current;
				if (!ctrl3D) return;
				const { hall } = useStore.getState();
				const presets = getCameraPresets(hall.width, hall.length);
				const presetName = PRESET_NAMES[PRESET_KEYS[e.key]];
				const preset = presets[presetName];
				ctrl3D.setLookAt(
					preset.position[0],
					preset.position[1],
					preset.position[2],
					preset.target[0],
					preset.target[1],
					preset.target[2],
					true,
				);
				return;
			}

			// 2D-specific keys
			if (viewport === "2d") {
				const ctrl2D = controls2DRef.current;
				if (!ctrl2D) return;
				const camera = ctrl2D.object;

				switch (e.key) {
					case "r":
					case "R": {
						ctrl2D.target.set(...defaultTarget);
						camera.position.set(defaultTarget[0], 50, defaultTarget[2]);
						if ("zoom" in camera) {
							(camera as { zoom: number }).zoom = DEFAULT_ORTHO_ZOOM;
						}
						camera.updateProjectionMatrix();
						ctrl2D.update();
						break;
					}
					case "f":
					case "F": {
						const { centerX, centerZ, rangeX, rangeZ } = getHolesBoundingBox();

						ctrl2D.target.set(centerX, 0, centerZ);
						camera.position.set(centerX, 50, centerZ);

						if ("zoom" in camera) {
							const canvas = ctrl2D.domElement;
							const cw = canvas?.clientWidth ?? 0;
							const ch = canvas?.clientHeight ?? 0;
							const zoomX = cw > 0 ? cw / rangeX : DEFAULT_ORTHO_ZOOM;
							const zoomZ = ch > 0 ? ch / rangeZ : DEFAULT_ORTHO_ZOOM;
							(camera as { zoom: number }).zoom = Math.max(
								MIN_ORTHO_ZOOM,
								Math.min(MAX_ORTHO_ZOOM, Math.min(zoomX, zoomZ) * 0.9),
							);
						}

						camera.updateProjectionMatrix();
						ctrl2D.update();
						break;
					}
					case "+":
					case "=": {
						if ("zoom" in camera) {
							(camera as { zoom: number }).zoom = Math.min(
								MAX_ORTHO_ZOOM,
								(camera as { zoom: number }).zoom + 10,
							);
							camera.updateProjectionMatrix();
							ctrl2D.update();
						}
						break;
					}
					case "-": {
						if ("zoom" in camera) {
							(camera as { zoom: number }).zoom = Math.max(
								MIN_ORTHO_ZOOM,
								(camera as { zoom: number }).zoom - 10,
							);
							camera.updateProjectionMatrix();
							ctrl2D.update();
						}
						break;
					}
					case "0": {
						if ("zoom" in camera) {
							(camera as { zoom: number }).zoom = DEFAULT_ORTHO_ZOOM;
							camera.updateProjectionMatrix();
							ctrl2D.update();
						}
						break;
					}
					case "ArrowUp": {
						e.preventDefault();
						ctrl2D.target.z -= 1;
						camera.position.z -= 1;
						ctrl2D.update();
						break;
					}
					case "ArrowDown": {
						e.preventDefault();
						ctrl2D.target.z += 1;
						camera.position.z += 1;
						ctrl2D.update();
						break;
					}
					case "ArrowLeft": {
						e.preventDefault();
						ctrl2D.target.x -= 1;
						camera.position.x -= 1;
						ctrl2D.update();
						break;
					}
					case "ArrowRight": {
						e.preventDefault();
						ctrl2D.target.x += 1;
						camera.position.x += 1;
						ctrl2D.update();
						break;
					}
				}
				return;
			}

			// 3D-specific keys
			if (viewport === "3d") {
				const ctrl3D = controls3DRef.current;
				if (!ctrl3D) return;

				switch (e.key) {
					case "r":
					case "R": {
						const { hall } = useStore.getState();
						const presets = getCameraPresets(hall.width, hall.length);
						const iso = presets.isometric;
						ctrl3D.setLookAt(
							iso.position[0],
							iso.position[1],
							iso.position[2],
							iso.target[0],
							iso.target[1],
							iso.target[2],
							true,
						);
						break;
					}
					case "f":
					case "F": {
						const uiState = useStore.getState().ui;
						if (uiState.walkthroughMode) {
							useStore.getState().exitWalkthrough();
						} else {
							useStore.getState().enterWalkthrough();
						}
						break;
					}
				}
			}
		}

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [controls2DRef, controls3DRef, defaultTarget]);
}
