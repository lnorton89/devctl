---
phase: 01-project-registry-foundation
plan: 03
subsystem: app-shell
tags: [react, express, material-ui, vite, app-shell, theming, frontend-entry, backend-factory]
requires:
  - phase: 01-01
    provides: build-toolchain, vite-config, react-express-deps
  - phase: 01-02
    provides: shared-project-schema
provides:
  - vite-client-entry
  - mui-operational-dashboard-theme
  - express-app-factory
  - server-startup-entry
  - health-endpoint
affects:
  - 01-04 (Express registry API routes)
  - 01-05 (Registry page state flow)
  - 01-06 (Project form drawer)
tech-stack:
  added:
    - package: "@types/react-dom"
      version: "^19.1.4"
      reason: Missing type definition for react-dom/client — required for build
  patterns:
    - "MUI theme in src/client/theme.ts with UI-SPEC color palette, compact typography, component overrides"
    - "Express app factory pattern (createApp) for testable route mounting"
    - "No request-body or env-value logging per D-06"
key-files:
  created:
    - path: index.html
      purpose: "Vite HTML entry point with module script reference to main.tsx"
    - path: src/client/main.tsx
      purpose: "React root rendering with StrictMode, ThemeProvider, and CssBaseline"
    - path: src/client/App.tsx
      purpose: "First-screen Projects registry shell with Add project placeholder"
    - path: src/client/theme.ts
      purpose: "Material UI operational dashboard theme with UI-SPEC tokens"
    - path: src/server/app.ts
      purpose: "Express createApp() factory with JSON body limit and /api/health"
    - path: src/server/index.ts
      purpose: "Server startup entry from PORT env (default 3001)"
  modified:
    - path: package.json
      purpose: "Added @types/react-dom devDependency"
    - path: package-lock.json
      purpose: "Updated lockfile after dependency addition"
key-decisions:
  - "256kb JSON body limit selected per T-01-03-03 (DoS mitigation) — sufficient for registry mutations"
  - "MUI defaultProps string literals cast via 'as const' to satisfy strict TypeScript 6 createTheme type inference"
  - "Server startup logs only port number — no request bodies or env values per D-06"
  - "App.tsx uses disabled Add project button with aria-label — placeholder for Plan 06 without fake interactive state"
patterns-established:
  - "MUI theme separated to src/client/theme.ts for testable, importable theme configuration"
  - "Express app created via factory function (createApp) so tests can import without side effects"
  - "D-06 compliance: explicit no-logging for request bodies and env values"
requirements-completed:
  - REG-01
  - REG-02
  - REG-03
  - REG-04
metrics:
  duration: "9 min"
  completed: "2026-05-29"
---

# Phase 1 Plan 03: Minimal React and Express App Shell

**Vite/React/MUI frontend shell with operational dashboard theme (UI-SPEC colors and compact typography), first-screen Projects registry placeholder, Express createApp() factory with JSON body limit and `/api/health` endpoint, and server startup entry from PORT env (default 3001).**

## Performance

- **Duration:** 9 min
- **Started:** 2026-05-29T14:06:00Z
- **Completed:** 2026-05-29T14:15:00Z
- **Tasks:** 1
- **Files created:** 6
- **Files modified:** 2

## Accomplishments

- **Vite HTML entry point** (`index.html`) — references `src/client/main.tsx` as the module entry, sets up `#root` mount point, includes viewport and description metadata.
- **Material UI theme** (`src/client/theme.ts`) — implements UI-SPEC color palette (`#f7f8fa` background, `#ffffff` surface, `#17202a` primary text, `#1976d2` accent), compact typography tokens (14px body, 12px labels/table headers, 20px page title at 600 weight), and component overrides for dense operational dashboard (small switches/textfields/iconbuttons, no button elevation, compact table cells).
- **React root** (`src/client/main.tsx`) — wraps `<App />` in `StrictMode`, `ThemeProvider`, and `CssBaseline` per MUI theming best practices.
- **First-screen Projects shell** (`src/client/App.tsx`) — renders "Projects" page title with disabled "Add project" button and empty-state copy ("No projects registered" / "Add a local app so devctl can manage its configuration."). No lifecycle controls, logs, health polling, port checks, or fake data.
- **Express app factory** (`src/server/app.ts`) — `createApp()` returns a configured Express instance with `express.json({ limit: '256kb' })` (T-01-03-03 DoS mitigation) and `GET /api/health` returning `{ ok: true }`. Does not log request bodies or env values (D-06, T-01-03-01).
- **Server startup** (`src/server/index.ts`) — reads `PORT` env (default 3001), starts Express app, logs only port on startup.
- **Build passes** — `npm run build` (tsc + vite) and `npm test -- --run` both pass clean.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add minimal app shell entry points** — `2d17070` (feat)

**Plan metadata commit** — will be created after summary and state updates.

## Files Created/Modified

### Created
- `index.html` — Vite HTML entry with module script
- `src/client/App.tsx` — Projects registry shell with placeholder button
- `src/client/main.tsx` — React root with ThemeProvider + CssBaseline
- `src/client/theme.ts` — MUI operational dashboard theme
- `src/server/app.ts` — Express `createApp()` factory
- `src/server/index.ts` — Server startup entry point

### Modified
- `package.json` — Added `@types/react-dom` devDependency
- `package-lock.json` — Updated lockfile

## Decisions Made

- **256kb JSON body limit** (T-01-03-03): Selected as sufficient for registry mutations (project config objects are small). Future plans may adjust if needed.
- **MUI defaultProps type compatibility**: Material UI 9's `createTheme` expects specific union types for `size` and `variant` defaultProps. `as const` assertions satisfy strict TypeScript 6 without runtime impact.
- **Disabled Add project button**: The button is rendered with `disabled` and an `aria-label` rather than omitted — this avoids introducing fake interactive state (no onClick, no form wiring) while making the visual placeholder structural for Plan 06.
- **Server logs port only**: Following D-06, the only console output is the startup port number. No request bodies, env values, or configuration details are logged.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Missing @types/react-dom type definitions**
- **Found during:** Task 1 (build verification)
- **Issue:** TypeScript compilation failed with `TS7016: Could not find a declaration file for module 'react-dom/client'`. React 19 ships `react-dom/client` as an ESM module without bundled types.
- **Fix:** Added `@types/react-dom` to devDependencies (`npm install -D @types/react-dom`).
- **Files modified:** `package.json`, `package-lock.json`
- **Verification:** `npm run build` passes after install.
- **Committed in:** `2d17070` (Task 1 commit)

**2. [Rule 1 - Bug] MUI createTheme defaultProps type incompatibility**
- **Found during:** Task 1 (build verification)
- **Issue:** Material UI 9 `createTheme` `Components` type requires `OverridableStringUnion` types for `size` and `variant` defaultProps. Inline string literals widen to `string` and fail strict TypeScript 6 checks. Affected components: MuiIconButton, MuiSwitch, MuiTextField.
- **Fix:** Added `as const` assertions to inline string literals in defaultProps.
- **Files modified:** `src/client/theme.ts`
- **Verification:** `npm run build` passes after fix.
- **Committed in:** `2d17070` (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both auto-fixes necessary for build correctness. No scope creep.

## Issues Encountered

- **Material UI 9 createTheme type strictness**: The `Components` type in MUI 9 requires narrowly-typed union strings for component defaultProps. Using `as const` on literal values resolves this. This is a MUI 9 strictness improvement from earlier MUI versions and should be treated as a standard pattern for future theme work.

## Threat Model Compliance

| Threat ID | Category | Disposition | Evidence |
|-----------|----------|-------------|----------|
| T-01-03-01 | Information Disclosure | mitigate | `app.ts` uses `express.json()` only — no request-body logging. `index.ts` logs only port number. D-06: no env values logged. |
| T-01-03-02 | Elevation of Privilege | mitigate | `App.tsx` renders a disabled placeholder button with no start/stop/restart event handlers or command execution. |
| T-01-03-03 | Denial of Service | mitigate | `express.json({ limit: '256kb' })` bounds request body size for registry mutations. |
| T-01-03-04 | Spoofing | accept | No auth or session surface introduced — scope unchanged. |

## Next Phase Readiness

- **Frontend**: Theme and App shell ready. Plan 05 (registry page) can add a project table to `App.tsx` and client-side data fetching.
- **Backend**: `createApp()` factory is testable and ready for Plan 04 route mounting (`GET/POST/PUT/DELETE /api/projects`). `src/server/index.ts` can start the Express server with routes.
- **Health endpoint**: `/api/health` is live at app creation — downstream plans can verify server is running.

## Self-Check

| Check | Status |
|-------|--------|
| `index.html` exists | ✅ Found |
| `src/client/main.tsx` exists | ✅ Found |
| `src/client/App.tsx` exists | ✅ Found |
| `src/client/theme.ts` exists | ✅ Found |
| `src/server/app.ts` exists | ✅ Found |
| `src/server/index.ts` exists | ✅ Found |
| Task commit `2d17070` in git log | ✅ Found |
| `npm run build` passes | ✅ Verified |
| `npm test -- --run` passes | ✅ Verified |

## Self-Check: PASSED

---

*Phase: 01-project-registry-foundation*
*Completed: 2026-05-29*
