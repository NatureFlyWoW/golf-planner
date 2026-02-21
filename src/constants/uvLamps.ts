/** UV lamp ceiling positions: [x, y, z] in hall coordinates.
 * Hall is 10m wide (x) × 20m long (z), 4.3m wall height (y).
 * Lamps at quarter-width (2.5, 7.5) and quarter-length (5, 15). */
export const UV_LAMP_POSITIONS: [number, number, number][] = [
	[2.5, 4.3, 5],
	[7.5, 4.3, 5],
	[2.5, 4.3, 15],
	[7.5, 4.3, 15],
];

export const UV_LAMP_COLOR = "#8800FF";
export const UV_LAMP_INTENSITY = 0.8;
export const UV_LAMP_WIDTH = 0.3;
export const UV_LAMP_HEIGHT = 2;
