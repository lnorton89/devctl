# Phase 4 Discussion Log: Autostart Automation

**Date:** 2026-05-30
**Phase:** 4 — Autostart Automation

## Areas Discussed

### 1. Autostart Timing & Ordering

**Question:** How should autostart handle startup ordering?

**Options presented:**
- Fire all in parallel
- Sequential, wait for health
- Parallel with staggered delay

**Selection:** Fire all in parallel
**Rationale:** Simple implementation, fastest boot. Process state + health polling handles failure detection.

**Follow-up — Failure handling:**
**Question:** How should failed autostart attempts be handled?
**Options presented:**
- Log and move on
- Retry once after a delay

**Selection:** Log and move on
**Rationale:** If start() throws, capture the error in process status/logs and leave the project stopped. User can retry manually. No automatic retry to keep behavior predictable.

### 2. UI: Where to Toggle Autostart

**Question:** Where should the autostart toggle appear in the UI?

**Options presented:**
- Inline toggle in dashboard table
- In the edit form drawer only
- Both inline toggle AND form field

**Selection:** Inline toggle in dashboard table (MUI Switch component)
**Rationale:** Instant toggling from the dashboard, no form navigation needed. A Switch column in the desktop table and a Switch metadata row in mobile.

**Follow-up — Visual treatment:**
**Question:** Autostart toggle visual — Switch or Chip?
**Options presented:**
- MUI Switch component
- Chip with click-to-toggle

**Selection:** MUI Switch component
**Rationale:** Standard Material UI Switch with column header label "Auto". Compact, familiar interaction. Toggle fires a PUT request immediately.

## Superseded Decisions

- D-28 (Phase 1): "Autostart uses Chip with success/filled for On and default/outlined for Off" — superseded by Switch approach. The Chip was never implemented.

## Deferred Ideas

- (none)
