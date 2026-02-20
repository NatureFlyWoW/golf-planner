# Phase 4 — Tasks 1–2: Polish Fixes

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 4 small issues found during Phase 3 Playwright verification. All are one-liner edits.

**Prereqs:** Phases 1-3 complete, working tree clean on master.

**Environment:** In every Bash call: `export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)"`

---

### Task 1: Apply 4 quick polish fixes

**Files:**
- Modify: `index.html`
- Modify: `src/components/ui/HoleDetail.tsx:52-53`
- Modify: `src/components/ui/MobileDetailPanel.tsx:76-77`
- Modify: `src/components/ui/BottomToolbar.tsx:182`
- Modify: `src/components/ui/HoleDrawer.tsx:27-28`

**Step 1: Add favicon link to index.html**

In `index.html`, add inside `<head>` after the `<title>` tag:

```html
<link rel="icon" type="image/svg+xml" href="/icon.svg" />
```

The SVG already exists at `public/icon.svg`. VitePWA has no `includeAssets` config so no conflict.

**Step 2: Fix par input clamp in HoleDetail.tsx**

In `src/components/ui/HoleDetail.tsx`, change the par onChange (line 52-53) from:

```tsx
onChange={(e) =>
	updateHole(selectedId, { par: Number(e.target.value) })
}
```

to:

```tsx
onChange={(e) =>
	updateHole(selectedId, {
		par: Math.min(6, Math.max(1, Number(e.target.value))),
	})
}
```

**Step 3: Fix par input clamp in MobileDetailPanel.tsx**

In `src/components/ui/MobileDetailPanel.tsx`, change the par onChange (line 76-77) from:

```tsx
onChange={(e) =>
	updateHole(selectedId, { par: Number(e.target.value) })
}
```

to:

```tsx
onChange={(e) =>
	updateHole(selectedId, {
		par: Math.min(6, Math.max(1, Number(e.target.value))),
	})
}
```

**Step 4: Add role="presentation" and bg-black/10 to OverflowPopover backdrop**

In `src/components/ui/BottomToolbar.tsx`, change the backdrop div (line 182) from:

```tsx
<div className="fixed inset-0 z-40" onClick={onClose} />
```

to:

```tsx
<div className="fixed inset-0 z-40 bg-black/10" onClick={onClose} role="presentation" />
```

**Step 5: Add role="presentation" to HoleDrawer backdrop**

In `src/components/ui/HoleDrawer.tsx`, change the backdrop div (line 27-28) from:

```tsx
<div
	className="fixed inset-0 z-30 bg-black/20 md:hidden"
	onClick={handleClose}
/>
```

to:

```tsx
<div
	className="fixed inset-0 z-30 bg-black/20 md:hidden"
	onClick={handleClose}
	role="presentation"
/>
```

**Step 6: Verify**

Run:
```bash
cd /mnt/c/Users/Caus/Golf_Plan/golf-planner && export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)" && npm run check && npm run test
```
Expected: Lint clean, all tests pass.

---

### Task 2: Commit polish fixes

**Step 1: Commit**

```bash
cd /mnt/c/Users/Caus/Golf_Plan/golf-planner && git add index.html src/components/ui/HoleDetail.tsx src/components/ui/MobileDetailPanel.tsx src/components/ui/BottomToolbar.tsx src/components/ui/HoleDrawer.tsx && git commit -m "fix: favicon, par clamp, backdrop a11y and styling"
```

Expected: Clean commit with 5 files changed.
