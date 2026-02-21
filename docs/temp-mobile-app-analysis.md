# Golf Planner — Native Mobile Capabilities Analysis

**Date:** 2026-02-21
**Scope:** Feasibility assessment of native mobile capabilities for the Golf Planner PWA
**Property:** Gewerbepark 17, 4201 Gramastetten — 48.3715°N, 14.2140°E, 526m elevation
**Hall:** 10m × 20m BORGA steel hall, walls 4.3m, roof pitch 7°
**Audience:** Personal planning tool for a small group — not a commercial product

---

## Executive Summary

The current PWA is already well-positioned for a personal planning tool. The honest
engineering answer is: **most transformative features are achievable without going
native, but the single highest-value feature (AR site visit) requires native APIs
that PWAs cannot access reliably.** The pragmatic path is a staged approach — exhaust
WebXR first, then evaluate Capacitor if AR proves worth the overhead for a personal
tool used by ~5 people.

The analysis below quantifies each capability claim. Feasibility ratings use:
- **GREEN**: Achievable in current PWA with modest effort
- **YELLOW**: Achievable in PWA with significant effort or meaningful limitations
- **ORANGE**: Requires Capacitor/native bridge, otherwise severely degraded
- **RED**: Requires fully native app (Swift/Kotlin) for acceptable quality

---

## 1. AR Visualization

### The Core Feature: Visit the Site, See the Hall

The scenario: you drive to Gewerbepark 17, open the app, point your phone at the
field, and a 10m × 20m building appears overlaid on the actual ground.

This is the highest-ceiling feature and also the hardest to execute correctly.

### 1.1 GPS + Compass Accuracy — The Fundamental Problem

Before evaluating frameworks, establish what the sensors can actually deliver.

**GPS horizontal accuracy:**
- Consumer phone GPS (no differential): ±3–5m typical, ±10–15m degraded
- A-GPS with good sky view: ±2–3m
- At Gramastetten (48.37°N), HDOP is typically favorable
- The BORGA hall is 10m × 20m — GPS error of 5m is 50% of the hall width

**Magnetometer (compass) accuracy:**
- Uncalibrated: ±5–15° typical, up to ±30° near metal structures
- The BORGA hall is a steel building. Metal interference will be severe.
- A 10° compass error at 10m distance = ~1.7m lateral offset in the AR overlay
- A 15° error = ~2.7m lateral offset — the wall of the hall is visually wrong

**Conclusion on GPS+compass AR placement:**
Placing a 10m × 20m building footprint via GPS + compass alone will produce results
that look plausibly correct from 20–50m away but will feel noticeably wrong at close
range (< 10m). This is acceptable for "roughly where the hall will be" but not
acceptable for "I am standing inside the planned hall looking at hole 7."

The mitigation is **marker-based AR** (QR codes or image targets placed at known
survey points on the ground), which decouples placement from GPS accuracy entirely.
This is the approach used by professional site survey tools.

### 1.2 WebXR (PWA path)

**API:** `WebXR Device API` — `immersive-ar` session mode

**Browser support (as of early 2026):**
- Android Chrome: Full `immersive-ar` support since Chrome 81. ARCore underlies it.
- Safari/iOS: `immersive-ar` still not supported. Apple has `quick-look` for USDZ
  only — not programmable real-time AR. WebXR `immersive-ar` is behind a flag even
  in Safari 18.
- Firefox: No mobile implementation.

**What WebXR AR gives you on Android (via ARCore):**
- Hit testing against detected planes (floor, walls)
- Anchors — place virtual objects that stay in world space as camera moves
- Light estimation — ambient light intensity from camera
- Depth API (ARCore 1.18+) — sparse depth map
- Image tracking — detect and track printed image targets

**What WebXR AR does NOT give you:**
- Room-scale tracking quality of native ARKit (the WebXR path has higher latency
  and less robust plane detection)
- LiDAR access — no WebXR API exposes the LiDAR depth sensor
- Camera feed control — you can render on top of the camera pass-through but
  cannot access raw frames (no Photo → 3D pipeline)
- Persistent anchors across sessions (no Cloud Anchors in WebXR standard)

**PWA + WebXR feasibility for the site-visit scenario:**
- Android users: YELLOW — functional but iOS users (likely most of this group
  given Austria demographics) are excluded
- iOS users: RED via WebXR — not available

**Specific implementation for this app:**

```typescript
// Simplified WebXR AR session initiation
async function startARSession(renderer: THREE.WebGLRenderer) {
  if (!navigator.xr) throw new Error("WebXR not supported");

  const session = await navigator.xr.requestSession("immersive-ar", {
    requiredFeatures: ["hit-testing", "anchors"],
    optionalFeatures: ["image-tracking", "light-estimation", "depth-sensing"],
  });

  // Set up hit testing against detected planes
  const viewerSpace = await session.requestReferenceSpace("viewer");
  const hitTestSource = await session.requestHitTestSource({ space: viewerSpace });

  // On hit: place hall model anchor at ground intersection
  // Use existing THREE.js hall geometry — it's already the right scale
}
```

The existing R3F hall model (Hall.tsx, HallFloor.tsx, HallWalls.tsx) could be
rendered into a WebXR session on Android with moderate effort. The scene already has
correct metric dimensions (10m × 20m) so scale would be correct automatically.

### 1.3 Native ARKit/ARCore via Capacitor

**Capacitor** is a thin native bridge that wraps a web app in a native shell.
It gives you native plugin access while keeping the React/TypeScript codebase intact.

**AR via Capacitor — two plugin paths:**

**Path A: `@capacitor-community/camera-preview` + WebXR session handoff**
Not actually better than pure WebXR — you still need the XR session for world tracking.

**Path B: Native AR plugin that exposes ARKit/ARCore to JS**
- `capacitor-arkit` (community): Provides ARKit plane detection and anchor placement.
  Returns hit-test results as { x, y, z } world coordinates into JS.
- `@capacitor/ar` (unofficial Ionic plugin): Similar, ARKit 2+ and ARCore 1.9+.
- Neither is production-grade or actively maintained (last releases 2022–2023).
- Best realistic option is a **custom Capacitor plugin** — ~200 lines of Swift +
  ~150 lines of Kotlin — that exposes ARKit/ARCore hit testing to JS, then renders
  the hall using the existing Three.js scene in an overlay WebGL canvas.

**Native ARKit quality (iPhone 12+ with no LiDAR, iPhone 13 Pro+ with LiDAR):**
- Plane detection: robust within ~2s of pointing at a flat surface
- Tracking: 6DoF, sub-centimeter precision in tracking (drift, not absolute position)
- No GPS dependency — the AR session is camera-relative, not GPS-relative
- LiDAR (iPhone 13 Pro+): instant plane detection, depth occlusion, real-time mesh

**The key insight on GPS vs camera-relative AR:**
For the site-visit scenario, the most useful mode is NOT GPS-anchored AR.
It is camera-relative AR: place a marker (a printed A4 sheet with a QR/image target)
at the corner of the intended hall, point phone at marker, hall appears. This approach
is GPS-independent, works on both iOS and Android, and is far more accurate than GPS.

### 1.4 Room-Scale AR Walkthrough

Scenario: you're inside the planned hall boundary (or inside the built hall after
construction), phone tracking lets you "walk through" and see virtual holes in place.

**Feasibility:** ORANGE (requires native AR session, not WebXR on iOS)

ARKit's world tracking provides the required tracking quality. The existing hole
data (positions, rotations from Zustand store) maps directly to ARKit anchors —
each hole's (x, z) position in hall coordinates becomes an AR world anchor at the
equivalent real-world position (assuming the hall origin is established via an anchor).

Room-scale AR walkthrough is the most experientially compelling feature of the list
and also the most complex to implement correctly. It requires:
1. Establishing a hall-origin anchor (via marker or manual placement)
2. Computing transforms from hall coordinates to ARKit world coordinates
3. Rendering the 11 segment types (already built) as AR overlays

The existing segment geometry from `createSegmentGeometries()` and the chain
computation from `computeChainPositions()` would be directly reusable.

### 1.5 LiDAR Terrain Scanning (iPhone 13 Pro+)

LiDAR is available on iPhone 13 Pro, 14 Pro, 15 Pro, 15 Pro Max, 16 Pro, 16 Pro Max.

**What it can do at the Gramastetten site:**
- Generate a dense point cloud of the ground surface within ~5m radius
- Detect terrain undulations, slopes, obstacles
- Produce a mesh that could inform whether ground leveling is needed

**WebXR depth API:** Returns a 120×90 pixel depth buffer — too sparse for terrain modeling.

**Native LiDAR access:** RealityKit/ARKit on iOS exposes `ARMeshAnchor` with full
mesh geometry. This can be exported as USDZ or as raw vertex data.

**Practical value for this project:** Medium. The hall site needs leveling for a
concrete slab regardless — terrain irregularities under a few centimeters don't affect
planning. The more useful application would be scanning the *interior* after
construction to verify hole placement matches the plan.

**Implementation path:** Custom Capacitor plugin exposing `ARMeshAnchor` data to JS,
or native iOS app with RealityKit that exports the mesh as OBJ/PLY for import into
the planning tool.

### 1.6 AR Feasibility Summary

| Scenario | PWA/WebXR | Capacitor | Native |
|---|---|---|---|
| Android GPS-placed hall footprint | YELLOW | YELLOW | GREEN |
| iOS GPS-placed hall footprint | RED | ORANGE | GREEN |
| Marker-based hall placement (iOS + Android) | YELLOW (Android) / RED (iOS) | GREEN | GREEN |
| Room-scale hole walkthrough | RED | ORANGE | GREEN |
| LiDAR terrain scan | RED | ORANGE | GREEN |
| LiDAR interior verification scan | RED | RED | GREEN |

---

## 2. Camera Integration

### 2.1 Photo Capture

**Current PWA capability:** `<input type="file" accept="image/*" capture="environment">`
triggers the native camera on iOS and Android from a web page. This is GREEN — it
works today with zero additional code.

**What you can do with the captured photo in PWA:**
- Display alongside the 3D render for reference comparison
- Send to a cloud API for processing (depth estimation, segmentation)
- Use as a texture in the Three.js scene (environment map, backdrop)

**Limitations of the PWA camera approach:**
- One-shot capture only — no live camera feed in the app
- No access to RAW or depth data
- No control over exposure, focus, or depth-of-field metadata
- iOS: Safari restricts `getUserMedia` resolution to 720p in some contexts

**Native camera access (Capacitor `@capacitor/camera`):**
- Full camera roll access and live preview
- HEIC/HEIF format support (important for depth maps from iPhone Portrait mode)
- Portrait mode depth data (available via AVDepthData on iOS) — enables depth-from-photo
- Photo metadata (GPS, compass heading, timestamp) — useful for site photos with orientation

### 2.2 Photo Composite with 3D Hall Render

The simplest useful version: capture a photo of the site, display it as a background
plane in the 3D scene, overlay the hall model on top with manual alignment.

**Implementation in current codebase:**
```typescript
// In ThreeCanvas.tsx — add a background plane with the photo as texture
const photoTexture = new THREE.TextureLoader().load(capturedPhotoDataUrl);
// Create a plane at y=-0.01 behind the hall, sized to match camera FOV
// User drags/scales to align horizon line with hall footprint
```

This is achievable in the current PWA with ~200 lines of new code. The value is
moderate — you get a visual "does it fit?" check but not AR precision.

### 2.3 Photo to 3D: Depth Estimation

**MiDaS / ZoeDepth (monocular depth estimation):**
- Both are neural networks that estimate depth from a single RGB image
- ZoeDepth achieves metric depth estimates (actual meters, not relative)
- MiDaS v3.1 runs at ~80ms/image on a phone CPU via ONNX Runtime Web

**Feasibility in PWA:** YELLOW
- ONNX Runtime Web (`onnxruntime-web`) runs in browsers via WebAssembly
- MiDaS small model is ~100MB — too large for a PWA that targets <50MB
- ZoeDepth (metric) is ~200MB — not viable for a PWA
- A cloud API approach (upload photo, get depth map back) is more practical
- MediaPipe's `depth_anything` model is ~30MB and runs on-device — borderline viable

**What terrain depth data would actually tell you:**
The site at Gewerbepark 17 appears to be a commercial park on a 526m plateau in
the Mühlviertel. Ground irregularities at a prepared commercial site are likely
under 10–20cm. Monocular depth estimation accuracy on outdoor terrain is ±15–30%
of depth — at 5m distance, that is ±75–150cm — far worse than the terrain variation
itself. This feature has low practical value for this specific project.

### 2.4 Video Recording with AR Overlay

**PWA capability:** `MediaRecorder` API can record from a canvas. The R3F canvas
can be captured directly:
```typescript
const stream = renderer.domElement.captureStream(30); // 30fps
const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
```

This gives you a screen recording of the 3D viewport. Not true AR video, but useful
for creating "flythrough" videos of the planned hall layout to share with friends.

**True AR video (camera feed + 3D overlay recorded together):**
Requires native. `RPScreenRecorder` (iOS ReplayKit) or `MediaProjection` (Android)
from a Capacitor plugin captures the full composited output.

### 2.5 Panoramic Capture for HDRI Environment Map

**What this would enable:** Actual lighting from the Gramastetten site used in the
3D render instead of the synthetic sun position. The 3D hall interior would reflect
real sky conditions.

**Practical path:** Google Street View's camera API and iPhone's native panorama
produce equirectangular images. If the photo is captured and the user selects it as
the scene environment, Three.js can load it as an `EquirectangularReflectionMapping`
texture. The SunIndicator and UVEffects components would remain — the HDRI just
replaces the procedural sky.

**Effort:** ~150 lines of code in the current PWA. Moderate value — the blacklight
interior (UV mode) is what the hall will actually look like, not outdoor lighting.

---

## 3. Location-Aware Features

### 3.1 Geofence: On-Site Mode

**PWA feasibility:** YELLOW (foreground only)

The Geolocation API works in PWA: `navigator.geolocation.watchPosition()`.
Gramastetten coordinates are already in `constants/location.ts`: 48.3715°N, 14.214°E.

```typescript
// Add to a useGeofence hook
function useGeofence(targetLat: number, targetLng: number, radiusMeters: number) {
  const [onSite, setOnSite] = useState(false);

  useEffect(() => {
    const id = navigator.geolocation.watchPosition((pos) => {
      const dist = haversine(pos.coords.latitude, pos.coords.longitude, targetLat, targetLng);
      setOnSite(dist < radiusMeters);
    }, undefined, { enableHighAccuracy: true });
    return () => navigator.geolocation.clearWatch(id);
  }, [targetLat, targetLng, radiusMeters]);

  return onSite;
}
```

A 50m geofence radius around the property coordinates would reliably trigger at the
site (GPS error is ±3–5m, well within a 50m fence). On-site mode could:
- Auto-set the date to "today" for accurate sun position (already uses `new Date()` by default)
- Enable an "On Site" badge in the UI
- Unlock site-specific features (AR button, photo capture shortcuts)
- Prompt "You're at the site! Do you want to switch to on-site mode?"

**Limitation:** PWA geofencing does not work when the app is backgrounded/closed.
Background geofencing requires native (iOS significant location changes, Android
Geofencing API). For a personal planning tool, foreground-only is acceptable.

**Implementation effort:** ~100 lines. HIGH value for LOW cost — this is the
easiest "wow" feature to add.

### 3.2 Real-Time Sun Position (Already Implemented)

The app already has `useSunPosition.ts` using SunCalc with the actual Gramastetten
coordinates. The `LOCATION` constant has the correct lat/lng.

**What's missing:** The app uses a fixed date (`sunDate` in UIState) rather than
the actual current time when on site. The "now" mode already exists (passing no date
to `useSunPosition`). An on-site mode trigger from geofencing could auto-activate
"now" sun mode.

This is already GREEN — no additional work needed beyond the geofence trigger.

### 3.3 Compass-Aligned Views

**The feature:** Phone compass heading drives the 3D camera azimuth. You physically
rotate your body and the hall view rotates to match.

**API:** `DeviceOrientationEvent` — available in browsers on iOS (requires explicit
permission request since iOS 13) and Android (auto-granted).

```typescript
// useCompassAlignment hook
function useCompassAlignment(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    // iOS 13+ requires permission
    if (typeof DeviceOrientationEvent !== "undefined" &&
        "requestPermission" in DeviceOrientationEvent) {
      DeviceOrientationEvent.requestPermission();
    }

    function handleOrientation(e: DeviceOrientationEvent) {
      const heading = e.alpha; // degrees, 0=north on iOS, but varies by browser
      // Update camera azimuth in Zustand store
      useStore.getState().setCameraHeading(heading);
    }

    window.addEventListener("deviceorientation", handleOrientation);
    return () => window.removeEventListener("deviceorientation", handleOrientation);
  }, [enabled]);
}
```

**Accuracy:** `DeviceOrientationEvent.alpha` uses the magnetometer. Same metal
interference caveat as the AR compass case. At the actual site (pre-construction),
accuracy should be ±5–10°. The compass alignment mode should be a toggle, not
always-on — it conflicts with OrbitControls pan.

**Feasibility:** GREEN — pure browser API, no native required.

**Integration with existing camera:** The R3F OrthographicCamera and OrbitControls
would need a "follow compass" mode where the azimuth is overridden by the device
heading. When enabled, two-finger pan still works but the view azimuth follows the
compass. This requires a custom camera controller replacing OrbitControls in this mode.

### 3.4 GPS Site Visit Log

**Feature:** Record a timestamped log of site visits with GPS position, compass
heading, and optional notes. Display on a mini-map overlay.

**Implementation:** Pure PWA — `Geolocation API` + Zustand persistence.
A `SiteVisits` slice in the store: `{ timestamp, lat, lng, heading, note, photos[] }`.
Photos stored as base64 in localStorage (keep them small — resize to 640px max
before storage to stay within the 5–10MB localStorage budget).

**Feasibility:** GREEN with one caveat — photo storage will hit localStorage limits
quickly if photos are full-resolution. Use IndexedDB instead for photo blobs.

---

## 4. Haptic and Sensor Integration

### 4.1 Haptic Feedback

**PWA capability:** `navigator.vibrate()` — the Vibration API.

```typescript
// Haptic patterns for the app
const Haptics = {
  snap: () => navigator.vibrate(10),           // Short 10ms pulse for grid snap
  collision: () => navigator.vibrate([10, 50, 10]), // Double pulse for invalid placement
  confirm: () => navigator.vibrate(50),         // 50ms for placement confirmation
  delete: () => navigator.vibrate([20, 30, 20, 30, 60]), // Warning pattern for delete
};
```

**iOS limitation:** `navigator.vibrate()` is NOT supported on iOS Safari/PWA.
Apple blocks the Vibration API entirely. This is a known and long-standing restriction.

**Android:** Works well in Chrome on Android. The vibration patterns above would
work on Android devices.

**Native haptics (Capacitor `@capacitor/haptics`):**
- iOS: Full Taptic Engine access — `ImpactFeedbackStyle.Light/Medium/Heavy`,
  `NotificationFeedbackType.Success/Warning/Error`, selection feedback
- Android: `HapticsImpact` and `HapticsVibrate` with ms duration

This is one of the strongest arguments for Capacitor if iOS support matters.
The Taptic Engine on iPhone is significantly more expressive than `navigator.vibrate()`.
Snap-to-grid confirmation with a soft tap, collision with a warning tap, deletion with
a heavy thud — these small details dramatically improve feel on iOS.

**Assessment:** ORANGE — Capacitor adds real value here for iOS specifically.

### 4.2 Gyroscope-Driven 3D View

**Feature:** Tilt the phone to rotate the 3D viewport.

**API:** `DeviceOrientationEvent` (same as compass, section 3.3) gives beta (tilt
forward/back) and gamma (tilt left/right).

```typescript
function useGyroscopeCamera(enabled: boolean, camera: THREE.Camera) {
  useEffect(() => {
    if (!enabled) return;

    function handleOrientation(e: DeviceOrientationEvent) {
      const tilt = e.beta ?? 0;   // -180 to 180, 0=flat
      const roll = e.gamma ?? 0;  // -90 to 90

      // Map to polar/azimuth angles for the R3F camera
      const polar = THREE.MathUtils.clamp(
        THREE.MathUtils.degToRad(tilt - 30), // offset: 30° natural hold angle
        Math.PI / 8,   // min: not straight down
        Math.PI * 0.4, // max: not too low
      );
      // Update OrbitControls target angles
    }

    window.addEventListener("deviceorientation", handleOrientation, true);
    return () => window.removeEventListener("deviceorientation", handleOrientation, true);
  }, [enabled, camera]);
}
```

**Feasibility:** GREEN — pure browser API, both iOS and Android.

**UX consideration:** Gyroscope camera conflicts with normal device holding behavior.
This should be a toggle button (e.g., a gyroscope icon in the overflow menu).
When active, OrbitControls is disabled and camera angles track device orientation.
This is compelling in 3D view mode — tilt to look down at holes, rotate to see
from different angles — but counterproductive in the top-down planning view.

**One-line integration:** The existing `ThreeCanvas.tsx` uses `frameloop="demand"`.
Gyroscope events need to call `invalidate()` to trigger re-renders, same as the
existing pointer event pattern.

### 4.3 Ambient Light Sensor

**API:** `AmbientLightSensor` (Generic Sensor API)

**Browser support:** Chrome on Android only (behind a flag, not widely enabled).
iOS: not supported. Firefox desktop: partial. No mobile support.

**Verdict:** RED — not viable as a feature given near-zero browser support.

The fallback is manual toggle (already implemented as UV mode toggle). If the user
is physically in the dark hall in blacklight, they can tap the UV toggle. Auto-
detection via ambient light is not worth implementing given the API's availability.

---

## 5. Sharing and Collaboration

### 5.1 Native Share Sheet

**PWA capability:** `Web Share API` — supported in Safari iOS 12.1+ and Chrome Android.

```typescript
async function shareLayout() {
  const canvas = document.querySelector("canvas") as HTMLCanvasElement;
  const blob = await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b!), "image/png")
  );

  await navigator.share({
    title: "Golf Hall Layout — Gramastetten",
    text: `Planning layout for our ${useStore.getState().holes.length}-hole blacklight golf hall`,
    files: [new File([blob], "golf-layout.png", { type: "image/png" })],
  });
}
```

**Feasibility:** GREEN — `navigator.share` works in Safari PWA and Chrome PWA.
File sharing (images) works on iOS 15+ and Android Chrome 76+.

The existing `ScreenshotCapture.tsx` component already captures the canvas. Wiring
this to `navigator.share` is ~30 lines.

**What gets shared:** A PNG screenshot of the current 3D view. High visual quality
given the UV bloom effects and the blacklight theme. When shared to WhatsApp or
iMessage, it appears as a rich image preview.

### 5.2 Deep Links

**PWA deep link to a specific layout:**

Deep links in a PWA require either:
- URL hash encoding: `https://golf-planner.vercel.app/#layout=base64encodedState`
- URL parameters with Vercel rewrite rules
- A server-side storage with a short code: `/share/abc123`

The current app has no server — everything is client-only localStorage. The simplest
deep link is URL-hash encoding of the entire Zustand store state:

```typescript
function generateShareUrl(): string {
  const state = useStore.getState();
  const exportPayload = buildExportData(state);
  const encoded = btoa(JSON.stringify(exportPayload));
  return `${window.location.origin}/#/share/${encoded}`;
}
```

For a 14-hole layout, the JSON is approximately 8–12KB. Base64 encoded: ~16KB.
URL length: ~16,000 characters. This exceeds URL length limits in some browsers
(Chrome limit is 2MB, Safari is ~80KB, most servers ~8KB). For layouts under 5KB
JSON (under 12 holes with minimal template data), URL encoding works. For larger
layouts, a server-side share code is needed.

Given the app is currently Vercel static hosting, adding a KV store (Vercel KV,
which uses Upstash Redis) would enable proper short-URL sharing. This would be a
meaningful architectural addition but is achievable without going native.

**Assessment:** YELLOW — URL encoding works for small layouts, server needed for
full layouts.

### 5.3 Video Flythrough Export

Already covered in section 2.4. The `MediaRecorder` approach works in-browser.
For a higher-quality export, `CCapture.js` or `ffmpeg.wasm` can produce MP4 output
at a controlled frame rate.

A smooth camera flythrough requires a scripted animation: camera interpolates around
the hall over ~30 seconds, recording each frame. This is buildable in the current
R3F scene with `useFrame` + camera lerp + MediaRecorder.

**Feasibility:** GREEN for WebM, YELLOW for MP4 (requires ffmpeg.wasm, ~30MB download).

### 5.4 iMessage / WhatsApp Rich Previews

Rich link previews (the image card that appears in iMessage/WhatsApp) are generated
server-side from Open Graph meta tags. For a static Vercel site:

```html
<!-- In index.html -->
<meta property="og:image" content="https://golf-planner.vercel.app/og-preview.png">
<meta property="og:title" content="Golf Planner — Gramastetten Blacklight Hall">
<meta property="og:description" content="14-hole indoor blacklight mini golf layout">
```

For dynamic previews per-layout (showing the actual layout screenshot), a Vercel
serverless function with Satori/Puppeteer can generate per-share OG images.
This requires the server-side share URL infrastructure mentioned in 5.2.

---

## 6. PWA vs Native Trade-offs — Pragmatic Assessment

### 6.1 What the PWA Already Has

The current app (PWA v1.2.0) already provides:
- Offline operation (service worker, all assets cached)
- Installable on home screen (iOS: Add to Home Screen; Android: native install prompt)
- Responsive mobile layout (bottom toolbar, overlay panels, touch gestures)
- Pan/pinch/zoom touch interactions on the 3D canvas
- Real sun position from actual Gramastetten coordinates
- UV/blacklight mode preview
- All 10 phases of planning features (hole builder, budget, cost estimation, etc.)

For a group of ~5 friends planning a personal project, this is likely sufficient.

### 6.2 Feature Capability Matrix

| Feature | PWA Today | PWA + Code | Capacitor | Native |
|---|---|---|---|---|
| Geofence on-site trigger | No | GREEN (100 LOC) | GREEN | GREEN |
| Compass-aligned view | No | GREEN (150 LOC) | GREEN | GREEN |
| Gyroscope camera | No | GREEN (100 LOC) | GREEN | GREEN |
| Native share sheet (image) | No | GREEN (30 LOC) | GREEN | GREEN |
| Deep link sharing | Partial | YELLOW (200 LOC) | GREEN | GREEN |
| Video flythrough export | No | GREEN (300 LOC) | GREEN | GREEN |
| Photo backdrop for planning | No | GREEN (200 LOC) | GREEN | GREEN |
| Haptic feedback (Android) | No | GREEN (50 LOC) | GREEN | GREEN |
| Haptic feedback (iOS) | No | RED | GREEN | GREEN |
| AR site visit (Android) | No | YELLOW (1000 LOC) | ORANGE | GREEN |
| AR site visit (iOS) | No | RED | ORANGE | GREEN |
| Room-scale walkthrough | No | RED | ORANGE | GREEN |
| LiDAR terrain scan | No | RED | RED | GREEN |
| Ambient light sensor | No | RED | ORANGE | GREEN |
| Panoramic HDRI capture | No | YELLOW (150 LOC) | GREEN | GREEN |
| GPS site visit log | No | GREEN (200 LOC) | GREEN | GREEN |
| Monocular depth estimation | No | YELLOW (cloud API) | YELLOW | YELLOW |

### 6.3 Capacitor vs React Native

**Capacitor** wraps the existing web app in a WKWebView (iOS) or WebView (Android)
with native plugin bridges. The React/TypeScript/R3F code runs unchanged.

**React Native** replaces the web UI layer entirely. R3F for React Native exists
(`@react-three/fiber` supports React Native via `expo-gl`) but requires porting all
UI components from Tailwind/HTML to React Native components. Estimated porting effort:
60–80 engineering hours for the UI layer alone, plus another 20–30 hours for RN-
specific optimizations. This is not worth it for a personal tool.

**Capacitor assessment:**
- Effort to add: ~4 hours (install Capacitor, configure iOS/Android projects,
  test WebGL context in WKWebView)
- Key risk: WebGL (R3F) performance in WKWebView vs Safari PWA is nearly identical
  in modern iOS — no degradation expected
- Unlocks: iOS haptics (Taptic Engine), reliable camera access, background geofencing,
  AR plugin integration
- Requires: Mac for iOS builds, Xcode, Apple Developer account ($99/year),
  Google Play account ($25 one-time)
- Distribution: App Store (review required, 1–7 days) vs PWA (instant)

For a personal tool shared among friends, Capacitor's app store requirement adds
friction. TestFlight (iOS beta) or direct APK sideloading (Android) avoid the store
while providing native capabilities.

### 6.4 Recommended Path

**Stage 1 (Do Now — PWA additions, ~1–2 days total):**

Priority order based on value-to-effort ratio:

1. **Native share sheet** — 30 LOC, wires existing ScreenshotCapture to
   `navigator.share`. Highest value/effort ratio of any feature.

2. **Geofence on-site mode** — 100 LOC. Triggers when you're at Gewerbepark 17,
   shows a status indicator, activates "now" sun mode automatically. High delight
   factor for site visits.

3. **Compass-aligned camera** — 150 LOC. Toggle in overflow menu. Enables physically
   walking around the site and having the 3D view track your orientation.

4. **Gyroscope 3D camera** — 100 LOC. Toggle for 3D view mode. Natural complement
   to compass alignment.

5. **GPS site visit log** — 200 LOC. Timestamped visits with notes, stored in
   Zustand with persistence. Low complexity, useful over the project timeline.

6. **Photo backdrop** — 200 LOC. Drag-to-align site photo behind 3D hall model.
   More useful than it sounds for spatial "does it fit?" checks.

Total for Stage 1: ~780 LOC of new code, zero native dependencies, all PWA.

**Stage 2 (Evaluate after Stage 1 — Capacitor if needed, ~1–2 days setup):**

Add Capacitor only if:
- iOS haptic feedback matters to the group (it will, once they see it on Android)
- AR site visualization becomes a priority (requires Capacitor + custom AR plugin)

Capacitor setup itself is low-risk. The AR plugin for iOS is the hard part.

**Stage 3 (Only if AR is worth it — custom native AR, ~1–2 weeks):**

Build a custom Capacitor plugin that:
- Uses ARKit image tracking to detect a printed A4 marker at the site corner
- Returns the marker's world transform to JavaScript
- The JS layer places the hall model at that transform using existing Three.js geometry
- Room-scale walkthrough: each hole anchor computed from the hall-origin transform

This is the only feature that truly requires native code and cannot be approximated
in the PWA. It is also the feature with the highest "wow" factor — pointing a phone
at a QR code on the ground and seeing your 14-hole blacklight hall appear at full scale.

**What to skip entirely:**
- LiDAR terrain scanning (minimal practical value, very high complexity)
- Ambient light sensor (no usable browser API)
- Monocular depth estimation (poor accuracy for outdoor terrain, model too large)
- Full React Native port (porting cost exceeds any benefit for a personal tool)
- iMessage rich previews (requires server infrastructure, low priority)

---

## 7. Technical Specifics for the Gramastetten Site

### 7.1 Coordinate System

The hall is at 48.3715°N, 14.2140°E, elevation 526m.

The `constants/location.ts` has the correct coordinates. The sun position calculation
in `useSunPosition.ts` already uses these coordinates with SunCalc — this is working
correctly and does not need changes.

For the geofence, a 50m radius around these coordinates defines "on site." The
haversine distance at this location: 1° latitude ≈ 111.3km, 1° longitude ≈ 74.5km
(cosine-corrected for 48.37°N). A 50m radius is approximately ±0.00045° latitude
and ±0.00067° longitude. GPS accuracy of ±5m is easily within this fence.

### 7.2 Hall Orientation

The hall's long axis (20m dimension) runs approximately north–south based on the
parcel at Gewerbepark 17. The existing scene coordinate system (X+ = east, Z+ = south)
already models this correctly for the sun position calculations.

For compass-aligned view: when the phone compass reads 0° (north), the camera should
look straight down the 20m hall axis from the south end. The mapping from compass
heading to OrbitControls azimuth requires calibration against the actual site
orientation.

### 7.3 Elevation and GPS

At 526m elevation, GPS accuracy is slightly better than sea level (fewer atmospheric
effects) and the open Mühlviertel terrain means good satellite visibility. No urban
canyon effect. This is a favorable GPS environment — the 50m geofence will be reliable.

### 7.4 Metal Structure Interference

After the BORGA hall is built, the steel frame will cause significant compass
interference inside the building. The magnetometer can drift by 30°+ inside a steel
structure. Any compass-dependent feature (compass-aligned view, AR placement) should
include a calibration step and a visual accuracy warning when inside the hall.

---

## 8. Recommended Implementation Priority

### Quick Wins (Stage 1, pure PWA)

```
Week 1 additions to the existing codebase:

1. useGeofence hook + OnSiteMode component
   Files: src/hooks/useGeofence.ts, src/components/ui/OnSiteIndicator.tsx
   Integrates with: useSunPosition.ts (auto-enable "now" mode when on site)
   Store changes: none (ephemeral state only)

2. useCompassAlignment hook + toggle in overflow menu
   Files: src/hooks/useCompassAlignment.ts
   Integrates with: ThreeCanvas.tsx (camera azimuth override)
   Store changes: ui.compassAligned: boolean

3. shareLayout() via Web Share API
   Files: src/components/ui/ShareButton.tsx
   Integrates with: existing ScreenshotCapture.tsx
   Store changes: none

4. useGyroscope hook + toggle in overflow menu
   Files: src/hooks/useGyroscope.ts
   Integrates with: ThreeCanvas.tsx (camera polar/azimuth override in 3D mode)
   Store changes: ui.gyroscopeCamera: boolean

5. Site visit log (GPS + notes)
   Files: src/store/visitsSlice.ts, src/components/ui/SiteVisitLog.tsx
   Store changes: new visits slice (persisted)
```

### Stage 2 Assessment Gate

After Stage 1, the site-visit experience is:
- App opens, detects you're at Gewerbepark 17 ("You're on site!")
- Sun indicator updates in real time to current sky position
- Compass button aligns 3D view with actual north
- Gyroscope tracks phone orientation for 3D walkthrough
- Visit automatically logged with timestamp and GPS coordinates
- One-tap share of the current layout screenshot

This is a genuinely compelling on-site experience using only browser APIs.
Evaluate whether AR adds enough beyond this to justify Capacitor complexity.

### Stage 3: AR — If Pursuing

The specific implementation path for the highest-value AR scenario (marker-based
hall placement on iOS):

```
Capacitor setup:
  npm install @capacitor/core @capacitor/cli
  npx cap init "Golf Planner" "at.gramastetten.golfplanner"
  npx cap add ios
  npx cap add android

Custom iOS AR plugin (Swift):
  Sources/ARPlugin/ARPlugin.swift
  - ARSession with imageTracking configuration
  - Target image: printed A4 QR code with known size
  - On detection: return { transform: float[16], timestamp: number }
  - On loss: return null

JS layer (TypeScript):
  src/plugins/ARPlugin.ts
  - registerPlugin<ARPlugin>("ARPlugin")
  - startARSession(markerImageBase64: string): Promise<void>
  - onMarkerDetected(callback: (transform: Float32Array) => void): void
  - stopARSession(): Promise<void>

Three.js integration:
  src/hooks/useARPlacement.ts
  - Receives marker transform from plugin
  - Computes hall-coordinate-to-world-coordinate mapping
  - Updates R3F camera to follow ARKit camera transform
  - Places hall model at computed position
  - All existing hole geometry renders at correct AR world positions
```

The existing segment geometry and chain computation code are directly reusable.
No changes needed to the hole models, templates, or store structure.

---

## 9. File References for Implementation

Relevant existing files for Stage 1 additions:

- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/hooks/useSunPosition.ts` — pattern
  for sensor-based hooks, update interval pattern, SunCalc integration
- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/constants/location.ts` — coordinates
  for geofence center (lat: 48.3715, lng: 14.2140)
- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/ui/ScreenshotCapture.tsx` —
  canvas capture, integrate with Web Share API
- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/ThreeCanvas.tsx` —
  camera control integration point for compass/gyroscope
- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/ui/BottomToolbar.tsx` —
  mobile overflow menu, add compass/gyroscope toggles
- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/store/` — Zustand store slices,
  add visits slice and new UI state flags

---

## 10. Summary Decisions Table

| Question | Answer |
|---|---|
| Stay PWA or go native? | Stay PWA for Stage 1. Evaluate Capacitor only for AR or iOS haptics. |
| WebXR vs native AR? | WebXR for Android proof-of-concept. Native ARKit (via Capacitor plugin) for iOS quality. |
| React Native port? | No — R3F porting cost is not justified for a personal tool. |
| Highest value feature to add? | Geofence on-site detection + compass alignment. High impact, zero native deps. |
| AR worth pursuing? | Yes if the group does site visits. Marker-based (QR on ground) is far more accurate than GPS-based. |
| GPS precision enough for AR? | No — ±5m GPS error is too coarse for a 10m-wide building. Use image markers. |
| LiDAR terrain scanning? | Skip — minimal practical value for a prepared commercial site. |
| Ambient light sensor? | Skip — no usable browser API. Manual UV toggle is sufficient. |
| App store distribution needed? | No — TestFlight or PWA install is sufficient for ~5 users. |
| Timeline to Stage 1 completion? | ~2 days of coding given the existing codebase quality. |
