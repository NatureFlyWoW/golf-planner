import { Sky } from "@react-three/drei";
import { useMemo } from "react";
import type { SunData } from "../../../hooks/useSunPosition";
import { useStore } from "../../../store";
import {
	shouldShowSky,
	sunAltAzToVector3,
} from "../../../utils/environmentGating";

type SkyEnvironmentProps = {
	sunData: SunData;
};

const NORMAL_BG = "#b0c4d8";
const UV_BG = "#07071A";

export function SkyEnvironment({ sunData }: SkyEnvironmentProps) {
	const uvMode = useStore((s) => s.ui.uvMode);
	const gpuTier = useStore((s) => s.ui.gpuTier);
	const viewportLayout = useStore((s) => s.ui.viewportLayout);
	const envLayerVisible = useStore(
		(s) => s.ui.layers.environment?.visible ?? true,
	);

	const bgColor = uvMode ? UV_BG : NORMAL_BG;

	const sunPosition = useMemo(
		() => sunAltAzToVector3(sunData.altitude, sunData.azimuth),
		[sunData.altitude, sunData.azimuth],
	);

	const showSky = shouldShowSky(uvMode, gpuTier) && envLayerVisible;

	// scene.background is scene-global — only set in 3d-only mode to avoid
	// bleeding into the 2D pane in dual-viewport layout
	const showBackground = viewportLayout === "3d-only";

	return (
		<>
			{showBackground && <color attach="background" args={[bgColor]} />}
			{showSky && (
				<Sky
					sunPosition={sunPosition}
					turbidity={3}
					rayleigh={0.5}
					distance={450000}
				/>
			)}
		</>
	);
}
