import { create } from "zustand";

type MouseStatusState = {
	mouseWorldPos: { x: number; z: number } | null;
	currentZoom: number;
	setMouseWorldPos: (pos: { x: number; z: number } | null) => void;
	setCurrentZoom: (zoom: number) => void;
};

export const useMouseStatusStore = create<MouseStatusState>((set) => ({
	mouseWorldPos: null,
	currentZoom: 40,
	setMouseWorldPos: (pos) => set({ mouseWorldPos: pos }),
	setCurrentZoom: (zoom) => set({ currentZoom: zoom }),
}));
