# Phase 4 Context: Autostart Automation

## Domain

Add server-side boot-time autostart for selected projects, with an inline MUI Switch toggle in the dashboard UI. Projects marked with `autostart: true` are started automatically when devctl boots.

## Pre-Existing Assets

- `projectSchema` already has `autostart: boolean` field (default `false`)
- `scriptName` and `hostPath` are validated before lifecycle actions (pre-existing from Phase 2)
- `ProcessManager.start(projectId, scriptName, cwd)` — spawns the dev server
- Health endpoint and health polling run independently after start
- Registry CRUD API (`PUT /api/projects/:id`) updates `autostart` field
- Desktop table (`ProjectTable.tsx`) and mobile list (`ProjectMobileList.tsx`) — add inline Switch column/row
- `ProjectRegistryPage.tsx` handles state management and API calls

## Decisions

### Autostart Timing & Ordering

- **Parallel startup:** All autostart-enabled projects are started simultaneously on boot. `Promise.all(projects.filter(p => p.autostart).map(p => start(p.id, ...)))` — no sequential waiting between projects.
- **No retry on failure:** If `start()` throws (occupied port, missing script, etc.), the error is captured in the project's process status/logs and the project is left stopped. User retries manually from the dashboard. No automatic retry.
- **Boot trigger:** Autostart fires after Express server starts listening (in the server startup module, not inside `createApp`). The server's `listen()` callback invokes autostart.

### UI: Autostart Toggle

- **Inline MUI Switch** in the desktop table as an "Auto" column between Port and Status.
- **Mobile list:** Autostart metadata row with an inline Switch.
- **Immediate PUT request:** Toggling the Switch fires `PUT /api/projects/:id` with `{ autostart: bool }` to persist the preference immediately. No separate save button.
- **Visual state:** Switch `checked` reflects `project.autostart` from the registry. Optimistic update on toggle, rollback on API failure.
- **D-28 override:** The Phase 1 Chip-based autostart display decision (D-28) is superseded by the Switch approach, which was never implemented.

### Server Autostart Module

- New internal function `autostartProjects(repository, processManager)` in a new server module (e.g., `src/server/autostart/autostart.ts`).
- Called from server entry point after `app.listen()` callback fires.
- Each project start error is caught individually (no `Promise.all` bail-out) — logs the error and continues to the next project.
- No special "autostart error" state — errors appear through the existing process status (`errored`) and logs.

## Canonical Refs

- `.planning/ROADMAP.md` — Phase 4 goal, requirements AUTO-01 through AUTO-03
- `.planning/REQUIREMENTS.md` — AUTO-01, AUTO-02, AUTO-03 requirement definitions
- `src/server/app.ts` — server entry point; autostart fires after listen()
- `src/server/process/processManager.ts` — `start()`, `getStatus()` for autostart execution
- `src/client/components/ProjectTable.tsx` — add Autostart column with inline Switch
- `src/client/components/ProjectMobileList.tsx` — add Autostart metadata row with inline Switch
- `src/client/components/ProjectRegistryPage.tsx` — state management, API calls
- `src/client/api/projectsApi.ts` — `updateProject` API function (existing)
- `src/shared/projectSchema.ts` — `autostart` boolean field
- `src/shared/lifecycleSchema.ts` — process state types for failure capture

## Deferred Ideas

- (none)

## Next Steps

Plan and execute Phase 4: server boot autostart module, inline Switch UI, toggle API integration, tests.
