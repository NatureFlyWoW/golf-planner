import { Component, type ReactNode, Suspense } from "react";
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
}: HoleModelProps) {
	const gpuTier = useStore((s) => s.ui.gpuTier);

	if (templateId) {
		return <TemplateHoleModel templateId={templateId} />;
	}

	if (gpuTier !== "low") {
		const flatFallback = (
			<HoleSwitch type={type} width={width} length={length} color={color} />
		);
		return (
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
		);
	}

	return (
		<HoleSwitch type={type} width={width} length={length} color={color} />
	);
}
