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
							{sunData.azimuthDeg}° · {sunData.altitudeDeg}° alt
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
							<span
								className={sunData.isDay ? "text-amber-400" : "text-gray-500"}
							>
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
