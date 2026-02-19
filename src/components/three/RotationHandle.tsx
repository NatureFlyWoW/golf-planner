import type { ThreeEvent } from "@react-three/fiber";
import { useRef, useState } from "react";
import { useStore } from "../../store";

const RING_RADIUS = 1.2;
const SNAP_DEG = 15;

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

	const rotRad = (rotation * Math.PI) / 180;
	const handleX = Math.sin(rotRad) * RING_RADIUS;
	const handleZ = Math.cos(rotRad) * RING_RADIUS;

	function handlePointerDown(e: ThreeEvent<PointerEvent>) {
		e.stopPropagation();
		setIsDragging(true);
		shiftHeld.current = e.nativeEvent.shiftKey;
		(e.nativeEvent.target as Element)?.setPointerCapture?.(
			e.nativeEvent.pointerId,
		);
	}

	function handlePointerMove(e: ThreeEvent<PointerEvent>) {
		if (!isDragging) return;
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
		e.stopPropagation();
		setIsDragging(false);
	}

	return (
		<group position={[holeX, 0.01, holeZ]}>
			{/* Ring outline */}
			<mesh rotation={[-Math.PI / 2, 0, 0]}>
				<ringGeometry args={[RING_RADIUS - 0.03, RING_RADIUS + 0.03, 64]} />
				<meshBasicMaterial color="#FF9800" transparent opacity={0.6} />
			</mesh>
			{/* Drag handle sphere */}
			<mesh
				position={[handleX, 0, handleZ]}
				onPointerDown={handlePointerDown}
				onPointerMove={handlePointerMove}
				onPointerUp={handlePointerUp}
			>
				<sphereGeometry args={[0.12, 16, 16]} />
				<meshStandardMaterial color={isDragging ? "#FFE082" : "#FF9800"} />
			</mesh>
		</group>
	);
}
