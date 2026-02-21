import { lazy, Suspense } from "react";
import { useStore } from "../../store";

const PostProcessing = lazy(() => import("./PostProcessing"));

export function UVEffects() {
	const uvMode = useStore((s) => s.ui.uvMode);
	if (!uvMode) return null;
	return (
		<Suspense fallback={null}>
			<PostProcessing />
		</Suspense>
	);
}
