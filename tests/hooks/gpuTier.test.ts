import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	GPU_TIER_CACHE_KEY,
	mapDetectGpuToAppTier,
	needsAlwaysFrameloop,
	readCachedTier,
	resolveGpuTier,
	writeCachedTier,
} from "../../src/hooks/useGpuTier";

// ---------------------------------------------------------------------------
// Mock localStorage (jsdom environment has worker timeout issues in WSL2)
// ---------------------------------------------------------------------------
const store: Record<string, string> = {};
const mockLocalStorage = {
	getItem: (key: string) => store[key] ?? null,
	setItem: (key: string, value: string) => {
		store[key] = value;
	},
	removeItem: (key: string) => {
		delete store[key];
	},
	clear: () => {
		for (const key of Object.keys(store)) delete store[key];
	},
	get length() {
		return Object.keys(store).length;
	},
	key: (_index: number) => null,
};
vi.stubGlobal("localStorage", mockLocalStorage);

// ---------------------------------------------------------------------------
// Tier Mapping
// ---------------------------------------------------------------------------

describe("mapDetectGpuToAppTier", () => {
	it("maps tier 0 to 'low'", () => {
		expect(mapDetectGpuToAppTier(0)).toBe("low");
	});

	it("maps tier 1 to 'low'", () => {
		expect(mapDetectGpuToAppTier(1)).toBe("low");
	});

	it("maps tier 2 to 'mid'", () => {
		expect(mapDetectGpuToAppTier(2)).toBe("mid");
	});

	it("maps tier 3 to 'high'", () => {
		expect(mapDetectGpuToAppTier(3)).toBe("high");
	});

	it("handles undefined input by returning 'low'", () => {
		expect(mapDetectGpuToAppTier(undefined as unknown as number)).toBe("low");
	});

	it("handles null input by returning 'low'", () => {
		expect(mapDetectGpuToAppTier(null as unknown as number)).toBe("low");
	});
});

// ---------------------------------------------------------------------------
// Override Logic
// ---------------------------------------------------------------------------

describe("resolveGpuTier (override logic)", () => {
	it("returns detected tier when override is 'auto'", () => {
		expect(resolveGpuTier("auto", "high")).toBe("high");
	});

	it("override 'low' overrides detected 'high'", () => {
		expect(resolveGpuTier("low", "high")).toBe("low");
	});

	it("override 'high' overrides detected 'low'", () => {
		expect(resolveGpuTier("high", "low")).toBe("high");
	});
});

// ---------------------------------------------------------------------------
// LocalStorage Caching
// ---------------------------------------------------------------------------

describe("GPU tier localStorage caching", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	afterEach(() => {
		localStorage.clear();
	});

	it("writes tier after first detection", () => {
		writeCachedTier("mid");
		expect(localStorage.getItem(GPU_TIER_CACHE_KEY)).toBe("mid");
	});

	it("reads cached tier on subsequent loads", () => {
		localStorage.setItem(GPU_TIER_CACHE_KEY, "high");
		expect(readCachedTier()).toBe("high");
	});

	it("returns null when no cached tier exists", () => {
		expect(readCachedTier()).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// Frameloop Derivation
// ---------------------------------------------------------------------------

describe("needsAlwaysFrameloop", () => {
	it("returns false when uvMode=false", () => {
		expect(needsAlwaysFrameloop(false, "high", false)).toBe(false);
	});

	it("returns false when uvMode=true + gpuTier='low'", () => {
		expect(needsAlwaysFrameloop(true, "low", false)).toBe(false);
	});

	it("returns true when uvMode=true + gpuTier='mid'", () => {
		expect(needsAlwaysFrameloop(true, "mid", false)).toBe(true);
	});

	it("returns true when uvMode=true + gpuTier='high'", () => {
		expect(needsAlwaysFrameloop(true, "high", false)).toBe(true);
	});

	it("returns true when transitioning=true regardless of tier", () => {
		expect(needsAlwaysFrameloop(false, "low", true)).toBe(true);
	});
});
