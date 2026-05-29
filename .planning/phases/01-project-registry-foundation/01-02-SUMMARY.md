---
phase: 01-project-registry-foundation
plan: 02
subsystem: shared-schema
tags: [zod, shared-schema, validation, tdd, typescript]
requires:
  - phase: 01-01
    provides: build-toolchain, test-framework, zod-library
provides:
  - shared-project-schema
  - project-validation-rules
  - zod-issue-formatter
  - typescript-types-for-project
affects:
  - 01-03 (Express API shell)
  - 01-04 (YAML repository)
  - 01-05 (Project registry page)
  - 01-06 (Project form drawer)
tech-stack:
  added: []
  patterns:
    - "Shared Zod schemas in src/shared/ as single source of truth for API and UI validation"
    - "TDD RED/GREEN cycle for schema-driven development"
    - "formatZodIssues helper bridges Zod errors to field-level display without exposing input values"
key-files:
  created:
    - path: src/shared/projectSchema.ts
      purpose: "Shared Zod schemas (projectInputSchema, projectSchema, registrySchema), TypeScript types (ProjectInput, ProjectConfig, RegistryFile, EnvVar), and formatZodIssues helper"
    - path: tests/shared/projectSchema.test.ts
      purpose: "33 tests covering required/optional fields, defaults, port/URL/env validation, stable IDs, registry envelope, and issue formatting"
  modified: []
key-decisions:
  - "Zod 4 'z.output<typeof schema>' used for type inference instead of deprecated 'z.infer' (Zod 3 API removed)"
  - "Env key regex requires leading letter/underscore: /^[a-zA-Z_][a-zA-Z0-9_]*$/ — prevents numeric-starting keys"
  - "formatZodIssues uses PropertyKey[] from Zod 4 type system, converting paths via .map(String) for symbol safety"
  - "Validation copy matches UI-SPEC.md verbatim for field-level error messages"
patterns-established:
  - "Schema-first: src/shared/ exposes schemas + types + helpers; downstream plans import without rediscovering the project model"
  - "TDD: test file committed first (RED gate), then implementation (GREEN gate)"
  - "formatZodIssues: shared helper that maps Zod issues to {path, message} without exposing input values"
  - "Threat-model alignment: T-01-02-01 (validation at shared boundary), T-01-02-02 (no env-value logging), T-01-02-03 (no execution), T-01-02-04 (shape validation before mutation)"
requirements-completed:
  - REG-01
  - REG-02
  - REG-03
  - REG-04
metrics:
  duration: "12 min"
  completed: "2026-05-29"
---

# Phase 1 Plan 02: Shared Project Schema Contract

**Zod 4 shared schemas (projectInputSchema, projectSchema, registrySchema) with 33 validation tests covering required path/command fields, optional registry settings, defaults, port/URL/env-key rules, stable IDs, and a reusable formatZodIssues helper.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-05-29T13:50:00Z
- **Completed:** 2026-05-29T14:02:00Z
- **Tasks:** 1 (TDD: RED + GREEN)
- **Files created:** 2

## Accomplishments

- **Shared schema (`projectInputSchema`):** Defines all Phase 1 registry fields with Zod validation — required `name`, `hostPath`, `containerPath`, `startCommand`; optional `appUrl`, `port`, `healthUrl`, `envFilePath`, `env`, `autostart` with defaults (`env: []`, `autostart: false`).
- **Port validation (1–65535):** Matches UI-SPEC.md validation copy. Rejects out-of-range and non-integer values.
- **URL validation:** Both `appUrl` and `healthUrl` validated as valid URLs when present. Uses Zod 4's built-in `.url()` format check.
- **Env key validation:** Regex `/^[a-zA-Z_][a-zA-Z0-9_]*$/` with copy-matching error message from UI-SPEC.md.
- **Stable ID schema (`projectSchema`):** Extends input schema with `id: string` field for persisted records (REG-02). ID is required for stored records but absent from user input.
- **Registry envelope (`registrySchema`):** Top-level `version: 1` literal + `projects` array for YAML persistence (REG-04, D-07–D-09).
- **`formatZodIssues` helper:** Converts Zod errors into `{path: string, message: string}[]` for API/UI reuse. Designed to avoid exposing input values (T-01-02-02 compliance).
- **Exported TypeScript types:** `EnvVar`, `ProjectInput`, `ProjectConfig`, `RegistryFile`, `FormattedIssue`.

## Task Commits

Each task was committed atomically following TDD RED/GREEN protocol:

1. **Task 1 (RED):** `97ac6e3` — `test(01-project-registry-foundation): add failing test for shared project schema`  
   _33 failing tests establish the expected behavior before implementation._

2. **Task 1 (GREEN):** `2fd165e` — `feat(01-project-registry-foundation): implement shared project schema contract`  
   _Full Zod schema implementation. All 33 tests pass. TypeScript typecheck clean._

**TDD Gate Compliance:** ✅ RED commit (`test(`) + GREEN commit (`feat(`)) verified in git log. No REFACTOR commit needed.

## Files Created

- `src/shared/projectSchema.ts` — Export schemas, types, and `formatZodIssues` helper (175 lines final)
- `tests/shared/projectSchema.test.ts` — 33 tests across 7 describe blocks (475 lines)

## Decisions Made

- **Zod 4 type inference:** Used `z.output<typeof schema>` (officially supported in Zod 4) instead of the deprecated `z.infer` from Zod 3. The `z.infer` export in Zod 4 is aliased from `output`.
- **Env key regex:** Chose `/^[a-zA-Z_][a-zA-Z0-9_]*$/` — requires leading letter or underscore, then letters/digits/underscores. This matches common env-var conventions (POSIX) and rejects keys starting with digits.
- **formatZodIssues parameter type:** Used `PropertyKey[]` from Zod 4's `$ZodIssueBase` instead of `(string | number)[]` because Zod 4 allows `symbol` in paths. Converting via `.map(String).join('.')` handles all cases.
- **Validation copy:** Error messages match UI-SPEC.md verbatim so downstream form components can use them directly.
- **Path fields as plain strings with `.min(1)`:** Phase 1 validates shape only per D-03. No path resolution, normalization, or existence checks.

## Deviations from Plan

None — plan executed exactly as written.

## TDD Gate Compliance

| Gate | Commit | Status |
|------|--------|--------|
| RED (test) | `97ac6e3` — test(01-project-registry-foundation): add failing test for shared project schema | ✅ |
| GREEN (feat) | `2fd165e` — feat(01-project-registry-foundation): implement shared project schema contract | ✅ |
| REFACTOR | Not needed | ⏭️ Skipped |

## Threat Model Compliance

| Threat ID | Disposition | Evidence |
|-----------|-------------|----------|
| T-01-02-01 (Tampering) | mitigate | All project fields validated through Zod `safeParse` before API/persistence use |
| T-01-02-02 (Info Disclosure) | mitigate | `formatZodIssues` returns only `path` and `message` — no input values exposed |
| T-01-02-03 (EoP) | mitigate | Schema layer only defines shapes and validates; no command execution behavior |
| T-01-02-04 (DoS) | mitigate | Shape validation bounds values (port range, URL format, string lengths) before downstream mutation paths |

## Issues Encountered

- **Zod 4 type compatibility:** The `formatZodIssues` parameter initially used `(string | number)[]` for issue paths, but Zod 4 defines paths as `PropertyKey[]` (which includes `symbol`). Fixed by widening to `PropertyKey[]` and converting via `.map(String)`.
- **TypeScript 6 compatibility:** `tsc --noEmit` passed cleanly on first attempt with the corrected types — no config adjustments needed.

## Next Phase Readiness

- Schema contract is stable — backend Plan 03 can import `projectInputSchema` for API validation, `projectSchema` for repository typing, and `registrySchema` for YAML persistence.
- Frontend plans (05–06) can import `projectInputSchema`, `formatZodIssues`, and `FormattedIssue` for form validation display.
- `formatZodIssues` provides the API/UI bridge for field-level error mapping without leaking input values.

## Self-Check

| Check | Status |
|-------|--------|
| `src/shared/projectSchema.ts` exists | ✅ Found |
| `tests/shared/projectSchema.test.ts` exists | ✅ Found |
| RED commit `97ac6e3` in git log | ✅ Found |
| GREEN commit `2fd165e` in git log | ✅ Found |

## Self-Check: PASSED

---
*Phase: 01-project-registry-foundation*
*Completed: 2026-05-29*
