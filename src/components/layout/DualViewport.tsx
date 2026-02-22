import {
	OrthographicCamera,
	PerspectiveCamera,
	SoftShadows,
	View,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useRef } from "react";
import { NoToneMapping } from "three";
import type { SunData } from "../../hooks/useSunPosition";
import { useSplitPane } from "../../hooks/useSplitPane";
import { useStore } from "../../store";
import {
	deriveFrameloop,
	getShadowType,
	shouldEnableSoftShadows,
} from "../../utils/environmentGating";
import { isMobile } from "../../utils/isMobile";
import { canvasPointerEvents } from "../../utils/uvTransitionConfig";
import { PlacementHandler } from "../three/PlacementHandler";
import { SharedScene } from "../three/SharedScene";
import { ThreeDOnlyContent } from "../three/ThreeDOnlyContent";
import { KeyboardHelp } from "../ui/KeyboardHelp";
import { MiniMap } from "../ui/MiniMap";
import { SunControls } from "../ui/SunControls";
import { SplitDivider } from "./SplitDivider";

type DualViewportProps = {
	sunData: SunData;
};

export function DualViewport({ sunData }: DualViewportProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const viewportLayout = useStore((s) => s.ui.viewportLayout);
	const splitRatio = useStore((s) => s.ui.splitRatio);
	const tool = useStore((s) => s.ui.tool);
	const uvMode = useStore((s) => s.ui.uvMode);
	const gpuTier = useStore((s) => s.ui.gpuTier);
	const transitioning = useStore((s) => s.ui.transitioning);
	const setActiveViewport = useStore((s) => s.setActiveViewport);
	const {
		isDragging,
		onDividerMouseDown,
		onDividerTouchStart,
		onDividerDoubleClick,
	} = useSplitPane(containerRef);

	const show2D = viewportLayout !== "3d-only";
	const show3D = viewportLayout !== "2d-only";
	const showDivider = viewportLayout === "dual";

	// Canvas configuration
	const dpr: [number, number] = isMobile
		? [1, 1.5]
		: gpuTier === "high"
			? [1, 2]
			: gpuTier === "mid"
				? [1, 1.5]
				: [1, 1];
	// View rendering requires frameloop="always" in dual mode
	const frameloop =
		viewportLayout === "dual"
			? "always"
			: deriveFrameloop(uvMode, gpuTier, transitioning);
	const shadows = getShadowType(gpuTier, isMobile);

	return (
		<div
			ref={containerRef}
			className={`relative flex flex-1 overflow-hidden ${
				isDragging ? "cursor-col-resize select-none" : ""
			}`}
			style={{
				cursor: isDragging
					? undefined
					: tool === "delete"
						? "crosshair"
						: "default",
				touchAction: "none",
				pointerEvents: canvasPointerEvents(transitioning),
			}}
		>
			{/* 2D pane */}
			{show2D && (
				<div
					className="relative h-full overflow-hidden"
					style={{
						width: showDivider
							? `calc(${splitRatio * 100}% - 6px)`
							: "100%",
					}}
					onPointerEnter={() => setActiveViewport("2d")}
				>
					<View style={{ width: "100%", height: "100%" }}>
						<OrthographicCamera
							makeDefault
							position={[5, 50, 10]}
							zoom={40}
						/>
						<SharedScene sunData={sunData} />
						{/* PlacementHandler in 2D pane only (dual/2d-only) to prevent double events */}
						<PlacementHandler />
					</View>
				</div>
			)}

			{showDivider && (
				<SplitDivider
					isDragging={isDragging}
					onMouseDown={onDividerMouseDown}
					onTouchStart={onDividerTouchStart}
					onDoubleClick={onDividerDoubleClick}
				/>
			)}

			{/* 3D pane */}
			{show3D && (
				<div
					className="relative h-full overflow-hidden"
					style={{
						width: showDivider
							? `calc(${(1 - splitRatio) * 100}% - 6px)`
							: "100%",
					}}
					onPointerEnter={() => setActiveViewport("3d")}
				>
					<View style={{ width: "100%", height: "100%" }}>
						<PerspectiveCamera
							makeDefault
							position={[5, 15, 25]}
							fov={60}
						/>
						<SharedScene sunData={sunData} />
						<ThreeDOnlyContent />
						{/* PlacementHandler in 3D pane only when 2D pane is hidden */}
						{!show2D && <PlacementHandler />}
					</View>
				</div>
			)}

			{/* Single shared Canvas behind both panes */}
			<Canvas
				dpr={dpr}
				frameloop={frameloop}
				shadows={shadows}
				gl={{
					antialias: !isMobile,
					preserveDrawingBuffer: false,
					powerPreference: "high-performance",
					toneMapping: NoToneMapping,
				}}
				eventSource={containerRef}
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					width: "100%",
					height: "100%",
					pointerEvents: "none",
				}}
			>
				{shouldEnableSoftShadows(gpuTier) && (
					<SoftShadows size={25} samples={10} />
				)}
				<Suspense fallback={null}>
					<View.Port />
				</Suspense>
			</Canvas>

			{/* Overlay components */}
			<SunControls />
			<KeyboardHelp />
			<MiniMap />
		</div>
	);
}
