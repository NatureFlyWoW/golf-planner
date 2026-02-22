import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import { useMouseStatusStore } from "../../stores/mouseStatusStore";

/**
 * R3F component mounted inside the 2D View that tracks mouse world position
 * and camera zoom, writing to the micro-store for the StatusBar.
 *
 * Renders an invisible floor plane for pointer tracking.
 */
export function ViewportStatusTracker() {
	const lastZoomRef = useRef(40);
	const { camera } = useThree();

	// Track zoom changes (throttled: only update when delta > 0.5)
	useFrame(() => {
		if ("zoom" in camera) {
			const zoom = (camera as { zoom: number }).zoom;
			if (Math.abs(zoom - lastZoomRef.current) > 0.5) {
				lastZoomRef.current = zoom;
				useMouseStatusStore.getState().setCurrentZoom(zoom);
			}
		}
	});

	return (
		<mesh
			position={[5, 0, 10]}
			rotation={[-Math.PI / 2, 0, 0]}
			onPointerMove={(e) => {
				useMouseStatusStore
					.getState()
					.setMouseWorldPos({ x: e.point.x, z: e.point.z });
			}}
			onPointerLeave={() => {
				useMouseStatusStore.getState().setMouseWorldPos(null);
			}}
		>
			{/* Large invisible plane covering the hall area and beyond */}
			<planeGeometry args={[30, 40]} />
			<meshBasicMaterial visible={false} />
		</mesh>
	);
}
