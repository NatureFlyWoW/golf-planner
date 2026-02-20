import { useStore } from "../../store";

export function HallFloor() {
	const { width, length } = useStore((s) => s.hall);
	const uvMode = useStore((s) => s.ui.uvMode);

	return (
		<mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[width / 2, 0, length / 2]}>
			<planeGeometry args={[width, length]} />
			<meshStandardMaterial color={uvMode ? "#0A0A1A" : "#E0E0E0"} />
		</mesh>
	);
}
