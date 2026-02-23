import type { RefObject } from "react";
import type { Mesh } from "three";
import type { HoleType } from "./hole";
import type { LayerId, LayerState, ViewportLayout } from "./viewport";

export type Tool = "select" | "place" | "move" | "delete";
export type ViewMode = "top" | "3d";
export type SidebarTab = "holes" | "detail" | "budget" | "layers";
export type ActivePanel =
	| "holes"
	| "detail"
	| "budget"
	| "sun"
	| "layers"
	| null;
export type GpuTier = "low" | "mid" | "high";
export type GpuTierOverride = "auto" | "low" | "mid" | "high";

export type UIState = {
	tool: Tool;
	placingType: HoleType | null;
	placingTemplateId: string | null;
	view: ViewMode;
	sidebarTab: SidebarTab;
	snapEnabled: boolean;
	activePanel: ActivePanel;
	sunDate: Date | undefined;
	uvMode: boolean;
	gpuTier: GpuTier;
	transitioning: boolean;
	godRaysLampRef: RefObject<Mesh | null> | null;
	viewportLayout: ViewportLayout;
	activeViewport: "2d" | "3d" | null;
	splitRatio: number; // 0.0-1.0, only used in "dual" mode
	layers: Record<LayerId, LayerState>;
	walkthroughMode: boolean;
	previousViewportLayout: ViewportLayout | null;
};
