import { useStore } from "../../store";
import { MiniGolfHole } from "./MiniGolfHole";
import { RotationHandle } from "./RotationHandle";

export function PlacedHoles() {
	const holes = useStore((s) => s.holes);
	const holeOrder = useStore((s) => s.holeOrder);
	const selectedId = useStore((s) => s.selectedId);
	const selectHole = useStore((s) => s.selectHole);
	const holesLayer = useStore((s) => s.ui.layers.holes);

	if (!holesLayer.visible) return null;

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
						layerOpacity={holesLayer.opacity}
						layerLocked={holesLayer.locked}
					/>
				);
			})}
			{selectedId && holes[selectedId] && !holesLayer.locked && (
				<RotationHandle
					holeId={selectedId}
					holeX={holes[selectedId].position.x}
					holeZ={holes[selectedId].position.z}
					rotation={holes[selectedId].rotation}
					layerLocked={holesLayer.locked}
				/>
			)}
		</group>
	);
}
