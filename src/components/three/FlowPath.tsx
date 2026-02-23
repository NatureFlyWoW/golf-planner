import { Billboard, Line, Text } from "@react-three/drei";
import { useStore } from "../../store";

const LINE_Y = 0.02;
const LABEL_Y = 0.5;

export function FlowPath() {
	const flowPathLayer = useStore((s) => s.ui.layers.flowPath);
	const holes = useStore((s) => s.holes);
	const holeOrder = useStore((s) => s.holeOrder);
	const uvMode = useStore((s) => s.ui.uvMode);

	if (!flowPathLayer.visible || holeOrder.length < 2) return null;

	const points: [number, number, number][] = [];
	for (const id of holeOrder) {
		const hole = holes[id];
		if (!hole) continue;
		points.push([hole.position.x, LINE_Y, hole.position.z]);
	}

	if (points.length < 2) return null;

	return (
		<group>
			<Line
				points={points}
				color={uvMode ? "#00FFFF" : "white"}
				lineWidth={2}
				dashed
				dashSize={0.3}
				gapSize={0.15}
				opacity={0.5 * flowPathLayer.opacity}
				transparent
			/>
			{holeOrder.map((id, index) => {
				const hole = holes[id];
				if (!hole) return null;
				return (
					<Billboard
						key={id}
						position={[hole.position.x, LABEL_Y, hole.position.z]}
						follow
					>
						<Text
							fontSize={0.35}
							color={uvMode ? "#00FFFF" : "white"}
							anchorX="center"
							anchorY="middle"
							outlineWidth={0.03}
							outlineColor={uvMode ? "#0A0A1A" : "black"}
							fillOpacity={flowPathLayer.opacity}
							outlineOpacity={flowPathLayer.opacity}
						>
							{index + 1}
						</Text>
					</Billboard>
				);
			})}
		</group>
	);
}
