import type { SunData } from "../../hooks/useSunPosition";
import { useStore } from "../../store";
import { isMobile } from "../../utils/isMobile";
import { FloorGrid } from "./FloorGrid";
import { FlowPath } from "./FlowPath";
import { Hall } from "./Hall";
import { PlacedHoles } from "./PlacedHoles";
import { SunIndicator } from "./SunIndicator";
// Temporary spike — remove in Section 10
import { RenderingSpike } from "./architectural/RenderingSpike";

type SharedSceneProps = {
	sunData: SunData;
};

export function SharedScene({ sunData }: SharedSceneProps) {
	const uvMode = useStore((s) => s.ui.uvMode);

	return (
		<>
			<ambientLight
				color={uvMode ? "#220044" : "#ffffff"}
				intensity={uvMode ? 0.3 : 0.8}
			/>
			{uvMode ? (
				<directionalLight
					position={[10, 20, 5]}
					color="#6600CC"
					intensity={0.4}
				/>
			) : (
				<directionalLight
					position={
						sunData
							? [
									-Math.sin(sunData.azimuth) *
										Math.cos(sunData.altitude) *
										30 +
										5,
									Math.sin(sunData.altitude) * 30,
									Math.cos(sunData.azimuth) *
										Math.cos(sunData.altitude) *
										30 +
										10,
								]
							: [10, 20, 5]
					}
					color="#ffffff"
					intensity={0.5}
					castShadow
					shadow-mapSize-width={isMobile ? 512 : 1024}
					shadow-mapSize-height={isMobile ? 512 : 1024}
					shadow-camera-left={-12}
					shadow-camera-right={12}
					shadow-camera-top={25}
					shadow-camera-bottom={-15}
					shadow-bias={-0.001}
				/>
			)}
			<Hall sunData={sunData} />
			<PlacedHoles />
			<FlowPath />
			<FloorGrid />
			<SunIndicator sunData={sunData} />
			{/* Temporary spike — remove in Section 10 */}
			<RenderingSpike />
		</>
	);
}
