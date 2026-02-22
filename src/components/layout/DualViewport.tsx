import {
	CameraControls,
	OrbitControls,
	OrthographicCamera,
	PerspectiveCamera,
	SoftShadows,
	View,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import type CameraControlsImpl from "camera-controls";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { MOUSE, NoToneMapping, TOUCH } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useKeyboardControls } from "../../hooks/useKeyboardControls";
import { useSplitPane } from "../../hooks/useSplitPane";
import type { SunData } from "../../hooks/useSunPosition";
import { useStore } from "../../store";
import {
	DEFAULT_ORTHO_ZOOM,
	MAX_ORTHO_ZOOM,
	MIN_ORTHO_ZOOM,
	PERSPECTIVE_FOV,
	getCameraPresets,
} from "../../utils/cameraPresets";
import {
	deriveFrameloop,
	getShadowType,
	shouldEnableSoftShadows,
} from "../../utils/environmentGating";
import { isMobile } from "../../utils/isMobile";
import { canvasPointerEvents } from "../../utils/uvTransitionConfig";
import { CameraPresets } from "../three/CameraPresets";
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

/** Double-tap-to-reset hook for touch devices, per-viewport */
function useDoubleTapReset(
	paneRef: React.RefObject<HTMLDivElement | null>,
	resetFn: () => void,
) {
	useEffect(() => {
		const el = paneRef.current;
		if (!el) return;

		let lastTapTime = 0;
		let wasSingleTouch = false;

		function handleTouchStart(e: TouchEvent) {
			wasSingleTouch = e.touches.length === 1;
		}

		function handleTouchEnd(e: TouchEvent) {
			if (e.touches.length > 0) return;
			if (!wasSingleTouch) return;

			const now = Date.now();
			if (now - lastTapTime < 300) {
				resetFn();
				lastTapTime = 0;
			} else {
				lastTapTime = now;
			}
		}

		el.addEventListener("touchstart", handleTouchStart);
		el.addEventListener("touchend", handleTouchEnd);
		return () => {
			el.removeEventListener("touchstart", handleTouchStart);
			el.removeEventListener("touchend", handleTouchEnd);
		};
	}, [paneRef, resetFn]);
}

export function DualViewport({ sunData }: DualViewportProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const pane2DRef = useRef<HTMLDivElement>(null);
	const pane3DRef = useRef<HTMLDivElement>(null);
	const controls2DRef = useRef<OrbitControlsImpl>(null);
	const controls3DRef = useRef<CameraControlsImpl>(null);

	const viewportLayout = useStore((s) => s.ui.viewportLayout);
	const splitRatio = useStore((s) => s.ui.splitRatio);
	const tool = useStore((s) => s.ui.tool);
	const uvMode = useStore((s) => s.ui.uvMode);
	const gpuTier = useStore((s) => s.ui.gpuTier);
	const transitioning = useStore((s) => s.ui.transitioning);
	const hall = useStore((s) => s.hall);
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

	// Camera defaults
	const defaultTarget: [number, number, number] = useMemo(
		() => [hall.width / 2, 0, hall.length / 2],
		[hall.width, hall.length],
	);

	const initialIsoPosition = useMemo(() => {
		const presets = getCameraPresets(hall.width, hall.length);
		return presets.isometric.position;
	}, [hall.width, hall.length]);

	// Keyboard controls for both viewports
	useKeyboardControls({
		controls2DRef,
		controls3DRef,
		defaultTarget,
	});

	// Double-tap-to-reset: 2D resets to centered ortho, 3D resets to isometric
	const reset2D = useMemo(
		() => () => {
			const ctrl = controls2DRef.current;
			if (!ctrl) return;
			const cam = ctrl.object;
			ctrl.target.set(...defaultTarget);
			cam.position.set(defaultTarget[0], 50, defaultTarget[2]);
			if ("zoom" in cam) {
				(cam as { zoom: number }).zoom = DEFAULT_ORTHO_ZOOM;
			}
			cam.updateProjectionMatrix();
			ctrl.update();
		},
		[defaultTarget],
	);

	const reset3D = useMemo(
		() => () => {
			const ctrl = controls3DRef.current;
			if (!ctrl) return;
			const presets = getCameraPresets(hall.width, hall.length);
			const iso = presets.isometric;
			ctrl.setLookAt(
				iso.position[0],
				iso.position[1],
				iso.position[2],
				iso.target[0],
				iso.target[1],
				iso.target[2],
				true,
			);
		},
		[hall.width, hall.length],
	);

	useDoubleTapReset(pane2DRef, reset2D);
	useDoubleTapReset(pane3DRef, reset3D);

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
					ref={pane2DRef}
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
							position={[defaultTarget[0], 50, defaultTarget[2]]}
							zoom={DEFAULT_ORTHO_ZOOM}
							near={0.1}
							far={200}
						/>
						<OrbitControls
							ref={controls2DRef}
							target={defaultTarget}
							enableRotate={false}
							enablePan={true}
							enableZoom={true}
							minZoom={MIN_ORTHO_ZOOM}
							maxZoom={MAX_ORTHO_ZOOM}
							mouseButtons={{
								LEFT: undefined,
								MIDDLE: MOUSE.PAN,
								RIGHT: MOUSE.PAN,
							}}
							touches={{
								ONE: TOUCH.PAN,
								TWO: TOUCH.DOLLY_PAN,
							}}
							makeDefault
						/>
						<SharedScene sunData={sunData} />
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
					ref={pane3DRef}
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
							position={initialIsoPosition}
							fov={PERSPECTIVE_FOV}
							near={0.1}
							far={500}
						/>
						<CameraControls
							ref={controls3DRef}
							makeDefault
						/>
						<SharedScene sunData={sunData} />
						<ThreeDOnlyContent />
						{!show2D && <PlacementHandler />}
					</View>
					{/* Camera presets overlay (HTML, outside Canvas) */}
					<CameraPresets cameraControlsRef={controls3DRef} />
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
