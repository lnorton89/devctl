---
phase: 1
slug: project-registry-foundation
status: approved
design_system: material-ui
component_library: "@mui/material"
icon_library: "@mui/icons-material"
preset: operational-dashboard
created: 2026-05-29
---

# Phase 1 - UI Design Contract

> Visual and interaction contract for Phase 1 frontend work. This file locks the registry screen design direction before implementation planning.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | Material UI |
| Preset | Operational dashboard |
| Component library | `@mui/material` |
| Icon library | `@mui/icons-material` |
| Font | Material UI default stack unless the app shell establishes a stronger local convention |

Use Material UI components, theme tokens, layout primitives, icons, form controls, helper text, dialogs/drawers, tables, and accessible labels. Avoid custom primitive components when a Material UI component covers the need.

---

## Product Surface

### First Screen

The first viewport is the project registry dashboard, not a landing page. It should immediately show registered projects or the empty registry state, with the primary create action visible.

### Main Layout

- App shell: compact top app bar or header area with product name `devctl`, primary action, and minimal supporting status.
- Content: constrained but wide operational workspace, optimized for repeated scanning.
- Desktop registry: dense Material UI table.
- Narrow viewport registry: responsive compact list/row layout when table columns become cramped.
- Create/edit surface: drawer preferred on desktop; full-screen dialog or responsive dialog acceptable on mobile.

### Desktop Table Columns

Minimum columns for Phase 1:

| Column | Content |
|--------|---------|
| Project | Name and optional app URL |
| Host path | User-recognizable local path |
| Container path | Execution path used inside Docker |
| Command | Start command, truncated with tooltip when long |
| Port | Configured port or empty dash |
| Health URL | Configured health URL or empty dash |
| Autostart | Switch or status chip, editable in form if inline editing is too noisy |
| Actions | Edit and delete icon buttons |

Phase 1 should not show live lifecycle states as if they are implemented. Status-ready visual space is acceptable, but start/stop/restart controls belong to later phases.

---

## Interaction Contract

### Create Project

- Primary CTA copy: `Add project`
- Opens drawer/dialog with required fields marked and save disabled only when submission is in progress, not as the sole validation mechanism.
- On successful save, close the drawer/dialog and show the new project in the registry.
- If the registry was empty, the table/list replaces the empty state.

### Edit Project

- Row action icon: edit icon with accessible label `Edit project`.
- Opens the same form populated with existing values.
- Primary action copy: `Save changes`
- Cancel action returns to registry without mutation.

### Delete Project

- Row action icon: delete icon with accessible label `Delete project`.
- Destructive confirmation is required.
- Confirmation copy: `Delete {project name}? This removes the project from devctl but does not delete files from disk.`
- Primary destructive action copy: `Delete project`

### Environment Variables

- Use an editable key/value list inside the form.
- Add row action copy: `Add variable`
- Each row has key and value fields plus a remove icon button.
- Include optional `.env` file path field near the key/value editor.
- Do not display environment variable values in the registry table.

### Path Fields

- Show both `Host path` and `Container path` in the form.
- Helper text should make the distinction plain:
  - Host path: `Path on this workstation.`
  - Container path: `Mounted path devctl uses inside Docker.`

---

## Spacing Scale

Declared values must be multiples of 4.

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, helper text gaps |
| sm | 8px | Dense row gaps, compact button spacing |
| md | 16px | Form field spacing, panel padding |
| lg | 24px | Drawer padding, section spacing |
| xl | 32px | Page gutters on desktop |
| 2xl | 48px | Major vertical separation only |

Exceptions: none.

Rules:
- Keep table row density practical for dashboards.
- Do not use oversized hero spacing.
- Do not nest cards inside cards.
- Stable dimensions are required for icon buttons, table actions, switches, and row menus so hover/focus states do not shift layout.

---

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 14px | 400 | 1.45 |
| Label | 12px | 500 | 1.35 |
| Section heading | 16px | 600 | 1.35 |
| Page title | 20px | 600 | 1.3 |
| Table header | 12px | 600 | 1.3 |
| Helper text | 12px | 400 | 1.35 |

Rules:
- Do not scale font size with viewport width.
- Letter spacing is `0`.
- Use monospace only for commands, paths, ports, and URLs where scanability improves.
- Keep headings compact; this is an operational tool, not a marketing surface.

---

## Color

Use Material UI theme tokens and a restrained neutral operational palette. Avoid one-note purple, beige, dark slate, or espresso palettes.

| Role | Value | Usage |
|------|-------|-------|
| Dominant background | `#f7f8fa` | App background |
| Surface | `#ffffff` | Table, drawer, dialog, form surfaces |
| Border | `#d7dde5` | Dividers, table borders, input outlines |
| Text primary | `#17202a` | Primary text |
| Text secondary | `#5f6b7a` | Helper text and secondary metadata |
| Accent | `#1976d2` | Primary action, focus, selected state |
| Success | `#2e7d32` | Future-ready positive/autostart affordance only |
| Warning | `#ed6c02` | Validation or future-ready warning affordance |
| Destructive | `#d32f2f` | Delete actions and destructive confirmation only |

Accent reserved for:
- `Add project`
- Focus states
- Selected row or active form state
- Primary save action

Destructive reserved for:
- Delete icon hover/focus
- Delete confirmation primary button
- Destructive validation states

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Page title | Projects |
| Primary CTA | Add project |
| Empty state heading | No projects registered |
| Empty state body | Add a local app so devctl can manage its configuration. |
| Create form title | Add project |
| Edit form title | Edit project |
| Create submit | Add project |
| Edit submit | Save changes |
| Cancel action | Cancel |
| Delete confirmation | Delete {project name}? This removes the project from devctl but does not delete files from disk. |
| Empty optional table value | - |
| Save error | Project could not be saved. Check the highlighted fields and try again. |
| Load error | Project registry could not be loaded. Check the configuration file and refresh. |

Validation copy:
- Name required: `Name is required.`
- Host path required: `Host path is required.`
- Container path required: `Container path is required.`
- Command required: `Start command is required.`
- Port invalid: `Port must be between 1 and 65535.`
- Health URL invalid: `Enter a valid health URL.`
- App URL invalid: `Enter a valid app URL.`
- Env var key invalid: `Environment variable names must use letters, numbers, and underscores.`

---

## Component Contract

### Required Material UI Components

- `CssBaseline`
- `ThemeProvider`
- `AppBar` or compact header composition using `Box` and `Toolbar`
- `Container` or constrained `Box`
- `Table`, `TableHead`, `TableBody`, `TableRow`, `TableCell`
- `Drawer` or `Dialog`
- `TextField`
- `Switch`
- `FormControlLabel`
- `Button`
- `IconButton`
- `Tooltip`
- `Alert`
- `Snackbar`
- `Chip` where compact state labeling is useful
- `Stack`
- `Divider`

### Required Icons

Use Material UI icons for:
- Add
- Edit
- Delete
- Save if an icon appears in a save control
- Close/cancel
- Open in browser for app URL if surfaced

Do not hand-roll icons.

---

## Responsive Contract

| Breakpoint | Behavior |
|------------|----------|
| Desktop | Dense table with visible core columns and icon row actions. Drawer can occupy right side. |
| Tablet | Table may hide secondary columns behind row expansion or compact metadata stack. Drawer/dialog remains usable. |
| Mobile | Use compact list rows/cards with project name, path metadata, port, autostart marker, and action menu/icons. Form should use full-width fields. |

Rules:
- Text must not overlap or overflow controls.
- Long paths and commands should truncate with tooltip or wrap in controlled metadata areas.
- Primary action must remain visible without creating a landing-page hero.
- Avoid horizontal scrolling unless the Material UI table is intentionally contained and usable.

---

## Accessibility Contract

- Every icon-only control needs an `aria-label`.
- Form fields need visible labels and helper/error text.
- Deletion requires confirmation and a clear non-file-deleting explanation.
- Keyboard navigation through table actions and form fields must be natural.
- Error states must not rely on color alone.
- Dialog/drawer close and cancel controls must be accessible.
- Switches must have meaningful labels, not only nearby visual text.

---

## Phase Boundaries

In scope:
- Registry shell
- Add/edit/delete/list project UI
- YAML-backed field requirements expressed in form UI
- Host path and container path fields
- Command, port, health URL, app URL, environment variables, `.env` path, and autostart preference
- Empty, loading, validation, save-error, and load-error states

Out of scope:
- Start, stop, restart controls
- Live process status
- Logs
- Health polling
- Port occupancy detection
- Autostart execution
- Docker setup documentation beyond copy/helper text needed to understand path fields

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-05-29

## Verification Notes

- Copy uses concrete verbs and avoids instructional marketing text.
- Visual contract matches a dense operational dashboard and first-screen registry.
- Color palette is restrained, neutral, and not one-note; accent/destructive usage is explicitly reserved.
- Typography is fixed-size and compact.
- Spacing uses 4px multiples and stable controls.
- Registry safety is not applicable to shadcn or third-party registries because the contract requires Material UI components.
