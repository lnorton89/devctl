---
phase: 02-lifecycle-process-control
plan: 02
subsystem: lifecycle-process-control
tags: [child-process, process-manager, ring-buffer, vitest, typescript]

requires:
  - phase: 02-lifecycle-process-control
    provides: shared lifecycle DTOs and package script parsing from Plan 01
provides:
  - Bounded FIFO log buffer with 4096-character line truncation
  - In-memory process manager for start, stop, restart, status, and logs
  - Graceful-then-force process tree termination behavior for Unix and Windows
affects: [lifecycle-api, registry-ui, log-viewer, process-control]

tech-stack:
  added: []
  patterns:
    - Node child_process.spawn command-string execution with shell, detached process groups, and stdio pipes
    - In-memory process registry with current run plus five-run history cap
    - Ring-buffered stdout, stderr, and recent tail capture

key-files:
  created:
    - src/server/process/ringBuffer.ts
    - src/server/process/processManager.ts
    - tests/server/processManager.test.ts
  modified: []

key-decisions:
  - "ProcessManager keeps lifecycle state in a private in-memory Map so server restart re-evaluates projects as stopped."
  - "Run history remains attached to a project across subsequent starts and is capped at five completed runs."
  - "Stop behavior uses process.kill(-pid, signal) on Unix and argument-array taskkill calls on Windows."

patterns-established:
  - "ProcessManager contract: downstream lifecycle routes should call start(projectId, scriptName, cwd), stop(projectId), restart(projectId, scriptName, cwd), getStatus(projectId), and getLogs(projectId)."
  - "Log capture pattern: process output is split into lines, capped per line by ringBuffer.ts, and mirrored into shared RunRecord DTO arrays."

requirements-completed: [LIFE-01, LIFE-02, LIFE-03, LIFE-04]

duration: 5 min
completed: 2026-05-29
---

# Phase 02 Plan 02: In-Memory Process Manager Summary

**Spawn-backed in-memory process manager with bounded logs, run history, and graceful process-tree shutdown**

## Performance

- **Duration:** 5 min
- **Started:** 2026-05-29T23:17:29Z
- **Completed:** 2026-05-29T23:22:19Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Added a bounded FIFO ring buffer that caps both entry count and individual log-line length.
- Implemented `createProcessManager()` with start, stop, restart, status, logs, current run, and five-run history behavior.
- Added unit coverage using mocked child processes so no real user commands execute during tests.
- Covered Unix and Windows graceful-then-force stop semantics with fake timers and restored platform overrides.

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement bounded ring buffer** - `52a1a61` (feat)
2. **Task 2: Implement process manager lifecycle state machine** - `f831c3f` (feat)
3. **Task 3: Implement graceful-then-force stop behavior** - `58f550b` (test)

## Files Created/Modified

- `src/server/process/ringBuffer.ts` - Bounded FIFO buffer with wraparound, `clear`, length reporting, and 4096-character line truncation.
- `src/server/process/processManager.ts` - In-memory lifecycle engine using `child_process.spawn`, bounded output capture, run history, restart, and cross-platform stop behavior.
- `tests/server/processManager.test.ts` - Unit coverage for ring buffer behavior, process lifecycle transitions, log history, duplicate starts, spawn errors, and platform-specific stop escalation.

## Decisions Made

- Process manager state is intentionally private and in-memory, matching D-09 and avoiding any persisted runtime state.
- Completed run history is preserved when a new run starts for the same project, then capped to the last five runs.
- Windows stop uses `execFile('taskkill', args)` with argument arrays rather than shell-interpolated command text.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Preserved run history across subsequent starts**
- **Found during:** Task 2 (Implement process manager lifecycle state machine)
- **Issue:** Starting a new run after prior completed runs replaced the managed process record and lost the completed history.
- **Fix:** Copied existing history into the new managed process record before replacing the in-memory map entry.
- **Files modified:** `src/server/process/processManager.ts`
- **Verification:** `npx vitest run tests/server/processManager.test.ts --reporter=verbose`
- **Committed in:** `f831c3f`

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Required for D-15 run history correctness. No scope expansion.

## Issues Encountered

- Task 3 RED tests passed immediately because Task 2's implementation already included the graceful-then-force stop behavior required by D-11. No additional production code was needed; the Task 3 commit adds the explicit stop-behavior coverage.

## Known Stubs

None. Stub-pattern scan found only intentional empty arrays/null fields used for DTO defaults and ring-buffer initialization in the touched files.

## TDD Gate Compliance

- RED commit present for Task 1 through the failing pre-implementation run; GREEN commit: `52a1a61`.
- RED commit present for Task 2 through the failing missing-module run; GREEN commit: `f831c3f`.
- Task 3 RED tests passed unexpectedly because implementation was already present from Task 2; explicit coverage was committed in `58f550b`.

## Verification

- `npx vitest run tests/server/processManager.test.ts --reporter=verbose` - PASS, 20 tests
- `npx tsc --noEmit` - PASS

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 03 can wire lifecycle routes to `ProcessManager` and validate `scriptName` against package.json scripts before calling `start` or `restart`.

## Self-Check: PASSED

- Created files exist on disk.
- Task commits `52a1a61`, `f831c3f`, and `58f550b` exist in git history.
- Stub scan found no placeholders, TODOs, or FIXME markers in files created or modified by this plan.

---
*Phase: 02-lifecycle-process-control*
*Completed: 2026-05-29*
