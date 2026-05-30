---
quick_id: 260530-grq
status: complete
completed: 2026-05-30
---

# Summary: Implement Aurora Theme

Implemented an Aurora dark Material UI theme for devctl and replaced the log dialog flow with inline expandable live logs.

## Changes

- Replaced the neutral dashboard theme with Aurora-derived dark palette tokens, including deep blue-grey surfaces, blue primary, purple secondary, green success, orange warning, red error, and cyan info colors.
- Added MUI component overrides for buttons, icon buttons, table containers, table headers, rows, chips, tooltips, outlined inputs, drawers, dialogs, alerts, and list item buttons.
- Added package-managed `@fontsource` dependencies for Plus Jakarta Sans and Spline Sans Mono.
- Imported latin font subsets in `src/client/main.tsx`.
- Aligned hard-coded monospace stacks in project table, mobile list, form drawer, and log viewer with Spline Sans Mono.
- Added `src/client/vite-env.d.ts` so TypeScript accepts Vite CSS side-effect imports.
- Added `LiveProjectLogs`, a reusable inline log panel that polls while mounted, shows current stdout/stderr, exposes a refresh action, and includes run history.
- Changed project log buttons to expand/collapse inline logs in the project table and mobile list.

## Verification

- `npm run build` passed.
- `npx vitest run tests/client/ProjectRegistryPage.test.tsx tests/client/ProjectFormDrawer.test.tsx tests/client/LogViewerDialog.test.tsx --reporter=verbose` passed: 54 tests across 3 files.

## Notes

- Context7 was used for Material UI dark mode/theming and Accordion/Collapse guidance, and React interval cleanup guidance.
- Local dev server responded on `http://127.0.0.1:5273`; no Chrome or Edge binary was available for a headless screenshot.
