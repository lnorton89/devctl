---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: in-progress
last_updated: "2026-05-29T23:23:44.963Z"
progress:
  total_phases: 5
  completed_phases: 1
  total_plans: 13
  completed_plans: 9
  percent: 20
---

# State: devctl

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-29)

**Last session:** 2026-05-29T23:23:44.950Z

**Stopped at:** Completed 02-02-PLAN.md

**Core value:** devctl reliably brings the right local dev servers up and down with clear status, without requiring manual terminal juggling after boot.
**Current focus:** Phase 02 — lifecycle-process-control

## Current Milestone

v1 local lifecycle controller

## Current Phase

Phase 2: Lifecycle Process Control

## Status

Phase 1 is complete. Phase 2 planning is complete and verified: six execution plans cover lifecycle DTOs, package script parsing, process management, lifecycle API routes, registry UI lifecycle controls, directory/script project creation, and log viewing.

## Next Action

Execute Phase 2 (Lifecycle Process Control - LIFE-01 through LIFE-04) with `$gsd-execute-phase 02`.

## Accumulated Context

### Decisions

- D-14: 256kb JSON body limit (T-01-03-03) — sufficient for registry mutations; future plans may adjust if lifecycle payloads require more.
- D-15: MUI defaultProps string literals use `as const` assertions — required by Material UI 9 `createTheme` strict union types in TypeScript 6.
- D-16: Server startup logs only port number — no request bodies, env values, or configuration details logged (D-06 compliance).
- D-17: Disabled disabled Add project button with `aria-label` in App.tsx placeholder — avoids fake interactive state while giving Plan 06 a structural target.
- D-18: Dependency injection of registryRepository into createApp() for testability — tests inject temp-directory-backed repository; production uses default YAML path
- D-19: RegistryLoadError returns HTTP 503 (Service Unavailable) — registry configuration error needs user attention, not server fix
- D-20: Error handler logs only [error.name]: error.message — never request bodies, env values, or persisted content (T-01-04-02 / D-06)
- D-21: Temp file naming uses {registryPath}.tmp.{randomUUID} — atomic write with collision-safe naming
- D-22: Missing file returns empty registry; existing empty file throws RegistryLoadError — prevents silent data loss from accidental file truncation
- D-23: Responsive breakpoint uses theme.breakpoints.down('md') — jsdom test environment defaults to desktop table, mobile list renders on narrow viewports
- D-24: Em-dash (—) for empty optional fields (port, healthUrl) matching UI-SPEC empty table value contract
- D-25: ApiError class carries status + issues (FormattedIssue[]) for field-level validation display in Plan 06 form
- D-26: Tooltip truncation at 60 characters for long command/path values — balances scanability against showing enough context
- D-27: Monospace font stack: ui-monospace, "Cascadia Code", "Fira Code", "Consolas", monospace — platform-native monospace with developer-friendly fallbacks
- D-28: Autostart uses Chip with success/filled for On and default/outlined for Off — compact visual distinction without inline switch complexity
- D-29: Mobile list uses bordered cards with borderRadius: 1 and bgcolor: background.paper — distinct from table surface while maintaining visual hierarchy
- D-30: ProjectFormDrawer uses MUI Drawer for contextual form panel; DeleteProjectDialog uses MUI Dialog for blocking modal confirmation — form editing is non-destructive and benefits from the drawer's side-panel UX, while delete is destructive and benefits from a blocking modal
- D-31: Switch component in MUI 9 uses `slotProps={{ input: { ... } }}` instead of MUI 5's `inputProps` — required by MUI 9 slot API migration
- D-32: Delete error handling uses structural checks (`error.code || error.message`) instead of `instanceof ApiError` — broader mock/test compatibility while maintaining identical runtime behavior
- D-33: integration tests use `mockImplementation` with call-count tracking instead of `mockResolvedValueOnce` — avoids Vitest mock queue leakage where `clearAllMocks()` resets call history/results but not `mockResolvedValueOnce` queues
- D-34: Dialog button detection after MUI Modal opens uses `findByRole` (singleton) instead of `getAllByRole` expecting ≥2 — Modal `aria-hidden` on the background container hides the row's delete button, so only the dialog's button is visible
- D-35: Integration test uses isolated temp path (mkdtempSync) — never touches real user YAML config (T-01-07-01)
- D-36: Env values asserted in-memory only — no snapshots or printed output (T-01-07-02)
- D-37: README explicitly states Phase 1 does not execute commands — stored config only (T-01-07-03)
- D-38: Verification document covers D-01 through D-13, negative-scope checklist, and full build/test result
- [Phase 01]: Integration test uses isolated temp path (mkdtempSync) — never touches real user YAML config (T-01-07-01)
- [Phase 01]: Env values asserted in-memory only — no snapshots or printed output (T-01-07-02)
- [Phase 01]: README explicitly states Phase 1 does not execute commands — stored config only (T-01-07-03)
- [Phase 01]: Verification document covers D-01 through D-13, negative-scope checklist, and full build/test result
- [Phase 02]: Lifecycle and script DTOs are exported from src/shared/lifecycleSchema.ts so client and server code share one contract source. — Prevents client/server contract drift for downstream lifecycle API and UI plans.
- [Phase 02]: Package script discovery reads only the resolved package.json file and returns only string-valued scripts. — Constrains filesystem read scope and avoids executable ambiguity from non-string script values.
- [Phase 02]: Missing and malformed package.json files use typed errors for downstream actionable API responses. — Supports LIFE-04 error reporting without string-matching generic errors.
- [Phase 02]: ProcessManager keeps lifecycle state in a private in-memory Map so server restart re-evaluates projects as stopped. — Satisfies D-09 without persisting runtime state.
- [Phase 02]: Run history remains attached to a project across subsequent starts and is capped at five completed runs. — Preserves D-15 behavior while bounding memory.
- [Phase 02]: Stop behavior uses process.kill(-pid, signal) on Unix and argument-array taskkill calls on Windows. — Implements D-11 without shell-interpolated taskkill text.

## Performance Metrics

| Phase | Plan | Duration | Notes |
|-------|------|----------|-------|
| Phase 01 P07 | 8 min | 3 tasks | 3 files |
| Phase 02 P01 | 5 min | 2 tasks | 6 files |
| Phase 02 P02 | 5 min | 3 tasks | 3 files |
