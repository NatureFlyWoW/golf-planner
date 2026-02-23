import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { WebGLRenderTarget } from "three";
import { useStore } from "../../store";

/**
 * Captures screenshots from the 3D viewport by rendering to an offscreen
 * WebGLRenderTarget. This works correctly regardless of viewport layout
 * (dual-pane, single-pane) because it renders independently of View scissor.
 */
export function ScreenshotCapture() {
	const { gl, scene, camera, size } = useThree();
	const register = useStore((s) => s.registerScreenshotCapture);

	useEffect(() => {
		register(() => {
			// Create a render target matching the current canvas resolution
			const dpr = Math.min(window.devicePixelRatio * 2, 4);
			const width = Math.floor(size.width * dpr);
			const height = Math.floor(size.height * dpr);
			const renderTarget = new WebGLRenderTarget(width, height);

			// Save current state
			const currentRenderTarget = gl.getRenderTarget();
			const currentPixelRatio = gl.getPixelRatio();

			// Render to offscreen target
			gl.setRenderTarget(renderTarget);
			gl.setPixelRatio(1); // Target already has DPR baked into dimensions
			gl.render(scene, camera);

			// Read pixels and create image
			const buffer = new Uint8Array(width * height * 4);
			gl.readRenderTargetPixels(renderTarget, 0, 0, width, height, buffer);

			// Restore state
			gl.setRenderTarget(currentRenderTarget);
			gl.setPixelRatio(currentPixelRatio);

			// Convert to canvas for download (WebGL pixels are bottom-up)
			const canvas = document.createElement("canvas");
			canvas.width = width;
			canvas.height = height;
			const ctx = canvas.getContext("2d");
			if (!ctx) {
				console.warn("ScreenshotCapture: failed to get 2d canvas context");
				renderTarget.dispose();
				return;
			}

			const imageData = ctx.createImageData(width, height);
			// Flip vertically (WebGL reads bottom-to-top)
			for (let y = 0; y < height; y++) {
				const srcRow = (height - y - 1) * width * 4;
				const dstRow = y * width * 4;
				imageData.data.set(buffer.subarray(srcRow, srcRow + width * 4), dstRow);
			}
			ctx.putImageData(imageData, 0, 0);

			canvas.toBlob((blob) => {
				if (blob) {
					const url = URL.createObjectURL(blob);
					const a = document.createElement("a");
					a.href = url;
					a.download = `golf-plan-${Date.now()}.png`;
					a.click();
					URL.revokeObjectURL(url);
				}
			}, "image/png");

			// Clean up render target
			renderTarget.dispose();
		});
	}, [gl, scene, camera, size, register]);

	return null;
}
