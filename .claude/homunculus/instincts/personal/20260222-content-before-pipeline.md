---
trigger: "when planning any visual or rendering phase"
confidence: 0.95
domain: "communication"
created: "2026-02-22T00:00:00Z"
source: "MEMORY.md + postmortem-phase11a"
last_validated: "2026-02-23T11:00:17Z"
---

# Content Quality Before Rendering Pipeline

## Action
For visual phases: always ask "What will the user SEE differently?" first. Deliver user-visible content improvements (3D model quality, materials, geometry) BEFORE pipeline infrastructure (postprocessing, lighting). Never ship a phase that only improves the pipeline without improving rendered content.

Validate every visual plan against the user's rendering vision: beautiful, realistic 3D mini golf holes with PBR textures (felt, wood, metal), beveled edges, realistic obstacles.

## Evidence
- Phase 11A postmortem: plan delivered UI theming instead of beautiful 3D models
- CLAUDE.md Build Order Principle added as safeguard
- User explicitly values "content quality (how holes look) is PRIMARY; rendering pipeline is secondary support"
- 85 writes to docs/plans (planning is primary output) — emphasis on validation before code
- **Validation 2026-02-23**: Confirmed in planning docs pattern — plans guide implementation direction
