---
phase: "01-project-registry-foundation"
plan: "01-06"
name: "Create/Edit/Delete Registry Workflows"
subsystem: "Client UI (React)"
tags:
  - frontend
  - crud
  - form
  - dialog
  - tdd
requires:
  - 01-05 (Registry Page display and table)
provides:
  - ProjectFormDrawer component
  - DeleteProjectDialog component
  - Wire both into ProjectRegistryPage
affects:
  - src/client/components/ProjectRegistryPage.tsx
tech-stack:
  added:
    - MUI 9 Dialog (DeleteProjectDialog)
    - MUI 9 Drawer + TextField + AutostartSwitch (ProjectFormDrawer)
  patterns:
    - TDD (RED/GREEN) for drawer and dialog components
    - Integration tests for page-level wiring
    - Mock isolation via mockImplementation to avoid mockResolvedValueOnce leaks
key-files:
  created:
    - src/client/components/ProjectFormDrawer.tsx
    - src/client/components/DeleteProjectDialog.tsx
    - tests/client/ProjectFormDrawer.test.tsx
    - tests/client/DeleteProjectDialog.test.tsx
  modified:
    - src/client/components/ProjectRegistryPage.tsx
    - tests/client/ProjectRegistryPage.test.tsx
decisions:
  - "ProjectFormDrawer uses MUI Drawer (not Dialog) for form editing, consistent with the page's panel-based UX"
  - "DeleteProjectDialog uses MUI Dialog (not Drawer) because delete confirmation is blocking and modal"
  - "Switch (autostart) uses MUI 9 slotProps API instead of MUI 5 inputProps"
  - "Error handling for delete API failures uses structural checks (error.code || error.message) instead of instanceof, for mock compatibility"
  - "Integration tests use mockImplementation with call-count tracking to avoid mock queue leaks from mockResolvedValueOnce across tests"
metrics:
  duration: "~14m"
  completed: "2026-05-29"
  tests_added: 58
  total_tests: 138
---

# Phase 01 Plan 06: Create/Edit/Delete Registry Workflows Summary

Two TDD cycles implementing create/edit (ProjectFormDrawer) and delete (DeleteProjectDialog) workflows, both wired into the registry page with integration tests.

## Tasks Completed

### Task 1: ProjectFormDrawer (TDD RED→GREEN)

**RED:** Wrote 36 tests covering create mode (empty fields, validation, env editor, autostart switch) and edit mode (pre-populated fields, save changes).

**GREEN:** Implemented `ProjectFormDrawer` — a MUI Drawer with:
- Form fields: name, hostPath, containerPath, startCommand, appUrl, port, healthUrl, envFilePath
- Env variable editor (add/remove rows, key validation)
- Autostart switch (MUI 9 slotProps API)
- Validation via shared Zod schemas
- API error display (field-level mapping)
- Loading state disables submit during save

**Wiring:** Connected `onAddProject`/`onEditProject` callbacks in `ProjectRegistryPage` — clicking the Add/Edit buttons opens the drawer with correct mode.

**Integration test:** Added test verifying drawer opens on Add click, closes and reloads on save.

### Task 2: DeleteProjectDialog (TDD RED→GREEN)

**RED:** Wrote 17 tests covering confirmation copy, modal behavior, delete API call, error handling, loading states.

**GREEN:** Implemented `DeleteProjectDialog` — a MUI Dialog with:
- Project name in confirmation copy ("Delete #{name}?")
- Warning that files are not deleted from disk
- Destructive "Delete project" action button
- Error message display (with structural error parsing)
- Disabled buttons during deletion

**Wiring:** Connected `onDeleteProject` callback in `ProjectRegistryPage` — clicking the Delete icon opens the dialog.

**Integration tests:**
- "opens delete confirmation dialog when Delete project is clicked"
- "removes project from registry after successful delete"

## Test Results

- **Test files:** 6 passed
- **Tests:** 138 passed (was 80 before this plan — added 58 tests)
- **Build:** TypeScript compiles with zero errors

### Test breakdown (this plan)

| Test file | Tests | Coverage |
|-----------|-------|----------|
| ProjectFormDrawer.test.tsx | 36 | Create/edit modes, validation, env editor, API calls |
| DeleteProjectDialog.test.tsx | 17 | Confirmation, modal behavior, API calls, errors |
| ProjectRegistryPage.test.tsx | +5 | Integration: drawer open/close/save, dialog open/delete, env hiding |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Correctness] Fixed integration test mock isolation**
- **Found during:** Task 2 integration testing
- **Issue:** `mockResolvedValueOnce` creates implementation queues that `vi.clearAllMocks()` does not clear — the subsequent env values test consumed stale `once` values when running in the full suite
- **Fix:** Replaced `mockResolvedValueOnce` with `mockImplementation` tracking call count for the delete integration test
- **Files modified:** `tests/client/ProjectRegistryPage.test.tsx`
- **Commit:** `8f190e2`

**2. [Rule 1 - Bug] Fixed dialog button detection after Modal opens**
- **Found during:** Task 2 integration testing
- **Issue:** After clicking the row delete icon, MUI Modal's `aria-hidden` on the background container hides the row's delete button from `getAllByRole`. The test tried `getAllByRole('button', { name: 'Delete project' })` expecting ≥2 buttons, but only the dialog's button was visible
- **Fix:** Switched to `findByRole('button', { name: 'Delete project' })` which finds the single visible dialog button
- **Files modified:** `tests/client/ProjectRegistryPage.test.tsx`
- **Commit:** `8f190e2`

### Intentional Omissions

- No REFACTOR commits were needed — both TDD cycles produced clean implementations without structural changes

## Decisions Made

1. **Drawer vs Dialog:** Form editing (Add/Edit) uses Drawer for contextual panel UX; delete confirmation uses Dialog for blocking modal behavior
2. **MUI 9 slotProps for Switch:** The `Switch` component uses MUI 9's `slotProps={{ input: { ... } }}` instead of MUI 5's `inputProps` — confirmed via MUI 9 docs
3. **Structural error parsing:** Instead of `instanceof ApiError`, the error handling checks `error.code` and `error.message` for broader mock/test compatibility while maintaining the same runtime behavior
4. **mockImplementation for test isolation:** Track call count manually to avoid Vitest mock queue leakage — `clearAllMocks()` only resets call/results history, not `mockResolvedValueOnce` queues

## TDD Gate Compliance

| Gate | Status | Commit |
|------|--------|--------|
| RED (test) — ProjectFormDrawer | ✅ | `9c186db` |
| GREEN (feat) — ProjectFormDrawer | ✅ | `0519d9a` |
| RED (test) — DeleteProjectDialog | ✅ | `f2aad07` |
| GREEN (feat) — DeleteProjectDialog | ✅ | `3f3a67e` |
| REFACTOR | ✅ Skipped — no refactors needed | N/A |

All required gate commits present. REFACTOR was not applicable — final implementations were clean.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes at trust boundaries introduced by this plan.

## Known Stubs

None — both components are fully wired with mockable API calls and no placeholder content.

## Self-Check: PASSED

- [x] `src/client/components/ProjectFormDrawer.tsx` — exists
- [x] `src/client/components/DeleteProjectDialog.tsx` — exists
- [x] `tests/client/ProjectFormDrawer.test.tsx` — exists (36 tests passing)
- [x] `tests/client/DeleteProjectDialog.test.tsx` — exists (17 tests passing)
- [x] `tests/client/ProjectRegistryPage.test.tsx` — modified (25 tests passing)
- [x] All 8 commits present in git log
- [x] `npm test -- --run` — 138 passed, 0 failed
- [x] TSC build — clean (zero errors)
