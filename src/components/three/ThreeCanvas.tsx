import {
	Environment,
	Lightformer,
	PerformanceMonitor,
	SoftShadows,
	Sparkles,
	Stats,
} from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { UV_LAMP_POSITIONS } from "../../constants/uvLamps";
import type { SunData } from "../../hooks/useSunPosition";
import { useStore } from "../../store";
import {
	shouldEnableFog,
	shouldEnableSoftShadows,
} from "../../utils/environmentGating";
import { isMobile } from "../../utils/isMobile";
import { shouldShowSparkles } from "../../utils/postprocessingConfig";
import { CameraControls } from "./CameraControls";
import { FloorGrid } from "./FloorGrid";
import { FlowPath } from "./FlowPath";
import { Hall } from "./Hall";
import { PlacedHoles } from "./PlacedHoles";
import { PlacementHandler } from "./PlacementHandler";
import { ScreenshotCapture } from "./ScreenshotCapture";
import { SunIndicator } from "./SunIndicator";
import { UVEffects } from "./UVEffects";

type ThreeCanvasProps = {
	sunData: SunData;
};

function FogController({ enabled }: { enabled: boolean }) {
	const scene = useThree((s) => s.scene);
	useEffect(() => {
		if (!enabled) {
			scene.fog = null;
		}
	}, [enabled, scene]);
	return null;
}

export default function ThreeCanvas({ sunData }: ThreeCanvasProps) {
	const uvMode = useStore((s) => s.ui.uvMode);
	const view = useStore((s) => s.ui.view);
	const gpuTier = useStore((s) => s.ui.gpuTier);

	const fogEnabled = shouldEnableFog(uvMode, view);

	return (
		<>
			{/* Fog: exponential, only in UV mode + 3D perspective view */}
			{fogEnabled && <fogExp2 attach="fog" args={["#07071A", 0.04]} />}
			<FogController enabled={fogEnabled} />

			{/* Environment with UV tube lightformers for PBR reflections */}
			<Environment
				preset="night"
				environmentIntensity={0.15}
				background={false}
			>
				{UV_LAMP_POSITIONS.map((pos) => (
					<Lightformer
						key={`lamp-${pos[0]}-${pos[1]}-${pos[2]}`}
						form="rect"
						intensity={0.4}
						color="#8800FF"
						position={pos}
						rotation-x={Math.PI / 2}
						scale={[0.3, 2, 1]}
					/>
				))}
			</Environment>

			{/* SoftShadows: PCSS, mid+high tier only */}
			{shouldEnableSoftShadows(gpuTier) && (
				<SoftShadows size={25} samples={10} />
			)}

			{/* Performance monitoring */}
			<PerformanceMonitor />

			{/* Dev-only FPS counter */}
			{import.meta.env.DEV && <Stats />}

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
									-Math.sin(sunData.azimuth) * Math.cos(sunData.altitude) * 30 +
										5,
									Math.sin(sunData.altitude) * 30,
									Math.cos(sunData.azimuth) * Math.cos(sunData.altitude) * 30 +
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
			<CameraControls />
			<FloorGrid />
			<Hall sunData={sunData} />
			<PlacementHandler />
			<PlacedHoles />
			<FlowPath />
			<SunIndicator sunData={sunData} />
			{shouldShowSparkles({ gpuTier, uvMode }) && (
				<Sparkles
					count={400}
					color="#9D00FF"
					size={2}
					speed={0.3}
					scale={[10, 4.3, 20]}
					position={[5, 2.15, 10]}
				/>
			)}
			<UVEffects />
			<ScreenshotCapture />
		</>
	);
}
