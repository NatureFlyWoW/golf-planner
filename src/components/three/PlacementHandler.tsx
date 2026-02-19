import type { ThreeEvent } from "@react-three/fiber";
import { HOLE_TYPE_MAP } from "../../constants";
import { useStore } from "../../store";

export function PlacementHandler() {
	const hall = useStore((s) => s.hall);
	const tool = useStore((s) => s.ui.tool);
	const placingType = useStore((s) => s.ui.placingType);
	const addHole = useStore((s) => s.addHole);
	const selectHole = useStore((s) => s.selectHole);

	function handleClick(e: ThreeEvent<MouseEvent>) {
		e.stopPropagation();
		const point = e.point;

		if (tool === "place" && placingType) {
			const definition = HOLE_TYPE_MAP[placingType];
			if (!definition) return;

			const x = Math.max(
				definition.dimensions.width / 2,
				Math.min(hall.width - definition.dimensions.width / 2, point.x),
			);
			const z = Math.max(
				definition.dimensions.length / 2,
				Math.min(hall.length - definition.dimensions.length / 2, point.z),
			);

			addHole(placingType, { x, z });
		} else if (tool === "select") {
			selectHole(null);
		}
	}

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: R3F mesh element, not HTML
		<mesh
			rotation={[-Math.PI / 2, 0, 0]}
			position={[hall.width / 2, -0.01, hall.length / 2]}
			onClick={handleClick}
			visible={false}
		>
			<planeGeometry args={[hall.width, hall.length]} />
			<meshBasicMaterial transparent opacity={0} />
		</mesh>
	);
}
