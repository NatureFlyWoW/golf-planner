# Phase 3: Mobile + PWA Design

## Goal

Friends can use the golf planner on their phones — full editing, not just viewing. App is installable as a PWA.

## Architecture

Responsive breakpoint at `md: 768px`. Below = mobile layout with bottom toolbar and overlay panels. Above = current desktop layout unchanged. Single codebase, no separate mobile app. `isMobile` hint via `matchMedia('(pointer: coarse)')` for performance tuning only (not layout).

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Breakpoint | `md: 768px` | Tailwind v4 default, natural tablet/phone split |
| Orientation | Landscape preferred, portrait supported | Manifest says `landscape` but iOS ignores it; must handle portrait |
| Sidebar on mobile | Hidden, replaced by overlay panels | No room for 256px sidebar on phone |
| Touch model | Mode-based (tool determines gesture meaning) | Matches desktop, simpler than gesture disambiguation |
| Panel state | Unified `activePanel` field in UIState | Desktop and mobile interpret same state differently |
| PWA | Full (vite-plugin-pwa, offline, installable) | Friends should be able to "install" from browser |

---

## 1. Responsive Layout

### Desktop (>=md, unchanged)
```
┌─ Top Toolbar ──────────────────────────┐
├─ Sidebar (256px) ─┬─ Canvas ───────────┤
│  Holes/Detail/    │  R3F viewport      │
│  Budget tabs      │  + overlays        │
├───────────────────┴────────────────────┤
└─ LocationBar ──────────────────────────┘
```

### Mobile (<md, landscape)
```
┌────────────────────────────────────────┐
│                                        │
│         Full-screen R3F canvas         │
│       (no sidebar, no top toolbar)     │
│                                        │
├────────────────────────────────────────┤
│ [↖Sel] [+Plc] [✕Del] | [↩] [↪] | [···] │
└────────────────────────────────────────┘
```

### Mobile (<md, portrait fallback)
```
┌──────────────────┐
│                  │
│   R3F canvas     │
│  (hall rotated   │
│   to fit width)  │
│                  │
├──────────────────┤
│ [↖][+][✕]|[↩][↪]|[···] │
└──────────────────┘
```

### Visibility per breakpoint

| Component | Desktop (>=md) | Mobile (<md) |
|-----------|---------------|-------------|
| Top Toolbar | `flex` | `hidden` |
| Sidebar | `block` | `hidden` |
| Bottom Toolbar | `hidden` | `flex` |
| LocationBar | visible | `hidden` |
| MiniMap | visible | `hidden` |
| KeyboardHelp | visible | `hidden` |
| SunControls | visible | In overflow menu |

---

## 2. Bottom Toolbar

**Height:** 56px content + `env(safe-area-inset-bottom)` for iPhone home indicator.

**Primary rail (always visible):**
```
[↖ Select] [+ Place] [✕ Delete] | [↩ Undo] [↪ Redo] | [··· More]
```
- Icon-only with tiny label below each
- 48px minimum touch targets
- Active tool = blue background
- When placing: show selected hole type as colored chip next to Place button

**Overflow popover** (opens above "···" button, dismisses on outside tap):
```
┌─────────────────────┐
│ [Snap]    [Flow]    │
│ [2D/3D]   [Sun]    │
│ [Save]    [Export]  │
└─────────────────────┘
```
- Toggle buttons show on/off state
- Badge on "···" button when any toggle is active

---

## 3. Mobile Panels

### Unified state

Add to UIState: `activePanel: 'holes' | 'detail' | 'budget' | null`

- Desktop: `activePanel` ignored, sidebar uses `sidebarTab` as today
- Mobile: `activePanel` controls which overlay is shown

### Hole Library — Bottom Drawer (40% height)

**Why drawer, not full-screen:** User needs to see the canvas to understand spatial context before choosing a hole type. The drawer leaves 60% of the screen as canvas.

**Flow:**
1. Tap "Place" button in toolbar → opens drawer with hole type list
2. Tap a hole type → drawer closes, Place mode active, type chip shown in toolbar
3. Tap canvas → ghost appears at tap point with collision feedback → confirms placement
4. Tap Place button again → re-opens drawer to pick different type
5. Tap chip "X" → cancels placement, returns to Select mode

### Detail Panel — Full-Screen Overlay

**Trigger:** Explicit tap only. When a hole is selected, a small info chip appears in the toolbar area (`"Hole 3 · Straight"`). Tapping the chip opens the full Detail overlay. NOT auto-opened on selection (too disruptive for rapid repositioning).

**Content:** Same as desktop Detail panel but with larger touch targets:
- Name input
- Par input
- Rotation: large 44px preset buttons (0/90/180/270) as primary, numeric input secondary
- Position display
- Delete button (prominent red, with confirmation)
- Close button (top-right)

### Budget — Full-Screen Overlay

Triggered from overflow menu. Still a stub.

---

## 4. Touch Interaction Model

### Mode-based (tool determines gesture meaning)

| Tool | One finger on canvas | One finger on hole | Two fingers |
|------|---------------------|--------------------|-------------|
| Select | Pan (OrbitControls) | Select, then drag after 10px deadzone | Pinch zoom + pan |
| Place | Ghost at tap point → confirm on release | Pan | Pinch zoom + pan |
| Delete | Nothing | Delete hole | Pinch zoom + pan |

### OrbitControls changes

- Top-down: Set `touches.ONE = THREE.TOUCH.PAN` (currently undefined)
- 3D view: `touches.ONE = THREE.TOUCH.ROTATE` (unchanged)
- Holes stop propagation on their pointer events (already done)

### Ghost preview on mobile

Ghost preview works on both platforms:
- Desktop: follows pointer (hover), green/red collision feedback
- Mobile: appears at `pointerDown` position, shows collision color. On `pointerUp` (if pointer moved <10px screen pixels), confirms placement. If moved >10px, cancels (was a pan gesture).

### Drag deadzone

Track `pointerDown` position in **screen pixels** (`e.nativeEvent.clientX/Y`). Only transition to dragging state when `Math.hypot(dx, dy) > 10`. Prevents accidental drags from selection taps.

### Rotation handle

- Mobile: enlarge hit sphere from 0.12 to 0.35 radius
- Desktop: keep current 0.12 radius
- Rotation presets in Detail panel are the primary mobile mechanism

---

## 5. Performance Tuning

### Detection

```ts
const isMobile = window.matchMedia('(pointer: coarse)').matches;
```

One-time check at module load. Used as hint for rendering settings, not layout.

### Rendering

| Setting | Desktop | Mobile |
|---------|---------|--------|
| DPR | `[1, 2]` | `[1, 1.5]` |
| Antialias | `true` (default) | `false` |
| Ring geometry segments | 64 | 32 |
| Sphere geometry segments | 16x16 | 8x8 |

### CSS

Add to `index.css`:
```css
html, body {
  overscroll-behavior: none;
}
```

Add to canvas container in `App.tsx`:
```tsx
style={{ touchAction: 'none' }}
```

Add to `index.html`:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
```

---

## 6. PWA Setup

### vite-plugin-pwa

```ts
VitePWA({
  registerType: 'autoUpdate',
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
    runtimeCaching: [{
      urlPattern: /^https:\/\/tile\.openstreetmap\.org\//,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'osm-tiles',
        expiration: { maxEntries: 100, maxAgeSeconds: 604800 },
      },
    }],
  },
  manifest: {
    name: 'Golf Planner',
    short_name: 'Golf',
    theme_color: '#1d4ed8',
    background_color: '#f3f4f6',
    display: 'standalone',
    orientation: 'landscape',
    icons: [
      { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ],
  },
})
```

### Cache strategy

- **App shell:** Precache all JS/CSS/HTML (client-only app, no API)
- **OSM tiles:** StaleWhileRevalidate, 100 entries, 7-day max age
- **localStorage:** Untouched by service worker (Zustand persist works offline)

### Icons

Generate simple icons: blue square with white "G" letter. 192px and 512px sizes. Place in `public/`.

### WebGL context loss (iOS)

Low priority. Add `webglcontextlost`/`webglcontextrestored` listeners on canvas. On restore, call `invalidate()`. In practice users just reload.

---

## Definition of Done

- App works on mobile phones in landscape (primary) and portrait (fallback)
- Bottom toolbar with 6 primary actions + overflow popover
- Hole library as bottom drawer, Detail as full-screen overlay
- Touch: tap-to-select, drag-to-move (with deadzone), two-finger pan/zoom
- Ghost preview with collision feedback works on touch
- PWA installable with offline support
- DPR capped, antialias off, geometry reduced on mobile
- All existing desktop functionality unchanged
