export function CanvasSkeleton() {
	return (
		<div className="flex h-full w-full items-center justify-center bg-surface">
			<div className="flex flex-col items-center gap-2">
				<div className="h-8 w-8 animate-spin rounded-full border-2 border-grid-ghost border-t-accent-text" />
				<span className="text-xs text-text-muted">Loading 3D view...</span>
			</div>
		</div>
	);
}
