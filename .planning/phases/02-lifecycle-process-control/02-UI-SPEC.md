---
phase: 2
slug: lifecycle-process-control
status: draft
design_system: material-ui
component_library: "@mui/material"
icon_library: "@mui/icons-material"
preset: operational-dashboard
created: 2026-05-29
supersedes: Phase 1 UI-SPEC (registry table expanded, form rebuilt, lifecycle controls added)
---

# Phase 2 — UI Design Contract

> Visual and interaction contract for Phase 2 frontend work. This file specifies how the registry screen
> changes (status + lifecycle columns), how the project creation form is rebuilt (directory picker +
> script dropdown), and where the log viewer lives.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | Material UI |
| Preset | Operational dashboard (Aurora-inspired: clean, dense, minimal visual noise) |
| Component library | `@mui/material` |
| Icon library | `@mui/icons-material` |
| Font | Material UI default stack (inherited from Phase 1) |
| Monospace stack | `ui-monospace, "Cascadia Code", "Fira Code", "Consolas", monospace` (Phase 1 D-27) |

Use Material UI components, theme tokens, layout primitives, icons, form controls, chips, dialogs,
tables, and accessible labels. Avoid custom primitive components when an MUI component covers the need.

**Consistency rule:** Every token, spacing, typography, and color value below that already exists in
the Phase 1 contract is repeated here explicitly so implementers have a single source of truth for
Phase 2. Where Phase 1 values are unchanged, they are marked `[Phase 1]`.

---

## Product Surface

### Registry Page (updated from Phase 1)

The first screen remains the project registry dashboard. Phase 2 adds visible lifecycle state and
controls to every project row without changing the overall page layout or header.

**Layout unchanged from Phase 1:**
- App shell: compact top app bar with product name `devctl`
- Content: constrained wide workspace (max-width 1200px), mx: auto
- Header row: "Projects" title (h5) + "Add project" button (right-aligned)

**Desktop table — updated columns (Phase 1 → Phase 2 change):**

| Old Column (Phase 1) | New Column (Phase 2) | Notes |
|----------------------|----------------------|-------|
| Project | Project | Unchanged — name + optional app URL link |
| Host path | Host path | Unchanged |
| Container path | *Removed* | Replaced by Status column |
| Command | Command | Unchanged — monospaced, truncated with tooltip |
| Port | *Removed* | Hidden per D-04 |
| Health URL | *Removed* | Hidden per D-04 |
| Autostart | *Removed* | Hidden per D-04 (moved to Phase 4) |
| Actions | Status | **NEW** — Color-coded Chip + uptime text |
| *(none)* | Actions | **REVISED** — Edit/Delete + Start/Stop/Restart icon buttons |

**Final desktop table columns for Phase 2:**

| Column | Width | Content |
|--------|-------|---------|
| Project | 180px min | Name (500 weight) + optional app URL link below |
| Host path | 180px min | Monospaced, truncated with tooltip at 60 chars |
| Command | 160px min | Monospaced, truncated with tooltip at 60 chars, max-width 180px |
| Status | 120px | Status Chip + uptime text (monospaced, 12px) |
| Actions | 140px | Icon buttons: Start, Stop, Restart, Edit, Delete |

**Mobile list — updated (Phase 1 → Phase 2 change):**
- Each bordered card retains: Project name, Host path, Command
- **NEW:** Status Chip row between metadata and autostart
- **NEW:** Lifecycle action buttons (Start/Stop/Restart) in the action row alongside Edit/Delete
- Old fields (Container path, Port, Health URL, Autostart) removed from card display per D-04

### Project Creation Form (rebuilt)

The ProjectFormDrawer is rebuilt from multi-field entry to directory-picker + script-selector flow.

**Form structure (top to bottom):**

1. **Title** — "Add project" or "Edit project" (Phase 1, unchanged)
2. **Project name** — TextField (Phase 1, unchanged)
3. **Directory path** — NEW: TextField + "Browse" button side-by-side
   - Text input for manual path entry
   - Browse button opens hidden `<input type="file" webkitdirectory>`
   - When directory selected via browse, populate text field with selected path
   - On path change (text input or browse), trigger script lookup
4. **Script selection** — NEW: Dropdown (Autocomplete/Select) that appears below directory path
   - Shows loading spinner while parsing
   - Shows "No scripts found" if package.json has empty scripts
   - Shows error if package.json not found or unreadable
   - On selection, `startCommand` is derived as `npm run <script>`
5. **Hidden fields** (D-04) — hostPath, containerPath, appUrl, port, healthUrl, envFilePath, env, autostart
   remain in the Zod schema but are NOT rendered in the form UI. The form payload auto-computes:
   - `hostPath` = selected directory path
   - `containerPath` = selected directory path
   - `startCommand` = `npm run ${selectedScript}`
   - All other hidden fields sent as `undefined` (omitted from payload)
6. **Footer actions** — Cancel + Save (Phase 1, unchanged)

### Log Viewer

A per-project log viewer accessible from the registry page.

**Location:** Opens as a Dialog (full-width on desktop, full-screen on mobile) when the user clicks
a log/view-details action on a project row.

**Dialog layout:**
- Title: "{Project name} — Logs"
- Close button (X icon, top-right)
- Content divided into two sections:
  1. **Run history** — List of previous runs, each showing:
     - Script name
     - Start time, end time, duration
     - Exit code (or "Running" for current run)
     - Status indicator (color-coded dot/text)
  2. **Live output** — Scrollable monospaced output panel showing:
     - stdout lines (regular weight)
     - stderr lines (red-tinted or prefixed with `[ERR]`)
     - Timestamps on each line (optional, per line or per burst)
     - Auto-scroll to bottom toggle
     - Current run indicator + uptime counter

**Empty log state:** "No logs recorded for this project yet."

**Phase boundary note:** The log viewer Dialog is built in Phase 2 with the basic layout, run history
display, and current run output panel. Live streaming (WebSocket/SSE auto-refresh) is deferred to
Phase 3 if not feasible with simple polling in Phase 2.

---

## Interaction Contract

### Directory Picker Flow (Project Creation)

```
User clicks "Browse" ──► Hidden <input type="file" webkitdirectory> opens
         │
         ▼
User selects directory ──► Path written to TextField
         │
         ▼
POST /api/projects/parse-scripts { path } ──► Loading state on script dropdown
         │
         ▼
Scripts loaded ──► Dropdown populated
         │
         ▼
User selects script ──► startCommand derived as "npm run <script>"
         │
         ▼
User clicks "Add project" / "Save changes" ──► Payload contains:
  name, hostPath, containerPath, startCommand
  (all other fields = undefined)
```

**Script reload:** If the user changes the directory path after scripts have loaded, the script list
re-fetches automatically. A brief loading state replaces the dropdown options during fetch.

**Manual path entry:** If the user types a path manually (no browse), a debounced fetch (300ms idle)
triggers script parsing. A "Check path" button alternative is acceptable if debounce proves unreliable.

**Error states:**
- `PackageJsonNotFoundError`: "No package.json found at this path."
- `PackageJsonParseError`: "Could not read package.json. Check that the file is valid JSON."
- Empty scripts: "No npm scripts found in this project."

### Lifecycle Controls

**Start button:**
- Visible when status is `stopped` or `failed`
- Icon: PlayArrow
- Color: success (green)
- aria-label: "Start {project name}"
- Click → POST /api/projects/:id/start → Button disabled, shows CircularProgress (20px) inline
- On success → Status chip updates to `starting`, polling begins
- On error → Snackbar with error message

**Stop button:**
- Visible when status is `running` or `starting`
- Icon: Stop
- Color: warning (amber)
- aria-label: "Stop {project name}"
- Click → POST /api/projects/:id/stop → Button disabled, shows CircularProgress inline
- On success → Status chip updates to `stopping`, polling continues
- On error → Snackbar with error message

**Restart button:**
- Visible when status is `running` or `failed`
- Icon: Replay/RestartAlt
- Color: default (grey) or accent
- aria-label: "Restart {project name}"
- Click → POST /api/projects/:id/restart → Button disabled, shows CircularProgress inline
- On success → Status chip updates to `starting`, polling begins
- On error → Snackbar with error message

**Button visibility matrix:**

| Current Status | Start | Stop | Restart | Edit | Delete |
|----------------|-------|------|---------|------|--------|
| stopped | ✓ | — | — | ✓ | ✓ |
| starting | — | ✓ | — | — | — |
| running | — | ✓ | ✓ | — | — |
| stopping | — | — | — | — | — |
| failed | ✓ | — | ✓ | ✓ | ✓ |
| errored | ✓ | — | — | ✓ | ✓ |

### Status Polling

- After any lifecycle action (start/stop/restart), begin polling GET /api/projects/:id/status
- Poll interval: 1 second (1000ms)
- Stop polling when:
  - Status reaches a terminal state (`stopped`, `running`, `failed`, `errored`)
  - Component unmounts
  - Error threshold exceeded (3 consecutive errors → stop polling, show stale indicator)
- On each poll response, update:
  - Status Chip color/text
  - Uptime counter (seconds since start)
  - Enable/disable action buttons per visibility matrix
- **Phase 1 page-level polling:** The entire registry page does NOT poll all projects on an interval.
  Only the project that had a lifecycle action gets polled. Full page status synchronization is deferred
  to Phase 3 (Operational Dashboard).

### Log Viewer

- Click log/view-details action → Open Dialog with run history + output
- Run history section loads immediately from GET /api/projects/:id/logs
- Current run output auto-refreshes via GET /api/projects/:id/status (tail from `recentLogTail`)
- Auto-scroll: When output panel is scrolled to bottom, new lines auto-scroll. If user scrolls up,
  auto-scroll pauses. A "Scroll to bottom" floating button appears when paused.
- Close dialog → Stop any active polling for this log view

### Status Chip Animation

- `starting` and `stopping` states show a subtle pulsing animation (CSS keyframes) to indicate
  transition in progress
- All other states are static
- Animation is subtle (opacity 0.7→1.0, 1.5s ease-in-out) — no spinning or attention-grabbing effects
- Implement via MUI `sx` with `@keyframes` or MUI Box animation

---

## Spacing Scale

All values are multiples of 4. **Unchanged from Phase 1.**

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, helper text gaps |
| sm | 8px | Dense row gaps, compact button spacing, Chip margins |
| md | 16px | Form field spacing, panel padding, Drawer padding |
| lg | 24px | Section spacing, card padding |
| xl | 32px | Page gutters on desktop |
| 2xl | 48px | Major vertical separation |

**New Phase 2 spacing rules:**
- Lifecycle action buttons in table rows: 4px gap between buttons (xs)
- Status Chip margin-right: 8px (sm) from uptime text
- Log output panel padding: 16px (md)
- Log line spacing: 4px (xs) between lines, 20px line-height
- Directory path field + Browse button gap: 8px (sm)
- Script dropdown top margin when appearing below path: 8px (sm)
- Log run history entries: 12px vertical gap (not a standard token — use 3 × xs)

---

## Typography

**Unchanged from Phase 1.**

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 14px | 400 | 1.45 |
| Label | 12px | 500 | 1.35 |
| Section heading | 16px | 600 | 1.35 |
| Page title | 20px | 600 | 1.3 |
| Table header | 12px | 600 | 1.3 |
| Helper text | 12px | 400 | 1.35 |

**New Phase 2 typography rules:**
- Status Chip labels: 12px/500 (Label token)
- Status uptime text: 12px/400 (Helper/body2), monospace
- Log output lines: 12px/400 monospace (Label token — smaller than body for density)
- Log timestamp prefix: 12px/400 monospace, color #8b95a5 (lighter than text.secondary)
- Dialog title: 16px/600 (Section heading token — use MUI h6 with font-size override)
- Run history entry headings: 14px/600 (Body weight semibold variant)

---

## Color

**60/30/10 split:** 60% dominant background (`#f7f8fa`), 30% surface (`#ffffff`), 10% accent (`#1976d2`) and semantic colors (success/warning/error/destructive).

**Base palette unchanged from Phase 1.** New status colors add to the palette.

### Phase 1 Palette (inherited)

| Role | Value | Usage |
|------|-------|-------|
| Dominant background | `#f7f8fa` | App background |
| Surface | `#ffffff` | Table, drawer, dialog, form surfaces |
| Border | `#d7dde5` | Dividers, table borders, input outlines |
| Text primary | `#17202a` | Primary text |
| Text secondary | `#5f6b7a` | Helper text and secondary metadata |
| Accent | `#1976d2` | Primary action, focus, selected state |
| Success | `#2e7d32` | Running status, positive states |
| Warning | `#ed6c02` | Starting/stopping transition states |
| Destructive | `#d32f2f` | Failed/errored status, destructive actions |

### Phase 2 Status Color Mapping

| Process State | Chip Color | Chip Variant | MUI Color Token |
|--------------|------------|-------------|-----------------|
| stopped | default (grey) | outlined | `default` |
| starting | warning (amber) | filled + pulse animation | `warning` |
| running | success (green) | filled | `success` |
| stopping | warning (amber) | filled + pulse animation | `warning` |
| failed | error (red) | filled | `error` |
| errored | error (red) | outlined | `error` |

**Color exceptions and rules:**
- Lifecycle buttons use specific colors only for the primary action icon color:
  - Start → success green icon
  - Stop → warning amber icon
  - Restart → default grey icon
- Button backgrounds remain neutral (IconButton or outlined Button without background fill)
- Status Chip text uses white text on filled variants, default text color on outlined
- Log output: stderr lines rendered in `#d32f2f` (destructive red) at 70% opacity for differentiation
- Log timestamp: `#8b95a5` (between text.secondary `#5f6b7a` and border `#d7dde5`)

---

## Copywriting Contract

### New Phase 2 Copy

| Element | Copy |
|---------|------|
| Status table header | Status |
| Actions table header | (no label — icon-only column) |
| Browse button | Browse |
| Script dropdown label | Script |
| Script dropdown empty | No scripts found |
| Script dropdown loading | Looking for scripts... |
| Script load error (no package.json) | No package.json found at this path. |
| Script load error (invalid JSON) | Could not read package.json. Check that the file is valid JSON. |
| Script load error (general) | Could not load scripts. Try again or enter a different path. |
| Start button aria-label | Start {project name} |
| Stop button aria-label | Stop {project name} |
| Restart button aria-label | Restart {project name} |
| Status chip — stopped | Stopped |
| Status chip — starting | Starting |
| Status chip — running | Running |
| Status chip — stopping | Stopping |
| Status chip — failed | Failed |
| Status chip — errored | Error |
| Uptime format (running) | {seconds}s or {minutes}m {seconds}s or {hours}h {minutes}m |
| Lifecycle error (start failed) | Could not start {project name}. {error detail} |
| Lifecycle error (stop failed) | Could not stop {project name}. {error detail} |
| Lifecycle error (restart failed) | Could not restart {project name}. {error detail} |
| Lifecycle error (missing path) | Project path not found. Check the directory and try again. |
| Logs dialog title | {project name} — Logs |
| Log output heading | Output |
| Log run history heading | Run history |
| Log empty state | No logs recorded for this project yet. |
| Log current run label | Current run |
| Log exit code label | Exit code: {code} |
| Log run duration | {duration} |
| Log run script label | Script: {name} |
| Log auto-scroll toggle | Scroll to bottom |
| Stderr prefix | [ERR] |

### Phase 1 Copy (unchanged, reused in Phase 2)

| Element | Copy |
|---------|------|
| Page title | Projects |
| Primary CTA (top of page) | Add project |
| Empty state heading | No projects registered |
| Empty state body | Add a local app so devctl can manage its configuration. |
| Create form title | Add project |
| Edit form title | Edit project |
| Create submit | Add project |
| Edit submit | Save changes |
| Cancel action | Cancel |
| Delete confirmation | Delete {project name}? This removes the project from devctl but does not delete files from disk. |
| Empty optional table value | — |
| Save error | Project could not be saved. Check the highlighted fields and try again. |
| Load error | Project registry could not be loaded. Check the configuration file and refresh. |

### Phase 1 Validation Copy (inherited, still relevant)

- Name required: `Name is required.`
- Host path required: *(still in schema but form auto-computes it — error should never fire in the new UI)*
- Start command required: *(still in schema but form auto-computes it from script selection)*

---

## Component Contract

### New Material UI Components Required for Phase 2

| Component | Usage | Specifics |
|-----------|-------|-----------|
| `Chip` | Status display per project | Size `small`, color mapped to process state, variant `filled`/`outlined` per matrix |
| `CircularProgress` | Inline loading indicator for lifecycle buttons | Size 20px (small), shown inside disabled IconButton |
| `PlayArrow` icon | Start button | `@mui/icons-material/PlayArrow` |
| `Stop` icon | Stop button | `@mui/icons-material/Stop` |
| `Replay` or `RestartAlt` icon | Restart button | `@mui/icons-material/Replay` or `@mui/icons-material/RestartAlt` |
| `Dialog` | Log viewer container | Full-width on desktop, full-screen on mobile |
| `DialogTitle`, `DialogContent`, `DialogActions` | Log viewer sections | Standard MUI dialog composition |
| `Autocomplete` or `Select` | Script dropdown in form | Dropdown populated from parse-scripts API response |
| `InputAdornment` | Browse button inside TextField | `endAdornment` slot for the browse `<input type="file">` button |
| `List`, `ListItem`, `ListItemText` | Run history entries in log viewer | Compact list showing past runs |
| `TextField` (read-only) | Directory path display (unchanged type) | With `InputProps={{ readOnly: false }}` for manual entry |
| `Paper` | Log output panel background | Dark surface for terminal-like output area |
| `Snackbar` | Lifecycle action success/error toast | Already in Phase 1 contract |

### Existing Phase 1 Components (unchanged)

- `Table`, `TableHead`, `TableBody`, `TableRow`, `TableCell` — table structure
- `Drawer` — project form container (unchanged)
- `Button` — various actions
- `IconButton` — lifecycle + edit + delete actions
- `Tooltip` — truncation tooltips, button explanation on hover
- `TextField` — form inputs
- `Alert` — error/success banners
- `Switch`, `FormControlLabel` — retained in schema but hidden from form UI
- `Divider` — visual separation
- `Stack` — layout
- `Link` — app URL
- `Box` — layout primitive

### New Icon Requirements

| Icon | Import Path | Usage |
|------|-------------|-------|
| `PlayArrow` | `@mui/icons-material/PlayArrow` | Start button |
| `Stop` | `@mui/icons-material/Stop` | Stop button |
| `Replay` | `@mui/icons-material/Replay` | Restart button |
| `FolderOpen` | `@mui/icons-material/FolderOpen` | Browse button icon |
| `Terminal` | `@mui/icons-material/Terminal` | Log viewer trigger / icon |
| `Schedule` | `@mui/icons-material/Schedule` | Run history timestamp |
| `Refresh` | `@mui/icons-material/Refresh` | Log auto-refresh indicator |
| `ArrowDownward` | `@mui/icons-material/ArrowDownward` | Scroll to bottom button |

All existing Phase 1 icons (Add, Edit, Delete, Close, AddCircleOutline, RemoveCircleOutline) remain in use.

---

## Responsive Contract

| Breakpoint | Behavior |
|------------|----------|
| Desktop (≥md, 900px) | Full table with all columns. Status Chip + 3 lifecycle IconButtons + Edit + Delete per row. Log viewer as centered Dialog (max-width 800px). |
| Tablet (600-899px) | Table may hide "Host path" or "Command" columns. Lifecycle buttons may collapse into a dropdown menu icon (MoreVert). Status Chip always visible. |
| Mobile (<600px / md) | Compact card list (ProjectMobileList revised). Each card shows: name, status chip, host path, command. Action row: Start/Stop/Restart as compact IconButtons + Edit + Delete. Log viewer uses fullScreen Dialog. |

**Responsive action overflow:** On narrow viewports where 5 icon buttons (Start, Stop, Restart, Edit,
Delete) do not fit horizontally, collapse lifecycle buttons (Start/Stop/Restart) into a single
"Lifecycle" menu triggered by a MoreVert IconButton. Edit and Delete remain directly visible.

**Responsive form:** Drawer width unchanged at 480px. On mobile, the Drawer becomes full-width
(anchor bottom or full-screen Drawer). Directory picker layout stays horizontal (text field +
browse button) even on mobile.

**Responsive log viewer:**
- Desktop: Centered Dialog, max-width 800px, content area 600px height
- Mobile: fullScreen Dialog, output area fills remaining viewport height

---

## State Machines & Visual States

### Status Chip State Machine

```
                  ┌─────────┐
                  │ stopped │ ◄──── Initial / post-exit (code 0)
                  └────┬────┘
                       │ User clicks Start
                       ▼
                  ┌──────────┐
            ┌────►│ starting │ ◄─── Polling, pulse animation
            │     └─────┬────┘
            │           │ Process produces output (or timeout heuristic)
            │           ▼
            │     ┌──────────┐
            │     │ running  │ ◄─── Static chip, uptime counter active
            │     └─────┬────┘
            │           │ User clicks Stop
            │           ▼
            │     ┌──────────┐
            │     │ stopping │ ◄─── Polling, pulse animation
            │     └─────┬────┘
            │           │ Process exits (signal/exit)
            │           ▼
            │     ┌──────────┐
            └─────┤  stopped │
                  └──────────┘

   ┌─── User clicks Restart ──► stopping ──► starting ──► running
   │
   ├─── Process crashes ──► ┌────────┐
   │                         │ failed  │ ◄─── Exit code ≠ 0
   │                         └───┬────┘
   │                             │ User clicks Start or Restart
   │                             ▼
   │                         ┌──────────┐
   │                         │ starting  │
   │                         └──────────┘
   │
   └─── spawn error ──► ┌──────────┐
                         │  errored  │ ◄─── ENOENT, EACCES, etc.
                         └─────┬────┘
                               │ User clicks Start
                               ▼
                           ┌──────────┐
                           │ starting  │
                           └──────────┘
```

### Lifecycle Button States

| State | Behavior |
|-------|----------|
| Enabled (idle) | IconButton with default icon color per type, standard opacity |
| Disabled (action in progress) | IconButton disabled, show CircularProgress 20px replacing icon |
| Disabled (wrong state) | IconButton disabled, icon shown but greyed out (opacity 0.38), pointer-events none |
| Error | Snackbar shown with error detail. Button re-enabled. Status chip reflects current known state. |

---

## Accessibility Contract

**Inherited from Phase 1:**
- Every icon-only control needs an `aria-label`.
- Form fields need visible labels and helper/error text.
- Deletion requires confirmation with clear non-file-deleting explanation.
- Keyboard navigation must be natural.
- Error states must not rely on color alone.
- Dialog/drawer close and cancel controls must be accessible.

**New Phase 2 additions:**
- Status Chip has `aria-label="Status: {state}"` (e.g., "Status: Running")
- Lifecycle buttons have descriptive `aria-label` with project name (e.g., "Start my-api")
- Disabled lifecycle buttons include `aria-disabled="true"` with `title` attribute explaining why
  (e.g., "Cannot start: project is already running")
- Log viewer output region has `role="log"` and `aria-live="polite"` for live output updates
- Uptime counter uses `aria-label="{X} seconds uptime"` for screen readers
- Polling status changes are announced via `aria-live="polite"` region (not intrusive alerts)
- Status chip color changes are accompanied by text change — never rely on color alone

---

## Phase Boundaries

### In Scope (Phase 2)

- Registry page updated: Status column + revised Actions column with lifecycle icon buttons
- ProjectFormDrawer rebuilt: directory picker + browse + script dropdown
- Old Phase 1 fields hidden from creation/edit UI (but kept in schema)
- Status Chip with 6 states: stopped, starting, running, stopping, failed, errored
- Lifecycle action buttons: Start, Stop, Restart with visibility per state matrix
- Status polling: per-project after lifecycle action, 1s interval, terminates on terminal state
- Log viewer: Dialog with run history + current run output panel
- Lifecycle action feedback: Snackbar errors, inline loading indicators
- Empty log state, script load errors, missing path errors
- Responsive: mobile card list updated with status + lifecycle actions, full-screen log dialog

### Out of Scope (deferred to Phase 3+)

- Full dashboard with all-project status overview table — Phase 3 (OBS-01 through OBS-04)
- Health polling and port occupancy detection — Phase 3 (OBS-02, OBS-04)
- Live log streaming via WebSocket/SSE — Phase 3 if simple polling insufficient
- Autostart execution and toggle — Phase 4 (AUTO-01 through AUTO-03)
- Autostart chip in table — Phase 4 (removed from Phase 2 table per D-04)
- Inline status editing (switches in table) — Phase 4
- Global status polling for all projects simultaneously — Phase 3
- Terminal emulator — v1 out of scope (REQUIREMENTS.md)

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PENDING
- [ ] Dimension 2 Visuals: PENDING
- [x] Dimension 3 Color: PASS (60/30/10 split declared explicitly)
- [x] Dimension 4 Typography: PASS (4 distinct sizes: 12px, 14px, 16px, 20px — duplicates eliminated)
- [ ] Dimension 5 Spacing: PENDING
- [ ] Dimension 6 Registry Safety: PASS (not applicable — Material UI, no shadcn)

**Approval:** *(pending checker verification)*

---

## Verification Notes

- All spacing values are multiples of 4, consistent with Phase 1.
- Typography uses exactly 4 distinct sizes (12px, 14px, 16px, 20px) across 6 roles, consistent with Phase 1. Phase 2 overrides (log output lines 12px, dialog title 16px) reuse existing tokens.
- Color palette inherits Phase 1 values entirely; new status colors reuse existing MUI semantic tokens
  (success, warning, error) — no new hex values introduced.
- Copy uses concrete verbs ("Start", "Stop", "Restart") and avoids instructional marketing text.
- Status states map to Material UI Chip color variants without custom color definitions.
- Lifecycle button state machine prevents illegal transitions (e.g., cannot stop a stopped project).
- Registry page table columns reduced from 8 to 5 to reflect hidden Phase 1 fields per D-04.
- Phase 1 UI-SPEC explicitly excluded lifecycle controls — Phase 2 now adds them without breaking
  the Phase 1 contract (backward-compatible column additions).
