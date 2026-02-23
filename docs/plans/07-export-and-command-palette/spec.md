# 07 — Export & Command Palette

## Overview
The capstone split: generate **professional output documents** (dimensioned PDFs, cost reports, material schedules) and enhance **tool discoverability** with a reorganized toolbar and command palette. This split ties all previous features together into a polished, presentable package.

## Reference
- **Requirements**: `../next-evolution-requirements.md` (F9: Professional Export & Presentation, F10: Enhanced Toolbar & Command Palette)
- **Reference images**: `../../reference_samples/APP_AND_UI_REF1-3.jpg` — deep toolbar with categorized sections (Construction, Components, Openings, Interior, Tools, etc.)
- **Interview**: `../deep_project_interview.md` — Topic 2 (ordering — this comes last)

## Current State
### Export
- **Screenshot**: Canvas PNG capture via `ScreenshotCapture.tsx`
- **SVG export**: Top-down floor plan SVG via `floorPlanExport.ts` — shows hall boundary, grid, hole positions, flow path
- **JSON export**: Full project data via `exportLayout.ts`
- **Save manager**: Named saves to localStorage
- **No PDF export, no cost report, no material schedule**

### Toolbar
- **Desktop**: Single row — Select/Place/Delete | Snap/Flow | 3D/UV | Undo/Redo | Snap/SVG/Saves/Export
- **Mobile**: Bottom toolbar with overflow menu for secondary actions
- **No categorization**: All tools in one flat row
- **No command palette**: No Ctrl+K fuzzy search
- **No context menus**: No right-click on objects
- **Keyboard shortcuts exist** but are only discoverable via `KeyboardHelp.tsx` (? button)
- **Key files**: `Toolbar.tsx`, `BottomToolbar.tsx`, `KeyboardHelp.tsx`

## Requirements

### Professional Export

#### Dimensioned Floor Plan PDF
1. **PDF generation**: Client-side PDF with dimensioned floor plan
2. **Content**: Hall outline with wall thickness, holes with labels, dimension lines, zones, scale bar, grid
3. **Title block**: Project name, date, scale, location (Gramastetten), page number
4. **Legend**: Hole types, zone types, dimension symbols
5. **Scale**: Printed at a standard architectural scale (1:50 or 1:100)
6. **Page size**: A3 landscape (fits 10m × 20m hall well) or A4 with scaling
7. **Print-quality rendering**: Uses the rich 2D mode from split 06 with white background

#### Cost Summary Report PDF
8. **Budget overview**: All 18 categories with estimates, actuals, variance
9. **Course breakdown**: Per-hole type costs, total course cost
10. **Financial summary**: Subtotal, risk buffer, VAT, total
11. **Visual**: Include a simplified floor plan thumbnail alongside budget table
12. **Format**: Clean table layout, printable

#### Material Schedule
13. **Auto-generated**: List all materials needed based on placed holes and zones
14. **Per hole type**: Felt (m²), wood (linear m for bumpers), rubber (m² for tee pads), cups, flags
15. **Per zone**: Flooring material (m²), paint (m²), electrical (UV lamps per zone area)
16. **Quantities**: Computed from placed holes and zone areas
17. **Export format**: PDF or CSV table

#### Enhanced SVG Export
18. **Include dimensions**: Dimension lines from split 02 included in SVG
19. **Include annotations**: Text labels and arrows from split 03 included
20. **Include zones**: Zone outlines with labels included
21. **Layer filtering**: Choose which layers to include in SVG export

#### 3D Presentation Renders
22. **Preset renders**: One-click export of 3D views from key angles (front, corner, top)
23. **High-quality**: Higher resolution, postprocessing enabled regardless of GPU tier
24. **Format**: PNG at 2x or 3x resolution

### Enhanced Toolbar

#### Categorized Structure
25. **Toolbar categories**: Group tools into logical sections with dropdown/flyout submenus:
    - **Place**: Hole types, zone drawing
    - **Measure**: Dimension tool, click-to-measure, ruler
    - **Annotate**: Text, arrows, callouts
    - **View**: 2D/3D/UV/walkthrough, camera presets, layers
    - **Export**: Screenshot, SVG, PDF, JSON, renders
26. **Category icons**: Each category gets a representative icon
27. **Dropdown menus**: Click category to see its tools; selected tool shows as active

#### Command Palette
28. **Trigger**: Ctrl+K (Cmd+K on Mac) opens palette
29. **Fuzzy search**: Type to filter all available actions (tools, toggles, exports, view modes)
30. **Keyboard shortcut display**: Each action shows its keyboard shortcut (if any)
31. **Recent actions**: Last 5-10 used actions pinned at top
32. **Categories**: Group results by category (same as toolbar categories)
33. **Execute**: Select an action to run it immediately

#### Context Menus
34. **Right-click on hole**: Show hole-specific actions (edit, delete, duplicate, move to front/back)
35. **Right-click on zone**: Zone actions (edit type, resize, delete, link budget)
36. **Right-click on annotation**: Edit, delete, change style
37. **Right-click on canvas**: Paste, add hole, add zone, measure from here

#### Keyboard Shortcuts Panel
38. **Enhanced panel**: Visual grid layout showing all shortcuts grouped by category
39. **Searchable**: Filter shortcuts by name
40. **Customizable** (stretch goal): Let user rebind shortcuts

### Mobile Adaptation
41. **Toolbar categories**: Mobile overflow menu reorganized into same categories
42. **Command palette**: Accessible via search icon in mobile toolbar
43. **Context menus**: Long-press triggers context menu on mobile

## Technical Considerations

### PDF Generation
- **Library**: `jsPDF` is the most mature client-side PDF library
- **SVG → PDF**: Could render the enhanced SVG from the floor plan export, then embed in PDF
- **Approach**: Render 2D view to canvas (print mode), export as image, embed in PDF with text overlays
- Alternative: Use `html2canvas` + `jsPDF` to capture the full 2D pane as an image
- For text/tables (budget report): `jsPDF`'s text API or `jspdf-autotable` plugin

### Command Palette
- **Library**: `cmdk` (by pacocoursey) — React component for command menus, used by Vercel, Linear
- **Integration**: Register all actions with their names, categories, shortcuts, and handler functions
- **Action registry**: Central `actionRegistry.ts` that all tools register into
- **Shortcut display**: Parse existing `useKeyboardControls.ts` for shortcut mappings

### Toolbar Reorganization
- The existing `Toolbar.tsx` is a single component with all buttons inline
- Refactor into: `ToolbarCategory` components with `ToolbarDropdown` for submenus
- Maintain backward compatibility: existing keyboard shortcuts and button positions shouldn't break muscle memory
- Progressive change: current flat toolbar becomes the default; categories are enhancement

### Material Schedule Computation
- Iterate over `holes` + `holeTemplates` to compute material quantities
- Each hole type has known dimensions (from `HOLE_TYPE_MAP`) — multiply by material requirements
- For custom templates: sum segment lengths × felt width for felt area, sum bumper lengths for wood
- Zones: polygon area × material type lookup table

## Dependencies
- **Depends on**:
  - Split 02 (dimensions — PDF includes dimension data)
  - Split 03 (annotations + zones — PDF includes them, material schedule uses zone data)
  - Split 06 (rich 2D — PDF uses print-quality 2D rendering)
- **Integrates with**: All other splits (command palette registers all actions from all features)
- **Provides**: PDF export, material schedule, reorganized toolbar, command palette

## Acceptance Criteria
- [ ] Dimensioned floor plan PDF generated client-side with title block, legend, scale bar
- [ ] Cost summary report PDF with budget breakdown tables
- [ ] Material schedule with per-hole and per-zone quantities
- [ ] Enhanced SVG export includes dimensions, annotations, zones
- [ ] 3D presentation renders at high quality from preset angles
- [ ] Toolbar reorganized into at least 4 categories with dropdowns
- [ ] Command palette opens with Ctrl+K, fuzzy-searches all actions
- [ ] Right-click context menus on holes, zones, annotations, canvas
- [ ] Keyboard shortcuts panel shows all shortcuts grouped by category
- [ ] All existing toolbar functionality preserved (no regression)
- [ ] Mobile: categories in overflow menu, command palette via search icon
