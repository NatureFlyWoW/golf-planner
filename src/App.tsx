import { Canvas } from "@react-three/fiber";
import { useEffect } from "react";
import { CameraControls } from "./components/three/CameraControls";
import { FloorGrid } from "./components/three/FloorGrid";
import { FlowPath } from "./components/three/FlowPath";
import { Hall } from "./components/three/Hall";
import { PlacedHoles } from "./components/three/PlacedHoles";
import { PlacementHandler } from "./components/three/PlacementHandler";
import { SunIndicator } from "./components/three/SunIndicator";
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
						gl={{ antialias: !isMobile }}
					>
						<ambientLight
							color={uvMode ? "#220044" : "#ffffff"}
							intensity={uvMode ? 0.3 : 0.8}
						/>
						<directionalLight
							position={[10, 20, 5]}
							color={uvMode ? "#6600CC" : "#ffffff"}
							intensity={uvMode ? 0.4 : 0.5}
						/>
						<CameraControls />
						<FloorGrid />
						<Hall sunData={sunData} />
						<PlacementHandler />
						<PlacedHoles />
						<FlowPath />
						<SunIndicator sunData={sunData} />
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
