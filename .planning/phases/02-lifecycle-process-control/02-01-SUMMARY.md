---
phase: 02-lifecycle-process-control
plan: 01
subsystem: shared-contracts
tags: [zod, lifecycle, package-json, vitest, typescript]

requires:
  - phase: 01-project-registry-foundation
    provides: shared project registry schema and Vitest/TypeScript test infrastructure
provides:
  - Optional scriptName support on project input and stored project records
  - Shared lifecycle, log, package-script, and parse-scripts DTO contracts
  - package.json script parser with typed missing-file and malformed-json errors
affects: [lifecycle-api, process-manager, project-form, log-viewer]

tech-stack:
  added: []
  patterns:
    - Shared Zod DTO schemas exported from src/shared
    - Node built-in fs/path utility with typed application errors

key-files:
  created:
    - src/shared/lifecycleSchema.ts
    - src/server/process/packageJsonParser.ts
    - tests/shared/lifecycleSchema.test.ts
    - tests/server/packageJsonParser.test.ts
  modified:
    - src/shared/projectSchema.ts
    - tests/shared/projectSchema.test.ts

key-decisions:
  - "Lifecycle and script DTOs are exported from src/shared/lifecycleSchema.ts so client and server code share one contract source."
  - "Package script discovery reads only the resolved package.json file and returns only string-valued scripts."
  - "Missing and malformed package.json files use typed errors for downstream actionable API responses."

patterns-established:
  - "Shared lifecycle contracts: downstream plans import ProcessStatus, LogData, PackageScripts, and ParseScriptsResponse from src/shared/lifecycleSchema.ts."
  - "Package parser contract: parsePackageJson(dirPath) returns { scripts, path } and filters non-string script values."

requirements-completed: [LIFE-01, LIFE-04]

duration: 5 min
completed: 2026-05-29
---

# Phase 02 Plan 01: Lifecycle Contracts and Package Script Parsing Summary

**Shared lifecycle DTO contracts and package.json script discovery using Zod schemas and Node built-ins**

## Performance

- **Duration:** 5 min
- **Started:** 2026-05-29T23:09:30Z
- **Completed:** 2026-05-29T23:14:10Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Added optional `scriptName` to the project schema while preserving Phase 1 payload compatibility.
- Created shared lifecycle, run-record, log-data, package-scripts, and parse-scripts response DTO schemas.
- Implemented package.json parsing with typed missing-file and malformed-json errors, filtering scripts to string values only.
- Verified TDD RED/GREEN coverage for both shared contracts and parser behavior.

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: Add failing lifecycle schema tests** - `fd196a3` (test)
2. **Task 1 GREEN: Add shared lifecycle DTO schemas** - `9b80075` (feat)
3. **Task 2 RED: Add failing package parser tests** - `0f936a4` (test)
4. **Task 2 GREEN: Implement package json script parser** - `f729395` (feat)

## Files Created/Modified

- `src/shared/projectSchema.ts` - Adds optional `scriptName` to project input and persisted project records.
- `src/shared/lifecycleSchema.ts` - Defines shared lifecycle state, run record, status, log, package script, and parse response schemas/types.
- `src/server/process/packageJsonParser.ts` - Reads resolved `package.json`, returns string-valued scripts, and throws typed parser errors.
- `tests/shared/projectSchema.test.ts` - Covers `scriptName` acceptance and Phase 1 compatibility.
- `tests/shared/lifecycleSchema.test.ts` - Covers lifecycle DTO parse behavior and exported type fixtures.
- `tests/server/packageJsonParser.test.ts` - Covers valid, missing, malformed, absent-scripts, and non-string script cases with temp directories.

## Decisions Made

- Lifecycle DTOs live in `src/shared/lifecycleSchema.ts` to prevent client/server contract drift.
- `parsePackageJson()` resolves `dirPath` before appending `package.json`, matching the plan's filesystem boundary.
- The parser ignores non-string script values rather than failing the whole response, keeping returned data executable and predictable.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- A final import-search command initially used Bash-style `||` in PowerShell and failed syntactically. It was rerun with PowerShell-native exit handling and passed.

## Known Stubs

None.

## TDD Gate Compliance

- RED commits present: `fd196a3`, `0f936a4`
- GREEN commits present after RED: `9b80075`, `f729395`
- Refactor commit: not needed

## Verification

- `npx vitest run tests/shared/projectSchema.test.ts tests/shared/lifecycleSchema.test.ts --reporter=verbose` - PASS, 40 tests
- `npx vitest run tests/server/packageJsonParser.test.ts --reporter=verbose` - PASS, 5 tests
- `npx vitest run tests/shared/projectSchema.test.ts tests/shared/lifecycleSchema.test.ts tests/server/packageJsonParser.test.ts --reporter=verbose` - PASS, 45 tests
- `npx tsc --noEmit` - PASS
- `rg "server/process" src/client src/shared` - PASS, no matches

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 02 can build the in-memory process manager against the shared lifecycle DTOs and can rely on `scriptName` being present in the project contract.

## Self-Check: PASSED

- Created files exist on disk.
- Task commits `fd196a3`, `9b80075`, `0f936a4`, and `f729395` exist in git history.
- Stub scan found no placeholder/TODO/FIXME markers in files created or modified by this plan.

---
*Phase: 02-lifecycle-process-control*
*Completed: 2026-05-29*
