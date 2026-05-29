---
phase: 02-lifecycle-process-control
plan: 03
subsystem: lifecycle-api
tags: [express, lifecycle, process-manager, package-json, vitest, typescript]

requires:
  - phase: 02-lifecycle-process-control
    provides: shared lifecycle DTOs, package.json parsing, and in-memory process manager from Plans 01 and 02
provides:
  - Express lifecycle router for parse-scripts, start, stop, restart, status, and logs
  - App-level lifecycle route mounting before project CRUD routes
  - Integration coverage for script validation, lifecycle routing, controlled parser errors, and log/status responses
affects: [lifecycle-ui, project-form, log-viewer, operational-dashboard]

tech-stack:
  added: []
  patterns:
    - Express router factory with injected ProcessManager and RegistryRepository
    - Route-level scriptName validation against package.json before process execution
    - createApp dependency injection for process manager testing

key-files:
  created:
    - src/server/routes/lifecycle.ts
    - tests/server/lifecycle.test.ts
  modified:
    - src/server/app.ts

key-decisions:
  - "Lifecycle routes load projects from the registry and validate stored scriptName against package.json immediately before start and restart."
  - "createApp accepts an optional ProcessManager so integration tests can assert lifecycle routing without launching real processes."
  - "Lifecycle routes are mounted at /api/projects before CRUD routes so action/status/log paths are not shadowed by registry handlers."

patterns-established:
  - "Lifecycle route contract: createLifecycleRouter(processManager, repository) is the backend entry point for process actions."
  - "Controlled package parser errors: missing package.json maps to 404, malformed JSON maps to 400, and response bodies avoid raw path details."
  - "Execution guard: start and restart never fall back to startCommand or a default script when scriptName is missing or stale."

requirements-completed: [LIFE-01, LIFE-02, LIFE-03, LIFE-04]

duration: 4 min
completed: 2026-05-29
---

# Phase 02 Plan 03: Lifecycle API Routes Summary

**Express lifecycle API with package.json script validation before process start or restart**

## Performance

- **Duration:** 4 min
- **Started:** 2026-05-29T23:25:26Z
- **Completed:** 2026-05-29T23:29:05Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Added `createLifecycleRouter(processManager, repository)` with parse-scripts, start, stop, restart, status, and logs endpoints.
- Enforced the Phase 2 security rule that start/restart validate `project.scriptName` against the current `package.json` scripts before delegating to the process manager.
- Mounted lifecycle routes in `createApp()` before project CRUD routes and added process manager dependency injection for integration tests.
- Added integration tests covering parser errors, missing projects, missing/stale script names, app mount order, stop/restart/status/logs, and CRUD regression coverage.

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: Add failing lifecycle route tests** - `b987cce` (test)
2. **Task 1 GREEN: Implement lifecycle route script validation** - `ef0d3dc` (feat)
3. **Task 2 RED: Add failing app lifecycle wiring tests** - `896a3e7` (test)
4. **Task 2 GREEN: Wire lifecycle router into app** - `6500488` (feat)
5. **Task 3: Cover lifecycle status, stop, restart, and logs** - `ec34625` (test)

## Files Created/Modified

- `src/server/routes/lifecycle.ts` - New lifecycle router with controlled parse-scripts responses, project lookup, scriptName validation, and process manager delegation.
- `src/server/app.ts` - Mounts lifecycle routes before CRUD routes and accepts an optional injected process manager.
- `tests/server/lifecycle.test.ts` - Integration coverage for route behavior, app wiring, validation, parser errors, and lifecycle DTO responses.

## Decisions Made

- Project lookup uses the existing registry repository `listProjects()` API rather than expanding the repository contract in this plan.
- Start and restart return 400 for missing or stale `scriptName`; they do not use `startCommand`, infer `dev`, or call the process manager.
- Parser route responses intentionally return controlled user-actionable messages rather than raw filesystem exception text.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Task 3's added tests passed immediately because Task 1's router implementation already included stop, restart, status, and logs handlers. The explicit coverage was still committed to satisfy the plan's verification contract.

## Known Stubs

None. Stub-pattern scan found only intentional empty-object defaults in test helper parameters and no TODO/FIXME or placeholder implementation in files created or modified by this plan.

## TDD Gate Compliance

- RED commits present: `b987cce`, `896a3e7`
- GREEN commits present after RED: `ef0d3dc`, `6500488`
- Task 3 was test-only coverage and passed immediately because the behavior existed from Task 1.

## Verification

- `npx vitest run tests/server/lifecycle.test.ts --reporter=verbose` - PASS, 17 tests
- `npx vitest run tests/server/lifecycle.test.ts tests/server/projects.test.ts --reporter=verbose` - PASS, 30 tests
- `npx tsc --noEmit` - PASS

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 04 can build frontend lifecycle controls against executable backend endpoints for start, stop, restart, status, and logs. Plan 05 can call `/api/projects/parse-scripts` for the directory-to-script selection workflow.

## Self-Check: PASSED

- Created files exist on disk.
- Task commits `b987cce`, `ef0d3dc`, `896a3e7`, `6500488`, and `ec34625` exist in git history.
- Stub scan found no placeholders, TODOs, or FIXME markers in files created or modified by this plan.

---
*Phase: 02-lifecycle-process-control*
*Completed: 2026-05-29*
