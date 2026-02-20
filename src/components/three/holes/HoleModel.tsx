import { SURFACE_THICKNESS } from "./shared";

export type HoleModelProps = {
	type: string;
	width: number;
	length: number;
	color: string;
};

/** Dispatches to per-type 3D model. Falls back to a simple box. */
export function HoleModel({ type, width, length, color }: HoleModelProps) {
	// Per-type components will be added here in Tasks 3-9.
	// Fallback: simple box matching the old rendering (low profile).
	return (
		<mesh position={[0, SURFACE_THICKNESS / 2, 0]}>
			<boxGeometry args={[width, SURFACE_THICKNESS, length]} />
			<meshStandardMaterial color={color} />
		</mesh>
	);
}
