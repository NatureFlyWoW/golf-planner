diff --git a/.claude/homunculus/observations.jsonl b/.claude/homunculus/observations.jsonl
index eb7f9cc..15d66b1 100644
--- a/.claude/homunculus/observations.jsonl
+++ b/.claude/homunculus/observations.jsonl
@@ -2470,3 +2470,34 @@ ault();function m(e,t){const{right:r,top:n,left:c,bottom:a,width:i,height:l}=t,o
 {"timestamp":"2026-02-22T12:30:18Z","type":"tool","tool":"Edit","input":{"file_path":"/mnt/c/Users/Caus/Golf_Plan/docs/plans/01-dual-viewport-and-layers/sections/section-05-camera-system.md","old_string":"---\n\n## File Summary\n\n### New Files\n\n| File | Purpose |\n|------|---------|\n| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/utils/cameraPresets.ts` | Pure utility: `getCameraPresets(width, length)` returning 6 preset position/target configs |\n| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/CameraPresets.tsx` | HTML overlay with 6 preset buttons, calls `setLookAt` on 3D CameraControls ref |\n| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/utils/cameraPresets.test.ts` | ~12 unit tests for `getCameraPresets` |\n\n### Modified Files\n\n| File | Changes |\n|------|---------|\n| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/CameraControls.tsx` | **Retire / delete** this file. Its responsibilities split into per-View camera setups (inline in 2D/3D View content or as small per-pane components) |\n| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/hooks/useKeyboardControls.ts` | Refactor to accept `controls2DRef` + `controls3DRef`, read `activeViewport` from store, route shortcuts to the correct pane, add preset key handling (1-6) for 3D |\n| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/hooks/keyboardControls.test.ts` | Existing `shouldHandleKey` tests unchanged; optionally add routing function tests if a pure helper is extracted |\n| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/layout/DualViewport.tsx` | Create refs for both controls, pass to Views and CameraPresets, invoke `useKeyboardControls` |\n\n---\n\n## Implementation Checklist\n\n1. Create `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/utils/cameraPresets.test.ts` with the 12 tests defined above\n2. Create `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/utils/cameraPresets.ts` implementing `getCameraPresets` -- run tests, verify all 12 pass\n3. Set up the 2D pane camera inside the 2D View: `OrthographicCamera` (position centered above hall, zoom 40, makeDefault) + `OrbitControls` (rotation disabled, pan/zoom only, mouseButtons/touches configured, makeDefault, onChange invalidate)\n4. Set up the 3D pane camera inside the 3D View: `PerspectiveCamera` (position from isometric preset, fov 60, makeDefault) + drei `<CameraControls>` (ref stored for preset invocation, makeDefault)\n5. Delete or gut `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/CameraControls.tsx` -- remove the old single-camera-controls component. Update imports in `ThreeCanvas.tsx` (or `SharedScene.tsx` / `ThreeDOnlyContent.tsx` if section-04 already refactored it)\n6. Create `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/CameraPresets.tsx` -- HTML overlay with 6 buttons, positioned absolute top-right in the 3D pane div. On click, calls `cameraControlsRef.current.setLookAt(...)` with transition enabled\n7. Refactor `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/hooks/useKeyboardControls.ts` -- update signature, read `activeViewport` from store, route R/F/zoom/arrows to 2D controls when active, route presets (1-6) and reset to 3D controls when active, preserve undo/redo and snap toggle as global\n8. Wire everything in DualViewport: create both refs, pass to View children and CameraPresets, call `useKeyboardControls` with both refs\n9. Preserve double-tap-to-reset touch behavior for both panes\n10. Run full test suite (`npx vitest run`) -- verify all existing 495+ tests pass plus new camera preset tests\n11. Run `npx tsc --noEmit` to verify no type errors\n12. Manual verification: confirm both panes have independent camera control, presets animate smoothly in 3D, keyboard shortcuts route correctly","new_string":"---\n\n## Actual Implementation (Post-Build)\n\n### New Files\n\n| File | Purpose |\n|------|---------|\n| `src/utils/cameraPresets.ts` | Pure utility: `getCameraPresets(width, length)` → 6 preset configs + camera constants (`DEFAULT_ORTHO_ZOOM`, `MIN/MAX_ORTHO_ZOOM`, `PERSPECTIVE_FOV`) |\n| `src/components/three/CameraPresets.tsx` | HTML overlay with 6 preset buttons (Top/Front/Back/Left/Right/Iso) in 3D pane top-right. Calls `setLookAt` on CameraControls ref |\n| `tests/utils/cameraPresets.test.ts` | 12 unit tests for `getCameraPresets` |\n\n### Modified Files\n\n| File | Changes |\n|------|---------|\n| `src/components/three/CameraControls.tsx` | **Deleted** — responsibilities moved to per-View inline cameras in DualViewport |\n| `src/hooks/useKeyboardControls.ts` | Refactored: dual-ref signature (`controls2DRef` + `controls3DRef`), `resolveViewport()` helper (infers viewport in single-pane modes when `activeViewport` is null), `getHolesBoundingBox()` DRY helper, preset keys 1-6 for 3D |\n| `src/components/layout/DualViewport.tsx` | Added: OrbitControls (2D, rotation disabled), drei CameraControls (3D), pane refs, `useDoubleTapReset` hook per-pane, CameraPresets overlay, `useKeyboardControls` with both refs |\n| `tests/hooks/keyboardControls.test.ts` | Unchanged — existing `shouldHandleKey` tests still pass |\n\n### Deviations from Plan\n\n1. **`onChange={() => invalidate()}` on OrbitControls omitted** — drei OrbitControls auto-invalidates internally on every change event. The explicit callback in the old code was redundant.\n2. **`CAMERA_TRANSITION_DURATION` constant not created** — camera-controls lib uses its own default transition time; the constant would be dead code since `setLookAt(…, true)` just enables the built-in animation.\n3. **`resolveViewport()` helper added (not in plan)** — infers effective viewport from layout when `activeViewport` is null on page load (single-pane modes), improving UX.\n4. **`getHolesBoundingBox()` extracted (not in plan)** — DRYs up the bounding box computation shared by 2D and 3D 'F' key handlers.\n5. **`useDoubleTapReset` hook in DualViewport** — plan suggested either a hook or inline; implemented as a reusable hook attached to pane divs.\n\n### Test Results\n- 560 tests pass (49 files), including 12 new camera preset tests\n- TypeScript: clean (`npx tsc --noEmit` passes)","replace_all":false},"response":"{\"filePath\":\"/mnt/c/Users/Caus/Golf_Plan/docs/plans/01-dual-viewport-and-layers/sections/section-05-camera-system.md\",\"oldString\":\"---\\n\\n## File Summary\\n\\n### New Files\\n\\n| File | Purpose |\\n|------|---------|\\n| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/utils/cameraPresets.ts` | Pure utility: `getCameraPresets(width, length)` returning 6 preset position/target configs |\\n| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/CameraPresets.tsx` | HTML overlay with 6 preset buttons, calls `setLookAt` on 3D CameraControls ref |\\n| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/utils/cameraPresets.test.ts` | ~12 unit tests for `getCameraPresets` |\\n\\n### Modified Files\\n\\n| File | Changes |\\n|------|---------|\\n| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/CameraControls.tsx` | **Retire / delete** this file. Its responsibilities split into per-View camera setups (inline in 2D/3D View content or as small per-pane components) |\\n| `/mnt/c/Users/Caus/Golf"}
 {"timestamp":"2026-02-22T12:30:22Z","type":"tool","tool":"TaskUpdate","input":{"taskId":"36","status":"completed"},"response":"{\"success\":true,\"taskId\":\"36\",\"updatedFields\":[\"status\"],\"statusChange\":{\"from\":\"in_progress\",\"to\":\"completed\"}}"}
 {"timestamp":"2026-02-22T12:30:22Z","type":"tool","tool":"TaskUpdate","input":{"taskId":"37","status":"in_progress"},"response":"{\"success\":true,\"taskId\":\"37\",\"updatedFields\":[\"status\"],\"statusChange\":{\"from\":\"pending\",\"to\":\"in_progress\"}}"}
+{"timestamp":"2026-02-22T12:30:29Z","type":"tool","tool":"Bash","input":{"command":"git add src/utils/cameraPresets.ts src/components/three/CameraPresets.tsx src/hooks/useKeyboardControls.ts src/components/layout/DualViewport.tsx tests/utils/cameraPresets.test.ts && git add -u && git diff --cached --stat","description":"Stage all section-05 changes"},"response":"{\"stdout\":\" .claude/homunculus/observations.jsonl   | 160 +++++++++++++\\n src/components/layout/DualViewport.tsx  | 161 +++++++++++++-\\n src/components/three/CameraControls.tsx | 142 ------------\\n src/components/three/CameraPresets.tsx  |  55 +++++\\n src/hooks/useKeyboardControls.ts        | 383 ++++++++++++++++++++------------\\n src/utils/cameraPresets.ts              |  51 +++++\\n tests/utils/cameraPresets.test.ts       |  82 +++++++\\n 7 files changed, 738 insertions(+), 296 deletions(-)\",\"stderr\":\"\",\"interrupted\":false,\"isImage\":false,\"noOutputExpected\":false}"}
+{"timestamp":"2026-02-22T12:30:35Z","type":"tool","tool":"Bash","input":{"command":"git log --oneline -3","description":"Check recent commit style"},"response":"{\"stdout\":\"4c13900 Implement section 04: Dual Canvas Views\\n0899c9b Implement section 03: Split-Pane Layout\\nc766429 feat: add viewport layout and layer types + store actions (section-02)\",\"stderr\":\"\",\"interrupted\":false,\"isImage\":false,\"noOutputExpected\":false}"}
+{"timestamp":"2026-02-22T12:31:48Z","type":"tool","tool":"Bash","input":{"command":"git commit -m \"$(cat <<'EOF'\nImplement section 05: Camera System\n\n- Per-pane cameras: OrthographicCamera + OrbitControls (2D), PerspectiveCamera + drei CameraControls (3D)\n- Camera presets utility with 6 hall-relative positions (top/front/back/left/right/isometric)\n- CameraPresets HTML overlay with animated preset buttons in 3D pane\n- Refactored useKeyboardControls for dual-viewport routing with resolveViewport() fallback\n- Double-tap-to-reset touch behavior per-viewport via useDoubleTapReset hook\n- Deleted old CameraControls.tsx (responsibilities split into DualViewport)\n- 12 new unit tests for getCameraPresets, 560 total tests passing\n\nPlan: section-05-camera-system.md\nCo-Authored-By: Claude <noreply@anthropic.com>\nEOF\n)\"","description":"Commit section 05"},"response":"{\"stdout\":\"[feat/dual-viewport-and-layers d2c693b] Implement section 05: Camera System\\n 7 files changed, 738 insertions(+), 296 deletions(-)\\n delete mode 100644 src/components/three/CameraControls.tsx\\n create mode 100644 src/components/three/CameraPresets.tsx\\n create mode 100644 src/utils/cameraPresets.ts\\n create mode 100644 tests/utils/cameraPresets.test.ts\",\"stderr\":\"\",\"interrupted\":false,\"isImage\":false,\"noOutputExpected\":false}"}
+{"timestamp":"2026-02-22T12:31:52Z","type":"tool","tool":"TaskUpdate","input":{"taskId":"37","status":"completed"},"response":"{\"success\":true,\"taskId\":\"37\",\"updatedFields\":[\"status\"],\"statusChange\":{\"from\":\"in_progress\",\"to\":\"completed\"}}"}
+{"timestamp":"2026-02-22T12:31:52Z","type":"tool","tool":"TaskUpdate","input":{"taskId":"38","status":"in_progress"},"response":"{\"success\":true,\"taskId\":\"38\",\"updatedFields\":[\"status\"],\"statusChange\":{\"from\":\"pending\",\"to\":\"in_progress\"}}"}
+{"timestamp":"2026-02-22T12:31:59Z","type":"tool","tool":"Bash","input":{"command":"export PATH=\"/home/ben/.local/share/fnm:$PATH\" && eval \"$(fnm env)\" && uv run /home/ben/.claude/plugins/cache/piercelamb-plugins/deep-implement/0.2.0/scripts/tools/update_section_state.py \\\n    --state-dir \"/mnt/c/Users/Caus/Golf_Plan/docs/plans/01-dual-viewport-and-layers/implementation\" \\\n    --section \"section-05-camera-system\" \\\n    --commit-hash \"d2c693b\"","timeout":15000,"description":"Record section-05 completion in state"},"response":"{\"stdout\":\"Updated section-05-camera-system: commit_hash=d2c693b\",\"stderr\":\"\",\"interrupted\":false,\"isImage\":false,\"noOutputExpected\":false}"}
+{"timestamp":"2026-02-22T12:32:02Z","type":"tool","tool":"TaskUpdate","input":{"taskId":"38","status":"completed"},"response":"{\"success\":true,\"taskId\":\"38\",\"updatedFields\":[\"status\"],\"statusChange\":{\"from\":\"in_progress\",\"to\":\"completed\"}}"}
+{"timestamp":"2026-02-22T12:32:06Z","type":"tool","tool":"TaskUpdate","input":{"taskId":"39","status":"in_progress"},"response":"{\"success\":true,\"taskId\":\"39\",\"updatedFields\":[\"status\"],\"statusChange\":{\"from\":\"pending\",\"to\":\"in_progress\"}}"}
+{"timestamp":"2026-02-22T12:32:09Z","type":"tool","tool":"Read","input":{"file_path":"/mnt/c/Users/Caus/Golf_Plan/docs/plans/01-dual-viewport-and-layers/sections/section-06-event-isolation.md"},"response":"{\"type\":\"text\",\"file\":{\"filePath\":\"/mnt/c/Users/Caus/Golf_Plan/docs/plans/01-dual-viewport-and-layers/sections/section-06-event-isolation.md\",\"content\":\"Now I have all the context needed. Let me produce the section content.\\n\\n# Section 06 -- Event Isolation & Interaction\\n\\n## Overview\\n\\nThis section implements pointer event isolation between the 2D and 3D viewport panes and migrates drag interactions away from `setPointerCapture`. In a dual-View setup, both Views share a single Canvas DOM element, so pointer events fire in both Views simultaneously. Without isolation, clicking a hole in the 2D pane would also trigger selection logic in the 3D pane (and vice versa). Additionally, the existing `setPointerCapture` pattern on the shared Canvas element would hijack ALL pointer events to one View, breaking camera controls in the other.\\n\\nThis section creates `ViewportContext`, adds position-based viewport detection to event handlers, migrates `MiniGolfHole.tsx` and `RotationHandle.tsx` a"}
+{"timestamp":"2026-02-22T12:32:23Z","type":"tool","tool":"Read","input":{"file_path":"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/MiniGolfHole.tsx"},"response":"{\"type\":\"text\",\"file\":{\"filePath\":\"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/MiniGolfHole.tsx\",\"content\":\"import type { ThreeEvent } from \\\"@react-three/fiber\\\";\\nimport { useThree } from \\\"@react-three/fiber\\\";\\nimport { useMemo, useRef, useState } from \\\"react\\\";\\nimport * as THREE from \\\"three\\\";\\nimport { HOLE_TYPE_MAP } from \\\"../../constants\\\";\\nimport { useStore } from \\\"../../store\\\";\\nimport type { Hole } from \\\"../../types\\\";\\nimport { checkAnyCollision, checkHallBounds } from \\\"../../utils/collision\\\";\\nimport { computeTemplateBounds } from \\\"../../utils/chainCompute\\\";\\nimport { snapToGrid } from \\\"../../utils/snap\\\";\\nimport { HoleModel } from \\\"./holes/HoleModel\\\";\\nimport { MODEL_HEIGHTS, SURFACE_THICKNESS } from \\\"./holes/shared\\\";\\n\\ntype Props = {\\n\\thole: Hole;\\n\\tisSelected: boolean;\\n\\tonClick: () => void;\\n};\\n\\nconst INTERACTION_HEIGHT = 0.3;\\nconst floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);\\n\\nexport function MiniGolfHole({ "}
+{"timestamp":"2026-02-22T12:32:23Z","type":"tool","tool":"Read","input":{"file_path":"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/RotationHandle.tsx"},"response":"{\"type\":\"text\",\"file\":{\"filePath\":\"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/RotationHandle.tsx\",\"content\":\"import type { ThreeEvent } from \\\"@react-three/fiber\\\";\\nimport { useRef, useState } from \\\"react\\\";\\nimport { useStore } from \\\"../../store\\\";\\nimport { isMobile } from \\\"../../utils/isMobile\\\";\\n\\nconst RING_RADIUS = 1.2;\\nconst SNAP_DEG = 15;\\nconst SPHERE_RADIUS = isMobile ? 0.35 : 0.12;\\nconst SPHERE_SEGMENTS = isMobile ? 8 : 16;\\nconst RING_SEGMENTS = isMobile ? 32 : 64;\\n\\ntype RotationHandleProps = {\\n\\tholeId: string;\\n\\tholeX: number;\\n\\tholeZ: number;\\n\\trotation: number;\\n};\\n\\nexport function RotationHandle({\\n\\tholeId,\\n\\tholeX,\\n\\tholeZ,\\n\\trotation,\\n}: RotationHandleProps) {\\n\\tconst updateHole = useStore((s) => s.updateHole);\\n\\tconst [isDragging, setIsDragging] = useState(false);\\n\\tconst shiftHeld = useRef(false);\\n\\n\\tconst rotRad = (rotation * Math.PI) / 180;\\n\\tconst handleX = Math.sin(rotRad) * RING_RADIUS;\\n\\tconst handleZ = Math.cos(r"}
+{"timestamp":"2026-02-22T12:32:24Z","type":"tool","tool":"Read","input":{"file_path":"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/PlacementHandler.tsx"},"response":"{\"type\":\"text\",\"file\":{\"filePath\":\"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/PlacementHandler.tsx\",\"content\":\"import type { ThreeEvent } from \\\"@react-three/fiber\\\";\\nimport { useMemo, useRef, useState } from \\\"react\\\";\\nimport { HOLE_TYPE_MAP } from \\\"../../constants\\\";\\nimport { useStore } from \\\"../../store\\\";\\nimport type { HoleTemplate } from \\\"../../types/template\\\";\\nimport { computeTemplateBounds } from \\\"../../utils/chainCompute\\\";\\nimport { checkAnyCollision, checkHallBounds } from \\\"../../utils/collision\\\";\\nimport { isMobile } from \\\"../../utils/isMobile\\\";\\nimport { snapToGrid } from \\\"../../utils/snap\\\";\\nimport { GhostHole } from \\\"./GhostHole\\\";\\n\\nconst GRID_SIZE = 0.25;\\n\\nfunction buildOBBMap(\\n\\tholes: Record<\\n\\t\\tstring,\\n\\t\\t{\\n\\t\\t\\tposition: { x: number; z: number };\\n\\t\\t\\trotation: number;\\n\\t\\t\\ttype: string;\\n\\t\\t\\ttemplateId?: string;\\n\\t\\t}\\n\\t>,\\n\\ttemplates: Record<string, HoleTemplate>,\\n) {\\n\\tconst map: Record<\\n\\t\\tstring,\\n\\t\\t{"}
+{"timestamp":"2026-02-22T12:32:36Z","type":"tool","tool":"Write","input":{"file_path":"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/contexts/ViewportContext.ts","content":"import type { ThreeEvent } from \"@react-three/fiber\";\nimport { createContext, useContext } from \"react\";\n\n/** Identifies which viewport pane a component is rendering inside */\nexport type ViewportId = \"2d\" | \"3d\";\n\nexport type ViewportInfo = {\n\tid: ViewportId;\n\t/** The clientX of the right edge of the 2D pane (divider position).\n\t *  null when in single-pane mode. */\n\tpaneBoundaryX: number | null;\n};\n\nexport const ViewportContext = createContext<ViewportInfo | null>(null);\n\n/** Hook to read the current viewport info. Returns null if not inside a View. */\nexport function useViewportInfo(): ViewportInfo | null {\n\treturn useContext(ViewportContext);\n}\n\n/**\n * Checks whether a pointer event originated from the same pane\n * as the component calling this function.\n *\n * Uses position-based detection: compares the event's clientX\n * against the divider position (paneBoundaryX).\n *\n * Returns true in single-pane mode (no gating needed).\n */\nexport function isEventForThisViewport(\n\te: ThreeEvent<PointerEvent> | ThreeEvent<MouseEvent>,\n\tviewport: ViewportInfo,\n): boolean {\n\tif (viewport.paneBoundaryX === null) return true;\n\tconst pointerPane =\n\t\te.nativeEvent.clientX < viewport.paneBoundaryX ? \"2d\" : \"3d\";\n\treturn pointerPane === viewport.id;\n}\n"},"response":"{\"type\":\"create\",\"filePath\":\"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/contexts/ViewportContext.ts\",\"content\":\"import type { ThreeEvent } from \\\"@react-three/fiber\\\";\\nimport { createContext, useContext } from \\\"react\\\";\\n\\n/** Identifies which viewport pane a component is rendering inside */\\nexport type ViewportId = \\\"2d\\\" | \\\"3d\\\";\\n\\nexport type ViewportInfo = {\\n\\tid: ViewportId;\\n\\t/** The clientX of the right edge of the 2D pane (divider position).\\n\\t *  null when in single-pane mode. */\\n\\tpaneBoundaryX: number | null;\\n};\\n\\nexport const ViewportContext = createContext<ViewportInfo | null>(null);\\n\\n/** Hook to read the current viewport info. Returns null if not inside a View. */\\nexport function useViewportInfo(): ViewportInfo | null {\\n\\treturn useContext(ViewportContext);\\n}\\n\\n/**\\n * Checks whether a pointer event originated from the same pane\\n * as the component calling this function.\\n *\\n * Uses position-based detection: compares the event's clientX\\n * against th"}
+{"timestamp":"2026-02-22T12:32:41Z","type":"tool","tool":"Read","input":{"file_path":"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/layout/DualViewport.tsx"},"response":"{\"type\":\"text\",\"file\":{\"filePath\":\"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/layout/DualViewport.tsx\",\"content\":\"import {\\n\\tCameraControls,\\n\\tOrbitControls,\\n\\tOrthographicCamera,\\n\\tPerspectiveCamera,\\n\\tSoftShadows,\\n\\tView,\\n} from \\\"@react-three/drei\\\";\\nimport { Canvas } from \\\"@react-three/fiber\\\";\\nimport type CameraControlsImpl from \\\"camera-controls\\\";\\nimport { Suspense, useEffect, useMemo, useRef } from \\\"react\\\";\\nimport { MOUSE, NoToneMapping, TOUCH } from \\\"three\\\";\\nimport type { OrbitControls as OrbitControlsImpl } from \\\"three-stdlib\\\";\\nimport { useKeyboardControls } from \\\"../../hooks/useKeyboardControls\\\";\\nimport { useSplitPane } from \\\"../../hooks/useSplitPane\\\";\\nimport type { SunData } from \\\"../../hooks/useSunPosition\\\";\\nimport { useStore } from \\\"../../store\\\";\\nimport {\\n\\tDEFAULT_ORTHO_ZOOM,\\n\\tMAX_ORTHO_ZOOM,\\n\\tMIN_ORTHO_ZOOM,\\n\\tPERSPECTIVE_FOV,\\n\\tgetCameraPresets,\\n} from \\\"../../utils/cameraPresets\\\";\\nimport {\\n\\tderiveFrameloop,\\n\\tg"}
+{"timestamp":"2026-02-22T12:32:51Z","type":"tool","tool":"Edit","input":{"file_path":"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/layout/DualViewport.tsx","old_string":"import { Canvas } from \"@react-three/fiber\";\nimport type CameraControlsImpl from \"camera-controls\";\nimport { Suspense, useEffect, useMemo, useRef } from \"react\";","new_string":"import { Canvas } from \"@react-three/fiber\";\nimport type CameraControlsImpl from \"camera-controls\";\nimport { Suspense, useCallback, useEffect, useMemo, useRef, useState } from \"react\";","replace_all":false},"response":"{\"filePath\":\"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/layout/DualViewport.tsx\",\"oldString\":\"import { Canvas } from \\\"@react-three/fiber\\\";\\nimport type CameraControlsImpl from \\\"camera-controls\\\";\\nimport { Suspense, useEffect, useMemo, useRef } from \\\"react\\\";\",\"newString\":\"import { Canvas } from \\\"@react-three/fiber\\\";\\nimport type CameraControlsImpl from \\\"camera-controls\\\";\\nimport { Suspense, useCallback, useEffect, useMemo, useRef, useState } from \\\"react\\\";\",\"originalFile\":\"import {\\n\\tCameraControls,\\n\\tOrbitControls,\\n\\tOrthographicCamera,\\n\\tPerspectiveCamera,\\n\\tSoftShadows,\\n\\tView,\\n} from \\\"@react-three/drei\\\";\\nimport { Canvas } from \\\"@react-three/fiber\\\";\\nimport type CameraControlsImpl from \\\"camera-controls\\\";\\nimport { Suspense, useEffect, useMemo, useRef } from \\\"react\\\";\\nimport { MOUSE, NoToneMapping, TOUCH } from \\\"three\\\";\\nimport type { OrbitControls as OrbitControlsImpl } from \\\"three-stdlib\\\";\\nimport { useKeyboardControls } from \\\"../../hooks"}
+{"timestamp":"2026-02-22T12:32:58Z","type":"tool","tool":"Edit","input":{"file_path":"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/layout/DualViewport.tsx","old_string":"import { canvasPointerEvents } from \"../../utils/uvTransitionConfig\";\nimport { CameraPresets } from \"../three/CameraPresets\";","new_string":"import { canvasPointerEvents } from \"../../utils/uvTransitionConfig\";\nimport { ViewportContext } from \"../../contexts/ViewportContext\";\nimport type { ViewportInfo } from \"../../contexts/ViewportContext\";\nimport { CameraPresets } from \"../three/CameraPresets\";","replace_all":false},"response":"{\"filePath\":\"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/layout/DualViewport.tsx\",\"oldString\":\"import { canvasPointerEvents } from \\\"../../utils/uvTransitionConfig\\\";\\nimport { CameraPresets } from \\\"../three/CameraPresets\\\";\",\"newString\":\"import { canvasPointerEvents } from \\\"../../utils/uvTransitionConfig\\\";\\nimport { ViewportContext } from \\\"../../contexts/ViewportContext\\\";\\nimport type { ViewportInfo } from \\\"../../contexts/ViewportContext\\\";\\nimport { CameraPresets } from \\\"../three/CameraPresets\\\";\",\"originalFile\":\"import {\\n\\tCameraControls,\\n\\tOrbitControls,\\n\\tOrthographicCamera,\\n\\tPerspectiveCamera,\\n\\tSoftShadows,\\n\\tView,\\n} from \\\"@react-three/drei\\\";\\nimport { Canvas } from \\\"@react-three/fiber\\\";\\nimport type CameraControlsImpl from \\\"camera-controls\\\";\\nimport { Suspense, useCallback, useEffect, useMemo, useRef, useState } from \\\"react\\\";\\nimport { MOUSE, NoToneMapping, TOUCH } from \\\"three\\\";\\nimport type { OrbitControls as OrbitControlsImpl } from \\\"thre"}
+{"timestamp":"2026-02-22T12:33:09Z","type":"tool","tool":"Edit","input":{"file_path":"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/layout/DualViewport.tsx","old_string":"\tconst show2D = viewportLayout !== \"3d-only\";\n\tconst show3D = viewportLayout !== \"2d-only\";\n\tconst showDivider = viewportLayout === \"dual\";","new_string":"\tconst show2D = viewportLayout !== \"3d-only\";\n\tconst show3D = viewportLayout !== \"2d-only\";\n\tconst showDivider = viewportLayout === \"dual\";\n\n\t// Track the divider X position for position-based event gating\n\tconst [paneBoundaryX, setPaneBoundaryX] = useState<number | null>(null);\n\n\tuseEffect(() => {\n\t\tif (!showDivider) {\n\t\t\tsetPaneBoundaryX(null);\n\t\t\treturn;\n\t\t}\n\t\tconst el = pane2DRef.current;\n\t\tif (!el) return;\n\t\tconst updateBoundary = () => {\n\t\t\tconst rect = el.getBoundingClientRect();\n\t\t\tsetPaneBoundaryX(rect.right);\n\t\t};\n\t\tupdateBoundary();\n\t\tconst observer = new ResizeObserver(updateBoundary);\n\t\tobserver.observe(el);\n\t\treturn () => observer.disconnect();\n\t}, [showDivider]);\n\n\t// Update boundary when splitRatio changes (resize observer may miss CSS calc changes)\n\tuseEffect(() => {\n\t\tif (!showDivider || !pane2DRef.current) return;\n\t\tconst rect = pane2DRef.current.getBoundingClientRect();\n\t\tsetPaneBoundaryX(rect.right);\n\t}, [showDivider, splitRatio]);\n\n\tconst viewport2DInfo: ViewportInfo = useMemo(\n\t\t() => ({ id: \"2d\", paneBoundaryX }),\n\t\t[paneBoundaryX],\n\t);\n\tconst viewport3DInfo: ViewportInfo = useMemo(\n\t\t() => ({ id: \"3d\", paneBoundaryX }),\n\t\t[paneBoundaryX],\n\t);","replace_all":false},"response":"{\"filePath\":\"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/layout/DualViewport.tsx\",\"oldString\":\"\\tconst show2D = viewportLayout !== \\\"3d-only\\\";\\n\\tconst show3D = viewportLayout !== \\\"2d-only\\\";\\n\\tconst showDivider = viewportLayout === \\\"dual\\\";\",\"newString\":\"\\tconst show2D = viewportLayout !== \\\"3d-only\\\";\\n\\tconst show3D = viewportLayout !== \\\"2d-only\\\";\\n\\tconst showDivider = viewportLayout === \\\"dual\\\";\\n\\n\\t// Track the divider X position for position-based event gating\\n\\tconst [paneBoundaryX, setPaneBoundaryX] = useState<number | null>(null);\\n\\n\\tuseEffect(() => {\\n\\t\\tif (!showDivider) {\\n\\t\\t\\tsetPaneBoundaryX(null);\\n\\t\\t\\treturn;\\n\\t\\t}\\n\\t\\tconst el = pane2DRef.current;\\n\\t\\tif (!el) return;\\n\\t\\tconst updateBoundary = () => {\\n\\t\\t\\tconst rect = el.getBoundingClientRect();\\n\\t\\t\\tsetPaneBoundaryX(rect.right);\\n\\t\\t};\\n\\t\\tupdateBoundary();\\n\\t\\tconst observer = new ResizeObserver(updateBoundary);\\n\\t\\tobserver.observe(el);\\n\\t\\treturn () => observer.disconnect"}
+{"timestamp":"2026-02-22T12:33:19Z","type":"tool","tool":"Edit","input":{"file_path":"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/layout/DualViewport.tsx","old_string":"\t\t\t\t<View style={{ width: \"100%\", height: \"100%\" }}>\n\t\t\t\t\t\t<OrthographicCamera\n\t\t\t\t\t\t\tmakeDefault\n\t\t\t\t\t\t\tposition={[defaultTarget[0], 50, defaultTarget[2]]}\n\t\t\t\t\t\t\tzoom={DEFAULT_ORTHO_ZOOM}\n\t\t\t\t\t\t\tnear={0.1}\n\t\t\t\t\t\t\tfar={200}\n\t\t\t\t\t\t/>\n\t\t\t\t\t\t<OrbitControls\n\t\t\t\t\t\t\tref={controls2DRef}\n\t\t\t\t\t\t\ttarget={defaultTarget}\n\t\t\t\t\t\t\tenableRotate={false}\n\t\t\t\t\t\t\tenablePan={true}\n\t\t\t\t\t\t\tenableZoom={true}\n\t\t\t\t\t\t\tminZoom={MIN_ORTHO_ZOOM}\n\t\t\t\t\t\t\tmaxZoom={MAX_ORTHO_ZOOM}\n\t\t\t\t\t\t\tmouseButtons={{\n\t\t\t\t\t\t\t\tLEFT: undefined,\n\t\t\t\t\t\t\t\tMIDDLE: MOUSE.PAN,\n\t\t\t\t\t\t\t\tRIGHT: MOUSE.PAN,\n\t\t\t\t\t\t\t}}\n\t\t\t\t\t\t\ttouches={{\n\t\t\t\t\t\t\t\tONE: TOUCH.PAN,\n\t\t\t\t\t\t\t\tTWO: TOUCH.DOLLY_PAN,\n\t\t\t\t\t\t\t}}\n\t\t\t\t\t\t\tmakeDefault\n\t\t\t\t\t\t/>\n\t\t\t\t\t\t<SharedScene sunData={sunData} />\n\t\t\t\t\t\t<PlacementHandler />\n\t\t\t\t\t</View>","new_string":"\t\t\t\t<View style={{ width: \"100%\", height: \"100%\" }}>\n\t\t\t\t\t\t<ViewportContext.Provider value={viewport2DInfo}>\n\t\t\t\t\t\t\t<OrthographicCamera\n\t\t\t\t\t\t\t\tmakeDefault\n\t\t\t\t\t\t\t\tposition={[defaultTarget[0], 50, defaultTarget[2]]}\n\t\t\t\t\t\t\t\tzoom={DEFAULT_ORTHO_ZOOM}\n\t\t\t\t\t\t\t\tnear={0.1}\n\t\t\t\t\t\t\t\tfar={200}\n\t\t\t\t\t\t\t/>\n\t\t\t\t\t\t\t<OrbitControls\n\t\t\t\t\t\t\t\tref={controls2DRef}\n\t\t\t\t\t\t\t\ttarget={defaultTarget}\n\t\t\t\t\t\t\t\tenableRotate={false}\n\t\t\t\t\t\t\t\tenablePan={true}\n\t\t\t\t\t\t\t\tenableZoom={true}\n\t\t\t\t\t\t\t\tminZoom={MIN_ORTHO_ZOOM}\n\t\t\t\t\t\t\t\tmaxZoom={MAX_ORTHO_ZOOM}\n\t\t\t\t\t\t\t\tmouseButtons={{\n\t\t\t\t\t\t\t\t\tLEFT: undefined,\n\t\t\t\t\t\t\t\t\tMIDDLE: MOUSE.PAN,\n\t\t\t\t\t\t\t\t\tRIGHT: MOUSE.PAN,\n\t\t\t\t\t\t\t\t}}\n\t\t\t\t\t\t\t\ttouches={{\n\t\t\t\t\t\t\t\t\tONE: TOUCH.PAN,\n\t\t\t\t\t\t\t\t\tTWO: TOUCH.DOLLY_PAN,\n\t\t\t\t\t\t\t\t}}\n\t\t\t\t\t\t\t\tmakeDefault\n\t\t\t\t\t\t\t/>\n\t\t\t\t\t\t\t<SharedScene sunData={sunData} />\n\t\t\t\t\t\t\t<PlacementHandler />\n\t\t\t\t\t\t</ViewportContext.Provider>\n\t\t\t\t\t</View>","replace_all":false},"response":"{\"filePath\":\"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/layout/DualViewport.tsx\",\"oldString\":\"\\t\\t\\t\\t<View style={{ width: \\\"100%\\\", height: \\\"100%\\\" }}>\\n\\t\\t\\t\\t\\t\\t<OrthographicCamera\\n\\t\\t\\t\\t\\t\\t\\tmakeDefault\\n\\t\\t\\t\\t\\t\\t\\tposition={[defaultTarget[0], 50, defaultTarget[2]]}\\n\\t\\t\\t\\t\\t\\t\\tzoom={DEFAULT_ORTHO_ZOOM}\\n\\t\\t\\t\\t\\t\\t\\tnear={0.1}\\n\\t\\t\\t\\t\\t\\t\\tfar={200}\\n\\t\\t\\t\\t\\t\\t/>\\n\\t\\t\\t\\t\\t\\t<OrbitControls\\n\\t\\t\\t\\t\\t\\t\\tref={controls2DRef}\\n\\t\\t\\t\\t\\t\\t\\ttarget={defaultTarget}\\n\\t\\t\\t\\t\\t\\t\\tenableRotate={false}\\n\\t\\t\\t\\t\\t\\t\\tenablePan={true}\\n\\t\\t\\t\\t\\t\\t\\tenableZoom={true}\\n\\t\\t\\t\\t\\t\\t\\tminZoom={MIN_ORTHO_ZOOM}\\n\\t\\t\\t\\t\\t\\t\\tmaxZoom={MAX_ORTHO_ZOOM}\\n\\t\\t\\t\\t\\t\\t\\tmouseButtons={{\\n\\t\\t\\t\\t\\t\\t\\t\\tLEFT: undefined,\\n\\t\\t\\t\\t\\t\\t\\t\\tMIDDLE: MOUSE.PAN,\\n\\t\\t\\t\\t\\t\\t\\t\\tRIGHT: MOUSE.PAN,\\n\\t\\t\\t\\t\\t\\t\\t}}\\n\\t\\t\\t\\t\\t\\t\\ttouches={{\\n\\t\\t\\t\\t\\t\\t\\t\\tONE: TOUCH.PAN,\\n\\t\\t\\t\\t\\t\\t\\t\\tTWO: TOUCH.DOLLY_PAN,\\n\\t\\t\\t\\t\\t\\t\\t}}\\n\\t\\t\\t\\t\\t\\t\\tmakeDefault\\n\\t\\t\\t\\t\\t\\t/>\\n\\"}
+{"timestamp":"2026-02-22T12:33:28Z","type":"tool","tool":"Edit","input":{"file_path":"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/layout/DualViewport.tsx","old_string":"\t\t\t\t<View style={{ width: \"100%\", height: \"100%\" }}>\n\t\t\t\t\t\t<PerspectiveCamera\n\t\t\t\t\t\t\tmakeDefault\n\t\t\t\t\t\t\tposition={initialIsoPosition}\n\t\t\t\t\t\t\tfov={PERSPECTIVE_FOV}\n\t\t\t\t\t\t\tnear={0.1}\n\t\t\t\t\t\t\tfar={500}\n\t\t\t\t\t\t/>\n\t\t\t\t\t\t<CameraControls\n\t\t\t\t\t\t\tref={controls3DRef}\n\t\t\t\t\t\t\tmakeDefault\n\t\t\t\t\t\t/>\n\t\t\t\t\t\t<SharedScene sunData={sunData} />\n\t\t\t\t\t\t<ThreeDOnlyContent />\n\t\t\t\t\t\t{!show2D && <PlacementHandler />}\n\t\t\t\t\t</View>","new_string":"\t\t\t\t<View style={{ width: \"100%\", height: \"100%\" }}>\n\t\t\t\t\t\t<ViewportContext.Provider value={viewport3DInfo}>\n\t\t\t\t\t\t\t<PerspectiveCamera\n\t\t\t\t\t\t\t\tmakeDefault\n\t\t\t\t\t\t\t\tposition={initialIsoPosition}\n\t\t\t\t\t\t\t\tfov={PERSPECTIVE_FOV}\n\t\t\t\t\t\t\t\tnear={0.1}\n\t\t\t\t\t\t\t\tfar={500}\n\t\t\t\t\t\t\t/>\n\t\t\t\t\t\t\t<CameraControls\n\t\t\t\t\t\t\t\tref={controls3DRef}\n\t\t\t\t\t\t\t\tmakeDefault\n\t\t\t\t\t\t\t/>\n\t\t\t\t\t\t\t<SharedScene sunData={sunData} />\n\t\t\t\t\t\t\t<ThreeDOnlyContent />\n\t\t\t\t\t\t\t{!show2D && <PlacementHandler />}\n\t\t\t\t\t\t</ViewportContext.Provider>\n\t\t\t\t\t</View>","replace_all":false},"response":"{\"filePath\":\"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/layout/DualViewport.tsx\",\"oldString\":\"\\t\\t\\t\\t<View style={{ width: \\\"100%\\\", height: \\\"100%\\\" }}>\\n\\t\\t\\t\\t\\t\\t<PerspectiveCamera\\n\\t\\t\\t\\t\\t\\t\\tmakeDefault\\n\\t\\t\\t\\t\\t\\t\\tposition={initialIsoPosition}\\n\\t\\t\\t\\t\\t\\t\\tfov={PERSPECTIVE_FOV}\\n\\t\\t\\t\\t\\t\\t\\tnear={0.1}\\n\\t\\t\\t\\t\\t\\t\\tfar={500}\\n\\t\\t\\t\\t\\t\\t/>\\n\\t\\t\\t\\t\\t\\t<CameraControls\\n\\t\\t\\t\\t\\t\\t\\tref={controls3DRef}\\n\\t\\t\\t\\t\\t\\t\\tmakeDefault\\n\\t\\t\\t\\t\\t\\t/>\\n\\t\\t\\t\\t\\t\\t<SharedScene sunData={sunData} />\\n\\t\\t\\t\\t\\t\\t<ThreeDOnlyContent />\\n\\t\\t\\t\\t\\t\\t{!show2D && <PlacementHandler />}\\n\\t\\t\\t\\t\\t</View>\",\"newString\":\"\\t\\t\\t\\t<View style={{ width: \\\"100%\\\", height: \\\"100%\\\" }}>\\n\\t\\t\\t\\t\\t\\t<ViewportContext.Provider value={viewport3DInfo}>\\n\\t\\t\\t\\t\\t\\t\\t<PerspectiveCamera\\n\\t\\t\\t\\t\\t\\t\\t\\tmakeDefault\\n\\t\\t\\t\\t\\t\\t\\t\\tposition={initialIsoPosition}\\n\\t\\t\\t\\t\\t\\t\\t\\tfov={PERSPECTIVE_FOV}\\n\\t\\t\\t\\t\\t\\t\\t\\tnear={0.1}\\n\\t\\t\\t\\t\\t\\t\\t\\tfar={500}\\n\\t\\t\\t\\t\\t\\t\\t/>\\n\\t\\t\\t\\t"}
+{"timestamp":"2026-02-22T12:34:09Z","type":"tool","tool":"Write","input":{"file_path":"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/MiniGolfHole.tsx","content":"import type { ThreeEvent } from \"@react-three/fiber\";\nimport { useThree } from \"@react-three/fiber\";\nimport { useMemo, useRef, useState } from \"react\";\nimport * as THREE from \"three\";\nimport { HOLE_TYPE_MAP } from \"../../constants\";\nimport {\n\tisEventForThisViewport,\n\tuseViewportInfo,\n} from \"../../contexts/ViewportContext\";\nimport { useStore } from \"../../store\";\nimport type { Hole } from \"../../types\";\nimport { computeTemplateBounds } from \"../../utils/chainCompute\";\nimport { checkAnyCollision, checkHallBounds } from \"../../utils/collision\";\nimport { snapToGrid } from \"../../utils/snap\";\nimport { HoleModel } from \"./holes/HoleModel\";\nimport { MODEL_HEIGHTS, SURFACE_THICKNESS } from \"./holes/shared\";\n\ntype Props = {\n\thole: Hole;\n\tisSelected: boolean;\n\tonClick: () => void;\n};\n\nconst INTERACTION_HEIGHT = 0.3;\nconst floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);\n\nexport function MiniGolfHole({ hole, isSelected, onClick }: Props) {\n\tconst definition = HOLE_TYPE_MAP[hole.type];\n\tconst updateHole = useStore((s) => s.updateHole);\n\tconst removeHole = useStore((s) => s.removeHole);\n\tconst hall = useStore((s) => s.hall);\n\tconst tool = useStore((s) => s.ui.tool);\n\tconst snapEnabled = useStore((s) => s.ui.snapEnabled);\n\tconst holes = useStore((s) => s.holes);\n\tconst holeTemplates = useStore((s) => s.holeTemplates);\n\tconst { raycaster } = useThree();\n\tconst [isDragging, setIsDragging] = useState(false);\n\tconst [isHovered, setIsHovered] = useState(false);\n\tconst dragStart = useRef<{ x: number; z: number } | null>(null);\n\tconst pointerStartScreen = useRef<{ x: number; y: number } | null>(null);\n\tconst viewportInfo = useViewportInfo();\n\n\tconst template = hole.templateId ? holeTemplates[hole.templateId] : null;\n\n\t// Derive dimensions from template bounds or legacy definition\n\tconst dimensions = useMemo(() => {\n\t\tif (template) {\n\t\t\treturn computeTemplateBounds(template);\n\t\t}\n\t\tif (definition) {\n\t\t\treturn definition.dimensions;\n\t\t}\n\t\treturn { width: 1, length: 1 };\n\t}, [template, definition]);\n\n\tif (!definition && !template) return null;\n\n\tconst { width, length } = dimensions;\n\tconst color = template?.color ?? definition?.color ?? \"#4CAF50\";\n\tconst rotationRad = (hole.rotation * Math.PI) / 180;\n\n\tfunction handlePointerDown(e: ThreeEvent<PointerEvent>) {\n\t\tif (tool !== \"select\" || !isSelected) return;\n\t\tif (viewportInfo && !isEventForThisViewport(e, viewportInfo)) return;\n\t\te.stopPropagation();\n\t\tdragStart.current = { x: hole.position.x, z: hole.position.z };\n\t\tpointerStartScreen.current = {\n\t\t\tx: e.nativeEvent.clientX,\n\t\t\ty: e.nativeEvent.clientY,\n\t\t};\n\t\t// Don't setIsDragging(true) yet — wait for deadzone\n\t}\n\n\tfunction handlePointerMove(e: ThreeEvent<PointerEvent>) {\n\t\tif (!dragStart.current || !pointerStartScreen.current) return;\n\t\tif (viewportInfo && !isEventForThisViewport(e, viewportInfo)) return;\n\t\te.stopPropagation();\n\n\t\t// Check deadzone if not yet dragging\n\t\tif (!isDragging) {\n\t\t\tconst dx = e.nativeEvent.clientX - pointerStartScreen.current.x;\n\t\t\tconst dy = e.nativeEvent.clientY - pointerStartScreen.current.y;\n\t\t\tif (Math.hypot(dx, dy) < 10) return;\n\t\t\t// Past deadzone — start dragging\n\t\t\tsetIsDragging(true);\n\t\t\tuseStore.temporal?.getState()?.pause();\n\t\t}\n\n\t\tconst intersection = new THREE.Vector3();\n\t\traycaster.ray.intersectPlane(floorPlane, intersection);\n\n\t\tif (intersection) {\n\t\t\tlet x = intersection.x;\n\t\t\tlet z = intersection.z;\n\n\t\t\tif (snapEnabled) {\n\t\t\t\tx = snapToGrid(x, 0.25);\n\t\t\t\tz = snapToGrid(z, 0.25);\n\t\t\t}\n\n\t\t\tx = Math.max(width / 2, Math.min(hall.width - width / 2, x));\n\t\t\tz = Math.max(length / 2, Math.min(hall.length - length / 2, z));\n\n\t\t\tconst inBounds = checkHallBounds(\n\t\t\t\t{ x, z },\n\t\t\t\thole.rotation,\n\t\t\t\twidth,\n\t\t\t\tlength,\n\t\t\t\thall,\n\t\t\t);\n\t\t\tconst obbMap: Record<\n\t\t\t\tstring,\n\t\t\t\t{\n\t\t\t\t\tpos: { x: number; z: number };\n\t\t\t\t\trot: number;\n\t\t\t\t\tw: number;\n\t\t\t\t\tl: number;\n\t\t\t\t}\n\t\t\t> = {};\n\t\t\tfor (const [id, h] of Object.entries(holes)) {\n\t\t\t\tif (h.templateId && holeTemplates[h.templateId]) {\n\t\t\t\t\tconst bounds = computeTemplateBounds(holeTemplates[h.templateId]);\n\t\t\t\t\tobbMap[id] = {\n\t\t\t\t\t\tpos: h.position,\n\t\t\t\t\t\trot: h.rotation,\n\t\t\t\t\t\tw: bounds.width,\n\t\t\t\t\t\tl: bounds.length,\n\t\t\t\t\t};\n\t\t\t\t} else {\n\t\t\t\t\tconst def = HOLE_TYPE_MAP[h.type];\n\t\t\t\t\tif (!def) continue;\n\t\t\t\t\tobbMap[id] = {\n\t\t\t\t\t\tpos: h.position,\n\t\t\t\t\t\trot: h.rotation,\n\t\t\t\t\t\tw: def.dimensions.width,\n\t\t\t\t\t\tl: def.dimensions.length,\n\t\t\t\t\t};\n\t\t\t\t}\n\t\t\t}\n\t\t\tconst collides = checkAnyCollision(\n\t\t\t\t{ pos: { x, z }, rot: hole.rotation, w: width, l: length },\n\t\t\t\tobbMap,\n\t\t\t\thole.id,\n\t\t\t);\n\n\t\t\tif (inBounds && !collides) {\n\t\t\t\tupdateHole(hole.id, { position: { x, z } });\n\t\t\t}\n\t\t}\n\t}\n\n\tfunction handlePointerUp(e: ThreeEvent<PointerEvent>) {\n\t\tif (!dragStart.current) return;\n\t\te.stopPropagation();\n\t\tif (isDragging) {\n\t\t\tuseStore.temporal?.getState()?.resume();\n\t\t}\n\t\tsetIsDragging(false);\n\t\tdragStart.current = null;\n\t\tpointerStartScreen.current = null;\n\t}\n\n\tconst showOverlay =\n\t\tisDragging || isSelected || (tool === \"delete\" && isHovered);\n\tconst overlayColor = isDragging\n\t\t? \"#FFE082\"\n\t\t: tool === \"delete\" && isHovered\n\t\t\t? \"#EF5350\"\n\t\t\t: \"#FFC107\";\n\tconst modelHeight = MODEL_HEIGHTS[hole.type] ?? SURFACE_THICKNESS + 0.08;\n\n\treturn (\n\t\t<group\n\t\t\tposition={[hole.position.x, 0, hole.position.z]}\n\t\t\trotation={[0, rotationRad, 0]}\n\t\t>\n\t\t\t{/* Interaction mesh — always raycastable, tinted overlay when active */}\n\t\t\t{/* biome-ignore lint/a11y/noStaticElementInteractions: R3F mesh element, not HTML */}\n\t\t\t<mesh\n\t\t\t\tposition={[0, INTERACTION_HEIGHT / 2, 0]}\n\t\t\t\tonClick={(e) => {\n\t\t\t\t\tif (viewportInfo && !isEventForThisViewport(e, viewportInfo))\n\t\t\t\t\t\treturn;\n\t\t\t\t\te.stopPropagation();\n\t\t\t\t\tif (tool === \"delete\") {\n\t\t\t\t\t\tremoveHole(hole.id);\n\t\t\t\t\t} else {\n\t\t\t\t\t\tonClick();\n\t\t\t\t\t}\n\t\t\t\t}}\n\t\t\t\tonPointerDown={handlePointerDown}\n\t\t\t\tonPointerMove={handlePointerMove}\n\t\t\t\tonPointerUp={handlePointerUp}\n\t\t\t\tonPointerEnter={(e) => {\n\t\t\t\t\tif (viewportInfo && !isEventForThisViewport(e, viewportInfo))\n\t\t\t\t\t\treturn;\n\t\t\t\t\tsetIsHovered(true);\n\t\t\t\t}}\n\t\t\t\tonPointerLeave={(e) => {\n\t\t\t\t\tif (viewportInfo && !isEventForThisViewport(e, viewportInfo))\n\t\t\t\t\t\treturn;\n\t\t\t\t\tsetIsHovered(false);\n\t\t\t\t}}\n\t\t\t>\n\t\t\t\t<boxGeometry args={[width, INTERACTION_HEIGHT, length]} />\n\t\t\t\t<meshStandardMaterial\n\t\t\t\t\tcolor={showOverlay ? overlayColor : \"#000000\"}\n\t\t\t\t\ttransparent\n\t\t\t\t\topacity={showOverlay ? 0.35 : 0}\n\t\t\t\t\tdepthWrite={false}\n\t\t\t\t/>\n\t\t\t</mesh>\n\n\t\t\t{/* Drag plane — invisible floor plane that catches pointer moves during drag */}\n\t\t\t{isDragging && (\n\t\t\t\t<mesh\n\t\t\t\t\trotation={[-Math.PI / 2, 0, 0]}\n\t\t\t\t\tposition={[\n\t\t\t\t\t\thall.width / 2 - hole.position.x,\n\t\t\t\t\t\t0.01,\n\t\t\t\t\t\thall.length / 2 - hole.position.z,\n\t\t\t\t\t]}\n\t\t\t\t\tonPointerMove={handlePointerMove}\n\t\t\t\t\tonPointerUp={handlePointerUp}\n\t\t\t\t\tvisible={false}\n\t\t\t\t>\n\t\t\t\t\t<planeGeometry args={[hall.width * 2, hall.length * 2]} />\n\t\t\t\t\t<meshBasicMaterial transparent opacity={0} />\n\t\t\t\t</mesh>\n\t\t\t)}\n\n\t\t\t{/* Visual model */}\n\t\t\t<HoleModel\n\t\t\t\ttype={hole.type}\n\t\t\t\twidth={width}\n\t\t\t\tlength={length}\n\t\t\t\tcolor={color}\n\t\t\t\ttemplateId={hole.templateId}\n\t\t\t/>\n\n\t\t\t{/* Selection outline — sized to model height */}\n\t\t\t{isSelected && (\n\t\t\t\t<lineSegments position={[0, modelHeight / 2, 0]}>\n\t\t\t\t\t<edgesGeometry\n\t\t\t\t\t\targs={[\n\t\t\t\t\t\t\tnew THREE.BoxGeometry(\n\t\t\t\t\t\t\t\twidth + 0.05,\n\t\t\t\t\t\t\t\tmodelHeight + 0.05,\n\t\t\t\t\t\t\t\tlength + 0.05,\n\t\t\t\t\t\t\t),\n\t\t\t\t\t\t]}\n\t\t\t\t\t/>\n\t\t\t\t\t<lineBasicMaterial color=\"#FF9800\" />\n\t\t\t\t</lineSegments>\n\t\t\t)}\n\t\t</group>\n\t);\n}\n"},"response":"{\"type\":\"update\",\"filePath\":\"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/MiniGolfHole.tsx\",\"content\":\"import type { ThreeEvent } from \\\"@react-three/fiber\\\";\\nimport { useThree } from \\\"@react-three/fiber\\\";\\nimport { useMemo, useRef, useState } from \\\"react\\\";\\nimport * as THREE from \\\"three\\\";\\nimport { HOLE_TYPE_MAP } from \\\"../../constants\\\";\\nimport {\\n\\tisEventForThisViewport,\\n\\tuseViewportInfo,\\n} from \\\"../../contexts/ViewportContext\\\";\\nimport { useStore } from \\\"../../store\\\";\\nimport type { Hole } from \\\"../../types\\\";\\nimport { computeTemplateBounds } from \\\"../../utils/chainCompute\\\";\\nimport { checkAnyCollision, checkHallBounds } from \\\"../../utils/collision\\\";\\nimport { snapToGrid } from \\\"../../utils/snap\\\";\\nimport { HoleModel } from \\\"./holes/HoleModel\\\";\\nimport { MODEL_HEIGHTS, SURFACE_THICKNESS } from \\\"./holes/shared\\\";\\n\\ntype Props = {\\n\\thole: Hole;\\n\\tisSelected: boolean;\\n\\tonClick: () => void;\\n};\\n\\nconst INTERACTION_HEIGHT = 0.3;\\nconst "}
+{"timestamp":"2026-02-22T12:34:24Z","type":"tool","tool":"Write","input":{"file_path":"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/RotationHandle.tsx","content":"import type { ThreeEvent } from \"@react-three/fiber\";\nimport { useRef, useState } from \"react\";\nimport {\n\tisEventForThisViewport,\n\tuseViewportInfo,\n} from \"../../contexts/ViewportContext\";\nimport { useStore } from \"../../store\";\nimport { isMobile } from \"../../utils/isMobile\";\n\nconst RING_RADIUS = 1.2;\nconst SNAP_DEG = 15;\nconst SPHERE_RADIUS = isMobile ? 0.35 : 0.12;\nconst SPHERE_SEGMENTS = isMobile ? 8 : 16;\nconst RING_SEGMENTS = isMobile ? 32 : 64;\n\ntype RotationHandleProps = {\n\tholeId: string;\n\tholeX: number;\n\tholeZ: number;\n\trotation: number;\n};\n\nexport function RotationHandle({\n\tholeId,\n\tholeX,\n\tholeZ,\n\trotation,\n}: RotationHandleProps) {\n\tconst updateHole = useStore((s) => s.updateHole);\n\tconst [isDragging, setIsDragging] = useState(false);\n\tconst shiftHeld = useRef(false);\n\tconst viewportInfo = useViewportInfo();\n\n\tconst rotRad = (rotation * Math.PI) / 180;\n\tconst handleX = Math.sin(rotRad) * RING_RADIUS;\n\tconst handleZ = Math.cos(rotRad) * RING_RADIUS;\n\n\tfunction handlePointerDown(e: ThreeEvent<PointerEvent>) {\n\t\tif (viewportInfo && !isEventForThisViewport(e, viewportInfo)) return;\n\t\te.stopPropagation();\n\t\tsetIsDragging(true);\n\t\tshiftHeld.current = e.nativeEvent.shiftKey;\n\t\tuseStore.temporal?.getState()?.pause();\n\t}\n\n\tfunction handlePointerMove(e: ThreeEvent<PointerEvent>) {\n\t\tif (!isDragging) return;\n\t\te.stopPropagation();\n\t\tshiftHeld.current = e.nativeEvent.shiftKey;\n\n\t\tconst dx = e.point.x - holeX;\n\t\tconst dz = e.point.z - holeZ;\n\t\tlet angleDeg = (Math.atan2(dx, dz) * 180) / Math.PI;\n\t\tangleDeg = ((angleDeg % 360) + 360) % 360;\n\n\t\tif (!shiftHeld.current) {\n\t\t\tangleDeg = Math.round(angleDeg / SNAP_DEG) * SNAP_DEG;\n\t\t}\n\n\t\tupdateHole(holeId, { rotation: angleDeg });\n\t}\n\n\tfunction handlePointerUp(e: ThreeEvent<PointerEvent>) {\n\t\tif (!isDragging) return;\n\t\te.stopPropagation();\n\t\tsetIsDragging(false);\n\t\tuseStore.temporal?.getState()?.resume();\n\t}\n\n\treturn (\n\t\t<group position={[holeX, 0.01, holeZ]}>\n\t\t\t{/* Ring outline */}\n\t\t\t<mesh rotation={[-Math.PI / 2, 0, 0]}>\n\t\t\t\t<ringGeometry\n\t\t\t\t\targs={[RING_RADIUS - 0.03, RING_RADIUS + 0.03, RING_SEGMENTS]}\n\t\t\t\t/>\n\t\t\t\t<meshBasicMaterial color=\"#FF9800\" transparent opacity={0.6} />\n\t\t\t</mesh>\n\t\t\t{/* Drag handle sphere */}\n\t\t\t<mesh\n\t\t\t\tposition={[handleX, 0, handleZ]}\n\t\t\t\tonPointerDown={handlePointerDown}\n\t\t\t\tonPointerMove={handlePointerMove}\n\t\t\t\tonPointerUp={handlePointerUp}\n\t\t\t>\n\t\t\t\t<sphereGeometry\n\t\t\t\t\targs={[SPHERE_RADIUS, SPHERE_SEGMENTS, SPHERE_SEGMENTS]}\n\t\t\t\t/>\n\t\t\t\t<meshStandardMaterial color={isDragging ? \"#FFE082\" : \"#FF9800\"} />\n\t\t\t</mesh>\n\t\t\t{/* Drag plane — invisible floor plane for rotation drag continuity */}\n\t\t\t{isDragging && (\n\t\t\t\t<mesh\n\t\t\t\t\trotation={[-Math.PI / 2, 0, 0]}\n\t\t\t\t\tposition={[0, 0, 0]}\n\t\t\t\t\tonPointerMove={handlePointerMove}\n\t\t\t\t\tonPointerUp={handlePointerUp}\n\t\t\t\t\tvisible={false}\n\t\t\t\t>\n\t\t\t\t\t<planeGeometry args={[20, 20]} />\n\t\t\t\t\t<meshBasicMaterial transparent opacity={0} />\n\t\t\t\t</mesh>\n\t\t\t)}\n\t\t</group>\n\t);\n}\n"},"response":"{\"type\":\"update\",\"filePath\":\"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/RotationHandle.tsx\",\"content\":\"import type { ThreeEvent } from \\\"@react-three/fiber\\\";\\nimport { useRef, useState } from \\\"react\\\";\\nimport {\\n\\tisEventForThisViewport,\\n\\tuseViewportInfo,\\n} from \\\"../../contexts/ViewportContext\\\";\\nimport { useStore } from \\\"../../store\\\";\\nimport { isMobile } from \\\"../../utils/isMobile\\\";\\n\\nconst RING_RADIUS = 1.2;\\nconst SNAP_DEG = 15;\\nconst SPHERE_RADIUS = isMobile ? 0.35 : 0.12;\\nconst SPHERE_SEGMENTS = isMobile ? 8 : 16;\\nconst RING_SEGMENTS = isMobile ? 32 : 64;\\n\\ntype RotationHandleProps = {\\n\\tholeId: string;\\n\\tholeX: number;\\n\\tholeZ: number;\\n\\trotation: number;\\n};\\n\\nexport function RotationHandle({\\n\\tholeId,\\n\\tholeX,\\n\\tholeZ,\\n\\trotation,\\n}: RotationHandleProps) {\\n\\tconst updateHole = useStore((s) => s.updateHole);\\n\\tconst [isDragging, setIsDragging] = useState(false);\\n\\tconst shiftHeld = useRef(false);\\n\\tconst viewportInfo = useViewpo"}
+{"timestamp":"2026-02-22T12:34:32Z","type":"tool","tool":"Edit","input":{"file_path":"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/PlacementHandler.tsx","old_string":"import type { ThreeEvent } from \"@react-three/fiber\";\nimport { useMemo, useRef, useState } from \"react\";\nimport { HOLE_TYPE_MAP } from \"../../constants\";\nimport { useStore } from \"../../store\";","new_string":"import type { ThreeEvent } from \"@react-three/fiber\";\nimport { useMemo, useRef, useState } from \"react\";\nimport { HOLE_TYPE_MAP } from \"../../constants\";\nimport {\n\tisEventForThisViewport,\n\tuseViewportInfo,\n} from \"../../contexts/ViewportContext\";\nimport { useStore } from \"../../store\";","replace_all":false},"response":"{\"filePath\":\"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/PlacementHandler.tsx\",\"oldString\":\"import type { ThreeEvent } from \\\"@react-three/fiber\\\";\\nimport { useMemo, useRef, useState } from \\\"react\\\";\\nimport { HOLE_TYPE_MAP } from \\\"../../constants\\\";\\nimport { useStore } from \\\"../../store\\\";\",\"newString\":\"import type { ThreeEvent } from \\\"@react-three/fiber\\\";\\nimport { useMemo, useRef, useState } from \\\"react\\\";\\nimport { HOLE_TYPE_MAP } from \\\"../../constants\\\";\\nimport {\\n\\tisEventForThisViewport,\\n\\tuseViewportInfo,\\n} from \\\"../../contexts/ViewportContext\\\";\\nimport { useStore } from \\\"../../store\\\";\",\"originalFile\":\"import type { ThreeEvent } from \\\"@react-three/fiber\\\";\\nimport { useMemo, useRef, useState } from \\\"react\\\";\\nimport { HOLE_TYPE_MAP } from \\\"../../constants\\\";\\nimport { useStore } from \\\"../../store\\\";\\nimport type { HoleTemplate } from \\\"../../types/template\\\";\\nimport { computeTemplateBounds } from \\\"../../utils/chainCompute\\\";\\nimport { che"}
+{"timestamp":"2026-02-22T12:34:42Z","type":"tool","tool":"Edit","input":{"file_path":"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/PlacementHandler.tsx","old_string":"\tconst pointerDownScreen = useRef<{ x: number; y: number } | null>(null);\n\tconst pointerDownWorld = useRef<{ x: number; z: number } | null>(null);\n\n\tconst isPlacing = tool === \"place\" && (placingType != null || placingTemplateId != null);","new_string":"\tconst pointerDownScreen = useRef<{ x: number; y: number } | null>(null);\n\tconst pointerDownWorld = useRef<{ x: number; z: number } | null>(null);\n\tconst viewportInfo = useViewportInfo();\n\n\tconst isPlacing = tool === \"place\" && (placingType != null || placingTemplateId != null);","replace_all":false},"response":"{\"filePath\":\"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/PlacementHandler.tsx\",\"oldString\":\"\\tconst pointerDownScreen = useRef<{ x: number; y: number } | null>(null);\\n\\tconst pointerDownWorld = useRef<{ x: number; z: number } | null>(null);\\n\\n\\tconst isPlacing = tool === \\\"place\\\" && (placingType != null || placingTemplateId != null);\",\"newString\":\"\\tconst pointerDownScreen = useRef<{ x: number; y: number } | null>(null);\\n\\tconst pointerDownWorld = useRef<{ x: number; z: number } | null>(null);\\n\\tconst viewportInfo = useViewportInfo();\\n\\n\\tconst isPlacing = tool === \\\"place\\\" && (placingType != null || placingTemplateId != null);\",\"originalFile\":\"import type { ThreeEvent } from \\\"@react-three/fiber\\\";\\nimport { useMemo, useRef, useState } from \\\"react\\\";\\nimport { HOLE_TYPE_MAP } from \\\"../../constants\\\";\\nimport {\\n\\tisEventForThisViewport,\\n\\tuseViewportInfo,\\n} from \\\"../../contexts/ViewportContext\\\";\\nimport { useStore } from \\\"../../store\\\";\\nimport type { H"}
+{"timestamp":"2026-02-22T12:34:49Z","type":"tool","tool":"Edit","input":{"file_path":"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/PlacementHandler.tsx","old_string":"\tfunction handlePointerMove(e: ThreeEvent<PointerEvent>) {\n\t\tif (!isPlacing) return;\n\t\tconst pos = computePosition({ x: e.point.x, z: e.point.z });","new_string":"\tfunction handlePointerMove(e: ThreeEvent<PointerEvent>) {\n\t\tif (!isPlacing) return;\n\t\tif (viewportInfo && !isEventForThisViewport(e, viewportInfo)) return;\n\t\tconst pos = computePosition({ x: e.point.x, z: e.point.z });","replace_all":false},"response":"{\"filePath\":\"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/PlacementHandler.tsx\",\"oldString\":\"\\tfunction handlePointerMove(e: ThreeEvent<PointerEvent>) {\\n\\t\\tif (!isPlacing) return;\\n\\t\\tconst pos = computePosition({ x: e.point.x, z: e.point.z });\",\"newString\":\"\\tfunction handlePointerMove(e: ThreeEvent<PointerEvent>) {\\n\\t\\tif (!isPlacing) return;\\n\\t\\tif (viewportInfo && !isEventForThisViewport(e, viewportInfo)) return;\\n\\t\\tconst pos = computePosition({ x: e.point.x, z: e.point.z });\",\"originalFile\":\"import type { ThreeEvent } from \\\"@react-three/fiber\\\";\\nimport { useMemo, useRef, useState } from \\\"react\\\";\\nimport { HOLE_TYPE_MAP } from \\\"../../constants\\\";\\nimport {\\n\\tisEventForThisViewport,\\n\\tuseViewportInfo,\\n} from \\\"../../contexts/ViewportContext\\\";\\nimport { useStore } from \\\"../../store\\\";\\nimport type { HoleTemplate } from \\\"../../types/template\\\";\\nimport { computeTemplateBounds } from \\\"../../utils/chainCompute\\\";\\nimport { checkAnyCollision, checkHall"}
+{"timestamp":"2026-02-22T12:34:54Z","type":"tool","tool":"Edit","input":{"file_path":"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/PlacementHandler.tsx","old_string":"\tfunction handlePointerDown(e: ThreeEvent<PointerEvent>) {\n\t\tif (!isPlacing || !isMobile) return;","new_string":"\tfunction handlePointerDown(e: ThreeEvent<PointerEvent>) {\n\t\tif (!isPlacing || !isMobile) return;\n\t\tif (viewportInfo && !isEventForThisViewport(e, viewportInfo)) return;","replace_all":false},"response":"{\"filePath\":\"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/PlacementHandler.tsx\",\"oldString\":\"\\tfunction handlePointerDown(e: ThreeEvent<PointerEvent>) {\\n\\t\\tif (!isPlacing || !isMobile) return;\",\"newString\":\"\\tfunction handlePointerDown(e: ThreeEvent<PointerEvent>) {\\n\\t\\tif (!isPlacing || !isMobile) return;\\n\\t\\tif (viewportInfo && !isEventForThisViewport(e, viewportInfo)) return;\",\"originalFile\":\"import type { ThreeEvent } from \\\"@react-three/fiber\\\";\\nimport { useMemo, useRef, useState } from \\\"react\\\";\\nimport { HOLE_TYPE_MAP } from \\\"../../constants\\\";\\nimport {\\n\\tisEventForThisViewport,\\n\\tuseViewportInfo,\\n} from \\\"../../contexts/ViewportContext\\\";\\nimport { useStore } from \\\"../../store\\\";\\nimport type { HoleTemplate } from \\\"../../types/template\\\";\\nimport { computeTemplateBounds } from \\\"../../utils/chainCompute\\\";\\nimport { checkAnyCollision, checkHallBounds } from \\\"../../utils/collision\\\";\\nimport { isMobile } from \\\"../../utils/isMobile\\\";\\nimport { sna"}
+{"timestamp":"2026-02-22T12:35:00Z","type":"tool","tool":"Edit","input":{"file_path":"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/PlacementHandler.tsx","old_string":"\tfunction handlePointerUp(e: ThreeEvent<PointerEvent>) {\n\t\tif (!isMobile) return;","new_string":"\tfunction handlePointerUp(e: ThreeEvent<PointerEvent>) {\n\t\tif (!isMobile) return;\n\t\tif (viewportInfo && !isEventForThisViewport(e, viewportInfo)) return;","replace_all":false},"response":"{\"filePath\":\"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/PlacementHandler.tsx\",\"oldString\":\"\\tfunction handlePointerUp(e: ThreeEvent<PointerEvent>) {\\n\\t\\tif (!isMobile) return;\",\"newString\":\"\\tfunction handlePointerUp(e: ThreeEvent<PointerEvent>) {\\n\\t\\tif (!isMobile) return;\\n\\t\\tif (viewportInfo && !isEventForThisViewport(e, viewportInfo)) return;\",\"originalFile\":\"import type { ThreeEvent } from \\\"@react-three/fiber\\\";\\nimport { useMemo, useRef, useState } from \\\"react\\\";\\nimport { HOLE_TYPE_MAP } from \\\"../../constants\\\";\\nimport {\\n\\tisEventForThisViewport,\\n\\tuseViewportInfo,\\n} from \\\"../../contexts/ViewportContext\\\";\\nimport { useStore } from \\\"../../store\\\";\\nimport type { HoleTemplate } from \\\"../../types/template\\\";\\nimport { computeTemplateBounds } from \\\"../../utils/chainCompute\\\";\\nimport { checkAnyCollision, checkHallBounds } from \\\"../../utils/collision\\\";\\nimport { isMobile } from \\\"../../utils/isMobile\\\";\\nimport { snapToGrid } from \\\"../../utils/sna"}
+{"timestamp":"2026-02-22T12:35:06Z","type":"tool","tool":"Edit","input":{"file_path":"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/PlacementHandler.tsx","old_string":"\tfunction handleClick(e: ThreeEvent<MouseEvent>) {\n\t\te.stopPropagation();\n\n\t\tif (isMobile) return;","new_string":"\tfunction handleClick(e: ThreeEvent<MouseEvent>) {\n\t\tif (viewportInfo && !isEventForThisViewport(e, viewportInfo)) return;\n\t\te.stopPropagation();\n\n\t\tif (isMobile) return;","replace_all":false},"response":"{\"filePath\":\"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/PlacementHandler.tsx\",\"oldString\":\"\\tfunction handleClick(e: ThreeEvent<MouseEvent>) {\\n\\t\\te.stopPropagation();\\n\\n\\t\\tif (isMobile) return;\",\"newString\":\"\\tfunction handleClick(e: ThreeEvent<MouseEvent>) {\\n\\t\\tif (viewportInfo && !isEventForThisViewport(e, viewportInfo)) return;\\n\\t\\te.stopPropagation();\\n\\n\\t\\tif (isMobile) return;\",\"originalFile\":\"import type { ThreeEvent } from \\\"@react-three/fiber\\\";\\nimport { useMemo, useRef, useState } from \\\"react\\\";\\nimport { HOLE_TYPE_MAP } from \\\"../../constants\\\";\\nimport {\\n\\tisEventForThisViewport,\\n\\tuseViewportInfo,\\n} from \\\"../../contexts/ViewportContext\\\";\\nimport { useStore } from \\\"../../store\\\";\\nimport type { HoleTemplate } from \\\"../../types/template\\\";\\nimport { computeTemplateBounds } from \\\"../../utils/chainCompute\\\";\\nimport { checkAnyCollision, checkHallBounds } from \\\"../../utils/collision\\\";\\nimport { isMobile } from \\\"../../utils/isMobile\\\";\\nim"}
+{"timestamp":"2026-02-22T12:35:14Z","type":"tool","tool":"Grep","input":{"pattern":"useCallback","path":"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/layout/DualViewport.tsx","output_mode":"content"},"response":"{\"mode\":\"content\",\"numFiles\":0,\"filenames\":[],\"content\":\"11:import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from \\\"react\\\";\",\"numLines\":1}"}
+{"timestamp":"2026-02-22T12:35:19Z","type":"tool","tool":"Edit","input":{"file_path":"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/layout/DualViewport.tsx","old_string":"import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from \"react\";","new_string":"import { Suspense, useEffect, useMemo, useRef, useState } from \"react\";","replace_all":false},"response":"{\"filePath\":\"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/layout/DualViewport.tsx\",\"oldString\":\"import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from \\\"react\\\";\",\"newString\":\"import { Suspense, useEffect, useMemo, useRef, useState } from \\\"react\\\";\",\"originalFile\":\"import {\\n\\tCameraControls,\\n\\tOrbitControls,\\n\\tOrthographicCamera,\\n\\tPerspectiveCamera,\\n\\tSoftShadows,\\n\\tView,\\n} from \\\"@react-three/drei\\\";\\nimport { Canvas } from \\\"@react-three/fiber\\\";\\nimport type CameraControlsImpl from \\\"camera-controls\\\";\\nimport { Suspense, useCallback, useEffect, useMemo, useRef, useState } from \\\"react\\\";\\nimport { MOUSE, NoToneMapping, TOUCH } from \\\"three\\\";\\nimport type { OrbitControls as OrbitControlsImpl } from \\\"three-stdlib\\\";\\nimport { useKeyboardControls } from \\\"../../hooks/useKeyboardControls\\\";\\nimport { useSplitPane } from \\\"../../hooks/useSplitPane\\\";\\nimport type { SunData } from \\\"../../hooks/useSunPosition\\\";\\nimport { useStore } from \\\"../.."}
+{"timestamp":"2026-02-22T12:35:25Z","type":"tool","tool":"Bash","input":{"command":"export PATH=\"/home/ben/.local/share/fnm:$PATH\" && eval \"$(fnm env)\" && npx tsc --noEmit 2>&1 | head -30","timeout":60000,"description":"Run TypeScript type check for section 06"},"response":"{\"stdout\":\"\",\"stderr\":\"\",\"interrupted\":false,\"isImage\":false,\"noOutputExpected\":false}"}
+{"timestamp":"2026-02-22T12:36:30Z","type":"tool","tool":"Bash","input":{"command":"export PATH=\"/home/ben/.local/share/fnm:$PATH\" && eval \"$(fnm env)\" && npx vitest run 2>&1 | tail -10","timeout":120000,"description":"Run full test suite"},"response":"{\"stdout\":\" \\u001b[32m✓\\u001b[39m tests/components/three/hallEnvironment.test.ts \\u001b[2m(\\u001b[22m\\u001b[2m15 tests\\u001b[22m\\u001b[2m)\\u001b[22m\\u001b[32m 4\\u001b[2mms\\u001b[22m\\u001b[39m\\n \\u001b[32m✓\\u001b[39m tests/reflections.test.ts \\u001b[2m(\\u001b[22m\\u001b[2m10 tests\\u001b[22m\\u001b[2m)\\u001b[22m\\u001b[32m 3\\u001b[2mms\\u001b[22m\\u001b[39m\\n \\u001b[32m✓\\u001b[39m tests/utils/saveManager.test.ts \\u001b[2m(\\u001b[22m\\u001b[2m7 tests\\u001b[22m\\u001b[2m)\\u001b[22m\\u001b[32m 9\\u001b[2mms\\u001b[22m\\u001b[39m\\n \\u001b[32m✓\\u001b[39m tests/utils/isMobile.test.ts \\u001b[2m(\\u001b[22m\\u001b[2m1 test\\u001b[22m\\u001b[2m)\\u001b[22m\\u001b[32m 11\\u001b[2mms\\u001b[22m\\u001b[39m\\n\\n\\u001b[2m Test Files \\u001b[22m \\u001b[1m\\u001b[32m49 passed\\u001b[39m\\u001b[22m\\u001b[90m (49)\\u001b[39m\\n\\u001b[2m      Tests \\u001b[22m \\u001b[1m\\u001b[32m560 passed\\u001b[39m\\u001b[22m\\u001b[90m (560)\\u001b[39m\\n\\u001b[2m   Start at \\u001b[22m 13:35:39\\n\\u001b[2m   Duration \\u001b[22m 47.23s\\u001b[2m ("}
diff --git a/src/components/layout/DualViewport.tsx b/src/components/layout/DualViewport.tsx
index 7429ed3..2c06e93 100644
--- a/src/components/layout/DualViewport.tsx
+++ b/src/components/layout/DualViewport.tsx
@@ -8,7 +8,7 @@ import {
 } from "@react-three/drei";
 import { Canvas } from "@react-three/fiber";
 import type CameraControlsImpl from "camera-controls";
-import { Suspense, useEffect, useMemo, useRef } from "react";
+import { Suspense, useEffect, useMemo, useRef, useState } from "react";
 import { MOUSE, NoToneMapping, TOUCH } from "three";
 import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
 import { useKeyboardControls } from "../../hooks/useKeyboardControls";
@@ -29,6 +29,8 @@ import {
 } from "../../utils/environmentGating";
 import { isMobile } from "../../utils/isMobile";
 import { canvasPointerEvents } from "../../utils/uvTransitionConfig";
+import { ViewportContext } from "../../contexts/ViewportContext";
+import type { ViewportInfo } from "../../contexts/ViewportContext";
 import { CameraPresets } from "../three/CameraPresets";
 import { PlacementHandler } from "../three/PlacementHandler";
 import { SharedScene } from "../three/SharedScene";
@@ -106,6 +108,42 @@ export function DualViewport({ sunData }: DualViewportProps) {
 	const show3D = viewportLayout !== "2d-only";
 	const showDivider = viewportLayout === "dual";
 
+	// Track the divider X position for position-based event gating
+	const [paneBoundaryX, setPaneBoundaryX] = useState<number | null>(null);
+
+	useEffect(() => {
+		if (!showDivider) {
+			setPaneBoundaryX(null);
+			return;
+		}
+		const el = pane2DRef.current;
+		if (!el) return;
+		const updateBoundary = () => {
+			const rect = el.getBoundingClientRect();
+			setPaneBoundaryX(rect.right);
+		};
+		updateBoundary();
+		const observer = new ResizeObserver(updateBoundary);
+		observer.observe(el);
+		return () => observer.disconnect();
+	}, [showDivider]);
+
+	// Update boundary when splitRatio changes (resize observer may miss CSS calc changes)
+	useEffect(() => {
+		if (!showDivider || !pane2DRef.current) return;
+		const rect = pane2DRef.current.getBoundingClientRect();
+		setPaneBoundaryX(rect.right);
+	}, [showDivider, splitRatio]);
+
+	const viewport2DInfo: ViewportInfo = useMemo(
+		() => ({ id: "2d", paneBoundaryX }),
+		[paneBoundaryX],
+	);
+	const viewport3DInfo: ViewportInfo = useMemo(
+		() => ({ id: "3d", paneBoundaryX }),
+		[paneBoundaryX],
+	);
+
 	// Camera defaults
 	const defaultTarget: [number, number, number] = useMemo(
 		() => [hall.width / 2, 0, hall.length / 2],
@@ -207,34 +245,36 @@ export function DualViewport({ sunData }: DualViewportProps) {
 					onPointerEnter={() => setActiveViewport("2d")}
 				>
 					<View style={{ width: "100%", height: "100%" }}>
-						<OrthographicCamera
-							makeDefault
-							position={[defaultTarget[0], 50, defaultTarget[2]]}
-							zoom={DEFAULT_ORTHO_ZOOM}
-							near={0.1}
-							far={200}
-						/>
-						<OrbitControls
-							ref={controls2DRef}
-							target={defaultTarget}
-							enableRotate={false}
-							enablePan={true}
-							enableZoom={true}
-							minZoom={MIN_ORTHO_ZOOM}
-							maxZoom={MAX_ORTHO_ZOOM}
-							mouseButtons={{
-								LEFT: undefined,
-								MIDDLE: MOUSE.PAN,
-								RIGHT: MOUSE.PAN,
-							}}
-							touches={{
-								ONE: TOUCH.PAN,
-								TWO: TOUCH.DOLLY_PAN,
-							}}
-							makeDefault
-						/>
-						<SharedScene sunData={sunData} />
-						<PlacementHandler />
+						<ViewportContext.Provider value={viewport2DInfo}>
+							<OrthographicCamera
+								makeDefault
+								position={[defaultTarget[0], 50, defaultTarget[2]]}
+								zoom={DEFAULT_ORTHO_ZOOM}
+								near={0.1}
+								far={200}
+							/>
+							<OrbitControls
+								ref={controls2DRef}
+								target={defaultTarget}
+								enableRotate={false}
+								enablePan={true}
+								enableZoom={true}
+								minZoom={MIN_ORTHO_ZOOM}
+								maxZoom={MAX_ORTHO_ZOOM}
+								mouseButtons={{
+									LEFT: undefined,
+									MIDDLE: MOUSE.PAN,
+									RIGHT: MOUSE.PAN,
+								}}
+								touches={{
+									ONE: TOUCH.PAN,
+									TWO: TOUCH.DOLLY_PAN,
+								}}
+								makeDefault
+							/>
+							<SharedScene sunData={sunData} />
+							<PlacementHandler />
+						</ViewportContext.Provider>
 					</View>
 				</div>
 			)}
@@ -261,20 +301,22 @@ export function DualViewport({ sunData }: DualViewportProps) {
 					onPointerEnter={() => setActiveViewport("3d")}
 				>
 					<View style={{ width: "100%", height: "100%" }}>
-						<PerspectiveCamera
-							makeDefault
-							position={initialIsoPosition}
-							fov={PERSPECTIVE_FOV}
-							near={0.1}
-							far={500}
-						/>
-						<CameraControls
-							ref={controls3DRef}
-							makeDefault
-						/>
-						<SharedScene sunData={sunData} />
-						<ThreeDOnlyContent />
-						{!show2D && <PlacementHandler />}
+						<ViewportContext.Provider value={viewport3DInfo}>
+							<PerspectiveCamera
+								makeDefault
+								position={initialIsoPosition}
+								fov={PERSPECTIVE_FOV}
+								near={0.1}
+								far={500}
+							/>
+							<CameraControls
+								ref={controls3DRef}
+								makeDefault
+							/>
+							<SharedScene sunData={sunData} />
+							<ThreeDOnlyContent />
+							{!show2D && <PlacementHandler />}
+						</ViewportContext.Provider>
 					</View>
 					{/* Camera presets overlay (HTML, outside Canvas) */}
 					<CameraPresets cameraControlsRef={controls3DRef} />
diff --git a/src/components/three/MiniGolfHole.tsx b/src/components/three/MiniGolfHole.tsx
index 996c994..9cbaa2d 100644
--- a/src/components/three/MiniGolfHole.tsx
+++ b/src/components/three/MiniGolfHole.tsx
@@ -3,10 +3,14 @@ import { useThree } from "@react-three/fiber";
 import { useMemo, useRef, useState } from "react";
 import * as THREE from "three";
 import { HOLE_TYPE_MAP } from "../../constants";
+import {
+	isEventForThisViewport,
+	useViewportInfo,
+} from "../../contexts/ViewportContext";
 import { useStore } from "../../store";
 import type { Hole } from "../../types";
-import { checkAnyCollision, checkHallBounds } from "../../utils/collision";
 import { computeTemplateBounds } from "../../utils/chainCompute";
+import { checkAnyCollision, checkHallBounds } from "../../utils/collision";
 import { snapToGrid } from "../../utils/snap";
 import { HoleModel } from "./holes/HoleModel";
 import { MODEL_HEIGHTS, SURFACE_THICKNESS } from "./holes/shared";
@@ -34,6 +38,7 @@ export function MiniGolfHole({ hole, isSelected, onClick }: Props) {
 	const [isHovered, setIsHovered] = useState(false);
 	const dragStart = useRef<{ x: number; z: number } | null>(null);
 	const pointerStartScreen = useRef<{ x: number; y: number } | null>(null);
+	const viewportInfo = useViewportInfo();
 
 	const template = hole.templateId ? holeTemplates[hole.templateId] : null;
 
@@ -56,12 +61,8 @@ export function MiniGolfHole({ hole, isSelected, onClick }: Props) {
 
 	function handlePointerDown(e: ThreeEvent<PointerEvent>) {
 		if (tool !== "select" || !isSelected) return;
+		if (viewportInfo && !isEventForThisViewport(e, viewportInfo)) return;
 		e.stopPropagation();
-		e.nativeEvent.target &&
-			"setPointerCapture" in (e.nativeEvent.target as Element) &&
-			(e.nativeEvent.target as Element).setPointerCapture(
-				e.nativeEvent.pointerId,
-			);
 		dragStart.current = { x: hole.position.x, z: hole.position.z };
 		pointerStartScreen.current = {
 			x: e.nativeEvent.clientX,
@@ -72,6 +73,7 @@ export function MiniGolfHole({ hole, isSelected, onClick }: Props) {
 
 	function handlePointerMove(e: ThreeEvent<PointerEvent>) {
 		if (!dragStart.current || !pointerStartScreen.current) return;
+		if (viewportInfo && !isEventForThisViewport(e, viewportInfo)) return;
 		e.stopPropagation();
 
 		// Check deadzone if not yet dragging
@@ -177,6 +179,8 @@ export function MiniGolfHole({ hole, isSelected, onClick }: Props) {
 			<mesh
 				position={[0, INTERACTION_HEIGHT / 2, 0]}
 				onClick={(e) => {
+					if (viewportInfo && !isEventForThisViewport(e, viewportInfo))
+						return;
 					e.stopPropagation();
 					if (tool === "delete") {
 						removeHole(hole.id);
@@ -187,8 +191,16 @@ export function MiniGolfHole({ hole, isSelected, onClick }: Props) {
 				onPointerDown={handlePointerDown}
 				onPointerMove={handlePointerMove}
 				onPointerUp={handlePointerUp}
-				onPointerEnter={() => setIsHovered(true)}
-				onPointerLeave={() => setIsHovered(false)}
+				onPointerEnter={(e) => {
+					if (viewportInfo && !isEventForThisViewport(e, viewportInfo))
+						return;
+					setIsHovered(true);
+				}}
+				onPointerLeave={(e) => {
+					if (viewportInfo && !isEventForThisViewport(e, viewportInfo))
+						return;
+					setIsHovered(false);
+				}}
 			>
 				<boxGeometry args={[width, INTERACTION_HEIGHT, length]} />
 				<meshStandardMaterial
@@ -199,6 +211,24 @@ export function MiniGolfHole({ hole, isSelected, onClick }: Props) {
 				/>
 			</mesh>
 
+			{/* Drag plane — invisible floor plane that catches pointer moves during drag */}
+			{isDragging && (
+				<mesh
+					rotation={[-Math.PI / 2, 0, 0]}
+					position={[
+						hall.width / 2 - hole.position.x,
+						0.01,
+						hall.length / 2 - hole.position.z,
+					]}
+					onPointerMove={handlePointerMove}
+					onPointerUp={handlePointerUp}
+					visible={false}
+				>
+					<planeGeometry args={[hall.width * 2, hall.length * 2]} />
+					<meshBasicMaterial transparent opacity={0} />
+				</mesh>
+			)}
+
 			{/* Visual model */}
 			<HoleModel
 				type={hole.type}
diff --git a/src/components/three/PlacementHandler.tsx b/src/components/three/PlacementHandler.tsx
index 10e8695..0818a8d 100644
--- a/src/components/three/PlacementHandler.tsx
+++ b/src/components/three/PlacementHandler.tsx
@@ -1,6 +1,10 @@
 import type { ThreeEvent } from "@react-three/fiber";
 import { useMemo, useRef, useState } from "react";
 import { HOLE_TYPE_MAP } from "../../constants";
+import {
+	isEventForThisViewport,
+	useViewportInfo,
+} from "../../contexts/ViewportContext";
 import { useStore } from "../../store";
 import type { HoleTemplate } from "../../types/template";
 import { computeTemplateBounds } from "../../utils/chainCompute";
@@ -69,6 +73,7 @@ export function PlacementHandler() {
 
 	const pointerDownScreen = useRef<{ x: number; y: number } | null>(null);
 	const pointerDownWorld = useRef<{ x: number; z: number } | null>(null);
+	const viewportInfo = useViewportInfo();
 
 	const isPlacing = tool === "place" && (placingType != null || placingTemplateId != null);
 
@@ -120,6 +125,7 @@ export function PlacementHandler() {
 
 	function handlePointerMove(e: ThreeEvent<PointerEvent>) {
 		if (!isPlacing) return;
+		if (viewportInfo && !isEventForThisViewport(e, viewportInfo)) return;
 		const pos = computePosition({ x: e.point.x, z: e.point.z });
 		setGhostPos(pos);
 		setGhostValid(checkValidity(pos));
@@ -127,6 +133,7 @@ export function PlacementHandler() {
 
 	function handlePointerDown(e: ThreeEvent<PointerEvent>) {
 		if (!isPlacing || !isMobile) return;
+		if (viewportInfo && !isEventForThisViewport(e, viewportInfo)) return;
 		const pos = computePosition({ x: e.point.x, z: e.point.z });
 		setGhostPos(pos);
 		setGhostValid(checkValidity(pos));
@@ -139,6 +146,7 @@ export function PlacementHandler() {
 
 	function handlePointerUp(e: ThreeEvent<PointerEvent>) {
 		if (!isMobile) return;
+		if (viewportInfo && !isEventForThisViewport(e, viewportInfo)) return;
 
 		if (pointerDownScreen.current && pointerDownWorld.current) {
 			const dx = e.nativeEvent.clientX - pointerDownScreen.current.x;
@@ -161,6 +169,7 @@ export function PlacementHandler() {
 	}
 
 	function handleClick(e: ThreeEvent<MouseEvent>) {
+		if (viewportInfo && !isEventForThisViewport(e, viewportInfo)) return;
 		e.stopPropagation();
 
 		if (isMobile) return;
diff --git a/src/components/three/RotationHandle.tsx b/src/components/three/RotationHandle.tsx
index c23aa4b..445b151 100644
--- a/src/components/three/RotationHandle.tsx
+++ b/src/components/three/RotationHandle.tsx
@@ -1,5 +1,9 @@
 import type { ThreeEvent } from "@react-three/fiber";
 import { useRef, useState } from "react";
+import {
+	isEventForThisViewport,
+	useViewportInfo,
+} from "../../contexts/ViewportContext";
 import { useStore } from "../../store";
 import { isMobile } from "../../utils/isMobile";
 
@@ -25,19 +29,18 @@ export function RotationHandle({
 	const updateHole = useStore((s) => s.updateHole);
 	const [isDragging, setIsDragging] = useState(false);
 	const shiftHeld = useRef(false);
+	const viewportInfo = useViewportInfo();
 
 	const rotRad = (rotation * Math.PI) / 180;
 	const handleX = Math.sin(rotRad) * RING_RADIUS;
 	const handleZ = Math.cos(rotRad) * RING_RADIUS;
 
 	function handlePointerDown(e: ThreeEvent<PointerEvent>) {
+		if (viewportInfo && !isEventForThisViewport(e, viewportInfo)) return;
 		e.stopPropagation();
 		setIsDragging(true);
 		shiftHeld.current = e.nativeEvent.shiftKey;
 		useStore.temporal?.getState()?.pause();
-		(e.nativeEvent.target as Element)?.setPointerCapture?.(
-			e.nativeEvent.pointerId,
-		);
 	}
 
 	function handlePointerMove(e: ThreeEvent<PointerEvent>) {
@@ -85,6 +88,19 @@ export function RotationHandle({
 				/>
 				<meshStandardMaterial color={isDragging ? "#FFE082" : "#FF9800"} />
 			</mesh>
+			{/* Drag plane — invisible floor plane for rotation drag continuity */}
+			{isDragging && (
+				<mesh
+					rotation={[-Math.PI / 2, 0, 0]}
+					position={[0, 0, 0]}
+					onPointerMove={handlePointerMove}
+					onPointerUp={handlePointerUp}
+					visible={false}
+				>
+					<planeGeometry args={[20, 20]} />
+					<meshBasicMaterial transparent opacity={0} />
+				</mesh>
+			)}
 		</group>
 	);
 }
diff --git a/src/contexts/ViewportContext.ts b/src/contexts/ViewportContext.ts
new file mode 100644
index 0000000..d09f991
--- /dev/null
+++ b/src/contexts/ViewportContext.ts
@@ -0,0 +1,38 @@
+import type { ThreeEvent } from "@react-three/fiber";
+import { createContext, useContext } from "react";
+
+/** Identifies which viewport pane a component is rendering inside */
+export type ViewportId = "2d" | "3d";
+
+export type ViewportInfo = {
+	id: ViewportId;
+	/** The clientX of the right edge of the 2D pane (divider position).
+	 *  null when in single-pane mode. */
+	paneBoundaryX: number | null;
+};
+
+export const ViewportContext = createContext<ViewportInfo | null>(null);
+
+/** Hook to read the current viewport info. Returns null if not inside a View. */
+export function useViewportInfo(): ViewportInfo | null {
+	return useContext(ViewportContext);
+}
+
+/**
+ * Checks whether a pointer event originated from the same pane
+ * as the component calling this function.
+ *
+ * Uses position-based detection: compares the event's clientX
+ * against the divider position (paneBoundaryX).
+ *
+ * Returns true in single-pane mode (no gating needed).
+ */
+export function isEventForThisViewport(
+	e: ThreeEvent<PointerEvent> | ThreeEvent<MouseEvent>,
+	viewport: ViewportInfo,
+): boolean {
+	if (viewport.paneBoundaryX === null) return true;
+	const pointerPane =
+		e.nativeEvent.clientX < viewport.paneBoundaryX ? "2d" : "3d";
+	return pointerPane === viewport.id;
+}
