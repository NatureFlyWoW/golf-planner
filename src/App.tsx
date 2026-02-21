import { PerformanceMonitor } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { lazy, Suspense, useEffect } from "react";
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
import { needsAlwaysFrameloop, useGpuTier } from "./hooks/useGpuTier";
import { useSunPosition } from "./hooks/useSunPosition";
import { useStore } from "./store";
import { isMobile } from "./utils/isMobile";

const Builder = lazy(() => import("./components/builder/Builder"));
const ThreeCanvas = lazy(() => import("./components/three/ThreeCanvas"));

export default function App() {
	const tool = useStore((s) => s.ui.tool);
	const uvMode = useStore((s) => s.ui.uvMode);
	const gpuTier = useStore((s) => s.ui.gpuTier);
	const transitioning = useStore((s) => s.ui.transitioning);
	const builderMode = useStore((s) => s.builderMode);
	const sunDate = useStore((s) => s.ui.sunDate);
	const sunData = useSunPosition(sunDate);
	const budgetSize = useStore((s) => Object.keys(s.budget).length);
	const initBudget = useStore((s) => s.initBudget);

	useGpuTier();

	const dpr: [number, number] =
		gpuTier === "high" ? [1, 2] : gpuTier === "mid" ? [1, 1.5] : [1, 1];
	const frameloop = needsAlwaysFrameloop(uvMode, gpuTier, transitioning)
		? "always"
		: "demand";

	useEffect(() => {
		if (budgetSize === 0) {
			initBudget();
		}
	}, [budgetSize, initBudget]);

	return (
		<div className="flex h-screen w-screen flex-col overflow-hidden bg-surface">
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
						dpr={dpr}
						frameloop={frameloop}
						shadows={!uvMode ? "soft" : undefined}
						gl={{
							antialias: !isMobile,
							preserveDrawingBuffer: true,
						}}
					>
						<PerformanceMonitor>
							<Suspense fallback={null}>
								<ThreeCanvas sunData={sunData} />
							</Suspense>
						</PerformanceMonitor>
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
			{builderMode && (
				<Suspense fallback={null}>
					<Builder />
				</Suspense>
			)}
		</div>
	);
}
