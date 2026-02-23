import {
	Environment,
	Lightformer,
	PerformanceMonitor,
	Sparkles,
	Stats,
} from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { UV_LAMP_POSITIONS } from "../../constants/uvLamps";
import { useSunPosition } from "../../hooks/useSunPosition";
import { useStore } from "../../store";
import {
	shouldEnableFog,
	shouldEnableNormalFog,
} from "../../utils/environmentGating";
import { shouldShowGodRays } from "../../utils/godraysConfig";
import { shouldShowSparkles } from "../../utils/postprocessingConfig";
import { GroundPlane } from "./environment/GroundPlane";
import { HallFoundation } from "./environment/HallFoundation";
import { HallRoof } from "./environment/HallRoof";
import { HallWallsExterior } from "./environment/HallWallsExterior";
import { SkyEnvironment } from "./environment/SkyEnvironment";
import { GodRaysSource } from "./GodRaysSource";
import { GroundClamp } from "./GroundClamp";
import { ScreenshotCapture } from "./ScreenshotCapture";
import { UVEffects } from "./UVEffects";
import { UVLamps } from "./UVLamps";

function FogController({ enabled }: { enabled: boolean }) {
	const scene = useThree((s) => s.scene);
	useEffect(() => {
		if (!enabled) {
			scene.fog = null;
		}
	}, [enabled, scene]);
	return null;
}

export function ThreeDOnlyContent() {
	const uvMode = useStore((s) => s.ui.uvMode);
	const gpuTier = useStore((s) => s.ui.gpuTier);
	const viewportLayout = useStore((s) => s.ui.viewportLayout);
	const envLayerVisible = useStore(
		(s) => s.ui.layers.environment?.visible ?? true,
	);
	const sunDate = useStore((s) => s.ui.sunDate);
	const sunData = useSunPosition(sunDate);

	// Fog is scene-level (shared between Views) — only enable in 3d-only mode
	const uvFogEnabled = shouldEnableFog(uvMode, viewportLayout);
	const normalFogEnabled = shouldEnableNormalFog(
		viewportLayout,
		uvMode,
		envLayerVisible,
	);

	return (
		<>
			<GroundPlane />
			<HallRoof />
			<HallFoundation />
			<HallWallsExterior />
			<SkyEnvironment sunData={sunData} />
			{normalFogEnabled && (
				<fog attach="fog" args={["#b0c4d8", 25, 55]} />
			)}
			{uvFogEnabled && <fogExp2 attach="fog" args={["#07071A", 0.04]} />}
			<FogController enabled={uvFogEnabled || normalFogEnabled} />

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

			{uvMode && <UVLamps />}
			{shouldShowGodRays({ gpuTier, uvMode }) && <GodRaysSource />}
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
			<GroundClamp />
			<ScreenshotCapture />

			<PerformanceMonitor />
			{import.meta.env.DEV && <Stats />}
		</>
	);
}
