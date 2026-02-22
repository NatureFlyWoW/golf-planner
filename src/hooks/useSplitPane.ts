import { useCallback, useEffect, useState } from "react";
import type { ViewportLayout } from "../types";
import { useStore } from "../store";

/** Compute split ratio from mouse clientX and container rect. Clamps to [0.2, 0.8]. */
export function computeSplitRatio(
	clientX: number,
	rect: { left: number; width: number },
): number {
	if (rect.width <= 0) return 0.5;
	const raw = (clientX - rect.left) / rect.width;
	return Math.min(0.8, Math.max(0.2, raw));
}

/** Determine what action a double-click on the divider should perform. */
export function getDoubleClickAction(
	viewportLayout: ViewportLayout,
	activeViewport: "2d" | "3d" | null,
): "collapse-2d" | "collapse-3d" | "expand" {
	if (viewportLayout === "dual") {
		return activeViewport === "3d" ? "collapse-3d" : "collapse-2d";
	}
	return "expand";
}

export function useSplitPane(
	containerRef: React.RefObject<HTMLDivElement | null>,
) {
	const [isDragging, setIsDragging] = useState(false);
	const setSplitRatio = useStore((s) => s.setSplitRatio);
	const collapseTo = useStore((s) => s.collapseTo);
	const expandDual = useStore((s) => s.expandDual);

	const handleMouseMove = useCallback(
		(e: MouseEvent) => {
			const rect = containerRef.current?.getBoundingClientRect();
			if (!rect || rect.width <= 0) return;
			const ratio = computeSplitRatio(e.clientX, rect);
			setSplitRatio(ratio);
		},
		[containerRef, setSplitRatio],
	);

	const handleTouchMove = useCallback(
		(e: TouchEvent) => {
			const rect = containerRef.current?.getBoundingClientRect();
			if (!rect || rect.width <= 0 || !e.touches[0]) return;
			const ratio = computeSplitRatio(e.touches[0].clientX, rect);
			setSplitRatio(ratio);
		},
		[containerRef, setSplitRatio],
	);

	const handleEnd = useCallback(() => {
		setIsDragging(false);
		document.body.style.cursor = "";
		document.body.style.userSelect = "";
	}, []);

	useEffect(() => {
		if (!isDragging) return;
		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("mouseup", handleEnd);
		document.addEventListener("touchmove", handleTouchMove);
		document.addEventListener("touchend", handleEnd);
		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleEnd);
			document.removeEventListener("touchmove", handleTouchMove);
			document.removeEventListener("touchend", handleEnd);
		};
	}, [isDragging, handleMouseMove, handleTouchMove, handleEnd]);

	const onDividerMouseDown = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		setIsDragging(true);
		document.body.style.cursor = "col-resize";
		document.body.style.userSelect = "none";
	}, []);

	const onDividerTouchStart = useCallback((e: React.TouchEvent) => {
		e.preventDefault();
		setIsDragging(true);
	}, []);

	const onDividerDoubleClick = useCallback(() => {
		const layout = useStore.getState().ui.viewportLayout;
		const active = useStore.getState().ui.activeViewport;
		const action = getDoubleClickAction(layout, active);
		if (action === "expand") {
			expandDual();
		} else {
			collapseTo(action === "collapse-3d" ? "3d" : "2d");
		}
	}, [collapseTo, expandDual]);

	return {
		isDragging,
		onDividerMouseDown,
		onDividerTouchStart,
		onDividerDoubleClick,
	};
}
