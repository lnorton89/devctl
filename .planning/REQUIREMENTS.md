# Requirements: devctl

**Defined:** 2026-05-29
**Core Value:** devctl reliably brings the right local dev servers up and down with clear status, without requiring manual terminal juggling after boot.

## v1 Requirements

### Project Registry

- [x] **REG-01**: User can create a project with name, local path, start command, and optional app URL.
- [x] **REG-02**: User can edit and delete registered projects.
- [x] **REG-03**: User can configure per-project port, health check URL, environment variables, and autostart preference.
- [x] **REG-04**: User project configuration persists across devctl container restarts.

### Lifecycle Control

- [x] **LIFE-01**: User can start a registered project's dev server from the UI.
- [x] **LIFE-02**: User can stop a running project from the UI.
- [x] **LIFE-03**: User can restart a running or failed project from the UI.
- [x] **LIFE-04**: User can see command failures and missing-path errors when lifecycle actions fail.

### Status and Logs

- [x] **OBS-01**: User can see each project's current status: stopped, starting, running, unhealthy, stopping, or failed.
- [x] **OBS-02**: User can see whether a configured port or health URL is reachable.
- [x] **OBS-03**: User can view recent stdout and stderr logs for each managed project.
- [x] **OBS-04**: User can identify when a port is already occupied before or during startup.

### Automation

- [x] **AUTO-01**: User can mark selected projects to start automatically when devctl starts.
- [x] **AUTO-02**: devctl starts autostart-enabled projects after the container launches.
- [x] **AUTO-03**: User can disable autostart for a project without deleting the project.

### Docker Runtime

- [ ] **DOCK-01**: User can run devctl from Docker with persistent configuration storage.
- [ ] **DOCK-02**: User can mount host project directories into the container for command execution.
- [ ] **DOCK-03**: User can configure devctl to launch on boot using Docker compose or an equivalent Docker startup policy.

### User Interface

- [x] **UI-01**: User can manage projects from a Material UI dashboard optimized for scanning and repeated actions.
- [x] **UI-02**: User can distinguish lifecycle states through accessible labels, status chips, and icon controls.
- [x] **UI-03**: User can inspect and act on a project without navigating through a marketing or landing page.

## v2 Requirements

### Workflow Profiles

- **PROF-01**: User can group projects into named startup profiles.
- **PROF-02**: User can start or stop a full profile with one action.

### Dependencies

- **DEP-01**: User can define startup ordering between projects.
- **DEP-02**: devctl can wait for one project to become healthy before starting a dependent project.

### Scheduling

- **SCH-01**: User can schedule start or stop windows for projects.

### Resource Monitoring

- **RES-01**: User can view CPU and memory usage for managed processes.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Multi-user authentication | v1 is trusted single-user local software. |
| Cloud deployment management | The project targets local development servers. |
| Production process supervision | Existing tools already cover production process management. |
| Remote host fleet management | v1 focuses on one workstation. |
| Full terminal emulator | Logs and actions are enough for v1 lifecycle control. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| REG-01 | Phase 1 | Complete |
| REG-02 | Phase 1 | Complete |
| REG-03 | Phase 1 | Complete |
| REG-04 | Phase 1 | Complete |
| LIFE-01 | Phase 2 | Complete |
| LIFE-02 | Phase 2 | Complete |
| LIFE-03 | Phase 2 | Complete |
| LIFE-04 | Phase 2 | Complete |
| OBS-01 | Phase 3 | Complete |
| OBS-02 | Phase 3 | Complete |
| OBS-03 | Phase 3 | Complete |
| OBS-04 | Phase 3 | Complete |
| AUTO-01 | Phase 4 | Complete |
| AUTO-02 | Phase 4 | Complete |
| AUTO-03 | Phase 4 | Complete |
| DOCK-01 | Phase 5 | Pending |
| DOCK-02 | Phase 5 | Pending |
| DOCK-03 | Phase 5 | Pending |
| UI-01 | Phase 3 | Complete |
| UI-02 | Phase 3 | Complete |
| UI-03 | Phase 3 | Complete |

**Coverage:**
- v1 requirements: 21 total
- Mapped to phases: 21
- Unmapped: 0

---
*Requirements defined: 2026-05-29*
*Last updated: 2026-05-30 after Phase 4 completion*
