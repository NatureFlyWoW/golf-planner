import { describe, expect, it } from "vitest";
import {
	computeWallSegments,
	wallSegmentToRect,
} from "../../src/utils/wallGeometry";

describe("computeWallSegments", () => {
	const hallWidth = 10.0;
	const hallLength = 20.0;

	const doors = [
		{
			id: "door-sectional",
			type: "sectional" as const,
			width: 3.5,
			height: 3.5,
			wall: "south" as const,
			offset: 3.25,
		},
		{
			id: "door-pvc",
			type: "pvc" as const,
			width: 0.9,
			height: 2.0,
			wall: "south" as const,
			offset: 8.1,
		},
	];

	const windows = [
		{
			id: "window-1",
			width: 3.0,
			height: 1.1,
			wall: "east" as const,
			offset: 2.0,
			sillHeight: 1.5,
		},
		{
			id: "window-2",
			width: 3.0,
			height: 1.1,
			wall: "east" as const,
			offset: 10.0,
			sillHeight: 1.5,
		},
		{
			id: "window-3",
			width: 3.0,
			height: 1.1,
			wall: "west" as const,
			offset: 2.0,
			sillHeight: 1.5,
		},
		{
			id: "window-4",
			width: 3.0,
			height: 1.1,
			wall: "west" as const,
			offset: 10.0,
			sillHeight: 1.5,
		},
	];

	it("south wall with 2 doors returns 3 segments", () => {
		const segments = computeWallSegments(
			"south",
			hallWidth,
			hallLength,
			doors,
			windows,
		);
		expect(segments).toEqual([
			{ start: 0, end: 3.25 },
			{ start: 6.75, end: 8.1 },
			{ start: 9.0, end: 10.0 },
		]);
	});

	it("east wall with 2 windows returns 3 segments", () => {
		const segments = computeWallSegments(
			"east",
			hallWidth,
			hallLength,
			doors,
			windows,
		);
		expect(segments).toEqual([
			{ start: 0, end: 2.0 },
			{ start: 5.0, end: 10.0 },
			{ start: 13.0, end: 20.0 },
		]);
	});

	it("north wall with no openings returns 1 full-length segment", () => {
		const segments = computeWallSegments(
			"north",
			hallWidth,
			hallLength,
			doors,
			windows,
		);
		expect(segments).toEqual([{ start: 0, end: 10.0 }]);
	});

	it("west wall with 2 windows returns 3 segments", () => {
		const segments = computeWallSegments(
			"west",
			hallWidth,
			hallLength,
			doors,
			windows,
		);
		expect(segments).toEqual([
			{ start: 0, end: 2.0 },
			{ start: 5.0, end: 10.0 },
			{ start: 13.0, end: 20.0 },
		]);
	});

	it("handles overlapping doors/windows by merging gaps", () => {
		const overlappingDoors = [
			{
				id: "d1",
				type: "pvc" as const,
				width: 3.0,
				height: 2.0,
				wall: "south" as const,
				offset: 2.0,
			},
			{
				id: "d2",
				type: "pvc" as const,
				width: 3.0,
				height: 2.0,
				wall: "south" as const,
				offset: 4.0,
			},
		];
		const segments = computeWallSegments(
			"south",
			hallWidth,
			hallLength,
			overlappingDoors,
			[],
		);
		// Gaps: [2,5] and [4,7] overlap => merged gap [2,7]
		// Segments: [0,2] and [7,10]
		expect(segments).toEqual([
			{ start: 0, end: 2.0 },
			{ start: 7.0, end: 10.0 },
		]);
	});

	it("handles opening at wall start (offset 0)", () => {
		const edgeDoor = [
			{
				id: "d-edge",
				type: "pvc" as const,
				width: 2.0,
				height: 2.0,
				wall: "south" as const,
				offset: 0,
			},
		];
		const segments = computeWallSegments(
			"south",
			hallWidth,
			hallLength,
			edgeDoor,
			[],
		);
		// Gap: [0, 2] => segment: [2, 10]
		expect(segments).toEqual([{ start: 2.0, end: 10.0 }]);
	});

	it("handles opening at wall end", () => {
		const edgeDoor = [
			{
				id: "d-edge",
				type: "pvc" as const,
				width: 2.0,
				height: 2.0,
				wall: "south" as const,
				offset: 8.0,
			},
		];
		const segments = computeWallSegments(
			"south",
			hallWidth,
			hallLength,
			edgeDoor,
			[],
		);
		// Gap: [8, 10] => segment: [0, 8]
		expect(segments).toEqual([{ start: 0, end: 8.0 }]);
	});
});

describe("wallSegmentToRect", () => {
	const thickness = 0.2;
	const hallWidth = 10.0;
	const hallLength = 20.0;

	it("south wall segment returns correct position and size", () => {
		const segment = { start: 0, end: 3.25 };
		const rect = wallSegmentToRect(
			segment,
			"south",
			thickness,
			hallWidth,
			hallLength,
		);
		// South wall is at z=hallLength, extends inward (toward z=hallLength - thickness)
		// X runs from segment.start to segment.end
		expect(rect.size[0]).toBeCloseTo(3.25); // width along X
		expect(rect.size[1]).toBeCloseTo(thickness); // depth along Z
		// Position is center of the rectangle
		expect(rect.position[0]).toBeCloseTo(3.25 / 2); // center X
		expect(rect.position[1]).toBeCloseTo(0.02); // Y slightly above floor
		expect(rect.position[2]).toBeCloseTo(hallLength - thickness / 2); // center Z
	});

	it("east wall segment returns correct position and size (rotated axis)", () => {
		const segment = { start: 0, end: 2.0 };
		const rect = wallSegmentToRect(
			segment,
			"east",
			thickness,
			hallWidth,
			hallLength,
		);
		// East wall is at x=hallWidth, extends inward (toward x=hallWidth - thickness)
		// Z runs from segment.start to segment.end
		expect(rect.size[0]).toBeCloseTo(thickness); // width along X
		expect(rect.size[1]).toBeCloseTo(2.0); // depth along Z
		expect(rect.position[0]).toBeCloseTo(hallWidth - thickness / 2); // center X
		expect(rect.position[1]).toBeCloseTo(0.02); // Y
		expect(rect.position[2]).toBeCloseTo(1.0); // center Z
	});

	it("north wall segment returns correct position and size", () => {
		const segment = { start: 0, end: 10.0 };
		const rect = wallSegmentToRect(
			segment,
			"north",
			thickness,
			hallWidth,
			hallLength,
		);
		expect(rect.size[0]).toBeCloseTo(10.0);
		expect(rect.size[1]).toBeCloseTo(thickness);
		expect(rect.position[0]).toBeCloseTo(5.0);
		expect(rect.position[1]).toBeCloseTo(0.02);
		expect(rect.position[2]).toBeCloseTo(thickness / 2);
	});

	it("west wall segment returns correct position and size", () => {
		const segment = { start: 5.0, end: 10.0 };
		const rect = wallSegmentToRect(
			segment,
			"west",
			thickness,
			hallWidth,
			hallLength,
		);
		expect(rect.size[0]).toBeCloseTo(thickness);
		expect(rect.size[1]).toBeCloseTo(5.0);
		expect(rect.position[0]).toBeCloseTo(thickness / 2);
		expect(rect.position[1]).toBeCloseTo(0.02);
		expect(rect.position[2]).toBeCloseTo(7.5);
	});
});
