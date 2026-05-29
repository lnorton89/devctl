---
phase: 2
slug: lifecycle-process-control
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-29
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose --changed`
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | LIFE-01 | T-02-01 / T-02-03 | Script name validated against parsed package.json keys, not free-text; path resolved before reading | unit | `npx vitest run tests/server/packageJsonParser.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | LIFE-01 | T-02-02 | Path resolution before package.json read | unit | `npx vitest run tests/server/projectFormSchema.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | LIFE-01 | T-02-03 | Command constructed from validated config (`npm run ${scriptName}`) | unit | `npx vitest run tests/server/processManager.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 1 | LIFE-02 | T-02-04 / T-02-05 | Process group kill via cross-platform pattern (SIGTERM→SIGKILL / taskkill) | unit | `npx vitest run tests/server/processManager.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-03 | 02 | 1 | LIFE-03 | T-02-06 | Restart = stop then start with state machine validation | unit | `npx vitest run tests/server/processManager.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-04 | 02 | 1 | LIFE-04 | T-02-03 | Error states: missing path, invalid script, process crash | unit | `npx vitest run tests/server/processManager.test.ts` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 2 | LIFE-01 | T-02-03 | POST /start spawns process, returns state | integration | `npx vitest run tests/server/lifecycle.test.ts` | ❌ W0 | ⬜ pending |
| 02-03-02 | 03 | 2 | LIFE-02 | T-02-04 | POST /stop terminates process | integration | `npx vitest run tests/server/lifecycle.test.ts` | ❌ W0 | ⬜ pending |
| 02-03-03 | 03 | 2 | LIFE-03 | T-02-06 | POST /restart stops then starts | integration | `npx vitest run tests/server/lifecycle.test.ts` | ❌ W0 | ⬜ pending |
| 02-03-04 | 03 | 2 | LIFE-04 | T-02-03 | POST /start returns error on missing path | integration | `npx vitest run tests/server/lifecycle.test.ts` | ❌ W0 | ⬜ pending |
| 02-04-01 | 04 | 2 | LIFE-01, LIFE-02, LIFE-03 | — | Registry page shows lifecycle buttons | component | `npx vitest run tests/client/ProjectRegistryPage.test.tsx` | ❌ W0 | ⬜ pending |
| 02-04-02 | 04 | 2 | LIFE-01 | — | Form shows directory picker + script dropdown | component | `npx vitest run tests/client/ProjectFormDrawer.test.tsx` | ❌ W0 | ⬜ pending |
| 02-04-03 | 04 | 2 | OBS-03 | — | Log viewer dialog renders correctly | component | `npx vitest run tests/client/LogViewerDialog.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/server/packageJsonParser.test.ts` — unit tests for package.json parsing (valid, missing, malformed, empty scripts)
- [ ] `tests/server/projectFormSchema.test.ts` — unit tests for updated schema (directory path, scriptName)
- [ ] `tests/server/processManager.test.ts` — unit tests for process manager (spawn, kill, state machine, ring buffer)
- [ ] `tests/server/lifecycle.test.ts` — integration tests for lifecycle endpoints (start, stop, restart, errors)
- [ ] `tests/client/ProjectFormDrawer.test.tsx` — extend existing for directory picker + script dropdown
- [ ] `tests/client/ProjectRegistryPage.test.tsx` — extend for lifecycle action buttons + status chips
- [ ] `tests/client/LogViewerDialog.test.tsx` — component tests for log viewer dialog

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Process group kill on Windows | LIFE-02 | Cannot mock OS-level process groups in CI | Run manually: start a project, verify taskkill /T kills the npm process tree |
| Browse button picks directory | LIFE-01 | File input requires browser interaction | Run in browser: click Browse, select a folder with package.json, verify scripts load |
| Real package.json parsing from disk | LIFE-01 | Unit tests mock fs; real path behavior | Open a project with a real package.json, verify scripts dropdown populates |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
