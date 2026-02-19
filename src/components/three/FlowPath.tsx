import { Billboard, Line, Text } from "@react-three/drei";
import { useStore } from "../../store";

const LINE_Y = 0.02;
const LABEL_Y = 0.5;

export function FlowPath() {
	const showFlowPath = useStore((s) => s.ui.showFlowPath);
	const holes = useStore((s) => s.holes);
	const holeOrder = useStore((s) => s.holeOrder);

	if (!showFlowPath || holeOrder.length < 2) return null;

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
				color="white"
				lineWidth={2}
				dashed
				dashSize={0.3}
				gapSize={0.15}
				opacity={0.5}
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
							color="white"
							anchorX="center"
							anchorY="middle"
							outlineWidth={0.03}
							outlineColor="black"
						>
							{index + 1}
						</Text>
					</Billboard>
				);
			})}
		</group>
	);
}
