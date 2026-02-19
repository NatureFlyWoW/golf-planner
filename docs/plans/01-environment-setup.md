# 01 - Environment Setup

## Current State

- **OS:** WSL2 Ubuntu 24.04 on Windows
- **Working directory:** `/mnt/c/Users/Caus/Golf_Plan` (Windows-mounted)
- **Node.js:** Not installed natively in WSL2 (only a stale v10.9.3 via Windows PATH)
- **Git:** v2.43.0 (WSL-native)
- **Package managers:** npm (will ship with Node), pnpm available on Windows side

## Setup Steps

### 1. Install fnm (Fast Node Manager) in WSL2

```bash
curl -fsSL https://fnm.vercel.app/install | bash
source ~/.bashrc
```

### 2. Install Node.js 22 LTS

```bash
fnm install 22
fnm default 22
node --version  # should show v22.x
npm --version   # should show v10.x
```

### 3. Scaffold the project

```bash
cd /mnt/c/Users/Caus/Golf_Plan
npm create vite@latest golf-planner -- --template react-ts
cd golf-planner
npm install
```

### 4. Install dependencies

```bash
# 3D
npm install three @react-three/fiber @react-three/drei
npm install -D @types/three

# State
npm install zustand

# Styling
npm install -D tailwindcss @tailwindcss/vite

# Tooling
npm install -D @biomejs/biome
npx @biomejs/biome init

# Testing
npm install -D vitest
```

### 5. Initialize git

```bash
git init
git add .
git commit -m "feat: initial project scaffold"
```

## WSL2-Specific Configuration

**Vite file watching:** The `/mnt/c/` mount uses the 9P protocol, which can miss filesystem events. Vite's HMR needs polling mode:

```typescript
// vite.config.ts
server: {
  watch: {
    usePolling: true,
    interval: 100,
  },
}
```

This adds ~1-2% CPU usage but makes hot reload reliable.

## Editor Setup

VS Code with the **WSL extension** — the dev server runs in WSL, VS Code connects via the extension. Open with `code .` from the WSL terminal inside the project directory.
