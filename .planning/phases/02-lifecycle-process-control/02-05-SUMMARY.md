---
phase: 02-lifecycle-process-control
plan: 05
subsystem: lifecycle-project-form
tags: [react, material-ui, package-json, lifecycle-ui, vitest, typescript]

requires:
  - phase: 02-lifecycle-process-control
    provides: lifecycle API parse-scripts endpoint from Plan 03
provides:
  - Directory-path based project form workflow
  - Package.json script discovery from the project form
  - Lifecycle-ready create/edit payloads with scriptName and derived startCommand
  - Component coverage for directory/script selection, validation, and save flow
affects: [registry-ui, lifecycle-ui, project-registry]

tech-stack:
  added: []
  patterns:
    - Material UI Drawer form with manual directory entry plus Browse affordance
    - Debounced parseScripts lookup for package.json scripts
    - Derived lifecycle payload: hostPath/containerPath from directory path, startCommand from scriptName

key-files:
  created: []
  modified:
    - src/client/components/ProjectFormDrawer.tsx
    - tests/client/ProjectFormDrawer.test.tsx
    - tests/client/ProjectRegistryPage.test.tsx
    - src/client/components/ProjectMobileList.tsx

key-decisions:
  - "The project form now exposes only Name, Directory path, Browse, and Script controls; old Phase 1 fields remain schema-supported but hidden from the create/edit UI."
  - "Script selection is required before save, and submitted projects store scriptName plus a derived npm run startCommand."
  - "The same directory path is used for hostPath and containerPath in this local Phase 2 form flow."

patterns-established:
  - "Form script discovery pattern: directory path changes debounce into parseScripts(path), then populate a controlled MUI Select."
  - "Lifecycle-ready payload pattern: UI derives execution fields instead of asking the user to enter a raw command."
  - "Form error pattern: missing script and package parsing failures are shown inline without logging paths or raw error bodies."

requirements-completed: [LIFE-01, LIFE-04]

duration: resumed
completed: 2026-05-30
---

# Phase 02 Plan 05: Directory and Script Project Form Summary

**Project create/edit now uses a directory path and one selected npm script**

## Accomplishments

- Rebuilt `ProjectFormDrawer` around the Phase 2 lifecycle workflow: project name, directory path, Browse button, and script dropdown.
- Added package script loading through the existing `parseScripts(path)` client API, including loading, empty, and error states.
- Derived save payloads with `hostPath`, `containerPath`, `scriptName`, and `startCommand: npm run {scriptName}`.
- Updated component tests for the new form workflow and adjusted registry-page create-flow coverage to select a script before saving.
- Fixed TypeScript issues around refs, non-standard file input fields, and mobile status chip indexing.

## Files Created/Modified

- `src/client/components/ProjectFormDrawer.tsx` - Directory/script form flow, script parsing state, derived lifecycle payload.
- `tests/client/ProjectFormDrawer.test.tsx` - Coverage for hidden Phase 1 fields, script discovery, validation, and create/edit payloads.
- `tests/client/ProjectRegistryPage.test.tsx` - Registry create-flow test updated for required script selection.
- `src/client/components/ProjectMobileList.tsx` - Type narrowing fix for status chip color/variant lookup.

## Deviations from Plan

- Existing worktree changes already contained partial Plan 04, Plan 05, and early log-viewer work when the session resumed. This pass preserved those changes and patched forward rather than reverting.
- The Browse control uses the browser-exposed directory/file metadata when available, while the manual path field remains the authoritative path input.

## Issues Encountered

- MUI Select tests needed `fireEvent.mouseDown` because the installed `@testing-library/user-event` API does not expose `user.mouseDown`.
- Edit-mode tests were preserving the existing name because keyboard backspace was not focused reliably; the test now uses `user.clear`.

## Verification

- `npx vitest run tests/client/ProjectFormDrawer.test.tsx --reporter=verbose` - PASS, 17 tests
- `npx vitest run tests/client/ProjectRegistryPage.test.tsx --reporter=verbose` - PASS, 24 tests
- `npx vitest run --reporter=verbose` - PASS, 173 tests
- `npx tsc --noEmit` - PASS

## Notes

- Full Vitest output still includes non-failing React `act(...)` warnings in a few edit-mode drawer tests because edit mode refreshes scripts asynchronously after initial assertions.

## Next Phase Readiness

Plan 06 can build on the existing lifecycle/log endpoints and the already-present `LogViewerDialog` worktree file to finish per-project log viewing and run history UI.

