import { lazy, Suspense } from "react";
import { useStore } from "../../store";
import { shouldEnablePostProcessing } from "../../utils/environmentGating";

const PostProcessing = lazy(() => import("./PostProcessing"));

export function UVEffects() {
	const uvMode = useStore((s) => s.ui.uvMode);
	const viewportLayout = useStore((s) => s.ui.viewportLayout);

	// No UV effects in non-UV mode or when PostProcessing is disabled
	if (!uvMode) return null;
	if (!shouldEnablePostProcessing(viewportLayout)) return null;

	return (
		<Suspense fallback={null}>
			<PostProcessing />
		</Suspense>
	);
}
