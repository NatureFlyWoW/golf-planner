import { useState } from "react";
import { LOCATION } from "../../constants/location";
import type { SunData } from "../../hooks/useSunPosition";
import { useStore } from "../../store";
import { useMouseStatusStore } from "../../stores/mouseStatusStore";
import { computeScale } from "../../utils/zoomScale";

type StatusBarProps = {
	sunData?: SunData;
};

export function StatusBar({ sunData }: StatusBarProps) {
	const [expanded, setExpanded] = useState(false);
	const mouseWorldPos = useMouseStatusStore((s) => s.mouseWorldPos);
	const currentZoom = useMouseStatusStore((s) => s.currentZoom);
	const viewportLayout = useStore((s) => s.ui.viewportLayout);

	const has2D = viewportLayout !== "3d-only";
	const scale = has2D ? computeScale(currentZoom) : "--";
	const xDisplay = has2D && mouseWorldPos ? mouseWorldPos.x.toFixed(2) : "--";
	const zDisplay = has2D && mouseWorldPos ? mouseWorldPos.z.toFixed(2) : "--";

	return (
		<div className="hidden border-t border-subtle bg-surface text-text-secondary md:block">
			<button
				type="button"
				onClick={() => setExpanded(!expanded)}
				className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-plasma transition-colors"
			>
				<span className="font-medium text-primary">{LOCATION.address}</span>
				<span className="text-text-secondary">·</span>
				<span>{LOCATION.elevation}m</span>
				<span className="text-text-secondary">·</span>
				<span>
					{LOCATION.lat.toFixed(4)}°N {LOCATION.lng.toFixed(4)}°E
				</span>
				{sunData?.isDay && (
					<>
						<span className="text-text-secondary">·</span>
						<span className="text-amber-400">
							{sunData.azimuthDeg}° · {sunData.altitudeDeg}° alt
						</span>
					</>
				)}

				{/* Right-aligned status section */}
				<span className="ml-auto flex items-center gap-3 font-mono text-xs text-text-secondary">
					<span>
						X: {xDisplay}
						{xDisplay !== "--" && "m"}
					</span>
					<span>
						Z: {zDisplay}
						{zDisplay !== "--" && "m"}
					</span>
					<span>Scale: {scale}</span>
				</span>

				<span className="text-text-secondary">{expanded ? "▾" : "▸"}</span>
			</button>
			{expanded && (
				<div className="grid grid-cols-2 gap-x-4 gap-y-1 border-t border-subtle px-3 py-2 text-xs md:grid-cols-4">
					<div>
						<span className="text-text-secondary">Address: </span>
						<span className="text-primary">{LOCATION.address}</span>
					</div>
					<div>
						<span className="text-text-secondary">Region: </span>
						<span>{LOCATION.region}</span>
					</div>
					<div>
						<span className="text-text-secondary">Coordinates: </span>
						<span>
							{LOCATION.lat}°N, {LOCATION.lng}°E
						</span>
					</div>
					<div>
						<span className="text-text-secondary">Elevation: </span>
						<span>{LOCATION.elevation}m above sea level</span>
					</div>
					{sunData && (
						<div>
							<span className="text-text-secondary">Sun: </span>
							<span
								className={
									sunData.isDay ? "text-amber-400" : "text-text-secondary"
								}
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
							className="text-accent-text hover:underline"
						>
							Open in Maps
						</a>
						<a
							href={LOCATION.googleMapsUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="text-accent-text hover:underline"
						>
							Satellite View
						</a>
					</div>
				</div>
			)}
		</div>
	);
}
