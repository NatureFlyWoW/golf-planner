import { useStore } from "../../store";
import { BuilderUI } from "./BuilderUI";

export default function Builder() {
	const builderMode = useStore((s) => s.builderMode);

	if (!builderMode) return null;

	return (
		<div className="fixed inset-0 z-50 flex flex-col bg-gray-100">
			<BuilderUI />
			{/* Canvas placeholder — replaced in Task 6 */}
			<div className="relative flex flex-1 items-center justify-center bg-gray-200">
				<p className="text-sm text-gray-400">3D Canvas (Task 6)</p>
			</div>
		</div>
	);
}
