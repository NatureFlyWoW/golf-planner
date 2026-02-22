import { ChevronLeft, ChevronRight } from "lucide-react";
import { useStore } from "../../store";

type SplitDividerProps = {
	isDragging: boolean;
	onMouseDown: (e: React.MouseEvent) => void;
	onTouchStart: (e: React.TouchEvent) => void;
	onDoubleClick: () => void;
};

export function SplitDivider({
	isDragging,
	onMouseDown,
	onTouchStart,
	onDoubleClick,
}: SplitDividerProps) {
	const splitRatio = useStore((s) => s.ui.splitRatio);

	return (
		<div
			role="separator"
			aria-orientation="vertical"
			aria-valuenow={Math.round(splitRatio * 100)}
			tabIndex={0}
			className="group flex w-3 flex-shrink-0 cursor-col-resize items-center justify-center"
			onMouseDown={onMouseDown}
			onTouchStart={onTouchStart}
			onDoubleClick={onDoubleClick}
		>
			<div className="relative flex h-full w-1 items-center justify-center">
				{/* Visual bar */}
				<div
					className={`absolute inset-0 transition-colors ${
						isDragging
							? "bg-accent"
							: "bg-border group-hover:bg-accent/70"
					}`}
				/>
				{/* Chevrons on hover (hidden when dragging) */}
				{!isDragging && (
					<div className="relative z-10 flex flex-col gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
						<ChevronLeft className="h-3 w-3 text-text-muted" />
						<ChevronRight className="h-3 w-3 text-text-muted" />
					</div>
				)}
			</div>
		</div>
	);
}
