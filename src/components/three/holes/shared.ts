import * as THREE from "three";

// ── Colors ──────────────────────────────────────────────
export const FELT_COLOR = "#2E7D32";
export const BUMPER_COLOR = "#F5F5F5";
export const TEE_COLOR = "#FDD835";
export const CUP_COLOR = "#212121";

// ── Dimensions ──────────────────────────────────────────
export const BUMPER_HEIGHT = 0.08;
export const BUMPER_THICKNESS = 0.05;
export const SURFACE_THICKNESS = 0.02;
export const TEE_RADIUS = 0.03;
export const CUP_RADIUS = 0.054;

// ── Model Heights (max Y extent per type, for selection outline) ──
export const MODEL_HEIGHTS: Record<string, number> = {
	straight: BUMPER_HEIGHT + SURFACE_THICKNESS,
	"l-shape": BUMPER_HEIGHT + SURFACE_THICKNESS,
	dogleg: BUMPER_HEIGHT + SURFACE_THICKNESS,
	ramp: 0.15 + BUMPER_HEIGHT + SURFACE_THICKNESS,
	loop: 0.7,
	windmill: 0.35,
	tunnel: 0.35,
};

// ── Shared Materials (module-level singletons — DO NOT set emissive on these) ──
export const feltMaterial = new THREE.MeshStandardMaterial({
	color: FELT_COLOR,
	roughness: 0.9,
	metalness: 0,
	polygonOffset: true,
	polygonOffsetFactor: -1,
});

export const bumperMaterial = new THREE.MeshStandardMaterial({
	color: BUMPER_COLOR,
	roughness: 0.3,
	metalness: 0.1,
});

export const teeMaterial = new THREE.MeshStandardMaterial({
	color: TEE_COLOR,
	roughness: 0.5,
	metalness: 0,
});

export const cupMaterial = new THREE.MeshStandardMaterial({
	color: CUP_COLOR,
	roughness: 0.5,
	metalness: 0,
});

// ── UV Materials (neon emissive for blacklight preview) ──
export const uvFeltMaterial = new THREE.MeshStandardMaterial({
	color: "#003300",
	emissive: "#00FF66",
	emissiveIntensity: 2.0,
	roughness: 0.9,
	metalness: 0,
	polygonOffset: true,
	polygonOffsetFactor: -1,
});

export const uvBumperMaterial = new THREE.MeshStandardMaterial({
	color: "#001A33",
	emissive: "#00CCFF",
	emissiveIntensity: 2.0,
	roughness: 0.3,
	metalness: 0.1,
});

export const uvTeeMaterial = new THREE.MeshStandardMaterial({
	color: "#333300",
	emissive: "#FFFF00",
	emissiveIntensity: 2.0,
	roughness: 0.5,
	metalness: 0,
});

export const uvCupMaterial = new THREE.MeshStandardMaterial({
	color: "#331A00",
	emissive: "#FF6600",
	emissiveIntensity: 2.0,
	roughness: 0.5,
	metalness: 0,
});
