---
phase: 01-project-registry-foundation
generated: "2026-05-29"
verification_command: "npm run build && npm test -- --run"
verification_result: PASSED
total_tests: 144
test_files: 7
---

# Phase 1: Project Registry Foundation — Verification Evidence

> Automated evidence that Phase 1 satisfies REG-01 through REG-04, upholds all locked design decisions, and stays within the Phase 1 scope boundary.

---

## Requirement Evidence

| Req ID | Description | Evidence Files | Verification Command | Result |
|--------|-------------|----------------|---------------------|--------|
| REG-01 | User can create a project with name, local path, start command, and optional app URL. | `src/shared/projectSchema.ts` — shared Zod schema (name, hostPath, containerPath, startCommand, appUrl) | `npm test -- --run` | ✅ 144/144 pass |
| | | `src/server/routes/projects.ts` — POST /api/projects endpoint | | |
| | | `src/client/components/ProjectFormDrawer.tsx` — MUI Drawer form | | |
| | | `tests/server/projects.test.ts` — API create tests | | |
| | | `tests/client/ProjectFormDrawer.test.tsx` — UI create tests | | |
| | | `tests/integration/registryFlow.test.ts` — end-to-end create/GET | | |
| REG-02 | User can edit and delete registered projects. | `src/server/routes/projects.ts` — PUT /api/projects/:id, DELETE /api/projects/:id | `npm test -- --run` | ✅ 144/144 pass |
| | | `src/client/components/ProjectFormDrawer.tsx` — edit mode | | |
| | | `src/client/components/DeleteProjectDialog.tsx` — delete confirmation dialog | | |
| | | `tests/server/projects.test.ts` — update/delete/not-found tests | | |
| | | `tests/client/DeleteProjectDialog.test.tsx` — UI delete tests | | |
| | | `tests/integration/registryFlow.test.ts` — end-to-end PUT/DELETE | | |
| REG-03 | User can configure per-project port, health check URL, environment variables, and autostart preference. | `src/shared/projectSchema.ts` — port, healthUrl, env, envFilePath, autostart fields | `npm test -- --run` | ✅ 144/144 pass |
| | | `src/server/routes/projects.ts` — full payload validation | | |
| | | `src/client/components/ProjectFormDrawer.tsx` — env key/value editor, port field, autostart switch, health URL field, envFilePath | | |
| | | `tests/server/projects.test.ts` — full optional fields POST test | | |
| | | `tests/client/ProjectFormDrawer.test.tsx` — env editor, autostart, port validation tests | | |
| REG-04 | User project configuration persists across devctl container restarts. | `src/server/registry/registryRepository.ts` — YAML read/write with atomic temp-file-rename (A5) | `npm test -- --run` | ✅ 144/144 pass |
| | | `data/projects.yaml` — default registry path (configurable via DEVCTL_CONFIG_PATH) | | |
| | | `tests/server/registryRepository.test.ts` — 14 persistence tests, REG-04 restart scenario | | |
| | | `tests/integration/registryFlow.test.ts` — second app instance reads same YAML file | | |

### Test Coverage Summary

| Test File | Tests | Key Coverage |
|-----------|-------|--------------|
| `tests/shared/projectSchema.test.ts` | 16 | Schema defaults, validation rules, env key patterns (Plans 01-02, 01-04) |
| `tests/server/registryRepository.test.ts` | 14 | YAML persistence, REG-04 restart, malformed YAML, edge cases (Plan 01-04) |
| `tests/server/projects.test.ts` | 13 | CRUD API, validation errors, REG-03 optional fields, load errors (Plan 01-04) |
| `tests/client/ProjectRegistryPage.test.tsx` | 25 | Page rendering, add/edit/delete wiring, env hiding (Plans 01-05, 01-06) |
| `tests/client/ProjectTable.test.tsx` | 14 | Desktop table, mobile list, empty state, autostart chip (Plan 01-05) |
| `tests/client/ProjectFormDrawer.test.tsx` | 36 | Create/edit modes, validation, env editor, autostart switch (Plan 01-06) |
| `tests/client/DeleteProjectDialog.test.tsx` | 17 | Confirmation, modal, API call, error handling (Plan 01-06) |
| `tests/integration/registryFlow.test.ts` | 6 | End-to-end CRUD + persistence + YAML file assertion (Plan 01-07) |
| **Total** | **144** | |

---

## Decision Coverage (D-01 through D-13)

| Decision | Summary | Evidence Files | Status |
|----------|---------|----------------|--------|
| D-01 | Store both host path and container path for each project | `src/shared/projectSchema.ts` (hostPath, containerPath required), `src/server/routes/projects.ts` (validates both), `src/client/components/ProjectFormDrawer.tsx` (both fields in form) | ✅ Implemented |
| D-02 | Host path preserves user-recognizable path; container path represents mounted Docker path | `src/client/components/ProjectFormDrawer.tsx` (helper text: "Path on this workstation" / "Mounted path devctl uses inside Docker") | ✅ Implemented |
| D-03 | Validation requires enough path info for unambiguous lifecycle execution | `src/shared/projectSchema.ts` (both hostPath and containerPath required, min 1 char) | ✅ Implemented |
| D-04 | Support explicit env vars as key/value entries | `src/shared/projectSchema.ts` (env array of key/value), `src/client/components/ProjectFormDrawer.tsx` (env editor), `src/server/routes/projects.ts` (validates env on create/update) | ✅ Implemented |
| D-05 | Support optional .env file path | `src/shared/projectSchema.ts` (envFilePath optional), `src/client/components/ProjectFormDrawer.tsx` (envFilePath field) | ✅ Implemented |
| D-06 | Treat env values as security-sensitive; avoid casual logging/exposure | `src/server/app.ts` (error handler logs only name:message, no env values), `src/client/components/ProjectRegistryPage.tsx` (env not shown in table), `README.md` (documented as sensitive) | ✅ Implemented |
| D-07 | Persist registry data in YAML file | `src/server/registry/registryRepository.ts` (YAML parse/stringify via `yaml` npm package), `data/projects.yaml` (default path) | ✅ Implemented |
| D-08 | YAML file durable across restarts, human-readable | `src/server/registry/registryRepository.ts` (atomic temp-file-rename persistence), `tests/integration/registryFlow.test.ts` (second instance reads same file), `tests/server/registryRepository.test.ts` (REG-04 restart scenario) | ✅ Implemented |
| D-09 | Safe read/write: validate before save, preserve malformed data | `src/server/registry/registryRepository.ts` (parse → schema.safeParse, never overwrites malformed file, RegistryLoadError), `tests/server/registryRepository.test.ts` (malformed YAML preservation tests) | ✅ Implemented |
| D-10 | Dense scannable table on desktop with clear row actions | `src/client/components/ProjectTable.tsx` (MUI Table with icon row actions, tooltips) | ✅ Implemented |
| D-11 | Drawer/dialog for create/edit so registry remains visible | `src/client/components/ProjectFormDrawer.tsx` (MUI Drawer for add/edit) | ✅ Implemented |
| D-12 | Compact responsive layout on narrow screens | `src/client/components/ProjectMobileList.tsx` (bordered cards), `src/client/components/ProjectRegistryPage.tsx` (responsive rendering via theme breakpoints) | ✅ Implemented |
| D-13 | Consistent Material UI components, icons, accessible controls | App-wide: `@mui/material`, `@mui/icons-material`, aria-labels on all icon-only controls | ✅ Implemented |

**Additional implementation-level decisions** (D-14 through D-34) are tracked in `.planning/STATE.md`.

---

## Negative-Scope Checklist

Confirm that the following features were **not** added in Phase 1:

| Feature | Present? | Evidence |
|---------|----------|----------|
| Start/stop/restart lifecycle controls | ❌ Not added | No route handlers for lifecycle; `README.md` explicitly states Phase 1 scope |
| Live process status display | ❌ Not added | No status column in table; no process polling |
| Logs viewer | ❌ Not added | No log endpoints or UI |
| Health polling backend | ❌ Not added | healthUrl stored but not polled |
| Port occupancy checks | ❌ Not added | port stored but not checked at runtime |
| Docker runtime implementation | ❌ Not added | No Dockerfile, compose file, or boot scripts |
| Autostart execution | ❌ Not added | autostart field stored, switch present in form, no execution logic |
| Command execution | ❌ Not added | startCommand stored as configuration string only |
| Dangerous host operations | ❌ Not added | No host file system mutation outside YAML registry file |

---

## Deferred Ideas

None from the Phase 1 discussion (01-CONTEXT.md).

---

## Verification Result

**Command:** `npm run build && npm test -- --run`

- **Build:** ✅ TypeScript `--noEmit` passes (0 errors).
- **Build:** ✅ Vite production build succeeds (dist/client/).
- **Tests:** ✅ 7 test files, 144 tests passed, 0 failed.
- **Duration:** ~23 seconds (test suite).
- **Date:** 2026-05-29

### Full Test Output (abbreviated)

```
> devctl@0.1.0 build
> tsc --noEmit && vite build
✓ built in 280ms

> devctl@0.1.0 test
> vitest --run

 RUN  v4.1.7

 Test Files  7 passed (7)
      Tests  144 passed (144)
```

---

*Generated by Plan 01-07 execution — verifies Phase 1 completion.*
