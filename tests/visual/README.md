# Visual Regression Tests

Playwright-based screenshot comparison tests for GOLF FORGE.

## Prerequisites

- Node.js via fnm
- Chromium: `npx playwright install chromium`
- WSL2 system deps: `npx playwright install-deps chromium` (requires sudo) or manually install: `libnss3 libatk-bridge2.0-0 libdrm2 libxkbcommon0 libgbm1 libpango-1.0-0 libcairo2 libasound2`

## Commands

| Command | Description |
|---------|-------------|
| `npm run test:visual` | Run visual regression tests |
| `npx playwright test --update-snapshots` | Update baseline screenshots |
| `npx playwright show-report` | View HTML test report |

## Notes

- Baselines are platform-specific. Generate and compare on the same environment (WSL2 Chromium headless).
- Threshold: 0.1% pixel diff tolerance (configured in `playwright.config.ts`).
- The dev server starts automatically via `webServer` config.
