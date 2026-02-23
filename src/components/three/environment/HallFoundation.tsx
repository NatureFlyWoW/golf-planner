import { MeshStandardMaterial } from "three";
import { HALL } from "../../../constants/hall";
import { useStore } from "../../../store";

const foundationMaterial = new MeshStandardMaterial({
	color: "#444444",
	roughness: 0.95,
	metalness: 0,
});

const FOUNDATION_WIDTH = 0.3;
const FOUNDATION_HEIGHT = 0.15;
const FOUNDATION_Y = -0.075;
const CORNER_OVERLAP = 0.6;

/** Pure helper exported for tests. */
export function getFoundationStrips(hall: {
	width: number;
	length: number;
}): Array<{
	position: [number, number, number];
	size: [number, number, number];
}> {
	return [
		// North (z=0)
		{
			position: [hall.width / 2, FOUNDATION_Y, 0],
			size: [hall.width + CORNER_OVERLAP, FOUNDATION_HEIGHT, FOUNDATION_WIDTH],
		},
		// South (z=length)
		{
			position: [hall.width / 2, FOUNDATION_Y, hall.length],
			size: [hall.width + CORNER_OVERLAP, FOUNDATION_HEIGHT, FOUNDATION_WIDTH],
		},
		// West (x=0)
		{
			position: [0, FOUNDATION_Y, hall.length / 2],
			size: [FOUNDATION_WIDTH, FOUNDATION_HEIGHT, hall.length],
		},
		// East (x=width)
		{
			position: [hall.width, FOUNDATION_Y, hall.length / 2],
			size: [FOUNDATION_WIDTH, FOUNDATION_HEIGHT, hall.length],
		},
	];
}

export function HallFoundation() {
	const envLayerVisible = useStore(
		(s) => s.ui.layers.environment?.visible ?? true,
	);

	if (!envLayerVisible) return null;

	const strips = getFoundationStrips(HALL);

	return (
		<group>
			{strips.map((strip, i) => (
				<mesh key={i} position={strip.position} material={foundationMaterial}>
					<boxGeometry args={strip.size} />
				</mesh>
			))}
		</group>
	);
}
