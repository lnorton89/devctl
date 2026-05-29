---
phase: 2
slug: lifecycle-process-control
status: ready
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-29
revised: 2026-05-29
---

# Phase 2 — Validation Strategy

Per-phase validation contract for feedback sampling during execution.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~30 seconds |

## Sampling Rate

- **After every task commit:** Run the task-specific `npx vitest run ... --reporter=verbose` command declared in the PLAN.
- **After every plan wave:** Run `npx vitest run --reporter=verbose`.
- **Before `/gsd-verify-work`:** Run `npx vitest run --reporter=verbose` and `npx tsc --noEmit`.
- **Max feedback latency:** 30 seconds for targeted test commands.

## Nyquist Status

All behavior-producing Phase 2 tasks now include explicit test-creation work and direct automated verification commands. There are no absent Wave 0 test-file references remaining in the plan set. The first task that needs a test file creates that test file before implementing the behavior.

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists After Task | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|------------------------|--------|
| 02-01-01 | 01 | 1 | LIFE-01, LIFE-04 | T-02-01-01 | Shared DTOs and optional scriptName schema | unit | `npx vitest run tests/shared/projectSchema.test.ts tests/shared/lifecycleSchema.test.ts --reporter=verbose` | yes | planned |
| 02-01-02 | 01 | 1 | LIFE-01, LIFE-04 | T-02-01-02 | Resolved package.json parsing with typed errors | unit | `npx vitest run tests/server/packageJsonParser.test.ts --reporter=verbose` | yes | planned |
| 02-02-01 | 02 | 2 | LIFE-04 | T-02-02-03 | Bounded log buffer and truncation | unit | `npx vitest run tests/server/processManager.test.ts --reporter=verbose` | yes | planned |
| 02-02-02 | 02 | 2 | LIFE-01, LIFE-03, LIFE-04 | T-02-02-01 | Spawn/state/log/history behavior without real user commands | unit | `npx vitest run tests/server/processManager.test.ts --reporter=verbose` | yes | planned |
| 02-02-03 | 02 | 2 | LIFE-02 | T-02-02-04 | D-11 graceful-then-force stop on Windows and Unix | unit | `npx vitest run tests/server/processManager.test.ts --reporter=verbose` | yes | planned |
| 02-03-01 | 03 | 3 | LIFE-01, LIFE-04 | T-02-03-01 | Start validates scriptName against package.json scripts | integration | `npx vitest run tests/server/lifecycle.test.ts --reporter=verbose` | yes | planned |
| 02-03-02 | 03 | 3 | LIFE-01, LIFE-04 | T-02-03-04 | App mounts lifecycle routes before CRUD | integration | `npx vitest run tests/server/lifecycle.test.ts tests/server/projects.test.ts --reporter=verbose` | yes | planned |
| 02-03-03 | 03 | 3 | LIFE-02, LIFE-03, LIFE-04 | T-02-03-01 | Stop/restart/status/logs route coverage | integration | `npx vitest run tests/server/lifecycle.test.ts --reporter=verbose` | yes | planned |
| 02-04-01 | 04 | 4 | LIFE-01, LIFE-02, LIFE-03, LIFE-04 | T-02-04-02 | Client lifecycle API uses shared DTOs | component | `npx vitest run tests/client/ProjectRegistryPage.test.tsx --reporter=verbose` | yes | planned |
| 02-04-02 | 04 | 4 | LIFE-01, LIFE-02, LIFE-03 | T-02-04-02 | Status chips and legal lifecycle controls | component | `npx vitest run tests/client/ProjectRegistryPage.test.tsx --reporter=verbose` | yes | planned |
| 02-04-03 | 04 | 4 | LIFE-01, LIFE-02, LIFE-03, LIFE-04 | T-02-04-02 | Per-project polling and lifecycle errors | component | `npx vitest run tests/client/ProjectRegistryPage.test.tsx --reporter=verbose` | yes | planned |
| 02-05-01 | 05 | 4 | LIFE-01, LIFE-04 | T-02-05-01 | Directory picker and script dropdown | component | `npx vitest run tests/client/ProjectFormDrawer.test.tsx --reporter=verbose` | yes | planned |
| 02-05-02 | 05 | 4 | LIFE-01 | T-02-05-01 | Derived startCommand and stored scriptName | component | `npx vitest run tests/client/ProjectFormDrawer.test.tsx --reporter=verbose` | yes | planned |
| 02-05-03 | 05 | 4 | LIFE-04 | T-02-05-02 | Package parse and missing-path errors displayed | component | `npx vitest run tests/client/ProjectFormDrawer.test.tsx --reporter=verbose` | yes | planned |
| 02-06-01 | 06 | 5 | LIFE-04 | T-02-06-02 | Log viewer renders bounded log data safely | component | `npx vitest run tests/client/LogViewerDialog.test.tsx --reporter=verbose` | yes | planned |
| 02-06-02 | 06 | 5 | LIFE-04 | T-02-06-01 | Registry opens per-project log viewer | component | `npx vitest run tests/client/ProjectRegistryPage.test.tsx tests/client/LogViewerDialog.test.tsx --reporter=verbose` | yes | planned |

## Required Test Files Created By Plans

- `tests/shared/lifecycleSchema.test.ts` — Plan 01
- `tests/server/packageJsonParser.test.ts` — Plan 01
- `tests/server/processManager.test.ts` — Plan 02
- `tests/server/lifecycle.test.ts` — Plan 03
- `tests/client/ProjectRegistryPage.test.tsx` — Plan 04 and Plan 06 updates
- `tests/client/ProjectFormDrawer.test.tsx` — Plan 05 updates
- `tests/client/LogViewerDialog.test.tsx` — Plan 06

## Manual Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Real OS process group kill on Windows | LIFE-02 | Unit tests mock `taskkill`; real descendant-process behavior is OS-level | Start a sample project, stop it, verify no child `npm` or dev-server process remains. |
| Browse button directory picker | LIFE-01 | Browser directory picker behavior varies by browser | In the browser, click Browse, select a folder with package.json, confirm scripts load or manually enter the path if absolute path is unavailable. |
| Real package.json parsing from disk | LIFE-01 | Unit tests use temp fixtures; user path behavior should be sampled once | Enter a real local project path and confirm script dropdown populates. |

## Validation Sign-Off

- [x] All tasks have `<automated>` verification.
- [x] Test-creation tasks are explicit in the relevant PLAN files.
- [x] No verification commands pipe output through filtering commands.
- [x] No watch-mode flags.
- [x] Feedback latency target is under 30 seconds for targeted commands.
- [x] `nyquist_compliant: true` set in frontmatter.

**Approval:** ready for execution
