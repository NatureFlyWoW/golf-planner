import { useStore } from "../../store";

export function HallFloor() {
	const { width, length } = useStore((s) => s.hall);

	return (
		<mesh rotation={[-Math.PI / 2, 0, 0]} position={[width / 2, 0, length / 2]}>
			<planeGeometry args={[width, length]} />
			<meshStandardMaterial color="#E0E0E0" />
		</mesh>
	);
}
