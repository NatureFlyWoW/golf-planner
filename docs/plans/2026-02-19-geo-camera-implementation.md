# Geo Features & Camera Controls Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add location context (mini-map, sun indicator, info panel) and improved camera controls to the golf planner.

**Architecture:** Five independent features layered on top of the existing app — a location constants file, a suncalc-powered sun hook + R3F indicator, a static OSM tile mini-map, a collapsible location footer, and keyboard/touch camera controls. No changes to the Zustand store or data model. New UI components are overlaid on the existing canvas layout.

**Tech Stack:** React 19, TypeScript, R3F/drei, Tailwind, suncalc (new dependency)

**Environment:** fnm must be sourced in each shell: `export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)"`. Biome uses tabs. Tests with Vitest in `tests/` dir.

---

### Task 1: Install suncalc and create location constants

**Files:**
- Create: `src/constants/location.ts`

**Step 1: Install suncalc**

Run: `npm install suncalc`
Run: `npm install -D @types/suncalc`

**Step 2: Create location constants file**

```typescript
// src/constants/location.ts

/**
 * Gewerbepark 17, 4201 Gramastetten — BORGA hall location.
 * Used by sun position, mini-map, and location info panel.
 */
export const LOCATION = {
	address: "Gewerbepark 17, 4201 Gramastetten",
	region: "Urfahr-Umgebung, Upper Austria, Austria",
	lat: 48.3715,
	lng: 14.214,
	elevation: 526,
	timezone: "Europe/Vienna",
	googleMapsUrl: "https://www.google.com/maps/place/48.3715,14.2140",
	osmUrl:
		"https://www.openstreetmap.org/?mlat=48.3715&mlon=14.2140#map=17/48.3715/14.2140",
} as const;
```

**Step 3: Run lint check**

Run: `npm run check`
Expected: PASS (no errors)

**Step 4: Commit**

```bash
git add src/constants/location.ts package.json package-lock.json
git commit -m "feat: add suncalc dependency and location constants"
```

---

### Task 2: Create sun position hook with tests

**Files:**
- Create: `src/hooks/useSunPosition.ts`
- Create: `tests/hooks/sunPosition.test.ts`

**Step 1: Write the tests**

```typescript
// tests/hooks/sunPosition.test.ts
import { describe, expect, it } from "vitest";
import { getSunDirection, getWallExposure } from "../../src/hooks/useSunPosition";

describe("getSunDirection", () => {
	it("converts suncalc azimuth to scene direction vector", () => {
		// azimuth=0 means sun is due south in suncalc
		// In scene: sun is at Z+ (south), so arrow should point from Z+ toward center
		const dir = getSunDirection(0);
		expect(dir.x).toBeCloseTo(0, 5);
		expect(dir.z).toBeCloseTo(-1, 5); // pointing north (from south toward hall)
	});

	it("azimuth=PI/2 means sun is due west", () => {
		const dir = getSunDirection(Math.PI / 2);
		// Sun is west (X-), direction toward hall is east (X+)
		expect(dir.x).toBeCloseTo(-1, 5);
		expect(dir.z).toBeCloseTo(0, 1);
	});

	it("azimuth=-PI/2 means sun is due east", () => {
		const dir = getSunDirection(-Math.PI / 2);
		expect(dir.x).toBeCloseTo(1, 5);
		expect(dir.z).toBeCloseTo(0, 1);
	});

	it("azimuth=PI means sun is due north", () => {
		const dir = getSunDirection(Math.PI);
		expect(dir.x).toBeCloseTo(0, 1);
		expect(dir.z).toBeCloseTo(1, 5); // pointing south (from north toward hall)
	});
});

describe("getWallExposure", () => {
	it("south wall is exposed when sun is due south (azimuth=0)", () => {
		const exposure = getWallExposure(0);
		expect(exposure.south).toBeGreaterThan(0);
		expect(exposure.north).toBeLessThanOrEqual(0);
	});

	it("east wall is exposed when sun is due east (azimuth=-PI/2)", () => {
		const exposure = getWallExposure(-Math.PI / 2);
		expect(exposure.east).toBeGreaterThan(0);
		expect(exposure.west).toBeLessThanOrEqual(0);
	});

	it("all walls have zero exposure when sun is below horizon", () => {
		const exposure = getWallExposure(0, -10);
		expect(exposure.north).toBe(0);
		expect(exposure.south).toBe(0);
		expect(exposure.east).toBe(0);
		expect(exposure.west).toBe(0);
	});
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/hooks/sunPosition.test.ts`
Expected: FAIL — module not found

**Step 3: Implement the hook and pure functions**

```typescript
// src/hooks/useSunPosition.ts
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

	// Sun position in scene space (where the sun IS, opposite of getSunDirection)
	const sunX = Math.sin(azimuth);
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
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/hooks/sunPosition.test.ts`
Expected: PASS (all 7 tests)

**Step 5: Lint check**

Run: `npm run check`
Expected: PASS

**Step 6: Commit**

```bash
git add src/hooks/useSunPosition.ts tests/hooks/sunPosition.test.ts
git commit -m "feat: add sun position hook with direction and wall exposure math"
```

---

### Task 3: Create SunIndicator R3F component

**Files:**
- Create: `src/components/three/SunIndicator.tsx`

**Step 1: Create the sun arrow and info label component**

```typescript
// src/components/three/SunIndicator.tsx
import { Html } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { useStore } from "../../store";
import {
	type SunData,
	getSunDirection,
} from "../../hooks/useSunPosition";

type SunIndicatorProps = {
	sunData: SunData;
};

export function SunIndicator({ sunData }: SunIndicatorProps) {
	const { width, length } = useStore((s) => s.hall);
	const invalidate = useThree((s) => s.invalidate);

	// Request a new frame when sun data changes (needed because frameloop="demand")
	useEffect(() => {
		invalidate();
	}, [sunData.azimuth, sunData.altitude, invalidate]);

	const { position, rotation, visible } = useMemo(() => {
		if (!sunData.isDay) {
			return { position: [0, 0, 0] as const, rotation: 0, visible: false };
		}

		const dir = getSunDirection(sunData.azimuth);
		const centerX = width / 2;
		const centerZ = length / 2;

		// Place arrow 2m outside the hall, in the direction the sun is coming from
		// (opposite of the "toward hall" direction)
		const arrowDist = Math.max(width, length) / 2 + 2;
		const posX = centerX - dir.x * arrowDist;
		const posZ = centerZ - dir.z * arrowDist;

		// Rotation: arrow points toward hall center
		const angle = Math.atan2(-dir.x, -dir.z);

		return {
			position: [posX, 0.1, posZ] as const,
			rotation: angle,
			visible: true,
		};
	}, [sunData.azimuth, sunData.isDay, width, length]);

	if (!visible) return null;

	return (
		<group position={position} rotation={[0, rotation, 0]}>
			{/* Arrow body */}
			<mesh position={[0, 0, 0.5]}>
				<boxGeometry args={[0.3, 0.05, 1.0]} />
				<meshStandardMaterial color="#FFA726" />
			</mesh>
			{/* Arrow head (triangle via cone) */}
			<mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
				<coneGeometry args={[0.4, 0.6, 3]} />
				<meshStandardMaterial color="#FF9800" />
			</mesh>
			{/* Sun info label */}
			<Html position={[0, 0.5, 1.2]} center>
				<div
					style={{
						background: "rgba(0,0,0,0.7)",
						color: "#FFD54F",
						padding: "2px 6px",
						borderRadius: "4px",
						fontSize: "11px",
						whiteSpace: "nowrap",
						fontFamily: "monospace",
						userSelect: "none",
						pointerEvents: "none",
					}}
				>
					☀ {sunData.azimuthDeg}° · {sunData.altitudeDeg}° alt
				</div>
			</Html>
		</group>
	);
}
```

**Step 2: Lint check**

Run: `npm run check`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/three/SunIndicator.tsx
git commit -m "feat: add SunIndicator R3F component with arrow and info label"
```

---

### Task 4: Add sun-dependent window tints to HallOpenings

**Files:**
- Modify: `src/components/three/HallOpenings.tsx`

**Step 1: Update the Window component to accept and use wall exposure**

Modify `src/components/three/HallOpenings.tsx`:

- Import `getWallExposure` from the hook and `SunData` type
- **Do NOT call `useSunPosition()` here** — sun data comes from App via props to avoid duplicate timers
- Accept `sunData` as an optional prop on `HallOpenings`
- Compute `getWallExposure(sunData.azimuth, sunData.altitudeDeg)` from the prop
- Pass the per-wall exposure value to each `Window` component
- In `Window`, interpolate the color between the default blue (`#64B5F6`) and a warm yellow (`#FFD54F`) based on exposure value

The `Window` component becomes:

```typescript
function Window({
	window: win,
	hallWidth,
	hallLength,
	sunExposure,
}: {
	window: WindowSpec;
	hallWidth: number;
	hallLength: number;
	sunExposure: number;
}) {
	const centerY = win.sillHeight + win.height / 2;
	const position = getWallPosition(
		win.wall,
		win.offset,
		centerY,
		hallWidth,
		hallLength,
		win.width,
	);
	const rotation = getWallRotation(win.wall);

	// Interpolate between default blue and warm yellow based on sun exposure
	const color = sunExposure > 0 ? "#FFD54F" : "#64B5F6";

	return (
		<mesh position={position} rotation={rotation}>
			<planeGeometry args={[win.width, win.height]} />
			<meshStandardMaterial
				color={color}
				opacity={sunExposure > 0 ? 0.8 : 1}
				transparent={sunExposure > 0}
				side={2}
			/>
		</mesh>
	);
}
```

And `HallOpenings` accepts `sunData` as a prop and passes `sunExposure`:

```typescript
import { type SunData, getWallExposure } from "../../hooks/useSunPosition";

type HallOpeningsProps = {
	sunData?: SunData;
};

export function HallOpenings({ sunData }: HallOpeningsProps) {
	const { doors, windows, width, length } = useStore((s) => s.hall);
	const exposure = sunData
		? getWallExposure(sunData.azimuth, sunData.altitudeDeg)
		: { north: 0, south: 0, east: 0, west: 0 };

	return (
		<group>
			{doors.map((door) => (
				<Door key={door.id} door={door} hallWidth={width} hallLength={length} />
			))}
			{windows.map((win) => (
				<Window
					key={win.id}
					window={win}
					hallWidth={width}
					hallLength={length}
					sunExposure={exposure[win.wall as keyof typeof exposure] ?? 0}
				/>
			))}
		</group>
	);
}
```

**Step 2: Lint check**

Run: `npm run check`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/three/HallOpenings.tsx
git commit -m "feat: add sun-dependent window tints based on wall exposure"
```

---

### Task 5: Create SunControls UI component

**Files:**
- Create: `src/components/ui/SunControls.tsx`

**Step 1: Create the time preset + custom date/time picker**

```typescript
// src/components/ui/SunControls.tsx
import { useState } from "react";

type SunControlsProps = {
	selectedDate: Date | undefined;
	onDateChange: (date: Date | undefined) => void;
};

const PRESETS = [
	{ label: "Now", date: undefined },
	{ label: "Summer noon", date: new Date(2026, 5, 21, 12, 0) },
	{ label: "Winter noon", date: new Date(2026, 11, 21, 12, 0) },
] as const;

export function SunControls({ selectedDate, onDateChange }: SunControlsProps) {
	const [showCustom, setShowCustom] = useState(false);

	const activePreset =
		selectedDate === undefined
			? "Now"
			: PRESETS.find(
					(p) => p.date && p.date.getTime() === selectedDate.getTime(),
				)?.label ?? "Custom";

	return (
		<div className="absolute bottom-10 left-2 z-10 flex flex-col gap-1">
			<div className="flex gap-1">
				{PRESETS.map(({ label, date }) => (
					<button
						key={label}
						type="button"
						onClick={() => {
							onDateChange(date);
							setShowCustom(false);
						}}
						className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
							activePreset === label
								? "bg-amber-500 text-white"
								: "bg-gray-800/70 text-gray-200 hover:bg-gray-700/70"
						}`}
					>
						{label}
					</button>
				))}
				<button
					type="button"
					onClick={() => setShowCustom(!showCustom)}
					className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
						activePreset === "Custom"
							? "bg-amber-500 text-white"
							: "bg-gray-800/70 text-gray-200 hover:bg-gray-700/70"
					}`}
				>
					Custom
				</button>
			</div>
			{showCustom && (
				<div className="flex gap-1 rounded bg-gray-800/80 p-2">
					<input
						type="date"
						defaultValue="2026-06-21"
						onChange={(e) => {
							const val = e.target.value;
							if (!val) return;
							const [y, m, d] = val.split("-").map(Number);
							const time = selectedDate ?? new Date();
							onDateChange(new Date(y, m - 1, d, time.getHours(), time.getMinutes()));
						}}
						className="rounded bg-gray-700 px-1 py-0.5 text-xs text-white"
					/>
					<input
						type="time"
						defaultValue="12:00"
						onChange={(e) => {
							const val = e.target.value;
							if (!val) return;
							const [h, min] = val.split(":").map(Number);
							const base = selectedDate ?? new Date(2026, 5, 21);
							onDateChange(new Date(base.getFullYear(), base.getMonth(), base.getDate(), h, min));
						}}
						className="rounded bg-gray-700 px-1 py-0.5 text-xs text-white"
					/>
				</div>
			)}
		</div>
	);
}
```

**Step 2: Lint check**

Run: `npm run check`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/ui/SunControls.tsx
git commit -m "feat: add SunControls with time presets and custom date/time picker"
```

---

### Task 6: Wire sun indicator into App

**Files:**
- Modify: `src/App.tsx`

**Step 1: Integrate SunIndicator and SunControls into App**

In `src/App.tsx`:
- Add `useState` for `sunDate` (Date | undefined, defaults to undefined = "now")
- Import and render `SunControls` as an overlay inside the canvas wrapper div
- Import and render `SunIndicator` inside the `<Canvas>` with `useSunPosition(sunDate)`
- Since hooks can't be called conditionally inside Canvas, create a small wrapper `SunScene` component that calls `useSunPosition` and renders `SunIndicator`

The canvas wrapper div (the `flex-1` div) gets `relative` class added, and `SunControls` is positioned absolutely inside it.

Inside the `<Canvas>`, add `<SunScene date={sunDate} />` after `<PlacedHoles />`.

```typescript
// New component, inline in App.tsx or a separate small file:
function SunScene({ date }: { date?: Date }) {
	const sunData = useSunPosition(date);
	return <SunIndicator sunData={sunData} />;
}
```

**Step 2: Run build to verify no type errors**

Run: `npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire sun indicator and sun controls into main app"
```

---

### Task 7: Create MiniMap overlay component

**Files:**
- Create: `src/components/ui/MiniMap.tsx`

**Step 1: Create the mini-map component**

```typescript
// src/components/ui/MiniMap.tsx
import { LOCATION } from "../../constants/location";

/** Convert lat/lng to OSM tile coordinates at a given zoom level */
function latLngToTile(lat: number, lng: number, zoom: number) {
	const n = 2 ** zoom;
	const tileX = ((lng + 180) / 360) * n;
	const latRad = (lat * Math.PI) / 180;
	const tileY = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
	return { tileX, tileY };
}

const ZOOM = 16;
const TILE_SIZE = 256;
const MAP_SIZE = 150;

export function MiniMap() {
	const { tileX, tileY } = latLngToTile(LOCATION.lat, LOCATION.lng, ZOOM);
	const tileCol = Math.floor(tileX);
	const tileRow = Math.floor(tileY);

	// Marker position within the tile
	const markerX = (tileX - tileCol) * TILE_SIZE;
	const markerY = (tileY - tileRow) * TILE_SIZE;

	// Center the tile so the marker is in the middle of our viewport
	const offsetX = MAP_SIZE / 2 - markerX;
	const offsetY = MAP_SIZE / 2 - markerY;

	const tileUrl = `https://tile.openstreetmap.org/${ZOOM}/${tileCol}/${tileRow}.png`;

	return (
		<div className="absolute right-2 bottom-2 z-10 overflow-hidden rounded-lg shadow-lg"
			style={{ width: MAP_SIZE, height: MAP_SIZE }}
		>
			<a
				href={LOCATION.osmUrl}
				target="_blank"
				rel="noopener noreferrer"
				className="block relative"
				style={{ width: MAP_SIZE, height: MAP_SIZE, overflow: "hidden" }}
			>
				<img
					src={tileUrl}
					alt="Map showing hall location"
					width={TILE_SIZE}
					height={TILE_SIZE}
					style={{
						position: "absolute",
						left: offsetX,
						top: offsetY,
					}}
					draggable={false}
				/>
				{/* Red marker dot */}
				<div
					className="absolute rounded-full border-2 border-white bg-red-600"
					style={{
						width: 12,
						height: 12,
						left: MAP_SIZE / 2 - 6,
						top: MAP_SIZE / 2 - 6,
					}}
				/>
			</a>
			{/* Attribution */}
			<div
				className="absolute right-0 bottom-0 bg-white/80 px-1 text-gray-600"
				style={{ fontSize: "8px" }}
			>
				© OpenStreetMap
			</div>
		</div>
	);
}
```

**Step 2: Lint check**

Run: `npm run check`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/ui/MiniMap.tsx
git commit -m "feat: add MiniMap overlay with static OSM tile and marker"
```

---

### Task 8: Create LocationBar footer component

**Files:**
- Create: `src/components/ui/LocationBar.tsx`

**Step 1: Create the collapsible location footer**

```typescript
// src/components/ui/LocationBar.tsx
import { useState } from "react";
import { LOCATION } from "../../constants/location";
import type { SunData } from "../../hooks/useSunPosition";

type LocationBarProps = {
	sunData?: SunData;
};

export function LocationBar({ sunData }: LocationBarProps) {
	const [expanded, setExpanded] = useState(false);

	return (
		<div className="border-t border-gray-700 bg-gray-900 text-gray-300">
			<button
				type="button"
				onClick={() => setExpanded(!expanded)}
				className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-gray-800 transition-colors"
			>
				<span>📍</span>
				<span className="font-medium text-white">{LOCATION.address}</span>
				<span className="text-gray-500">·</span>
				<span>{LOCATION.elevation}m</span>
				<span className="text-gray-500">·</span>
				<span>
					{LOCATION.lat.toFixed(4)}°N {LOCATION.lng.toFixed(4)}°E
				</span>
				{sunData?.isDay && (
					<>
						<span className="text-gray-500">·</span>
						<span className="text-amber-400">
							☀ {sunData.azimuthDeg}° · {sunData.altitudeDeg}° alt
						</span>
					</>
				)}
				<span className="ml-auto text-gray-500">{expanded ? "▾" : "▸"}</span>
			</button>
			{expanded && (
				<div className="grid grid-cols-2 gap-x-4 gap-y-1 border-t border-gray-700 px-3 py-2 text-xs md:grid-cols-4">
					<div>
						<span className="text-gray-500">Address: </span>
						<span className="text-white">{LOCATION.address}</span>
					</div>
					<div>
						<span className="text-gray-500">Region: </span>
						<span>{LOCATION.region}</span>
					</div>
					<div>
						<span className="text-gray-500">Coordinates: </span>
						<span>
							{LOCATION.lat}°N, {LOCATION.lng}°E
						</span>
					</div>
					<div>
						<span className="text-gray-500">Elevation: </span>
						<span>{LOCATION.elevation}m above sea level</span>
					</div>
					{sunData && (
						<div>
							<span className="text-gray-500">Sun: </span>
							<span className={sunData.isDay ? "text-amber-400" : "text-gray-500"}>
								{sunData.isDay
									? `${sunData.azimuthDeg}° bearing, ${sunData.altitudeDeg}° elevation`
									: "Below horizon"}
							</span>
						</div>
					)}
					<div className="flex gap-2">
						<a
							href={LOCATION.osmUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="text-blue-400 hover:underline"
						>
							Open in Maps
						</a>
						<a
							href={LOCATION.googleMapsUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="text-blue-400 hover:underline"
						>
							Satellite View
						</a>
					</div>
				</div>
			)}
		</div>
	);
}
```

**Step 2: Lint check**

Run: `npm run check`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/ui/LocationBar.tsx
git commit -m "feat: add collapsible LocationBar footer with geo info and sun data"
```

---

### Task 9: Wire MiniMap and LocationBar into App

**Files:**
- Modify: `src/App.tsx`

**Step 1: Add MiniMap and LocationBar to the app layout**

In `src/App.tsx`:
- Import `MiniMap` and `LocationBar`
- Add `MiniMap` inside the canvas wrapper div (the `relative flex-1` div), as a sibling alongside SunControls
- Add `LocationBar` after the canvas area, before the closing `</div>` of the main flex column
- Pass `sunData` from the `SunScene` up to `LocationBar` — this requires lifting the `useSunPosition` call out of the Canvas. Since it's a non-R3F hook, it can live in App directly. Move it: call `useSunPosition(sunDate)` in `App`, pass `sunData` to both `<SunIndicator>` (inside Canvas) and `<LocationBar>` (outside Canvas).

The final App layout structure becomes:
```
<div className="flex h-screen w-screen flex-col overflow-hidden bg-gray-100">
  <Toolbar />
  <div className="flex flex-1 overflow-hidden">
    <Sidebar />
    <div className="relative flex-1" style={...}>
      <Canvas ...>
        ...existing scene...
        <Hall sunData={sunData} />  ← pass sunData so HallOpenings gets it
        <SunIndicator sunData={sunData} />
      </Canvas>
      <SunControls ... />
      <MiniMap />
    </div>
  </div>
  <LocationBar sunData={sunData} />
</div>
```

**Important:** `sunData` must flow from `App` → `Hall` → `HallOpenings`. This means `Hall.tsx` also needs to accept and forward the `sunData` prop. Do NOT call `useSunPosition()` inside `HallOpenings` — use the prop from App to ensure all sun consumers show the same position.

**Step 2: Run build**

Run: `npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire MiniMap and LocationBar into app layout"
```

---

### Task 10: Create useKeyboardControls hook with tests

**Files:**
- Create: `src/hooks/useKeyboardControls.ts`
- Create: `tests/hooks/keyboardControls.test.ts`

**Step 1: Write tests for the focus guard logic**

```typescript
// tests/hooks/keyboardControls.test.ts
import { describe, expect, it } from "vitest";
import { shouldHandleKey } from "../../src/hooks/useKeyboardControls";

describe("shouldHandleKey", () => {
	it("returns true when active element is body", () => {
		expect(shouldHandleKey("BODY")).toBe(true);
	});

	it("returns true when active element is a div", () => {
		expect(shouldHandleKey("DIV")).toBe(true);
	});

	it("returns false when active element is an input", () => {
		expect(shouldHandleKey("INPUT")).toBe(false);
	});

	it("returns false when active element is a textarea", () => {
		expect(shouldHandleKey("TEXTAREA")).toBe(false);
	});

	it("returns false when active element is a select", () => {
		expect(shouldHandleKey("SELECT")).toBe(false);
	});
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/hooks/keyboardControls.test.ts`
Expected: FAIL — module not found

**Step 3: Implement the hook**

```typescript
// src/hooks/useKeyboardControls.ts
import { useEffect } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useStore } from "../store";

const BLOCKED_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

/** Exported for testing — checks if keyboard shortcuts should fire */
export function shouldHandleKey(activeElementTag: string): boolean {
	return !BLOCKED_TAGS.has(activeElementTag);
}

type KeyboardControlsOptions = {
	controlsRef: React.RefObject<OrbitControlsImpl | null>;
	defaultZoom: number;
	defaultTarget: [number, number, number];
};

export function useKeyboardControls({
	controlsRef,
	defaultZoom,
	defaultTarget,
}: KeyboardControlsOptions) {
	// Note: we read holes/hall lazily inside the handler via useStore.getState()
	// to avoid re-registering the keydown listener on every hole change.

	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			if (!shouldHandleKey(document.activeElement?.tagName ?? "BODY")) return;

			const controls = controlsRef.current;
			if (!controls) return;

			const camera = controls.object;
			if (!("zoom" in camera)) return; // only orthographic

			switch (e.key) {
				case "r":
				case "R": {
					controls.target.set(...defaultTarget);
					camera.zoom = defaultZoom;
					camera.position.set(defaultTarget[0], 50, defaultTarget[2]);
					camera.updateProjectionMatrix();
					controls.update();
					break;
				}
				case "f":
				case "F": {
					const { holes, hall } = useStore.getState();
					const holeIds = Object.keys(holes);
					let minX = 0;
					let maxX = hall.width;
					let minZ = 0;
					let maxZ = hall.length;

					if (holeIds.length > 0) {
						minX = Number.POSITIVE_INFINITY;
						maxX = Number.NEGATIVE_INFINITY;
						minZ = Number.POSITIVE_INFINITY;
						maxZ = Number.NEGATIVE_INFINITY;
						for (const id of holeIds) {
							const h = holes[id];
							minX = Math.min(minX, h.position.x);
							maxX = Math.max(maxX, h.position.x);
							minZ = Math.min(minZ, h.position.z);
							maxZ = Math.max(maxZ, h.position.z);
						}
						// Add padding
						minX -= 2;
						maxX += 2;
						minZ -= 2;
						maxZ += 2;
					}

					const centerX = (minX + maxX) / 2;
					const centerZ = (minZ + maxZ) / 2;
					const rangeX = maxX - minX;
					const rangeZ = maxZ - minZ;

					controls.target.set(centerX, 0, centerZ);
					camera.position.set(centerX, 50, centerZ);

					// Calculate zoom to fit content in viewport
					const canvas = controls.domElement;
					const aspect = canvas.clientWidth / canvas.clientHeight;
					const zoomX = aspect > 0 ? canvas.clientWidth / rangeX : defaultZoom;
					const zoomZ = canvas.clientHeight / rangeZ;
					camera.zoom = Math.min(zoomX, zoomZ) * 0.9; // 90% to leave margin
					camera.zoom = Math.max(15, Math.min(120, camera.zoom));

					camera.updateProjectionMatrix();
					controls.update();
					break;
				}
				case "+":
				case "=": {
					camera.zoom = Math.min(120, camera.zoom + 10);
					camera.updateProjectionMatrix();
					controls.update();
					break;
				}
				case "-": {
					camera.zoom = Math.max(15, camera.zoom - 10);
					camera.updateProjectionMatrix();
					controls.update();
					break;
				}
				case "0": {
					camera.zoom = defaultZoom;
					camera.updateProjectionMatrix();
					controls.update();
					break;
				}
				case "ArrowUp": {
					e.preventDefault();
					controls.target.z -= 1;
					camera.position.z -= 1;
					controls.update();
					break;
				}
				case "ArrowDown": {
					e.preventDefault();
					controls.target.z += 1;
					camera.position.z += 1;
					controls.update();
					break;
				}
				case "ArrowLeft": {
					e.preventDefault();
					controls.target.x -= 1;
					camera.position.x -= 1;
					controls.update();
					break;
				}
				case "ArrowRight": {
					e.preventDefault();
					controls.target.x += 1;
					camera.position.x += 1;
					controls.update();
					break;
				}
			}
		}

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [controlsRef, defaultZoom, defaultTarget]);
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/hooks/keyboardControls.test.ts`
Expected: PASS (all 5 tests)

**Step 5: Lint check**

Run: `npm run check`
Expected: PASS

**Step 6: Commit**

```bash
git add src/hooks/useKeyboardControls.ts tests/hooks/keyboardControls.test.ts
git commit -m "feat: add useKeyboardControls hook with focus guard and camera actions"
```

---

### Task 11: Integrate keyboard controls into CameraControls

**Files:**
- Modify: `src/components/three/CameraControls.tsx`

**Step 1: Add ref and wire keyboard controls hook**

Update `CameraControls.tsx` to:
- Import `useRef` from React
- Import `useKeyboardControls` from the hook
- Import `OrbitControls as OrbitControlsImpl` from `three-stdlib` for the ref type
- Add a ref to the `<OrbitControls>` component
- Call `useKeyboardControls` with the ref and default values

```typescript
import { OrbitControls } from "@react-three/drei";
import { useRef } from "react";
import { MOUSE, TOUCH } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useKeyboardControls } from "../../hooks/useKeyboardControls";
import { useStore } from "../../store";

const DEFAULT_ZOOM = 40;

export function CameraControls() {
	const { width, length } = useStore((s) => s.hall);
	const controlsRef = useRef<OrbitControlsImpl>(null);
	const defaultTarget: [number, number, number] = [width / 2, 0, length / 2];

	useKeyboardControls({
		controlsRef,
		defaultZoom: DEFAULT_ZOOM,
		defaultTarget,
	});

	return (
		<OrbitControls
			ref={controlsRef}
			target={defaultTarget}
			enableRotate={false}
			enablePan={true}
			enableZoom={true}
			minZoom={15}
			maxZoom={120}
			mouseButtons={{
				LEFT: undefined,
				MIDDLE: MOUSE.PAN,
				RIGHT: MOUSE.PAN,
			}}
			touches={{
				ONE: undefined,
				TWO: TOUCH.DOLLY_PAN,
			}}
			makeDefault
		/>
	);
}
```

**Step 2: Run build**

Run: `npm run build`
Expected: PASS

**Step 3: Run all tests**

Run: `npx vitest run`
Expected: ALL PASS (existing 11 + new 12 = 23 tests)

**Step 4: Commit**

```bash
git add src/components/three/CameraControls.tsx
git commit -m "feat: integrate keyboard controls into CameraControls component"
```

---

### Task 12: Create KeyboardHelp tooltip

**Files:**
- Create: `src/components/ui/KeyboardHelp.tsx`

**Step 1: Create the help tooltip component**

```typescript
// src/components/ui/KeyboardHelp.tsx
import { useState } from "react";

const SHORTCUTS = [
	{ key: "R", action: "Reset view" },
	{ key: "F", action: "Fit to content" },
	{ key: "+ / -", action: "Zoom in / out" },
	{ key: "0", action: "Reset zoom" },
	{ key: "↑ ↓ ← →", action: "Pan" },
] as const;

export function KeyboardHelp() {
	const [open, setOpen] = useState(false);

	return (
		<div className="absolute bottom-2 left-2 z-10">
			<button
				type="button"
				onClick={() => setOpen(!open)}
				onMouseEnter={() => setOpen(true)}
				onMouseLeave={() => setOpen(false)}
				className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-800/70 text-xs text-gray-300 hover:bg-gray-700/70"
			>
				?
			</button>
			{open && (
				<div className="absolute bottom-8 left-0 rounded bg-gray-900/90 p-2 shadow-lg">
					<table className="text-xs text-gray-300">
						<tbody>
							{SHORTCUTS.map(({ key, action }) => (
								<tr key={key}>
									<td className="pr-3 font-mono text-white">{key}</td>
									<td className="whitespace-nowrap">{action}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
```

**Step 2: Add KeyboardHelp to App**

In `src/App.tsx`, import `KeyboardHelp` and add it inside the canvas wrapper div (same container as SunControls and MiniMap). KeyboardHelp is at `bottom-2 left-2` and SunControls is already at `bottom-10 left-2` (set in Task 5). They stack: help button at bottom-left, sun controls above it.

**Step 3: Lint check**

Run: `npm run check`
Expected: PASS

**Step 4: Commit**

```bash
git add src/components/ui/KeyboardHelp.tsx src/App.tsx
git commit -m "feat: add KeyboardHelp tooltip with shortcut reference"
```

---

### Task 13: Add double-tap reset for touch

**Files:**
- Modify: `src/components/three/CameraControls.tsx`

**Step 1: Add double-tap detection**

Add a `useEffect` in `CameraControls` that listens for `touchend` events on the canvas. Track last tap time; if two taps happen within 300ms on the canvas background (not on a hole mesh), reset the camera.

Implementation approach: listen on the `gl.domElement` (the canvas element) for `touchend`. Use `controlsRef` to reset. The double-tap handler:

```typescript
useEffect(() => {
	const controls = controlsRef.current;
	if (!controls) return;

	const canvas = controls.domElement;
	let lastTapTime = 0;
	let wasSingleTouch = false;

	function handleTouchStart(e: TouchEvent) {
		// Only track as potential tap if exactly one finger
		wasSingleTouch = e.touches.length === 1;
	}

	function handleTouchEnd(e: TouchEvent) {
		if (e.touches.length > 0) return; // only on final finger up
		if (!wasSingleTouch) return; // ignore if gesture started as multi-touch (pinch)

		const now = Date.now();
		if (now - lastTapTime < 300) {
			// Double tap — reset camera
			const ctrl = controlsRef.current;
			if (!ctrl) return;
			const cam = ctrl.object;
			if (!("zoom" in cam)) return;
			ctrl.target.set(...defaultTarget);
			cam.position.set(defaultTarget[0], 50, defaultTarget[2]);
			cam.zoom = DEFAULT_ZOOM;
			cam.updateProjectionMatrix();
			ctrl.update();
			lastTapTime = 0;
		} else {
			lastTapTime = now;
		}
	}

	canvas.addEventListener("touchstart", handleTouchStart);
	canvas.addEventListener("touchend", handleTouchEnd);
	return () => {
		canvas.removeEventListener("touchstart", handleTouchStart);
		canvas.removeEventListener("touchend", handleTouchEnd);
	};
}, [defaultTarget]);
```

Note: This only fires for single-finger double-taps on the canvas background. Multi-touch gestures (pinch-to-zoom) are excluded by the `wasSingleTouch` guard. Hole meshes handle their own click events via R3F's event system which uses `stopPropagation`.

**Step 2: Run build**

Run: `npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/three/CameraControls.tsx
git commit -m "feat: add double-tap to reset camera for touch devices"
```

---

### Task 14: Final integration test and cleanup

**Files:**
- Modify: none (verification only)

**Step 1: Run all tests**

Run: `npx vitest run`
Expected: ALL PASS

**Step 2: Run lint + format check**

Run: `npm run check`
Expected: PASS (no errors)

**Step 3: Run production build**

Run: `npm run build`
Expected: PASS

**Step 4: Manual verification checklist**

Start dev server (`npm run dev`) and verify:
- [ ] Sun arrow appears outside the hall pointing from the correct direction
- [ ] Window tints change color when sun is shining on them
- [ ] Sun preset buttons (Now/Summer/Winter) switch the sun position
- [ ] Custom date/time picker appears when clicking "Custom"
- [ ] Mini-map shows in bottom-right corner with red dot
- [ ] Clicking mini-map opens OSM in new tab
- [ ] Location footer bar appears at bottom with address info
- [ ] Clicking footer expands to show full details + map links
- [ ] Keyboard: R resets, F fits to content, +/- zooms, arrows pan, 0 resets zoom
- [ ] Keyboard shortcuts don't fire when typing in hole name input
- [ ] Double-tap on mobile/touch resets camera

**Step 5: Commit any final fixes**

If any issues found, fix and commit individually.
