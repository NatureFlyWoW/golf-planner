// src/components/ui/MiniMap.tsx
import { LOCATION } from "../../constants/location";

/** Convert lat/lng to OSM tile coordinates at a given zoom level */
function latLngToTile(lat: number, lng: number, zoom: number) {
	const n = 2 ** zoom;
	const tileX = ((lng + 180) / 360) * n;
	const latRad = (lat * Math.PI) / 180;
	const tileY =
		((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
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
		<div
			className="absolute right-2 bottom-2 z-10 overflow-hidden rounded-lg shadow-lg"
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
				OpenStreetMap
			</div>
		</div>
	);
}
