import type { BudgetCategory, BudgetConfig } from "../types";

export const DEFAULT_BUDGET_CONFIG: BudgetConfig = {
	costPerHole: 2700,
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
		notes: "Annual Betriebshaftpflicht — multiply by operating years for total",
	},
];
