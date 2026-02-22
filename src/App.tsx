import { lazy, Suspense, useEffect } from "react";
import { DualViewport } from "./components/layout/DualViewport";
import { BottomToolbar } from "./components/ui/BottomToolbar";
import { HoleDrawer } from "./components/ui/HoleDrawer";
import { LocationBar } from "./components/ui/LocationBar";
import { MobileBudgetPanel } from "./components/ui/MobileBudgetPanel";
import { MobileDetailPanel } from "./components/ui/MobileDetailPanel";
import { MobileSunControls } from "./components/ui/MobileSunControls";
import { Sidebar } from "./components/ui/Sidebar";
import { UVTransition } from "./components/three/UVTransition";
import { Toolbar } from "./components/ui/Toolbar";
import { useGpuTier } from "./hooks/useGpuTier";
import { useSunPosition } from "./hooks/useSunPosition";
import { useStore } from "./store";

const Builder = lazy(() => import("./components/builder/Builder"));

export default function App() {
	const builderMode = useStore((s) => s.builderMode);
	const sunDate = useStore((s) => s.ui.sunDate);
	const sunData = useSunPosition(sunDate);
	const budgetSize = useStore((s) => Object.keys(s.budget).length);
	const initBudget = useStore((s) => s.initBudget);

	useGpuTier();

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
				<DualViewport />
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
