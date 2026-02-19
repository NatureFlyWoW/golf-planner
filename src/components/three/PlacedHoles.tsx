import { useStore } from "../../store";
import { MiniGolfHole } from "./MiniGolfHole";
import { RotationHandle } from "./RotationHandle";

export function PlacedHoles() {
	const holes = useStore((s) => s.holes);
	const holeOrder = useStore((s) => s.holeOrder);
	const selectedId = useStore((s) => s.selectedId);
	const selectHole = useStore((s) => s.selectHole);

	return (
		<group>
			{holeOrder.map((id) => {
				const hole = holes[id];
				if (!hole) return null;
				return (
					<MiniGolfHole
						key={id}
						hole={hole}
						isSelected={selectedId === id}
						onClick={() => selectHole(id)}
					/>
				);
			})}
			{selectedId && holes[selectedId] && (
				<RotationHandle
					holeId={selectedId}
					holeX={holes[selectedId].position.x}
					holeZ={holes[selectedId].position.z}
					rotation={holes[selectedId].rotation}
				/>
			)}
		</group>
	);
}
