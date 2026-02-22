diff --git a/.claude/homunculus/observations.jsonl b/.claude/homunculus/observations.jsonl
index 87b976c..a0b9607 100644
--- a/.claude/homunculus/observations.jsonl
+++ b/.claude/homunculus/observations.jsonl
@@ -1439,3 +1439,37 @@ n *   ┌──────────────────┬───┐
 {"timestamp":"2026-02-21T18:10:52Z","type":"tool","tool":"Bash","input":{"command":"git diff --stat master...HEAD | tail -3","description":"Show diff stats between master and feature branch"},"response":"{\"stdout\":\" .../uv-top-down-chromium-linux.png                 | Bin 0 -> 90575 bytes\\n vite.config.ts                                     |  14 +-\\n 104 files changed, 7028 insertions(+), 533 deletions(-)\",\"stderr\":\"\",\"interrupted\":false,\"isImage\":false,\"noOutputExpected\":false}"}
 {"timestamp":"2026-02-21T18:11:11Z","type":"tool","tool":"Bash","input":{"command":"ls /mnt/c/Users/Caus/Golf_Plan/golf-planner/docs/plans/phase11a-archive/ 2>/dev/null","description":"Check Phase 11A archive contents"},"response":"{\"stdout\":\"claude-integration-notes.md\\nclaude-interview.md\\nclaude-plan-tdd.md\\nclaude-plan.md\\nclaude-research.md\\nclaude-spec.md\\ndeep_plan_config.json\\nreviews\\nsections\",\"stderr\":\"\",\"interrupted\":false,\"isImage\":false,\"noOutputExpected\":false}"}
 {"timestamp":"2026-02-21T18:11:48Z","type":"tool","tool":"Bash","input":{"command":"export PATH=\"/home/ben/.local/share/fnm:$PATH\" && eval \"$(fnm env)\" && npm test 2>&1 | tail -20","timeout":60000,"description":"Run test suite to verify baseline"},"response":"{\"stdout\":\"\\u001b[22m\\u001b[39m[zustand persist middleware] Unable to update item 'golf-planner-state', the given storage is currently unavailable.\\n\\n \\u001b[32m✓\\u001b[39m tests/store/builderSlice.test.ts \\u001b[2m(\\u001b[22m\\u001b[2m36 tests\\u001b[22m\\u001b[2m)\\u001b[22m\\u001b[32m 30\\u001b[2mms\\u001b[22m\\u001b[39m\\n \\u001b[32m✓\\u001b[39m tests/hooks/sunPosition.test.ts \\u001b[2m(\\u001b[22m\\u001b[2m7 tests\\u001b[22m\\u001b[2m)\\u001b[22m\\u001b[32m 4\\u001b[2mms\\u001b[22m\\u001b[39m\\n \\u001b[32m✓\\u001b[39m tests/hooks/gpuTier.test.ts \\u001b[2m(\\u001b[22m\\u001b[2m17 tests\\u001b[22m\\u001b[2m)\\u001b[22m\\u001b[32m 5\\u001b[2mms\\u001b[22m\\u001b[39m\\n \\u001b[32m✓\\u001b[39m tests/perfFixes.test.ts \\u001b[2m(\\u001b[22m\\u001b[2m8 tests\\u001b[22m\\u001b[2m)\\u001b[22m\\u001b[32m 5\\u001b[2mms\\u001b[22m\\u001b[39m\\n \\u001b[32m✓\\u001b[39m tests/uvLamps.test.ts \\u001b[2m(\\u001b[22m\\u001b[2m8 tests\\u001b[22m\\u001b[2m)\\u001b[22m\\u001b[32m 9\\u001b[2mms\\u001b[22m\\u001b[39m\\n \\u001b[32m✓\\u001b[39m te"}
+{"timestamp":"2026-02-21T18:13:14Z","type":"tool","tool":"Bash","input":{"command":"git checkout --theirs .claude/homunculus/observations.jsonl 2>/dev/null; git stash drop","description":"Resolve stash conflict and drop stash"},"response":"{\"stdout\":\"Dropped refs/stash@{0} (eb74df0a8919eeecb0b89f80b8ea473b9ec87ac6)\",\"stderr\":\"\",\"interrupted\":false,\"isImage\":false,\"noOutputExpected\":false}"}
+{"timestamp":"2026-02-21T18:13:19Z","type":"tool","tool":"Bash","input":{"command":"git status --short && echo \"---\" && git branch && echo \"---\" && git log --oneline -3","description":"Verify clean state on new branch"},"response":"{\"stdout\":\" M .claude/homunculus/observations.jsonl\\n---\\n  feature/phase-11a-visual-rendering\\n* feature/phase-12-beautiful-3d\\n  master\\n---\\ned2bdaf docs: Phase 11A completion artifacts + Phase 12 planning\\n16ccb01 test: add Playwright visual regression test suite\\n38be588 perf: singleton wall materials + mobile shadow optimization\",\"stderr\":\"\",\"interrupted\":false,\"isImage\":false,\"noOutputExpected\":false}"}
+{"timestamp":"2026-02-21T18:13:54Z","type":"tool","tool":"Bash","input":{"command":"export PATH=\"/home/ben/.local/share/fnm:$PATH\" && eval \"$(fnm env)\" && npm test 2>&1 | tail -5","timeout":60000,"description":"Verify tests pass on new branch"},"response":"{\"stdout\":\"\\u001b[2m Test Files \\u001b[22m \\u001b[1m\\u001b[32m32 passed\\u001b[39m\\u001b[22m\\u001b[90m (32)\\u001b[39m\\n\\u001b[2m      Tests \\u001b[22m \\u001b[1m\\u001b[32m377 passed\\u001b[39m\\u001b[22m\\u001b[90m (377)\\u001b[39m\\n\\u001b[2m   Start at \\u001b[22m 19:13:31\\n\\u001b[2m   Duration \\u001b[22m 23.41s\\u001b[2m (transform 19.84s, setup 0ms, import 42.78s, tests 281ms, environment 41.91s)\\u001b[22m\",\"stderr\":\"\",\"interrupted\":false,\"isImage\":false,\"noOutputExpected\":false}"}
+{"timestamp":"2026-02-21T18:16:58Z","type":"tool","tool":"Bash","input":{"command":"cd /mnt/c/Users/Caus/Golf_Plan/golf-planner && export PATH=\"/home/ben/.local/share/fnm:$PATH\" && eval \"$(fnm env)\" && npx vitest run tests/utils/bumperProfile.test.ts tests/utils/holeGeometry.test.ts tests/hooks/texturedMaterials.test.ts 2>&1 | tail -30","timeout":30000,"description":"Run new tests to verify they fail (TDD red phase)"},"response":"{\"stdout\":\"\\u001b[31m\\u001b[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/3]⎯\\u001b[22m\\u001b[39m\\n\\n\\u001b[41m\\u001b[1m FAIL \\u001b[22m\\u001b[49m tests/utils/bumperProfile.test.ts\\u001b[2m [ tests/utils/bumperProfile.test.ts ]\\u001b[22m\\n\\u001b[31m\\u001b[1mError\\u001b[22m: Cannot find module '../../src/utils/bumperProfile' imported from '/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/utils/bumperProfile.test.ts'\\u001b[39m\\n\\u001b[36m \\u001b[2m❯\\u001b[22m tests/utils/bumperProfile.test.ts:\\u001b[2m2:1\\u001b[22m\\u001b[39m\\n    \\u001b[90m  1| \\u001b[39m\\u001b[35mimport\\u001b[39m { describe\\u001b[33m,\\u001b[39m expect\\u001b[33m,\\u001b[39m it } \\u001b[35mfrom\\u001b[39m \\u001b[32m\\\"vitest\\\"\\u001b[39m\\u001b[33m;\\u001b[39m\\n    \\u001b[90m  2| \\u001b[39m\\u001b[35mimport\\u001b[39m {\\n    \\u001b[90m   | \\u001b[39m\\u001b[31m^\\u001b[39m\\n    \\u001b[90m  3| \\u001b[39m createBumperProfile\\u001b[33m,\\u001b[39m\\n    \\u001b[90m  4| \\u001b[39m createBumperGeometry\\u001"}
+{"timestamp":"2026-02-21T18:17:04Z","type":"tool","tool":"Bash","input":{"command":"mkdir -p /mnt/c/Users/Caus/Golf_Plan/golf-planner/public/textures/felt /mnt/c/Users/Caus/Golf_Plan/golf-planner/public/textures/wood /mnt/c/Users/Caus/Golf_Plan/golf-planner/public/textures/rubber","description":"Create texture directories"},"response":"{\"stdout\":\"\",\"stderr\":\"\",\"interrupted\":false,\"isImage\":false,\"noOutputExpected\":true}"}
+{"timestamp":"2026-02-21T18:17:16Z","type":"tool","tool":"Bash","input":{"command":"export PATH=\"/home/ben/.local/share/fnm:$PATH\" && eval \"$(fnm env)\" && node -e \"\nconst { createCanvas } = (() => { try { return require('canvas'); } catch { return { createCanvas: null }; } })();\nconst fs = require('fs');\nconst path = require('path');\n\n// Generate minimal 64x64 JPG textures using a raw JPEG approach\n// Since we may not have canvas module, we'll create minimal valid JPGs\n\nfunction createMinimalJPEG(width, height, r, g, b) {\n  // Create a minimal valid JPEG file with solid color\n  // This is a simplified approach - create via sharp or just placeholder\n  // Actually let's try with a BMP -> convert approach or just use Node buffer\n  \n  // Simplest approach: create a PPM file and convert, or just write raw JPEG\n  // For now, let's check if sharp is available\n  try {\n    const sharp = require('sharp');\n    return sharp({\n      create: {\n        width, height,\n        channels: 3,\n        background: { r, g, b }\n      }\n    }).jpeg({ quality: 80 }).toBuffer();\n  } catch {\n    return null;\n  }\n}\n\nasync function main() {\n  // Try sharp first\n  let method = 'none';\n  try {\n    require('sharp');\n    method = 'sharp';\n  } catch {\n    try {\n      require('canvas');\n      method = 'canvas';\n    } catch {\n      method = 'none';\n    }\n  }\n  console.log('Method:', method);\n  \n  if (method === 'none') {\n    // Create minimal 1x1 JPEG files manually\n    // Minimal JPEG: SOI + APP0 + DQT + SOF0 + DHT + SOS + data + EOI\n    // This is complex - let's just use ImageMagick if available\n    const { execSync } = require('child_process');\n    try {\n      execSync('which convert', { stdio: 'pipe' });\n      method = 'imagemagick';\n    } catch {\n      try {\n        execSync('which magick', { stdio: 'pipe' });\n        method = 'magick';\n      } catch {\n        method = 'python';\n      }\n    }\n  }\n  console.log('Final method:', method);\n}\nmain();\n\" 2>&1","description":"Check available image generation methods"},"response":"{\"stdout\":\"Method: none\\nFinal method: python\",\"stderr\":\"\",\"interrupted\":false,\"isImage\":false,\"noOutputExpected\":false}"}
+{"timestamp":"2026-02-21T18:17:34Z","type":"tool","tool":"Bash","input":{"command":"python3 -c \"\nfrom PIL import Image\nimport os, random\n\nbase = '/mnt/c/Users/Caus/Golf_Plan/golf-planner/public/textures'\n\ndef make_noise_image(w, h, base_color, noise_amount=30):\n    img = Image.new('RGB', (w, h))\n    pixels = img.load()\n    for y in range(h):\n        for x in range(w):\n            r = max(0, min(255, base_color[0] + random.randint(-noise_amount, noise_amount)))\n            g = max(0, min(255, base_color[1] + random.randint(-noise_amount, noise_amount)))\n            b = max(0, min(255, base_color[2] + random.randint(-noise_amount, noise_amount)))\n            pixels[x, y] = (r, g, b)\n    return img\n\ndef make_normal_image(w, h, strength=20):\n    img = Image.new('RGB', (w, h))\n    pixels = img.load()\n    for y in range(h):\n        for x in range(w):\n            r = 128 + random.randint(-strength, strength)\n            g = 128 + random.randint(-strength, strength)\n            b = 255\n            pixels[x, y] = (max(0,min(255,r)), max(0,min(255,g)), max(0,min(255,b)))\n    return img\n\ndef make_roughness_image(w, h, base_val=180, noise=40):\n    img = Image.new('RGB', (w, h))\n    pixels = img.load()\n    for y in range(h):\n        for x in range(w):\n            v = max(0, min(255, base_val + random.randint(-noise, noise)))\n            pixels[x, y] = (v, v, v)\n    return img\n\nrandom.seed(42)\nsz = 256\n\n# Felt (neutral gray carpet - will be tinted green by material color)\nmake_noise_image(sz, sz, (180, 180, 175), 15).save(f'{base}/felt/color.jpg', quality=85)\nmake_normal_image(sz, sz, 15).save(f'{base}/felt/normal.jpg', quality=85)\nmake_roughness_image(sz, sz, 200, 25).save(f'{base}/felt/roughness.jpg', quality=85)\n\n# Wood (warm brown grain)\nwood = Image.new('RGB', (sz, sz))\npixels = wood.load()\nfor y in range(sz):\n    stripe = int(80 + 40 * ((y % 32) / 32.0))\n    for x in range(sz):\n        r = max(0, min(255, 140 + stripe//2 + random.randint(-10, 10)))\n        g = max(0, min(255, 100 + stripe//3 + random.randint(-10, 10)))\n        b = max(0, min(255, 60 + stripe//4 + random.randint(-10, 10)))\n        pixels[x, y] = (r, g, b)\nwood.save(f'{base}/wood/color.jpg', quality=85)\nmake_normal_image(sz, sz, 20).save(f'{base}/wood/normal.jpg', quality=85)\nmake_roughness_image(sz, sz, 140, 30).save(f'{base}/wood/roughness.jpg', quality=85)\n\n# Rubber (dark stipple - only normal and roughness needed)\nmake_normal_image(sz, sz, 10).save(f'{base}/rubber/normal.jpg', quality=85)\nmake_roughness_image(sz, sz, 160, 20).save(f'{base}/rubber/roughness.jpg', quality=85)\n\nprint('All textures created successfully')\nfor d in ['felt', 'wood', 'rubber']:\n    files = os.listdir(f'{base}/{d}')\n    for f in files:\n        size = os.path.getsize(f'{base}/{d}/{f}')\n        print(f'  {d}/{f}: {size} bytes')\n\" 2>&1","description":"Generate procedural placeholder textures with Python PIL"},"response":"{\"stdout\":\"All textures created successfully\\n  felt/color.jpg: 13792 bytes\\n  felt/normal.jpg: 13433 bytes\\n  felt/roughness.jpg: 23969 bytes\\n  wood/color.jpg: 9904 bytes\\n  wood/normal.jpg: 16918 bytes\\n  wood/roughness.jpg: 26113 bytes\\n  rubber/normal.jpg: 9287 bytes\\n  rubber/roughness.jpg: 21338 bytes\",\"stderr\":\"\",\"interrupted\":false,\"isImage\":false,\"noOutputExpected\":false}"}
+{"timestamp":"2026-02-21T18:17:44Z","type":"tool","tool":"Write","input":{"file_path":"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/utils/bumperProfile.ts","content":"import * as THREE from \"three\";\nimport { mergeVertices } from \"three/examples/jsm/utils/BufferGeometryUtils.js\";\n\n/**\n * Creates a rounded rectangle Shape for bumper cross-section.\n * The shape lies in the XY plane: X = thickness, Y = height.\n * Four corners get quadraticCurveTo bevels for rounded edges.\n */\nexport function createBumperProfile(\n\theight: number,\n\tthickness: number,\n\tbevelRadius: number,\n): THREE.Shape {\n\tconst r = Math.min(bevelRadius, thickness / 2, height / 2);\n\tconst hw = thickness / 2;\n\tconst hh = height;\n\n\tconst shape = new THREE.Shape();\n\n\t// Start at bottom-left + bevel offset, go clockwise\n\tshape.moveTo(-hw + r, 0);\n\n\t// Bottom edge -> bottom-right corner\n\tshape.lineTo(hw - r, 0);\n\tshape.quadraticCurveTo(hw, 0, hw, r);\n\n\t// Right edge -> top-right corner\n\tshape.lineTo(hw, hh - r);\n\tshape.quadraticCurveTo(hw, hh, hw - r, hh);\n\n\t// Top edge -> top-left corner\n\tshape.lineTo(-hw + r, hh);\n\tshape.quadraticCurveTo(-hw, hh, -hw, hh - r);\n\n\t// Left edge -> bottom-left corner\n\tshape.lineTo(-hw, r);\n\tshape.quadraticCurveTo(-hw, 0, -hw + r, 0);\n\n\treturn shape;\n}\n\n/**\n * Creates ExtrudeGeometry for a straight bumper rail.\n * Extrudes the bumper profile along the Z axis for the given length.\n */\nexport function createBumperGeometry(\n\tprofile: THREE.Shape,\n\tlength: number,\n\toptions?: { curveSegments?: number },\n): THREE.ExtrudeGeometry {\n\tconst curveSegments = options?.curveSegments ?? 8;\n\n\tconst geom = new THREE.ExtrudeGeometry(profile, {\n\t\tdepth: length,\n\t\tbevelEnabled: false,\n\t\tcurveSegments,\n\t});\n\n\treturn mergeVertices(geom) as THREE.ExtrudeGeometry;\n}\n"},"response":"{\"type\":\"create\",\"filePath\":\"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/utils/bumperProfile.ts\",\"content\":\"import * as THREE from \\\"three\\\";\\nimport { mergeVertices } from \\\"three/examples/jsm/utils/BufferGeometryUtils.js\\\";\\n\\n/**\\n * Creates a rounded rectangle Shape for bumper cross-section.\\n * The shape lies in the XY plane: X = thickness, Y = height.\\n * Four corners get quadraticCurveTo bevels for rounded edges.\\n */\\nexport function createBumperProfile(\\n\\theight: number,\\n\\tthickness: number,\\n\\tbevelRadius: number,\\n): THREE.Shape {\\n\\tconst r = Math.min(bevelRadius, thickness / 2, height / 2);\\n\\tconst hw = thickness / 2;\\n\\tconst hh = height;\\n\\n\\tconst shape = new THREE.Shape();\\n\\n\\t// Start at bottom-left + bevel offset, go clockwise\\n\\tshape.moveTo(-hw + r, 0);\\n\\n\\t// Bottom edge -> bottom-right corner\\n\\tshape.lineTo(hw - r, 0);\\n\\tshape.quadraticCurveTo(hw, 0, hw, r);\\n\\n\\t// Right edge -> top-right corner\\n\\tshape.lineTo(hw, hh - r);\\n\\tshape.quadraticCurveTo(hw, "}
+{"timestamp":"2026-02-21T18:17:49Z","type":"tool","tool":"Write","input":{"file_path":"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/utils/holeGeometry.ts","content":"import * as THREE from \"three\";\n\n/** Depth of the recessed cup below the felt surface */\nexport const CUP_DEPTH = 0.015;\n\n/** Height of the flag pin above the felt surface */\nexport const FLAG_PIN_HEIGHT = 0.2;\n\n/**\n * Creates a recessed CylinderGeometry for the cup (hole).\n * Oriented along Y axis, open at the top.\n */\nexport function createCupGeometry(radius: number): THREE.CylinderGeometry {\n\treturn new THREE.CylinderGeometry(radius, radius, CUP_DEPTH, 16, 1, true);\n}\n\n/**\n * Creates a slightly raised CylinderGeometry for the tee pad.\n * 3mm height, positioned on top of the felt surface.\n */\nexport function createTeeGeometry(radius: number): THREE.CylinderGeometry {\n\treturn new THREE.CylinderGeometry(radius, radius, 0.003, 16);\n}\n\n/**\n * Creates a thin CylinderGeometry for the flag pin shaft.\n */\nexport function createFlagPinGeometry(): THREE.CylinderGeometry {\n\treturn new THREE.CylinderGeometry(0.003, 0.003, FLAG_PIN_HEIGHT, 6);\n}\n"},"response":"{\"type\":\"create\",\"filePath\":\"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/utils/holeGeometry.ts\",\"content\":\"import * as THREE from \\\"three\\\";\\n\\n/** Depth of the recessed cup below the felt surface */\\nexport const CUP_DEPTH = 0.015;\\n\\n/** Height of the flag pin above the felt surface */\\nexport const FLAG_PIN_HEIGHT = 0.2;\\n\\n/**\\n * Creates a recessed CylinderGeometry for the cup (hole).\\n * Oriented along Y axis, open at the top.\\n */\\nexport function createCupGeometry(radius: number): THREE.CylinderGeometry {\\n\\treturn new THREE.CylinderGeometry(radius, radius, CUP_DEPTH, 16, 1, true);\\n}\\n\\n/**\\n * Creates a slightly raised CylinderGeometry for the tee pad.\\n * 3mm height, positioned on top of the felt surface.\\n */\\nexport function createTeeGeometry(radius: number): THREE.CylinderGeometry {\\n\\treturn new THREE.CylinderGeometry(radius, radius, 0.003, 16);\\n}\\n\\n/**\\n * Creates a thin CylinderGeometry for the flag pin shaft.\\n */\\nexport function createFlagPinGeometry(): THREE.Cyl"}
+{"timestamp":"2026-02-21T18:18:10Z","type":"tool","tool":"Write","input":{"file_path":"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/useTexturedMaterials.ts","content":"import { useTexture } from \"@react-three/drei\";\nimport { useEffect, useMemo } from \"react\";\nimport * as THREE from \"three\";\nimport { useStore } from \"../../../store\";\nimport type { MaterialProfile } from \"../../../types/budget\";\nimport type { GpuTier } from \"../../../types/ui\";\nimport { BUMPER_PBR, FELT_PBR } from \"./materialPresets\";\nimport { cupMaterial, teeMaterial } from \"./shared\";\nimport type { MaterialSet } from \"./useMaterials\";\n\n/** Surface types that have texture assets */\nexport type TextureSurface = \"felt\" | \"wood\" | \"rubber\";\n\n/**\n * Whether textures should be loaded for this GPU tier.\n * Low tier = no textures (flat-color fallback).\n */\nexport function shouldLoadTextures(tier: GpuTier): boolean {\n\treturn tier !== \"low\";\n}\n\n/**\n * Returns array of texture file paths to load for a given surface and GPU tier.\n * High: [color, normal, roughness]\n * Mid: [color, normal] (no roughness)\n * Low: [] (empty)\n */\nexport function getTexturePathsForTier(\n\ttier: GpuTier,\n\tsurface: TextureSurface,\n): string[] {\n\tif (tier === \"low\") return [];\n\n\tconst base = `/textures/${surface}`;\n\n\t// Rubber has no color map (uses material color)\n\tif (surface === \"rubber\") {\n\t\tconst paths = [`${base}/normal.jpg`, `${base}/roughness.jpg`];\n\t\tif (tier === \"mid\") return [paths[0]]; // normal only\n\t\treturn paths; // high: normal + roughness\n\t}\n\n\tconst paths = [`${base}/color.jpg`, `${base}/normal.jpg`];\n\tif (tier === \"high\") {\n\t\tpaths.push(`${base}/roughness.jpg`);\n\t}\n\treturn paths;\n}\n\nfunction configureTexture(\n\ttexture: THREE.Texture,\n\trepeatX: number,\n\trepeatY: number,\n): void {\n\ttexture.wrapS = THREE.RepeatWrapping;\n\ttexture.wrapT = THREE.RepeatWrapping;\n\ttexture.repeat.set(repeatX, repeatY);\n}\n\n/**\n * React hook that returns a MaterialSet with PBR texture maps applied.\n * Must be called inside a Suspense boundary.\n */\nexport function useTexturedMaterials(): MaterialSet {\n\tconst gpuTier = useStore((s) => s.ui.gpuTier);\n\tconst materialProfile: MaterialProfile = useStore(\n\t\t(s) => s.budgetConfig.materialProfile,\n\t);\n\n\t// Load felt textures\n\tconst feltPaths = getTexturePathsForTier(gpuTier, \"felt\");\n\tconst feltTextures = useTexture(\n\t\tfeltPaths.length > 0 ? feltPaths : [\"/textures/felt/color.jpg\"],\n\t);\n\n\t// Load wood textures\n\tconst woodPaths = getTexturePathsForTier(gpuTier, \"wood\");\n\tconst woodTextures = useTexture(\n\t\twoodPaths.length > 0 ? woodPaths : [\"/textures/wood/color.jpg\"],\n\t);\n\n\tconst materials = useMemo(() => {\n\t\tconst feltProps = FELT_PBR[materialProfile];\n\t\tconst bumperProps = BUMPER_PBR[materialProfile];\n\n\t\t// Configure felt textures\n\t\tconst feltArr = Array.isArray(feltTextures)\n\t\t\t? feltTextures\n\t\t\t: [feltTextures];\n\t\tfor (const tex of feltArr) {\n\t\t\tconfigureTexture(tex, 2, 2);\n\t\t}\n\n\t\tconst felt = new THREE.MeshStandardMaterial({\n\t\t\tcolor: feltProps.color,\n\t\t\troughness: feltProps.roughness,\n\t\t\tmetalness: feltProps.metalness,\n\t\t\tmap: feltArr[0] ?? null,\n\t\t\tnormalMap: feltArr[1] ?? null,\n\t\t\troughnessMap: feltArr[2] ?? null,\n\t\t\tpolygonOffset: true,\n\t\t\tpolygonOffsetFactor: -1,\n\t\t});\n\n\t\t// Configure wood textures\n\t\tconst woodArr = Array.isArray(woodTextures)\n\t\t\t? woodTextures\n\t\t\t: [woodTextures];\n\t\tfor (const tex of woodArr) {\n\t\t\tconfigureTexture(tex, 1, 4);\n\t\t}\n\n\t\tconst bumper = new THREE.MeshStandardMaterial({\n\t\t\tcolor: bumperProps.color,\n\t\t\troughness: bumperProps.roughness,\n\t\t\tmetalness: bumperProps.metalness,\n\t\t\tmap: woodArr[0] ?? null,\n\t\t\tnormalMap: woodArr[1] ?? null,\n\t\t\troughnessMap: woodArr[2] ?? null,\n\t\t});\n\n\t\treturn { felt, bumper, tee: teeMaterial, cup: cupMaterial };\n\t}, [materialProfile, feltTextures, woodTextures]);\n\n\tuseEffect(() => {\n\t\treturn () => {\n\t\t\tmaterials.felt.dispose();\n\t\t\tmaterials.bumper.dispose();\n\t\t};\n\t}, [materials]);\n\n\treturn materials;\n}\n\n// Preload critical textures\nuseTexture.preload(\"/textures/felt/color.jpg\");\nuseTexture.preload(\"/textures/felt/normal.jpg\");\nuseTexture.preload(\"/textures/wood/color.jpg\");\nuseTexture.preload(\"/textures/wood/normal.jpg\");\n"},"response":"{\"type\":\"create\",\"filePath\":\"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/useTexturedMaterials.ts\",\"content\":\"import { useTexture } from \\\"@react-three/drei\\\";\\nimport { useEffect, useMemo } from \\\"react\\\";\\nimport * as THREE from \\\"three\\\";\\nimport { useStore } from \\\"../../../store\\\";\\nimport type { MaterialProfile } from \\\"../../../types/budget\\\";\\nimport type { GpuTier } from \\\"../../../types/ui\\\";\\nimport { BUMPER_PBR, FELT_PBR } from \\\"./materialPresets\\\";\\nimport { cupMaterial, teeMaterial } from \\\"./shared\\\";\\nimport type { MaterialSet } from \\\"./useMaterials\\\";\\n\\n/** Surface types that have texture assets */\\nexport type TextureSurface = \\\"felt\\\" | \\\"wood\\\" | \\\"rubber\\\";\\n\\n/**\\n * Whether textures should be loaded for this GPU tier.\\n * Low tier = no textures (flat-color fallback).\\n */\\nexport function shouldLoadTextures(tier: GpuTier): boolean {\\n\\treturn tier !== \\\"low\\\";\\n}\\n\\n/**\\n * Returns array of texture file paths to load for a given surface "}
+{"timestamp":"2026-02-21T18:18:24Z","type":"tool","tool":"Bash","input":{"command":"export PATH=\"/home/ben/.local/share/fnm:$PATH\" && eval \"$(fnm env)\" && npx vitest run tests/utils/bumperProfile.test.ts tests/utils/holeGeometry.test.ts tests/hooks/texturedMaterials.test.ts 2>&1 | tail -40","timeout":30000,"description":"Run new tests to verify they pass (TDD green phase)"},"response":"{\"stdout\":\"\\u001b[1m\\u001b[46m RUN \\u001b[49m\\u001b[22m \\u001b[36mv4.0.18 \\u001b[39m\\u001b[90m/mnt/c/Users/Caus/Golf_Plan/golf-planner\\u001b[39m\\n\\n \\u001b[32m✓\\u001b[39m tests/utils/holeGeometry.test.ts \\u001b[2m(\\u001b[22m\\u001b[2m8 tests\\u001b[22m\\u001b[2m)\\u001b[22m\\u001b[32m 5\\u001b[2mms\\u001b[22m\\u001b[39m\\n \\u001b[32m✓\\u001b[39m tests/utils/bumperProfile.test.ts \\u001b[2m(\\u001b[22m\\u001b[2m6 tests\\u001b[22m\\u001b[2m)\\u001b[22m\\u001b[32m 16\\u001b[2mms\\u001b[22m\\u001b[39m\\n \\u001b[31m❯\\u001b[39m tests/hooks/texturedMaterials.test.ts \\u001b[2m(\\u001b[22m\\u001b[2m0 test\\u001b[22m\\u001b[2m)\\u001b[22m\\n\\n\\u001b[31m⎯⎯⎯⎯⎯⎯\\u001b[39m\\u001b[1m\\u001b[41m Failed Suites 1 \\u001b[49m\\u001b[22m\\u001b[31m⎯⎯⎯⎯⎯⎯⎯\\u001b[39m\\n\\n\\u001b[41m\\u001b[1m FAIL \\u001b[22m\\u001b[49m tests/hooks/texturedMaterials.test.ts\\u001b[2m [ tests/hooks/texturedMaterials.test.ts ]\\u001b[22m\\n\\u001b[31m\\u001b[1mTypeError\\u001b[22m: __vite_ssr_import_0__.useTexture.preload is not a funct"}
+{"timestamp":"2026-02-21T18:18:31Z","type":"tool","tool":"Edit","input":{"file_path":"/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/hooks/texturedMaterials.test.ts","old_string":"vi.mock(\"@react-three/drei\", () => ({\n\tuseTexture: vi.fn(() => {\n\t\treturn new THREE.Texture();\n\t}),\n}));","new_string":"const mockUseTexture = Object.assign(\n\tvi.fn(() => new THREE.Texture()),\n\t{ preload: vi.fn() },\n);\n\nvi.mock(\"@react-three/drei\", () => ({\n\tuseTexture: mockUseTexture,\n}));","replace_all":false},"response":"{\"filePath\":\"/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/hooks/texturedMaterials.test.ts\",\"oldString\":\"vi.mock(\\\"@react-three/drei\\\", () => ({\\n\\tuseTexture: vi.fn(() => {\\n\\t\\treturn new THREE.Texture();\\n\\t}),\\n}));\",\"newString\":\"const mockUseTexture = Object.assign(\\n\\tvi.fn(() => new THREE.Texture()),\\n\\t{ preload: vi.fn() },\\n);\\n\\nvi.mock(\\\"@react-three/drei\\\", () => ({\\n\\tuseTexture: mockUseTexture,\\n}));\",\"originalFile\":\"import { describe, expect, it, vi } from \\\"vitest\\\";\\nimport * as THREE from \\\"three\\\";\\n\\nvi.mock(\\\"@react-three/drei\\\", () => ({\\n\\tuseTexture: vi.fn(() => {\\n\\t\\treturn new THREE.Texture();\\n\\t}),\\n}));\\n\\nimport {\\n\\tgetTexturePathsForTier,\\n\\tshouldLoadTextures,\\n} from \\\"../../src/components/three/holes/useTexturedMaterials\\\";\\n\\ndescribe(\\\"shouldLoadTextures\\\", () => {\\n\\tit(\\\"returns false for GPU tier 'low'\\\", () => {\\n\\t\\texpect(shouldLoadTextures(\\\"low\\\")).toBe(false);\\n\\t});\\n\\n\\tit(\\\"returns true for GPU tier 'mid'\\\", () => {\\n\\t\\texpect(shouldL"}
+{"timestamp":"2026-02-21T18:18:46Z","type":"tool","tool":"Bash","input":{"command":"export PATH=\"/home/ben/.local/share/fnm:$PATH\" && eval \"$(fnm env)\" && npx vitest run tests/utils/bumperProfile.test.ts tests/utils/holeGeometry.test.ts tests/hooks/texturedMaterials.test.ts 2>&1 | tail -25","timeout":30000,"description":"Re-run tests after fixing mock"},"response":"{\"stdout\":\" \\u001b[31m❯\\u001b[39m tests/hooks/texturedMaterials.test.ts \\u001b[2m(\\u001b[22m\\u001b[2m0 test\\u001b[22m\\u001b[2m)\\u001b[22m\\n \\u001b[32m✓\\u001b[39m tests/utils/bumperProfile.test.ts \\u001b[2m(\\u001b[22m\\u001b[2m6 tests\\u001b[22m\\u001b[2m)\\u001b[22m\\u001b[32m 15\\u001b[2mms\\u001b[22m\\u001b[39m\\n \\u001b[32m✓\\u001b[39m tests/utils/holeGeometry.test.ts \\u001b[2m(\\u001b[22m\\u001b[2m8 tests\\u001b[22m\\u001b[2m)\\u001b[22m\\u001b[32m 6\\u001b[2mms\\u001b[22m\\u001b[39m\\n\\n\\u001b[31m⎯⎯⎯⎯⎯⎯\\u001b[39m\\u001b[1m\\u001b[41m Failed Suites 1 \\u001b[49m\\u001b[22m\\u001b[31m⎯⎯⎯⎯⎯⎯⎯\\u001b[39m\\n\\n\\u001b[41m\\u001b[1m FAIL \\u001b[22m\\u001b[49m tests/hooks/texturedMaterials.test.ts\\u001b[2m [ tests/hooks/texturedMaterials.test.ts ]\\u001b[22m\\n\\u001b[31m\\u001b[1mError\\u001b[22m: [vitest] There was an error when mocking a module. If you are using \\\"vi.mock\\\" factory, make sure there are no top level variables inside, since this call is hoisted to top of the file. Read more"}
+{"timestamp":"2026-02-21T18:18:51Z","type":"tool","tool":"Read","input":{"file_path":"/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/hooks/texturedMaterials.test.ts"},"response":"{\"type\":\"text\",\"file\":{\"filePath\":\"/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/hooks/texturedMaterials.test.ts\",\"content\":\"import { describe, expect, it, vi } from \\\"vitest\\\";\\nimport * as THREE from \\\"three\\\";\\n\\nconst mockUseTexture = Object.assign(\\n\\tvi.fn(() => new THREE.Texture()),\\n\\t{ preload: vi.fn() },\\n);\\n\\nvi.mock(\\\"@react-three/drei\\\", () => ({\\n\\tuseTexture: mockUseTexture,\\n}));\\n\\nimport {\\n\\tgetTexturePathsForTier,\\n\\tshouldLoadTextures,\\n} from \\\"../../src/components/three/holes/useTexturedMaterials\\\";\\n\\ndescribe(\\\"shouldLoadTextures\\\", () => {\\n\\tit(\\\"returns false for GPU tier 'low'\\\", () => {\\n\\t\\texpect(shouldLoadTextures(\\\"low\\\")).toBe(false);\\n\\t});\\n\\n\\tit(\\\"returns true for GPU tier 'mid'\\\", () => {\\n\\t\\texpect(shouldLoadTextures(\\\"mid\\\")).toBe(true);\\n\\t});\\n\\n\\tit(\\\"returns true for GPU tier 'high'\\\", () => {\\n\\t\\texpect(shouldLoadTextures(\\\"high\\\")).toBe(true);\\n\\t});\\n});\\n\\ndescribe(\\\"getTexturePathsForTier\\\", () => {\\n\\tit(\\\"GPU tier high returns co"}
+{"timestamp":"2026-02-21T18:18:59Z","type":"tool","tool":"Write","input":{"file_path":"/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/hooks/texturedMaterials.test.ts","content":"import { describe, expect, it, vi } from \"vitest\";\n\nvi.mock(\"@react-three/drei\", () => {\n\tconst { Texture } = require(\"three\");\n\tconst fn = vi.fn(() => new Texture());\n\tfn.preload = vi.fn();\n\treturn { useTexture: fn };\n});\n\n// Also mock the store to avoid Zustand initialization issues\nvi.mock(\"../../../src/store\", () => ({\n\tuseStore: vi.fn(() => \"high\"),\n}));\n\nimport {\n\tgetTexturePathsForTier,\n\tshouldLoadTextures,\n} from \"../../src/components/three/holes/useTexturedMaterials\";\n\ndescribe(\"shouldLoadTextures\", () => {\n\tit(\"returns false for GPU tier 'low'\", () => {\n\t\texpect(shouldLoadTextures(\"low\")).toBe(false);\n\t});\n\n\tit(\"returns true for GPU tier 'mid'\", () => {\n\t\texpect(shouldLoadTextures(\"mid\")).toBe(true);\n\t});\n\n\tit(\"returns true for GPU tier 'high'\", () => {\n\t\texpect(shouldLoadTextures(\"high\")).toBe(true);\n\t});\n});\n\ndescribe(\"getTexturePathsForTier\", () => {\n\tit(\"GPU tier high returns color + normal + roughness paths\", () => {\n\t\tconst paths = getTexturePathsForTier(\"high\", \"felt\");\n\t\texpect(paths).toContain(\"/textures/felt/color.jpg\");\n\t\texpect(paths).toContain(\"/textures/felt/normal.jpg\");\n\t\texpect(paths).toContain(\"/textures/felt/roughness.jpg\");\n\t});\n\n\tit(\"GPU tier mid returns color + normal only (no roughness)\", () => {\n\t\tconst paths = getTexturePathsForTier(\"mid\", \"felt\");\n\t\texpect(paths).toContain(\"/textures/felt/color.jpg\");\n\t\texpect(paths).toContain(\"/textures/felt/normal.jpg\");\n\t\texpect(paths).not.toContain(\"/textures/felt/roughness.jpg\");\n\t});\n\n\tit(\"GPU tier low returns empty array (no textures)\", () => {\n\t\tconst paths = getTexturePathsForTier(\"low\", \"felt\");\n\t\texpect(paths).toHaveLength(0);\n\t});\n\n\tit(\"returns wood texture paths\", () => {\n\t\tconst paths = getTexturePathsForTier(\"high\", \"wood\");\n\t\texpect(paths).toContain(\"/textures/wood/color.jpg\");\n\t\texpect(paths).toContain(\"/textures/wood/normal.jpg\");\n\t});\n\n\tit(\"returns rubber texture paths\", () => {\n\t\tconst paths = getTexturePathsForTier(\"high\", \"rubber\");\n\t\texpect(paths).toContain(\"/textures/rubber/normal.jpg\");\n\t\texpect(paths).toContain(\"/textures/rubber/roughness.jpg\");\n\t});\n});\n"},"response":"{\"type\":\"update\",\"filePath\":\"/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/hooks/texturedMaterials.test.ts\",\"content\":\"import { describe, expect, it, vi } from \\\"vitest\\\";\\n\\nvi.mock(\\\"@react-three/drei\\\", () => {\\n\\tconst { Texture } = require(\\\"three\\\");\\n\\tconst fn = vi.fn(() => new Texture());\\n\\tfn.preload = vi.fn();\\n\\treturn { useTexture: fn };\\n});\\n\\n// Also mock the store to avoid Zustand initialization issues\\nvi.mock(\\\"../../../src/store\\\", () => ({\\n\\tuseStore: vi.fn(() => \\\"high\\\"),\\n}));\\n\\nimport {\\n\\tgetTexturePathsForTier,\\n\\tshouldLoadTextures,\\n} from \\\"../../src/components/three/holes/useTexturedMaterials\\\";\\n\\ndescribe(\\\"shouldLoadTextures\\\", () => {\\n\\tit(\\\"returns false for GPU tier 'low'\\\", () => {\\n\\t\\texpect(shouldLoadTextures(\\\"low\\\")).toBe(false);\\n\\t});\\n\\n\\tit(\\\"returns true for GPU tier 'mid'\\\", () => {\\n\\t\\texpect(shouldLoadTextures(\\\"mid\\\")).toBe(true);\\n\\t});\\n\\n\\tit(\\\"returns true for GPU tier 'high'\\\", () => {\\n\\t\\texpect(shouldLoadTextures(\\\"high\\"}
+{"timestamp":"2026-02-21T18:19:11Z","type":"tool","tool":"Bash","input":{"command":"export PATH=\"/home/ben/.local/share/fnm:$PATH\" && eval \"$(fnm env)\" && npx vitest run tests/hooks/texturedMaterials.test.ts 2>&1 | tail -30","timeout":30000,"description":"Re-run textured materials test"},"response":"{\"stdout\":\"\\u001b[1m\\u001b[46m RUN \\u001b[49m\\u001b[22m \\u001b[36mv4.0.18 \\u001b[39m\\u001b[90m/mnt/c/Users/Caus/Golf_Plan/golf-planner\\u001b[39m\\n\\n \\u001b[32m✓\\u001b[39m tests/hooks/texturedMaterials.test.ts \\u001b[2m(\\u001b[22m\\u001b[2m8 tests\\u001b[22m\\u001b[2m)\\u001b[22m\\u001b[32m 4\\u001b[2mms\\u001b[22m\\u001b[39m\\n\\n\\u001b[2m Test Files \\u001b[22m \\u001b[1m\\u001b[32m1 passed\\u001b[39m\\u001b[22m\\u001b[90m (1)\\u001b[39m\\n\\u001b[2m      Tests \\u001b[22m \\u001b[1m\\u001b[32m8 passed\\u001b[39m\\u001b[22m\\u001b[90m (8)\\u001b[39m\\n\\u001b[2m   Start at \\u001b[22m 19:19:07\\n\\u001b[2m   Duration \\u001b[22m 3.15s\\u001b[2m (transform 427ms, setup 0ms, import 918ms, tests 4ms, environment 0ms)\\u001b[22m\",\"stderr\":\"\",\"interrupted\":false,\"isImage\":false,\"noOutputExpected\":false}"}
+{"timestamp":"2026-02-21T18:19:14Z","type":"tool","tool":"Read","input":{"file_path":"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/HoleModel.tsx"},"response":"{\"type\":\"text\",\"file\":{\"filePath\":\"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/HoleModel.tsx\",\"content\":\"import { HoleDogleg } from \\\"./HoleDogleg\\\";\\nimport { HoleLoop } from \\\"./HoleLoop\\\";\\nimport { HoleLShape } from \\\"./HoleLShape\\\";\\nimport { HoleRamp } from \\\"./HoleRamp\\\";\\nimport { HoleStraight } from \\\"./HoleStraight\\\";\\nimport { HoleTunnel } from \\\"./HoleTunnel\\\";\\nimport { HoleWindmill } from \\\"./HoleWindmill\\\";\\nimport { TemplateHoleModel } from \\\"./TemplateHoleModel\\\";\\nimport { SURFACE_THICKNESS } from \\\"./shared\\\";\\n\\nexport type HoleModelProps = {\\n\\ttype: string;\\n\\twidth: number;\\n\\tlength: number;\\n\\tcolor: string;\\n\\ttemplateId?: string;\\n};\\n\\n/** Dispatches to per-type 3D model. Falls back to a simple box. */\\nexport function HoleModel({ type, width, length, color, templateId }: HoleModelProps) {\\n\\tif (templateId) {\\n\\t\\treturn <TemplateHoleModel templateId={templateId} />;\\n\\t}\\n\\tswitch (type) {\\n\\t\\tcase \\\"straight\\\":\\n\\t\\t\\treturn <Hole"}
+{"timestamp":"2026-02-21T18:19:39Z","type":"tool","tool":"Write","input":{"file_path":"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/HoleStraightTextured.tsx","content":"import { useEffect, useMemo } from \"react\";\nimport * as THREE from \"three\";\nimport { useStore } from \"../../../store\";\nimport {\n\tcreateBumperGeometry,\n\tcreateBumperProfile,\n} from \"../../../utils/bumperProfile\";\nimport {\n\tCUP_DEPTH,\n\tFLAG_PIN_HEIGHT,\n\tcreateCupGeometry,\n\tcreateFlagPinGeometry,\n\tcreateTeeGeometry,\n} from \"../../../utils/holeGeometry\";\nimport {\n\tBUMPER_HEIGHT,\n\tBUMPER_THICKNESS,\n\tCUP_RADIUS,\n\tSURFACE_THICKNESS,\n\tTEE_RADIUS,\n} from \"./shared\";\nimport { useTexturedMaterials } from \"./useTexturedMaterials\";\n\ntype Props = { width: number; length: number };\n\nconst BEVEL_RADIUS = 0.008;\nconst FLAG_PIN_RADIUS = 0.003;\nconst FLAG_COLOR = \"#FF1744\";\n\nexport function HoleStraightTextured({ width, length }: Props) {\n\tconst { felt, bumper, tee, cup } = useTexturedMaterials();\n\tconst view = useStore((s) => s.ui.view);\n\n\tconst halfW = width / 2;\n\tconst halfL = length / 2;\n\tconst laneW = width - BUMPER_THICKNESS * 2;\n\tconst laneL = length - BUMPER_THICKNESS * 2;\n\n\t// Create bumper profile and geometries\n\tconst bumperProfile = useMemo(\n\t\t() => createBumperProfile(BUMPER_HEIGHT, BUMPER_THICKNESS, BEVEL_RADIUS),\n\t\t[],\n\t);\n\n\tconst leftRightGeom = useMemo(\n\t\t() => createBumperGeometry(bumperProfile, length),\n\t\t[bumperProfile, length],\n\t);\n\n\tconst frontBackGeom = useMemo(\n\t\t() => createBumperGeometry(bumperProfile, laneW),\n\t\t[bumperProfile, laneW],\n\t);\n\n\tconst cupGeom = useMemo(() => createCupGeometry(CUP_RADIUS), []);\n\tconst teeGeom = useMemo(() => createTeeGeometry(TEE_RADIUS), []);\n\tconst flagPinGeom = useMemo(() => createFlagPinGeometry(), []);\n\n\t// Flag cloth geometry\n\tconst flagClothGeom = useMemo(\n\t\t() => new THREE.PlaneGeometry(0.03, 0.02),\n\t\t[],\n\t);\n\n\t// Flag pin material (white/metallic)\n\tconst flagPinMat = useMemo(\n\t\t() =>\n\t\t\tnew THREE.MeshStandardMaterial({\n\t\t\t\tcolor: \"#E0E0E0\",\n\t\t\t\tmetalness: 0.8,\n\t\t\t\troughness: 0.2,\n\t\t\t}),\n\t\t[],\n\t);\n\n\t// Flag cloth material\n\tconst flagClothMat = useMemo(\n\t\t() =>\n\t\t\tnew THREE.MeshStandardMaterial({\n\t\t\t\tcolor: FLAG_COLOR,\n\t\t\t\tside: THREE.DoubleSide,\n\t\t\t}),\n\t\t[],\n\t);\n\n\tuseEffect(() => {\n\t\treturn () => {\n\t\t\tleftRightGeom.dispose();\n\t\t\tfrontBackGeom.dispose();\n\t\t\tcupGeom.dispose();\n\t\t\tteeGeom.dispose();\n\t\t\tflagPinGeom.dispose();\n\t\t\tflagClothGeom.dispose();\n\t\t\tflagPinMat.dispose();\n\t\t\tflagClothMat.dispose();\n\t\t};\n\t}, [\n\t\tleftRightGeom,\n\t\tfrontBackGeom,\n\t\tcupGeom,\n\t\tteeGeom,\n\t\tflagPinGeom,\n\t\tflagClothGeom,\n\t\tflagPinMat,\n\t\tflagClothMat,\n\t]);\n\n\treturn (\n\t\t<group>\n\t\t\t{/* Green felt surface */}\n\t\t\t<mesh position={[0, SURFACE_THICKNESS / 2, 0]} material={felt}>\n\t\t\t\t<boxGeometry args={[laneW, SURFACE_THICKNESS, laneL]} />\n\t\t\t</mesh>\n\n\t\t\t{/* Left bumper — extrusion along Z, centered at -halfW */}\n\t\t\t<mesh\n\t\t\t\tcastShadow\n\t\t\t\tgeometry={leftRightGeom}\n\t\t\t\tmaterial={bumper}\n\t\t\t\tposition={[\n\t\t\t\t\t-halfW + BUMPER_THICKNESS / 2,\n\t\t\t\t\tSURFACE_THICKNESS,\n\t\t\t\t\t-halfL,\n\t\t\t\t]}\n\t\t\t/>\n\n\t\t\t{/* Right bumper */}\n\t\t\t<mesh\n\t\t\t\tcastShadow\n\t\t\t\tgeometry={leftRightGeom}\n\t\t\t\tmaterial={bumper}\n\t\t\t\tposition={[\n\t\t\t\t\thalfW - BUMPER_THICKNESS / 2,\n\t\t\t\t\tSURFACE_THICKNESS,\n\t\t\t\t\t-halfL,\n\t\t\t\t]}\n\t\t\t/>\n\n\t\t\t{/* Back bumper (-Z) — rotated 90° around Y */}\n\t\t\t<mesh\n\t\t\t\tcastShadow\n\t\t\t\tgeometry={frontBackGeom}\n\t\t\t\tmaterial={bumper}\n\t\t\t\tposition={[\n\t\t\t\t\t-laneW / 2,\n\t\t\t\t\tSURFACE_THICKNESS,\n\t\t\t\t\t-halfL + BUMPER_THICKNESS / 2,\n\t\t\t\t]}\n\t\t\t\trotation={[0, -Math.PI / 2, 0]}\n\t\t\t/>\n\n\t\t\t{/* Front bumper (+Z) */}\n\t\t\t<mesh\n\t\t\t\tcastShadow\n\t\t\t\tgeometry={frontBackGeom}\n\t\t\t\tmaterial={bumper}\n\t\t\t\tposition={[\n\t\t\t\t\t-laneW / 2,\n\t\t\t\t\tSURFACE_THICKNESS,\n\t\t\t\t\thalfL - BUMPER_THICKNESS / 2,\n\t\t\t\t]}\n\t\t\t\trotation={[0, -Math.PI / 2, 0]}\n\t\t\t/>\n\n\t\t\t{/* Recessed cup */}\n\t\t\t<mesh\n\t\t\t\tgeometry={cupGeom}\n\t\t\t\tmaterial={cup}\n\t\t\t\tposition={[\n\t\t\t\t\t0,\n\t\t\t\t\tSURFACE_THICKNESS - CUP_DEPTH / 2,\n\t\t\t\t\thalfL - 0.15,\n\t\t\t\t]}\n\t\t\t/>\n\n\t\t\t{/* Tee pad */}\n\t\t\t<mesh\n\t\t\t\tgeometry={teeGeom}\n\t\t\t\tmaterial={tee}\n\t\t\t\tposition={[\n\t\t\t\t\t0,\n\t\t\t\t\tSURFACE_THICKNESS + 0.0015,\n\t\t\t\t\t-halfL + 0.15,\n\t\t\t\t]}\n\t\t\t/>\n\n\t\t\t{/* Flag pin — only visible in 3D view */}\n\t\t\t{view !== \"top\" && (\n\t\t\t\t<group\n\t\t\t\t\tposition={[\n\t\t\t\t\t\t0,\n\t\t\t\t\t\tSURFACE_THICKNESS + FLAG_PIN_HEIGHT / 2,\n\t\t\t\t\t\thalfL - 0.15,\n\t\t\t\t\t]}\n\t\t\t\t>\n\t\t\t\t\t<mesh geometry={flagPinGeom} material={flagPinMat} />\n\t\t\t\t\t<mesh\n\t\t\t\t\t\tgeometry={flagClothGeom}\n\t\t\t\t\t\tmaterial={flagClothMat}\n\t\t\t\t\t\tposition={[\n\t\t\t\t\t\t\t0.015,\n\t\t\t\t\t\t\tFLAG_PIN_HEIGHT / 2 - 0.015,\n\t\t\t\t\t\t\t0,\n\t\t\t\t\t\t]}\n\t\t\t\t\t/>\n\t\t\t\t</group>\n\t\t\t)}\n\t\t</group>\n\t);\n}\n"},"response":"{\"type\":\"create\",\"filePath\":\"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/HoleStraightTextured.tsx\",\"content\":\"import { useEffect, useMemo } from \\\"react\\\";\\nimport * as THREE from \\\"three\\\";\\nimport { useStore } from \\\"../../../store\\\";\\nimport {\\n\\tcreateBumperGeometry,\\n\\tcreateBumperProfile,\\n} from \\\"../../../utils/bumperProfile\\\";\\nimport {\\n\\tCUP_DEPTH,\\n\\tFLAG_PIN_HEIGHT,\\n\\tcreateCupGeometry,\\n\\tcreateFlagPinGeometry,\\n\\tcreateTeeGeometry,\\n} from \\\"../../../utils/holeGeometry\\\";\\nimport {\\n\\tBUMPER_HEIGHT,\\n\\tBUMPER_THICKNESS,\\n\\tCUP_RADIUS,\\n\\tSURFACE_THICKNESS,\\n\\tTEE_RADIUS,\\n} from \\\"./shared\\\";\\nimport { useTexturedMaterials } from \\\"./useTexturedMaterials\\\";\\n\\ntype Props = { width: number; length: number };\\n\\nconst BEVEL_RADIUS = 0.008;\\nconst FLAG_PIN_RADIUS = 0.003;\\nconst FLAG_COLOR = \\\"#FF1744\\\";\\n\\nexport function HoleStraightTextured({ width, length }: Props) {\\n\\tconst { felt, bumper, tee, cup } = useTexturedMaterials();\\n\\tconst view = u"}
+{"timestamp":"2026-02-21T18:19:53Z","type":"tool","tool":"Write","input":{"file_path":"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/HoleModel.tsx","content":"import { Component, Suspense, type ReactNode } from \"react\";\nimport { useStore } from \"../../../store\";\nimport { HoleDogleg } from \"./HoleDogleg\";\nimport { HoleLoop } from \"./HoleLoop\";\nimport { HoleLShape } from \"./HoleLShape\";\nimport { HoleRamp } from \"./HoleRamp\";\nimport { HoleStraight } from \"./HoleStraight\";\nimport { HoleStraightTextured } from \"./HoleStraightTextured\";\nimport { HoleTunnel } from \"./HoleTunnel\";\nimport { HoleWindmill } from \"./HoleWindmill\";\nimport { TemplateHoleModel } from \"./TemplateHoleModel\";\nimport { SURFACE_THICKNESS } from \"./shared\";\n\nexport type HoleModelProps = {\n\ttype: string;\n\twidth: number;\n\tlength: number;\n\tcolor: string;\n\ttemplateId?: string;\n};\n\ntype HoleSwitchProps = {\n\ttype: string;\n\twidth: number;\n\tlength: number;\n\tcolor: string;\n};\n\n/** Renders flat-color hole models (existing geometry) */\nfunction FlatHoleSwitch({ type, width, length, color }: HoleSwitchProps) {\n\tswitch (type) {\n\t\tcase \"straight\":\n\t\t\treturn <HoleStraight width={width} length={length} />;\n\t\tcase \"l-shape\":\n\t\t\treturn <HoleLShape width={width} length={length} />;\n\t\tcase \"dogleg\":\n\t\t\treturn <HoleDogleg width={width} length={length} />;\n\t\tcase \"ramp\":\n\t\t\treturn <HoleRamp width={width} length={length} color={color} />;\n\t\tcase \"loop\":\n\t\t\treturn <HoleLoop width={width} length={length} color={color} />;\n\t\tcase \"windmill\":\n\t\t\treturn <HoleWindmill width={width} length={length} color={color} />;\n\t\tcase \"tunnel\":\n\t\t\treturn <HoleTunnel width={width} length={length} color={color} />;\n\t\tdefault:\n\t\t\treturn (\n\t\t\t\t<mesh position={[0, SURFACE_THICKNESS / 2, 0]}>\n\t\t\t\t\t<boxGeometry args={[width, SURFACE_THICKNESS, length]} />\n\t\t\t\t\t<meshStandardMaterial color={color} />\n\t\t\t\t</mesh>\n\t\t\t);\n\t}\n}\n\n/** Renders textured hole models where available, falls back to flat */\nfunction TexturedHoleSwitch({ type, width, length, color }: HoleSwitchProps) {\n\tswitch (type) {\n\t\tcase \"straight\":\n\t\t\treturn <HoleStraightTextured width={width} length={length} />;\n\t\t// Other types will get textured variants in Section 02+\n\t\tdefault:\n\t\t\treturn (\n\t\t\t\t<FlatHoleSwitch\n\t\t\t\t\ttype={type}\n\t\t\t\t\twidth={width}\n\t\t\t\t\tlength={length}\n\t\t\t\t\tcolor={color}\n\t\t\t\t/>\n\t\t\t);\n\t}\n}\n\n/** Error boundary for texture loading failures */\nclass TextureErrorBoundary extends Component<\n\t{ fallback: ReactNode; children: ReactNode },\n\t{ hasError: boolean }\n> {\n\tstate = { hasError: false };\n\n\tstatic getDerivedStateFromError() {\n\t\treturn { hasError: true };\n\t}\n\n\trender() {\n\t\tif (this.state.hasError) {\n\t\t\treturn this.props.fallback;\n\t\t}\n\t\treturn this.props.children;\n\t}\n}\n\n/** Dispatches to per-type 3D model with GPU tier texture gating. */\nexport function HoleModel({\n\ttype,\n\twidth,\n\tlength,\n\tcolor,\n\ttemplateId,\n}: HoleModelProps) {\n\tconst gpuTier = useStore((s) => s.ui.gpuTier);\n\n\tif (templateId) {\n\t\treturn <TemplateHoleModel templateId={templateId} />;\n\t}\n\n\tif (gpuTier !== \"low\") {\n\t\tconst flatFallback = (\n\t\t\t<FlatHoleSwitch\n\t\t\t\ttype={type}\n\t\t\t\twidth={width}\n\t\t\t\tlength={length}\n\t\t\t\tcolor={color}\n\t\t\t/>\n\t\t);\n\t\treturn (\n\t\t\t<TextureErrorBoundary fallback={flatFallback}>\n\t\t\t\t<Suspense fallback={flatFallback}>\n\t\t\t\t\t<TexturedHoleSwitch\n\t\t\t\t\t\ttype={type}\n\t\t\t\t\t\twidth={width}\n\t\t\t\t\t\tlength={length}\n\t\t\t\t\t\tcolor={color}\n\t\t\t\t\t/>\n\t\t\t\t</Suspense>\n\t\t\t</TextureErrorBoundary>\n\t\t);\n\t}\n\n\treturn (\n\t\t<FlatHoleSwitch\n\t\t\ttype={type}\n\t\t\twidth={width}\n\t\t\tlength={length}\n\t\t\tcolor={color}\n\t\t/>\n\t);\n}\n"},"response":"{\"type\":\"update\",\"filePath\":\"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/HoleModel.tsx\",\"content\":\"import { Component, Suspense, type ReactNode } from \\\"react\\\";\\nimport { useStore } from \\\"../../../store\\\";\\nimport { HoleDogleg } from \\\"./HoleDogleg\\\";\\nimport { HoleLoop } from \\\"./HoleLoop\\\";\\nimport { HoleLShape } from \\\"./HoleLShape\\\";\\nimport { HoleRamp } from \\\"./HoleRamp\\\";\\nimport { HoleStraight } from \\\"./HoleStraight\\\";\\nimport { HoleStraightTextured } from \\\"./HoleStraightTextured\\\";\\nimport { HoleTunnel } from \\\"./HoleTunnel\\\";\\nimport { HoleWindmill } from \\\"./HoleWindmill\\\";\\nimport { TemplateHoleModel } from \\\"./TemplateHoleModel\\\";\\nimport { SURFACE_THICKNESS } from \\\"./shared\\\";\\n\\nexport type HoleModelProps = {\\n\\ttype: string;\\n\\twidth: number;\\n\\tlength: number;\\n\\tcolor: string;\\n\\ttemplateId?: string;\\n};\\n\\ntype HoleSwitchProps = {\\n\\ttype: string;\\n\\twidth: number;\\n\\tlength: number;\\n\\tcolor: string;\\n};\\n\\n/** Renders flat-color hole mo"}
+{"timestamp":"2026-02-21T18:20:02Z","type":"tool","tool":"Bash","input":{"command":"export PATH=\"/home/ben/.local/share/fnm:$PATH\" && eval \"$(fnm env)\" && npx tsc --noEmit 2>&1 | head -40","timeout":60000,"description":"TypeScript type check"},"response":"{\"stdout\":\"\",\"stderr\":\"\",\"interrupted\":false,\"isImage\":false,\"noOutputExpected\":false}"}
+{"timestamp":"2026-02-21T18:20:41Z","type":"tool","tool":"Bash","input":{"command":"export PATH=\"/home/ben/.local/share/fnm:$PATH\" && eval \"$(fnm env)\" && npx vitest run 2>&1 | tail -40","timeout":120000,"description":"Run full test suite"},"response":"{\"stdout\":\"\\u001b[90mstderr\\u001b[2m | tests/store/builderSlice.test.ts\\u001b[2m > \\u001b[22m\\u001b[2mdraft property setters\\u001b[2m > \\u001b[22m\\u001b[2msetDraftName updates name without pushing undo\\n\\u001b[22m\\u001b[39m[zustand persist middleware] Unable to update item 'golf-planner-state', the given storage is currently unavailable.\\n[zustand persist middleware] Unable to update item 'golf-planner-state', the given storage is currently unavailable.\\n\\n\\u001b[90mstderr\\u001b[2m | tests/store/builderSlice.test.ts\\u001b[2m > \\u001b[22m\\u001b[2mdraft property setters\\u001b[2m > \\u001b[22m\\u001b[2msetDraftPar updates defaultPar and pushes undo\\n\\u001b[22m\\u001b[39m[zustand persist middleware] Unable to update item 'golf-planner-state', the given storage is currently unavailable.\\n[zustand persist middleware] Unable to update item 'golf-planner-state', the given storage is currently unavailable.\\n\\n\\u001b[90mstderr\\u001b[2m | tests/store/builderSlice.test.ts\\u001b[2m > \\u001b[22m\\u001b["}
+{"timestamp":"2026-02-21T18:20:49Z","type":"tool","tool":"Bash","input":{"command":"export PATH=\"/home/ben/.local/share/fnm:$PATH\" && eval \"$(fnm env)\" && npm run check 2>&1 | tail -20","timeout":30000,"description":"Run Biome lint/format check"},"response":"{\"stdout\":\"     23  23 │   \\treturn (\\n     24  24 │   \\t\\t<div className=\\\"flex flex-col gap-2\\\">\\n     25     │ - → → → <p·className=\\\"text-xs·font-medium·text-text-secondary·uppercase\\\">Hole·Types</p>\\n         25 │ + → → → <p·className=\\\"text-xs·font-medium·text-text-secondary·uppercase\\\">\\n         26 │ + → → → → Hole·Types\\n         27 │ + → → → </p>\\n     26  28 │   \\t\\t\\t{HOLE_TYPES.map((ht) => (\\n     27  29 │   \\t\\t\\t\\t<button\\n  \\n\\nThe number of diagnostics exceeds the limit allowed. Use --max-diagnostics to increase it.\\nDiagnostics not shown: 49.\\nChecked 148 files in 3s. No fixes applied.\\nFound 59 errors.\\nFound 10 warnings.\\ncheck ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n\\n  × S"}
+{"timestamp":"2026-02-21T18:21:02Z","type":"tool","tool":"Bash","input":{"command":"export PATH=\"/home/ben/.local/share/fnm:$PATH\" && eval \"$(fnm env)\" && npx biome check --write src/utils/bumperProfile.ts src/utils/holeGeometry.ts src/components/three/holes/useTexturedMaterials.ts src/components/three/holes/HoleStraightTextured.tsx src/components/three/holes/HoleModel.tsx tests/utils/bumperProfile.test.ts tests/utils/holeGeometry.test.ts tests/hooks/texturedMaterials.test.ts 2>&1","timeout":15000,"description":"Auto-fix Biome issues in new files"},"response":"{\"stdout\":\"src/components/three/holes/HoleStraightTextured.tsx:27:7 lint/correctness/noUnusedVariables  FIXABLE  ━━━━━━━━━━\\n\\n  ! This variable FLAG_PIN_RADIUS is unused.\\n  \\n    26 │ const BEVEL_RADIUS = 0.008;\\n  > 27 │ const FLAG_PIN_RADIUS = 0.003;\\n       │       ^^^^^^^^^^^^^^^\\n    28 │ const FLAG_COLOR = \\\"#FF1744\\\";\\n    29 │ \\n  \\n  i Unused variables are often the result of typos, incomplete refactors, or other sources of bugs.\\n  \\n  i Unsafe fix: If this is intentional, prepend FLAG_PIN_RADIUS with an underscore.\\n  \\n     25  25 │   \\n     26  26 │   const BEVEL_RADIUS = 0.008;\\n     27     │ - const·FLAG_PIN_RADIUS·=·0.003;\\n         27 │ + const·_FLAG_PIN_RADIUS·=·0.003;\\n     28  28 │   const FLAG_COLOR = \\\"#FF1744\\\";\\n     29  29 │   \\n  \\n\\ntests/utils/holeGeometry.test.ts:20:14 lint/style/noNonNullAssertion ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n\\n  ! Forbidden "}
+{"timestamp":"2026-02-21T18:21:10Z","type":"tool","tool":"Edit","input":{"file_path":"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/HoleStraightTextured.tsx","old_string":"const BEVEL_RADIUS = 0.008;\nconst FLAG_PIN_RADIUS = 0.003;\nconst FLAG_COLOR = \"#FF1744\";","new_string":"const BEVEL_RADIUS = 0.008;\nconst FLAG_COLOR = \"#FF1744\";","replace_all":false},"response":"{\"filePath\":\"/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/HoleStraightTextured.tsx\",\"oldString\":\"const BEVEL_RADIUS = 0.008;\\nconst FLAG_PIN_RADIUS = 0.003;\\nconst FLAG_COLOR = \\\"#FF1744\\\";\",\"newString\":\"const BEVEL_RADIUS = 0.008;\\nconst FLAG_COLOR = \\\"#FF1744\\\";\",\"originalFile\":\"import { useEffect, useMemo } from \\\"react\\\";\\nimport * as THREE from \\\"three\\\";\\nimport { useStore } from \\\"../../../store\\\";\\nimport {\\n\\tcreateBumperGeometry,\\n\\tcreateBumperProfile,\\n} from \\\"../../../utils/bumperProfile\\\";\\nimport {\\n\\tCUP_DEPTH,\\n\\tcreateCupGeometry,\\n\\tcreateFlagPinGeometry,\\n\\tcreateTeeGeometry,\\n\\tFLAG_PIN_HEIGHT,\\n} from \\\"../../../utils/holeGeometry\\\";\\nimport {\\n\\tBUMPER_HEIGHT,\\n\\tBUMPER_THICKNESS,\\n\\tCUP_RADIUS,\\n\\tSURFACE_THICKNESS,\\n\\tTEE_RADIUS,\\n} from \\\"./shared\\\";\\nimport { useTexturedMaterials } from \\\"./useTexturedMaterials\\\";\\n\\ntype Props = { width: number; length: number };\\n\\nconst BEVEL_RADIUS = 0.008;\\nconst FLAG_PIN_RADIUS = 0.003;\\nconst FL"}
+{"timestamp":"2026-02-21T18:21:11Z","type":"tool","tool":"Read","input":{"file_path":"/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/utils/holeGeometry.test.ts"},"response":"{\"type\":\"text\",\"file\":{\"filePath\":\"/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/utils/holeGeometry.test.ts\",\"content\":\"import { describe, expect, it } from \\\"vitest\\\";\\nimport {\\n\\tCUP_DEPTH,\\n\\tcreateCupGeometry,\\n\\tcreateFlagPinGeometry,\\n\\tcreateTeeGeometry,\\n\\tFLAG_PIN_HEIGHT,\\n} from \\\"../../src/utils/holeGeometry\\\";\\n\\ndescribe(\\\"createCupGeometry\\\", () => {\\n\\tit(\\\"returns a CylinderGeometry for the recessed cup\\\", () => {\\n\\t\\tconst geom = createCupGeometry(0.054);\\n\\t\\texpect(geom).toBeDefined();\\n\\t\\texpect(geom.attributes.position).toBeDefined();\\n\\t});\\n\\n\\tit(\\\"cup has correct radius matching CUP_RADIUS\\\", () => {\\n\\t\\tconst geom = createCupGeometry(0.054);\\n\\t\\tgeom.computeBoundingBox();\\n\\t\\tconst bb = geom.boundingBox!;\\n\\t\\tconst diameter = bb.max.x - bb.min.x;\\n\\t\\texpect(diameter).toBeCloseTo(0.108, 2);\\n\\t});\\n\\n\\tit(\\\"cup has visible depth (height > 0)\\\", () => {\\n\\t\\texpect(CUP_DEPTH).toBeGreaterThan(0);\\n\\t\\texpect(CUP_DEPTH).toBeLessThanOrEqual(0.03);\\n\\t});\\n"}
+{"timestamp":"2026-02-21T18:21:16Z","type":"tool","tool":"Edit","input":{"file_path":"/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/utils/holeGeometry.test.ts","old_string":"\t\tconst bb = geom.boundingBox!;\n\t\tconst diameter = bb.max.x - bb.min.x;\n\t\texpect(diameter).toBeCloseTo(0.108, 2);","new_string":"\t\tconst bb = geom.boundingBox;\n\t\texpect(bb).not.toBeNull();\n\t\tconst diameter = bb!.max.x - bb!.min.x;\n\t\texpect(diameter).toBeCloseTo(0.108, 2);","replace_all":false},"response":"{\"filePath\":\"/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/utils/holeGeometry.test.ts\",\"oldString\":\"\\t\\tconst bb = geom.boundingBox!;\\n\\t\\tconst diameter = bb.max.x - bb.min.x;\\n\\t\\texpect(diameter).toBeCloseTo(0.108, 2);\",\"newString\":\"\\t\\tconst bb = geom.boundingBox;\\n\\t\\texpect(bb).not.toBeNull();\\n\\t\\tconst diameter = bb!.max.x - bb!.min.x;\\n\\t\\texpect(diameter).toBeCloseTo(0.108, 2);\",\"originalFile\":\"import { describe, expect, it } from \\\"vitest\\\";\\nimport {\\n\\tCUP_DEPTH,\\n\\tcreateCupGeometry,\\n\\tcreateFlagPinGeometry,\\n\\tcreateTeeGeometry,\\n\\tFLAG_PIN_HEIGHT,\\n} from \\\"../../src/utils/holeGeometry\\\";\\n\\ndescribe(\\\"createCupGeometry\\\", () => {\\n\\tit(\\\"returns a CylinderGeometry for the recessed cup\\\", () => {\\n\\t\\tconst geom = createCupGeometry(0.054);\\n\\t\\texpect(geom).toBeDefined();\\n\\t\\texpect(geom.attributes.position).toBeDefined();\\n\\t});\\n\\n\\tit(\\\"cup has correct radius matching CUP_RADIUS\\\", () => {\\n\\t\\tconst geom = createCupGeometry(0.054);\\n\\t\\tgeom.computeBoundingBox();"}
+{"timestamp":"2026-02-21T18:21:20Z","type":"tool","tool":"Edit","input":{"file_path":"/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/utils/holeGeometry.test.ts","old_string":"\t\tconst bb = geom.boundingBox!;\n\t\tconst diameter = bb.max.x - bb.min.x;\n\t\texpect(diameter).toBeCloseTo(0.06, 2);","new_string":"\t\tconst bb = geom.boundingBox;\n\t\texpect(bb).not.toBeNull();\n\t\tconst diameter = bb!.max.x - bb!.min.x;\n\t\texpect(diameter).toBeCloseTo(0.06, 2);","replace_all":false},"response":"{\"filePath\":\"/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/utils/holeGeometry.test.ts\",\"oldString\":\"\\t\\tconst bb = geom.boundingBox!;\\n\\t\\tconst diameter = bb.max.x - bb.min.x;\\n\\t\\texpect(diameter).toBeCloseTo(0.06, 2);\",\"newString\":\"\\t\\tconst bb = geom.boundingBox;\\n\\t\\texpect(bb).not.toBeNull();\\n\\t\\tconst diameter = bb!.max.x - bb!.min.x;\\n\\t\\texpect(diameter).toBeCloseTo(0.06, 2);\",\"originalFile\":\"import { describe, expect, it } from \\\"vitest\\\";\\nimport {\\n\\tCUP_DEPTH,\\n\\tcreateCupGeometry,\\n\\tcreateFlagPinGeometry,\\n\\tcreateTeeGeometry,\\n\\tFLAG_PIN_HEIGHT,\\n} from \\\"../../src/utils/holeGeometry\\\";\\n\\ndescribe(\\\"createCupGeometry\\\", () => {\\n\\tit(\\\"returns a CylinderGeometry for the recessed cup\\\", () => {\\n\\t\\tconst geom = createCupGeometry(0.054);\\n\\t\\texpect(geom).toBeDefined();\\n\\t\\texpect(geom.attributes.position).toBeDefined();\\n\\t});\\n\\n\\tit(\\\"cup has correct radius matching CUP_RADIUS\\\", () => {\\n\\t\\tconst geom = createCupGeometry(0.054);\\n\\t\\tgeom.computeBoundingBox();\\n"}
+{"timestamp":"2026-02-21T18:21:24Z","type":"tool","tool":"Edit","input":{"file_path":"/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/utils/holeGeometry.test.ts","old_string":"\t\tconst bb = geom.boundingBox!;\n\t\tconst height = bb.max.y - bb.min.y;","new_string":"\t\tconst bb = geom.boundingBox;\n\t\texpect(bb).not.toBeNull();\n\t\tconst height = bb!.max.y - bb!.min.y;","replace_all":false},"response":"{\"filePath\":\"/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/utils/holeGeometry.test.ts\",\"oldString\":\"\\t\\tconst bb = geom.boundingBox!;\\n\\t\\tconst height = bb.max.y - bb.min.y;\",\"newString\":\"\\t\\tconst bb = geom.boundingBox;\\n\\t\\texpect(bb).not.toBeNull();\\n\\t\\tconst height = bb!.max.y - bb!.min.y;\",\"originalFile\":\"import { describe, expect, it } from \\\"vitest\\\";\\nimport {\\n\\tCUP_DEPTH,\\n\\tcreateCupGeometry,\\n\\tcreateFlagPinGeometry,\\n\\tcreateTeeGeometry,\\n\\tFLAG_PIN_HEIGHT,\\n} from \\\"../../src/utils/holeGeometry\\\";\\n\\ndescribe(\\\"createCupGeometry\\\", () => {\\n\\tit(\\\"returns a CylinderGeometry for the recessed cup\\\", () => {\\n\\t\\tconst geom = createCupGeometry(0.054);\\n\\t\\texpect(geom).toBeDefined();\\n\\t\\texpect(geom.attributes.position).toBeDefined();\\n\\t});\\n\\n\\tit(\\\"cup has correct radius matching CUP_RADIUS\\\", () => {\\n\\t\\tconst geom = createCupGeometry(0.054);\\n\\t\\tgeom.computeBoundingBox();\\n\\t\\tconst bb = geom.boundingBox;\\n\\t\\texpect(bb).not.toBeNull();\\n\\t\\tconst diameter = bb!.m"}
+{"timestamp":"2026-02-21T18:21:31Z","type":"tool","tool":"Bash","input":{"command":"export PATH=\"/home/ben/.local/share/fnm:$PATH\" && eval \"$(fnm env)\" && npx biome check src/utils/bumperProfile.ts src/utils/holeGeometry.ts src/components/three/holes/useTexturedMaterials.ts src/components/three/holes/HoleStraightTextured.tsx src/components/three/holes/HoleModel.tsx tests/utils/bumperProfile.test.ts tests/utils/holeGeometry.test.ts tests/hooks/texturedMaterials.test.ts 2>&1","timeout":15000,"description":"Verify Biome passes on all new files"},"response":"{\"stdout\":\"tests/utils/holeGeometry.test.ts:22:20 lint/style/noNonNullAssertion  FIXABLE  ━━━━━━━━━━━━━━━━━━━━━\\n\\n  ! Forbidden non-null assertion.\\n  \\n    20 │ \\t\\tconst bb = geom.boundingBox;\\n    21 │ \\t\\texpect(bb).not.toBeNull();\\n  > 22 │ \\t\\tconst diameter = bb!.max.x - bb!.min.x;\\n       │ \\t\\t                 ^^^\\n    23 │ \\t\\texpect(diameter).toBeCloseTo(0.108, 2);\\n    24 │ \\t});\\n  \\n  i Unsafe fix: Replace with optional chain operator ?. This operator includes runtime checks, so it is safer than the compile-only non-null assertion operator\\n  \\n    20 20 │   \\t\\tconst bb = geom.boundingBox;\\n    21 21 │   \\t\\texpect(bb).not.toBeNull();\\n    22    │ - → → const·diameter·=·bb!.max.x·-·bb!.min.x;\\n       22 │ + → → const·diameter·=·bb?.max.x·-·bb!.min.x;\\n    23 23 │   \\t\\texpect(diameter).toBeCloseTo(0.108, 2);\\n    24 24 │   \\t});\\n  \\n\\ntests/utils/holeGeometry.test.ts:22:32 lint/style/no"}
+{"timestamp":"2026-02-21T18:21:37Z","type":"tool","tool":"Read","input":{"file_path":"/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/utils/holeGeometry.test.ts"},"response":"{\"type\":\"text\",\"file\":{\"filePath\":\"/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/utils/holeGeometry.test.ts\",\"content\":\"import { describe, expect, it } from \\\"vitest\\\";\\nimport {\\n\\tCUP_DEPTH,\\n\\tcreateCupGeometry,\\n\\tcreateFlagPinGeometry,\\n\\tcreateTeeGeometry,\\n\\tFLAG_PIN_HEIGHT,\\n} from \\\"../../src/utils/holeGeometry\\\";\\n\\ndescribe(\\\"createCupGeometry\\\", () => {\\n\\tit(\\\"returns a CylinderGeometry for the recessed cup\\\", () => {\\n\\t\\tconst geom = createCupGeometry(0.054);\\n\\t\\texpect(geom).toBeDefined();\\n\\t\\texpect(geom.attributes.position).toBeDefined();\\n\\t});\\n\\n\\tit(\\\"cup has correct radius matching CUP_RADIUS\\\", () => {\\n\\t\\tconst geom = createCupGeometry(0.054);\\n\\t\\tgeom.computeBoundingBox();\\n\\t\\tconst bb = geom.boundingBox;\\n\\t\\texpect(bb).not.toBeNull();\\n\\t\\tconst diameter = bb!.max.x - bb!.min.x;\\n\\t\\texpect(diameter).toBeCloseTo(0.108, 2);\\n\\t});\\n\\n\\tit(\\\"cup has visible depth (height > 0)\\\", () => {\\n\\t\\texpect(CUP_DEPTH).toBeGreaterThan(0);\\n\\t\\texpect(CUP_DEPTH).to"}
+{"timestamp":"2026-02-21T18:21:49Z","type":"tool","tool":"Write","input":{"file_path":"/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/utils/holeGeometry.test.ts","content":"import { describe, expect, it } from \"vitest\";\nimport {\n\tCUP_DEPTH,\n\tcreateCupGeometry,\n\tcreateFlagPinGeometry,\n\tcreateTeeGeometry,\n\tFLAG_PIN_HEIGHT,\n} from \"../../src/utils/holeGeometry\";\n\nfunction getBoundingBox(geom: { computeBoundingBox(): void; boundingBox: unknown }) {\n\tgeom.computeBoundingBox();\n\tconst bb = geom.boundingBox as {\n\t\tmax: { x: number; y: number; z: number };\n\t\tmin: { x: number; y: number; z: number };\n\t};\n\treturn bb;\n}\n\ndescribe(\"createCupGeometry\", () => {\n\tit(\"returns a CylinderGeometry for the recessed cup\", () => {\n\t\tconst geom = createCupGeometry(0.054);\n\t\texpect(geom).toBeDefined();\n\t\texpect(geom.attributes.position).toBeDefined();\n\t});\n\n\tit(\"cup has correct radius matching CUP_RADIUS\", () => {\n\t\tconst geom = createCupGeometry(0.054);\n\t\tconst bb = getBoundingBox(geom);\n\t\tconst diameter = bb.max.x - bb.min.x;\n\t\texpect(diameter).toBeCloseTo(0.108, 2);\n\t});\n\n\tit(\"cup has visible depth (height > 0)\", () => {\n\t\texpect(CUP_DEPTH).toBeGreaterThan(0);\n\t\texpect(CUP_DEPTH).toBeLessThanOrEqual(0.03);\n\t});\n});\n\ndescribe(\"createTeeGeometry\", () => {\n\tit(\"returns a CylinderGeometry for the raised tee pad\", () => {\n\t\tconst geom = createTeeGeometry(0.03);\n\t\texpect(geom).toBeDefined();\n\t\texpect(geom.attributes.position).toBeDefined();\n\t});\n\n\tit(\"tee has correct radius matching TEE_RADIUS\", () => {\n\t\tconst geom = createTeeGeometry(0.03);\n\t\tconst bb = getBoundingBox(geom);\n\t\tconst diameter = bb.max.x - bb.min.x;\n\t\texpect(diameter).toBeCloseTo(0.06, 2);\n\t});\n\n\tit(\"tee has visible height (2-3mm raised)\", () => {\n\t\tconst geom = createTeeGeometry(0.03);\n\t\tconst bb = getBoundingBox(geom);\n\t\tconst height = bb.max.y - bb.min.y;\n\t\texpect(height).toBeGreaterThanOrEqual(0.002);\n\t\texpect(height).toBeLessThanOrEqual(0.005);\n\t});\n});\n\ndescribe(\"createFlagPinGeometry\", () => {\n\tit(\"returns a thin cylinder geometry for the flag pin shaft\", () => {\n\t\tconst geom = createFlagPinGeometry();\n\t\texpect(geom).toBeDefined();\n\t\texpect(geom.attributes.position).toBeDefined();\n\t});\n\n\tit(\"flag pin has reasonable height\", () => {\n\t\texpect(FLAG_PIN_HEIGHT).toBeGreaterThanOrEqual(0.1);\n\t\texpect(FLAG_PIN_HEIGHT).toBeLessThanOrEqual(0.3);\n\t});\n});\n"},"response":"{\"type\":\"update\",\"filePath\":\"/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/utils/holeGeometry.test.ts\",\"content\":\"import { describe, expect, it } from \\\"vitest\\\";\\nimport {\\n\\tCUP_DEPTH,\\n\\tcreateCupGeometry,\\n\\tcreateFlagPinGeometry,\\n\\tcreateTeeGeometry,\\n\\tFLAG_PIN_HEIGHT,\\n} from \\\"../../src/utils/holeGeometry\\\";\\n\\nfunction getBoundingBox(geom: { computeBoundingBox(): void; boundingBox: unknown }) {\\n\\tgeom.computeBoundingBox();\\n\\tconst bb = geom.boundingBox as {\\n\\t\\tmax: { x: number; y: number; z: number };\\n\\t\\tmin: { x: number; y: number; z: number };\\n\\t};\\n\\treturn bb;\\n}\\n\\ndescribe(\\\"createCupGeometry\\\", () => {\\n\\tit(\\\"returns a CylinderGeometry for the recessed cup\\\", () => {\\n\\t\\tconst geom = createCupGeometry(0.054);\\n\\t\\texpect(geom).toBeDefined();\\n\\t\\texpect(geom.attributes.position).toBeDefined();\\n\\t});\\n\\n\\tit(\\\"cup has correct radius matching CUP_RADIUS\\\", () => {\\n\\t\\tconst geom = createCupGeometry(0.054);\\n\\t\\tconst bb = getBoundingBox(geom);\\n\\t\\tconst diam"}
+{"timestamp":"2026-02-21T18:22:04Z","type":"tool","tool":"Bash","input":{"command":"export PATH=\"/home/ben/.local/share/fnm:$PATH\" && eval \"$(fnm env)\" && npx biome check --write tests/utils/holeGeometry.test.ts 2>&1 && npx biome check tests/utils/holeGeometry.test.ts 2>&1","timeout":10000,"description":"Format and verify holeGeometry test"},"response":"{\"stdout\":\"Checked 1 file in 231ms. Fixed 1 file.\\nChecked 1 file in 232ms. No fixes applied.\",\"stderr\":\"\",\"interrupted\":false,\"isImage\":false,\"noOutputExpected\":false}"}
+{"timestamp":"2026-02-21T18:22:40Z","type":"tool","tool":"Bash","input":{"command":"export PATH=\"/home/ben/.local/share/fnm:$PATH\" && eval \"$(fnm env)\" && npx vitest run 2>&1 | tail -15","timeout":120000,"description":"Final full test suite run"},"response":"{\"stdout\":\" \\u001b[32m✓\\u001b[39m tests/utils/floorPlanExport.test.ts \\u001b[2m(\\u001b[22m\\u001b[2m6 tests\\u001b[22m\\u001b[2m)\\u001b[22m\\u001b[32m 3\\u001b[2mms\\u001b[22m\\u001b[39m\\n \\u001b[32m✓\\u001b[39m tests/hooks/sunPosition.test.ts \\u001b[2m(\\u001b[22m\\u001b[2m7 tests\\u001b[22m\\u001b[2m)\\u001b[22m\\u001b[32m 5\\u001b[2mms\\u001b[22m\\u001b[39m\\n \\u001b[32m✓\\u001b[39m tests/utils/financial.test.ts \\u001b[2m(\\u001b[22m\\u001b[2m4 tests\\u001b[22m\\u001b[2m)\\u001b[22m\\u001b[32m 4\\u001b[2mms\\u001b[22m\\u001b[39m\\n \\u001b[32m✓\\u001b[39m tests/materialPresets.test.ts \\u001b[2m(\\u001b[22m\\u001b[2m1 test\\u001b[22m\\u001b[2m)\\u001b[22m\\u001b[32m 2\\u001b[2mms\\u001b[22m\\u001b[39m\\n \\u001b[32m✓\\u001b[39m tests/hooks/keyboardControls.test.ts \\u001b[2m(\\u001b[22m\\u001b[2m5 tests\\u001b[22m\\u001b[2m)\\u001b[22m\\u001b[32m 2\\u001b[2mms\\u001b[22m\\u001b[39m\\n \\u001b[32m✓\\u001b[39m tests/utils/snap.test.ts \\u001b[2m(\\u001b[22m\\u001b[2m4 tests\\u001b[22m\\u001b[2m)\\u001b[22m\\u001b[32m 3\\u001b[2mms\\u001b"}
+{"timestamp":"2026-02-21T18:22:44Z","type":"tool","tool":"TaskUpdate","input":{"taskId":"7","status":"completed"},"response":"{\"success\":true,\"taskId\":\"7\",\"updatedFields\":[\"status\"],\"statusChange\":{\"from\":\"in_progress\",\"to\":\"completed\"}}"}
diff --git a/public/textures/felt/color.jpg b/public/textures/felt/color.jpg
new file mode 100644
index 0000000..19d1e3e
Binary files /dev/null and b/public/textures/felt/color.jpg differ
diff --git a/public/textures/felt/normal.jpg b/public/textures/felt/normal.jpg
new file mode 100644
index 0000000..77622a6
Binary files /dev/null and b/public/textures/felt/normal.jpg differ
diff --git a/public/textures/felt/roughness.jpg b/public/textures/felt/roughness.jpg
new file mode 100644
index 0000000..5a81b8c
Binary files /dev/null and b/public/textures/felt/roughness.jpg differ
diff --git a/public/textures/rubber/normal.jpg b/public/textures/rubber/normal.jpg
new file mode 100644
index 0000000..74c00e5
Binary files /dev/null and b/public/textures/rubber/normal.jpg differ
diff --git a/public/textures/rubber/roughness.jpg b/public/textures/rubber/roughness.jpg
new file mode 100644
index 0000000..7ff20e4
Binary files /dev/null and b/public/textures/rubber/roughness.jpg differ
diff --git a/public/textures/wood/color.jpg b/public/textures/wood/color.jpg
new file mode 100644
index 0000000..b2e77cb
Binary files /dev/null and b/public/textures/wood/color.jpg differ
diff --git a/public/textures/wood/normal.jpg b/public/textures/wood/normal.jpg
new file mode 100644
index 0000000..74d3684
Binary files /dev/null and b/public/textures/wood/normal.jpg differ
diff --git a/public/textures/wood/roughness.jpg b/public/textures/wood/roughness.jpg
new file mode 100644
index 0000000..87800d4
Binary files /dev/null and b/public/textures/wood/roughness.jpg differ
diff --git a/src/components/three/holes/HoleModel.tsx b/src/components/three/holes/HoleModel.tsx
index c3ceff9..af23ff8 100644
--- a/src/components/three/holes/HoleModel.tsx
+++ b/src/components/three/holes/HoleModel.tsx
@@ -1,12 +1,15 @@
+import { Component, type ReactNode, Suspense } from "react";
+import { useStore } from "../../../store";
 import { HoleDogleg } from "./HoleDogleg";
 import { HoleLoop } from "./HoleLoop";
 import { HoleLShape } from "./HoleLShape";
 import { HoleRamp } from "./HoleRamp";
 import { HoleStraight } from "./HoleStraight";
+import { HoleStraightTextured } from "./HoleStraightTextured";
 import { HoleTunnel } from "./HoleTunnel";
 import { HoleWindmill } from "./HoleWindmill";
-import { TemplateHoleModel } from "./TemplateHoleModel";
 import { SURFACE_THICKNESS } from "./shared";
+import { TemplateHoleModel } from "./TemplateHoleModel";
 
 export type HoleModelProps = {
 	type: string;
@@ -16,11 +19,15 @@ export type HoleModelProps = {
 	templateId?: string;
 };
 
-/** Dispatches to per-type 3D model. Falls back to a simple box. */
-export function HoleModel({ type, width, length, color, templateId }: HoleModelProps) {
-	if (templateId) {
-		return <TemplateHoleModel templateId={templateId} />;
-	}
+type HoleSwitchProps = {
+	type: string;
+	width: number;
+	length: number;
+	color: string;
+};
+
+/** Renders flat-color hole models (existing geometry) */
+function FlatHoleSwitch({ type, width, length, color }: HoleSwitchProps) {
 	switch (type) {
 		case "straight":
 			return <HoleStraight width={width} length={length} />;
@@ -45,3 +52,77 @@ export function HoleModel({ type, width, length, color, templateId }: HoleModelP
 			);
 	}
 }
+
+/** Renders textured hole models where available, falls back to flat */
+function TexturedHoleSwitch({ type, width, length, color }: HoleSwitchProps) {
+	switch (type) {
+		case "straight":
+			return <HoleStraightTextured width={width} length={length} />;
+		// Other types will get textured variants in Section 02+
+		default:
+			return (
+				<FlatHoleSwitch
+					type={type}
+					width={width}
+					length={length}
+					color={color}
+				/>
+			);
+	}
+}
+
+/** Error boundary for texture loading failures */
+class TextureErrorBoundary extends Component<
+	{ fallback: ReactNode; children: ReactNode },
+	{ hasError: boolean }
+> {
+	state = { hasError: false };
+
+	static getDerivedStateFromError() {
+		return { hasError: true };
+	}
+
+	render() {
+		if (this.state.hasError) {
+			return this.props.fallback;
+		}
+		return this.props.children;
+	}
+}
+
+/** Dispatches to per-type 3D model with GPU tier texture gating. */
+export function HoleModel({
+	type,
+	width,
+	length,
+	color,
+	templateId,
+}: HoleModelProps) {
+	const gpuTier = useStore((s) => s.ui.gpuTier);
+
+	if (templateId) {
+		return <TemplateHoleModel templateId={templateId} />;
+	}
+
+	if (gpuTier !== "low") {
+		const flatFallback = (
+			<FlatHoleSwitch type={type} width={width} length={length} color={color} />
+		);
+		return (
+			<TextureErrorBoundary fallback={flatFallback}>
+				<Suspense fallback={flatFallback}>
+					<TexturedHoleSwitch
+						type={type}
+						width={width}
+						length={length}
+						color={color}
+					/>
+				</Suspense>
+			</TextureErrorBoundary>
+		);
+	}
+
+	return (
+		<FlatHoleSwitch type={type} width={width} length={length} color={color} />
+	);
+}
diff --git a/src/components/three/holes/HoleStraightTextured.tsx b/src/components/three/holes/HoleStraightTextured.tsx
new file mode 100644
index 0000000..357a1c8
--- /dev/null
+++ b/src/components/three/holes/HoleStraightTextured.tsx
@@ -0,0 +1,178 @@
+import { useEffect, useMemo } from "react";
+import * as THREE from "three";
+import { useStore } from "../../../store";
+import {
+	createBumperGeometry,
+	createBumperProfile,
+} from "../../../utils/bumperProfile";
+import {
+	CUP_DEPTH,
+	createCupGeometry,
+	createFlagPinGeometry,
+	createTeeGeometry,
+	FLAG_PIN_HEIGHT,
+} from "../../../utils/holeGeometry";
+import {
+	BUMPER_HEIGHT,
+	BUMPER_THICKNESS,
+	CUP_RADIUS,
+	SURFACE_THICKNESS,
+	TEE_RADIUS,
+} from "./shared";
+import { useTexturedMaterials } from "./useTexturedMaterials";
+
+type Props = { width: number; length: number };
+
+const BEVEL_RADIUS = 0.008;
+const FLAG_COLOR = "#FF1744";
+
+export function HoleStraightTextured({ width, length }: Props) {
+	const { felt, bumper, tee, cup } = useTexturedMaterials();
+	const view = useStore((s) => s.ui.view);
+
+	const halfW = width / 2;
+	const halfL = length / 2;
+	const laneW = width - BUMPER_THICKNESS * 2;
+	const laneL = length - BUMPER_THICKNESS * 2;
+
+	// Create bumper profile and geometries
+	const bumperProfile = useMemo(
+		() => createBumperProfile(BUMPER_HEIGHT, BUMPER_THICKNESS, BEVEL_RADIUS),
+		[],
+	);
+
+	const leftRightGeom = useMemo(
+		() => createBumperGeometry(bumperProfile, length),
+		[bumperProfile, length],
+	);
+
+	const frontBackGeom = useMemo(
+		() => createBumperGeometry(bumperProfile, laneW),
+		[bumperProfile, laneW],
+	);
+
+	const cupGeom = useMemo(() => createCupGeometry(CUP_RADIUS), []);
+	const teeGeom = useMemo(() => createTeeGeometry(TEE_RADIUS), []);
+	const flagPinGeom = useMemo(() => createFlagPinGeometry(), []);
+
+	// Flag cloth geometry
+	const flagClothGeom = useMemo(() => new THREE.PlaneGeometry(0.03, 0.02), []);
+
+	// Flag pin material (white/metallic)
+	const flagPinMat = useMemo(
+		() =>
+			new THREE.MeshStandardMaterial({
+				color: "#E0E0E0",
+				metalness: 0.8,
+				roughness: 0.2,
+			}),
+		[],
+	);
+
+	// Flag cloth material
+	const flagClothMat = useMemo(
+		() =>
+			new THREE.MeshStandardMaterial({
+				color: FLAG_COLOR,
+				side: THREE.DoubleSide,
+			}),
+		[],
+	);
+
+	useEffect(() => {
+		return () => {
+			leftRightGeom.dispose();
+			frontBackGeom.dispose();
+			cupGeom.dispose();
+			teeGeom.dispose();
+			flagPinGeom.dispose();
+			flagClothGeom.dispose();
+			flagPinMat.dispose();
+			flagClothMat.dispose();
+		};
+	}, [
+		leftRightGeom,
+		frontBackGeom,
+		cupGeom,
+		teeGeom,
+		flagPinGeom,
+		flagClothGeom,
+		flagPinMat,
+		flagClothMat,
+	]);
+
+	return (
+		<group>
+			{/* Green felt surface */}
+			<mesh position={[0, SURFACE_THICKNESS / 2, 0]} material={felt}>
+				<boxGeometry args={[laneW, SURFACE_THICKNESS, laneL]} />
+			</mesh>
+
+			{/* Left bumper — extrusion along Z, centered at -halfW */}
+			<mesh
+				castShadow
+				geometry={leftRightGeom}
+				material={bumper}
+				position={[-halfW + BUMPER_THICKNESS / 2, SURFACE_THICKNESS, -halfL]}
+			/>
+
+			{/* Right bumper */}
+			<mesh
+				castShadow
+				geometry={leftRightGeom}
+				material={bumper}
+				position={[halfW - BUMPER_THICKNESS / 2, SURFACE_THICKNESS, -halfL]}
+			/>
+
+			{/* Back bumper (-Z) — rotated 90° around Y */}
+			<mesh
+				castShadow
+				geometry={frontBackGeom}
+				material={bumper}
+				position={[
+					-laneW / 2,
+					SURFACE_THICKNESS,
+					-halfL + BUMPER_THICKNESS / 2,
+				]}
+				rotation={[0, -Math.PI / 2, 0]}
+			/>
+
+			{/* Front bumper (+Z) */}
+			<mesh
+				castShadow
+				geometry={frontBackGeom}
+				material={bumper}
+				position={[-laneW / 2, SURFACE_THICKNESS, halfL - BUMPER_THICKNESS / 2]}
+				rotation={[0, -Math.PI / 2, 0]}
+			/>
+
+			{/* Recessed cup */}
+			<mesh
+				geometry={cupGeom}
+				material={cup}
+				position={[0, SURFACE_THICKNESS - CUP_DEPTH / 2, halfL - 0.15]}
+			/>
+
+			{/* Tee pad */}
+			<mesh
+				geometry={teeGeom}
+				material={tee}
+				position={[0, SURFACE_THICKNESS + 0.0015, -halfL + 0.15]}
+			/>
+
+			{/* Flag pin — only visible in 3D view */}
+			{view !== "top" && (
+				<group
+					position={[0, SURFACE_THICKNESS + FLAG_PIN_HEIGHT / 2, halfL - 0.15]}
+				>
+					<mesh geometry={flagPinGeom} material={flagPinMat} />
+					<mesh
+						geometry={flagClothGeom}
+						material={flagClothMat}
+						position={[0.015, FLAG_PIN_HEIGHT / 2 - 0.015, 0]}
+					/>
+				</group>
+			)}
+		</group>
+	);
+}
diff --git a/src/components/three/holes/useTexturedMaterials.ts b/src/components/three/holes/useTexturedMaterials.ts
new file mode 100644
index 0000000..c185071
--- /dev/null
+++ b/src/components/three/holes/useTexturedMaterials.ts
@@ -0,0 +1,135 @@
+import { useTexture } from "@react-three/drei";
+import { useEffect, useMemo } from "react";
+import * as THREE from "three";
+import { useStore } from "../../../store";
+import type { MaterialProfile } from "../../../types/budget";
+import type { GpuTier } from "../../../types/ui";
+import { BUMPER_PBR, FELT_PBR } from "./materialPresets";
+import { cupMaterial, teeMaterial } from "./shared";
+import type { MaterialSet } from "./useMaterials";
+
+/** Surface types that have texture assets */
+export type TextureSurface = "felt" | "wood" | "rubber";
+
+/**
+ * Whether textures should be loaded for this GPU tier.
+ * Low tier = no textures (flat-color fallback).
+ */
+export function shouldLoadTextures(tier: GpuTier): boolean {
+	return tier !== "low";
+}
+
+/**
+ * Returns array of texture file paths to load for a given surface and GPU tier.
+ * High: [color, normal, roughness]
+ * Mid: [color, normal] (no roughness)
+ * Low: [] (empty)
+ */
+export function getTexturePathsForTier(
+	tier: GpuTier,
+	surface: TextureSurface,
+): string[] {
+	if (tier === "low") return [];
+
+	const base = `/textures/${surface}`;
+
+	// Rubber has no color map (uses material color)
+	if (surface === "rubber") {
+		const paths = [`${base}/normal.jpg`, `${base}/roughness.jpg`];
+		if (tier === "mid") return [paths[0]]; // normal only
+		return paths; // high: normal + roughness
+	}
+
+	const paths = [`${base}/color.jpg`, `${base}/normal.jpg`];
+	if (tier === "high") {
+		paths.push(`${base}/roughness.jpg`);
+	}
+	return paths;
+}
+
+function configureTexture(
+	texture: THREE.Texture,
+	repeatX: number,
+	repeatY: number,
+): void {
+	texture.wrapS = THREE.RepeatWrapping;
+	texture.wrapT = THREE.RepeatWrapping;
+	texture.repeat.set(repeatX, repeatY);
+}
+
+/**
+ * React hook that returns a MaterialSet with PBR texture maps applied.
+ * Must be called inside a Suspense boundary.
+ */
+export function useTexturedMaterials(): MaterialSet {
+	const gpuTier = useStore((s) => s.ui.gpuTier);
+	const materialProfile: MaterialProfile = useStore(
+		(s) => s.budgetConfig.materialProfile,
+	);
+
+	// Load felt textures
+	const feltPaths = getTexturePathsForTier(gpuTier, "felt");
+	const feltTextures = useTexture(
+		feltPaths.length > 0 ? feltPaths : ["/textures/felt/color.jpg"],
+	);
+
+	// Load wood textures
+	const woodPaths = getTexturePathsForTier(gpuTier, "wood");
+	const woodTextures = useTexture(
+		woodPaths.length > 0 ? woodPaths : ["/textures/wood/color.jpg"],
+	);
+
+	const materials = useMemo(() => {
+		const feltProps = FELT_PBR[materialProfile];
+		const bumperProps = BUMPER_PBR[materialProfile];
+
+		// Configure felt textures
+		const feltArr = Array.isArray(feltTextures) ? feltTextures : [feltTextures];
+		for (const tex of feltArr) {
+			configureTexture(tex, 2, 2);
+		}
+
+		const felt = new THREE.MeshStandardMaterial({
+			color: feltProps.color,
+			roughness: feltProps.roughness,
+			metalness: feltProps.metalness,
+			map: feltArr[0] ?? null,
+			normalMap: feltArr[1] ?? null,
+			roughnessMap: feltArr[2] ?? null,
+			polygonOffset: true,
+			polygonOffsetFactor: -1,
+		});
+
+		// Configure wood textures
+		const woodArr = Array.isArray(woodTextures) ? woodTextures : [woodTextures];
+		for (const tex of woodArr) {
+			configureTexture(tex, 1, 4);
+		}
+
+		const bumper = new THREE.MeshStandardMaterial({
+			color: bumperProps.color,
+			roughness: bumperProps.roughness,
+			metalness: bumperProps.metalness,
+			map: woodArr[0] ?? null,
+			normalMap: woodArr[1] ?? null,
+			roughnessMap: woodArr[2] ?? null,
+		});
+
+		return { felt, bumper, tee: teeMaterial, cup: cupMaterial };
+	}, [materialProfile, feltTextures, woodTextures]);
+
+	useEffect(() => {
+		return () => {
+			materials.felt.dispose();
+			materials.bumper.dispose();
+		};
+	}, [materials]);
+
+	return materials;
+}
+
+// Preload critical textures
+useTexture.preload("/textures/felt/color.jpg");
+useTexture.preload("/textures/felt/normal.jpg");
+useTexture.preload("/textures/wood/color.jpg");
+useTexture.preload("/textures/wood/normal.jpg");
diff --git a/src/utils/bumperProfile.ts b/src/utils/bumperProfile.ts
new file mode 100644
index 0000000..de8ec61
--- /dev/null
+++ b/src/utils/bumperProfile.ts
@@ -0,0 +1,60 @@
+import * as THREE from "three";
+import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
+
+/**
+ * Creates a rounded rectangle Shape for bumper cross-section.
+ * The shape lies in the XY plane: X = thickness, Y = height.
+ * Four corners get quadraticCurveTo bevels for rounded edges.
+ */
+export function createBumperProfile(
+	height: number,
+	thickness: number,
+	bevelRadius: number,
+): THREE.Shape {
+	const r = Math.min(bevelRadius, thickness / 2, height / 2);
+	const hw = thickness / 2;
+	const hh = height;
+
+	const shape = new THREE.Shape();
+
+	// Start at bottom-left + bevel offset, go clockwise
+	shape.moveTo(-hw + r, 0);
+
+	// Bottom edge -> bottom-right corner
+	shape.lineTo(hw - r, 0);
+	shape.quadraticCurveTo(hw, 0, hw, r);
+
+	// Right edge -> top-right corner
+	shape.lineTo(hw, hh - r);
+	shape.quadraticCurveTo(hw, hh, hw - r, hh);
+
+	// Top edge -> top-left corner
+	shape.lineTo(-hw + r, hh);
+	shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
+
+	// Left edge -> bottom-left corner
+	shape.lineTo(-hw, r);
+	shape.quadraticCurveTo(-hw, 0, -hw + r, 0);
+
+	return shape;
+}
+
+/**
+ * Creates ExtrudeGeometry for a straight bumper rail.
+ * Extrudes the bumper profile along the Z axis for the given length.
+ */
+export function createBumperGeometry(
+	profile: THREE.Shape,
+	length: number,
+	options?: { curveSegments?: number },
+): THREE.ExtrudeGeometry {
+	const curveSegments = options?.curveSegments ?? 8;
+
+	const geom = new THREE.ExtrudeGeometry(profile, {
+		depth: length,
+		bevelEnabled: false,
+		curveSegments,
+	});
+
+	return mergeVertices(geom) as THREE.ExtrudeGeometry;
+}
diff --git a/src/utils/holeGeometry.ts b/src/utils/holeGeometry.ts
new file mode 100644
index 0000000..999a11d
--- /dev/null
+++ b/src/utils/holeGeometry.ts
@@ -0,0 +1,30 @@
+import * as THREE from "three";
+
+/** Depth of the recessed cup below the felt surface */
+export const CUP_DEPTH = 0.015;
+
+/** Height of the flag pin above the felt surface */
+export const FLAG_PIN_HEIGHT = 0.2;
+
+/**
+ * Creates a recessed CylinderGeometry for the cup (hole).
+ * Oriented along Y axis, open at the top.
+ */
+export function createCupGeometry(radius: number): THREE.CylinderGeometry {
+	return new THREE.CylinderGeometry(radius, radius, CUP_DEPTH, 16, 1, true);
+}
+
+/**
+ * Creates a slightly raised CylinderGeometry for the tee pad.
+ * 3mm height, positioned on top of the felt surface.
+ */
+export function createTeeGeometry(radius: number): THREE.CylinderGeometry {
+	return new THREE.CylinderGeometry(radius, radius, 0.003, 16);
+}
+
+/**
+ * Creates a thin CylinderGeometry for the flag pin shaft.
+ */
+export function createFlagPinGeometry(): THREE.CylinderGeometry {
+	return new THREE.CylinderGeometry(0.003, 0.003, FLAG_PIN_HEIGHT, 6);
+}
diff --git a/tests/hooks/texturedMaterials.test.ts b/tests/hooks/texturedMaterials.test.ts
new file mode 100644
index 0000000..70c8bac
--- /dev/null
+++ b/tests/hooks/texturedMaterials.test.ts
@@ -0,0 +1,65 @@
+import { describe, expect, it, vi } from "vitest";
+
+vi.mock("@react-three/drei", () => {
+	const { Texture } = require("three");
+	const fn = vi.fn(() => new Texture());
+	fn.preload = vi.fn();
+	return { useTexture: fn };
+});
+
+// Also mock the store to avoid Zustand initialization issues
+vi.mock("../../../src/store", () => ({
+	useStore: vi.fn(() => "high"),
+}));
+
+import {
+	getTexturePathsForTier,
+	shouldLoadTextures,
+} from "../../src/components/three/holes/useTexturedMaterials";
+
+describe("shouldLoadTextures", () => {
+	it("returns false for GPU tier 'low'", () => {
+		expect(shouldLoadTextures("low")).toBe(false);
+	});
+
+	it("returns true for GPU tier 'mid'", () => {
+		expect(shouldLoadTextures("mid")).toBe(true);
+	});
+
+	it("returns true for GPU tier 'high'", () => {
+		expect(shouldLoadTextures("high")).toBe(true);
+	});
+});
+
+describe("getTexturePathsForTier", () => {
+	it("GPU tier high returns color + normal + roughness paths", () => {
+		const paths = getTexturePathsForTier("high", "felt");
+		expect(paths).toContain("/textures/felt/color.jpg");
+		expect(paths).toContain("/textures/felt/normal.jpg");
+		expect(paths).toContain("/textures/felt/roughness.jpg");
+	});
+
+	it("GPU tier mid returns color + normal only (no roughness)", () => {
+		const paths = getTexturePathsForTier("mid", "felt");
+		expect(paths).toContain("/textures/felt/color.jpg");
+		expect(paths).toContain("/textures/felt/normal.jpg");
+		expect(paths).not.toContain("/textures/felt/roughness.jpg");
+	});
+
+	it("GPU tier low returns empty array (no textures)", () => {
+		const paths = getTexturePathsForTier("low", "felt");
+		expect(paths).toHaveLength(0);
+	});
+
+	it("returns wood texture paths", () => {
+		const paths = getTexturePathsForTier("high", "wood");
+		expect(paths).toContain("/textures/wood/color.jpg");
+		expect(paths).toContain("/textures/wood/normal.jpg");
+	});
+
+	it("returns rubber texture paths", () => {
+		const paths = getTexturePathsForTier("high", "rubber");
+		expect(paths).toContain("/textures/rubber/normal.jpg");
+		expect(paths).toContain("/textures/rubber/roughness.jpg");
+	});
+});
diff --git a/tests/utils/bumperProfile.test.ts b/tests/utils/bumperProfile.test.ts
new file mode 100644
index 0000000..53b5a49
--- /dev/null
+++ b/tests/utils/bumperProfile.test.ts
@@ -0,0 +1,52 @@
+import { describe, expect, it } from "vitest";
+import {
+	createBumperGeometry,
+	createBumperProfile,
+} from "../../src/utils/bumperProfile";
+
+describe("createBumperProfile", () => {
+	it("returns a THREE.Shape with correct dimensions", () => {
+		const shape = createBumperProfile(0.08, 0.05, 0.008);
+		expect(shape).toBeDefined();
+		expect(shape.getPoints).toBeTypeOf("function");
+		const points = shape.getPoints(8);
+		expect(points.length).toBeGreaterThan(4);
+	});
+
+	it("applies bevel radius to all 4 corners", () => {
+		const shape = createBumperProfile(0.08, 0.05, 0.008);
+		const points = shape.getPoints(8);
+		expect(points.length).toBeGreaterThanOrEqual(16);
+	});
+});
+
+describe("createBumperGeometry", () => {
+	it("returns a BufferGeometry", () => {
+		const profile = createBumperProfile(0.08, 0.05, 0.008);
+		const geom = createBumperGeometry(profile, 1.0);
+		expect(geom).toBeDefined();
+		expect(geom.attributes.position).toBeDefined();
+	});
+
+	it("triangle count is within 500-triangle budget", () => {
+		const profile = createBumperProfile(0.08, 0.05, 0.008);
+		const geom = createBumperGeometry(profile, 1.0);
+		const indexCount = geom.index ? geom.index.count : 0;
+		const triangles = indexCount / 3;
+		expect(triangles).toBeLessThanOrEqual(500);
+		expect(triangles).toBeGreaterThan(0);
+	});
+
+	it("produces geometry with curveSegments=8 for smooth profile", () => {
+		const profile = createBumperProfile(0.08, 0.05, 0.008);
+		const geom = createBumperGeometry(profile, 1.0, { curveSegments: 8 });
+		const indexCount = geom.index ? geom.index.count : 0;
+		expect(indexCount).toBeGreaterThan(0);
+	});
+
+	it("geometry can be disposed cleanly", () => {
+		const profile = createBumperProfile(0.08, 0.05, 0.008);
+		const geom = createBumperGeometry(profile, 1.0);
+		expect(() => geom.dispose()).not.toThrow();
+	});
+});
diff --git a/tests/utils/holeGeometry.test.ts b/tests/utils/holeGeometry.test.ts
new file mode 100644
index 0000000..8b353f7
--- /dev/null
+++ b/tests/utils/holeGeometry.test.ts
@@ -0,0 +1,76 @@
+import { describe, expect, it } from "vitest";
+import {
+	CUP_DEPTH,
+	createCupGeometry,
+	createFlagPinGeometry,
+	createTeeGeometry,
+	FLAG_PIN_HEIGHT,
+} from "../../src/utils/holeGeometry";
+
+function getBoundingBox(geom: {
+	computeBoundingBox(): void;
+	boundingBox: unknown;
+}) {
+	geom.computeBoundingBox();
+	const bb = geom.boundingBox as {
+		max: { x: number; y: number; z: number };
+		min: { x: number; y: number; z: number };
+	};
+	return bb;
+}
+
+describe("createCupGeometry", () => {
+	it("returns a CylinderGeometry for the recessed cup", () => {
+		const geom = createCupGeometry(0.054);
+		expect(geom).toBeDefined();
+		expect(geom.attributes.position).toBeDefined();
+	});
+
+	it("cup has correct radius matching CUP_RADIUS", () => {
+		const geom = createCupGeometry(0.054);
+		const bb = getBoundingBox(geom);
+		const diameter = bb.max.x - bb.min.x;
+		expect(diameter).toBeCloseTo(0.108, 2);
+	});
+
+	it("cup has visible depth (height > 0)", () => {
+		expect(CUP_DEPTH).toBeGreaterThan(0);
+		expect(CUP_DEPTH).toBeLessThanOrEqual(0.03);
+	});
+});
+
+describe("createTeeGeometry", () => {
+	it("returns a CylinderGeometry for the raised tee pad", () => {
+		const geom = createTeeGeometry(0.03);
+		expect(geom).toBeDefined();
+		expect(geom.attributes.position).toBeDefined();
+	});
+
+	it("tee has correct radius matching TEE_RADIUS", () => {
+		const geom = createTeeGeometry(0.03);
+		const bb = getBoundingBox(geom);
+		const diameter = bb.max.x - bb.min.x;
+		expect(diameter).toBeCloseTo(0.06, 2);
+	});
+
+	it("tee has visible height (2-3mm raised)", () => {
+		const geom = createTeeGeometry(0.03);
+		const bb = getBoundingBox(geom);
+		const height = bb.max.y - bb.min.y;
+		expect(height).toBeGreaterThanOrEqual(0.002);
+		expect(height).toBeLessThanOrEqual(0.005);
+	});
+});
+
+describe("createFlagPinGeometry", () => {
+	it("returns a thin cylinder geometry for the flag pin shaft", () => {
+		const geom = createFlagPinGeometry();
+		expect(geom).toBeDefined();
+		expect(geom.attributes.position).toBeDefined();
+	});
+
+	it("flag pin has reasonable height", () => {
+		expect(FLAG_PIN_HEIGHT).toBeGreaterThanOrEqual(0.1);
+		expect(FLAG_PIN_HEIGHT).toBeLessThanOrEqual(0.3);
+	});
+});
