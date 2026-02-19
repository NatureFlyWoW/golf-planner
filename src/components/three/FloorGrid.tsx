import { Grid } from "@react-three/drei";
import { useStore } from "../../store";

export function FloorGrid() {
	const { width, length } = useStore((s) => s.hall);

	return (
		<Grid
			position={[width / 2, 0.01, length / 2]}
			args={[width, length]}
			cellSize={1}
			cellThickness={0.5}
			cellColor="#cccccc"
			sectionSize={5}
			sectionThickness={1}
			sectionColor="#999999"
			fadeDistance={50}
			infiniteGrid={false}
		/>
	);
}
