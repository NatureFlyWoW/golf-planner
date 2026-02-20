import { HoleDogleg } from "./HoleDogleg";
import { HoleLoop } from "./HoleLoop";
import { HoleLShape } from "./HoleLShape";
import { HoleRamp } from "./HoleRamp";
import { HoleStraight } from "./HoleStraight";
import { HoleTunnel } from "./HoleTunnel";
import { HoleWindmill } from "./HoleWindmill";
import { SURFACE_THICKNESS } from "./shared";

export type HoleModelProps = {
	type: string;
	width: number;
	length: number;
	color: string;
};

/** Dispatches to per-type 3D model. Falls back to a simple box. */
export function HoleModel({ type, width, length, color }: HoleModelProps) {
	switch (type) {
		case "straight":
			return <HoleStraight width={width} length={length} />;
		case "l-shape":
			return <HoleLShape width={width} length={length} />;
		case "dogleg":
			return <HoleDogleg width={width} length={length} />;
		case "ramp":
			return <HoleRamp width={width} length={length} color={color} />;
		case "loop":
			return <HoleLoop width={width} length={length} color={color} />;
		case "windmill":
			return <HoleWindmill width={width} length={length} color={color} />;
		case "tunnel":
			return <HoleTunnel width={width} length={length} color={color} />;
		default:
			return (
				<mesh position={[0, SURFACE_THICKNESS / 2, 0]}>
					<boxGeometry args={[width, SURFACE_THICKNESS, length]} />
					<meshStandardMaterial color={color} />
				</mesh>
			);
	}
}
