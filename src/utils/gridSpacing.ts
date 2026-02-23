export type GridSpacing = {
	majorSpacing: number;
	minorSpacing: number | null;
};

export type GridLabel = {
	value: number;
	position: [number, number, number];
};

/**
 * Determines grid line spacing based on camera zoom level.
 * Returns major and minor spacing in meters.
 */
export function computeGridSpacing(zoom: number): GridSpacing {
	if (zoom < 10) {
		return { majorSpacing: 5, minorSpacing: null };
	}
	if (zoom <= 30) {
		return { majorSpacing: 1, minorSpacing: 0.5 };
	}
	return { majorSpacing: 1, minorSpacing: 0.25 };
}

/**
 * Generates label positions along an axis edge.
 * X-axis labels are placed along the top edge (Z = -0.5).
 * Z-axis labels are placed along the left edge (X = -0.5).
 */
export function computeGridLabelPositions(
	axis: "x" | "z",
	maxValue: number,
	spacing: number,
): GridLabel[] {
	if (spacing <= 0) return [];
	const labels: GridLabel[] = [];
	for (let v = 0; v <= maxValue + spacing * 0.01; v += spacing) {
		const value = Math.round(v * 1000) / 1000;
		if (value > maxValue) break;
		const position: [number, number, number] =
			axis === "x" ? [value, 0.01, -0.5] : [-0.5, 0.01, value];
		labels.push({ value, position });
	}
	return labels;
}

/**
 * Generates grid line segment points for batched rendering.
 * Each consecutive pair of points forms one line segment.
 */
export function computeGridLineSegments(
	hallWidth: number,
	hallLength: number,
	spacing: number,
): Array<[number, number, number]> {
	if (spacing <= 0) return [];
	const points: Array<[number, number, number]> = [];
	// Vertical lines (constant X)
	for (let x = 0; x <= hallWidth + spacing * 0.01; x += spacing) {
		const xr = Math.round(x * 1000) / 1000;
		if (xr > hallWidth) break;
		points.push([xr, 0.01, 0], [xr, 0.01, hallLength]);
	}
	// Horizontal lines (constant Z)
	for (let z = 0; z <= hallLength + spacing * 0.01; z += spacing) {
		const zr = Math.round(z * 1000) / 1000;
		if (zr > hallLength) break;
		points.push([0, 0.01, zr], [hallWidth, 0.01, zr]);
	}
	return points;
}
