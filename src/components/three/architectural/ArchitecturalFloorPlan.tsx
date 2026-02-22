import { useViewportId } from "../../../hooks/useViewportId";
import { ArchitecturalWalls2D } from "./ArchitecturalWalls2D";

/**
 * Container for all 2D architectural floor plan elements.
 * Only renders in the 2D viewport. Children added in sections 03-07.
 */
export function ArchitecturalFloorPlan() {
	const viewportId = useViewportId();

	if (viewportId !== "2d") return null;

	return (
		<group name="architectural-floor-plan">
			<ArchitecturalWalls2D />
			{/* Section 04: ArchitecturalOpenings2D */}
			{/* Section 06: ArchitecturalGrid2D */}
			{/* Section 07: HoleFelt2D overlays */}
		</group>
	);
}
