import { useRef } from "react";
import { useSplitPane } from "../../hooks/useSplitPane";
import { useStore } from "../../store";
import { canvasPointerEvents } from "../../utils/uvTransitionConfig";
import { KeyboardHelp } from "../ui/KeyboardHelp";
import { MiniMap } from "../ui/MiniMap";
import { SunControls } from "../ui/SunControls";
import { SplitDivider } from "./SplitDivider";

export function DualViewport() {
	const containerRef = useRef<HTMLDivElement>(null);
	const viewportLayout = useStore((s) => s.ui.viewportLayout);
	const splitRatio = useStore((s) => s.ui.splitRatio);
	const tool = useStore((s) => s.ui.tool);
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
					{/* Placeholder — Canvas View wired in Section 04 */}
					<div className="flex h-full items-center justify-center bg-surface-alt text-text-muted">
						2D Viewport
					</div>
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
					{/* Placeholder — Canvas View wired in Section 04 */}
					<div className="flex h-full items-center justify-center bg-surface-alt text-text-muted">
						3D Viewport
					</div>
				</div>
			)}
			{/* Overlay components — positioned absolutely within viewport container */}
			<SunControls />
			<KeyboardHelp />
			<MiniMap />
		</div>
	);
}
