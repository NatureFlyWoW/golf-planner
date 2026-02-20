export function CanvasSkeleton() {
	return (
		<div className="flex h-full w-full items-center justify-center bg-gray-100">
			<div className="flex flex-col items-center gap-2">
				<div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
				<span className="text-xs text-gray-400">Loading 3D view...</span>
			</div>
		</div>
	);
}
