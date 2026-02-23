import { useTexture } from "@react-three/drei";
import { Suspense, useEffect, useMemo } from "react";
import * as THREE from "three";
import { HALL } from "../../../constants/hall";
import { useStore } from "../../../store";

const STEEL_PANEL_WIDTH = 1;

/** Pure helper exported for tests. */
export function getRoofGeometryParams(hall: {
	width: number;
	length: number;
	wallHeight: number;
	firstHeight: number;
}): {
	ridgeX: number;
	ridgeY: number;
	eaveY: number;
	slopeAngle: number;
	slopeHalfWidth: number;
	slopeLength: number;
} {
	const rise = hall.firstHeight - hall.wallHeight;
	const run = hall.width / 2;
	return {
		ridgeX: hall.width / 2,
		ridgeY: hall.firstHeight,
		eaveY: hall.wallHeight,
		slopeAngle: Math.atan2(rise, run),
		slopeHalfWidth: run,
		slopeLength: hall.length,
	};
}

const ROOF_COLOR = "#909090";

/** Build a quad geometry from 4 corner vertices (2 triangles). */
function buildQuadGeometry(
	a: [number, number, number],
	b: [number, number, number],
	c: [number, number, number],
	d: [number, number, number],
): THREE.BufferGeometry {
	const geo = new THREE.BufferGeometry();
	// Two triangles: ABC and ACD
	const vertices = new Float32Array([
		...a,
		...b,
		...c,
		...a,
		...c,
		...d,
	]);
	geo.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
	geo.computeVertexNormals();
	return geo;
}

function useRoofGeometries() {
	const { ridgeX, ridgeY, eaveY, slopeLength } = getRoofGeometryParams(HALL);
	const w = HALL.width;

	return useMemo(() => {
		// West slope quad: eave at x=0 → ridge at x=ridgeX
		const westSlope = buildQuadGeometry(
			[0, eaveY, 0],
			[ridgeX, ridgeY, 0],
			[ridgeX, ridgeY, slopeLength],
			[0, eaveY, slopeLength],
		);

		// East slope quad: ridge at x=ridgeX → eave at x=width
		const eastSlope = buildQuadGeometry(
			[ridgeX, ridgeY, 0],
			[w, eaveY, 0],
			[w, eaveY, slopeLength],
			[ridgeX, ridgeY, slopeLength],
		);

		// North gable (z=0) — vertices CCW viewed from -Z (outward)
		const northGable = new THREE.BufferGeometry();
		const northVerts = new Float32Array([
			w, eaveY, 0,
			0, eaveY, 0,
			ridgeX, ridgeY, 0,
		]);
		northGable.setAttribute(
			"position",
			new THREE.BufferAttribute(northVerts, 3),
		);
		northGable.computeVertexNormals();

		// South gable (z=length) — vertices CCW viewed from +Z (outward)
		const southGable = new THREE.BufferGeometry();
		const southVerts = new Float32Array([
			0, eaveY, slopeLength,
			w, eaveY, slopeLength,
			ridgeX, ridgeY, slopeLength,
		]);
		southGable.setAttribute(
			"position",
			new THREE.BufferAttribute(southVerts, 3),
		);
		southGable.computeVertexNormals();

		return { westSlope, eastSlope, northGable, southGable };
	}, [ridgeX, ridgeY, eaveY, slopeLength, w]);
}

function FlatHallRoof() {
	const geos = useRoofGeometries();

	useEffect(() => {
		return () => {
			geos.westSlope.dispose();
			geos.eastSlope.dispose();
			geos.northGable.dispose();
			geos.southGable.dispose();
		};
	}, [geos]);

	return (
		<group>
			<mesh geometry={geos.westSlope}>
				<meshBasicMaterial color={ROOF_COLOR} side={THREE.DoubleSide} />
			</mesh>
			<mesh geometry={geos.eastSlope}>
				<meshBasicMaterial color={ROOF_COLOR} side={THREE.DoubleSide} />
			</mesh>
			<mesh geometry={geos.northGable}>
				<meshBasicMaterial color={ROOF_COLOR} side={THREE.DoubleSide} />
			</mesh>
			<mesh geometry={geos.southGable}>
				<meshBasicMaterial color={ROOF_COLOR} side={THREE.DoubleSide} />
			</mesh>
		</group>
	);
}

function TexturedHallRoof() {
	const textures = useTexture({
		map: "/textures/steel/color.jpg",
		normalMap: "/textures/steel/normal.jpg",
		roughnessMap: "/textures/steel/roughness.jpg",
		metalnessMap: "/textures/steel/metalness.jpg",
	});

	const { slopeHalfWidth, ridgeY, eaveY, slopeLength } =
		getRoofGeometryParams(HALL);
	const rise = ridgeY - eaveY;
	const slopeWidth = Math.sqrt(slopeHalfWidth ** 2 + rise ** 2);
	const repeatX = slopeWidth / STEEL_PANEL_WIDTH;
	const repeatZ = slopeLength / STEEL_PANEL_WIDTH;

	const geos = useRoofGeometries();

	const { material, clonedTextures } = useMemo(() => {
		const cloned: THREE.Texture[] = [];
		const props: Record<string, unknown> = {
			color: ROOF_COLOR,
			side: THREE.DoubleSide,
			roughness: 0.7,
			metalness: 0.5,
		};

		for (const [key, tex] of Object.entries(textures)) {
			if (tex instanceof THREE.Texture) {
				const c = tex.clone();
				c.wrapS = THREE.RepeatWrapping;
				c.wrapT = THREE.RepeatWrapping;
				c.repeat.set(repeatX, repeatZ);
				c.needsUpdate = true;
				cloned.push(c);
				props[key] = c;
			}
		}

		return {
			material: new THREE.MeshStandardMaterial(
				props as THREE.MeshStandardMaterialParameters,
			),
			clonedTextures: cloned,
		};
	}, [textures, repeatX, repeatZ]);

	useEffect(() => {
		return () => {
			material.dispose();
			for (const tex of clonedTextures) {
				tex.dispose();
			}
			geos.westSlope.dispose();
			geos.eastSlope.dispose();
			geos.northGable.dispose();
			geos.southGable.dispose();
		};
	}, [material, clonedTextures, geos]);

	return (
		<group>
			<mesh geometry={geos.westSlope} material={material} />
			<mesh geometry={geos.eastSlope} material={material} />
			<mesh geometry={geos.northGable} material={material} />
			<mesh geometry={geos.southGable} material={material} />
		</group>
	);
}

export function HallRoof() {
	const envLayerVisible = useStore(
		(s) => s.ui.layers.environment?.visible ?? true,
	);
	const gpuTier = useStore((s) => s.ui.gpuTier);

	if (!envLayerVisible) return null;

	if (gpuTier === "low") {
		return <FlatHallRoof />;
	}

	return (
		<Suspense fallback={<FlatHallRoof />}>
			<TexturedHallRoof />
		</Suspense>
	);
}
