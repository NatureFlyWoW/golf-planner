# Phase 7 — Task 7: Toolbar UI

**Depends on:** Task 1 (uvMode + toggleUvMode must exist in store)

---

## File 1: Toolbar.tsx (Desktop)

**File:** `src/components/ui/Toolbar.tsx`

### Add store subscriptions

**Add after existing subscriptions (after line 20 `const setView = ...`):**
```typescript
	const uvMode = useStore((s) => s.ui.uvMode);
	const toggleUvMode = useStore((s) => s.toggleUvMode);
```

### Add conditional class variables

**Add at top of component body (before the return):**
```typescript
	const barClass = uvMode
		? "hidden items-center gap-1 border-b border-indigo-900 bg-gray-900 px-3 py-2 md:flex"
		: "hidden items-center gap-1 border-b border-gray-200 bg-white px-3 py-2 md:flex";

	const btnClass = (active: boolean) =>
		uvMode
			? `rounded px-3 py-1.5 text-sm font-medium transition-colors ${
					active
						? "bg-purple-600 text-white"
						: "bg-gray-800 text-gray-300 hover:bg-gray-700"
				}`
			: `rounded px-3 py-1.5 text-sm font-medium transition-colors ${
					active
						? "bg-blue-600 text-white"
						: "bg-gray-100 text-gray-700 hover:bg-gray-200"
				}`;

	const neutralBtnClass = uvMode
		? "rounded bg-gray-800 px-3 py-1.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700"
		: "rounded bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200";

	const smallBtnClass = uvMode
		? "rounded bg-gray-800 px-2 py-1.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700"
		: "rounded bg-gray-100 px-2 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200";

	const dividerClass = uvMode ? "mx-2 h-6 w-px bg-gray-700" : "mx-2 h-6 w-px bg-gray-200";
```

### Update JSX

**Replace the outer div class (line 23):**
```tsx
<div className={barClass}>
```

**Replace tool button classes (line 29-33):**
Currently uses inline ternary. Replace the `className` with:
```tsx
className={btnClass(activeTool === tool)}
```

**Replace divider (line 40):**
```tsx
<div className={dividerClass} />
```

**Replace Snap button class (lines 45-49):**
Replace the inline ternary with:
```tsx
className={btnClass(snapEnabled)}
```

Also update Snap's active color — currently uses `bg-green-600`. In UV mode it should use purple. Change the `btnClass` helper to handle snap differently, OR keep it simple: use same `btnClass` for Snap too (purple when active in UV mode instead of green).

Actually, keeping Snap as green in planning mode is intentional (different from tool selection). Simplify: create a snap-specific class:
```typescript
	const snapBtnClass = uvMode
		? `rounded px-3 py-1.5 text-sm font-medium transition-colors ${
				snapEnabled
					? "bg-purple-600 text-white"
					: "bg-gray-800 text-gray-300 hover:bg-gray-700"
			}`
		: `rounded px-3 py-1.5 text-sm font-medium transition-colors ${
				snapEnabled
					? "bg-green-600 text-white"
					: "bg-gray-100 text-gray-700 hover:bg-gray-200"
			}`;
```
Use `className={snapBtnClass}` for the Snap button.

**Replace Flow button class (lines 57-63):**
Similarly:
```typescript
	const flowBtnClass = uvMode
		? `rounded px-3 py-1.5 text-sm font-medium transition-colors ${
				showFlowPath
					? "bg-purple-600 text-white"
					: "bg-gray-800 text-gray-300 hover:bg-gray-700"
			}`
		: `rounded px-3 py-1.5 text-sm font-medium transition-colors ${
				showFlowPath
					? "bg-purple-600 text-white"
					: "bg-gray-100 text-gray-700 hover:bg-gray-200"
			}`;
```
Use `className={flowBtnClass}` for the Flow button.

**Replace 3D toggle class (line 71):**
```tsx
className={neutralBtnClass}
```

**Add UV toggle button AFTER the 3D toggle button (after line 75):**
```tsx
<button
	type="button"
	onClick={toggleUvMode}
	className={btnClass(uvMode)}
	title="Toggle UV preview mode"
>
	UV
</button>
```

**Replace second divider (line 77):**
```tsx
<div className={dividerClass} />
```

**Replace Undo button class (line 82-83):**
```tsx
className={smallBtnClass}
```

**Replace Redo button class (line 90-91):**
```tsx
className={smallBtnClass}
```

---

## File 2: BottomToolbar.tsx (Mobile)

**File:** `src/components/ui/BottomToolbar.tsx`

### Add store subscription in BottomToolbar component

**After existing subscriptions (around line 23):**
```typescript
	const uvMode = useStore((s) => s.ui.uvMode);
```

### Update outer div class (line 61)

**Current:**
```tsx
<div className="flex flex-col border-t border-gray-200 bg-white md:hidden" ...>
```

**Replace with:**
```tsx
<div
	className={`flex flex-col border-t md:hidden ${
		uvMode ? "border-indigo-900 bg-gray-900" : "border-gray-200 bg-white"
	}`}
	style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
>
```

### Update tool button classes (line 105-109)

**Current:**
```tsx
className={`flex min-w-[48px] flex-col items-center justify-center rounded-lg px-2 py-1 ${
	activeTool === tool ||
	(tool === "place" && activePanel === "holes")
		? "bg-blue-600 text-white"
		: "text-gray-600"
}`}
```

**Replace with:**
```tsx
className={`flex min-w-[48px] flex-col items-center justify-center rounded-lg px-2 py-1 ${
	activeTool === tool ||
	(tool === "place" && activePanel === "holes")
		? uvMode
			? "bg-purple-600 text-white"
			: "bg-blue-600 text-white"
		: uvMode
			? "text-gray-400"
			: "text-gray-600"
}`}
```

### Update dividers (lines 117, 139)

**Current:** `<div className="h-8 w-px bg-gray-200" />`

**Replace with:** `<div className={`h-8 w-px ${uvMode ? "bg-gray-700" : "bg-gray-200"}`} />`

### Update Undo/Redo button classes (lines 123, 133)

**Current:** `className="flex min-w-[48px] ... text-gray-600"`

**Replace `text-gray-600` with:** `${uvMode ? "text-gray-400" : "text-gray-600"}`

### Add UV toggle to OverflowPopover

In the `OverflowPopover` component (line 165), add store subscriptions:
```typescript
	const uvMode = useStore((s) => s.ui.uvMode);
	const toggleUvMode = useStore((s) => s.toggleUvMode);
```

Add a UV toggle button in the overflow grid (after the 3D toggle, before Sun):
```tsx
<ToggleBtn label="UV" active={uvMode} onTap={toggleUvMode} />
```

### Update OverflowPopover background

**Current (line 189):**
```tsx
<div className="absolute bottom-16 right-2 z-50 grid grid-cols-2 gap-2 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
```

**Replace with:**
```tsx
<div className={`absolute bottom-16 right-2 z-50 grid grid-cols-2 gap-2 rounded-lg border p-3 shadow-lg ${
	uvMode ? "border-indigo-900 bg-gray-900" : "border-gray-200 bg-white"
}`}>
```

### Update ToggleBtn component for UV mode

The `ToggleBtn` component (line 250) needs a `uvMode` prop OR read from store directly. Since it's a simple sub-component, read from store:

```typescript
function ToggleBtn({
	label,
	active,
	onTap,
}: {
	label: string;
	active: boolean;
	onTap: () => void;
}) {
	const uvMode = useStore((s) => s.ui.uvMode);
	return (
		<button
			type="button"
			onClick={onTap}
			className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
				active
					? uvMode
						? "bg-purple-600 text-white"
						: "bg-blue-600 text-white"
					: uvMode
						? "bg-gray-800 text-gray-300"
						: "bg-gray-100 text-gray-700"
			}`}
		>
			{label}
		</button>
	);
}
```

### Update non-toggle buttons in overflow (Save, Export, Budget)

**Current:** `className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700"`

**Replace with conditional — since `uvMode` is already in scope in OverflowPopover:**
```tsx
className={`rounded-lg px-4 py-2 text-sm font-medium ${
	uvMode ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-700"
}`}
```

Apply to all 3 buttons (Save, Export, Budget).

---

## Verify

```bash
cd /mnt/c/Users/Caus/Golf_Plan/golf-planner
export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)"
npm run check && npx tsc --noEmit
```

Expected: Clean pass.

## Commit

```bash
git add src/components/ui/Toolbar.tsx src/components/ui/BottomToolbar.tsx
git commit -m "feat(phase7): UV styling for desktop and mobile toolbars"
```
