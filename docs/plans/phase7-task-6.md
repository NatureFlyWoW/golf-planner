# Phase 7 — Task 6: Lighting

**Depends on:** Task 1 (uvMode must exist in store)

## Step 1: Update App.tsx lighting

**File:** `src/App.tsx`

### Add uvMode read

After existing store subscriptions (line 27-28):
```typescript
	const uvMode = useStore((s) => s.ui.uvMode);
```

### Replace static light elements

**Current (lines 55-56):**
```tsx
<ambientLight intensity={0.8} />
<directionalLight position={[10, 20, 5]} intensity={0.5} />
```

**Replace with:**
```tsx
<ambientLight
	color={uvMode ? "#220044" : "#ffffff"}
	intensity={uvMode ? 0.3 : 0.8}
/>
<directionalLight
	position={[10, 20, 5]}
	color={uvMode ? "#6600CC" : "#ffffff"}
	intensity={uvMode ? 0.4 : 0.5}
/>
```

## Step 2: Verify

```bash
cd /mnt/c/Users/Caus/Golf_Plan/golf-planner
export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)"
npm run check && npx tsc --noEmit
```

Expected: Clean pass.

## Step 3: Commit

```bash
git add src/App.tsx
git commit -m "feat(phase7): conditional UV lighting in App.tsx"
```
