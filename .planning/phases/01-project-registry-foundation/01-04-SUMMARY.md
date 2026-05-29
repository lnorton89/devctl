---
phase: 01-project-registry-foundation
plan: 04
subsystem: registry-api
tags: [yaml, registry, express, crud, tdd, persistence, error-handling]
requires:
  - phase: 01-02
    provides: shared-project-schema
  - phase: 01-03
    provides: express-app-factory
provides:
  - yaml-registry-repository
  - registry-error-classes
  - project-crud-routes
  - express-error-middleware
affects:
  - 01-05 (Project registry page)
  - 01-06 (Project form drawer)
  - 02-01 (Lifecycle execution)
tech-stack:
  added: []
  patterns:
    - "Repository pattern isolates YAML persistence behind an async API"
    - "Temp-file-then-rename write strategy for atomic persistence"
    - "Dependency injection of registry repository into Express routes for testability"
    - "Structured error responses with formatZodIssues and typed error classes"
key-files:
  created:
    - path: src/server/registry/registryErrors.ts
      purpose: "Custom error classes (RegistryLoadError, ProjectNotFoundError) distinguishing load failures from application errors"
    - path: src/server/registry/registryRepository.ts
      purpose: "YAML-backed registry repository with list/create/update/delete, atomic writes, malformed-file protection"
    - path: src/server/routes/projects.ts
      purpose: "Express router factory for /api/projects CRUD with Zod validation and structured error responses"
    - path: tests/server/registryRepository.test.ts
      purpose: "14 tests covering YAML persistence, restore across instances (REG-04), malformed YAML preservation, and edge cases"
    - path: tests/server/projects.test.ts
      purpose: "13 Supertest cases covering GET/POST/PUT/DELETE, validation errors, not-found, and load error responses"
  modified:
    - path: src/server/app.ts
      purpose: "Accepts optional registryRepository for DI, mounts projects router, adds error handler middleware"
key-decisions:
  - "createApp() accepts optional CreateAppOptions with registryRepository for test DI — default creates YAML-backed repository at DEVCTL_CONFIG_PATH or data/projects.yaml"
  - "RegistryLoadError returns 503 with safe detail message — no raw env values exposed (T-01-04-02)"
  - "Express error handler logs only error type and message — never request bodies or env values"
  - "Temp file write with randomUUID suffix then rename for atomic persistence (A5)"
  - "Malformed YAML distinguishes ENOENT (empty registry) from parse/schema errors (RegistryLoadError with file preservation)"
requirements-completed:
  - REG-01
  - REG-02
  - REG-03
  - REG-04
metrics:
  duration: "11 min"
  completed: "2026-05-29"
---

# Phase 1 Plan 04: YAML-Backed Registry API

**YAML repository with atomic persistence (temp-file-then-rename), Express CRUD routes with Zod validation, custom error classes, and 27 tests proving REG-01 through REG-04 behavior — all 60 suite tests pass.**

## Performance

- **Duration:** 11 min
- **Started:** 2026-05-29T14:13:37Z
- **Completed:** 2026-05-29T14:16:33Z
- **Tasks:** 2 (TDD: RED + GREEN each)
- **Files created:** 5
- **Files modified:** 1

## Accomplishments

### Task 1: YAML Registry Repository (TDD RED + GREEN)

- **`registryErrors.ts`**: Two error classes — `RegistryLoadError` for malformed/invalid YAML (file preserved, never overwritten) and `ProjectNotFoundError` for operations on missing IDs.
- **`registryRepository.ts`**: `createRegistryRepository({ registryPath? })` factory with `listProjects`, `createProject`, `updateProject`, and `deleteProject`:
  - **Missing file** → returns `{ version: 1, projects: [] }` (first-run friendly)
  - **Malformed YAML** → throws `RegistryLoadError` — file is preserved intact (D-09 / T-01-04-01)
  - **Schema-invalid persisted data** → throws `RegistryLoadError` — file is preserved
  - **Empty/whitespace-only file** → throws `RegistryLoadError` — requires user action to recover
  - **Atomic writes** via temp file in target directory then `rename` into place (A5)
  - **Stable IDs** via `crypto.randomUUID()` — generated at create time, never user-edited
  - **Defaults** applied through shared `projectInputSchema` (`env: []`, `autostart: false`)
  - **Path resolution**: `DEVCTL_CONFIG_PATH` env var or `data/projects.yaml` default
- **14 repository tests** covering create, update, delete, REG-04 restart persistence, malformed YAML preservation, schema validation, empty file edge cases, and not-found errors.

### Task 2: Express Project Routes (TDD RED + GREEN)

- **`routes/projects.ts`**: `createProjectsRouter(repository)` Express router factory:
  - `GET /api/projects` → `{ projects: [...] }`
  - `POST /api/projects` → validates with `projectInputSchema`, returns 201 + project with stable ID
  - `PUT /api/projects/:id` → validates, updates, returns 200
  - `DELETE /api/projects/:id` → deletes, returns 204
  - Validation errors → 400 with `{ message, issues }` using `formatZodIssues` (no input values leaked)
  - Project not found → 404 with descriptive message
  - Registry load errors → 503 with safe detail message (T-01-04-02)
- **`app.ts` update**: `createApp()` now accepts optional `CreateAppOptions` with `registryRepository` for dependency injection in tests. Default creates YAML-backed repository. Mounts `/api/projects` routes. Includes error handler middleware.
- **13 Supertest tests** proving CRUD, validation, not-found, REG-03 optional fields, and load error behavior.

## Task Commits

Each task was committed atomically following TDD RED/GREEN protocol:

1. **Task 1 RED:** `c341b89` — `test(01-project-registry-foundation): add failing test for YAML registry repository`
   _14 failing tests + error classes commit before implementation._

2. **Task 1 GREEN:** `fc84213` — `feat(01-project-registry-foundation): implement YAML registry repository`
   _Full YAML persistence with atomic writes. All 14 tests pass._

3. **Task 2 RED:** `cdff24c` — `test(01-project-registry-foundation): add failing test for Express project routes`
   _13 failing Supertest tests commit before route implementation._

4. **Task 2 GREEN:** `eca8b63` — `feat(01-project-registry-foundation): implement Express project routes with error handling`
   _Full CRUD routes with validation. All 13 tests pass. Full suite 60/60 pass._

**TDD Gate Compliance:** ✅ All four gate commits (RED → GREEN × 2) verified in git log.

## Files Created/Modified

### Created
- `src/server/registry/registryErrors.ts` — RegistryLoadError and ProjectNotFoundError
- `src/server/registry/registryRepository.ts` — YAML repository factory (207 lines)
- `src/server/routes/projects.ts` — Express CRUD router factory (120 lines)
- `tests/server/registryRepository.test.ts` — 14 repository tests
- `tests/server/projects.test.ts` — 13 API route tests

### Modified
- `src/server/app.ts` — Options interface, DI, route mounting, error handler

## Decisions Made

- **Dependency injection for testability**: `createApp()` accepts optional `registryRepository` in `CreateAppOptions`. Tests inject a repository backed by a temp directory YAML file. Production uses the default YAML path. This avoids test pollution of real data files.
- **503 for load errors**: `RegistryLoadError` returns HTTP 503 (Service Unavailable) rather than 500, indicating the registry configuration needs user attention. The response body includes a safe `detail` message describing the issue without exposing env values.
- **Error handler stance**: The Express error middleware logs `[error.name]: error.message` only — never `req.body`, env values, or persisted content (D-06 / T-01-04-02 compliance).
- **Temp file naming**: Uses `{registryPath}.tmp.{randomUUID}` suffix to avoid collisions in concurrent-write scenarios (though Phase 1 is single-user).
- **Missing-file vs. empty-file distinction**: A non-existent file returns an empty registry (first run). An existing empty file throws `RegistryLoadError` — this prevents silent data loss if a user accidentally truncates the file.

## Deviations from Plan

None — plan executed exactly as written.

## TDD Gate Compliance

| Gate | Commit | Status |
|------|--------|--------|
| Task 1 RED (test) | `c341b89` — test(01-project-registry-foundation): add failing test for YAML registry repository | ✅ |
| Task 1 GREEN (feat) | `fc84213` — feat(01-project-registry-foundation): implement YAML registry repository | ✅ |
| Task 2 RED (test) | `cdff24c` — test(01-project-registry-foundation): add failing test for Express project routes | ✅ |
| Task 2 GREEN (feat) | `eca8b63` — feat(01-project-registry-foundation): implement Express project routes with error handling | ✅ |
| REFACTOR | Not needed for either task | ⏭️ Skipped |

## Threat Model Compliance

| Threat ID | Category | Disposition | Evidence |
|-----------|----------|-------------|----------|
| T-01-04-01 | Tampering | mitigate | YAML loaded via `parse` → `registrySchema.safeParse`; malformed/invalid data throws `RegistryLoadError` without overwrite |
| T-01-04-02 | Information Disclosure | mitigate | No request-body or env-value logging; error handler logs only `[error.name]: error.message`; error responses use generic messages |
| T-01-04-03 | Denial of Service | mitigate | `express.json({ limit: '256kb' })` inherited from `app.ts`; repository has no unbounded parsing paths |
| T-01-04-04 | Elevation of Privilege | mitigate | API stores command strings but exposes no execution route or lifecycle endpoint |
| T-01-04-05 | Repudiation | accept | Phase 1 is trusted single-user local software; no audit log added |

## Issues Encountered

None — both TDD cycles completed cleanly on first implementation attempt.

## Next Phase Readiness

- **YAML persistence** is durable, validated, and isolated behind a repository API. Frontend Plan 05 can call `GET /api/projects` for the registry page, and `POST/PUT/DELETE` for create/edit/delete workflows.
- **Error handling** is wired from Express middleware through to API responses. Frontend can display `issues` from 400 responses and handle 503 load errors with the provided detail message.
- **All 60 tests pass** across 3 test files (shared schema, registry repository, API routes). TypeScript `--noEmit` and Vite production build both pass clean.

## Self-Check

| Check | Status |
|-------|--------|
| `src/server/registry/registryErrors.ts` exists | ✅ Found |
| `src/server/registry/registryRepository.ts` exists | ✅ Found |
| `src/server/routes/projects.ts` exists | ✅ Found |
| `tests/server/registryRepository.test.ts` exists | ✅ Found |
| `tests/server/projects.test.ts` exists | ✅ Found |
| `src/server/app.ts` modified with routes | ✅ Verified |
| RED commit `c341b89` in git log | ✅ Found |
| GREEN commit `fc84213` in git log | ✅ Found |
| RED commit `cdff24c` in git log | ✅ Found |
| GREEN commit `eca8b63` in git log | ✅ Found |
| `npm test -- --run` — 60/60 pass | ✅ Verified |
| `npm run build` — tsc + vite pass | ✅ Verified |

## Self-Check: PASSED

---

*Phase: 01-project-registry-foundation*
*Completed: 2026-05-29*
