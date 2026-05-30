---
phase: 03-operational-dashboard-status-and-logs
plan: 01
subsystem: backend
tags: [health-check, port-occupancy, tcp-connect, process-states, express, zod]

# Dependency graph
requires:
  - phase: 02-lifecycle-process-control
    provides: lifecycle routes, ProcessManager, processStateSchema, projectSchema
provides:
  - unhealthy process state variant (OBS-01)
  - TCP port occupancy detection (OBS-04)
  - HTTP health URL reachability check (OBS-02)
  - Pre-start port conflict blocking (409 Conflict)
  - State transitions: running↔unhealthy via health endpoint
  - ProcessManager.setState() for external state transitions
affects:
  - 03-02-PLAN.md (client health polling, Port column UI, unhealthy UI display)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - AbortController-based timeouts for socket/http health checks
    - Error class pattern (PortOccupiedError, HealthCheckTimeoutError)
    - State transition pattern (running↔unhealthy via health endpoint)
    - scoped vi.mock with vi.hoisted in Vitest 4 for Node built-in mocking

key-files:
  created:
    - src/server/services/healthCheck.ts
    - tests/server/healthCheck.test.ts
  modified:
    - src/shared/lifecycleSchema.ts
    - src/server/process/processManager.ts
    - src/server/routes/lifecycle.ts
    - tests/server/lifecycle.test.ts

key-decisions:
  - "checkPortOccupied always returns { occupied: true/false }. Pre-start: occupied=true → block start. Post-start: occupied=false → unhealthy"
  - "Health endpoint transitions state (running→unhealthy, unhealthy→running) based on concurrent port + healthUrl checks"
  - "Pre-start port check runs before script validation to fail fast without package.json I/O"
  - "AbortController-based timeouts (2s) for both port and health checks (T-03-02 DoS mitigation)"
  - "setState added to ProcessManager interface — state transitions happen at the route layer, not inside processManager"
  - "Mocked node:net and node:http at file level in tests for isolated unit testing, with vi.spyOn for route-level mocks"

patterns-established:
  - "Health check services: exported async functions with typed error classes, no class wrapper"
  - "Route-level state transitions: health endpoint checks project health and transitions state atomically"

requirements-completed:
  - OBS-01
  - OBS-02
  - OBS-04
  - UI-02

# Metrics
duration: 8min
completed: 2026-05-30
---

# Phase 03 Plan 01: Health Check Backend Summary

**`unhealthy` process state variant, TCP port occupancy detection, HTTP health URL reachability checks, and GET /:id/health endpoint with state transition wiring**

## Performance

- **Duration:** 8 min
- **Started:** 2026-05-30T15:02:12Z
- **Completed:** 2026-05-30T15:10:29Z
- **Tasks:** 2
- **Files modified:** 8 (2 created, 6 modified)

## Accomplishments

- Added `unhealthy` variant to `processStateSchema` Zod enum between `running` and `stopping`, with `PortCheckResult`, `HealthCheckResult`, and `HealthStatus` type exports
- Created `src/server/services/healthCheck.ts` with `checkPortOccupied` (TCP connect with AbortController timeout), `checkHealthUrl` (HTTP GET with 2xx validation), and `checkProjectHealth` (concurrent port + health check runner)
- Added `setState(projectId, state)` to `ProcessManager` interface and implementation; updated `start()`, `stop()`, `restart()` guards to handle `unhealthy` state (start skips, stop allows, restart stops then restarts)
- Added `GET /api/projects/:id/health` endpoint that runs port and health URL checks for running/unhealthy projects, transitions `running→unhealthy` on failure and `unhealthy→running` on recovery
- Added pre-start port occupancy check to `POST /api/projects/:id/start` returning 409 Conflict when port is already in use
- Updated `ProjectTable.tsx` and `ProjectMobileList.tsx` with unhealthy state entries in STATUS_* constants, pulse animation, and action matrix (Rule 3: TS compilation fix)
- 19 new tests covering unit (checkPortOccupied, checkHealthUrl), service (processManager setState), and route-level (health endpoint, state transitions, pre-start check) behavior

## Task Commits

Each task was committed atomically:

1. **Task 1: Add 'unhealthy' to processStateSchema and create healthCheck service** — `692b4ec` (feat)
2. **Task 2: Add GET /:id/health endpoint, pre-start port check, app wiring, and server tests** — `646c5d8` (feat)

**Plan metadata:** Pending final commit

## Files Created/Modified

- `src/shared/lifecycleSchema.ts` — Added `unhealthy` enum variant, `PortCheckResult`, `HealthCheckResult`, `HealthStatus` Zod schemas and types
- `src/server/services/healthCheck.ts` **[NEW]** — `checkPortOccupied`, `checkHealthUrl`, `checkProjectHealth` async functions with error classes
- `src/server/process/processManager.ts` — Added `setState` method, updated start/stop/restart guards for `unhealthy`
- `src/server/routes/lifecycle.ts` — Added `GET /:id/health` endpoint, pre-start port check on `POST /:id/start`
- `src/client/components/ProjectTable.tsx` — Added unhealthy entries to STATUS_* constants, pulse animation, canStop/canRestart (Rule 3)
- `src/client/components/ProjectMobileList.tsx` — Added unhealthy entries to STATUS_* constants, pulse animation, canStop/canRestart (Rule 3)
- `tests/server/healthCheck.test.ts` **[NEW]** — 19 tests covering all new functionality
- `tests/server/lifecycle.test.ts` — Added `setState: vi.fn()` to mock

## Decisions Made

- **Port check semantics:** `checkPortOccupied` returns `{ occupied: true/false }` universally. Pre-start: occupied → block. Post-start: not occupied → unhealthy. Keeps API consistent across both use cases.
- **Health endpoint state transitions:** The health check endpoint is the sole driver of `unhealthy↔running` transitions. The `running→unhealthy` transition triggers when any configured check (port or health URL) fails; `unhealthy→running` triggers when all checks pass.
- **Pre-start check before script validation:** Port check runs before `validateProjectScript` (which reads `package.json`) to fail fast without unnecessary I/O.
- **AbortController-based timeouts:** Both port and health checks use 2s AbortController timeouts to prevent runaway connections (T-03-02 mitigation). No `socket.setTimeout` for consistency.
- **setState at route layer:** `setState` is added to ProcessManager but only used externally by the health endpoint, keeping processManager focused on process lifecycle rather than health state management.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] UI component enum expansion from TypeScript compilation**
- **Found during:** Task 1 (after adding unhealthy to processStateSchema)
- **Issue:** Adding `unhealthy` to the ProcessState enum broke TypeScript compilation in `ProjectTable.tsx` and `ProjectMobileList.tsx` because their `STATUS_COLORS`, `STATUS_VARIANTS`, and `STATUS_LABELS` `Record<ProcessState, ...>` types require all enum keys to be present
- **Fix:** Added `unhealthy` entries to all three STATUS_* constants in both components, updated `isTransition` check for pulse animation, and updated `canStop`/`canRestart` to accept `unhealthy`
- **Files modified:** `src/client/components/ProjectTable.tsx`, `src/client/components/ProjectMobileList.tsx`
- **Verification:** TypeScript compilation passes with no errors
- **Committed in:** `692b4ec` (Task 1 commit)

### Planned UI Updates Deferred
The plan intentionally did NOT add the Port column or client health polling — these are scoped to Plan 03-02 (Wave 2). The UI components were minimally updated only to fix the type errors from the enum change.

---

**Total deviations:** 1 auto-fixed (1 Rule 3 blocker)
**Impact on plan:** Auto-fix was required for the enum expansion to compile. UI updates per CONTEXT.md are deferred to Plan 03-02. No scope creep.

## Issues Encountered

- **Windows EBUSY cleanup:** Test temp directory cleanup failed with EBUSY because spawned child processes from `processManager.start()` hold temp directory handles. Added `forceRmDir()` helper with 30 retries at 100ms intervals to allow process handles to release before cleanup.
- **Vitest 4 vi.mock scoping:** `vi.mock` calls inside `describe` blocks in Vitest 4 emit deprecation warnings. All mocks need to be at the file top level using `vi.hoisted` for factory variables. Reorganized test file to use file-level mocks for `node:net`, `node:http`, `node:https` with `vi.spyOn` for route-level healthCheck function mocks.

## Next Phase Readiness

- Backend foundation for Phase 3 is complete. `unhealthy` state is a valid process state throughout the application.
- Server exposes `GET /api/projects/:id/health` returning structured health results.
- Pre-start port blocking works with 409 Conflict.
- Ready for Plan 03-02 (Wave 2): client health polling, Port column UI, unhealthy display, and error handling.

---
*Phase: 03-operational-dashboard-status-and-logs*
*Completed: 2026-05-30*
