---
phase: 01-project-registry-foundation
plan: 05
subsystem: ui
tags: [react, mui, typescript, registry, responsive, table, api-client]
requires:
  - phase: 01-02
    provides: shared-project-schema
  - phase: 01-04
    provides: yaml-registry-api-crud-routes
provides:
  - typed-api-client-for-registry
  - registry-page-state-flow
  - desktop-project-table
  - responsive-mobile-list
affects:
  - 01-06 (Project form drawer)
tech-stack:
  added:
    - "@testing-library/user-event"
  patterns:
    - "Typed fetch wrapper in src/client/api/ with ApiError class and field-level issues"
    - "Responsive display branching via MUI useMediaQuery"
    - "Monospace styling for paths, commands, ports, and URLs"
    - "Tooltip truncation for long command/path values"
    - "Component tests mock API module with vi.mock + vi.hoisted"
key-files:
  created:
    - path: src/client/api/projectsApi.ts
      purpose: "Typed fetch wrapper for list/create/update/delete with ApiError class"
    - path: src/client/components/ProjectRegistryPage.tsx
      purpose: "Registry page with loading, empty, error, and project display orchestration"
    - path: src/client/components/ProjectTable.tsx
      purpose: "Dense Material UI desktop table with all UI-SPEC columns"
    - path: src/client/components/ProjectMobileList.tsx
      purpose: "Compact responsive card list for narrow viewports"
    - path: tests/client/ProjectRegistryPage.test.tsx
      purpose: "20 component tests covering page states, table rendering, action callbacks"
  modified:
    - path: src/client/App.tsx
      purpose: "Render ProjectRegistryPage directly as first screen"
key-decisions:
  - "Responsive breakpoint uses theme.breakpoints.down('md') — jdsom test environment defaults to desktop table"
  - "Em-dash (—) for empty optional fields (port, healthUrl) matching UI-SPEC empty table value contract"
  - "ApiError class carries status + issues for field-level validation display in Plan 06 form"
  - "useMediaQuery at page level determines table vs mobile list; both components accept same project data and callback props"
  - "vi.mock + vi.hoisted pattern for mocking API module in component tests (Vitest hoisting requirement)"
requirements-completed:
  - REG-01
  - REG-02
  - REG-03
metrics:
  duration: "12 min"
  completed: "2026-05-29"
---

# Phase 1 Plan 05: Registry Page UI & Typed API Client

**First-screen Material UI registry dashboard with typed fetch API client, responsive desktop table / mobile list displays, and 20 component tests covering loading, empty, error, project rendering, and action callback wiring.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-05-29T14:19:00Z
- **Completed:** 2026-05-29T14:24:00Z
- **Tasks:** 2
- **Files created:** 5
- **Files modified:** 2

## Accomplishments

### Task 1: Typed API Client & Page Shell

- **`projectsApi.ts`**: Typed `fetch` wrapper with `listProjects`, `createProject`, `updateProject`, `deleteProject` functions. Exports `ApiError` class carrying HTTP `status` and optional Zod `issues` for field-level validation display.
- **`ProjectRegistryPage.tsx`**: First-screen registry page with on-mount data fetching, loading spinner, load-error alert + retry button, save-error alert (ready for Plan 06), empty state with UI-SPEC copy, and action hook callbacks (`onAddProject`, `onEditProject`, `onDeleteProject`) for Plan 06 wiring.
- **`App.tsx`**: Simplified to render `<ProjectRegistryPage />` directly, removing the previous disabled-button placeholder.
- **10 component tests**: Loading indicator, empty state, project rendering, error display, retry behavior, primary CTA presence, lifecycle control absence, and `onAddProject` callback.

### Task 2: Desktop Table & Mobile List

- **`ProjectTable.tsx`**: Dense Material UI `Table` with all UI-SPEC columns: Project (name + app URL), Host path, Container path, Command (truncated with Tooltip), Port (em-dash when empty), Health URL (em-dash when empty), Autostart (chip), Actions (edit/delete icon buttons). Monospace font stack for paths, commands, port, and URLs.
- **`ProjectMobileList.tsx`**: Compact card-based layout for narrow viewports. Each project card shows name, host path, container path, command, port, health URL, autostart chip, and edit/delete icon buttons.
- **Responsive branching**: `useMediaQuery(theme.breakpoints.down('md'))` in `ProjectRegistryPage` switches between table and mobile list.
- **10 additional tests**: Table column headers, project data rendering, edit/delete aria-labels, callback wiring with correct project object, empty dash rendering, autostart chip (On/Off), and env-value absence from registry display (T-01-05-01).
- **T-01-05-01 compliance**: No environment variable keys or values rendered in table or mobile list.

## Task Commits

Each task was committed atomically:

1. **Task 1: Create typed client API and registry page state flow** — `f22d9ff` (feat)
   _API client, page shell, App.tsx wiring, 10 component tests_

2. **Task 2: Build desktop and responsive registry displays** — `e8a2764` (feat)
   _Desktop table, mobile list, responsive integration, 10 additional tests_

## Files Created/Modified

### Created

- `src/client/api/projectsApi.ts` — Typed fetch wrapper with ApiError (list/create/update/delete)
- `src/client/components/ProjectRegistryPage.tsx` — Registry page state orchestration (loading/empty/error/projects)
- `src/client/components/ProjectTable.tsx` — Dense Material UI desktop table (8 columns)
- `src/client/components/ProjectMobileList.tsx` — Compact responsive card list
- `tests/client/ProjectRegistryPage.test.tsx` — 20 component tests

### Modified

- `src/client/App.tsx` — Render ProjectRegistryPage directly
- `package.json` / `package-lock.json` — Added `@testing-library/user-event` dependency

## Decisions Made

- **Responsive approach**: `useMediaQuery(theme.breakpoints.down('md'))` at the page level. jsdom test environment defaults to `false` (desktop), so all tests exercise the table component by default.
- **Em-dash for empty optional values**: `—` rendered in table cells when `port`, `healthUrl`, or `appUrl` are absent — matches UI-SPEC "Empty optional table value: -" contract.
- **ApiError.issues type**: Uses `FormattedIssue[]` from shared schema (`{path, message}`), preserving the same type the API returns in 400 responses.
- **Tooltip truncation threshold**: 60 characters before truncation with `...` — balances scanability against showing enough context.
- **Monospace font stack**: `ui-monospace, "Cascadia Code", "Fira Code", "Consolas", monospace` — platform-native monospace with developer-friendly fallbacks.
- **Autostart chip**: Uses `Chip` component with `success` color / `filled` variant for `On` and `default` color / `outlined` for `Off` — compact visual distinction without inline switch complexity.
- **Mobile list uses cards**: Bordered containers with `borderRadius: 1` and `bgcolor: background.paper` — distinct from table surface while maintaining visual hierarchy.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

- **Vitest mock hoisting**: `vi.mock` factory is hoisted to the top of the file, so `const mockListProjects = vi.fn()` needed to be wrapped in `vi.hoisted(() => vi.fn())` to avoid `Cannot access before initialization` error. Fixed before first commit.
- **Missing test dependency**: `@testing-library/user-event` was not installed. Added via `npm install -D` — the `package.json` and `package-lock.json` changes were included in the Task 1 commit.

## Threat Model Compliance

| Threat ID | Category | Disposition | Evidence |
|-----------|----------|-------------|----------|
| T-01-05-01 | Information Disclosure | mitigate | Env keys and values are absent from both table and mobile list. Test verifies they never appear in registry display. |
| T-01-05-02 | Tampering | mitigate | All mutations route through `projectsApi.ts` typed helpers; validation issues are preserved from API for form display. |
| T-01-05-03 | Elevation of Privilege | mitigate | No lifecycle execution controls rendered anywhere in the page. Test verifies absence of start/stop/restart buttons. |
| T-01-05-04 | Spoofing | accept | Phase 1 is trusted single-user local software; no authentication in scope. |

## Next Phase Readiness

- **API client** is ready for Plan 06 to call `createProject`, `updateProject`, `deleteProject` from the form drawer — all typed with proper error handling.
- **Page state** is ready for Plan 06 to wire `onAddProject`, `onEditProject`, `onDeleteProject` callbacks to the form drawer and delete dialog.
- **Save error state** (`saveError` / `setSaveError`) is pre-wired in `ProjectRegistryPage` — Plan 06 can call `setSaveError` from mutation handlers.
- **Edit/delete callback wiring** passes the full `ProjectConfig` object — Plan 06 form drawer receives the project to edit directly.
- **All 80 tests pass** across 4 test files. Vite production build and TypeScript `--noEmit` both pass clean.

## Self-Check

| Check | Status |
|-------|--------|
| `src/client/api/projectsApi.ts` exists | ✅ Found |
| `src/client/components/ProjectRegistryPage.tsx` exists | ✅ Found |
| `src/client/components/ProjectTable.tsx` exists | ✅ Found |
| `src/client/components/ProjectMobileList.tsx` exists | ✅ Found |
| `tests/client/ProjectRegistryPage.test.tsx` exists | ✅ Found |
| Task 1 commit `f22d9ff` in git log | ✅ Found |
| Task 2 commit `e8a2764` in git log | ✅ Found |
| `npm test -- --run` — 80/80 pass | ✅ Verified |
| `npm run build` — tsc + vite pass | ✅ Verified |
| No env values in table/list | ✅ Verified (test passes) |
| No lifecycle controls | ✅ Verified (test passes) |

## Self-Check: PASSED

---

*Phase: 01-project-registry-foundation*
*Completed: 2026-05-29*
