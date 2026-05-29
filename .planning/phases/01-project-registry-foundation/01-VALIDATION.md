---
phase: 1
slug: project-registry-foundation
status: approved
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-29
---

# Phase 1 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest with jsdom for client tests and node/Supertest coverage for backend tests |
| **Config file** | `vitest.config.ts` - Wave 1 installs |
| **Quick run command** | `npm test -- --run` |
| **Full suite command** | `npm run build && npm test -- --run` |
| **Estimated runtime** | ~30 seconds after dependencies install |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --run` once the test suite exists.
- **After every plan wave:** Run `npm run build && npm test -- --run`.
- **Before `$gsd-verify-work`:** Full suite must be green.
- **Max feedback latency:** 60 seconds.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | REG-01, REG-02, REG-03, REG-04 | T-01-01-01, T-01-01-02, T-01-01-03 | Tooling enables validation; scripts do not execute project commands; data directory exists for YAML persistence | typecheck | `npm install && npm run typecheck` | No - Wave 1 | pending |
| 1-02-01 | 02 | 2 | REG-01, REG-02, REG-03, REG-04 | T-01-02-01, T-01-02-02, T-01-02-03 | Shared schema validates registry fields, IDs, defaults, and issue formatting without env-value logging | shared unit | `npm test -- tests/shared/projectSchema.test.ts --run` | No - Wave 2 | pending |
| 1-03-01 | 03 | 3 | REG-01, REG-02, REG-03, REG-04 | T-01-03-01, T-01-03-02, T-01-03-03 | Server app avoids request-body logging; body limit exists; app shell has no lifecycle controls | build/unit | `npm run build && npm test -- --run` | No - Wave 3 | pending |
| 1-04-01 | 04 | 4 | REG-01, REG-02, REG-03, REG-04 | T-01-04-01, T-01-04-02, T-01-04-04 | YAML is validated, malformed files are preserved, env values are not logged, command strings are not executed | backend unit/API | `npm test -- tests/server/registryRepository.test.ts tests/server/projects.test.ts --run` | No - Wave 4 | pending |
| 1-05-01 | 05 | 5 | REG-01, REG-02, REG-03 | T-01-05-01, T-01-05-02, T-01-05-03 | Env values stay out of registry table/list; no lifecycle controls render; API errors are mapped safely | client component | `npm test -- tests/client/ProjectRegistryPage.test.tsx --run` | No - Wave 5 | pending |
| 1-06-01 | 06 | 6 | REG-01, REG-02, REG-03 | T-01-06-01, T-01-06-02, T-01-06-04 | Form validates before mutation; env values stay inside form; delete requires confirmation | client component | `npm test -- tests/client/ProjectFormDrawer.test.tsx tests/client/ProjectRegistryPage.test.tsx --run` | No - Wave 6 | pending |
| 1-07-01 | 07 | 7 | REG-01, REG-02, REG-03, REG-04 | T-01-07-01, T-01-07-02, T-01-07-03 | Integration test uses temp YAML path; docs do not imply command execution; env values are treated as sensitive | integration/docs | `npm run build && npm test -- --run` | No - Wave 7 | pending |

*Status: pending, green, red, flaky*

---

## Wave 0 Requirements

- [ ] `package.json` - npm scripts and dependency manifest.
- [ ] `vitest.config.ts` - Vitest setup for client, shared, server, and integration tests.
- [ ] `tests/setup.ts` - Testing Library DOM matcher setup.
- [ ] `tests/shared/projectSchema.test.ts` - first schema coverage for REG-01 and REG-03.
- [ ] `tests/server/registryRepository.test.ts` - repository coverage for REG-04.
- [ ] `tests/server/projects.test.ts` - API coverage for REG-01 through REG-03.
- [ ] `tests/client/ProjectRegistryPage.test.tsx` - first-screen registry workflow coverage.
- [ ] `tests/client/ProjectFormDrawer.test.tsx` - form validation and env editor coverage.
- [ ] `tests/integration/registryFlow.test.ts` - end-to-end registry persistence coverage.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Responsive registry layout | UI-01, UI-03 support Phase 1 UI contract | Automated component tests can verify content and controls, but viewport ergonomics need visual inspection | Run the app locally after execution, inspect desktop and narrow widths, confirm table/list controls do not overlap and the first screen is the registry. |

---

## Validation Sign-Off

- [x] All tasks have automated verify commands or Wave 0 dependencies.
- [x] Sampling continuity: no 3 consecutive tasks without automated verify.
- [x] Wave 0 covers all missing test references.
- [x] No watch-mode flags.
- [x] Feedback latency target is under 60 seconds after dependencies install.
- [x] `nyquist_compliant: true` set in frontmatter.

**Approval:** approved 2026-05-29
