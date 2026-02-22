import { Grid } from "@react-three/drei";
import { useViewportId } from "../../hooks/useViewportId";
import { useStore } from "../../store";

export function FloorGrid() {
	const { width, length } = useStore((s) => s.hall);
	const uvMode = useStore((s) => s.ui.uvMode);
	const gridLayer = useStore((s) => s.ui.layers.grid);
	const viewportId = useViewportId();

	if (!gridLayer.visible) return null;

	// In 2D viewport, skip drei Grid (replaced by ArchitecturalGrid2D in section 06)
	if (viewportId === "2d") return null;

	return (
		<Grid
			position={[width / 2, 0.01, length / 2]}
			args={[width, length]}
			cellSize={1}
			cellThickness={uvMode ? 0.3 : 0.5}
			cellColor={uvMode ? "#2A2A5E" : "#cccccc"}
			sectionSize={5}
			sectionThickness={uvMode ? 0.5 : 1}
			sectionColor={uvMode ? "#2A2A5E" : "#999999"}
			fadeDistance={50}
			infiniteGrid={false}
		/>
	);
}
