# devctl

## What This Is

devctl is a Node.js web app for controlling the lifecycle of other local web apps. It is for a developer who currently starts and stops many project dev servers by hand, especially after the computer boots, and wants one local control surface that can automate that routine.

The app runs in a Docker container launched on boot. It provides a modern Material UI interface for registering projects, starting and stopping their dev servers, viewing status, and configuring boot-time automation.

## Core Value

devctl reliably brings the right local dev servers up and down with clear status, without requiring manual terminal juggling after boot.

## Requirements

### Validated

(None yet - ship to validate)

### Active

- [ ] User can register local web app projects with names, paths, commands, ports, and environment notes.
- [ ] User can start, stop, restart, and inspect each registered project from a web UI.
- [ ] User can see accurate process, port, and health status for every registered project.
- [ ] User can configure which projects auto-start when the devctl Docker container starts.
- [ ] User can view recent logs and startup errors without opening each project terminal.
- [ ] User can run devctl in Docker on boot with host access to project directories and process control.
- [ ] User can use a modern Material UI interface optimized for frequent operational work.

### Out of Scope

- Cloud deployment orchestration - v1 is for local developer workstation workflows.
- Production process management - devctl manages dev servers, not production workloads.
- Multi-user access control - v1 assumes a trusted single-user local environment.
- Remote machine fleet management - v1 targets one host machine.
- Full IDE replacement - devctl controls lifecycle state and logs, not editing.

## Context

- The current pain is repetitive manual start and stop work across many local web app projects.
- The app should reduce boot friction: the container launches on boot, then starts selected dev servers automatically.
- The user explicitly wants Node.js and a modern Material UI design language.
- Material UI MCP/tooling is expected through Context7. The Codex environment has `context7` configured in `C:\Users\Lawrence\.codex\config.toml`; use it for current MUI, React, and Docker docs when available.
- Docker is part of the runtime design, not an afterthought. The implementation needs to account for host path mounts, process permissions, and boot integration.
- The product is an internal operational console, so the UI should be dense, clear, and work-focused rather than a marketing-style app.

## Constraints

- **Tech stack**: Node.js web app - aligns with target ecosystem and dev-server control use case.
- **Frontend**: Material UI - requested design system; use official MUI packages and theming.
- **Runtime**: Docker container launched on boot - requires explicit volume, network, and host process strategy.
- **Host control**: Starting local projects from inside a container is security-sensitive - v1 must document required mounts and privileges and avoid hidden magic.
- **Safety**: Commands are user-configured and local - v1 should make command execution explicit and observable.
- **Platform**: Initial environment is Windows, but Docker-based design should leave room for cross-platform support.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Build as a Node.js web app | User requested Node.js; process lifecycle orchestration fits the ecosystem. | Pending |
| Use React with Material UI for the interface | Material UI was requested and suits an operational dashboard. | Pending |
| Run as a boot-launched Docker container | User wants the controller available automatically after computer boot. | Pending |
| Treat v1 as trusted single-user local software | Keeps security and auth scope practical for first release. | Pending |
| Model projects as persisted lifecycle targets | A registry of apps, commands, ports, and autostart preferences is the core domain. | Pending |
| Use Context7 MCP for library docs | Provides current docs for Material UI and related libraries inside Codex. | Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `$gsd-transition`):
1. Requirements invalidated? Move to Out of Scope with reason
2. Requirements validated? Move to Validated with phase reference
3. New requirements emerged? Add to Active
4. Decisions to log? Add to Key Decisions
5. "What This Is" still accurate? Update if drifted

**After each milestone** (via `$gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check - still the right priority?
3. Audit Out of Scope - reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-29 after initialization*
