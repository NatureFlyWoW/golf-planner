import type { BudgetCategory, BudgetConfig } from "../types";

export const COURSE_CATEGORY_ID = "course";
export const DEFAULT_HOLE_COST = 2700;

export const DEFAULT_COST_PER_TYPE: Record<string, number> = {
	straight: 2000,
	"l-shape": 2500,
	dogleg: 2800,
	ramp: 3000,
	loop: 3200,
	windmill: 3500,
	tunnel: 2800,
};

export const DEFAULT_BUDGET_CONFIG: BudgetConfig = {
	costPerType: { ...DEFAULT_COST_PER_TYPE },
};

export const BUDGET_HINTS: Record<string, string> = {
	"uv-lighting":
		"Industry mid-range: \u20ac5,500\u2013\u20ac9,000 for 12\u201318 holes",
	electrical:
		"Industry mid-range: \u20ac10,000\u2013\u20ac15,000 for 12\u201318 holes",
	equipment:
		"Industry mid-range: \u20ac10,000\u2013\u20ac15,000 for indoor mini golf",
};

export const DEFAULT_BUDGET_CATEGORIES: BudgetCategory[] = [
	{
		id: "hall",
		name: "BORGA Hall",
		estimated: 108000,
		actual: 0,
		notes: "",
	},
	{
		id: "course",
		name: "Mini golf course",
		estimated: 37800,
		actual: 0,
		notes: "",
	},
	{
		id: "uv-lighting",
		name: "UV lighting system",
		estimated: 5500,
		actual: 0,
		notes: "",
	},
	{
		id: "emergency-lighting",
		name: "Emergency lighting",
		estimated: 2000,
		actual: 0,
		notes: "",
	},
	{
		id: "heat-pumps",
		name: "Heat pumps (heating/cooling)",
		estimated: 10000,
		actual: 0,
		notes: "",
	},
	{
		id: "ventilation",
		name: "Ventilation with heat recovery",
		estimated: 4500,
		actual: 0,
		notes: "",
	},
	{
		id: "electrical",
		name: "Electrical installation",
		estimated: 12500,
		actual: 0,
		notes: "",
	},
	{
		id: "plumbing",
		name: "Plumbing & WC facilities",
		estimated: 15000,
		actual: 0,
		notes: "",
	},
	{
		id: "wall-art",
		name: "UV graffiti / wall art",
		estimated: 15000,
		actual: 0,
		notes: "",
	},
	{
		id: "finishing",
		name: "Interior finishing & flooring",
		estimated: 10000,
		actual: 0,
		notes: "",
	},
	{
		id: "equipment",
		name: "Sound, POS, furniture",
		estimated: 10000,
		actual: 0,
		notes: "",
	},
	{
		id: "fire-safety",
		name: "Fire safety & emergency systems",
		estimated: 3500,
		actual: 0,
		notes: "",
	},
	{
		id: "permits",
		name: "Permits, architect, fees",
		estimated: 9500,
		actual: 0,
		notes: "",
	},
	{
		id: "insurance",
		name: "Insurance (annual)",
		estimated: 2200,
		actual: 0,
		notes:
			"Annual Betriebshaftpflicht \u2014 multiply by operating years for total",
	},
];
