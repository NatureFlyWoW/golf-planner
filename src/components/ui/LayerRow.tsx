import type { LayerId } from "../../types/viewport";

type LayerRowProps = {
	layerId: LayerId;
	label: string;
	icon: string;
	visible: boolean;
	opacity: number;
	locked: boolean;
	onToggleVisible: () => void;
	onOpacityChange: (value: number) => void;
	onToggleLocked: () => void;
};

export function LayerRow({
	layerId,
	label,
	icon,
	visible,
	opacity,
	locked,
	onToggleVisible,
	onOpacityChange,
	onToggleLocked,
}: LayerRowProps) {
	return (
		<div
			data-testid={`layer-row-${layerId}`}
			className={`flex items-center gap-1.5 rounded px-1.5 py-1 ${visible ? "" : "opacity-50"}`}
		>
			{/* Visibility toggle */}
			<button
				type="button"
				onClick={onToggleVisible}
				aria-label={`Toggle ${label} visibility`}
				className="w-6 text-center text-sm text-text-secondary hover:text-primary"
				title={visible ? "Hide" : "Show"}
			>
				{visible ? "\u25C9" : "\u25CE"}
			</button>

			{/* Icon + Label */}
			<span className="w-20 truncate text-xs text-text-secondary">
				<span className="mr-1">{icon}</span>
				{label}
			</span>

			{/* Opacity slider */}
			<input
				type="range"
				min="0"
				max="100"
				step="1"
				value={Math.round(opacity * 100)}
				onChange={(e) => onOpacityChange(Number(e.target.value) / 100)}
				disabled={!visible}
				aria-label={`${label} opacity`}
				className="h-1 flex-1 cursor-pointer accent-accent-text disabled:cursor-not-allowed disabled:opacity-40"
			/>

			{/* Lock toggle */}
			<button
				type="button"
				onClick={onToggleLocked}
				aria-label={`Toggle ${label} lock`}
				className="w-6 text-center text-sm text-text-secondary hover:text-primary"
				title={locked ? "Unlock" : "Lock"}
			>
				{locked ? "\uD83D\uDD12" : "\uD83D\uDD13"}
			</button>
		</div>
	);
}
