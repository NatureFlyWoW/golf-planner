diff --git a/.claude/homunculus/observations.jsonl b/.claude/homunculus/observations.jsonl
index 5985449..66fdc4e 100644
--- a/.claude/homunculus/observations.jsonl
+++ b/.claude/homunculus/observations.jsonl
@@ -2310,3 +2310,24 @@ ault();function m(e,t){const{right:r,top:n,left:c,bottom:a,width:i,height:l}=t,o
 {"timestamp":"2026-02-22T11:55:57Z","type":"tool","tool":"TaskUpdate","input":{"taskId":"23","status":"completed"},"response":"{\"success\":true,\"taskId\":\"23\",\"updatedFields\":[\"status\"],\"statusChange\":{\"from\":\"in_progress\",\"to\":\"completed\"}}"}
 {"timestamp":"2026-02-22T11:55:57Z","type":"tool","tool":"TaskUpdate","input":{"taskId":"24","activeForm":"Committing section-03","status":"in_progress"},"response":"{\"success\":true,\"taskId\":\"24\",\"updatedFields\":[\"activeForm\",\"status\"],\"statusChange\":{\"from\":\"pending\",\"to\":\"in_progress\"}}"}
 {"timestamp":"2026-02-22T11:56:06Z","type":"tool","tool":"Bash","input":{"command":"git -C /mnt/c/Users/Caus/Golf_Plan/golf-planner rev-parse --show-toplevel 2>&1","description":"Check git root"},"response":"{\"stdout\":\"/mnt/c/Users/Caus/Golf_Plan/golf-planner\",\"stderr\":\"\",\"interrupted\":false,\"isImage\":false,\"noOutputExpected\":false}"}
+{"timestamp":"2026-02-22T11:56:12Z","type":"tool","tool":"Bash","input":{"command":"git add src/hooks/useSplitPane.ts src/components/layout/SplitDivider.tsx src/components/layout/DualViewport.tsx tests/hooks/useSplitPane.test.ts && git add -u && git diff --cached --stat","description":"Stage section-03 from golf-planner root"},"response":"{\"stdout\":\" .claude/homunculus/observations.jsonl  | 312 +++++++++++++++++++++++++++++++++\\n docs/session-handoff.md                |  99 ++++++-----\\n src/App.tsx                            |  52 +-----\\n src/components/layout/DualViewport.tsx |  90 ++++++++++\\n src/components/layout/SplitDivider.tsx |  49 ++++++\\n src/hooks/useSplitPane.ts              | 103 +++++++++++\\n tests/hooks/useSplitPane.test.ts       | 114 ++++++++++++\\n 7 files changed, 724 insertions(+), 95 deletions(-)\",\"stderr\":\"\",\"interrupted\":false,\"isImage\":false,\"noOutputExpected\":false}"}
+{"timestamp":"2026-02-22T11:57:16Z","type":"tool","tool":"Bash","input":{"command":"git commit -m \"$(cat <<'EOF'\nImplement section 03: Split-Pane Layout\n\n- DualViewport replaces Canvas block in App.tsx with split-pane container\n- SplitDivider with ARIA, hover/drag states, chevron indicators\n- useSplitPane hook with drag-to-resize, double-click collapse/expand\n- Pure functions (computeSplitRatio, getDoubleClickAction) for testability\n- Overlays (SunControls, KeyboardHelp, MiniMap) preserved in DualViewport\n- 17 new tests, 548 total passing\n\nPlan: section-03-split-pane-layout.md\nCo-Authored-By: Claude <noreply@anthropic.com>\nEOF\n)\"","description":"Commit section-03"},"response":"{\"stdout\":\"[feat/dual-viewport-and-layers 0899c9b] Implement section 03: Split-Pane Layout\\n 7 files changed, 724 insertions(+), 95 deletions(-)\\n create mode 100644 src/components/layout/DualViewport.tsx\\n create mode 100644 src/components/layout/SplitDivider.tsx\\n create mode 100644 src/hooks/useSplitPane.ts\\n create mode 100644 tests/hooks/useSplitPane.test.ts\",\"stderr\":\"\",\"interrupted\":false,\"isImage\":false,\"noOutputExpected\":false}"}
+{"timestamp":"2026-02-22T11:57:19Z","type":"tool","tool":"TaskUpdate","input":{"taskId":"24","status":"completed"},"response":"{\"success\":true,\"taskId\":\"24\",\"updatedFields\":[\"status\"],\"statusChange\":{\"from\":\"in_progress\",\"to\":\"completed\"}}"}
+{"timestamp":"2026-02-22T11:57:19Z","type":"tool","tool":"TaskUpdate","input":{"taskId":"25","activeForm":"Recording section-03 completion","status":"in_progress"},"response":"{\"success\":true,\"taskId\":\"25\",\"updatedFields\":[\"activeForm\",\"status\"],\"statusChange\":{\"from\":\"pending\",\"to\":\"in_progress\"}}"}
+{"timestamp":"2026-02-22T11:57:27Z","type":"tool","tool":"Bash","input":{"command":"export PATH=\"/home/ben/.local/share/fnm:$PATH\" && eval \"$(fnm env)\" && uv run /home/ben/.claude/plugins/cache/piercelamb-plugins/deep-implement/0.2.0/scripts/tools/update_section_state.py --state-dir \"/mnt/c/Users/Caus/Golf_Plan/docs/plans/01-dual-viewport-and-layers/implementation\" --section \"section-03-split-pane-layout\" --commit-hash \"0899c9b\"","description":"Record section-03 completion"},"response":"{\"stdout\":\"Updated section-03-split-pane-layout: commit_hash=0899c9b\",\"stderr\":\"\",\"interrupted\":false,\"isImage\":false,\"noOutputExpected\":false}"}
+{"timestamp":"2026-02-22T11:57:30Z","type":"tool","tool":"TaskUpdate","input":{"taskId":"25","status":"completed"},"response":"{\"success\":true,\"taskId\":\"25\",\"updatedFields\":[\"status\"],\"statusChange\":{\"from\":\"in_progress\",\"to\":\"completed\"}}"}
+{"timestamp":"2026-02-22T11:57:34Z","type":"tool","tool":"TaskUpdate","input":{"taskId":"26","activeForm":"Implementing section-04-dual-canvas-views","status":"in_progress"},"response":"{\"success\":true,\"taskId\":\"26\",\"updatedFields\":[\"activeForm\",\"status\"],\"statusChange\":{\"from\":\"pending\",\"to\":\"in_progress\"}}"}
+{"timestamp":"2026-02-22T11:57:37Z","type":"tool","tool":"Read","input":{"file_path":"/mnt/c/Users/Caus/Golf_Plan/docs/plans/01-dual-viewport-and-layers/sections/section-04-dual-canvas-views.md"},"response":"{\"type\":\"text\",\"file\":{\"filePath\":\"/mnt/c/Users/Caus/Golf_Plan/docs/plans/01-dual-viewport-and-layers/sections/section-04-dual-canvas-views.md\",\"content\":\"Now I have all the context needed. Let me produce the section content.\\n\\n# Section 04: Dual Canvas Views\\n\\n## Overview\\n\\nThis section implements the core architectural change: setting up the single Canvas with two drei `<View>` components, extracting the existing `ThreeCanvas.tsx` into `SharedScene.tsx` (rendered in both Views) and `ThreeDOnlyContent.tsx` (rendered only in the 3D View), and wiring everything into the `DualViewport` container built in section-03.\\n\\nThis is the pivotal integration step. After this section, the app renders the same scene in two viewports simultaneously through a single WebGL context using `gl.scissor`-based View splitting.\\n\\n## Dependencies\\n\\n- **section-02-types-and-store** must be complete: `ViewportLayout`, `LayerId`, `LayerState` types in `src/types/viewport.ts`; viewport/layer state and actio"}
+{"timestamp":"2026-02-22T11:57:43Z","type":"tool","tool":"Read","input":{"file_path":"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/ThreeCanvas.tsx"},"response":"{\"type\":\"text\",\"file\":{\"filePath\":\"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/ThreeCanvas.tsx\",\"content\":\"import {\\n\\tEnvironment,\\n\\tLightformer,\\n\\tPerformanceMonitor,\\n\\tSoftShadows,\\n\\tSparkles,\\n\\tStats,\\n} from \\\"@react-three/drei\\\";\\nimport { useThree } from \\\"@react-three/fiber\\\";\\nimport { useEffect } from \\\"react\\\";\\nimport { UV_LAMP_POSITIONS } from \\\"../../constants/uvLamps\\\";\\nimport type { SunData } from \\\"../../hooks/useSunPosition\\\";\\nimport { useStore } from \\\"../../store\\\";\\nimport {\\n\\tshouldEnableFog,\\n\\tshouldEnableSoftShadows,\\n} from \\\"../../utils/environmentGating\\\";\\nimport { isMobile } from \\\"../../utils/isMobile\\\";\\nimport { shouldShowGodRays } from \\\"../../utils/godraysConfig\\\";\\nimport { shouldShowSparkles } from \\\"../../utils/postprocessingConfig\\\";\\nimport { CameraControls } from \\\"./CameraControls\\\";\\nimport { FloorGrid } from \\\"./FloorGrid\\\";\\nimport { FlowPath } from \\\"./FlowPath\\\";\\nimport { GodRaysSource } from \\\"./GodRaysSource\\\";"}
+{"timestamp":"2026-02-22T11:58:08Z","type":"tool","tool":"Grep","input":{"pattern":"ThreeCanvas","path":"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src","output_mode":"files_with_matches"},"response":"{\"mode\":\"files_with_matches\",\"filenames\":[\"src/components/three/ThreeCanvas.tsx\"],\"numFiles\":1}"}
+{"timestamp":"2026-02-22T11:58:08Z","type":"tool","tool":"Grep","input":{"pattern":"ThreeCanvas","path":"/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests","output_mode":"files_with_matches"},"response":"{\"mode\":\"files_with_matches\",\"filenames\":[],\"numFiles\":0}"}
+{"timestamp":"2026-02-22T11:58:09Z","type":"tool","tool":"Read","input":{"file_path":"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/utils/environmentGating.ts"},"response":"{\"type\":\"text\",\"file\":{\"filePath\":\"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/utils/environmentGating.ts\",\"content\":\"import type { GpuTier, ViewMode } from \\\"../types/ui\\\";\\n\\n/**\\n * Fog should only render in UV mode AND 3D perspective view.\\n * Exponential fog in orthographic view creates uniform darkening\\n * with no atmospheric value.\\n */\\nexport function shouldEnableFog(uvMode: boolean, view: ViewMode): boolean {\\n\\treturn uvMode && view === \\\"3d\\\";\\n}\\n\\n/**\\n * Derive the Canvas frameloop mode from current state.\\n * \\\"always\\\" when UV effects need continuous rendering or during transitions.\\n * Low-tier GPUs always use \\\"demand\\\" in UV mode (static effects only).\\n */\\nexport function deriveFrameloop(\\n\\tuvMode: boolean,\\n\\tgpuTier: GpuTier,\\n\\ttransitioning: boolean,\\n): \\\"always\\\" | \\\"demand\\\" {\\n\\tconst needsAlways = transitioning || (uvMode && gpuTier !== \\\"low\\\");\\n\\treturn needsAlways ? \\\"always\\\" : \\\"demand\\\";\\n}\\n\\n/**\\n * SoftShadows (PCSS) only on mid+ tier GPUs �"}
+{"timestamp":"2026-02-22T11:58:13Z","type":"tool","tool":"Read","input":{"file_path":"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/CameraControls.tsx","limit":30},"response":"{\"type\":\"text\",\"file\":{\"filePath\":\"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/CameraControls.tsx\",\"content\":\"import {\\n\\tOrbitControls,\\n\\tOrthographicCamera,\\n\\tPerspectiveCamera,\\n} from \\\"@react-three/drei\\\";\\nimport { useThree } from \\\"@react-three/fiber\\\";\\nimport { useEffect, useMemo, useRef, useState } from \\\"react\\\";\\nimport { MOUSE, TOUCH } from \\\"three\\\";\\nimport type { OrbitControls as OrbitControlsImpl } from \\\"three-stdlib\\\";\\nimport { useKeyboardControls } from \\\"../../hooks/useKeyboardControls\\\";\\nimport { useStore } from \\\"../../store\\\";\\n\\nconst DEFAULT_ZOOM = 40;\\nconst PERSPECTIVE_DISTANCE = 25;\\nconst PERSPECTIVE_ANGLE = Math.PI / 4;\\n\\nexport function CameraControls() {\\n\\tconst { width, length } = useStore((s) => s.hall);\\n\\tconst view = useStore((s) => s.ui.view);\\n\\tconst controlsRef = useRef<OrbitControlsImpl>(null);\\n\\tconst defaultTarget: [number, number, number] = useMemo(\\n\\t\\t() => [width / 2, 0, length / 2],\\n\\t\\t[width, length],\\n\\t);\\"}
+{"timestamp":"2026-02-22T11:58:23Z","type":"tool","tool":"Write","input":{"file_path":"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/SharedScene.tsx","content":"import type { SunData } from \"../../hooks/useSunPosition\";\nimport { useStore } from \"../../store\";\nimport { isMobile } from \"../../utils/isMobile\";\nimport { FloorGrid } from \"./FloorGrid\";\nimport { FlowPath } from \"./FlowPath\";\nimport { Hall } from \"./Hall\";\nimport { PlacedHoles } from \"./PlacedHoles\";\nimport { PlacementHandler } from \"./PlacementHandler\";\nimport { SunIndicator } from \"./SunIndicator\";\n\ntype SharedSceneProps = {\n\tsunData: SunData;\n};\n\nexport function SharedScene({ sunData }: SharedSceneProps) {\n\tconst uvMode = useStore((s) => s.ui.uvMode);\n\n\treturn (\n\t\t<>\n\t\t\t<ambientLight\n\t\t\t\tcolor={uvMode ? \"#220044\" : \"#ffffff\"}\n\t\t\t\tintensity={uvMode ? 0.3 : 0.8}\n\t\t\t/>\n\t\t\t{uvMode ? (\n\t\t\t\t<directionalLight\n\t\t\t\t\tposition={[10, 20, 5]}\n\t\t\t\t\tcolor=\"#6600CC\"\n\t\t\t\t\tintensity={0.4}\n\t\t\t\t/>\n\t\t\t) : (\n\t\t\t\t<directionalLight\n\t\t\t\t\tposition={\n\t\t\t\t\t\tsunData\n\t\t\t\t\t\t\t? [\n\t\t\t\t\t\t\t\t\t-Math.sin(sunData.azimuth) *\n\t\t\t\t\t\t\t\t\t\tMath.cos(sunData.altitude) *\n\t\t\t\t\t\t\t\t\t\t30 +\n\t\t\t\t\t\t\t\t\t\t5,\n\t\t\t\t\t\t\t\t\tMath.sin(sunData.altitude) * 30,\n\t\t\t\t\t\t\t\t\tMath.cos(sunData.azimuth) *\n\t\t\t\t\t\t\t\t\t\tMath.cos(sunData.altitude) *\n\t\t\t\t\t\t\t\t\t\t30 +\n\t\t\t\t\t\t\t\t\t\t10,\n\t\t\t\t\t\t\t\t]\n\t\t\t\t\t\t\t: [10, 20, 5]\n\t\t\t\t\t}\n\t\t\t\t\tcolor=\"#ffffff\"\n\t\t\t\t\tintensity={0.5}\n\t\t\t\t\tcastShadow\n\t\t\t\t\tshadow-mapSize-width={isMobile ? 512 : 1024}\n\t\t\t\t\tshadow-mapSize-height={isMobile ? 512 : 1024}\n\t\t\t\t\tshadow-camera-left={-12}\n\t\t\t\t\tshadow-camera-right={12}\n\t\t\t\t\tshadow-camera-top={25}\n\t\t\t\t\tshadow-camera-bottom={-15}\n\t\t\t\t\tshadow-bias={-0.001}\n\t\t\t\t/>\n\t\t\t)}\n\t\t\t<Hall sunData={sunData} />\n\t\t\t<PlacedHoles />\n\t\t\t<FlowPath />\n\t\t\t<FloorGrid />\n\t\t\t<SunIndicator sunData={sunData} />\n\t\t\t<PlacementHandler />\n\t\t</>\n\t);\n}\n"},"response":"{\"type\":\"create\",\"filePath\":\"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/SharedScene.tsx\",\"content\":\"import type { SunData } from \\\"../../hooks/useSunPosition\\\";\\nimport { useStore } from \\\"../../store\\\";\\nimport { isMobile } from \\\"../../utils/isMobile\\\";\\nimport { FloorGrid } from \\\"./FloorGrid\\\";\\nimport { FlowPath } from \\\"./FlowPath\\\";\\nimport { Hall } from \\\"./Hall\\\";\\nimport { PlacedHoles } from \\\"./PlacedHoles\\\";\\nimport { PlacementHandler } from \\\"./PlacementHandler\\\";\\nimport { SunIndicator } from \\\"./SunIndicator\\\";\\n\\ntype SharedSceneProps = {\\n\\tsunData: SunData;\\n};\\n\\nexport function SharedScene({ sunData }: SharedSceneProps) {\\n\\tconst uvMode = useStore((s) => s.ui.uvMode);\\n\\n\\treturn (\\n\\t\\t<>\\n\\t\\t\\t<ambientLight\\n\\t\\t\\t\\tcolor={uvMode ? \\\"#220044\\\" : \\\"#ffffff\\\"}\\n\\t\\t\\t\\tintensity={uvMode ? 0.3 : 0.8}\\n\\t\\t\\t/>\\n\\t\\t\\t{uvMode ? (\\n\\t\\t\\t\\t<directionalLight\\n\\t\\t\\t\\t\\tposition={[10, 20, 5]}\\n\\t\\t\\t\\t\\tcolor=\\\"#6600CC\\\"\\n\\t\\t\\t\\t\\tintensity={0.4}\\n\\"}
+{"timestamp":"2026-02-22T11:58:40Z","type":"tool","tool":"Write","input":{"file_path":"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/ThreeDOnlyContent.tsx","content":"import {\n\tEnvironment,\n\tLightformer,\n\tPerformanceMonitor,\n\tSoftShadows,\n\tSparkles,\n\tStats,\n} from \"@react-three/drei\";\nimport { useThree } from \"@react-three/fiber\";\nimport { useEffect } from \"react\";\nimport { UV_LAMP_POSITIONS } from \"../../constants/uvLamps\";\nimport { useStore } from \"../../store\";\nimport {\n\tshouldEnableFog,\n\tshouldEnableSoftShadows,\n} from \"../../utils/environmentGating\";\nimport { shouldShowGodRays } from \"../../utils/godraysConfig\";\nimport { shouldShowSparkles } from \"../../utils/postprocessingConfig\";\nimport { GodRaysSource } from \"./GodRaysSource\";\nimport { ScreenshotCapture } from \"./ScreenshotCapture\";\nimport { UVEffects } from \"./UVEffects\";\nimport { UVLamps } from \"./UVLamps\";\n\nfunction FogController({ enabled }: { enabled: boolean }) {\n\tconst scene = useThree((s) => s.scene);\n\tuseEffect(() => {\n\t\tif (!enabled) {\n\t\t\tscene.fog = null;\n\t\t}\n\t}, [enabled, scene]);\n\treturn null;\n}\n\nexport function ThreeDOnlyContent() {\n\tconst uvMode = useStore((s) => s.ui.uvMode);\n\tconst view = useStore((s) => s.ui.view);\n\tconst gpuTier = useStore((s) => s.ui.gpuTier);\n\n\tconst fogEnabled = shouldEnableFog(uvMode, view);\n\n\treturn (\n\t\t<>\n\t\t\t{fogEnabled && <fogExp2 attach=\"fog\" args={[\"#07071A\", 0.04]} />}\n\t\t\t<FogController enabled={fogEnabled} />\n\n\t\t\t<Environment\n\t\t\t\tpreset=\"night\"\n\t\t\t\tenvironmentIntensity={0.15}\n\t\t\t\tbackground={false}\n\t\t\t>\n\t\t\t\t{UV_LAMP_POSITIONS.map((pos) => (\n\t\t\t\t\t<Lightformer\n\t\t\t\t\t\tkey={`lamp-${pos[0]}-${pos[1]}-${pos[2]}`}\n\t\t\t\t\t\tform=\"rect\"\n\t\t\t\t\t\tintensity={0.4}\n\t\t\t\t\t\tcolor=\"#8800FF\"\n\t\t\t\t\t\tposition={pos}\n\t\t\t\t\t\trotation-x={Math.PI / 2}\n\t\t\t\t\t\tscale={[0.3, 2, 1]}\n\t\t\t\t\t/>\n\t\t\t\t))}\n\t\t\t</Environment>\n\n\t\t\t{shouldEnableSoftShadows(gpuTier) && (\n\t\t\t\t<SoftShadows size={25} samples={10} />\n\t\t\t)}\n\n\t\t\t{uvMode && <UVLamps />}\n\t\t\t{shouldShowGodRays({ gpuTier, uvMode }) && <GodRaysSource />}\n\t\t\t{shouldShowSparkles({ gpuTier, uvMode }) && (\n\t\t\t\t<Sparkles\n\t\t\t\t\tcount={400}\n\t\t\t\t\tcolor=\"#9D00FF\"\n\t\t\t\t\tsize={2}\n\t\t\t\t\tspeed={0.3}\n\t\t\t\t\tscale={[10, 4.3, 20]}\n\t\t\t\t\tposition={[5, 2.15, 10]}\n\t\t\t\t/>\n\t\t\t)}\n\t\t\t<UVEffects />\n\t\t\t<ScreenshotCapture />\n\n\t\t\t<PerformanceMonitor />\n\t\t\t{import.meta.env.DEV && <Stats />}\n\t\t</>\n\t);\n}\n"},"response":"{\"type\":\"create\",\"filePath\":\"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/ThreeDOnlyContent.tsx\",\"content\":\"import {\\n\\tEnvironment,\\n\\tLightformer,\\n\\tPerformanceMonitor,\\n\\tSoftShadows,\\n\\tSparkles,\\n\\tStats,\\n} from \\\"@react-three/drei\\\";\\nimport { useThree } from \\\"@react-three/fiber\\\";\\nimport { useEffect } from \\\"react\\\";\\nimport { UV_LAMP_POSITIONS } from \\\"../../constants/uvLamps\\\";\\nimport { useStore } from \\\"../../store\\\";\\nimport {\\n\\tshouldEnableFog,\\n\\tshouldEnableSoftShadows,\\n} from \\\"../../utils/environmentGating\\\";\\nimport { shouldShowGodRays } from \\\"../../utils/godraysConfig\\\";\\nimport { shouldShowSparkles } from \\\"../../utils/postprocessingConfig\\\";\\nimport { GodRaysSource } from \\\"./GodRaysSource\\\";\\nimport { ScreenshotCapture } from \\\"./ScreenshotCapture\\\";\\nimport { UVEffects } from \\\"./UVEffects\\\";\\nimport { UVLamps } from \\\"./UVLamps\\\";\\n\\nfunction FogController({ enabled }: { enabled: boolean }) {\\n\\tconst scene = useThree((s) => s.scene);\\n\\t"}
+{"timestamp":"2026-02-22T11:58:46Z","type":"tool","tool":"Read","input":{"file_path":"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/layout/DualViewport.tsx"},"response":"{\"type\":\"text\",\"file\":{\"filePath\":\"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/layout/DualViewport.tsx\",\"content\":\"import { useRef } from \\\"react\\\";\\nimport { useSplitPane } from \\\"../../hooks/useSplitPane\\\";\\nimport { useStore } from \\\"../../store\\\";\\nimport { canvasPointerEvents } from \\\"../../utils/uvTransitionConfig\\\";\\nimport { KeyboardHelp } from \\\"../ui/KeyboardHelp\\\";\\nimport { MiniMap } from \\\"../ui/MiniMap\\\";\\nimport { SunControls } from \\\"../ui/SunControls\\\";\\nimport { SplitDivider } from \\\"./SplitDivider\\\";\\n\\nexport function DualViewport() {\\n\\tconst containerRef = useRef<HTMLDivElement>(null);\\n\\tconst viewportLayout = useStore((s) => s.ui.viewportLayout);\\n\\tconst splitRatio = useStore((s) => s.ui.splitRatio);\\n\\tconst tool = useStore((s) => s.ui.tool);\\n\\tconst transitioning = useStore((s) => s.ui.transitioning);\\n\\tconst setActiveViewport = useStore((s) => s.setActiveViewport);\\n\\tconst {\\n\\t\\tisDragging,\\n\\t\\tonDividerMouseDown,\\n\\t\\tonDividerTouchStart,\\n"}
+{"timestamp":"2026-02-22T11:59:03Z","type":"tool","tool":"Write","input":{"file_path":"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/layout/DualViewport.tsx","content":"import { OrthographicCamera, PerspectiveCamera, View } from \"@react-three/drei\";\nimport { Canvas } from \"@react-three/fiber\";\nimport { Suspense, useRef } from \"react\";\nimport { NoToneMapping } from \"three\";\nimport type { SunData } from \"../../hooks/useSunPosition\";\nimport { useSplitPane } from \"../../hooks/useSplitPane\";\nimport { useStore } from \"../../store\";\nimport { deriveFrameloop, getShadowType } from \"../../utils/environmentGating\";\nimport { isMobile } from \"../../utils/isMobile\";\nimport { canvasPointerEvents } from \"../../utils/uvTransitionConfig\";\nimport { SharedScene } from \"../three/SharedScene\";\nimport { ThreeDOnlyContent } from \"../three/ThreeDOnlyContent\";\nimport { KeyboardHelp } from \"../ui/KeyboardHelp\";\nimport { MiniMap } from \"../ui/MiniMap\";\nimport { SunControls } from \"../ui/SunControls\";\nimport { SplitDivider } from \"./SplitDivider\";\n\ntype DualViewportProps = {\n\tsunData: SunData;\n};\n\nexport function DualViewport({ sunData }: DualViewportProps) {\n\tconst containerRef = useRef<HTMLDivElement>(null);\n\tconst viewportLayout = useStore((s) => s.ui.viewportLayout);\n\tconst splitRatio = useStore((s) => s.ui.splitRatio);\n\tconst tool = useStore((s) => s.ui.tool);\n\tconst uvMode = useStore((s) => s.ui.uvMode);\n\tconst gpuTier = useStore((s) => s.ui.gpuTier);\n\tconst transitioning = useStore((s) => s.ui.transitioning);\n\tconst setActiveViewport = useStore((s) => s.setActiveViewport);\n\tconst {\n\t\tisDragging,\n\t\tonDividerMouseDown,\n\t\tonDividerTouchStart,\n\t\tonDividerDoubleClick,\n\t} = useSplitPane(containerRef);\n\n\tconst show2D = viewportLayout !== \"3d-only\";\n\tconst show3D = viewportLayout !== \"2d-only\";\n\tconst showDivider = viewportLayout === \"dual\";\n\n\t// Canvas configuration\n\tconst dpr: [number, number] = isMobile\n\t\t? [1, 1.5]\n\t\t: gpuTier === \"high\"\n\t\t\t? [1, 2]\n\t\t\t: gpuTier === \"mid\"\n\t\t\t\t? [1, 1.5]\n\t\t\t\t: [1, 1];\n\t// View rendering requires frameloop=\"always\" in dual mode\n\tconst frameloop =\n\t\tviewportLayout === \"dual\"\n\t\t\t? \"always\"\n\t\t\t: deriveFrameloop(uvMode, gpuTier, transitioning);\n\tconst shadows = getShadowType(gpuTier, isMobile);\n\n\treturn (\n\t\t<div\n\t\t\tref={containerRef}\n\t\t\tclassName={`relative flex flex-1 overflow-hidden ${\n\t\t\t\tisDragging ? \"cursor-col-resize select-none\" : \"\"\n\t\t\t}`}\n\t\t\tstyle={{\n\t\t\t\tcursor: isDragging\n\t\t\t\t\t? undefined\n\t\t\t\t\t: tool === \"delete\"\n\t\t\t\t\t\t? \"crosshair\"\n\t\t\t\t\t\t: \"default\",\n\t\t\t\ttouchAction: \"none\",\n\t\t\t\tpointerEvents: canvasPointerEvents(transitioning),\n\t\t\t}}\n\t\t>\n\t\t\t{/* 2D pane */}\n\t\t\t{show2D && (\n\t\t\t\t<div\n\t\t\t\t\tclassName=\"relative h-full overflow-hidden\"\n\t\t\t\t\tstyle={{\n\t\t\t\t\t\twidth: showDivider\n\t\t\t\t\t\t\t? `calc(${splitRatio * 100}% - 6px)`\n\t\t\t\t\t\t\t: \"100%\",\n\t\t\t\t\t}}\n\t\t\t\t\tonPointerEnter={() => setActiveViewport(\"2d\")}\n\t\t\t\t>\n\t\t\t\t\t<View style={{ width: \"100%\", height: \"100%\" }}>\n\t\t\t\t\t\t<OrthographicCamera\n\t\t\t\t\t\t\tmakeDefault\n\t\t\t\t\t\t\tposition={[5, 50, 10]}\n\t\t\t\t\t\t\tzoom={40}\n\t\t\t\t\t\t/>\n\t\t\t\t\t\t<SharedScene sunData={sunData} />\n\t\t\t\t\t</View>\n\t\t\t\t</div>\n\t\t\t)}\n\n\t\t\t{showDivider && (\n\t\t\t\t<SplitDivider\n\t\t\t\t\tisDragging={isDragging}\n\t\t\t\t\tonMouseDown={onDividerMouseDown}\n\t\t\t\t\tonTouchStart={onDividerTouchStart}\n\t\t\t\t\tonDoubleClick={onDividerDoubleClick}\n\t\t\t\t/>\n\t\t\t)}\n\n\t\t\t{/* 3D pane */}\n\t\t\t{show3D && (\n\t\t\t\t<div\n\t\t\t\t\tclassName=\"relative h-full overflow-hidden\"\n\t\t\t\t\tstyle={{\n\t\t\t\t\t\twidth: showDivider\n\t\t\t\t\t\t\t? `calc(${(1 - splitRatio) * 100}% - 6px)`\n\t\t\t\t\t\t\t: \"100%\",\n\t\t\t\t\t}}\n\t\t\t\t\tonPointerEnter={() => setActiveViewport(\"3d\")}\n\t\t\t\t>\n\t\t\t\t\t<View style={{ width: \"100%\", height: \"100%\" }}>\n\t\t\t\t\t\t<PerspectiveCamera\n\t\t\t\t\t\t\tmakeDefault\n\t\t\t\t\t\t\tposition={[5, 15, 25]}\n\t\t\t\t\t\t\tfov={60}\n\t\t\t\t\t\t/>\n\t\t\t\t\t\t<SharedScene sunData={sunData} />\n\t\t\t\t\t\t<ThreeDOnlyContent />\n\t\t\t\t\t</View>\n\t\t\t\t</div>\n\t\t\t)}\n\n\t\t\t{/* Single shared Canvas behind both panes */}\n\t\t\t<Canvas\n\t\t\t\tdpr={dpr}\n\t\t\t\tframeloop={frameloop}\n\t\t\t\tshadows={shadows}\n\t\t\t\tgl={{\n\t\t\t\t\tantialias: !isMobile,\n\t\t\t\t\tpreserveDrawingBuffer: false,\n\t\t\t\t\tpowerPreference: \"high-performance\",\n\t\t\t\t\ttoneMapping: NoToneMapping,\n\t\t\t\t}}\n\t\t\t\teventSource={containerRef}\n\t\t\t\tstyle={{\n\t\t\t\t\tposition: \"absolute\",\n\t\t\t\t\ttop: 0,\n\t\t\t\t\tleft: 0,\n\t\t\t\t\twidth: \"100%\",\n\t\t\t\t\theight: \"100%\",\n\t\t\t\t\tpointerEvents: \"none\",\n\t\t\t\t}}\n\t\t\t>\n\t\t\t\t<Suspense fallback={null}>\n\t\t\t\t\t<View.Port />\n\t\t\t\t</Suspense>\n\t\t\t</Canvas>\n\n\t\t\t{/* Overlay components */}\n\t\t\t<SunControls />\n\t\t\t<KeyboardHelp />\n\t\t\t<MiniMap />\n\t\t</div>\n\t);\n}\n"},"response":"{\"type\":\"update\",\"filePath\":\"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/layout/DualViewport.tsx\",\"content\":\"import { OrthographicCamera, PerspectiveCamera, View } from \\\"@react-three/drei\\\";\\nimport { Canvas } from \\\"@react-three/fiber\\\";\\nimport { Suspense, useRef } from \\\"react\\\";\\nimport { NoToneMapping } from \\\"three\\\";\\nimport type { SunData } from \\\"../../hooks/useSunPosition\\\";\\nimport { useSplitPane } from \\\"../../hooks/useSplitPane\\\";\\nimport { useStore } from \\\"../../store\\\";\\nimport { deriveFrameloop, getShadowType } from \\\"../../utils/environmentGating\\\";\\nimport { isMobile } from \\\"../../utils/isMobile\\\";\\nimport { canvasPointerEvents } from \\\"../../utils/uvTransitionConfig\\\";\\nimport { SharedScene } from \\\"../three/SharedScene\\\";\\nimport { ThreeDOnlyContent } from \\\"../three/ThreeDOnlyContent\\\";\\nimport { KeyboardHelp } from \\\"../ui/KeyboardHelp\\\";\\nimport { MiniMap } from \\\"../ui/MiniMap\\\";\\nimport { SunControls } from \\\"../ui/SunControls\\\";\\nimport { SplitD"}
+{"timestamp":"2026-02-22T11:59:09Z","type":"tool","tool":"Read","input":{"file_path":"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/App.tsx"},"response":"{\"type\":\"text\",\"file\":{\"filePath\":\"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/App.tsx\",\"content\":\"import { lazy, Suspense, useEffect } from \\\"react\\\";\\nimport { DualViewport } from \\\"./components/layout/DualViewport\\\";\\nimport { BottomToolbar } from \\\"./components/ui/BottomToolbar\\\";\\nimport { HoleDrawer } from \\\"./components/ui/HoleDrawer\\\";\\nimport { LocationBar } from \\\"./components/ui/LocationBar\\\";\\nimport { MobileBudgetPanel } from \\\"./components/ui/MobileBudgetPanel\\\";\\nimport { MobileDetailPanel } from \\\"./components/ui/MobileDetailPanel\\\";\\nimport { MobileSunControls } from \\\"./components/ui/MobileSunControls\\\";\\nimport { Sidebar } from \\\"./components/ui/Sidebar\\\";\\nimport { UVTransition } from \\\"./components/three/UVTransition\\\";\\nimport { Toolbar } from \\\"./components/ui/Toolbar\\\";\\nimport { useGpuTier } from \\\"./hooks/useGpuTier\\\";\\nimport { useSunPosition } from \\\"./hooks/useSunPosition\\\";\\nimport { useStore } from \\\"./store\\\";\\n\\nconst Builder = lazy(() => import(\\\"./co"}
+{"timestamp":"2026-02-22T11:59:13Z","type":"tool","tool":"Edit","input":{"file_path":"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/App.tsx","old_string":"\t\t\t<DualViewport />","new_string":"\t\t\t<DualViewport sunData={sunData} />","replace_all":false},"response":"{\"filePath\":\"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/App.tsx\",\"oldString\":\"\\t\\t\\t<DualViewport />\",\"newString\":\"\\t\\t\\t<DualViewport sunData={sunData} />\",\"originalFile\":\"import { lazy, Suspense, useEffect } from \\\"react\\\";\\nimport { DualViewport } from \\\"./components/layout/DualViewport\\\";\\nimport { BottomToolbar } from \\\"./components/ui/BottomToolbar\\\";\\nimport { HoleDrawer } from \\\"./components/ui/HoleDrawer\\\";\\nimport { LocationBar } from \\\"./components/ui/LocationBar\\\";\\nimport { MobileBudgetPanel } from \\\"./components/ui/MobileBudgetPanel\\\";\\nimport { MobileDetailPanel } from \\\"./components/ui/MobileDetailPanel\\\";\\nimport { MobileSunControls } from \\\"./components/ui/MobileSunControls\\\";\\nimport { Sidebar } from \\\"./components/ui/Sidebar\\\";\\nimport { UVTransition } from \\\"./components/three/UVTransition\\\";\\nimport { Toolbar } from \\\"./components/ui/Toolbar\\\";\\nimport { useGpuTier } from \\\"./hooks/useGpuTier\\\";\\nimport { useSunPosition } from \\\"./hooks/useSunPosition\\\";\\nimport"}
+{"timestamp":"2026-02-22T11:59:21Z","type":"tool","tool":"Bash","input":{"command":"export PATH=\"/home/ben/.local/share/fnm:$PATH\" && eval \"$(fnm env)\" && npx tsc --noEmit 2>&1; echo \"EXIT: $?\"","description":"Type check after section-04 changes"},"response":"{\"stdout\":\"EXIT: 0\",\"stderr\":\"\",\"interrupted\":false,\"isImage\":false,\"noOutputExpected\":false}"}
+{"timestamp":"2026-02-22T12:00:23Z","type":"tool","tool":"Bash","input":{"command":"export PATH=\"/home/ben/.local/share/fnm:$PATH\" && eval \"$(fnm env)\" && npx vitest run 2>&1 | tail -10","description":"Run full test suite after section-04"},"response":"{\"stdout\":\" \\u001b[32m✓\\u001b[39m tests/components/three/hallEnvironment.test.ts \\u001b[2m(\\u001b[22m\\u001b[2m15 tests\\u001b[22m\\u001b[2m)\\u001b[22m\\u001b[32m 6\\u001b[2mms\\u001b[22m\\u001b[39m\\n \\u001b[32m✓\\u001b[39m tests/perfFixes.test.ts \\u001b[2m(\\u001b[22m\\u001b[2m8 tests\\u001b[22m\\u001b[2m)\\u001b[22m\\u001b[32m 4\\u001b[2mms\\u001b[22m\\u001b[39m\\n \\u001b[32m✓\\u001b[39m tests/utils/isMobile.test.ts \\u001b[2m(\\u001b[22m\\u001b[2m1 test\\u001b[22m\\u001b[2m)\\u001b[22m\\u001b[32m 11\\u001b[2mms\\u001b[22m\\u001b[39m\\n \\u001b[32m✓\\u001b[39m tests/utils/saveManager.test.ts \\u001b[2m(\\u001b[22m\\u001b[2m7 tests\\u001b[22m\\u001b[2m)\\u001b[22m\\u001b[32m 8\\u001b[2mms\\u001b[22m\\u001b[39m\\n\\n\\u001b[2m Test Files \\u001b[22m \\u001b[1m\\u001b[32m48 passed\\u001b[39m\\u001b[22m\\u001b[90m (48)\\u001b[39m\\n\\u001b[2m      Tests \\u001b[22m \\u001b[1m\\u001b[32m548 passed\\u001b[39m\\u001b[22m\\u001b[90m (548)\\u001b[39m\\n\\u001b[2m   Start at \\u001b[22m 12:59:33\\n\\u001b[2m   Duration \\u001b[22m 45.92s\\u001b[2m (tra"}
diff --git a/src/App.tsx b/src/App.tsx
index bcf7ae3..18a7b31 100644
--- a/src/App.tsx
+++ b/src/App.tsx
@@ -35,7 +35,7 @@ export default function App() {
 			<Toolbar />
 			<div className="flex flex-1 overflow-hidden">
 				<Sidebar />
-				<DualViewport />
+				<DualViewport sunData={sunData} />
 			</div>
 			<LocationBar sunData={sunData} />
 			<BottomToolbar />
diff --git a/src/components/layout/DualViewport.tsx b/src/components/layout/DualViewport.tsx
index 7dad318..0b7d4e9 100644
--- a/src/components/layout/DualViewport.tsx
+++ b/src/components/layout/DualViewport.tsx
@@ -1,17 +1,31 @@
-import { useRef } from "react";
+import { OrthographicCamera, PerspectiveCamera, View } from "@react-three/drei";
+import { Canvas } from "@react-three/fiber";
+import { Suspense, useRef } from "react";
+import { NoToneMapping } from "three";
+import type { SunData } from "../../hooks/useSunPosition";
 import { useSplitPane } from "../../hooks/useSplitPane";
 import { useStore } from "../../store";
+import { deriveFrameloop, getShadowType } from "../../utils/environmentGating";
+import { isMobile } from "../../utils/isMobile";
 import { canvasPointerEvents } from "../../utils/uvTransitionConfig";
+import { SharedScene } from "../three/SharedScene";
+import { ThreeDOnlyContent } from "../three/ThreeDOnlyContent";
 import { KeyboardHelp } from "../ui/KeyboardHelp";
 import { MiniMap } from "../ui/MiniMap";
 import { SunControls } from "../ui/SunControls";
 import { SplitDivider } from "./SplitDivider";
 
-export function DualViewport() {
+type DualViewportProps = {
+	sunData: SunData;
+};
+
+export function DualViewport({ sunData }: DualViewportProps) {
 	const containerRef = useRef<HTMLDivElement>(null);
 	const viewportLayout = useStore((s) => s.ui.viewportLayout);
 	const splitRatio = useStore((s) => s.ui.splitRatio);
 	const tool = useStore((s) => s.ui.tool);
+	const uvMode = useStore((s) => s.ui.uvMode);
+	const gpuTier = useStore((s) => s.ui.gpuTier);
 	const transitioning = useStore((s) => s.ui.transitioning);
 	const setActiveViewport = useStore((s) => s.setActiveViewport);
 	const {
@@ -25,6 +39,21 @@ export function DualViewport() {
 	const show3D = viewportLayout !== "2d-only";
 	const showDivider = viewportLayout === "dual";
 
+	// Canvas configuration
+	const dpr: [number, number] = isMobile
+		? [1, 1.5]
+		: gpuTier === "high"
+			? [1, 2]
+			: gpuTier === "mid"
+				? [1, 1.5]
+				: [1, 1];
+	// View rendering requires frameloop="always" in dual mode
+	const frameloop =
+		viewportLayout === "dual"
+			? "always"
+			: deriveFrameloop(uvMode, gpuTier, transitioning);
+	const shadows = getShadowType(gpuTier, isMobile);
+
 	return (
 		<div
 			ref={containerRef}
@@ -41,6 +70,7 @@ export function DualViewport() {
 				pointerEvents: canvasPointerEvents(transitioning),
 			}}
 		>
+			{/* 2D pane */}
 			{show2D && (
 				<div
 					className="relative h-full overflow-hidden"
@@ -51,12 +81,17 @@ export function DualViewport() {
 					}}
 					onPointerEnter={() => setActiveViewport("2d")}
 				>
-					{/* Placeholder — Canvas View wired in Section 04 */}
-					<div className="flex h-full items-center justify-center bg-surface-alt text-text-muted">
-						2D Viewport
-					</div>
+					<View style={{ width: "100%", height: "100%" }}>
+						<OrthographicCamera
+							makeDefault
+							position={[5, 50, 10]}
+							zoom={40}
+						/>
+						<SharedScene sunData={sunData} />
+					</View>
 				</div>
 			)}
+
 			{showDivider && (
 				<SplitDivider
 					isDragging={isDragging}
@@ -65,6 +100,8 @@ export function DualViewport() {
 					onDoubleClick={onDividerDoubleClick}
 				/>
 			)}
+
+			{/* 3D pane */}
 			{show3D && (
 				<div
 					className="relative h-full overflow-hidden"
@@ -75,13 +112,45 @@ export function DualViewport() {
 					}}
 					onPointerEnter={() => setActiveViewport("3d")}
 				>
-					{/* Placeholder — Canvas View wired in Section 04 */}
-					<div className="flex h-full items-center justify-center bg-surface-alt text-text-muted">
-						3D Viewport
-					</div>
+					<View style={{ width: "100%", height: "100%" }}>
+						<PerspectiveCamera
+							makeDefault
+							position={[5, 15, 25]}
+							fov={60}
+						/>
+						<SharedScene sunData={sunData} />
+						<ThreeDOnlyContent />
+					</View>
 				</div>
 			)}
-			{/* Overlay components — positioned absolutely within viewport container */}
+
+			{/* Single shared Canvas behind both panes */}
+			<Canvas
+				dpr={dpr}
+				frameloop={frameloop}
+				shadows={shadows}
+				gl={{
+					antialias: !isMobile,
+					preserveDrawingBuffer: false,
+					powerPreference: "high-performance",
+					toneMapping: NoToneMapping,
+				}}
+				eventSource={containerRef}
+				style={{
+					position: "absolute",
+					top: 0,
+					left: 0,
+					width: "100%",
+					height: "100%",
+					pointerEvents: "none",
+				}}
+			>
+				<Suspense fallback={null}>
+					<View.Port />
+				</Suspense>
+			</Canvas>
+
+			{/* Overlay components */}
 			<SunControls />
 			<KeyboardHelp />
 			<MiniMap />
diff --git a/src/components/three/SharedScene.tsx b/src/components/three/SharedScene.tsx
new file mode 100644
index 0000000..56eb832
--- /dev/null
+++ b/src/components/three/SharedScene.tsx
@@ -0,0 +1,67 @@
+import type { SunData } from "../../hooks/useSunPosition";
+import { useStore } from "../../store";
+import { isMobile } from "../../utils/isMobile";
+import { FloorGrid } from "./FloorGrid";
+import { FlowPath } from "./FlowPath";
+import { Hall } from "./Hall";
+import { PlacedHoles } from "./PlacedHoles";
+import { PlacementHandler } from "./PlacementHandler";
+import { SunIndicator } from "./SunIndicator";
+
+type SharedSceneProps = {
+	sunData: SunData;
+};
+
+export function SharedScene({ sunData }: SharedSceneProps) {
+	const uvMode = useStore((s) => s.ui.uvMode);
+
+	return (
+		<>
+			<ambientLight
+				color={uvMode ? "#220044" : "#ffffff"}
+				intensity={uvMode ? 0.3 : 0.8}
+			/>
+			{uvMode ? (
+				<directionalLight
+					position={[10, 20, 5]}
+					color="#6600CC"
+					intensity={0.4}
+				/>
+			) : (
+				<directionalLight
+					position={
+						sunData
+							? [
+									-Math.sin(sunData.azimuth) *
+										Math.cos(sunData.altitude) *
+										30 +
+										5,
+									Math.sin(sunData.altitude) * 30,
+									Math.cos(sunData.azimuth) *
+										Math.cos(sunData.altitude) *
+										30 +
+										10,
+								]
+							: [10, 20, 5]
+					}
+					color="#ffffff"
+					intensity={0.5}
+					castShadow
+					shadow-mapSize-width={isMobile ? 512 : 1024}
+					shadow-mapSize-height={isMobile ? 512 : 1024}
+					shadow-camera-left={-12}
+					shadow-camera-right={12}
+					shadow-camera-top={25}
+					shadow-camera-bottom={-15}
+					shadow-bias={-0.001}
+				/>
+			)}
+			<Hall sunData={sunData} />
+			<PlacedHoles />
+			<FlowPath />
+			<FloorGrid />
+			<SunIndicator sunData={sunData} />
+			<PlacementHandler />
+		</>
+	);
+}
diff --git a/src/components/three/ThreeDOnlyContent.tsx b/src/components/three/ThreeDOnlyContent.tsx
new file mode 100644
index 0000000..4e5ec6a
--- /dev/null
+++ b/src/components/three/ThreeDOnlyContent.tsx
@@ -0,0 +1,87 @@
+import {
+	Environment,
+	Lightformer,
+	PerformanceMonitor,
+	SoftShadows,
+	Sparkles,
+	Stats,
+} from "@react-three/drei";
+import { useThree } from "@react-three/fiber";
+import { useEffect } from "react";
+import { UV_LAMP_POSITIONS } from "../../constants/uvLamps";
+import { useStore } from "../../store";
+import {
+	shouldEnableFog,
+	shouldEnableSoftShadows,
+} from "../../utils/environmentGating";
+import { shouldShowGodRays } from "../../utils/godraysConfig";
+import { shouldShowSparkles } from "../../utils/postprocessingConfig";
+import { GodRaysSource } from "./GodRaysSource";
+import { ScreenshotCapture } from "./ScreenshotCapture";
+import { UVEffects } from "./UVEffects";
+import { UVLamps } from "./UVLamps";
+
+function FogController({ enabled }: { enabled: boolean }) {
+	const scene = useThree((s) => s.scene);
+	useEffect(() => {
+		if (!enabled) {
+			scene.fog = null;
+		}
+	}, [enabled, scene]);
+	return null;
+}
+
+export function ThreeDOnlyContent() {
+	const uvMode = useStore((s) => s.ui.uvMode);
+	const view = useStore((s) => s.ui.view);
+	const gpuTier = useStore((s) => s.ui.gpuTier);
+
+	const fogEnabled = shouldEnableFog(uvMode, view);
+
+	return (
+		<>
+			{fogEnabled && <fogExp2 attach="fog" args={["#07071A", 0.04]} />}
+			<FogController enabled={fogEnabled} />
+
+			<Environment
+				preset="night"
+				environmentIntensity={0.15}
+				background={false}
+			>
+				{UV_LAMP_POSITIONS.map((pos) => (
+					<Lightformer
+						key={`lamp-${pos[0]}-${pos[1]}-${pos[2]}`}
+						form="rect"
+						intensity={0.4}
+						color="#8800FF"
+						position={pos}
+						rotation-x={Math.PI / 2}
+						scale={[0.3, 2, 1]}
+					/>
+				))}
+			</Environment>
+
+			{shouldEnableSoftShadows(gpuTier) && (
+				<SoftShadows size={25} samples={10} />
+			)}
+
+			{uvMode && <UVLamps />}
+			{shouldShowGodRays({ gpuTier, uvMode }) && <GodRaysSource />}
+			{shouldShowSparkles({ gpuTier, uvMode }) && (
+				<Sparkles
+					count={400}
+					color="#9D00FF"
+					size={2}
+					speed={0.3}
+					scale={[10, 4.3, 20]}
+					position={[5, 2.15, 10]}
+				/>
+			)}
+			<UVEffects />
+			<ScreenshotCapture />
+
+			<PerformanceMonitor />
+			{import.meta.env.DEV && <Stats />}
+		</>
+	);
+}
