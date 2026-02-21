/**
 * Tests for MeshReflectorMaterial gating logic and configuration.
 *
 * Tests the pure functions that determine:
 * 1. Whether the reflector should be enabled (boolean gating)
 * 2. What resolution the reflector should use (tier-dependent)
 * 3. Whether PerformanceMonitor degradation disables it
 */

import { describe, expect, it } from "vitest";
import {
	getReflectorResolution,
	shouldUseReflector,
} from "../src/components/three/HallFloor";

describe("MeshReflectorMaterial gating", () => {
	describe("shouldUseReflector", () => {
		it("returns true when uvMode=true, view='3d', gpuTier='mid'", () => {
			expect(
				shouldUseReflector({
					uvMode: true,
					view: "3d",
					gpuTier: "mid",
					perfCurrent: 1.0,
				}),
			).toBe(true);
		});

		it("returns true when uvMode=true, view='3d', gpuTier='high'", () => {
			expect(
				shouldUseReflector({
					uvMode: true,
					view: "3d",
					gpuTier: "high",
					perfCurrent: 1.0,
				}),
			).toBe(true);
		});

		it("returns false when view='top' (any tier)", () => {
			expect(
				shouldUseReflector({
					uvMode: true,
					view: "top",
					gpuTier: "high",
					perfCurrent: 1.0,
				}),
			).toBe(false);
		});

		it("returns false when uvMode=false (any view)", () => {
			expect(
				shouldUseReflector({
					uvMode: false,
					view: "3d",
					gpuTier: "high",
					perfCurrent: 1.0,
				}),
			).toBe(false);
		});

		it("returns false when gpuTier='low' (any state)", () => {
			expect(
				shouldUseReflector({
					uvMode: true,
					view: "3d",
					gpuTier: "low",
					perfCurrent: 1.0,
				}),
			).toBe(false);
		});
	});

	describe("getReflectorResolution", () => {
		it("returns 256 for mid tier", () => {
			expect(getReflectorResolution("mid")).toBe(256);
		});

		it("returns 512 for high tier", () => {
			expect(getReflectorResolution("high")).toBe(512);
		});

		it("returns 256 for low tier (safe default)", () => {
			expect(getReflectorResolution("low")).toBe(256);
		});
	});

	describe("PerformanceMonitor degradation", () => {
		it("returns false when performance.current < 0.5", () => {
			expect(
				shouldUseReflector({
					uvMode: true,
					view: "3d",
					gpuTier: "high",
					perfCurrent: 0.4,
				}),
			).toBe(false);
		});

		it("returns true when performance.current >= 0.5", () => {
			expect(
				shouldUseReflector({
					uvMode: true,
					view: "3d",
					gpuTier: "high",
					perfCurrent: 0.5,
				}),
			).toBe(true);
		});
	});
});
