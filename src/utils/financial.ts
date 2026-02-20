import type {
	ConfidenceTier,
	RiskTolerance,
	VatProfile,
} from "../types/budget";

export function roundEur(n: number): number {
	return Math.round(n * 100) / 100;
}

export function netToGross(net: number, profile: VatProfile): number {
	return profile === "standard_20" ? roundEur(net * 1.2) : net;
}

export function grossToNet(gross: number, profile: VatProfile): number {
	return profile === "standard_20" ? roundEur(gross / 1.2) : gross;
}

export function effectiveCost(
	net: number,
	profile: VatProfile,
	vatRegistered: boolean,
): number {
	return vatRegistered ? net : netToGross(net, profile);
}

export function reclaimableVat(
	net: number,
	profile: VatProfile,
	vatRegistered: boolean,
): number {
	if (!vatRegistered || profile === "exempt") return 0;
	return roundEur(net * 0.2);
}

export function formatEur(n: number): string {
	return n.toLocaleString("de-AT", {
		style: "currency",
		currency: "EUR",
		maximumFractionDigits: 0,
	});
}

/** Risk multiplier per confidence tier at the given tolerance level */
const RISK_MULTIPLIERS: Record<ConfidenceTier, number> = {
	fixed: 1.02,
	low: 1.1,
	medium: 1.15,
	high: 1.25,
	very_high: 1.4,
};

const TOLERANCE_SCALE: Record<RiskTolerance, number> = {
	optimistic: 0.6,
	balanced: 1.0,
	conservative: 1.6,
};

export function riskBuffer(
	estimatedNet: number,
	tier: ConfidenceTier,
	tolerance: RiskTolerance,
): number {
	const base = estimatedNet * (RISK_MULTIPLIERS[tier] - 1.0);
	return roundEur(base * TOLERANCE_SCALE[tolerance]);
}

/** Auto-generate min/mode/max from mode and confidence tier */
const TIER_SPREAD: Record<
	ConfidenceTier,
	{ minMult: number; maxMult: number }
> = {
	fixed: { minMult: 0.98, maxMult: 1.02 },
	low: { minMult: 0.9, maxMult: 1.15 },
	medium: { minMult: 0.8, maxMult: 1.3 },
	high: { minMult: 0.6, maxMult: 1.6 },
	very_high: { minMult: 0.5, maxMult: 2.0 },
};

export function uncertaintyFromTier(
	mode: number,
	tier: ConfidenceTier,
): { min: number; mode: number; max: number } {
	const spread = TIER_SPREAD[tier];
	return {
		min: roundEur(mode * spread.minMult),
		mode,
		max: roundEur(mode * spread.maxMult),
	};
}
