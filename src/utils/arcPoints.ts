import type { DoorSpec, WindowSpec } from "../types/hall";

type Point3 = [number, number, number];

const Y = 0.02;

/**
 * Returns the hinge position and wall-parallel/perpendicular directions
 * for a door on a given wall side.
 */
function getDoorGeometry(
	door: DoorSpec,
	hallWidth: number,
	hallLength: number,
) {
	const outward = door.type === "sectional";

	switch (door.wall) {
		case "south": {
			const hingeX = door.offset;
			const hingeZ = hallLength;
			// Along wall = +X, perpendicular outward = +Z
			return {
				hinge: [hingeX, Y, hingeZ] as Point3,
				alongX: 1,
				alongZ: 0,
				perpX: 0,
				perpZ: outward ? 1 : -1,
			};
		}
		case "north": {
			const hingeX = door.offset;
			const hingeZ = 0;
			return {
				hinge: [hingeX, Y, hingeZ] as Point3,
				alongX: 1,
				alongZ: 0,
				perpX: 0,
				perpZ: outward ? -1 : 1,
			};
		}
		case "east": {
			const hingeX = hallWidth;
			const hingeZ = door.offset;
			return {
				hinge: [hingeX, Y, hingeZ] as Point3,
				alongX: 0,
				alongZ: 1,
				perpX: outward ? 1 : -1,
				perpZ: 0,
			};
		}
		case "west": {
			const hingeX = 0;
			const hingeZ = door.offset;
			return {
				hinge: [hingeX, Y, hingeZ] as Point3,
				alongX: 0,
				alongZ: 1,
				perpX: outward ? -1 : 1,
				perpZ: 0,
			};
		}
	}
}

export function computeDoorArc(
	door: DoorSpec,
	hallWidth: number,
	hallLength: number,
	segments = 24,
): {
	arcPoints: Point3[];
	panelLine: [Point3, Point3];
} {
	const { hinge, alongX, alongZ, perpX, perpZ } = getDoorGeometry(
		door,
		hallWidth,
		hallLength,
	);
	const radius = door.width;

	const arcPoints: Point3[] = [];
	for (let i = 0; i <= segments; i++) {
		const angle = (i / segments) * (Math.PI / 2);
		const cos = Math.cos(angle);
		const sin = Math.sin(angle);
		arcPoints.push([
			hinge[0] + radius * (cos * alongX + sin * perpX),
			Y,
			hinge[2] + radius * (cos * alongZ + sin * perpZ),
		]);
	}

	const panelLine: [Point3, Point3] = [
		[...hinge],
		[
			hinge[0] + radius * alongX,
			Y,
			hinge[2] + radius * alongZ,
		],
	];

	return { arcPoints, panelLine };
}

function getWindowGeometry(
	win: WindowSpec,
	hallWidth: number,
	hallLength: number,
	wallThickness: number,
) {
	switch (win.wall) {
		case "east": {
			const outerFace = hallWidth;
			const innerFace = hallWidth - wallThickness;
			return {
				// Glass lines run along Z
				glassLine1X: outerFace - wallThickness * 0.7,
				glassLine2X: outerFace - wallThickness * 0.3,
				startZ: win.offset,
				endZ: win.offset + win.width,
				// Break ticks run along X
				tickInnerX: innerFace,
				tickOuterX: outerFace,
				axis: "z" as const,
			};
		}
		case "west": {
			const outerFace = 0;
			const innerFace = wallThickness;
			return {
				glassLine1X: outerFace + wallThickness * 0.7,
				glassLine2X: outerFace + wallThickness * 0.3,
				startZ: win.offset,
				endZ: win.offset + win.width,
				tickInnerX: innerFace,
				tickOuterX: outerFace,
				axis: "z" as const,
			};
		}
		case "south": {
			const outerFace = hallLength;
			const innerFace = hallLength - wallThickness;
			return {
				glassLine1X: outerFace - wallThickness * 0.7,
				glassLine2X: outerFace - wallThickness * 0.3,
				startZ: win.offset,
				endZ: win.offset + win.width,
				tickInnerX: innerFace,
				tickOuterX: outerFace,
				axis: "x" as const,
			};
		}
		case "north": {
			const outerFace = 0;
			const innerFace = wallThickness;
			return {
				glassLine1X: outerFace + wallThickness * 0.7,
				glassLine2X: outerFace + wallThickness * 0.3,
				startZ: win.offset,
				endZ: win.offset + win.width,
				tickInnerX: innerFace,
				tickOuterX: outerFace,
				axis: "x" as const,
			};
		}
	}
}

export function computeWindowLines(
	win: WindowSpec,
	hallWidth: number,
	hallLength: number,
	wallThickness: number,
): {
	glassLines: [Point3, Point3][];
	breakTicks: [Point3, Point3][];
} {
	const geom = getWindowGeometry(win, hallWidth, hallLength, wallThickness);

	if (geom.axis === "z") {
		// East/west walls: glass lines run along Z, ticks along X
		const glassLines: [Point3, Point3][] = [
			[
				[geom.glassLine1X, Y, geom.startZ],
				[geom.glassLine1X, Y, geom.endZ],
			],
			[
				[geom.glassLine2X, Y, geom.startZ],
				[geom.glassLine2X, Y, geom.endZ],
			],
		];

		const breakTicks: [Point3, Point3][] = [
			[
				[geom.tickInnerX, Y, geom.startZ],
				[geom.tickOuterX, Y, geom.startZ],
			],
			[
				[geom.tickInnerX, Y, geom.endZ],
				[geom.tickOuterX, Y, geom.endZ],
			],
		];

		return { glassLines, breakTicks };
	}

	// North/south walls: glass lines run along X, ticks along Z
	const glassLines: [Point3, Point3][] = [
		[
			[geom.startZ, Y, geom.glassLine1X],
			[geom.endZ, Y, geom.glassLine1X],
		],
		[
			[geom.startZ, Y, geom.glassLine2X],
			[geom.endZ, Y, geom.glassLine2X],
		],
	];

	const breakTicks: [Point3, Point3][] = [
		[
			[geom.startZ, Y, geom.tickInnerX],
			[geom.startZ, Y, geom.tickOuterX],
		],
		[
			[geom.endZ, Y, geom.tickInnerX],
			[geom.endZ, Y, geom.tickOuterX],
		],
	];

	return { glassLines, breakTicks };
}
