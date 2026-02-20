import type { MaterialProfile } from "../../../types/budget";

export type PBRProps = {
	color: string;
	roughness: number;
	metalness: number;
};

export const BUMPER_PBR: Record<MaterialProfile, PBRProps> = {
	budget_diy: { color: "#C8B99A", roughness: 0.65, metalness: 0.0 },
	standard_diy: { color: "#F5F5F5", roughness: 0.3, metalness: 0.1 },
	semi_pro: { color: "#A0A8A0", roughness: 0.25, metalness: 0.75 },
};

export const FELT_PBR: Record<MaterialProfile, PBRProps> = {
	budget_diy: { color: "#3D8B37", roughness: 0.5, metalness: 0.0 },
	standard_diy: { color: "#2E7D32", roughness: 0.95, metalness: 0.0 },
	semi_pro: { color: "#1B5E20", roughness: 0.95, metalness: 0.0 },
};

export const UV_EMISSIVE_INTENSITY = 0.8;
