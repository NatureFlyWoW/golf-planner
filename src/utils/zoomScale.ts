const STANDARD_SCALES = [10, 20, 25, 50, 100, 200];

/**
 * Converts orthographic camera zoom to the nearest standard architectural scale string.
 * Tuned so zoom=40 yields ~1:50.
 */
export function computeScale(cameraZoom: number): string {
	// Tuned so zoom=40 yields denominator=50 (i.e. 1:50)
	const scaleDenominator = 1 / (cameraZoom * 0.0005);

	// Find nearest standard scale
	let bestScale = STANDARD_SCALES[0];
	let bestDist = Math.abs(scaleDenominator - bestScale);
	for (const s of STANDARD_SCALES) {
		const dist = Math.abs(scaleDenominator - s);
		if (dist < bestDist) {
			bestDist = dist;
			bestScale = s;
		}
	}

	return `1:${bestScale}`;
}
