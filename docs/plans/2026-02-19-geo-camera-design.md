# Geo Features & Camera Controls Design

**Date:** 2026-02-19
**Status:** Approved
**Approach:** A (Lightweight Static)

## Context

The BORGA hall is located at **Gewerbepark 17, 4201 Gramastetten**, Upper Austria (48.3715°N, 14.2140°E, 526m elevation). This design adds location context, sun position awareness, and improved camera controls to the planner — grounding the layout tool in its real-world setting without changing core functionality.

## Features

### 1. Location Constants

New file `src/constants/location.ts` — single source of truth for all geo data.

```typescript
export const LOCATION = {
  address: "Gewerbepark 17, 4201 Gramastetten",
  region: "Urfahr-Umgebung, Upper Austria, Austria",
  lat: 48.3715,
  lng: 14.2140,
  elevation: 526, // meters above sea level
  timezone: "Europe/Vienna",
  // No hallBearing — the hall is axis-aligned (north-south)
  // and the scene coordinate system matches: Z+ = south, X+ = east
  googleMapsUrl: "https://www.google.com/maps/place/48.3715,14.2140",
  osmUrl: "https://www.openstreetmap.org/?mlat=48.3715&mlon=14.2140#map=17/48.3715/14.2140",
} as const;
```

### 2. Sun Position Indicator

**Dependency:** `suncalc` (~3KB, zero dependencies)

**Hook:** `useSunPosition(lat, lng)` — returns `{ azimuth, altitude, isDay }` for current or selected time. Recomputes on time change.

**Azimuth-to-scene conversion:** suncalc returns azimuth in radians measured clockwise from south (0 = south, π/2 = west, π = north, -π/2 = east). In our R3F scene, Z+ points south and X+ points east. The conversion to a scene-space direction vector is:
```
sunDirX = -sin(azimuth)   // east-west component
sunDirZ = -cos(azimuth)   // north-south component
```
This gives a unit vector pointing FROM the sun TOWARD the hall. The arrow is placed on the hall perimeter in the opposite direction (where the sun is).

**In-canvas visualization:**
- **Sun direction arrow** — a yellow/orange wedge rendered outside the hall walls, pointing inward from the sun's azimuth direction. Positioned on the hall perimeter using the converted direction vector.
- **Window tints** — windows on sun-facing walls get a warm yellow semi-transparent overlay; shaded windows stay neutral. Computed by comparing the sun direction vector against each wall's outward normal (north wall: [0,-1], south: [0,1], east: [1,0], west: [-1,0]). A wall is sun-facing when the dot product of sun direction and wall normal is > 0.
- **Sun info label** — drei `Html` component showing azimuth (°), elevation (°), and day/night status. Positioned near the sun arrow.

**Time control:**
- Three quick preset buttons: **"Now"** (default), **"Summer noon"** (Jun 21 12:00), **"Winter noon"** (Dec 21 12:00).
- A **"Custom"** button that expands to reveal a date picker + time slider for arbitrary date/time selection.
- "Now" mode updates every 60 seconds from system clock.

**Key insight for blacklight planning:** South-facing windows get intense low-angle sun in winter (18.5° noon elevation). East/west windows get long morning/evening sun in summer. North-facing windows get the least direct sun year-round.

### 3. Mini-map Overlay

**Implementation:** Pure HTML/CSS overlay, no JS map library.

- 150×150px floating `div` in the bottom-right corner of the canvas.
- Contains a static OpenStreetMap raster tile image centered on the hall's coordinates at zoom level 16.
- Red marker dot at the hall's position (CSS absolute positioning computed from fractional tile offset).
- On click: opens OSM in a new tab.
- Attribution: small "© OpenStreetMap" text.

**No hover expansion** — keeps it simple and works identically on touch/desktop. Fixed 150px size.

**Tile + marker computation:** Convert lat/lng to tile x/y at zoom 16 using the standard Slippy Map formula. The fractional part of x/y gives the pixel offset within the tile for the marker dot:
```
tileX = (lng + 180) / 360 * 2^z
tileY = (1 - ln(tan(lat) + sec(lat)) / π) / 2 * 2^z
markerPixelX = (tileX - floor(tileX)) * 256
markerPixelY = (tileY - floor(tileY)) * 256
```

Single tile fetched once on mount, browser-cached.

### 4. Location Info Panel

**Implementation:** Collapsible footer bar below the canvas.

**Collapsed (default):** Single line — address, elevation, coordinates.

**Expanded:** ~80px panel with:
- Full address and region
- GPS coordinates
- Elevation (526m)
- Current sun position (from useSunPosition hook)
- Links: "Open in Maps" (OSM) | "Satellite View" (Google Maps)

**Styling:** Matches toolbar/sidebar (Tailwind). Dark background, white text, `border-t`.

### 5. Camera Controls

**Keyboard shortcuts (only active when no text input is focused):**

| Key | Action |
|-----|--------|
| `R` | Reset camera to default (center, zoom 40) |
| `F` | Fit-to-content (zoom to show all holes + 2m padding; if no holes, fit to hall bounds = same as reset) |
| `+` / `=` | Zoom in (+10 zoom) |
| `-` | Zoom out (-10 zoom) |
| Arrow keys | Pan (move target by 1m) |
| `0` | Reset zoom only (keep pan) |

**Focus guard:** The `useKeyboardControls` hook checks `document.activeElement` — if it's an `<input>`, `<textarea>`, or `<select>`, keyboard shortcuts are suppressed and the event passes through to the input normally.

**Touch controls:**

| Gesture | Action |
|---------|--------|
| Double-tap (canvas background only, not on holes) | Reset camera to default |
| Pinch | Zoom (existing) |
| Two-finger drag | Pan (existing) |

**Implementation:**
- `useKeyboardControls` hook — keydown listener on `window`, with focus guard. Reads/writes OrbitControls ref.
- `fitToContent` — computes AABB of all holes; if no holes, falls back to hall bounds. Calculates required zoom to fit with 2m padding, animates camera smoothly.
- Double-tap detection via touch event timing (< 300ms between taps), only on the floor/background plane (not on hole meshes).

**Help tooltip:** Small `?` button in bottom-left corner. Hover/tap shows keyboard shortcuts overlay.

## New Dependencies

- `suncalc` — sun position calculations (~3KB, zero deps, MIT license)

## Files

### Create
- `src/constants/location.ts` — geo constants
- `src/hooks/useSunPosition.ts` — suncalc wrapper hook
- `src/hooks/useKeyboardControls.ts` — keyboard shortcut handler
- `src/components/three/SunIndicator.tsx` — sun arrow + info label in R3F
- `src/components/ui/MiniMap.tsx` — corner map overlay
- `src/components/ui/LocationBar.tsx` — collapsible footer
- `src/components/ui/KeyboardHelp.tsx` — help tooltip button
- `src/components/ui/SunControls.tsx` — time preset buttons + custom date/time picker

### Modify
- `src/App.tsx` — add LocationBar, MiniMap to layout
- `src/components/three/CameraControls.tsx` — integrate keyboard/touch hooks
- `src/components/three/HallOpenings.tsx` — add sun-dependent window tints

## Non-Goals (This Iteration)

- Interactive map (MapLibre/Leaflet) — upgrade path exists if wanted later
- Shadow casting from walls — requires 3D view (Phase 2)
- Full sun path arc visualization — possible future enhancement
- Weather data integration — unnecessary for planning
- Compass rose — north is always up in top view
- Hall bearing rotation — the hall is axis-aligned in reality and in the scene
