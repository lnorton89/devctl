# Roadmap: devctl

**Created:** 2026-05-29
**Granularity:** Coarse
**Scope:** v1 local lifecycle controller

## Phase 1: Project Registry Foundation

**Goal:** Establish the app shell, persistence, and project configuration model.

**Requirements:** REG-01, REG-02, REG-03, REG-04

**UI hint:** yes

**Plans:** 7/7 plans complete

Plans:

- [x] 01-01-PLAN.md - Create package, TypeScript, Vite, Vitest, and data-directory toolchain foundation.
- [x] 01-02-PLAN.md - Add shared project schema contract and validation tests.
- [x] 01-03-PLAN.md - Add minimal React and Express app shell.
- [x] 01-04-PLAN.md - Build YAML repository and Express registry CRUD API.
- [x] 01-05-PLAN.md - Build Material UI registry page state flow and display surfaces.
- [x] 01-06-PLAN.md - Build create, edit, and delete registry workflows.
- [x] 01-07-PLAN.md - Add integration verification, README, and Phase 1 evidence record.

**Success criteria:**

1. User can create, edit, delete, and list projects.
2. Project records include path, command, port, health URL, environment variables, URL, and autostart flag.
3. Project configuration survives container or server restart.
4. Validation catches missing required fields before save.

## Phase 2: Lifecycle Process Control

**Goal:** Start, stop, and restart registered dev servers reliably from the backend.

**Requirements:** LIFE-01, LIFE-02, LIFE-03, LIFE-04

**UI hint:** yes

**Plans:** 6/6 plans executed
Plans:
**Wave 1**

- [x] 02-01-PLAN.md - Add shared lifecycle DTOs, scriptName schema support, and package.json script parsing.

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 02-02-PLAN.md - Build the in-memory process manager with bounded logs and graceful stop behavior.

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 02-03-PLAN.md - Add lifecycle API routes, app wiring, and scriptName validation before execution.

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 02-04-PLAN.md - Wire lifecycle controls, status chips, polling, and errors into the registry UI.
- [x] 02-05-PLAN.md - Rebuild the project form around directory selection and one npm script.

**Wave 5** *(blocked on Wave 4 completion)*

- [x] 02-06-PLAN.md - Add the per-project log viewer and run history UI.

**Success criteria:**

1. User can start a project and the configured command runs in the configured working directory.
2. User can stop and restart managed projects.
3. Failed commands surface actionable errors.
4. Process state remains coherent when commands exit unexpectedly.

## Phase 3: Operational Dashboard, Status, and Logs

**Goal:** Provide the Material UI control surface for daily use.

**Requirements:** OBS-01, OBS-02, OBS-03, OBS-04, UI-01, UI-02, UI-03

**UI hint:** yes

**Plans:** 2/2 plans executed

Plans:
**Wave 1**

- [x] 03-01-PLAN.md — Add `unhealthy` state, health check service, GET /:id/health endpoint, and pre-start port check.

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 03-02-PLAN.md — Add client health polling, Port column, unhealthy UI display, and error handling.

**Success criteria:**

1. Dashboard shows every project with status, port or health state, and primary controls.
2. User can open recent logs for a project.
3. Occupied ports and unhealthy checks are visible in the UI.
4. The first screen is the operational dashboard, not a landing page.
5. Material UI theme, components, icons, and accessible labels are used consistently.

## Phase 4: Autostart Automation

**Goal:** Start selected projects automatically when devctl starts.

**Requirements:** AUTO-01, AUTO-02, AUTO-03

**UI hint:** yes

**Plans:** 2 plans

Plans:

**Wave 1**

- [x] 04-01-PLAN.md — Server-side autostart boot engine and entry-point wiring
- [x] 04-02-PLAN.md — Client inline Switch toggle with optimistic update

**Success criteria:**

1. User can toggle autostart per project.
2. devctl starts autostart-enabled projects on server boot.
3. Autostart failures are captured in project status and logs.
4. User can disable autostart without deleting project configuration.

## Phase 5: Docker Boot Runtime and Hardening

**Goal:** Make devctl practical as a boot-launched Docker service.

**Requirements:** DOCK-01, DOCK-02, DOCK-03

**UI hint:** no

**Success criteria:**

1. Dockerfile builds the app.
2. Docker compose example persists configuration and mounts host project directories.
3. Boot launch instructions are documented for Docker startup policy or compose usage.
4. Security-sensitive host access assumptions are documented clearly.
5. Verification covers restart persistence and at least one managed sample project.

## Coverage

| Phase | Requirements |
|-------|--------------|
| Phase 1 | REG-01, REG-02, REG-03, REG-04 |
| Phase 2 | LIFE-01, LIFE-02, LIFE-03, LIFE-04 |
| Phase 3 | OBS-01, OBS-02, OBS-03, OBS-04, UI-01, UI-02, UI-03 |
| Phase 4 | AUTO-01, AUTO-02, AUTO-03 |
| Phase 5 | DOCK-01, DOCK-02, DOCK-03 |

All v1 requirements are mapped.
