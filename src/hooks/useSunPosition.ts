import { useEffect, useState } from "react";
import SunCalc from "suncalc";
import { LOCATION } from "../constants/location";

export type SunData = {
	azimuth: number; // radians, suncalc convention (0=south, clockwise)
	altitude: number; // radians above horizon
	azimuthDeg: number; // degrees from north (0-360, for display)
	altitudeDeg: number; // degrees (for display)
	isDay: boolean;
};

export type WallExposure = {
	north: number;
	south: number;
	east: number;
	west: number;
};

/**
 * Convert suncalc azimuth to a unit direction vector in scene space.
 * Returns a vector pointing FROM the sun TOWARD the hall center.
 * Scene coords: X+ = east, Z+ = south.
 * suncalc azimuth: 0 = south, PI/2 = west, PI/-PI = north, -PI/2 = east.
 */
export function getSunDirection(azimuth: number): { x: number; z: number } {
	return {
		x: -Math.sin(azimuth),
		z: -Math.cos(azimuth),
	};
}

/**
 * Compute how much each wall faces the sun (dot product of sun direction and wall outward normal).
 * Returns 0 for walls facing away or when sun is below horizon.
 * Wall outward normals: north=[0,-1], south=[0,1], east=[1,0], west=[-1,0] (in scene Z+south coords).
 */
export function getWallExposure(
	azimuth: number,
	altitudeDeg?: number,
): WallExposure {
	if (altitudeDeg !== undefined && altitudeDeg <= 0) {
		return { north: 0, south: 0, east: 0, west: 0 };
	}

	// Sun position in scene space (X+ = east, Z+ = south)
	// suncalc azimuth: 0 = south, positive = clockwise toward west
	const sunX = -Math.sin(azimuth);
	const sunZ = Math.cos(azimuth);

	return {
		north: Math.max(0, -sunZ), // north outward normal is [0, -1]
		south: Math.max(0, sunZ), // south outward normal is [0, +1]
		east: Math.max(0, sunX), // east outward normal is [+1, 0]
		west: Math.max(0, -sunX), // west outward normal is [-1, 0]
	};
}

/**
 * Hook that returns current sun position for the hall location.
 * Updates every 60s in "now" mode, or returns fixed position for a given date.
 *
 * IMPORTANT: The `date` parameter must be referentially stable across renders
 * (e.g. from a const or useState). If a new Date object is created each render,
 * the effect will re-fire every render.
 */
export function useSunPosition(date?: Date): SunData {
	const [sunData, setSunData] = useState<SunData>(() => computeSun(date));

	useEffect(() => {
		setSunData(computeSun(date));

		// In "now" mode (no fixed date), update every 60s
		if (!date) {
			const interval = setInterval(() => {
				setSunData(computeSun(undefined));
			}, 60_000);
			return () => clearInterval(interval);
		}
	}, [date]);

	return sunData;
}

function computeSun(date?: Date): SunData {
	const d = date ?? new Date();
	const pos = SunCalc.getPosition(d, LOCATION.lat, LOCATION.lng);

	// Convert suncalc azimuth (0=south, CW) to compass bearing (0=north, CW)
	let compassDeg = ((pos.azimuth * 180) / Math.PI + 180) % 360;
	if (compassDeg < 0) compassDeg += 360;

	return {
		azimuth: pos.azimuth,
		altitude: pos.altitude,
		azimuthDeg: Math.round(compassDeg),
		altitudeDeg: Math.round((pos.altitude * 180) / Math.PI),
		isDay: pos.altitude > 0,
	};
}
