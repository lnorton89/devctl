---
phase: 04-autostart-automation
plan: 02
subsystem: ui
tags: [mui, switch, autostart, optimistic-update, react]

# Dependency graph
requires:
  - phase: 04-autostart-automation
    plan: 01
    provides: Server-side autostart boot engine and autostartProjects function
provides:
  - Inline MUI Switch toggle in desktop table "Auto" column between Port and Status
  - Inline MUI Switch in mobile list Autostart metadata row
  - handleToggleAutostart with optimistic update and API error rollback
  - 5 autostart toggle UI tests covering render, toggle, and rollback
affects: Phase 4 completion, autostart feature verification

# Tech tracking
tech-stack:
  added: []
  patterns:
    - MUI 9 Switch using slotProps API (D-31)
    - Optimistic update pattern with useCallback state rollback
    - Switch onChange with e.stopPropagation() to prevent row event bubbling

key-files:
  created: []
  modified:
    - src/client/components/ProjectRegistryPage.tsx
    - src/client/components/ProjectTable.tsx
    - src/client/components/ProjectMobileList.tsx
    - tests/client/ProjectRegistryPage.test.tsx

key-decisions:
  - "Use screen.getByRole('switch') for Switch element detection — MUI 9 Switch renders with role='switch', not role='checkbox'"
  - "Pass entire project object to updateProject (existing API pattern) via spread: { ...project, autostart }"
  - "No loading state for autostart toggle — Switch updates optimistically and reverts on error"

patterns-established:
  - "Optimistic update pattern: setProjects with callback → API call → server confirm or rollback"
  - "Autostart toggle via inline Switch — no form navigation needed (AUTO-03)"

requirements-completed: [AUTO-01, AUTO-03]

# Metrics
duration: 12min
completed: 2026-05-30
---

# Phase 4 Plan 2: Client-Side Inline Autostart Toggle Summary

**Inline MUI Switch toggle with optimistic update — "Auto" column in desktop table (between Port and Status), Autostart row in mobile list, PUT toggle with rollback on API error**

## Performance

- **Duration:** 12 min
- **Started:** 2026-05-30T20:29:00Z
- **Completed:** 2026-05-30T20:43:30Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Desktop table shows "Auto" column header with inline Switch between Port and Status
- Mobile list shows "Autostart" metadata row with inline Switch below Port
- Toggle fires `PUT /api/projects/:id` immediately — no form navigation required
- Switch updates optimistically and reverts to previous state on API failure
- Error messages appear via existing Snackbar using `setLifecycleError`
- 5 UI tests cover column header, Switch render, toggle API call, optimistic rollback, and checked state

## Task Commits

Each task was committed atomically:

1. **Task 1: Add autostart toggle handler with optimistic update** - `dbf025f` (feat)
2. **Task 2: Add Auto column with Switch to ProjectTable and ProjectMobileList** - `7b9e407` (feat)
3. **Task 3: Add autostart toggle tests** - `1593c68` (test)

**Plan metadata:** (committed by orchestrator)

## Files Created/Modified

- `src/client/components/ProjectRegistryPage.tsx` - Added `handleToggleAutostart` handler with optimistic update; imports `updateProject`; passes `onToggleAutostart` to ProjectTable and ProjectMobileList
- `src/client/components/ProjectTable.tsx` - Added "Auto" column header between Port and Status with inline Switch cell; updated colSpan; added `onToggleAutostart` prop
- `src/client/components/ProjectMobileList.tsx` - Added Autostart metadata row with inline Switch after Port row; added `onToggleAutostart` prop
- `tests/client/ProjectRegistryPage.test.tsx` - Added 5 autostart toggle tests in `describe('autostart toggle')` block

## Decisions Made

- **Switch role detection:** MUI 9 Switch renders with `role="switch"` (not `role="checkbox"`), so tests use `screen.getByRole('switch')` instead of `getByRole('checkbox')`
- **Optimistic update pattern:** Uses `setProjects` with callback to avoid stale closures; spreads full project object into `updateProject` call (existing API pattern)
- **No loading spinner:** Switch updates instantly (optimistic) and only reverts on error — consistent with the plan's requirement for instant feedback
- **MUI 9 slotProps:** Uses `slotProps={{ input: { 'aria-label': ... } }}` per D-31 (MUI 9 slot API migration)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Client inline Switch toggle complete, ready for Phase 4 autostart feature verification
- Both AUTO-01 (mark projects for autostart) and AUTO-03 (disable autostart without deleting) are implemented on the client side
- When combined with 04-01 server autostart engine, Phase 4 will be complete

## Self-Check

- [x] All 4 modified files exist
- [x] 3 plan commits present in git log
- [x] TypeScript compilation: no errors from this plan's files (pre-existing errors in tests/server/autostart.test.ts only)
- [x] Client autostart toggle tests: 5/5 passing
- [x] All client tests: 79/79 passing (no regression)

## Self-Check: PASSED

---
*Phase: 04-autostart-automation*
*Completed: 2026-05-30*
