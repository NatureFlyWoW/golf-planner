import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useStore } from "../../../store";
import {
	CUP_DEPTH,
	FLAG_PIN_HEIGHT,
	createCupGeometry,
	createFlagPinGeometry,
} from "../../../utils/holeGeometry";
import { CUP_RADIUS, SURFACE_THICKNESS } from "./shared";

const FLAG_COLOR = "#FF1744";

type CupProps = {
	position: [number, number, number];
	material: THREE.MeshStandardMaterial;
	showFlag?: boolean;
};

export function Cup({ position, material, showFlag = true }: CupProps) {
	const view = useStore((s) => s.ui.view);
	const cupGeom = useMemo(() => createCupGeometry(CUP_RADIUS), []);
	const flagPinGeom = useMemo(() => createFlagPinGeometry(), []);
	const flagClothGeom = useMemo(() => new THREE.PlaneGeometry(0.03, 0.02), []);

	const flagPinMat = useMemo(
		() => new THREE.MeshStandardMaterial({ color: "#E0E0E0", metalness: 0.8, roughness: 0.2 }),
		[],
	);
	const flagClothMat = useMemo(
		() => new THREE.MeshStandardMaterial({ color: FLAG_COLOR, side: THREE.DoubleSide }),
		[],
	);

	useEffect(() => {
		return () => {
			cupGeom.dispose();
			flagPinGeom.dispose();
			flagClothGeom.dispose();
			flagPinMat.dispose();
			flagClothMat.dispose();
		};
	}, [cupGeom, flagPinGeom, flagClothGeom, flagPinMat, flagClothMat]);

	const [px, , pz] = position;
	const cupY = SURFACE_THICKNESS - CUP_DEPTH / 2;

	return (
		<group>
			<mesh geometry={cupGeom} material={material} position={[px, cupY, pz]} />
			{showFlag && view !== "top" && (
				<group position={[px, SURFACE_THICKNESS + FLAG_PIN_HEIGHT / 2, pz]}>
					<mesh geometry={flagPinGeom} material={flagPinMat} />
					<mesh
						geometry={flagClothGeom}
						material={flagClothMat}
						position={[0.015, FLAG_PIN_HEIGHT / 2 - 0.015, 0]}
					/>
				</group>
			)}
		</group>
	);
}
