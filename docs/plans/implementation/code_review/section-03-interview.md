# Section-03 Dark Theme — Code Review Interview

## Auto-fixes Applied (no user input needed)

1. **SegmentPalette.tsx**: Converted 3 remaining light-theme branches (replace mode banner, active segment, replace mode segment) to neon-amber/neon-green tokens
2. **BudgetPanel.tsx**: Converted confidence badge colors (medium: bg-yellow-100 → bg-neon-amber/15, high: bg-orange-100 → bg-neon-amber/20)
3. **BudgetPanel.tsx**: Fixed progress bar track bg-surface → bg-plasma for visibility
4. **BudgetPanel.tsx**: Fixed progressColor bg-red-500 → bg-neon-pink
5. **HoleLibrary.tsx**: Fixed broken hover states (hover:border-subtle → hover:border-grid-ghost, hover:bg-surface-raised → hover:bg-plasma)
6. **HoleLibrary.tsx**: Fixed hover:border-green-400 → hover:border-neon-green
7. **ExportButton.tsx**: Fixed bg-surface → bg-plasma, text-primary → text-text-secondary
8. **SaveManager.tsx**: Fixed bg-surface → bg-plasma, text-primary → text-text-secondary
9. **HoleDetail.tsx**: Fixed broken hover:bg-plasma → hover:bg-grid-ghost on Edit in Builder button
10. **HoleDetail.tsx**: Fixed hover:bg-neon-pink/15 → hover:bg-neon-pink/20
11. **MobileDetailPanel.tsx**: Fixed active:bg-plasma → active:bg-grid-ghost
12. **BuilderUI.tsx**: Fixed cancel button text-primary → text-text-secondary
13. **BuilderUI.tsx**: Fixed save button text-white → text-surface, hover:bg-neon-green/70 → hover:bg-neon-green/90
14. **SegmentPalette.tsx**: Fixed category tab text-white → text-surface
15. **All input fields**: Added bg-surface text-primary to BudgetPanel, HoleDetail, SaveManager, ExpenseList, BuilderUI inputs

## Let Go (not fixing)

- text-white vs text-primary on accent buttons: visually equivalent (#FFFFFF vs #E8E8FF), not worth the churn
- Snap button color (accent vs neon-green): semantic distinction is nice-to-have, not critical
- darkTheme.test.ts coverage gaps: existing tests catch the main classes, additional patterns are diminishing returns
