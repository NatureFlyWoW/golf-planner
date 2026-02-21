## Section 07: MeshReflectorMaterial (Reflective Floor) -- Code Review

### Summary

Clean implementation that faithfully follows the plan. Pure gating functions are well-extracted and tested. However, there is a reactivity bug: the performance degradation path will never actually trigger a re-render, making it dead code in practice.

### Issues Found

**B1 (Bug - Medium): `perfRef.current` is never reactive -- performance degradation cannot disable the reflector**

The `useFrame` callback updates `perfRef.current` every frame, but `shouldUseReflector` is called during the React render phase, not inside `useFrame`. Since `perfRef` is a ref (not state), updating it does not trigger a React re-render. The `useReflector` boolean is computed once during render and never recomputed until some *other* Zustand selector changes.

**Fix**: Use `useState` with threshold-crossing check inside `useFrame`:
```tsx
const [perfOk, setPerfOk] = useState(true);
useFrame((state) => {
  const ok = state.performance.current >= 0.5;
  if (ok !== perfOk) setPerfOk(ok);
});
```

**B2 (Bug - Low): No hysteresis on performance threshold**

If B1 is fixed with reactive state, the reflector could flicker when `performance.current` oscillates around 0.5. Consider a hysteresis band or debounce.

**M1 (Minor): Material disposal on toggle**

Conditional rendering unmounts/mounts materials, causing FBO allocation/deallocation on each toggle. Acceptable for personal project.

### Verdict

Fix B1 (performance degradation reactivity). B2 and M1 acceptable trade-offs.
