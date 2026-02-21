import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
	plugins: [
		react(),
		tailwindcss(),
		VitePWA({
			registerType: "autoUpdate",
			workbox: {
				globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/tile\.openstreetmap\.org\//,
						handler: "StaleWhileRevalidate",
						options: {
							cacheName: "osm-tiles",
							expiration: {
								maxEntries: 100,
								maxAgeSeconds: 604800,
							},
						},
					},
				],
			},
			manifest: {
				name: "GOLF FORGE",
				short_name: "FORGE",
				theme_color: "#07071A",
				background_color: "#07071A",
				display: "standalone",
				orientation: "landscape",
				icons: [
					{
						src: "icon.svg",
						sizes: "any",
						type: "image/svg+xml",
					},
					{
						src: "icon-192.png",
						sizes: "192x192",
						type: "image/png",
					},
					{
						src: "icon-512.png",
						sizes: "512x512",
						type: "image/png",
						purpose: "any",
					},
					{
						src: "icon-512.png",
						sizes: "512x512",
						type: "image/png",
						purpose: "maskable",
					},
				],
			},
		}),
	],
	build: {
		rollupOptions: {
			output: {
				manualChunks: {
					"vendor-three": ["three", "@react-three/fiber", "@react-three/drei"],
					"vendor-react": ["react", "react-dom"],
					"vendor-state": ["zustand", "zundo"],
				},
			},
		},
	},
	server: {
		watch: {
			usePolling: true,
			interval: 100,
		},
	},
});
