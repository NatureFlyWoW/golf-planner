import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { useStore } from "../../store";

export function ScreenshotCapture() {
	const { gl, scene, camera } = useThree();
	const register = useStore((s) => s.registerScreenshotCapture);

	useEffect(() => {
		register(() => {
			const dpr = gl.getPixelRatio();
			gl.setPixelRatio(Math.min(window.devicePixelRatio * 2, 4));
			gl.render(scene, camera);
			gl.domElement.toBlob(
				(blob) => {
					if (blob) {
						const url = URL.createObjectURL(blob);
						const a = document.createElement("a");
						a.href = url;
						a.download = `golf-plan-${Date.now()}.png`;
						a.click();
						URL.revokeObjectURL(url);
					} else {
						// iOS fallback
						const dataUrl = gl.domElement.toDataURL("image/png");
						const a = document.createElement("a");
						a.href = dataUrl;
						a.download = `golf-plan-${Date.now()}.png`;
						a.click();
					}
					gl.setPixelRatio(dpr);
				},
				"image/png",
			);
		});
	}, [gl, scene, camera, register]);

	return null;
}
