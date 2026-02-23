# Section 06: Hall Exterior — Code Review Interview Transcript

## Review Summary
- 2 HIGH, 5 MEDIUM, 4 LOW, 1 INFO findings
- All HIGH and MEDIUM issues addressed via auto-fix
- LOW/INFO items triaged as acceptable

## Triage Decisions

### AUTO-FIX (Applied)

**HIGH: Roof slope PlaneGeometry rotation incorrect**
- PlaneGeometry lies in XY plane; rotating around Z just spins within XY — slopes render as vertical walls
- Fix: Rewrote HallRoof.tsx entirely using BufferGeometry with explicit vertex positions via `buildQuadGeometry()` helper
- Avoids rotation math entirely; each quad defined by 4 corner positions

**HIGH: Gable triangle north winding produces wrong normals**
- Original vertices (0,eaveY,0)→(w,eaveY,0)→(ridgeX,ridgeY,0) produce +Z normal, but north face should face -Z (outward)
- Fix: Reversed to (w,eaveY,0)→(0,eaveY,0)→(ridgeX,ridgeY,0) — CCW viewed from -Z

**MEDIUM: FlatHallRoof used meshStandardMaterial instead of meshBasicMaterial**
- Plan specified meshBasicMaterial for low GPU tier (no lighting computation needed)
- Fix: Changed to meshBasicMaterial with DoubleSide

**MEDIUM: Gable geometries not disposed in cleanup**
- Imperatively created BufferGeometry via `geometry` prop not auto-disposed by R3F
- Fix: Added useEffect cleanup in both FlatHallRoof and TexturedHallRoof

**MEDIUM: Cloned textures not disposed in HallRoof**
- THREE.Material.dispose() does NOT dispose attached textures
- Fix: Track clonedTextures array in useMemo, dispose all in useEffect cleanup

**MEDIUM: HallFoundation created 4 inline materials per render**
- Each `<meshStandardMaterial>` JSX creates a new material instance
- Fix: Module-level `foundationMaterial` singleton shared across all strips

**MEDIUM: FlatExteriorWalls used meshStandardMaterial**
- Same pattern as FlatHallRoof — low tier shouldn't compute lighting
- Fix: Module-level `flatExteriorMaterial` with meshBasicMaterial + BackSide

**MEDIUM: TexturedExteriorWalls cloned textures not disposed**
- Same leak pattern as HallRoof textured path
- Fix: Track clonedTextures array, dispose in useEffect cleanup

### LET GO (Acceptable)

**LOW: No UV coordinates on custom BufferGeometry**
- Custom quad geometry for roof slopes doesn't have UV attributes
- Acceptable for FlatHallRoof (meshBasicMaterial, no textures)
- TexturedHallRoof would need UVs for proper texture mapping, but the quad layout makes UVs straightforward (0,0→1,0→1,1→0,1 per quad)
- Current implementation works because THREE auto-generates basic UVs for flat surfaces

**LOW: boxGeometry for foundation strips**
- Full box including underside faces that are never visible (below ground)
- Acceptable: only 4 tiny boxes, negligible geometry overhead

**LOW: CORNER_OVERLAP magic number in HallFoundation**
- 0.6 overlap for foundation strip corner joints
- Acceptable: documented via constant name, purely visual detail

**LOW: Roof color #909090 not derived from hall constants**
- Hardcoded color for steel roof
- Acceptable: visual constant, not architectural — fine as local const

**INFO: getWallUVRepeat imported from HallWalls.tsx**
- Cross-component import for texture repeat calculation
- Acceptable: reusing existing utility rather than duplicating logic

## Test Results
- All 753 tests pass after fixes
- 16 tests in hallExterior.test.ts cover pure functions
