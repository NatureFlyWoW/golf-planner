import { useEffect, useState } from "react";

const MOBILE_QUERY = "(min-width: 768px)";

/**
 * Reactive hook that returns true when viewport width is below 768px.
 * Unlike the static `isMobile` utility, this responds to window resize.
 */
export function useIsMobileViewport(): boolean {
	const [isMobileViewport, setIsMobileViewport] = useState(() => {
		if (typeof window === "undefined") return false;
		return !window.matchMedia(MOBILE_QUERY).matches;
	});

	useEffect(() => {
		const mql = window.matchMedia(MOBILE_QUERY);
		const handler = (e: MediaQueryListEvent) => setIsMobileViewport(!e.matches);
		mql.addEventListener("change", handler);
		return () => mql.removeEventListener("change", handler);
	}, []);

	return isMobileViewport;
}
