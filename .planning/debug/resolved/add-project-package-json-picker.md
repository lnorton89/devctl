---
status: resolved
trigger: "adding a project doesnt work. browsing to a folder the folder picker has \"upload\" as the button text when it should be select or something. also, it only allows you to choose a folder. i want to be able to select a package.json. when you choose a folder currently it lags for quite a while then just says no package.json found at this path when there definitely is one."
created: "2026-05-30T11:45:00.000Z"
updated: "2026-05-30T11:45:00.000Z"
---

# Debug Session: add-project-package-json-picker

## Symptoms

- Expected behavior: adding a project should let the user select a `package.json` or otherwise identify the project path, then scripts should load reliably.
- Actual behavior: the Browse flow opens a folder picker whose native action button says "Upload"; selecting a folder lags and then reports "No package.json found at this path" even when one exists.
- Error messages: "No package.json found at this path."
- Timeline: observed after the Phase 2 directory/script project form implementation.
- Reproduction: open Add project, use Browse to choose a project folder that contains `package.json`.

## Current Focus

- hypothesis: Browser directory selection only exposes a relative folder name, not the absolute host path required by the backend parse-scripts endpoint.
- test: Inspect ProjectFormDrawer browse handler and package script loading path.
- expecting: The handler uses `webkitRelativePath.split('/')[0]` or file name, causing backend lookup against the wrong path.
- next_action: Complete verification and close session.

## Evidence

- timestamp: 2026-05-30T11:45:00.000Z
  observation: `ProjectFormDrawer` used a hidden `input type="file"` with `webkitdirectory` and derived path from `selectedFile.webkitRelativePath.split('/')[0]` or file name.
- timestamp: 2026-05-30T11:45:00.000Z
  observation: Standard browser file/directory pickers do not expose absolute host paths, so the backend received a relative folder name and looked in the wrong directory.
- timestamp: 2026-05-30T11:45:00.000Z
  observation: Replacing directory selection with package.json selection lets the client parse scripts from the selected file immediately without calling `/parse-scripts` with a bogus path.

## Eliminated

- hypothesis: Backend package parser cannot find valid package.json files.
  reason: Existing parser tests pass and manual directory entry still uses the backend parser successfully.

## Resolution

- root_cause: The folder picker could not provide an absolute host path. The form sent only a relative folder name to the backend parser, causing false "No package.json found" errors and the directory upload picker UI.
- fix: Replace the directory-only picker with a `Select package.json` file picker, parse selected package scripts client-side, keep manual directory path as the authoritative execution path, and show an info note when browser privacy prevents auto-filling the directory path.
- verification: `npx vitest run tests/client/ProjectFormDrawer.test.tsx --reporter=verbose`; `npx vitest run --reporter=verbose`; `npx tsc --noEmit`.
- files_changed: `src/client/components/ProjectFormDrawer.tsx`, `tests/client/ProjectFormDrawer.test.tsx`

