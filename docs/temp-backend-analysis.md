# Backend & Infrastructure Analysis — Golf Planner
**Date:** 2026-02-21
**Author:** Backend Architecture Review
**Status:** Exploratory — not yet approved for implementation

---

## Executive Summary

Golf Planner is a 100% client-side React 19 + R3F PWA, deployed on Vercel as a static bundle. It
requires no backend today and does its job well within those constraints. This document evaluates
six categories of backend infrastructure that could materially improve the tool — covering
photorealistic rendering, satellite/terrain data, asset delivery, real-time collaboration, AI
generation, and cost-effective architecture for a personal-use tool.

The core constraint throughout: **this is a personal planning tool for friends, not a SaaS
product.** Every proposal is evaluated against that constraint. The guiding principle is
"maximum capability, minimum operational burden, near-zero marginal cost."

---

## 1. Server-Side Rendering Pipeline

### Problem Statement

The current R3F canvas produces a functional but non-photorealistic visualization. UV/bloom mode
looks compelling on screen, but capturing and sharing a truly photorealistic render — one that
shows what the hall will look like as a venue — requires either a cloud GPU or a path-traced
renderer that the browser cannot run in real time.

### Option A: Headless Three.js on Node with GPU Instance (Recommended)

**Architecture:**

```
Client (React PWA)
    │  POST /render  {layoutJSON, renderConfig}
    ▼
Vercel Serverless Function (orchestrator)
    │  enqueue job to queue
    ▼
Render Worker (single EC2 g4dn.xlarge, spot instance)
    │  headless-gl + Three.js + same scene code
    │  OffscreenCanvas → PNG → upload to S3
    ▼
Client polls GET /render/{jobId} → presigned S3 URL
```

**Key components:**

- `headless-gl` (npm) provides a WebGL context in Node without a display server. It runs on the
  same GPU hardware used for ML workloads (T4 GPU on g4dn). The Three.js scene code running in the
  browser can be shared directly with the server because it has no DOM dependencies — only the
  Canvas and WebGL context differ.
- The same `ThreeCanvas.tsx` scene graph can be extracted into a pure-logic module (no React
  dependency, just Three.js scene construction) and used by both the browser renderer and the
  headless Node renderer. This is the critical architectural insight: **scene logic is already
  decoupled from React** because R3F renders into `<Canvas>` which is just a WebGL context.
- On the server, rendering at 4K (3840×2160) with soft shadows and environment maps takes roughly
  2–4 seconds per frame on a T4 GPU.
- For a flythrough video (30 seconds × 24fps = 720 frames), rendering serially takes 24–48 minutes
  on a single T4. Parallelized across 8 workers: 3–6 minutes.

**Render quality improvements over browser:**

- `THREE.PMREMGenerator` with a real HDRI environment map (16-bit EXR) — this alone transforms
  lighting quality more than any other change
- Shadow map resolution: 4096×4096 (impossible in browser due to VRAM limits in shared GPU)
- `THREE.WebGLRenderer` with `antialias: true` + SSAA (super-sampling 4x)
- Physically correct tone mapping (`THREE.ACESFilmicToneMapping`)
- Exposure and gamma curve tuned for the UV blacklight aesthetic

**Estimated cost:**

| Workload | Instance | Duration | Cost |
|---|---|---|---|
| Single 4K frame | g4dn.xlarge spot | ~3s | ~$0.002 |
| 30-second flythrough video | g4dn.xlarge spot | ~45 min | ~$0.07 |
| 10 renders/month (personal use) | spot | — | < $1/month |

The spot instance is only running during active renders. Use a Lambda to start/stop it. For
personal use, total AWS cost is likely $2–5/month including S3 storage.

**Implementation complexity:** High. You need to extract the Three.js scene into a shared module,
set up headless-gl in Node, build the job queue (SQS or even a simple Vercel KV queue), write the
EC2 start/stop Lambda, and build the status polling UI. Estimate: 3–5 days of implementation.

**Simpler alternative within this option:** Skip the EC2 instance entirely and use `puppeteer` +
headless Chromium on a Lambda to screenshot the actual browser R3F canvas at 2x device pixel
ratio. This is considerably simpler — you literally load the app in a headless browser and call
`captureScreenshot()`. Quality is limited by browser WebGL (no 4K shadow maps) but the result is
identical to what you see on screen, including bloom/vignette post-processing. Cost: ~$0/month on
Vercel's free tier for serverless function invocations.

### Option B: Blender Render Farm via Blender Cloud API

**Architecture:**

```
Client exports GLB (Three.js → GLB via three-mesh-bvh + GLTFExporter)
    │  Upload to S3 presigned URL
    ▼
Lambda: submit job to SheepIt / RebusFarm / Blender Cloud API
    ▼
Render farm returns EXR/PNG sequence
    ▼
Lambda: post-process (ffmpeg for video), notify client
```

**Pros:**
- Blender's Cycles path tracer produces physically accurate renders that look like photographs
- HDRI lighting, caustics, subsurface scattering on felt — genuine photorealism
- No infrastructure to maintain — fully managed render farms

**Cons:**
- GLB export from Three.js is lossy — Blender receives geometry but not materials, shaders, or the
  custom UV emissive setup. Significant manual material re-assignment would be needed, defeating
  the automation
- SheepIt (free render farm) requires Blender source `.blend` files, not GLB. The conversion
  pipeline (GLB → Blender Python script → .blend) is complex and fragile
- RebusFarm costs: ~€0.004 per GHz-hour. A single Cycles frame at 512 samples takes ~30 GHz-hours
  on a modern scene = ~€0.12 per frame. A 720-frame video = ~€86. Not practical for casual use.

**Verdict:** The GLB pipeline mismatch makes this non-trivial. Use Option A (headless Three.js)
instead — it reuses your existing scene code and produces UV-mode renders that Blender cannot
replicate anyway (Blender doesn't understand your emissive UV palette setup).

### Option C: Gaussian Splatting / NeRF from Property Photos

This is covered in Section 5 (AI-powered generation), as it requires ML models.

### Recommendation

For now: implement the **Puppeteer Lambda screenshot** as a quick win (1 day, free tier). The
client already has `captureScreenshot()` — a server-side Puppeteer implementation is essentially
the same thing at higher resolution and without requiring the user to be on a desktop browser.

When/if you want genuine 4K photorealistic renders: implement the **headless Three.js + spot GPU
pipeline** (Option A). The shared scene module architecture is the right long-term path.

---

## 2. Google Earth / Maps Data Pipeline

### What's Available at the Coordinates

**Property location:** 48.1494°N, 14.1750°E — Gramastetten, Upper Austria, elevation ~620m.

The Google Maps Platform provides three relevant APIs:

| API | What it provides | Pricing |
|---|---|---|
| Maps Static API | Satellite imagery tiles (PNG) | $2/1,000 requests |
| Elevation API | Terrain elevation grid | $5/1,000 requests |
| Map Tiles API (3D) | Photorealistic 3D tiles (Cesium format) | $9/1,000 sessions |

### Option A: Static Satellite Imagery Tile (Recommended — Minimal)

For site context visualization, a single 640×640 satellite image centered on the property is
sufficient. You need to show "here is where the hall sits on the actual land parcel."

**Backend proxy (prevents API key exposure):**

```typescript
// Vercel serverless function: api/satellite.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { lat, lng, zoom = 18 } = req.query;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY; // server-only env var

  const url = `https://maps.googleapis.com/maps/api/staticmap`
    + `?center=${lat},${lng}`
    + `&zoom=${zoom}`
    + `&size=640x640`
    + `&maptype=satellite`
    + `&scale=2`
    + `&key=${apiKey}`;

  const response = await fetch(url);
  const buffer = await response.arrayBuffer();

  // Cache aggressively — satellite imagery doesn't change
  res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=604800");
  res.setHeader("Content-Type", "image/png");
  res.send(Buffer.from(buffer));
}
```

**Client usage:** Render the satellite image as a texture on the hall floor plane or as a
background context layer behind the R3F canvas (as a `<img>` positioned absolutely). The hall
footprint (10m × 20m) overlaid on top creates a "site placement" visualization.

**Cost:** One API call per user session, cached at CDN for 7 days. For personal use: effectively
$0 (within Google's $200/month free credit which covers 100,000 static map requests).

**Coordinate precision:** At zoom=18, Google Static Maps gives ~0.6m/pixel resolution. Your
Gramastetten parcel is clearly visible at this zoom. A single request gives you everything needed.

### Option B: 3D Terrain Integration (Google Map Tiles API)

The Google Map Tiles API (formerly Photorealistic 3D Tiles) provides Cesium 3D Tiles of the
terrain and buildings around your property. This could theoretically let you visualize the BORGA
hall model **sitting in the actual landscape** — surrounded by the actual fields, roads, and
neighboring buildings of Gramastetten.

**Integration path:**

```
Google Map Tiles API → 3D Tiles → CesiumJS or Three.js 3D Tiles loader
    │
    ├── Option 1: CesiumJS (separate viewer, not R3F)
    │   Full-featured but requires embedding a Cesium canvas alongside R3F
    │
    └── Option 2: three-3d-tiles-renderer (npm)
        Loads Cesium 3D tiles into a Three.js scene
        Integrates directly into your existing R3F canvas
```

**three-3d-tiles-renderer** by NASA JPL (open source, MIT license) loads Google's 3D tiles
directly into Three.js. You create a `TilesRenderer` instance, point it at the Google Tiles API
endpoint, and it handles LOD streaming, culling, and camera-based tile loading.

```typescript
import { TilesRenderer } from "3d-tiles-renderer";

// Inside R3F useEffect or a component:
const tiles = new TilesRenderer(
  `https://tile.googleapis.com/v1/3dtiles/root.json?key=${PROXY_API_KEY}`
);
tiles.setCamera(camera);
tiles.setResolutionFromRenderer(camera, renderer);
scene.add(tiles.group);
```

**Challenges:**
- The Google 3D tiles API is billed per "session" (user load). For personal use: ~$0 (within free
  credit)
- Tile data around Gramastetten includes 3D building meshes for the existing structures. The field
  where the BORGA hall is planned will appear as flat terrain — that is correct (nothing is built
  yet)
- The terrain coordinate system (ECEF — Earth-Centered Earth-Fixed) requires a coordinate
  transform to align your hall model (which lives in local meters) with the global tiles. This
  transform is straightforward but must be done correctly

**Result:** You could show the BORGA hall model sitting on the actual Gramastetten hillside, with
surrounding farmland, roads, and the church visible in the background. For a planning tool, this
is a compelling "here is what we're building and where" visualization.

**Implementation effort:** Medium-high (~2 days). The `three-3d-tiles-renderer` library handles
most complexity. The coordinate transform is the fiddliest part.

### Option C: Austrian Open Geodata (Free, No API Key)

Austria has excellent open geodata through `data.gv.at` and the Bundesamt für Eich- und
Vermessungswesen (BEV):

- **BASEMAP.AT** — Austria's official basemap, free tile API, no key required
  - `https://maps.wien.gv.at/basemap/bmaporthofoto30cm/normal/google3857/{z}/{y}/{x}.jpg`
  - Orthophoto (aerial photography) at 30cm/pixel resolution — better resolution than Google at
    this level
  - Legal to use in any application

- **BEV DGM (Digitales Geländemodell)** — free 1m terrain grid for all of Austria
  - Available as ASCII grid or GeoTIFF via `geoland.at`
  - 1m vertical accuracy — sufficient for a 620m elevation site on relatively flat ground

**Backend service:**

```typescript
// api/terrain.ts — proxy BEV elevation grid for the Gramastetten area
// Fetches a 200m × 200m terrain patch around the property
// Converts to Three.js BufferGeometry heightmap
// Returns as JSON {vertices: Float32Array, indices: Uint32Array}
```

**Cost:** Free. No API key. Austria's open data licensing (CC BY 4.0) allows free use.
**Quality:** Orthophoto is 30cm/pixel — higher resolution than Google Static Maps at zoom 18.

**Recommendation for satellite imagery:** Use the BEV orthophoto tile proxy instead of Google Maps
Static API. It's free, higher resolution, and legally clear for a private tool. For 3D terrain
integration, the Google Map Tiles API + `three-3d-tiles-renderer` is the more practical path
because the building mesh data (for neighboring structures) only exists in Google's dataset.

---

## 3. Asset Pipeline

### Current State

The current build has no external assets. All geometry is procedural Three.js (BoxGeometry,
RingGeometry, etc.). There are no textures, no HDRI maps, no GLTF models. The entire 3D scene is
generated from code. This is why the vendor-three chunk is ~1,250 KB and nothing else.

### What an Asset Pipeline Would Add

Photorealistic materials require:
1. **PBR texture maps** — albedo, roughness, normal, AO per surface type (felt, concrete floor,
   galvanized steel bumpers, painted MDF)
2. **HDRI environment map** — for image-based lighting (IBL) that makes metallic materials look
   physically correct
3. **Pre-built GLB models** — for complex obstacles (the windmill model is currently procedural;
   a GLB would have proper bevels, chamfers, and UV-unwrapped surfaces)

### Architecture

```
Asset Source (local files or Blender exports)
    │
    ▼
Asset Pipeline (build-time, runs in CI)
    │  ├── HDRI → KTX2 compressed cubemap (via ktx-software)
    │  ├── Textures → KTX2/Basis Universal (via toktx)
    │  └── GLB → DRACO-compressed GLB (via gltf-pipeline)
    ▼
CDN (Cloudflare R2 or Vercel Blob)
    │  Served with immutable Cache-Control headers
    │  Compressed with Brotli at CDN edge
    ▼
Client
    │  Three.js KTX2Loader + DRACOLoader
    │  Progressive loading (low-res → high-res)
    │  useTexture() from @react-three/drei
```

### Texture Format Strategy

| Format | Use case | Compression ratio | Browser support |
|---|---|---|---|
| KTX2 / Basis Universal | All PBR textures | 6-8x vs PNG | 97% (WebGL2) |
| DRACO | Geometry in GLB files | 10-15x vs uncompressed | 99% |
| EXR (16-bit) | HDRI environment maps | — (no GPU compression) | Via Three.js loader |
| RGBE (.hdr) | HDRI alternative | — | Via Three.js loader |

**KTX2 loader setup:**

```typescript
// In ThreeCanvas.tsx, inside <Canvas>:
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import { useThree } from "@react-three/fiber";

function SetupLoaders() {
  const { gl } = useThree();
  useEffect(() => {
    const ktx2Loader = new KTX2Loader()
      .setTranscoderPath("/basis/") // basis_transcoder.wasm served from public/
      .detectSupport(gl);
    // Register with useLoader cache
  }, [gl]);
  return null;
}
```

**Recommended free texture sources:**

- `ambientcg.com` — CC0 PBR textures, 4K downloads, includes: Carpet, Felt, Metal Galvanized,
  Concrete, Plywood
- `polyhaven.com` — CC0 HDRI maps. For indoor blacklight: "small_empty_room_3" or "photo_studio"
  HDRIs work well as base; you override with the UV purple ambient light anyway
- Both provide textures in KTX2/Basis format directly via their API

**Recommended specific textures for this project:**

| Surface | AmbientCG ID | Size |
|---|---|---|
| Golf felt (fairway carpet) | `Carpet007` | 4K |
| Galvanized steel bumpers | `MetalGalvanizedSteelWorn001` | 2K |
| Concrete floor | `Concrete034` | 4K |
| Marine plywood (standard DIY) | `WoodPlywoodBirch001` | 2K |
| Painted MDF (budget DIY) | `PaintedWood014` | 2K |

**Bundle/CDN strategy:**

- Host assets on **Cloudflare R2** (S3-compatible, zero egress fees, $0.015/GB storage)
- For personal use with ~50MB of assets: total cost < $1/month
- Alternative: commit compressed assets to the repo and serve from Vercel's CDN (free, but adds
  repo size)
- Vercel Blob (beta) — $0.03/GB, integrated with Vercel deployment, simplest for this project

**Progressive loading pattern:**

```typescript
// Use drei's useTexture with Suspense for progressive loading
// Low-res 256px placeholder → full 2K/4K after initial render
import { useTexture } from "@react-three/drei";

function FeltSurface() {
  const [albedo, roughness, normal] = useTexture([
    "https://cdn.golf-planner.app/textures/carpet007_2k_color.ktx2",
    "https://cdn.golf-planner.app/textures/carpet007_2k_roughness.ktx2",
    "https://cdn.golf-planner.app/textures/carpet007_2k_normal.ktx2",
  ]);
  return (
    <meshStandardMaterial map={albedo} roughnessMap={roughness} normalMap={normal} />
  );
}
```

**Cost estimate:** Cloudflare R2 for ~100MB assets (textures + HDRIs + GLB models): $0.0015/month
storage. Bandwidth for 10 sessions/month at 50MB each: $0/month (R2 has no egress fee for R2
Workers requests). Effectively free.

**Implementation effort:** Medium (1–2 days). The main work is finding/converting the textures,
not writing code. `@react-three/drei` already handles the loading pipeline.

---

## 4. Real-Time Collaboration

### Use Case

You and 1–2 friends want to simultaneously edit the hall layout during a planning session. One
person drags holes, another adjusts the budget, and changes appear in real time for everyone.

### Option A: Liveblocks (Recommended)

Liveblocks is purpose-built for real-time collaborative React apps. It has first-class Zustand
integration via a persistence layer that syncs your existing Zustand store state across clients.

**How it maps to your architecture:**

Your Zustand store already has a clean `partialize` function that separates persistent state
(holes, budget) from ephemeral UI state (uvMode, sunDate). Liveblocks would sync exactly the
`partialize`-included slice — the same data that currently goes to localStorage.

```typescript
// Liveblocks integration — replace localStorage persistence
import { createClient } from "@liveblocks/client";
import { liveblocks } from "@liveblocks/zustand";

const client = createClient({
  publicApiKey: "pk_live_...", // public key, safe to expose in client
});

// Wrap your store creation:
const useStore = create(
  liveblocks(
    (set, get) => ({
      // your existing store definition unchanged
    }),
    { client, presenceMapping: { /* cursor positions */ } }
  )
);
```

**Conflict resolution:** Liveblocks uses operational transforms internally. For your use case
(holes are discrete objects with IDs in a Record), last-write-wins per hole is acceptable — two
people won't be editing the same hole simultaneously in a 2-person session.

**Pricing (2026):** Liveblocks free tier: 2 rooms, 100 MAU. Starter: $29/month, 10,000 MAU.
For personal use with 2–3 friends: **free tier is sufficient indefinitely**.

**Latency:** Liveblocks uses WebSocket connections to regional edge servers. From Austria, the
nearest Liveblocks region is EU-West (Frankfurt). Latency: ~15–30ms round trip.

### Option B: PartyKit

PartyKit is a WebSocket server framework designed to run on Cloudflare's edge network. It's more
flexible than Liveblocks (you write the server logic) but requires more code.

```typescript
// partykit/server.ts (runs on Cloudflare Workers)
import type * as Party from "partykit/server";

export default class GolfPlannerRoom implements Party.Server {
  holes: Record<string, unknown> = {};

  onMessage(message: string, sender: Party.Connection) {
    const update = JSON.parse(message);
    // Merge update into state, broadcast to all connections
    this.broadcast(JSON.stringify({ type: "update", ...update }), [sender.id]);
  }
}
```

**Pricing:** PartyKit free tier includes 10 projects, 1,000 rooms. For personal use: free.

**Vs. Liveblocks:** PartyKit gives you full control over the server logic (useful if you want
custom conflict resolution). Liveblocks is zero-config and has the Zustand plugin. For this
project, Liveblocks is the right choice.

### Option C: Yjs with a WebSocket server

Yjs is a CRDT (Conflict-free Replicated Data Type) library — mathematically correct convergence
regardless of network partitions. It's what Notion, Linear, and Figma-style editors use
internally.

For your use case (planning sessions of 2–3 people with occasional disconnect/reconnect), Yjs is
overkill from a correctness standpoint but offers the richest conflict resolution guarantees. The
integration is non-trivial — you'd need to model your Zustand store as Yjs shared types (Y.Map
for holes, Y.Map for budget).

**Self-hosted WebSocket server (hocuspocus):**
```
npm add @hocuspocus/server
```
Run on a $4/month Hetzner VPS (Austria has a Hetzner datacenter in Falkenstein, ~300km away).

**Verdict:** Use Liveblocks for zero-ops real-time collaboration. Yjs if you need robust offline
support where multiple people edit disconnected and then merge.

### What Collaboration Means for This Project

Honest assessment: for 2–3 friends planning a single hall, real-time collaboration is a nice-to-
have, not a necessity. The current JSON export → share via iMessage → reimport workflow is
workable. The ROI on implementing collaboration depends entirely on how many active planning
sessions you expect to have simultaneously.

---

## 5. AI-Powered Generation

### 5a. UV/Blacklight Texture Generation from Prompts

**Goal:** Generate unique UV-reactive surface textures for hole fairways — e.g., "neon galaxy
swirls," "black light circuit board," "fluorescent jungle."

**Service:** Replicate.com hosts Stable Diffusion and FLUX models via a REST API.

```typescript
// api/generate-texture.ts (Vercel serverless function)
import Replicate from "replicate";

export default async function handler(req: Request) {
  const { prompt, seed } = await req.json();
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

  const output = await replicate.run(
    "black-forest-labs/flux-1.1-pro", // or stability-ai/sdxl
    {
      input: {
        prompt: `UV blacklight reactive texture, seamless tile, ${prompt}, neon colors on black background, 4K`,
        width: 1024,
        height: 1024,
        // A seamless texture requires either tiling-aware generation or post-processing
      }
    }
  );

  return Response.json({ imageUrl: output[0] });
}
```

**For seamless tiling:** FLUX/SDXL don't natively generate seamless tiles. Post-process with
`sharp` (Node library) to blend edges using an offset-and-blend technique. Alternatively, use the
`stable-diffusion-webui` API's `tiling: true` parameter if self-hosting.

**Cost on Replicate:**
- FLUX 1.1 Pro: $0.04/image (1024×1024)
- SDXL: $0.0023/image
- For 20 texture generations during planning: < $1 total

**Integration into R3F:** The generated PNG is fetched by the client and applied as a texture map
to the felt material of selected holes:

```typescript
// Replace the solid color felt material with the generated texture
const texture = useTexture(generatedTextureUrl);
<meshStandardMaterial map={texture} emissive={uvMode ? "#00FF66" : undefined} />
```

**Practical caveat:** AI-generated seamless UV textures are genuinely useful for visualizing the
venue aesthetic. However, applying per-hole unique textures adds rendering complexity to the
Three.js scene and requires rethinking the current shared material singleton architecture.

### 5b. Auto-Generated Hole Layouts

**Goal:** Given constraints (hall dimensions, number of holes, difficulty rating), generate a hole
layout that is spatially valid and fun to play.

**This is a constraint satisfaction problem, not an AI problem.** The most practical approach is a
deterministic solver:

```typescript
// Placement generator — no AI required
function generateLayout(
  hallWidth: number,  // 10m
  hallLength: number, // 20m
  targetHoleCount: number, // 9 or 18
  seed: number,
): PlacedHole[] {
  // 1. Sample hole types from a weighted distribution (more straights, fewer loops)
  // 2. Use your existing AABB collision detection to find valid placements
  // 3. Greedy insertion with random restarts (simulated annealing-style)
  // 4. Optimize flow path to minimize crossing
}
```

Your existing `PlacementHandler` and `computeTemplateBounds()` already do the hard geometric work.
A layout generator wraps them in a loop.

**If you want ML-based generation:** Train a small model on layouts that score well on a "fun
metric" (path variety, elevation changes, par distribution). This requires first defining what
"fun" means quantitatively. For a personal planning tool, this is over-engineering.

**Recommendation:** Build the deterministic solver first. Add a "Generate Layout" button to the
toolbar that produces a valid starting point. The solver using your existing collision system is a
1-day implementation.

### 5c. Promotional Renders (AI-Enhanced)

**Goal:** Generate marketing-quality images of the finished venue for sharing with investors,
landlords, or on social media.

**Two-step pipeline:**

1. **Capture:** Use the existing `captureScreenshot()` (or the server-side Puppeteer approach from
   Section 1) to get a clean R3F render of the UV mode scene
2. **Upscale + stylize:** Pass the render through an AI upscaler and style-transfer model

**Services for step 2:**

| Service | Input | Output | Cost |
|---|---|---|---|
| Magnific AI | PNG screenshot | 4× upscaled, enhanced | $39/month (or per-image pricing) |
| Replicate topaz-gigapixel | PNG | 4× upscaled | $0.05/image |
| FLUX img2img on Replicate | PNG + prompt | Stylized photorealistic | $0.04/image |
| Stable Diffusion img2img | PNG + prompt | Stylized | $0.002/image |

**Prompt for venue renders:**
```
"Professional architectural visualization, indoor blacklight mini golf venue,
neon lights, dark atmosphere, vibrant fluorescent colors, wide-angle lens,
commercial photography, photorealistic, 8K"
```

**Realistic output:** The img2img approach works best when the input render is already well-lit and
the prompt guides the style. Your UV mode + bloom screenshots provide a strong base. The AI
enhancer adds photorealistic textures, depth, and atmosphere. Results are not guaranteed to be
faithful to your exact layout, but they produce compelling venue concept art.

**Cost for personal use:** < $5 total for 20–30 render experiments.

### 5d. NeRF / Gaussian Splatting from Property Photos

**Goal:** Take 20–50 photos of the actual Gramastetten property (the empty field/building) and
reconstruct a 3D scene that the planner can use as the real-world context for hall placement.

**What you get:** A photorealistic 3D representation of the actual site — not a Google satellite
view, but a ground-level 3D scan from your own photos.

**Pipeline:**

```
iPhone photos of the property (20-50 images, circling the site)
    │
    ▼
COLMAP (free, open-source) — structure from motion, estimates camera poses
    │
    ▼
Gaussian Splatting trainer (nerfstudio, open-source)
    │  Runs locally on a GPU, or on a Colab free tier (T4 GPU, ~30min training)
    ▼
.splat file (Gaussian splatting scene)
    │
    ▼
@react-three/drei <Splat> component (ships with drei, loads .splat directly)
    │
    ▼
R3F scene: .splat background + your hall model overlay
```

**Key libraries:**
- `nerfstudio` — the most actively maintained NeRF/Gaussian splatting toolkit, runs on Python
- `@react-three/drei` has a `<Splat>` component that loads `.splat` files natively in R3F with no
  additional dependencies. This is a zero-cost integration once you have the `.splat` file.

**Cost:**
- COLMAP + nerfstudio: free (open source)
- Training compute: Colab free tier T4 GPU is sufficient for 50 photos (~30–45 minutes)
- Storing the .splat file: ~10–50MB, free on any CDN
- **Total: $0** (just your time to take the photos and run the pipeline)

**This is the most compelling feature on this list.** A photorealistic 3D representation of the
actual Gramastetten property as the background to your hall planner, with the ability to place the
BORGA hall footprint into the real scene — this is what professional architectural visualization
tools do for millions of dollars. You can do it for free with nerfstudio and drei.

**`<Splat>` usage in R3F:**

```tsx
import { Splat } from "@react-three/drei";

// Inside ThreeCanvas.tsx:
{showSiteContext && (
  <Splat
    src="https://cdn.golf-planner.app/site/gramastetten-field.splat"
    position={[splatOffsetX, 0, splatOffsetZ]}
    scale={splatScale}
  />
)}
```

The coordinate alignment (matching the .splat coordinate system to your hall's local meter
coordinate system) requires a manual calibration step where you identify a known point in the
.splat (e.g., a fence corner) and align it to the corresponding GPS coordinate.

### 5e. Depth Estimation for Single Photos

If you don't want to run a full Gaussian Splatting pipeline, Apple's Vision framework and
Meta's Depth Pro model (open source, Apache 2.0) can estimate a depth map from a single photo of
the property. This gives a rough 3D displacement map that can be applied as a terrain mesh in
Three.js.

**Depth Pro on Replicate:** $0.001/image.

The quality is lower than Gaussian Splatting but the workflow is radically simpler: take one
photo, call the API, get a depth PNG, convert to BufferGeometry heightmap.

---

## 6. Cost-Effective Architecture Summary

### Constraint Reiteration

Personal planning tool. 2–5 users total. No SLAs. Intermittent usage. No revenue. The goal is
access to powerful features at near-zero ongoing cost.

### Recommended Stack (layered by priority)

**Layer 0: Keep what works (zero cost)**
- Vercel static hosting (free tier: 100GB bandwidth/month — you'll never exceed this)
- localStorage persistence (already works, no change)
- JSON export/import (already works)
- Client-side `captureScreenshot()` (already works)

**Layer 1: Free tier services (zero cost, add when needed)**

| Feature | Service | Free Tier |
|---|---|---|
| Server-side env vars / API key proxy | Vercel Serverless Functions | 100 GB-hours/month |
| Satellite imagery proxy | Vercel Function + BEV orthophoto | Free (public data) |
| Real-time collaboration | Liveblocks | 2 rooms, 100 MAU — free forever for personal use |
| Asset hosting (textures, HDRIs) | Cloudflare R2 | 10 GB storage, 1 million ops/month — free |
| AI texture generation | Replicate | Pay-per-use, ~$0.004–0.04/generation |

**Layer 2: Near-zero cost services**

| Feature | Service | Estimated monthly cost |
|---|---|---|
| Gaussian Splat hosting (.splat file) | Cloudflare R2 | < $0.01 |
| Server-side Puppeteer screenshots | Vercel Functions (pay-per-use) | < $0.50 |
| AI promotional renders | Replicate (pay-per-use) | < $2 for all experiments |
| Google 3D Tiles (site context) | Google Maps Platform | $0 (within $200/month credit) |

**Layer 3: Only if you want 4K photorealistic renders**

| Feature | Service | Estimated monthly cost |
|---|---|---|
| Headless Three.js GPU render | AWS EC2 g4dn.xlarge spot | $2–5 (10 renders/month) |
| Job queue | AWS SQS | < $0.01 |
| Render output storage | AWS S3 | < $0.01 |

**Layer 3 total: ~$5/month.** Only needed if browser-quality screenshots are insufficient.

### Prioritized Implementation Roadmap

Given the personal-tool constraint, here is the recommended order of implementation:

**Priority 1 — Free, high visual impact:**
1. **BEV orthophoto proxy** (1 day): Show the actual Gramastetten aerial image as site context
2. **PBR textures from AmbientCG** (1–2 days): Replace solid-color materials with felt, steel,
   concrete textures. Single biggest visual quality jump at zero ongoing cost.
3. **HDRI environment map** (0.5 days): Add a PolyHaven HDRI for physically correct metallic
   reflections. Works with existing `MeshStandardMaterial`.

**Priority 2 — Free, adds capability:**
4. **Gaussian Splatting pipeline** (1 weekend): Take photos of the property, train on Colab,
   integrate `<Splat>` in R3F. Compelling site context, zero ongoing cost.
5. **Deterministic layout generator** (1 day): Auto-generate valid hole layouts. Uses existing
   collision code, no backend needed.
6. **AI texture generation via Replicate** (1 day): Prompt-driven UV textures. Pay ~$0.02/texture.

**Priority 3 — Adds collaboration:**
7. **Liveblocks real-time collaboration** (1–2 days): Multi-user editing. Free tier covers your
   use case indefinitely.

**Priority 4 — Premium rendering (only if needed):**
8. **Headless Three.js GPU render pipeline** (3–5 days): True 4K photorealistic renders. ~$5/month.

### Architecture Decision: Stay Serverless

Given the usage pattern (infrequent, burst-y, personal), **do not run a persistent server**. Every
backend feature described in this document can be implemented with:

- Vercel serverless functions (API key proxying, orchestration)
- Managed services with free tiers (Liveblocks, Cloudflare R2)
- Pay-per-use compute (Replicate, AWS spot instances started on-demand)

A persistent VPS (even $4/month Hetzner) is only justified if you need the Yjs WebSocket server
for offline-first collaboration, which is not a requirement for this use case.

**Total ongoing cost for the full stack (all features enabled):**

| Scenario | Monthly cost |
|---|---|
| Priority 1 features only | $0 |
| Priority 1 + 2 (including Gaussian Splat) | $0–2 (Replicate per-use) |
| Priority 1 + 2 + 3 (collaboration) | $0–2 |
| Full stack with 4K renders (Priority 4) | $5–10 |

---

## Appendix A: Technical Compatibility Notes

### Current Codebase Integration Points

These backend features integrate with the existing codebase with minimal friction:

| Feature | Integration point | Estimated code delta |
|---|---|---|
| BEV satellite proxy | New `<img>` element in App.tsx behind the canvas | +50 lines |
| PBR textures | Modify `useMaterials.ts` hook, add `useTexture()` calls | +100 lines |
| HDRI environment | `<Environment>` from @react-three/drei in ThreeCanvas.tsx | +10 lines |
| Gaussian Splat | `<Splat>` from @react-three/drei in ThreeCanvas.tsx | +30 lines |
| Liveblocks collab | Wrap `create()` in store.ts with `liveblocks()` | +50 lines |
| AI texture via Replicate | New Vercel function + UI in HoleDetail panel | +200 lines |
| Layout generator | New utility in `src/utils/layoutGenerator.ts` | +300 lines |

### Three.js Scene Architecture for Backend Renders

The current `ThreeCanvas.tsx` mixes R3F components with React state. For server-side rendering
(headless Three.js), you need a **scene factory function** that constructs the Three.js scene
without React:

```typescript
// src/utils/sceneFactory.ts (new file, no React dependencies)
import * as THREE from "three";
import type { Hole, HallState } from "../types";

export function buildScene(
  hall: HallState,
  holes: Record<string, Hole>,
  options: { uvMode: boolean; shadows: boolean }
): THREE.Scene {
  const scene = new THREE.Scene();
  // Build hall geometry, place holes, set up lighting
  // Returns the scene ready for renderer.render(scene, camera)
  return scene;
}
```

This factory would be imported by both `ThreeCanvas.tsx` (which wraps it in R3F `<primitive>`) and
the Node.js headless renderer. Currently your scene is built inside R3F JSX components — extracting
the core geometry construction into a pure Three.js factory function is the architectural
prerequisite for server-side rendering.

### Vercel Configuration

For the serverless function approach, Vercel's `vercel.json` needs:

```json
{
  "functions": {
    "api/*.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "GOOGLE_MAPS_API_KEY": "@google-maps-api-key",
    "REPLICATE_API_TOKEN": "@replicate-api-token"
  }
}
```

API keys live in Vercel's encrypted environment variables (set via Dashboard or `vercel env add`),
never in the client bundle.

---

## Appendix B: Rejected Options

**Firebase Realtime Database for collaboration:** Firebase is free at low usage but its data model
(JSON tree with path-based updates) maps poorly to your Zustand store structure. Liveblocks
is a better fit.

**Cloudinary for texture hosting:** Cloudinary has transformation CDN features but their free tier
(25 credits/month) is consumed quickly with texture conversions. Cloudflare R2 with manual KTX2
pre-conversion is simpler and cheaper.

**Running nerfstudio on a VPS:** A NeRF training run needs 6+ GB VRAM and takes 30–45 minutes.
Google Colab's free T4 GPU is a better option than paying $0.50/hour for a GPU VPS for occasional
use.

**WebGPU for in-browser path tracing:** Three.js has experimental WebGPU support. Path tracing in
the browser (via `three-gpu-pathtracer`) produces photorealistic renders but requires 2–10 minutes
per frame at 1080p in a browser tab, with no progress feedback. The headless Node approach
(Section 1) is faster and more reliable.

**Supabase for persistence:** Your current localStorage + JSON export workflow covers all
persistence needs for a personal tool. Supabase adds a Postgres instance, row-level security, and
auth flows that are unnecessary overhead for a single-user tool. If you wanted to share layouts
via URL (e.g., `golf-planner.app/plan/abc123`), Supabase would be the right choice — but that's
a product feature, not a personal planning tool feature.
