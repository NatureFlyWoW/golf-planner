---
trigger: "when writing or running Playwright tests against R3F canvas"
confidence: 0.9
domain: "testing"
created: "2026-02-22T00:00:00Z"
source: "MEMORY.md"
last_validated: "2026-02-22T00:00:00Z"
---

# Playwright + R3F: No Snapshot Refs

## Action
Playwright MCP snapshot refs expire at 60fps in R3F canvases. MUST use `browser_run_code` with `page.getByRole()` locators, NOT snapshot refs. Also: Playwright MCP runs on Windows side, so WSL paths fail for screenshots.

## Evidence
- MEMORY.md: "Playwright MCP + R3F: snapshot refs expire at 60fps. MUST use browser_run_code"
- MEMORY.md: "Playwright MCP runs on Windows side — WSL paths fail for screenshots"
