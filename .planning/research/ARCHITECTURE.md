# Architecture Research: devctl

## Components

- Web UI: React and Material UI operational dashboard.
- API server: Node.js service exposing project CRUD, lifecycle actions, status, and settings.
- Process manager: Owns child processes, stop signals, restart behavior, and in-memory state.
- Health monitor: Polls ports or health URLs and records status transitions.
- Log collector: Captures stdout and stderr from managed processes into bounded per-project buffers.
- Persistence layer: Stores project definitions, preferences, and recent lifecycle history in SQLite.
- Docker runtime layer: Provides mounted project access, persistent data volume, exposed UI/API port, and boot-start configuration.

## Data Flow

1. User creates or edits a project in the UI.
2. API validates and stores project config.
3. User or boot policy requests start.
4. Process manager spawns the configured command in the configured working directory.
5. Log collector streams output to UI subscribers.
6. Health monitor updates status from process state, port checks, and optional health URL.
7. UI displays the current lifecycle state and last error.

## Build Order

1. Scaffold app and persistent project registry.
2. Implement process manager with lifecycle API.
3. Add status, health checks, and logs.
4. Build Material UI dashboard around the operational workflow.
5. Add Docker boot runtime docs and compose configuration.
6. Harden command validation, failure handling, and verification.
