import { useStore } from "../../store";

export function HallWalls() {
	const { width, length, wallHeight, wallThickness } = useStore((s) => s.hall);
	const halfH = wallHeight / 2;
	const color = "#B0B0B0";

	return (
		<group>
			{/* North wall (z=0) */}
			<mesh position={[width / 2, halfH, 0]}>
				<boxGeometry args={[width, wallHeight, wallThickness]} />
				<meshStandardMaterial color={color} />
			</mesh>
			{/* South wall (z=length) */}
			<mesh position={[width / 2, halfH, length]}>
				<boxGeometry args={[width, wallHeight, wallThickness]} />
				<meshStandardMaterial color={color} />
			</mesh>
			{/* West wall (x=0) */}
			<mesh position={[0, halfH, length / 2]}>
				<boxGeometry args={[wallThickness, wallHeight, length]} />
				<meshStandardMaterial color={color} />
			</mesh>
			{/* East wall (x=width) */}
			<mesh position={[width, halfH, length / 2]}>
				<boxGeometry args={[wallThickness, wallHeight, length]} />
				<meshStandardMaterial color={color} />
			</mesh>
		</group>
	);
}
