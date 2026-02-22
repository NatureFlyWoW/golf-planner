import { Component, type ReactNode, Suspense, useRef } from "react";
import type { Group } from "three";
import { useGroupOpacity } from "../../../hooks/useGroupOpacity";
import { useStore } from "../../../store";
import { HoleDogleg } from "./HoleDogleg";
import { HoleLoop } from "./HoleLoop";
import { HoleLShape } from "./HoleLShape";
import { HoleRamp } from "./HoleRamp";
import { HoleStraight } from "./HoleStraight";
import { HoleTunnel } from "./HoleTunnel";
import { HoleWindmill } from "./HoleWindmill";
import { SURFACE_THICKNESS } from "./shared";
import { TemplateHoleModel } from "./TemplateHoleModel";
import { TexturedMaterialsProvider } from "./useTexturedMaterials";

export type HoleModelProps = {
	type: string;
	width: number;
	length: number;
	color: string;
	templateId?: string;
	layerOpacity?: number;
};

type HoleSwitchProps = {
	type: string;
	width: number;
	length: number;
	color: string;
};

/** Renders hole models using whatever materials useMaterials() provides */
function HoleSwitch({ type, width, length, color }: HoleSwitchProps) {
	switch (type) {
		case "straight":
			return <HoleStraight width={width} length={length} />;
		case "l-shape":
			return <HoleLShape width={width} length={length} />;
		case "dogleg":
			return <HoleDogleg width={width} length={length} />;
		case "ramp":
			return <HoleRamp width={width} length={length} color={color} />;
		case "loop":
			return <HoleLoop width={width} length={length} color={color} />;
		case "windmill":
			return <HoleWindmill width={width} length={length} color={color} />;
		case "tunnel":
			return <HoleTunnel width={width} length={length} color={color} />;
		default:
			return (
				<mesh position={[0, SURFACE_THICKNESS / 2, 0]}>
					<boxGeometry args={[width, SURFACE_THICKNESS, length]} />
					<meshStandardMaterial color={color} />
				</mesh>
			);
	}
}

/**
 * Wraps HoleSwitch in TexturedMaterialsProvider so all hole types
 * automatically receive PBR texture maps via useMaterials() context.
 */
function TexturedHoleSwitch({ type, width, length, color }: HoleSwitchProps) {
	return (
		<TexturedMaterialsProvider>
			<HoleSwitch type={type} width={width} length={length} color={color} />
		</TexturedMaterialsProvider>
	);
}

/** Error boundary for texture loading failures */
class TextureErrorBoundary extends Component<
	{ fallback: ReactNode; children: ReactNode },
	{ hasError: boolean }
> {
	state = { hasError: false };

	static getDerivedStateFromError() {
		return { hasError: true };
	}

	render() {
		if (this.state.hasError) {
			return this.props.fallback;
		}
		return this.props.children;
	}
}

/** Dispatches to per-type 3D model with GPU tier texture gating. */
export function HoleModel({
	type,
	width,
	length,
	color,
	templateId,
	layerOpacity = 1,
}: HoleModelProps) {
	const gpuTier = useStore((s) => s.ui.gpuTier);
	const groupRef = useRef<Group>(null);
	useGroupOpacity(groupRef, layerOpacity);

	if (templateId) {
		return (
			<group ref={groupRef}>
				<TemplateHoleModel templateId={templateId} />
			</group>
		);
	}

	if (gpuTier !== "low") {
		const flatFallback = (
			<HoleSwitch type={type} width={width} length={length} color={color} />
		);
		return (
			<group ref={groupRef}>
				<TextureErrorBoundary fallback={flatFallback}>
					<Suspense fallback={flatFallback}>
						<TexturedHoleSwitch
							type={type}
							width={width}
							length={length}
							color={color}
						/>
					</Suspense>
				</TextureErrorBoundary>
			</group>
		);
	}

	return (
		<group ref={groupRef}>
			<HoleSwitch type={type} width={width} length={length} color={color} />
		</group>
	);
}
