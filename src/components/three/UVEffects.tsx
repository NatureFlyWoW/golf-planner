import { Suspense, lazy } from "react";
import { useStore } from "../../store";

const UVPostProcessing = lazy(() => import("./UVPostProcessing"));

export function UVEffects() {
	const uvMode = useStore((s) => s.ui.uvMode);
	if (!uvMode) return null;
	return (
		<Suspense fallback={null}>
			<UVPostProcessing />
		</Suspense>
	);
}
