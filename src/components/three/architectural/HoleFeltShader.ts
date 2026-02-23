import * as THREE from "three";

const vertexShader = /* glsl */ `
varying vec2 vUv;

void main() {
	vUv = uv;
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = /* glsl */ `
uniform vec3 uColor;
uniform float uNoiseScale;
uniform float uNoiseStrength;
uniform float uOpacity;

varying vec2 vUv;

float hash(vec2 p) {
	return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);
	f = f * f * (3.0 - 2.0 * f);
	float a = hash(i);
	float b = hash(i + vec2(1.0, 0.0));
	float c = hash(i + vec2(0.0, 1.0));
	float d = hash(i + vec2(1.0, 1.0));
	return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void main() {
	float n = noise(vUv * uNoiseScale);
	vec3 feltColor = uColor * (1.0 - uNoiseStrength + n * uNoiseStrength * 2.0);
	gl_FragColor = vec4(feltColor, uOpacity);
}
`;

/** Create a ShaderMaterial with procedural felt noise. */
export function createFeltMaterial(color: string): THREE.ShaderMaterial {
	const c = new THREE.Color(color);
	return new THREE.ShaderMaterial({
		uniforms: {
			uColor: { value: c },
			uNoiseScale: { value: 50.0 },
			uNoiseStrength: { value: 0.08 },
			uOpacity: { value: 1.0 },
		},
		transparent: true,
		vertexShader,
		fragmentShader,
	});
}
