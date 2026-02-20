import { Canvas } from "@react-three/fiber";
import { useEffect } from "react";
import { CameraControls } from "./components/three/CameraControls";
import { FloorGrid } from "./components/three/FloorGrid";
import { FlowPath } from "./components/three/FlowPath";
import { Hall } from "./components/three/Hall";
import { PlacedHoles } from "./components/three/PlacedHoles";
import { PlacementHandler } from "./components/three/PlacementHandler";
import { SunIndicator } from "./components/three/SunIndicator";
import { UVEffects } from "./components/three/UVEffects";
import { BottomToolbar } from "./components/ui/BottomToolbar";
import { HoleDrawer } from "./components/ui/HoleDrawer";
import { KeyboardHelp } from "./components/ui/KeyboardHelp";
import { LocationBar } from "./components/ui/LocationBar";
import { MiniMap } from "./components/ui/MiniMap";
import { MobileBudgetPanel } from "./components/ui/MobileBudgetPanel";
import { MobileDetailPanel } from "./components/ui/MobileDetailPanel";
import { MobileSunControls } from "./components/ui/MobileSunControls";
import { Sidebar } from "./components/ui/Sidebar";
import { SunControls } from "./components/ui/SunControls";
import { Toolbar } from "./components/ui/Toolbar";
import { useSunPosition } from "./hooks/useSunPosition";
import { useStore } from "./store";
import { isMobile } from "./utils/isMobile";

export default function App() {
	const tool = useStore((s) => s.ui.tool);
	const uvMode = useStore((s) => s.ui.uvMode);
	const sunDate = useStore((s) => s.ui.sunDate);
	const sunData = useSunPosition(sunDate);
	const budgetSize = useStore((s) => Object.keys(s.budget).length);
	const initBudget = useStore((s) => s.initBudget);

	useEffect(() => {
		if (budgetSize === 0) {
			initBudget();
		}
	}, [budgetSize, initBudget]);

	return (
		<div className="flex h-screen w-screen flex-col overflow-hidden bg-gray-100">
			<Toolbar />
			<div className="flex flex-1 overflow-hidden">
				<Sidebar />
				<div
					className="relative flex-1"
					style={{
						cursor: tool === "delete" ? "crosshair" : "default",
						touchAction: "none",
					}}
				>
					<Canvas
						dpr={isMobile ? [1, 1.5] : [1, 2]}
						frameloop="demand"
						shadows={!uvMode ? "soft" : undefined}
						gl={{
							antialias: !isMobile,
							preserveDrawingBuffer: true,
						}}
					>
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
						{uvMode && (
							<fog attach="fog" args={["#0A0A1A", 8, 25]} />
						)}
						<CameraControls />
						<FloorGrid />
						<Hall sunData={sunData} />
						<PlacementHandler />
						<PlacedHoles />
						<FlowPath />
						<SunIndicator sunData={sunData} />
						<UVEffects />
					</Canvas>
					<SunControls />
					<KeyboardHelp />
					<MiniMap />
				</div>
			</div>
			<LocationBar sunData={sunData} />
			<BottomToolbar />
			<HoleDrawer />
			<MobileDetailPanel />
			<MobileSunControls />
			<MobileBudgetPanel />
		</div>
	);
}
