---
phase: 03-operational-dashboard-status-and-logs
plan: 02
subsystem: ui
tags: [health-polling, port-column, unhealthy-state, polling, mui-table, responsive-ui]

# Dependency graph
requires:
  - phase: 03-01
    provides: GET /:id/health endpoint, HealthStatus type, pre-start port check
provides:
  - Client-side checkProjectHealth API function (OBS-02)
  - Desktop Port column with green/red/grey indicator dot (OBS-04, UI-01)
  - Mobile Port metadata row (OBS-04, UI-01)
  - Health polling in ProjectRegistryPage for running/unhealthy projects (OBS-01)
  - 409 error snackbar display for pre-start port conflicts (OBS-04)
  - Clear health status on lifecycle actions and polling stop
affects:
  - 04-autostart (health status is part of the operational state model)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Health polling as extension of existing process polling loop
    - Conditional Port column collapsing based on project data
    - HealthStatus map lifecycle: clear on action, poll for running/unhealthy, delete on stop
    - Port indicator dot tristate: green (occupied), red (unoccupied), grey (unknown)

key-files:
  created: []
  modified:
    - src/client/api/projectsApi.ts
    - src/client/components/ProjectTable.tsx
    - src/client/components/ProjectMobileList.tsx
    - src/client/components/ProjectRegistryPage.tsx
    - tests/client/ProjectRegistryPage.test.tsx

key-decisions:
  - "checkProjectHealth follows the exact handleResponse<T> pattern as getProjectLogs (same API path construction, same error handling)"
  - "Port column uses hasPortConfig = projects.some(p => p.port != null) — collapses when no project has a port, visible when any does"
  - "Port indicator dot: green for occupied=true (responding), red for occupied=false (not responding), grey for no data yet"
  - "Health polling runs inside the existing 1s interval alongside process status — only for running/unhealthy states"
  - "Health status is deleted from the map (not reset) when polling stops or lifecycle actions fire — prevents stale indicators"

patterns-established:
  - "Health polling as extension: checkProjectHealth call is inserted in the same interval callback as getProjectStatus, with independent error handling"
  - "Port column conditional rendering: computed once from projects array, used for both header and body cells"

requirements-completed:
  - OBS-01
  - OBS-02
  - OBS-04
  - UI-01
  - UI-02
  - UI-03

# Metrics
duration: 12min
completed: 2026-05-30
---

# Phase 03 Plan 02: Client Health Polling, Port Column, and Unhealthy Display Summary

**Desktop Port column with green/red status indicator, mobile Port metadata row, health polling for running/unhealthy projects, and 409 port-occupied error snackbar**

## Performance

- **Duration:** 12 min
- **Started:** 2026-05-30T15:14:00Z
- **Completed:** 2026-05-30T15:26:00Z
- **Tasks:** 4
- **Files modified:** 5

## Accomplishments

- Added `checkProjectHealth` client API function in `projectsApi.ts` following the existing `handleResponse<HealthStatus>` pattern
- Added conditional Port column to ProjectTable between Command and Status columns with green (occupied), red (unoccupied), or grey (unknown) indicator dot
- Added Port metadata row to ProjectMobileList shown when project has `port` configured
- Added `healthStatuses` state (`Map<string, HealthStatus>`) to ProjectRegistryPage with lifecycle-aware management
- Extended the 1s polling loop to call `checkProjectHealth(projectId)` only for `running` or `unhealthy` states
- Cleared health status on polling stop (terminal states and error paths) and on lifecycle actions (start/stop/restart)
- Passed `healthStatuses` prop to both ProjectTable and ProjectMobileList
- 3 new tests covering health polling after start, no health polling for stopped projects, and port-occupied error snackbar display

## Task Commits

Each task was committed atomically:

1. **Task 1: Add checkProjectHealth client API function** — `a3fee9b` (feat)
2. **Task 2: Update ProjectTable with Port column, healthStatuses prop** — `40241ca` (feat)
3. **Task 3: Update ProjectMobileList with Port metadata row, healthStatuses prop** — `a5526ee` (feat)
4. **Task 4: Wire health polling into ProjectRegistryPage and extend tests** — `b6be3fa` (feat)

## Files Created/Modified

- `src/client/api/projectsApi.ts` — Added `HealthStatus` import and `checkProjectHealth(id)` API function
- `src/client/components/ProjectTable.tsx` — Added `HealthStatus` import, `healthStatuses` prop, conditional Port column with indicator dot, updated `colSpan` for log row
- `src/client/components/ProjectMobileList.tsx` — Added `HealthStatus` import, `healthStatuses` prop, conditional Port metadata row
- `src/client/components/ProjectRegistryPage.tsx` — Added `HealthStatus` import, `checkProjectHealth` import, `healthStatuses` state, health polling in interval callback, health clearing on stop/action, prop pass-through to children
- `tests/client/ProjectRegistryPage.test.tsx` — Added `mockCheckProjectHealth`, 3 new tests for health polling and port-occupied error display

## Decisions Made

- **checkProjectHealth follows the exact handleResponse<T> pattern** as `getProjectLogs` — same API base path construction, same error handling via `handleResponse`, same `encodeURIComponent` pattern.
- **Port column uses `hasPortConfig` computed from projects array** — if any project has `port != null`, the column renders in both header and body; otherwise it collapses entirely.
- **Port indicator dot tristate**: green (`success.main`) when `occupied === true` (our process is listening), red (`error.main`) when `occupied === false` (not responding), grey (`grey.400`) when no health data yet.
- **Health polling runs inside the existing 1s interval** alongside process status — no separate timer or interval needed. Only fires for `running` or `unhealthy` states.
- **Health status is deleted from the map** (not reset to default) when polling stops or lifecycle actions fire — prevents stale indicators from persisting across state transitions.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

- **Health polling test timing**: The first health polling test required clicking Start and waiting for the 1s interval to fire. Used `waitFor` with `{ timeout: 3000 }` and `mockResolvedValueOnce`/`mockResolvedValue` sequencing to reliably catch the polling call. Test takes ~1100ms which is acceptable.

## Next Phase Readiness

- Phase 3 is now feature-complete: unhealthy state, port occupancy detection, health URL reachability, Port column, health polling, and pre-start error display are all implemented and tested.
- Ready for Phase 4 (Autostart Automation).

## Self-Check: PASSED

- All 5 files created/modified confirmed on disk ✓
- All 4 commits found in git history ✓
- Full test suite: 13 files, 215 tests, 0 failures ✓
- TypeScript compilation: 0 errors ✓

---

*Phase: 03-operational-dashboard-status-and-logs*
*Completed: 2026-05-30*
