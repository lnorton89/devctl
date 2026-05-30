# Phase 3 Context: Operational Dashboard, Status, and Logs

## Domain

Add port occupancy detection and health URL reachability checks to the dashboard, with an `unhealthy` state and a dedicated UI column for port/health status.

## Pre-Existing Assets

Most of Phase 3 is already built from Phase 2 work:

- **Status chips** (`StatusChip` in `ProjectTable` / `ProjectMobileList`) — 6 states: `stopped`, `starting`, `running`, `stopping`, `failed`, `errored`
- **Lifecycle controls** — Start/Stop/Restart buttons with visibility matrix (`canStart`, `canStop`, `canRestart`)
- **Log viewer** — `LiveProjectLogs` (inline, auto-poll, auto-scroll), `LogViewerDialog` (modal with run history)
- **Dashboard** — Single-page `ProjectRegistryPage`, responsive (table on desktop, cards on mobile), no routing
- **Theme** — Aurora-inspired dark theme with glassy surfaces, dense spacing, custom shadows
- **Polling** — 1s interval with max-3-error tolerance, managed via `useRef`

## Remaining Work

- **OBS-02** — Port and health URL reachability (not implemented)
- **OBS-04** — Port occupancy detection before/during startup (not implemented)
- **OBS-01** — Add `unhealthy` state to the process state enum and UI constants

## Decisions

### Port + Health Check Approach

- Pre-start port check: TCP connect to `localhost:{port}` with **2s timeout**
- If port is occupied before start: **block the start with an error message**
- Post-start checks: run on the existing **1s polling interval** while process is `running`
- Health URL check: HTTP GET to `healthUrl`, expect 2xx, **2s timeout**
- Port check + health URL check run concurrently during each poll cycle
- If port OR health check fails → transition to `unhealthy`
- If both pass again → recover back to `running` (auto-recovery)

### Unhealthy State Design

- `unhealthy` is a **real variant in the `processStateSchema`** enum, not a display flag
- Transitions: `running` → `unhealthy` (on check failure), `unhealthy` → `running` (on check pass)
- Pulse animation like `starting`/`stopping` (failing state, actively checking)
- Add to `STATUS_COLORS`, `STATUS_VARIANTS`, `STATUS_LABELS` in both `ProjectTable` and `ProjectMobileList`:
  - Color: `error` (red — the process is degraded)
  - Variant: `filled`
  - Label: `Unhealthy`

### UI Placement

- **Dedicated "Port" column** in the desktop table between the "Command" and "Status" columns
- Show port number + status indicator (`●` green / `●` red)
- In the mobile list, show as a metadata row (like Host/Command)
- Port column collapses if no project has a port configured

## Canonical Refs

- `.planning/ROADMAP.md` — Phase 3 goal and success criteria
- `.planning/REQUIREMENTS.md` — OBS-01, OBS-02, OBS-04 requirement definitions
- `src/shared/lifecycleSchema.ts` — `processStateSchema` (add `unhealthy`)
- `src/client/components/ProjectTable.tsx` — StatusChip, STATUS_* constants, column layout
- `src/client/components/ProjectMobileList.tsx` — STATUS_* constants, metadata layout
- `src/client/components/ProjectRegistryPage.tsx` — polling infrastructure, state management
- `src/client/api/projectsApi.ts` — API client patterns
- `src/server/routes/lifecycle.ts` — lifecycle route patterns
- `src/server/process/processManager.ts` — process state management
- `src/shared/projectSchema.ts` — `port` and `healthUrl` fields
- `src/client/theme.ts` — Aurora-inspired dark theme

## Deferred Ideas

- (none)

## Next Steps

Plan and execute Phase 3: add `unhealthy` state, implement port/health check server-side, add Port column to the UI.
