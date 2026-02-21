import { HOLE_TYPE_MAP } from "../constants/holeTypes";
import type { Hole, HoleTemplate } from "../types";
import { computeTemplateBounds } from "./chainCompute";

const PX_PER_M = 50;
const MARGIN = 40;
const HOLE_COLORS: Record<string, string> = {
	straight: "#4CAF50",
	"l-shape": "#2196F3",
	dogleg: "#FF9800",
	ramp: "#9C27B0",
	loop: "#00BCD4",
	windmill: "#E91E63",
	tunnel: "#607D8B",
};

export function generateFloorPlanSVG(
	hall: { width: number; length: number },
	holes: Record<string, Hole>,
	holeOrder: string[],
	templates: Record<string, HoleTemplate> = {},
): string {
	const hallW = hall.width * PX_PER_M;
	const hallH = hall.length * PX_PER_M;
	const svgW = hallW + MARGIN * 2;
	const svgH = hallH + MARGIN * 2 + 30; // extra for scale bar

	const lines: string[] = [];

	lines.push(
		`<svg xmlns="http://www.w3.org/2000/svg" width="${hallW}" height="${hallH}" viewBox="0 0 ${svgW} ${svgH}">`,
	);
	lines.push(
		`<style>text{font-family:Arial,sans-serif}rect,line,polyline{shape-rendering:crispEdges}</style>`,
	);

	// Background
	lines.push(`<rect width="${svgW}" height="${svgH}" fill="#f8f8f8"/>`);

	// Hall boundary
	lines.push(
		`<rect x="${MARGIN}" y="${MARGIN}" width="${hallW}" height="${hallH}" fill="#e0e0e0" stroke="#333" stroke-width="2"/>`,
	);

	// Dimension labels
	lines.push(
		`<text x="${MARGIN + hallW / 2}" y="${MARGIN - 10}" text-anchor="middle" font-size="12" fill="#333">${hall.width.toFixed(1)}m</text>`,
	);
	lines.push(
		`<text x="${MARGIN - 10}" y="${MARGIN + hallH / 2}" text-anchor="middle" font-size="12" fill="#333" transform="rotate(-90,${MARGIN - 10},${MARGIN + hallH / 2})">${hall.length.toFixed(1)}m</text>`,
	);

	// Ordered holes
	const orderedHoles = holeOrder.map((id) => holes[id]).filter(Boolean);

	// Flow path (dashed polyline)
	if (orderedHoles.length >= 2) {
		const points = orderedHoles
			.map((h) => {
				const cx = MARGIN + h.position.x * PX_PER_M;
				const cy = MARGIN + h.position.z * PX_PER_M;
				return `${cx},${cy}`;
			})
			.join(" ");
		lines.push(
			`<polyline points="${points}" fill="none" stroke="#999" stroke-width="1" stroke-dasharray="6,4"/>`,
		);
	}

	// Hole rectangles
	for (let i = 0; i < orderedHoles.length; i++) {
		const hole = orderedHoles[i];

		const cx = MARGIN + hole.position.x * PX_PER_M;
		const cy = MARGIN + hole.position.z * PX_PER_M;

		let w: number;
		let h: number;
		let color: string;
		let label: string;
		let dimLabel: string;

		if (hole.templateId) {
			const tmpl = templates[hole.templateId];
			if (!tmpl) continue;
			const bounds = computeTemplateBounds(tmpl);
			w = bounds.width * PX_PER_M;
			h = bounds.length * PX_PER_M;
			color = tmpl.color;
			label = tmpl.name;
			dimLabel = `${bounds.width.toFixed(1)}×${bounds.length.toFixed(1)}m`;
		} else {
			const def = HOLE_TYPE_MAP[hole.type];
			if (!def) continue;
			w = def.dimensions.width * PX_PER_M;
			h = def.dimensions.length * PX_PER_M;
			color = HOLE_COLORS[hole.type] ?? "#888";
			label = def.label;
			dimLabel = `${def.dimensions.width}×${def.dimensions.length}m`;
		}

		lines.push(
			`<g transform="translate(${cx},${cy}) rotate(${hole.rotation})">`,
		);
		lines.push(
			`<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="${color}" fill-opacity="0.3" stroke="${color}" stroke-width="1.5" rx="2"/>`,
		);
		lines.push(
			`<text x="0" y="-4" text-anchor="middle" font-size="10" font-weight="bold" fill="#333">#${i + 1}</text>`,
		);
		lines.push(
			`<text x="0" y="8" text-anchor="middle" font-size="8" fill="#555">${label}</text>`,
		);
		lines.push(
			`<text x="0" y="${h / 2 - 4}" text-anchor="middle" font-size="7" fill="#777">${dimLabel}</text>`,
		);
		lines.push(`</g>`);
	}

	// Scale bar
	const scaleY = MARGIN + hallH + 20;
	const scaleBarPx = PX_PER_M;
	lines.push(
		`<line x1="${MARGIN}" y1="${scaleY}" x2="${MARGIN + scaleBarPx}" y2="${scaleY}" stroke="#333" stroke-width="2"/>`,
	);
	lines.push(
		`<line x1="${MARGIN}" y1="${scaleY - 4}" x2="${MARGIN}" y2="${scaleY + 4}" stroke="#333" stroke-width="2"/>`,
	);
	lines.push(
		`<line x1="${MARGIN + scaleBarPx}" y1="${scaleY - 4}" x2="${MARGIN + scaleBarPx}" y2="${scaleY + 4}" stroke="#333" stroke-width="2"/>`,
	);
	lines.push(
		`<text x="${MARGIN + scaleBarPx / 2}" y="${scaleY + 14}" text-anchor="middle" font-size="10" fill="#333">1m</text>`,
	);

	lines.push(`</svg>`);
	return lines.join("\n");
}

export function downloadSVG(svgContent: string): void {
	const blob = new Blob([svgContent], { type: "image/svg+xml" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `floor-plan-${new Date().toISOString().split("T")[0]}.svg`;
	a.click();
	URL.revokeObjectURL(url);
}
