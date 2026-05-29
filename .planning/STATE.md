---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: in-progress
last_updated: "2026-05-29T21:41:00.000Z"
progress:
  total_phases: 5
  completed_phases: 0
  total_plans: 7
  completed_plans: 6
  percent: 86
---

# State: devctl

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-29)

**Last session:** 2026-05-29 — Completed 01-06 (create/edit/delete workflows) — 14 min, 4 files created, 58 tests added (138 total)

**Stopped at:** Completed 01-06-PLAN.md — Plans 01-01 through 01-06 done. Next: 01-07 (integration verification and README).

**Core value:** devctl reliably brings the right local dev servers up and down with clear status, without requiring manual terminal juggling after boot.
**Current focus:** Phase 01 — project-registry-foundation

## Current Milestone

v1 local lifecycle controller

## Current Phase

Phase 1: Project Registry Foundation

## Status

Plans 01-01 through 01-06 complete. Registry has full CRUD: toolchain, shared schema, app shell, YAML API, responsive registry page UI, and create/edit/delete form workflows. 138 tests all passing.

## Next Action

Continue with Plan 01-07 to add integration verification, README, and Phase 1 evidence record.

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
