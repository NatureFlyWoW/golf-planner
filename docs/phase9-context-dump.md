# Phase 9 Context Dump — Current Codebase State

**Generated**: 2026-02-20
**Purpose**: Baseline reference for Phase 9 brainstorming (expert council)

## Key Facts
- 200m² BORGA steel hall (10×20m), Gramastetten, Austria (48.37°N, 14.21°E, 526m elevation)
- Hall cost: €90,000 net (€108,000 gross with 20% VAT)
- Total feasibility range: €174k–€364k depending on ambition level
- 7 hole types: straight, l-shape, dogleg, ramp, loop, windmill, tunnel
- Blacklight (UV) venue format — premium pricing €9–14.50/person
- React 19 + R3F + Zustand + Tailwind, client-side PWA, no backend

## Current Cost Estimation (Phase 8)
- 18 budget categories with net-basis estimates, VAT profiles, confidence tiers
- Per-type hole costs: DIY (€800–1,800) vs Professional (€2,000–3,500) vs Mixed
- Risk buffer: deterministic per-category weighting (tier × tolerance scale)
- Financial settings: VAT registration, net/gross display, risk tolerance, build mode, inflation
- Expense tracking: per-category CRUD with vendor/date/note
- Known gaps: Monte Carlo simulation deferred, inflation factor stored but not wired

## Current 3D Models
- 7 procedural models: felt surfaces, bumpers, obstacles (ramps, loops, windmills, tunnels)
- Shared material system with UV/normal mode toggle
- No textures — solid colors only (MeshStandardMaterial)
- No PBR materials, no environment maps, no shadows
- Static windmill blades (no animation)
- No material cost breakdown per component (felt, wood, steel, paint, etc.)

## Geo Data Usage
- Sun position via suncalc (real lat/lng)
- Window sun exposure coloring
- Sun indicator arrow in 3D scene
- OSM minimap tile
- Location bar with address/elevation
- NOT used for: weather, climate data, supplier distances, local pricing

## Deferred Work
- Code-splitting (1,346 KB bundle)
- Monte Carlo risk simulation
- Animated windmill blades
- inflationFactor not wired to calculations
- displayMode partially applied
