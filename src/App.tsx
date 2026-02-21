import { Canvas } from "@react-three/fiber";
import { lazy, Suspense, useEffect } from "react";
import { NoToneMapping } from "three";
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
import { UVTransition } from "./components/three/UVTransition";
import { Toolbar } from "./components/ui/Toolbar";
import { useGpuTier } from "./hooks/useGpuTier";
import { useSunPosition } from "./hooks/useSunPosition";
import { useStore } from "./store";
import { deriveFrameloop, getShadowType } from "./utils/environmentGating";
import { isMobile } from "./utils/isMobile";
import { canvasPointerEvents } from "./utils/uvTransitionConfig";

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

	const dpr: [number, number] = isMobile
		? [1, 1.5]
		: gpuTier === "high"
			? [1, 2]
			: gpuTier === "mid"
				? [1, 1.5]
				: [1, 1];
	const frameloop = deriveFrameloop(uvMode, gpuTier, transitioning);
	const shadows = getShadowType(gpuTier, isMobile);

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
						pointerEvents: canvasPointerEvents(transitioning),
					}}
				>
					<Canvas
						dpr={dpr}
						frameloop={frameloop}
						shadows={shadows}
						gl={{
							antialias: !isMobile,
							preserveDrawingBuffer: true,
							powerPreference: "high-performance",
							toneMapping: NoToneMapping,
						}}
					>
						<Suspense fallback={null}>
							<ThreeCanvas sunData={sunData} />
						</Suspense>
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
			<UVTransition />
		</div>
	);
}
