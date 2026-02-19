import { useEffect } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useStore } from "../store";

const BLOCKED_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

/** Exported for testing — checks if keyboard shortcuts should fire */
export function shouldHandleKey(activeElementTag: string): boolean {
	return !BLOCKED_TAGS.has(activeElementTag);
}

type KeyboardControlsOptions = {
	controlsRef: React.RefObject<OrbitControlsImpl | null>;
	defaultZoom: number;
	defaultTarget: [number, number, number];
};

export function useKeyboardControls({
	controlsRef,
	defaultZoom,
	defaultTarget,
}: KeyboardControlsOptions) {
	// Note: we read holes/hall lazily inside the handler via useStore.getState()
	// to avoid re-registering the keydown listener on every hole change.

	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			if (!shouldHandleKey(document.activeElement?.tagName ?? "BODY")) return;

			const controls = controlsRef.current;
			if (!controls) return;

			const camera = controls.object;
			if (!("zoom" in camera)) return; // only orthographic

			switch (e.key) {
				case "r":
				case "R": {
					controls.target.set(...defaultTarget);
					camera.zoom = defaultZoom;
					camera.position.set(defaultTarget[0], 50, defaultTarget[2]);
					camera.updateProjectionMatrix();
					controls.update();
					break;
				}
				case "f":
				case "F": {
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
						// Add padding
						minX -= 2;
						maxX += 2;
						minZ -= 2;
						maxZ += 2;
					}

					const centerX = (minX + maxX) / 2;
					const centerZ = (minZ + maxZ) / 2;
					const rangeX = maxX - minX;
					const rangeZ = maxZ - minZ;

					controls.target.set(centerX, 0, centerZ);
					camera.position.set(centerX, 50, centerZ);

					// Calculate zoom to fit content in viewport
					const canvas = controls.domElement;
					const zoomX =
						canvas.clientWidth > 0 ? canvas.clientWidth / rangeX : defaultZoom;
					const zoomZ =
						canvas.clientHeight > 0
							? canvas.clientHeight / rangeZ
							: defaultZoom;
					camera.zoom = Math.min(zoomX, zoomZ) * 0.9; // 90% to leave margin
					camera.zoom = Math.max(15, Math.min(120, camera.zoom));

					camera.updateProjectionMatrix();
					controls.update();
					break;
				}
				case "+":
				case "=": {
					camera.zoom = Math.min(120, camera.zoom + 10);
					camera.updateProjectionMatrix();
					controls.update();
					break;
				}
				case "-": {
					camera.zoom = Math.max(15, camera.zoom - 10);
					camera.updateProjectionMatrix();
					controls.update();
					break;
				}
				case "0": {
					camera.zoom = defaultZoom;
					camera.updateProjectionMatrix();
					controls.update();
					break;
				}
				case "ArrowUp": {
					e.preventDefault();
					controls.target.z -= 1;
					camera.position.z -= 1;
					controls.update();
					break;
				}
				case "ArrowDown": {
					e.preventDefault();
					controls.target.z += 1;
					camera.position.z += 1;
					controls.update();
					break;
				}
				case "ArrowLeft": {
					e.preventDefault();
					controls.target.x -= 1;
					camera.position.x -= 1;
					controls.update();
					break;
				}
				case "ArrowRight": {
					e.preventDefault();
					controls.target.x += 1;
					camera.position.x += 1;
					controls.update();
					break;
				}
			}
		}

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [controlsRef, defaultZoom, defaultTarget]);
}
