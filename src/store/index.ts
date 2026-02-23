export type { Store } from "./store";
export { useStore } from "./store";

// Expose store for E2E testing (dev mode only, browser context)
if (import.meta.env.DEV && typeof window !== "undefined") {
	import("./store").then(({ useStore: store }) => {
		(window as unknown as Record<string, unknown>).__STORE__ = store;
	});
}
