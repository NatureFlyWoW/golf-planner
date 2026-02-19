import { Canvas } from "@react-three/fiber";
import { useState } from "react";
import { CameraControls } from "./components/three/CameraControls";
import { FloorGrid } from "./components/three/FloorGrid";
import { Hall } from "./components/three/Hall";
import { PlacedHoles } from "./components/three/PlacedHoles";
import { PlacementHandler } from "./components/three/PlacementHandler";
import { SunIndicator } from "./components/three/SunIndicator";
import { KeyboardHelp } from "./components/ui/KeyboardHelp";
import { LocationBar } from "./components/ui/LocationBar";
import { MiniMap } from "./components/ui/MiniMap";
import { Sidebar } from "./components/ui/Sidebar";
import { SunControls } from "./components/ui/SunControls";
import { Toolbar } from "./components/ui/Toolbar";
import { useSunPosition } from "./hooks/useSunPosition";
import { useStore } from "./store";

export default function App() {
	const tool = useStore((s) => s.ui.tool);
	const [sunDate, setSunDate] = useState<Date | undefined>(undefined);
	const sunData = useSunPosition(sunDate);

	return (
		<div className="flex h-screen w-screen flex-col overflow-hidden bg-gray-100">
			<Toolbar />
			<div className="flex flex-1 overflow-hidden">
				<Sidebar />
				<div
					className="relative flex-1"
					style={{ cursor: tool === "delete" ? "crosshair" : "default" }}
				>
					<Canvas dpr={[1, 2]} frameloop="demand">
						<ambientLight intensity={0.8} />
						<directionalLight position={[10, 20, 5]} intensity={0.5} />
						<CameraControls />
						<FloorGrid />
						<Hall sunData={sunData} />
						<PlacementHandler />
						<PlacedHoles />
						<SunIndicator sunData={sunData} />
					</Canvas>
					<SunControls selectedDate={sunDate} onDateChange={setSunDate} />
					<KeyboardHelp />
					<MiniMap />
				</div>
			</div>
			<LocationBar sunData={sunData} />
		</div>
	);
}
