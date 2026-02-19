# Indoor mini golf hall in Gramastetten: feasibility and technical plan

**A 200m² BORGA steel hall can viably house 12–14 blacklight mini golf holes for roughly €180k–280k total investment, with a web-based 3D planning tool best built in React Three Fiber.** The project is technically and legally feasible, though the 200m² footprint sits right at the practical minimum for a commercial indoor mini golf venue. Austrian regulations are navigable — mini golf is explicitly exempted from several permit categories — and the blacklight (Schwarzlicht) format maximizes both the experience and revenue potential in this compact space. The 3D hall configurator would fill a genuine market gap: no web-based mini golf course design tool exists today.

## 12–14 holes fit the hall, but layout precision matters

The **10m × 20m hall** yields roughly **170–175m² of usable play area** after subtracting a reception zone (~15m²), wall clearances, and storage. HPS Playco, an Austrian blacklight mini golf specialist, states a minimum of 220m² for their installations — making this project tight but feasible with compact course formats.

The WMF (World Minigolf Sport Federation) recognizes four standardized course types, but the **MOS (Minigolf Open Standard)** category — approved in 2007 for non-standardized "adventure" courses — provides the flexibility needed here. MOS requires only a defined tee area, a hole of **10–12.7cm diameter**, minimum lane width of **0.5m**, and theoretical one-shot completability.

For this space, the optimal configuration uses **compact lanes of 2.5–3.3m length and 0.6m width**, each consuming roughly **9–13m² including walking paths**. Three realistic scenarios emerge:

| Configuration | Lane length | Holes | Space per hole | Comfort level |
|---|---|---|---|---|
| Compact (Kompact system) | 2.5m | 16–18 | ~9m² | Tight but viable |
| **Medium (recommended)** | **3.3m** | **13–15** | **~12m²** | **Good playability** |
| Comfortable (Hobby system) | 4.55m | 9–12 | ~15m² | Spacious feel |

The **serpentine/zigzag layout** is optimal for this rectangular hall: two parallel rows of holes along the 20m length with a **1.5–2m central walkway**, holes alternating direction so players weave back and forth. Start and finish should both terminate near the entrance. This avoids cross-traffic and naturally manages flow for groups of 4–6, staggered at 5–10 minute intervals.

Standard indoor obstacles include windmills, loop-de-loops, tunnels, ramps, banked curves, and themed props. For blacklight venues, UV-reactive paint transforms these into glowing features. Materials typically comprise fiber cement boards (15mm) for playing surfaces, L-shape galvanized steel frames for borders, and powder-coated aluminum or fiberglass for obstacles.

## Austrian permits are surprisingly straightforward for mini golf

The regulatory path is more favorable than one might expect. Three critical findings simplify the process:

**Mini golf is explicitly exempted** from the Betriebsanlagengenehmigung (operating facility permit) under Austrian trade law. The WKO Upper Austria explicitly lists "Minigolf-, Bahnengolfplätze" alongside bowling and tennis as leisure facilities not requiring this permit. Similarly, mini golf is **exempted from the Veranstaltungsstättenbewilligung** (event venue permit) under §1 Z7 of the OÖ Veranstaltungssicherheitsgesetz, as it is not considered inherently dangerous.

However, a **Baubewilligung (building permit) is mandatory** from the Bürgermeister of Gramastetten. The 200m² steel hall exceeds the 50m² threshold for simplified Bauanzeige procedures. Required documentation includes building plans by a qualified professional, an Energieausweis, structural calculations, and a fire safety concept. The process involves filing with the local building authority, a Bauverhandlung (hearing) with neighbors within 50m, and completion notification before opening.

**Zoning is the critical variable.** The plot must be in an appropriate Widmungskategorie — ideally **Kerngebiet** (commercial core) or **Gemischtes Baugebiet** (mixed use). Residential zones (Wohngebiet) and agricultural land (Grünland) are incompatible. Checking Gramastetten's Flächenwidmungsplan with the Gemeinde should be the project's **very first step**, as rezoning requires Gemeinderat approval and can take months.

Fire safety under OIB-Richtlinie 2 classifies this as a **Gebäudeklasse 1** freestanding single-story building. The steel structure (Baustoffklasse A1, non-combustible) satisfies the material requirement, though a Brandschutzplaner should confirm whether the unprotected BORGA frame needs R 30 fire-resistance treatment. PIR sandwich panels typically achieve B-s2,d0 classification — acceptable for GK 1 buildings and Versammlungsräume wall cladding (which requires minimum C-s2,d0). Key requirements include:

- **Two emergency exits** (the existing sectional door + PVC door satisfy this)
- **Maximum 40m travel distance** to any exit (the 22.4m diagonal fits easily)
- **Emergency lighting** (Sicherheitsbeleuchtung) per ÖNORM EN 1838: minimum **1 lux** on escape routes, battery-backed for 60 minutes — critical for a blacklight venue operating in near-darkness
- **Fire extinguishers** per TRVB 124 F: one 6kg ABC unit per ~200m²
- **No sprinklers required** for a 200m² single-story venue
- **Smoke extraction** via the four openable PVC windows (13.2m² total exceeds the 2% minimum)

Accessibility under OIB-Richtlinie 4 mandates **barrier-free access** for public buildings: threshold-free entrance (max 2cm), minimum 1.2m gangway width, 1.5m × 1.5m wheelchair turning circles, and at least **one accessible toilet** (min ~2.2m × 2.15m with grab rails, emergency call, and outward-opening door). The existing 0.9m PVC door marginally meets the minimum for main entrances.

If food or drinks are served, a separate **Gastgewerbeberechtigung** and Betriebsanlagengenehmigung for the gastronomy portion become necessary — filed with the Bezirkshauptmannschaft Urfahr-Umgebung rather than the Gemeinde.

## React Three Fiber is the clear choice for the 3D configurator

No web-based mini golf course design tool exists — not open-source, not commercial. Professional course designers at companies like Castle Golf, Harris Mini Golf, and COST of Florida all use traditional AutoCAD/Revit workflows with physical scale models. **This represents a genuine market gap** that a lightweight web tool could fill.

For the 3D isometric hall visualizer, **React Three Fiber (R3F)** is the definitive recommendation over raw Three.js or Babylon.js. The reasoning is structural: a configurator is fundamentally a **UI-heavy application** with a 3D viewport, not a 3D application with some UI. R3F's declarative React component model handles both seamlessly. It renders outside React's lifecycle (matching vanilla Three.js performance) while providing native pointer events for drag-and-drop, component composition for reusable building elements, and tight integration with React state management.

The recommended tech stack:

```
React 19 + TypeScript + Vite
├── @react-three/fiber      → 3D rendering engine
├── @react-three/drei       → OrthographicCamera, DragControls, Grid, Html overlays
├── three-bvh-csg           → Boolean operations for door/window wall cutouts  
├── zustand                 → State management (walls, doors, holes, selection)
│   └── zundo               → Undo/redo middleware (<700 bytes)
├── Tailwind CSS or Mantine → UI panels and toolbars
└── three                   → Underlying 3D engine
```

**Key implementation patterns** for modeling the BORGA hall:

**Wall cutouts** use Constructive Solid Geometry (CSG): create wall geometry, create door/window shapes, subtract them to produce walls with openings. The `three-bvh-csg` library by Garrett Johnson is the most performant option. The Pascal App project (pascal.app) demonstrates exactly this workflow in production and serves as an excellent architectural reference.

**Roof geometry** at 7° pitch can be built with `THREE.ExtrudeGeometry` using a trapezoidal cross-section extruded along the 20m hall length. **Isometric view** uses drei's `OrthographicCamera` with position `[10, 10, 10]` and `OrbitControls` with limited polar angle. **Grid-based placement** snaps mini golf elements to a 0.5m grid (20 × 40 = 800 cells), using raycasting against a ground plane for cursor detection.

For **state management**, Zustand + zundo provides built-in `undo()`, `redo()`, `pastStates[]`, and `futureStates[]`. Use `partialize` to exclude transient UI state (hover, selection) from undo history, and `zustand/middleware/persist` for auto-save to localStorage. Export options include **glTF/GLB** (Three.js's built-in `GLTFExporter`), **PDF floor plans** (orthographic render → `jsPDF`), and **JSON** configuration files.

**Mobile performance** is a non-issue for this project. A 10×20m hall with ~18 mini golf holes and walls totals well under **20,000 polygons** — far below the 50K–100K mobile budget. The critical optimization is R3F's `frameloop="demand"` setting, which only re-renders when state changes — ideal for a configurator where the scene is often static. Cap pixel ratio at 2 for mobile with `<Canvas dpr={[1, 2]}>`.

Reference open-source projects worth studying: **blueprint3d** (furnishup/blueprint3d on GitHub — 2D floorplan editor with 3D view), **Arcada** (React + Pixi.js + Zustand — modern architecture closest to this stack), and **threejs-3d-room-designer** (React + Three.js room planner with wall drawing and product placement).

## Blacklight format maximizes the 200m² space economically

**Schwarzlicht (blacklight) mini golf is strongly recommended** over standard lighting for three reasons: it commands **€9–14.50 per person** versus €3–8 for standard mini golf, it's enormously popular across the DACH region (dozens of successful venues in Austria and Germany), and a windowless steel hall is actually ideal for the format since complete darkness is required.

The lighting system requires **12–18 UV LED bars** (UV-A wavelength 350–370nm, 18–36W each) at €80–200 per unit, plus standard LED lighting for the reception area, DMX control, and mandatory emergency lighting. All four PVC windows must be completely blacked out. Total lighting budget: **€4,000–9,000**.

For heating, the calculated transmission and ventilation losses total approximately **15–18 kW** at design conditions (-15°C exterior, 18°C interior). The PIR panels' U-value of 0.22 W/m²K performs well, but the windows (U≈1.4), sectional door (U≈1.8), and ventilation represent significant heat losses. **Two to three commercial air-to-air heat pump split units** (e.g., Daikin or Mitsubishi) are the optimal solution at **€5,000–10,000 installed** — they heat in winter, cool in summer (loads reach 30°C+ at 620m altitude), and dehumidify to prevent condensation in the steel hall. Annual heating cost: approximately **€1,200–1,800**.

Since a blacklight venue cannot use openable windows for ventilation (they're blacked out), **mechanical ventilation with heat recovery is essential** — budget €3,000–6,000. For 30 occupants at 30m³/h each, the system must handle 900m³/h of fresh air. The electrical connection needs **20–25 kW three-phase** (400V) to cover HVAC, UV lighting, sound, and ancillary systems. Full electrical installation for the hall runs **€8,000–15,000**.

Sanitary facilities require a minimum of three WCs (one men's, one women's, one accessible) with an anteroom separating them from the play area. Budget **€10,000–20,000** including plumbing connections.

## Total investment ranges from €183k to €280k depending on ambition

Beyond the **€108,000 hall cost**, the buildout breaks into three realistic scenarios:

| Category | Budget/DIY | Mid-range pro | Premium turnkey |
|---|---|---|---|
| Mini golf course (12–18 holes) | €13,000–18,000 | €25,000–50,000 | €60,000–80,000 |
| Lighting (UV + emergency) | €4,000–6,000 | €6,000–9,000 | €8,000–12,000 |
| HVAC (heat pumps + ventilation) | €8,000–12,000 | €10,000–16,000 | €12,000–18,000 |
| Electrical installation | €8,000–12,000 | €10,000–15,000 | €12,000–18,000 |
| Plumbing and WC facilities | €10,000–15,000 | €12,000–18,000 | €15,000–20,000 |
| Interior theming and finishing | €5,000–10,000 | €15,000–35,000 | €30,000–50,000 |
| Sound, POS, furniture, equipment | €5,000–10,000 | €7,000–13,000 | €10,000–16,000 |
| Fire safety and emergency systems | €1,700–3,000 | €2,500–4,400 | €3,000–5,000 |
| Permits, architect, professional fees | €5,000–8,000 | €7,000–12,000 | €8,000–14,000 |
| Contingency (10%) | €6,000–9,400 | €9,500–17,000 | €15,800–23,300 |
| **Buildout subtotal** | **€66,000–103,000** | **€104,000–189,000** | **€174,000–256,000** |
| **Total with hall (€108k)** | **€174,000–211,000** | **€212,000–297,000** | **€282,000–364,000** |

The **biggest cost variable is theming**. UV graffiti by professional artists — which is what makes blacklight venues memorable — typically runs €150–300/m² of wall surface. For a 200m² hall with roughly 180m² of interior wall area, this alone can cost €10,000–30,000+. Prefab course elements from manufacturers like minigolfbau.eu start as low as €10,890 for 18 compact holes, while turnkey blacklight installations from specialists like Interactive Lasergames or City Golf Europe range from €50,000–80,000 including courses, wall art, lighting, and sound.

**Annual insurance** (Betriebshaftpflicht) for a small leisure venue runs **€1,100–3,300/year** with recommended coverage of €3–5M for personal injury.

## Conclusion: a viable project with clear next steps

The project is feasible at every level — from a scrappy DIY blacklight venue at ~€180k total to a polished commercial experience approaching €300k. The regulatory environment is friendlier than expected, with mini golf enjoying explicit exemptions from operating-facility and event-venue permits. The 200m² footprint is the binding constraint: it dictates compact 3.3m lanes and 12–14 holes rather than a full 18-hole standard course.

Three actions should happen immediately. **First**, verify the plot's Flächenwidmungsplan with Gemeinde Gramastetten — an incompatible zoning designation could delay the project by months or kill it entirely. **Second**, request the specific fire classification certificates for the BORGA PIR sandwich panels to confirm they meet the C-s2,d0 minimum for assembly-venue wall cladding. **Third**, visit 2–3 existing Austrian blacklight venues (Blacklite Arena Vienna, Bahn8 Steyr, B1 Innsbruck) to benchmark the experience and speak with operators about real-world economics.

For the web-based planning tool, the React Three Fiber stack with Zustand state management fills a genuine market gap. A minimum viable version — isometric hall view with draggable mini golf hole templates, wall/door/window visualization from the BORGA specs, and JSON export — could be built in 2–4 weeks by an experienced React developer, making it a practical planning aid rather than an overengineered distraction from the physical build.