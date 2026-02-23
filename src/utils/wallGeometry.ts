import type { DoorSpec, Wall, WindowSpec } from "../types/hall";

/** Visual wall thickness in 2D rendering (double the data value for architectural visibility) */
export const ARCH_WALL_THICKNESS = 0.2;

export type WallSegment = {
	start: number;
	end: number;
};

export type WallRect = {
	position: [number, number, number]; // center [x, y, z]
	size: [number, number]; // [widthAlongPrimary, depthAlongSecondary]
};

type Gap = { start: number; end: number };

function getWallLength(wallSide: Wall, hallWidth: number, hallLength: number) {
	return wallSide === "north" || wallSide === "south" ? hallWidth : hallLength;
}

function mergeGaps(gaps: Gap[]): Gap[] {
	if (gaps.length === 0) return [];
	const sorted = [...gaps].sort((a, b) => a.start - b.start);
	const merged: Gap[] = [{ ...sorted[0] }];
	for (let i = 1; i < sorted.length; i++) {
		const last = merged[merged.length - 1];
		if (sorted[i].start <= last.end) {
			last.end = Math.max(last.end, sorted[i].end);
		} else {
			merged.push({ ...sorted[i] });
		}
	}
	return merged;
}

export function computeWallSegments(
	wallSide: Wall,
	hallWidth: number,
	hallLength: number,
	doors: DoorSpec[],
	windows: WindowSpec[],
): WallSegment[] {
	const wallLen = getWallLength(wallSide, hallWidth, hallLength);

	const gaps: Gap[] = [];
	for (const door of doors) {
		if (door.wall === wallSide) {
			gaps.push({ start: door.offset, end: door.offset + door.width });
		}
	}
	for (const win of windows) {
		if (win.wall === wallSide) {
			gaps.push({ start: win.offset, end: win.offset + win.width });
		}
	}

	const merged = mergeGaps(gaps);

	const segments: WallSegment[] = [];
	let cursor = 0;
	for (const gap of merged) {
		if (cursor < gap.start) {
			segments.push({ start: cursor, end: gap.start });
		}
		cursor = gap.end;
	}
	if (cursor < wallLen) {
		segments.push({ start: cursor, end: wallLen });
	}

	return segments.filter((s) => s.end - s.start > 0);
}

const WALL_Y = 0.02;

export function wallSegmentToRect(
	segment: WallSegment,
	wallSide: Wall,
	thickness: number,
	hallWidth: number,
	hallLength: number,
): WallRect {
	const len = segment.end - segment.start;
	const mid = (segment.start + segment.end) / 2;

	switch (wallSide) {
		case "north":
			return {
				position: [mid, WALL_Y, thickness / 2],
				size: [len, thickness],
			};
		case "south":
			return {
				position: [mid, WALL_Y, hallLength - thickness / 2],
				size: [len, thickness],
			};
		case "west":
			return {
				position: [thickness / 2, WALL_Y, mid],
				size: [thickness, len],
			};
		case "east":
			return {
				position: [hallWidth - thickness / 2, WALL_Y, mid],
				size: [thickness, len],
			};
	}
}
