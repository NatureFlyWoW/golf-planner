import { Canvas } from "@react-three/fiber";
import { CameraControls } from "./components/three/CameraControls";
import { FloorGrid } from "./components/three/FloorGrid";
import { Hall } from "./components/three/Hall";
import { Sidebar } from "./components/ui/Sidebar";
import { Toolbar } from "./components/ui/Toolbar";

export default function App() {
	return (
		<div className="flex h-screen w-screen flex-col overflow-hidden bg-gray-100">
			<Toolbar />
			<div className="flex flex-1 overflow-hidden">
				<Sidebar />
				<div className="flex-1">
					<Canvas
						orthographic
						camera={{
							position: [5, 50, 10],
							zoom: 40,
							near: 0.1,
							far: 200,
						}}
						dpr={[1, 2]}
						frameloop="demand"
					>
						<ambientLight intensity={0.8} />
						<directionalLight position={[10, 20, 5]} intensity={0.5} />
						<CameraControls />
						<FloorGrid />
						<Hall />
					</Canvas>
				</div>
			</div>
		</div>
	);
}
