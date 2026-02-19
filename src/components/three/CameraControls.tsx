import { OrbitControls } from "@react-three/drei";
import { MOUSE, TOUCH } from "three";
import { useStore } from "../../store";

export function CameraControls() {
	const { width, length } = useStore((s) => s.hall);

	return (
		<OrbitControls
			target={[width / 2, 0, length / 2]}
			enableRotate={false}
			enablePan={true}
			enableZoom={true}
			minZoom={15}
			maxZoom={120}
			mouseButtons={{
				LEFT: undefined,
				MIDDLE: MOUSE.PAN,
				RIGHT: MOUSE.PAN,
			}}
			touches={{
				ONE: undefined,
				TWO: TOUCH.DOLLY_PAN,
			}}
			makeDefault
		/>
	);
}
