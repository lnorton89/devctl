# Phase 1: Project Registry Foundation - Context

**Gathered:** 2026-05-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 1 establishes the registry foundation for devctl: the app shell, persisted project configuration, create/edit/delete/list workflows, validation for required fields, and a project model that later lifecycle phases can execute against. Starting, stopping, logs, health polling, and autostart execution are later phases.

</domain>

<decisions>
## Implementation Decisions

### Project Path Model
- **D-01:** Store both the user-facing host path and the execution-facing container path for each project.
- **D-02:** The host path should preserve what the user recognizes from their workstation, while the container path should represent the mounted path that devctl commands will actually use.
- **D-03:** Validation should require enough path information for later lifecycle execution to be unambiguous, but Phase 1 does not need to prove command execution yet.

### Environment Configuration
- **D-04:** Support explicit environment variables as key/value entries so common per-project settings can be edited directly in the registry UI.
- **D-05:** Also support an optional `.env` file path for projects that already keep environment configuration in a file.
- **D-06:** Treat environment values as security-sensitive local configuration; avoid casual logging or exposing secrets outside the edit surface.

### Persistence Format
- **D-07:** Persist project registry data in a YAML file for v1 rather than JSON or SQLite.
- **D-08:** The YAML file should be durable across container/server restarts and should remain human-readable for local troubleshooting.
- **D-09:** Planning should include safe read/write behavior for the YAML file, including validation before save and protection against malformed persisted data.

### Registry UI Shape
- **D-10:** Use best practices for operational registry data: a dense, scannable table on desktop with clear row actions and status-ready columns.
- **D-11:** Use a drawer or dialog for create/edit flows so the main registry remains visible and frequent management tasks stay efficient.
- **D-12:** On narrow screens, adapt to a compact responsive layout that preserves scanability and action clarity; card-like rows are acceptable for mobile if a table becomes cramped.
- **D-13:** Use Material UI components, icons, layout primitives, validation messages, and accessible controls consistently.

### The Agent's Discretion
- Exact YAML schema details, field names, validation library, form library, and component composition are left to the planner and implementer, provided they preserve the decisions above and match the existing project constraints.
- Empty states, loading states, and minor copy can be chosen during implementation using an operational dashboard tone.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Scope
- `.planning/PROJECT.md` - Product purpose, constraints, key decisions, Docker host-control context, and UI tone.
- `.planning/REQUIREMENTS.md` - REG-01 through REG-04 and related v1 requirements.
- `.planning/ROADMAP.md` - Phase 1 boundary, success criteria, and phase sequencing.
- `.planning/STATE.md` - Current phase and next-step status.
- `AGENTS.md` - Repository-specific agent rules, including Material UI, Context7, Docker/security, and Phase 1 guidance.

### External Documentation
- No external specs or ADRs exist yet. Use Context7 for current Material UI, React, Vite, Docker, or related library documentation when planning or implementing library-specific details.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- No application source files exist yet. The repository currently contains planning documents and `AGENTS.md`.

### Established Patterns
- Planning documents define a Node.js web app with React, Material UI, Docker runtime expectations, and a dense operational dashboard style.
- Phase 1 should establish conventions for later backend, frontend, and persistence work rather than assume an existing code structure.

### Integration Points
- The registry persistence layer created in this phase will feed lifecycle execution in Phase 2, dashboard status/log views in Phase 3, autostart settings in Phase 4, and Docker persistence/runtime docs in Phase 5.

</code_context>

<specifics>
## Specific Ideas

- The user explicitly chose YAML file persistence for the registry.
- For project paths and environment variables, the user was unsure; the captured defaults are conservative choices that keep Docker execution reality visible without overburdening the UI.
- For the registry screen, the user asked to use best practices for the data displayed.

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within Phase 1 scope.

</deferred>

---

*Phase: 01-project-registry-foundation*
*Context gathered: 2026-05-29*
