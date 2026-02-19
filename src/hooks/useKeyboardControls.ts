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
	is3D: boolean;
	perspectiveDistance: number;
	perspectiveAngle: number;
};

export function useKeyboardControls({
	controlsRef,
	defaultZoom,
	defaultTarget,
	is3D,
	perspectiveDistance,
	perspectiveAngle,
}: KeyboardControlsOptions) {
	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			if (!shouldHandleKey(document.activeElement?.tagName ?? "BODY")) return;

			// Undo/redo shortcuts
			if (e.key === "z" && (e.ctrlKey || e.metaKey)) {
				e.preventDefault();
				if (e.shiftKey) {
					useStore.temporal?.getState()?.redo();
				} else {
					useStore.temporal?.getState()?.undo();
				}
				return;
			}

			const controls = controlsRef.current;
			if (!controls) return;

			const camera = controls.object;

			switch (e.key) {
				case "r":
				case "R": {
					controls.target.set(...defaultTarget);
					if (!is3D && "zoom" in camera) {
						(camera as { zoom: number }).zoom = defaultZoom;
						camera.position.set(defaultTarget[0], 50, defaultTarget[2]);
					} else {
						camera.position.set(
							defaultTarget[0],
							Math.sin(perspectiveAngle) * perspectiveDistance,
							defaultTarget[2] +
								Math.cos(perspectiveAngle) * perspectiveDistance,
						);
					}
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

					if ("zoom" in camera) {
						const canvas = controls.domElement;
						const cw = canvas?.clientWidth ?? 0;
						const ch = canvas?.clientHeight ?? 0;
						const zoomX = cw > 0 ? cw / rangeX : defaultZoom;
						const zoomZ = ch > 0 ? ch / rangeZ : defaultZoom;
						(camera as { zoom: number }).zoom = Math.min(zoomX, zoomZ) * 0.9;
						(camera as { zoom: number }).zoom = Math.max(
							15,
							Math.min(120, (camera as { zoom: number }).zoom),
						);
					}

					camera.updateProjectionMatrix();
					controls.update();
					break;
				}
				case "+":
				case "=": {
					if ("zoom" in camera) {
						(camera as { zoom: number }).zoom = Math.min(
							120,
							(camera as { zoom: number }).zoom + 10,
						);
						camera.updateProjectionMatrix();
						controls.update();
					}
					break;
				}
				case "-": {
					if ("zoom" in camera) {
						(camera as { zoom: number }).zoom = Math.max(
							15,
							(camera as { zoom: number }).zoom - 10,
						);
						camera.updateProjectionMatrix();
						controls.update();
					}
					break;
				}
				case "0": {
					if ("zoom" in camera) {
						(camera as { zoom: number }).zoom = defaultZoom;
						camera.updateProjectionMatrix();
						controls.update();
					}
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
				case "g":
				case "G": {
					useStore.getState().toggleSnap();
					break;
				}
			}
		}

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [
		controlsRef,
		defaultZoom,
		defaultTarget,
		is3D,
		perspectiveDistance,
		perspectiveAngle,
	]);
}
