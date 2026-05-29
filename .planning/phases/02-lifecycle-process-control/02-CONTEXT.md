# Phase 2: Lifecycle Process Control - Context

**Gathered:** 2026-05-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver the ability to start, stop, and restart registered dev servers from the backend, with log capture and history. This phase also revises the project creation model to be path-and-script-driven rather than field-by-field.

**Requirement IDs:** LIFE-01, LIFE-02, LIFE-03, LIFE-04

### What's changing in the project model

Phase 1 created a registry with many fields (hostPath, containerPath, appUrl, port, healthUrl, envFilePath, env, autostart). Phase 2 simplifies project creation:

- User chooses a directory → devctl reads `package.json` → parses its `scripts` section
- User selects one script to run
- Running means `npm run <script>` in that project directory
- The old Phase 1 fields stay in the schema but are no longer shown in the creation UI

</domain>

<decisions>
## Implementation Decisions

### Project Creation Model
- **D-01:** Project creation uses a directory picker (text input + browse) instead of individual field entry
- **D-02:** On path selection, devctl reads `package.json` from that directory and parses the `scripts` section
- **D-03:** User selects exactly one script per project (simpler lifecycle — one running state per project)
- **D-04:** Old Phase 1 fields (hostPath, containerPath, appUrl, port, healthUrl, envFilePath, env, autostart) remain in the database schema but are hidden from the creation/edit UI

### Execution Model
- **D-05:** Process execution uses Node.js `child_process.spawn` with stdio pipes
- **D-06:** Each process runs in its own process group for clean kill (cross-platform)
- **D-07:** stdout and stderr are captured in memory with a ring buffer for live tail + history
- **D-08:** Process state machine: stopped → starting → running → stopping → stopped (with failed/errored terminal states)
- **D-09:** State is tracked in-memory (process registry), not persisted — restarts re-evaluate from stopped

### Lifecycle API
- **D-10:** POST /api/projects/:id/start — spawns the process, returns current state
- **D-11:** POST /api/projects/:id/stop — sends SIGTERM then SIGKILL after timeout
- **D-12:** POST /api/projects/:id/restart — stop then start
- **D-13:** GET /api/projects/:id/status — returns current state, uptime, recent log tail
- **D-14:** All lifecycle endpoints return immediately with the resulting state (async pattern, poll GET /status for updates)

### Logs
- **D-15:** Logs are captured per-run, with a history of previous runs kept
- **D-16:** Log data: stdout, stderr, start time, end time, exit code, crash detection
- **D-17:** GET /api/projects/:id/logs returns recent run history and current run's tail
- **D-18:** A project's enabled script name is stored alongside the project path

### Claude's Discretion
- Ring buffer size for log capture
- Exact status endpoint response shape
- Browse button implementation (file input vs Electron-style dialog vs path input)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Schema & Registry
- `src/shared/projectSchema.ts` — Existing project types to extend with script selection
- `src/server/registry/registryRepository.ts` — Existing YAML persistence to reuse
- `src/server/routes/projects.ts` — Existing project CRUD routes to extend
- `data/projects.yaml` — Existing registry data file

### App Shell
- `src/server/app.ts` — Express app factory, mount new lifecycle routes here
- `src/server/index.ts` — Server startup entry

### Frontend
- `src/client/components/ProjectFormDrawer.tsx` — Form to rebuild for path+script selection
- `src/client/components/ProjectRegistryPage.tsx` — Page to add lifecycle actions
- `src/client/api/projectsApi.ts` — API client to extend with lifecycle + parse endpoints
- `.planning/phases/01-project-registry-foundation/01-UI-SPEC.md` — UI contract for consistent styling

### Requirements
- `.planning/REQUIREMENTS.md` — LIFE-01 through LIFE-04

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `createApp()` with dependency injection — reusable for lifecycle route mounting
- `registryRepository` — project CRUD already works, reuse for reading project config
- Shared Zod schemas (`projectInputSchema`, `ProjectConfig`) — extend, don't replace

### Established Patterns
- Express router factory pattern (see `src/server/routes/projects.ts`) — lifecycle routes should follow same pattern
- Typed fetch API client (see `src/client/api/projectsApi.ts`) — lifecycle API client methods follow same pattern
- Vitest + Supertest for backend tests — reuse for lifecycle endpoint tests

### Integration Points
- New route: `src/server/routes/lifecycle.ts` — lifecycle action handlers
- New service: `src/server/process/processManager.ts` — process registry and management
- New route: `src/server/routes/logs.ts` — log retrieval endpoints
- New utility: `src/server/process/packageJsonParser.ts` — parse package.json scripts

### Open Questions
- Browse button implementation approach — need to decide file input vs native dialog
- Process group creation on Windows — `spawn` options differ per platform

</code_context>

<specifics>
## Specific Ideas

- Project creation should feel like: pick a folder → see available npm scripts → pick one → done
- The logs section shows a history timeline of runs (up/down/crash) plus live output from the current run

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-lifecycle-process-control*
*Context gathered: 2026-05-29*
