import type { HoleType } from "./hole";

export type Tool = "select" | "place" | "move" | "delete";
export type ViewMode = "top" | "3d";
export type SidebarTab = "holes" | "detail" | "budget";
export type ActivePanel = "holes" | "detail" | "budget" | "sun" | null;
export type GpuTier = "low" | "mid" | "high";
export type GpuTierOverride = "auto" | "low" | "mid" | "high";

export type UIState = {
	tool: Tool;
	placingType: HoleType | null;
	placingTemplateId: string | null;
	view: ViewMode;
	sidebarTab: SidebarTab;
	snapEnabled: boolean;
	showFlowPath: boolean;
	activePanel: ActivePanel;
	sunDate: Date | undefined;
	uvMode: boolean;
	gpuTier: GpuTier;
	transitioning: boolean;
};
