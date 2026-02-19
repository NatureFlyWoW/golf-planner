import { useStore } from "../../store";
import { MiniGolfHole } from "./MiniGolfHole";

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
		</group>
	);
}
