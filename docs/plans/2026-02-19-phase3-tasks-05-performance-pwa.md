# Phase 3 — Tasks 14–16: Performance + PWA

> Part of [Phase 3 Implementation Plan](./2026-02-19-phase3-implementation-index.md)
> Design: [Phase 3 Mobile + PWA Design](./2026-02-19-phase3-mobile-pwa-design.md) §5, §6
> Depends on: Task 2 (isMobile utility)

---

## Task 14: Mobile Performance Tuning

**Files:**
- Modify: `src/App.tsx`

### Step 1: Import isMobile and apply conditional rendering

In `src/App.tsx`:

1. Add import:
```tsx
import { isMobile } from "./utils/isMobile";
```

2. Update the `<Canvas>` props (line 33):

Current:
```tsx
<Canvas dpr={[1, 2]} frameloop="demand">
```

Replace with:
```tsx
<Canvas
	dpr={isMobile ? [1, 1.5] : [1, 2]}
	frameloop="demand"
	gl={{ antialias: !isMobile }}
>
```

- **DPR capped at 1.5** on mobile (saves GPU fill rate; most phones have 2x+ DPR)
- **Antialias disabled** on mobile (significant perf gain on low-end GPUs)
- Desktop unchanged: DPR [1, 2], antialias true (R3F default)

Note: The `RotationHandle` geometry reduction (ring 32 segments, sphere 8x8) was already done in Task 13.

### Step 2: Verify build

```bash
npm run check && npm run build
```

Expected: Clean build.

### Step 3: Commit

```bash
git add src/App.tsx
git commit -m "feat: reduce DPR and disable antialias on mobile for performance"
```

---

## Task 15: PWA Setup

**Files:**
- Modify: `package.json` (add dependency)
- Modify: `vite.config.ts` (add VitePWA plugin)
- Create: `public/icon-192.png`
- Create: `public/icon-512.png`

### Step 1: Install vite-plugin-pwa

```bash
cd /mnt/c/Users/Caus/Golf_Plan/golf-planner && export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)" && npm install -D vite-plugin-pwa
```

### Step 2: Generate PWA icons

Create `public/icon.svg` — an SVG icon used as the primary PWA icon (modern browsers support SVG natively):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="64" fill="#1d4ed8"/>
  <text x="256" y="380" text-anchor="middle" font-family="Arial,sans-serif" font-weight="bold" font-size="360" fill="white">G</text>
</svg>
```

Then generate PNG fallbacks. Try Python first (available in WSL2), fall back to copying the SVG:

```bash
python3 -c "
from PIL import Image, ImageDraw, ImageFont
for size in [192, 512]:
    img = Image.new('RGB', (size, size), '#1d4ed8')
    draw = ImageDraw.Draw(img)
    font_size = int(size * 0.7)
    try:
        font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', font_size)
    except:
        font = ImageFont.load_default()
    bbox = draw.textbbox((0, 0), 'G', font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (size - tw) / 2 - bbox[0]
    y = (size - th) / 2 - bbox[1]
    draw.text((x, y), 'G', fill='white', font=font)
    img.save(f'public/icon-{size}.png')
    print(f'Created icon-{size}.png')
"
```

If Pillow is not installed, the SVG icon alone is sufficient for development. PNGs can be generated later with any image tool.

### Step 3: Configure vite-plugin-pwa

Update `vite.config.ts`:

```ts
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
				globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
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
				name: "Golf Planner",
				short_name: "Golf",
				theme_color: "#1d4ed8",
				background_color: "#f3f4f6",
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
	server: {
		watch: {
			usePolling: true,
			interval: 100,
		},
	},
});
```

Key config:
- `registerType: 'autoUpdate'` — service worker updates silently
- **Icons:** SVG primary + PNG fallbacks (split `purpose` per manifest spec)
- **Precache:** All JS/CSS/HTML (client-only app, no API calls)
- **Runtime cache:** OSM tiles with StaleWhileRevalidate, 100 entries, 7-day expiry
- **Manifest:** standalone display, landscape orientation preference, blue theme
- `orientation: 'landscape'` is a preference only — iOS ignores it, Android respects it

### Step 4: Verify build

```bash
npm run build
```

Expected: Build succeeds. `dist/` should contain `sw.js` (service worker) and `manifest.webmanifest`.

```bash
ls dist/sw.js dist/manifest.webmanifest 2>/dev/null && echo "PWA files generated"
```

### Step 5: Commit

```bash
git add vite.config.ts public/icon-192.png public/icon-512.png public/icon.svg package.json package-lock.json
git commit -m "feat: add PWA support with vite-plugin-pwa"
```

---

## Task 16: Final Verification

**Files:** None (verification only)

### Step 1: Run all tests

```bash
cd /mnt/c/Users/Caus/Golf_Plan/golf-planner && export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)"
npx vitest run
```

Expected: All tests pass (existing + new activePanel + isMobile tests).

### Step 2: Run biome check

```bash
npm run check
```

Expected: No lint or format errors.

### Step 3: Run production build

```bash
npm run build
```

Expected: Build succeeds. Check bundle size is reasonable.

### Step 4: Manual verification checklist

Start dev server (`npm run dev`) and test:

**Desktop (>=768px):**
- [ ] Top toolbar visible with all buttons
- [ ] Sidebar visible with tabs
- [ ] LocationBar visible
- [ ] MiniMap visible
- [ ] KeyboardHelp visible
- [ ] BottomToolbar NOT visible
- [ ] All existing interactions work as before

**Mobile (<768px, use browser devtools responsive mode):**
- [ ] Top toolbar hidden
- [ ] Sidebar hidden
- [ ] Bottom toolbar visible with 6 buttons
- [ ] Tap Place → hole drawer opens (40% height)
- [ ] Select hole type → drawer closes, type chip shows
- [ ] Tap canvas → hole placed with ghost feedback
- [ ] Tap hole → selected, info chip in toolbar
- [ ] Tap info chip → detail panel opens full-screen
- [ ] Edit rotation with large preset buttons
- [ ] Close detail panel
- [ ] Drag hole with deadzone (10px before drag starts)
- [ ] Two-finger pan/zoom works
- [ ] Single-finger pans canvas (top-down view)
- [ ] More → overflow popover with Snap/Flow/3D toggles
- [ ] Undo/Redo buttons work

### Step 5: Push to GitHub

```bash
git push origin master
```
