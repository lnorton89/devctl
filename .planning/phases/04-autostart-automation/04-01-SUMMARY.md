---
phase: 04-autostart-automation
plan: 01
subsystem: server
tags: [autostart, boot, process-manager, registry]
requires:
  - phase: 02-lifecycle-process-control
    provides: ProcessManager interface with start/stop/restart
  - phase: 01-project-registry-foundation
    provides: RegistryRepository with listProjects, registry persistence
provides:
  - Server-side autostart boot engine — parallel startup of autostart-enabled projects
  - Shared repository and processManager instances for API route visibility
affects: [04-autostart-automation, 05-docker-boot-runtime]
tech-stack:
  added: []
  patterns:
    - "Autostart module: async function with injected dependencies, Promise.allSettled for parallel execution, per-project error isolation"
    - "Server entry point: lift shared instances to prevent duplicate registry/process state"
key-files:
  created:
    - src/server/autostart/autostart.ts
    - tests/server/autostart.test.ts
  modified:
    - src/server/index.ts
key-decisions:
  - "Parallel startup via Promise.allSettled — one failing project does not block others"
  - "No retry on failure — errors captured in result and surfaced through process status/logs"
  - "Shared repository and processManager instances in index.ts ensure autostart-started processes visible to API routes"
  - ".catch handler prevents unhandled rejections from the top-level autostart promise"
patterns-established:
  - "Autostart module: pure TypeScript module with injected dependencies, no Express imports"
  - "Validation before delegation: check scriptName/hostPath exist before calling processManager.start"
requirements-completed: [AUTO-02]
duration: 3min
completed: 2026-05-30
---

# Phase 04 Plan 01: Autostart Boot Engine Summary

**Server-side autostart boot engine with parallel startup of autostart-enabled projects, wired into the Express listen() callback**

## Performance

- **Duration:** 3 min
- **Started:** 2026-05-30T20:40:42Z
- **Completed:** 2026-05-30T20:43:44Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Created `autostartProjects()` function that reads the registry, filters projects with `autostart: true`, and starts them in parallel via `Promise.allSettled`
- Implemented per-project error isolation — individual start failures do not block other projects from starting
- Added validation of `scriptName` and `hostPath` before delegating to `processManager.start()`
- Wired autostart into the server entry point with shared `repository` and `processManager` instances so autostart-started processes are visible to API routes
- Added 7 unit tests covering all scenarios: autostart enabled, skipped, empty registry, individual failure isolation, missing scriptName, missing hostPath, and empty project list
- Threat model mitigations: T-04-01 (validation before processManager.start), T-04-02 (Promise.allSettled isolation), T-04-03 (only `[autostart]` prefix + error.message logged)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create autostart module** — `415c094` (feat: create autostart boot engine)
2. **Task 2: Wire autostart into server entry point** — `e7bc2f3` (feat: wire autostart into server entry point)
3. **Task 3: Create autostart module unit tests** — `722d2ad` (test: add autostart module unit tests)

## Files Created/Modified

- `src/server/autostart/autostart.ts` — Autostart boot engine: `autostartProjects()` function, `AutostartResult` and `AutostartError` types
- `src/server/index.ts` — Server entry point: shared repository/processManager instances, autostart wired into listen callback with `.catch` handler
- `tests/server/autostart.test.ts` — 7 unit tests with inline mock objects covering startup, filtering, error isolation, and validation

## Decisions Made

- **Parallel startup:** Used `Promise.allSettled` instead of sequential iteration — consistent with CONTEXT.md decision (parallel startup, no retry)
- **No retry on failure:** Errors captured in `AutostartResult.errors[]` — user retries manually from the dashboard
- **Shared instances:** `repository` and `processManager` created in `index.ts` and injected into both `createApp()` and `autostartProjects()` — critical for API route visibility of autostarted processes
- **Top-level error handling:** `.catch()` on the returned promise prevents unhandled rejections from crashing the server
- **Validation before delegation:** Check `scriptName` and `hostPath` before calling `processManager.start()` — implements T-04-01 mitigation

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None — all tasks executed cleanly.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Server-side autostart engine is complete — reads registry, filters autostart projects, starts them in parallel
- Ready for Plan 04-02: client-side autostart toggle UI (inline Switch in desktop table and mobile list)
- No blockers for Plan 04-02 — no file overlap between plans

## Self-Check: PASSED

- [x] All 3 created/modified files exist on disk
- [x] All 3 commits found in git history
- [x] TypeScript compilation passes (no server errors)
- [x] All 102 server tests pass (7 autostart + 95 existing, zero regressions)

---

*Phase: 04-autostart-automation*
*Completed: 2026-05-30*
