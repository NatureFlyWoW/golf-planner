import { useStore } from "../../../store";
import { shouldShowFlagPin } from "../../../utils/topDownGating";

type FlagPinProps = { position: [number, number, number] };

export function FlagPin({ position }: FlagPinProps) {
	const view = useStore((s) => s.ui.view);
	if (!shouldShowFlagPin(view)) return null;

	return (
		<group position={position}>
			<mesh castShadow position={[0, 0.05, 0]}>
				<cylinderGeometry args={[0.003, 0.003, 0.1, 6]} />
				<meshStandardMaterial color="#CCCCCC" metalness={0.6} roughness={0.3} />
			</mesh>
			<mesh position={[0.015, 0.09, 0]}>
				<planeGeometry args={[0.03, 0.02]} />
				<meshStandardMaterial color="#FF0000" side={2} />
			</mesh>
		</group>
	);
}
