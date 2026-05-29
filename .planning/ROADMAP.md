# Roadmap: devctl

**Created:** 2026-05-29
**Granularity:** Coarse
**Scope:** v1 local lifecycle controller

## Phase 1: Project Registry Foundation

**Goal:** Establish the app shell, persistence, and project configuration model.

**Requirements:** REG-01, REG-02, REG-03, REG-04

**UI hint:** yes

**Plans:** 7 plans

Plans:
- [ ] 01-01-PLAN.md - Create package, TypeScript, Vite, Vitest, and data-directory toolchain foundation.
- [ ] 01-02-PLAN.md - Add shared project schema contract and validation tests.
- [ ] 01-03-PLAN.md - Add minimal React and Express app shell.
- [ ] 01-04-PLAN.md - Build YAML repository and Express registry CRUD API.
- [ ] 01-05-PLAN.md - Build Material UI registry page state flow and display surfaces.
- [ ] 01-06-PLAN.md - Build create, edit, and delete registry workflows.
- [ ] 01-07-PLAN.md - Add integration verification, README, and Phase 1 evidence record.

**Success criteria:**
1. User can create, edit, delete, and list projects.
2. Project records include path, command, port, health URL, environment variables, URL, and autostart flag.
3. Project configuration survives container or server restart.
4. Validation catches missing required fields before save.

## Phase 2: Lifecycle Process Control

**Goal:** Start, stop, and restart registered dev servers reliably from the backend.

**Requirements:** LIFE-01, LIFE-02, LIFE-03, LIFE-04

**UI hint:** yes

**Success criteria:**
1. User can start a project and the configured command runs in the configured working directory.
2. User can stop and restart managed projects.
3. Failed commands surface actionable errors.
4. Process state remains coherent when commands exit unexpectedly.

## Phase 3: Operational Dashboard, Status, and Logs

**Goal:** Provide the Material UI control surface for daily use.

**Requirements:** OBS-01, OBS-02, OBS-03, OBS-04, UI-01, UI-02, UI-03

**UI hint:** yes

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
