import type { ThreeEvent } from "@react-three/fiber";
import { useRef, useState } from "react";
import {
	isEventForThisViewport,
	useViewportInfo,
} from "../../contexts/ViewportContext";
import { useStore } from "../../store";
import { isMobile } from "../../utils/isMobile";

const RING_RADIUS = 1.2;
const SNAP_DEG = 15;
const SPHERE_RADIUS = isMobile ? 0.35 : 0.12;
const SPHERE_SEGMENTS = isMobile ? 8 : 16;
const RING_SEGMENTS = isMobile ? 32 : 64;

type RotationHandleProps = {
	holeId: string;
	holeX: number;
	holeZ: number;
	rotation: number;
};

export function RotationHandle({
	holeId,
	holeX,
	holeZ,
	rotation,
}: RotationHandleProps) {
	const updateHole = useStore((s) => s.updateHole);
	const [isDragging, setIsDragging] = useState(false);
	const shiftHeld = useRef(false);
	const viewportInfo = useViewportInfo();

	const rotRad = (rotation * Math.PI) / 180;
	const handleX = Math.sin(rotRad) * RING_RADIUS;
	const handleZ = Math.cos(rotRad) * RING_RADIUS;

	function handlePointerDown(e: ThreeEvent<PointerEvent>) {
		if (viewportInfo && !isEventForThisViewport(e, viewportInfo)) return;
		e.stopPropagation();
		setIsDragging(true);
		shiftHeld.current = e.nativeEvent.shiftKey;
		useStore.temporal?.getState()?.pause();
	}

	function handlePointerMove(e: ThreeEvent<PointerEvent>) {
		if (!isDragging) return;
		if (viewportInfo && !isEventForThisViewport(e, viewportInfo)) return;
		e.stopPropagation();
		shiftHeld.current = e.nativeEvent.shiftKey;

		const dx = e.point.x - holeX;
		const dz = e.point.z - holeZ;
		let angleDeg = (Math.atan2(dx, dz) * 180) / Math.PI;
		angleDeg = ((angleDeg % 360) + 360) % 360;

		if (!shiftHeld.current) {
			angleDeg = Math.round(angleDeg / SNAP_DEG) * SNAP_DEG;
		}

		updateHole(holeId, { rotation: angleDeg });
	}

	function handlePointerUp(e: ThreeEvent<PointerEvent>) {
		if (!isDragging) return;
		if (viewportInfo && !isEventForThisViewport(e, viewportInfo)) return;
		e.stopPropagation();
		setIsDragging(false);
		useStore.temporal?.getState()?.resume();
	}

	return (
		<group position={[holeX, 0.01, holeZ]}>
			{/* Ring outline */}
			<mesh rotation={[-Math.PI / 2, 0, 0]}>
				<ringGeometry
					args={[RING_RADIUS - 0.03, RING_RADIUS + 0.03, RING_SEGMENTS]}
				/>
				<meshBasicMaterial color="#FF9800" transparent opacity={0.6} />
			</mesh>
			{/* Drag handle sphere */}
			<mesh
				position={[handleX, 0, handleZ]}
				onPointerDown={handlePointerDown}
				onPointerMove={handlePointerMove}
				onPointerUp={handlePointerUp}
			>
				<sphereGeometry
					args={[SPHERE_RADIUS, SPHERE_SEGMENTS, SPHERE_SEGMENTS]}
				/>
				<meshStandardMaterial color={isDragging ? "#FFE082" : "#FF9800"} />
			</mesh>
			{/* Drag plane — invisible floor plane for rotation drag continuity */}
			{isDragging && (
				<mesh
					rotation={[-Math.PI / 2, 0, 0]}
					position={[0, 0, 0]}
					onPointerMove={handlePointerMove}
					onPointerUp={handlePointerUp}
					visible={false}
				>
					<planeGeometry args={[20, 20]} />
					<meshBasicMaterial transparent opacity={0} />
				</mesh>
			)}
		</group>
	);
}
