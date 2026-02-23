import { useViewportId } from "../../../hooks/useViewportId";
import { ArchitecturalGrid2D } from "./ArchitecturalGrid2D";
import { ArchitecturalOpenings2D } from "./ArchitecturalOpenings2D";
import { ArchitecturalWalls2D } from "./ArchitecturalWalls2D";
import { HoleFeltOverlays } from "./HoleFeltOverlays";

/**
 * Container for all 2D architectural floor plan elements.
 * Only renders in the 2D viewport. Children added in sections 03-07.
 */
export function ArchitecturalFloorPlan() {
	const viewportId = useViewportId();

	if (viewportId !== "2d") return null;

	return (
		<group name="architectural-floor-plan">
			<ArchitecturalGrid2D />
			<ArchitecturalWalls2D />
			<ArchitecturalOpenings2D />
			<HoleFeltOverlays />
		</group>
	);
}
