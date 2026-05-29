# Phase 1: Project Registry Foundation - Research

**Researched:** 2026-05-29  
**Domain:** Fresh Node.js + React + TypeScript + Material UI app shell with YAML-backed registry persistence  
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

## Implementation Decisions

### Project Path Model
- **D-01:** Store both the user-facing host path and the execution-facing container path for each project.
- **D-02:** The host path should preserve what the user recognizes from their workstation, while the container path should represent the mounted path that devctl commands will actually use.
- **D-03:** Validation should require enough path information for later lifecycle execution to be unambiguous, but Phase 1 does not need to prove command execution yet.

### Environment Configuration
- **D-04:** Support explicit environment variables as key/value entries so common per-project settings can be edited directly in the registry UI.
- **D-05:** Also support an optional `.env` file path for projects that already keep environment configuration in a file.
- **D-06:** Treat environment values as security-sensitive local configuration; avoid casual logging or exposing secrets outside the edit surface.

### Persistence Format
- **D-07:** Persist project registry data in a YAML file for v1 rather than JSON or SQLite.
- **D-08:** The YAML file should be durable across container/server restarts and should remain human-readable for local troubleshooting.
- **D-09:** Planning should include safe read/write behavior for the YAML file, including validation before save and protection against malformed persisted data.

### Registry UI Shape
- **D-10:** Use best practices for operational registry data: a dense, scannable table on desktop with clear row actions and status-ready columns.
- **D-11:** Use a drawer or dialog for create/edit flows so the main registry remains visible and frequent management tasks stay efficient.
- **D-12:** On narrow screens, adapt to a compact responsive layout that preserves scanability and action clarity; card-like rows are acceptable for mobile if a table becomes cramped.
- **D-13:** Use Material UI components, icons, layout primitives, validation messages, and accessible controls consistently.

### Claude's Discretion
- Exact YAML schema details, field names, validation library, form library, and component composition are left to the planner and implementer, provided they preserve the decisions above and match the existing project constraints.
- Empty states, loading states, and minor copy can be chosen during implementation using an operational dashboard tone.

### Deferred Ideas (OUT OF SCOPE)
None - discussion stayed within Phase 1 scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REG-01 | User can create a project with name, local path, start command, and optional app URL. | Project schema, Express create endpoint, React controlled form, MUI drawer/dialog form. |
| REG-02 | User can edit and delete registered projects. | REST update/delete routes, repository write path, table row actions, destructive confirmation. |
| REG-03 | User can configure per-project port, health check URL, environment variables, and autostart preference. | Zod schema rules, editable env key/value list, optional `.env` path, switch/control mapping. |
| REG-04 | User project configuration persists across devctl container restarts. | YAML file repository, Docker volume/bind-mount persistence model, atomic write guidance. |
</phase_requirements>

## Summary

Phase 1 should establish one TypeScript codebase with a Vite React frontend and a small Express backend API, because the project has no existing source files and the registry requires server-side file persistence that the browser must not perform directly. [VERIFIED: repository scan, AGENTS.md, PROJECT.md, Context7 /vitejs/vite, Context7 /expressjs/express] The backend should own YAML read/write, registry validation, ID assignment, and malformed-file handling; the frontend should own table/list rendering, create/edit/delete interactions, and accessible validation display. [VERIFIED: CONTEXT.md, UI-SPEC.md, Context7 /reactjs/react.dev, Context7 /mui/material-ui, Context7 /eemeli/yaml, Context7 /colinhacks/zod]

Use `yaml` for human-readable persistence, `zod` for a shared schema, Material UI for all visible controls, and Vitest for both backend service tests and frontend component tests. [VERIFIED: npm registry, Context7 /eemeli/yaml, Context7 /colinhacks/zod, Context7 /mui/material-ui, Context7 /vitest-dev/vitest] Persist the registry to a configurable YAML path such as `DEVCTL_CONFIG_PATH`, defaulting to a data directory path like `data/projects.yaml`; in Docker, Phase 5 can mount that data directory as a volume, while Phase 1 can already structure the file path for durable restarts. [CITED: Context7 /docker/docs bind mounts and volumes] [ASSUMED]

**Primary recommendation:** Build a strict TypeScript monorepo-style app shell with `src/server`, `src/client`, and `src/shared`, backed by a YAML repository service and a shared Zod `ProjectConfig` schema. [VERIFIED: repository scan, npm registry, Context7 docs]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| Project schema and validation | API / Backend | Browser / Client | Backend must reject invalid persisted data; client mirrors validation for fast feedback. [VERIFIED: Context7 /colinhacks/zod] |
| YAML registry persistence | API / Backend | Database / Storage | Browser cannot safely write server files; backend serializes validated registry data to YAML storage. [VERIFIED: Context7 /expressjs/express, Context7 /eemeli/yaml] |
| Create/edit/delete/list workflows | Browser / Client | API / Backend | UI owns interactions; API owns mutations and durable state. [VERIFIED: UI-SPEC.md, Context7 /reactjs/react.dev] |
| Host path and container path capture | Browser / Client | API / Backend | UI explains and captures both values; backend requires both before save. [VERIFIED: CONTEXT.md, UI-SPEC.md] |
| Environment variables and `.env` path | Browser / Client | API / Backend | UI supports editing; backend treats values as sensitive and avoids logging them. [VERIFIED: CONTEXT.md, UI-SPEC.md] |
| Docker persistence readiness | Database / Storage | API / Backend | Docker volumes/bind mounts provide durable filesystem state; backend should read/write at a mountable path. [CITED: Context7 /docker/docs] |

## Project Constraints (from AGENTS.md)

- Read `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, and `.planning/STATE.md` before planning or implementation. [VERIFIED: AGENTS.md]
- Keep changes scoped to active roadmap Phase 1. [VERIFIED: AGENTS.md]
- Prefer TypeScript for Node.js and React code. [VERIFIED: AGENTS.md]
- Use Material UI for frontend components, theming, icons, layout primitives, and accessible controls. [VERIFIED: AGENTS.md]
- Use Context7 for current Material UI, React, Vite, Docker, or related library documentation when available. [VERIFIED: AGENTS.md]
- Design as an operational dashboard: dense, clear, responsive, and action-oriented. [VERIFIED: AGENTS.md]
- Treat command execution and Docker host access as security-sensitive. [VERIFIED: AGENTS.md]
- Phase 1 should be planned before implementation. [VERIFIED: AGENTS.md]
- No `CLAUDE.md` exists, so there are no additional CLAUDE.md directives. [VERIFIED: filesystem scan]
- No project-defined skills exist under `.claude/skills` or `.agents/skills`. [VERIFIED: filesystem scan]

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js | 22.18.0 local | Runtime for backend and tooling | Installed locally and suitable for current TypeScript/Vite tooling. [VERIFIED: `node --version`] |
| npm | 10.9.3 local | Package manager | Installed locally and used to verify registry package versions. [VERIFIED: `npm --version`, npm registry] |
| Vite | 8.0.14 | Frontend build/dev server | Current npm version; docs support React TypeScript setup and proxy/backend integration. [VERIFIED: npm registry, Context7 /vitejs/vite] |
| `@vitejs/plugin-react` | 6.0.2 | React plugin for Vite | Current npm version for React + Vite integration. [VERIFIED: npm registry] |
| TypeScript | 6.0.3 | Strict shared typing | Current npm version; Vite docs recommend strict TS options for modern projects. [VERIFIED: npm registry, Context7 /vitejs/vite] |
| React | 19.2.6 | Frontend UI runtime | Current npm version; official docs cover controlled forms, list rendering, and client fetch effects. [VERIFIED: npm registry, Context7 /reactjs/react.dev] |
| React DOM | 19.2.6 | Browser rendering | Version aligned with React. [VERIFIED: npm registry] |
| `@mui/material` | 9.0.1 | Component system | Required by UI spec and project constraints; docs cover ThemeProvider, CssBaseline, TextField, Table, Dialog/Drawer, and accessible controls. [VERIFIED: npm registry, UI-SPEC.md, Context7 /mui/material-ui] |
| `@mui/icons-material` | 9.0.1 | Icon library | Required by UI spec for add/edit/delete/save/close/open icons. [VERIFIED: npm registry, UI-SPEC.md] |
| `@emotion/react` | 11.14.0 | MUI styling peer dependency | Current npm package used with Material UI styling. [VERIFIED: npm registry] |
| `@emotion/styled` | 11.14.1 | MUI styled peer dependency | Current npm package used with Material UI styling. [VERIFIED: npm registry] |
| Express | 5.2.1 | Minimal backend API and static serving | Current npm version; docs cover JSON parsing, REST routes, static files, and error handling. [VERIFIED: npm registry, Context7 /expressjs/express] |
| `yaml` | 2.9.0 | YAML parse/stringify persistence | User locked YAML; docs show parsing/stringifying and `parseDocument` for richer malformed-file handling. [VERIFIED: npm registry, Context7 /eemeli/yaml, CONTEXT.md] |
| Zod | 4.4.3 | Shared schema validation | Current npm version; docs show `safeParse`, issues paths, and formatted errors for API/UI validation. [VERIFIED: npm registry, Context7 /colinhacks/zod] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Vitest | 4.1.7 | Unit/component/API tests | Use for schema, YAML repository, API handlers, and React components. [VERIFIED: npm registry, Context7 /vitest-dev/vitest] |
| `@testing-library/react` | 16.3.2 | React component tests | Use for registry form/table behavior and accessibility queries. [VERIFIED: npm registry] |
| `@testing-library/jest-dom` | 6.9.1 | DOM assertions | Use with Vitest setup for readable UI assertions. [VERIFIED: npm registry] |
| `jsdom` | 29.1.1 | DOM environment for component tests | Vitest docs support jsdom as a DOM environment. [VERIFIED: npm registry, Context7 /vitest-dev/vitest] |
| Supertest | 7.2.2 | HTTP API tests | Use to exercise Express registry endpoints without starting an external server. [VERIFIED: npm registry] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Express | Fastify/Hono | Express has sufficient current docs and minimal Phase 1 requirements; alternative frameworks add migration surface before lifecycle needs are known. [VERIFIED: Context7 /expressjs/express] [ASSUMED] |
| Zod | Manual validation | Manual validation duplicates edge cases and weakens shared API/UI contracts. [VERIFIED: Context7 /colinhacks/zod] |
| YAML file | SQLite/JSON | YAML is locked by user decisions; do not revisit unless YAML proves unable to meet persistence needs. [VERIFIED: CONTEXT.md] |
| React Hook Form | Local controlled state | Phase 1 form is moderate; React controlled inputs are officially documented and avoid introducing another dependency unless implementation complexity grows. [VERIFIED: Context7 /reactjs/react.dev] [ASSUMED] |

**Installation:**
```bash
npm install @vitejs/plugin-react vite typescript react react-dom @mui/material @mui/icons-material @emotion/react @emotion/styled express yaml zod
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom supertest @types/express @types/supertest @types/node
```

**Version verification:** Package versions above were verified with `npm view <package> version time.modified` on 2026-05-29. [VERIFIED: npm registry]

## Architecture Patterns

### System Architecture Diagram

```text
Browser loads React app
        |
        v
Material UI registry dashboard
        |
        | GET /api/projects
        | POST /api/projects
        | PUT /api/projects/:id
        | DELETE /api/projects/:id
        v
Express API routes
        |
        v
Shared Zod ProjectConfig / Registry schemas
        |
        +--> Validation failure -> 400 response with field paths -> UI field/helper errors
        |
        v
Registry repository service
        |
        +--> Read missing YAML -> empty registry
        +--> Read malformed YAML -> load error, no overwrite
        +--> Valid mutation -> write temp file -> rename to registry YAML
        v
YAML file at configurable data path
        |
        v
Docker volume or bind mount persists file across container restart
```

### Recommended Project Structure

```text
src/
├── client/
│   ├── App.tsx
│   ├── main.tsx
│   ├── api/projectsApi.ts
│   ├── components/
│   │   ├── ProjectRegistryPage.tsx
│   │   ├── ProjectTable.tsx
│   │   ├── ProjectFormDrawer.tsx
│   │   ├── ProjectMobileList.tsx
│   │   └── DeleteProjectDialog.tsx
│   └── theme.ts
├── server/
│   ├── index.ts
│   ├── app.ts
│   ├── routes/projects.ts
│   ├── registry/registryRepository.ts
│   └── registry/registryErrors.ts
└── shared/
    ├── projectSchema.ts
    └── projectTypes.ts
tests/
├── server/
├── client/
└── shared/
data/
└── .gitkeep
```

### Pattern 1: Shared Schema First

**What:** Define project and registry schemas once in `src/shared/projectSchema.ts`; import them in API routes, repository reads, and client form mapping. [VERIFIED: Context7 /colinhacks/zod]  
**When to use:** Every persistence read and API mutation. [VERIFIED: CONTEXT.md]  
**Example:**
```typescript
// Source: Context7 /colinhacks/zod safeParse examples
const result = projectInputSchema.safeParse(req.body);
if (!result.success) {
  return res.status(400).json({ issues: result.error.issues });
}
```

### Pattern 2: Repository Encapsulates YAML

**What:** Keep YAML parsing/stringifying inside `registryRepository.ts`; routes call repository methods and never manipulate YAML directly. [VERIFIED: Context7 /eemeli/yaml]  
**When to use:** List/create/update/delete and app startup load checks. [VERIFIED: CONTEXT.md]  
**Example:**
```typescript
// Source: Context7 /eemeli/yaml parse/stringify examples
import { parse, stringify } from 'yaml';

const registry = parse(fileContents);
const nextYaml = stringify(validatedRegistry);
```

### Pattern 3: Controlled Material UI Form

**What:** Use controlled React state for the drawer/dialog form and map Zod/API validation issues into `TextField` `error` and `helperText`. [VERIFIED: Context7 /reactjs/react.dev, Context7 /mui/material-ui]  
**When to use:** Add/edit project, env var key/value rows, switches, optional URL/path fields. [VERIFIED: UI-SPEC.md]  
**Example:**
```tsx
// Source: Context7 /reactjs/react.dev controlled input pattern; MUI TextField accessibility docs
<TextField
  label="Name"
  value={draft.name}
  onChange={(event) => setDraft({ ...draft, name: event.target.value })}
  error={Boolean(errors.name)}
  helperText={errors.name ?? ' '}
/>
```

### Pattern 4: API Boundary Owns Redaction

**What:** API responses may include environment variable values for edit forms, but logs/errors must not print those values. [VERIFIED: CONTEXT.md]  
**When to use:** Error handlers, request logging, test failure output, snackbar messages. [VERIFIED: AGENTS.md, CONTEXT.md]  
**Example:**
```typescript
// Source: project security decision in CONTEXT.md
const safeProjectForLog = ({ env, ...project }: ProjectConfig) => ({
  ...project,
  envCount: env.length,
});
```

### Anti-Patterns to Avoid

- **Browser writes YAML directly:** File persistence belongs on the backend; browser code should use API calls only. [VERIFIED: Context7 /expressjs/express, Context7 /eemeli/yaml]
- **Two separate schemas for UI and API:** Divergent schemas cause validation drift; use shared Zod schemas or shared constants for messages. [VERIFIED: Context7 /colinhacks/zod]
- **Overwriting malformed YAML on load:** Preserve the broken file and return a load error; otherwise local troubleshooting data can be destroyed. [VERIFIED: CONTEXT.md] [ASSUMED]
- **Displaying env values in the registry table:** UI spec only permits editing sensitive values in the form surface. [VERIFIED: UI-SPEC.md, CONTEXT.md]
- **Adding lifecycle controls in Phase 1:** Start/stop/restart, live health, logs, and port occupancy checks are later phases. [VERIFIED: ROADMAP.md, UI-SPEC.md]

## YAML Registry Model

Recommended persisted shape:

```yaml
version: 1
projects:
  - id: "project_01h..."
    name: "Example app"
    hostPath: "C:\\Users\\Lawrence\\Documents\\Dev\\example"
    containerPath: "/workspace/example"
    startCommand: "npm run dev"
    appUrl: "http://localhost:5173"
    port: 5173
    healthUrl: "http://localhost:5173/"
    envFilePath: ".env.local"
    env:
      - key: "NODE_ENV"
        value: "development"
    autostart: false
```

Schema guidance:

- Include a top-level `version: 1` for future migrations. [ASSUMED]
- Use stable generated `id` values for React keys and API update/delete paths. [VERIFIED: Context7 /reactjs/react.dev list key guidance] [ASSUMED]
- Required fields: `name`, `hostPath`, `containerPath`, `startCommand`. [VERIFIED: REQUIREMENTS.md, CONTEXT.md, UI-SPEC.md]
- Optional fields: `appUrl`, `port`, `healthUrl`, `envFilePath`, `env`, `autostart`; default `autostart` to `false` and `env` to `[]`. [VERIFIED: REQUIREMENTS.md, UI-SPEC.md] [ASSUMED]
- Validate ports as integers from 1 to 65535, matching UI validation copy. [VERIFIED: UI-SPEC.md]
- Validate env keys with letters, numbers, and underscores; planner should decide whether to require leading letter/underscore. [VERIFIED: UI-SPEC.md] [ASSUMED]
- Do not expand or execute env files in Phase 1; store only the path. [VERIFIED: Phase boundary in CONTEXT.md]

Persistence guidance:

- On missing registry file, return `{ version: 1, projects: [] }` and create the file on first save. [ASSUMED]
- On malformed YAML or schema-invalid persisted data, return a load error and do not overwrite the file automatically. [VERIFIED: CONTEXT.md] [ASSUMED]
- Write through a temporary file in the same directory, then rename into place for safer writes. [ASSUMED]
- Ensure the directory exists before writing. [ASSUMED]
- Preserve human readability with `yaml.stringify`; comment preservation is not required unless the planner explicitly adds it. [VERIFIED: Context7 /eemeli/yaml] [ASSUMED]

## UI Implementation Considerations

- Use `ThemeProvider` and `CssBaseline` at the React root. [VERIFIED: Context7 /mui/material-ui]
- First screen is `Projects` registry, never a landing page. [VERIFIED: UI-SPEC.md]
- Desktop registry uses `Table`, `TableHead`, `TableBody`, `TableRow`, and `TableCell`. [VERIFIED: UI-SPEC.md]
- Add/edit uses `Drawer` on desktop; use responsive `Dialog` or full-screen dialog on mobile if drawer usability is poor. [VERIFIED: UI-SPEC.md]
- Use icon-only `IconButton`s with `aria-label` for edit/delete and wrap long command/path values in `Tooltip` where truncated. [VERIFIED: UI-SPEC.md, Context7 /mui/material-ui]
- Keep env variable values out of table rows; show counts or presence only if needed. [VERIFIED: UI-SPEC.md]
- Keep table columns status-ready but do not show start/stop/restart or live status controls in Phase 1. [VERIFIED: UI-SPEC.md, ROADMAP.md]
- Show load error copy when the backend reports malformed/unreadable registry state. [VERIFIED: UI-SPEC.md]
- Destructive delete requires a confirmation dialog using the locked copy. [VERIFIED: UI-SPEC.md]
- Mobile layout may use compact rows/cards; avoid horizontal scroll unless intentionally contained and usable. [VERIFIED: UI-SPEC.md]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML parsing and serialization | Regex/string concatenation | `yaml` | YAML quoting, multiline strings, and parse errors are easy to mishandle. [VERIFIED: Context7 /eemeli/yaml] |
| Schema validation | Ad hoc nested `if` checks | Zod schemas with `safeParse` | Produces typed data and issue paths for API/UI errors. [VERIFIED: Context7 /colinhacks/zod] |
| Accessible forms and controls | Custom inputs/switches/icons | Material UI `TextField`, `Switch`, `IconButton`, `Tooltip`, `Dialog`/`Drawer` | Project requires MUI and docs cover accessible label/helper patterns. [VERIFIED: AGENTS.md, UI-SPEC.md, Context7 /mui/material-ui] |
| HTTP server/routing | Raw `http` route parser | Express | Express docs cover JSON parsing, REST handlers, static assets, and error middleware. [VERIFIED: Context7 /expressjs/express] |
| Test runner | Custom test harness | Vitest | Vite-native test framework with TypeScript and jsdom support. [VERIFIED: Context7 /vitest-dev/vitest] |

**Key insight:** The hard part of Phase 1 is not UI rendering; it is establishing the trustworthy contract between form data, API validation, YAML durability, and future command execution. [VERIFIED: CONTEXT.md, REQUIREMENTS.md] [ASSUMED]

## Common Pitfalls

### Pitfall 1: Path Ambiguity
**What goes wrong:** Only one path is stored, so later lifecycle execution cannot tell whether it is a host path or container mount path. [VERIFIED: CONTEXT.md]  
**Why it happens:** Local users think in host paths, while Docker commands run against mounted container paths. [CITED: Context7 /docker/docs]  
**How to avoid:** Require both `hostPath` and `containerPath`; show helper text from UI spec. [VERIFIED: UI-SPEC.md]  
**Warning signs:** Form labels say only "path"; YAML has a single `path` field. [VERIFIED: CONTEXT.md]

### Pitfall 2: Validation Drift
**What goes wrong:** UI accepts data that backend rejects, or backend accepts persisted data the UI cannot display. [ASSUMED]  
**Why it happens:** Separate schemas and hand-coded checks. [ASSUMED]  
**How to avoid:** Put Zod schema in `src/shared` and use it for API and persistence; map errors into UI helper text. [VERIFIED: Context7 /colinhacks/zod]  
**Warning signs:** Duplicate regexes or port/url checks in multiple files. [ASSUMED]

### Pitfall 3: Malformed YAML Data Loss
**What goes wrong:** A malformed YAML file is replaced with an empty registry during startup or save. [ASSUMED]  
**Why it happens:** Missing-file and parse-error paths are treated the same. [ASSUMED]  
**How to avoid:** Distinguish `ENOENT` from parse/schema errors; preserve malformed file and surface load error. [VERIFIED: CONTEXT.md]  
**Warning signs:** Catch block returns an empty registry for all errors. [ASSUMED]

### Pitfall 4: Secret Leakage
**What goes wrong:** Environment variable values appear in table cells, logs, API error messages, or test snapshots. [VERIFIED: CONTEXT.md, UI-SPEC.md]  
**Why it happens:** Treating env values like normal form metadata. [VERIFIED: CONTEXT.md]  
**How to avoid:** Only show values inside edit form fields; redact logs and error payloads. [VERIFIED: CONTEXT.md]  
**Warning signs:** `console.log(req.body)` in project routes or registry service. [ASSUMED]

### Pitfall 5: Premature Lifecycle UI
**What goes wrong:** Phase 1 implements start/stop/status controls without backend process semantics. [VERIFIED: ROADMAP.md, UI-SPEC.md]  
**Why it happens:** Registry table visually resembles a process dashboard. [ASSUMED]  
**How to avoid:** Keep only registry actions; leave status-ready space without fake states. [VERIFIED: UI-SPEC.md]  
**Warning signs:** Buttons labeled Start, Stop, Restart, or status values like Running in Phase 1. [VERIFIED: UI-SPEC.md]

## Code Examples

### Express Registry Routes
```typescript
// Source: Context7 /expressjs/express REST route and json middleware examples
app.use(express.json({ limit: '256kb' }));

app.get('/api/projects', async (_req, res, next) => {
  try {
    res.json(await registry.list());
  } catch (error) {
    next(error);
  }
});
```

### Zod Validation Result Mapping
```typescript
// Source: Context7 /colinhacks/zod safeParse and issues examples
const parsed = projectInputSchema.safeParse(req.body);
if (!parsed.success) {
  return res.status(400).json({
    message: 'Invalid project',
    issues: parsed.error.issues,
  });
}
```

### YAML Read/Write Boundary
```typescript
// Source: Context7 /eemeli/yaml parse/stringify examples
import { parse, stringify } from 'yaml';

const raw = await fs.readFile(registryPath, 'utf8');
const data = registrySchema.parse(parse(raw));
const next = stringify(data);
```

### Material UI Root
```tsx
// Source: Context7 /mui/material-ui ThemeProvider/CssBaseline example
root.render(
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <App />
  </ThemeProvider>,
);
```

### Controlled Form Field
```tsx
// Source: Context7 /reactjs/react.dev controlled input example; MUI TextField docs
<TextField
  label="Start command"
  value={draft.startCommand}
  onChange={(event) =>
    setDraft((current) => ({ ...current, startCommand: event.target.value }))
  }
  error={Boolean(errors.startCommand)}
  helperText={errors.startCommand ?? ' '}
/>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Vite 5/6/7 assumptions | Vite 8.0.14 is current on npm | Verified 2026-05-29 | Planner should use current plugin/config docs and not stale scaffolding. [VERIFIED: npm registry] |
| React 18 assumptions | React 19.2.6 is current on npm | Verified 2026-05-29 | Avoid React 18-only assumptions in generated package versions. [VERIFIED: npm registry] |
| MUI v5/v7 assumptions | `@mui/material` 9.0.1 is current on npm | Verified 2026-05-29 | Use current package versions while following stable MUI component patterns. [VERIFIED: npm registry, Context7 /mui/material-ui] |
| Express 4 defaults | Express 5.2.1 is current on npm | Verified 2026-05-29 | Plan for Express 5 behavior and current docs. [VERIFIED: npm registry, Context7 /expressjs/express] |
| JSON registry | YAML registry | Locked 2026-05-29 | Planner must use YAML and not substitute SQLite/JSON. [VERIFIED: CONTEXT.md] |

**Deprecated/outdated:**
- Single `path` field: replaced by `hostPath` and `containerPath` for Docker-aware execution planning. [VERIFIED: CONTEXT.md]
- Registry table env value display: prohibited by security-sensitive env decision. [VERIFIED: CONTEXT.md, UI-SPEC.md]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Default registry path can be `data/projects.yaml` or configurable via `DEVCTL_CONFIG_PATH`. | Summary, YAML Registry Model | Planner may choose a path that later Docker docs need to adjust. |
| A2 | Local controlled form state is sufficient without React Hook Form. | Standard Stack | Form complexity may grow and require a form library later. |
| A3 | Generated stable project IDs should be used. | YAML Registry Model | API update/delete and React keys become harder if IDs are omitted. |
| A4 | Missing registry file should mean empty registry; malformed file should block overwrite. | YAML Registry Model, Pitfalls | Wrong behavior could either break first run or lose user data. |
| A5 | Atomic temp-file then rename writes are sufficient for Phase 1 durability. | YAML Registry Model | Cross-platform rename behavior may need extra handling under Docker/Windows mounts. |
| A6 | Env key validation should use a conventional env-var regex. | YAML Registry Model | Some project-specific env names may be rejected if conventions differ. |

## Open Questions (RESOLVED)

1. **What exact registry file path should be the default?**
   - What we know: YAML persistence is locked, and Docker persistence is a v1 requirement. [VERIFIED: CONTEXT.md, REQUIREMENTS.md]
   - What's unclear: Whether config should live at `data/projects.yaml`, `/data/projects.yaml`, or a named app config directory. [ASSUMED]
   - Resolution: Use `DEVCTL_CONFIG_PATH` when set, otherwise default to `data/projects.yaml` from the repository/app working directory. Later Docker work can mount the `data/` directory or set `DEVCTL_CONFIG_PATH` to a mounted path without changing the registry contract.

2. **Should project IDs be user-visible?**
   - What we know: React lists need stable keys, and API delete/update routes need stable identifiers. [VERIFIED: Context7 /reactjs/react.dev] [ASSUMED]
   - What's unclear: Whether IDs should be exposed in YAML only or also shown in UI. [ASSUMED]
   - Resolution: Store stable generated IDs in YAML and API responses for update/delete and React keys. Do not show IDs in the Phase 1 registry UI.

3. **Should `.env` path be host-relative, container-relative, or either?**
   - What we know: Both host and container project paths are stored. [VERIFIED: CONTEXT.md]
   - What's unclear: Later execution may need the env file inside the container. [ASSUMED]
   - Resolution: Treat relative `.env` paths as relative to `containerPath`; allow absolute paths as entered. Phase 1 stores the path only and does not load or execute env files.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | App runtime/tooling | ✓ | 22.18.0 | — |
| npm | Dependency install/scripts | ✓ | 10.9.3 | — |
| Docker CLI | Persistence model verification later | ✓ | 29.5.2 | Phase 1 can test file persistence without Docker if needed. |
| git | Source control/docs commit | ✓ | 2.51.1.windows.1 | — |

**Missing dependencies with no fallback:** None verified. [VERIFIED: local commands]

**Missing dependencies with fallback:** None verified for Phase 1. [VERIFIED: local commands]

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.7 with jsdom 29.1.1 for React components. [VERIFIED: npm registry, Context7 /vitest-dev/vitest] |
| Config file | None exists yet; Wave 0 should add `vitest.config.ts`. [VERIFIED: filesystem scan] |
| Quick run command | `npm test -- --run` or `npm run test:unit -- --run` after scripts exist. [ASSUMED] |
| Full suite command | `npm run test && npm run build` after scripts exist. [ASSUMED] |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| REG-01 | Create project with required name/path/command and optional app URL. | API + component | `npm test -- tests/server/projects.test.ts tests/client/ProjectFormDrawer.test.tsx --run` | ❌ Wave 0 |
| REG-02 | Edit and delete registered projects. | API + component | `npm test -- tests/server/projects.test.ts tests/client/ProjectTable.test.tsx --run` | ❌ Wave 0 |
| REG-03 | Configure port, health URL, env vars, `.env` path, and autostart. | schema + component | `npm test -- tests/shared/projectSchema.test.ts tests/client/ProjectFormDrawer.test.tsx --run` | ❌ Wave 0 |
| REG-04 | Configuration persists across server/container restart via YAML file. | repository integration | `npm test -- tests/server/registryRepository.test.ts --run` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm test -- --run` once the suite exists. [ASSUMED]
- **Per wave merge:** `npm run build && npm test -- --run` once scripts exist. [ASSUMED]
- **Phase gate:** Full suite green plus manual browser smoke test for add/edit/delete and restart persistence. [ASSUMED]

### Wave 0 Gaps

- [ ] `package.json` — scripts and dependency manifest. [VERIFIED: filesystem scan]
- [ ] `vite.config.ts` — Vite React setup and API proxy for development. [VERIFIED: filesystem scan, Context7 /vitejs/vite]
- [ ] `tsconfig.json` — strict TypeScript config. [VERIFIED: filesystem scan, Context7 /vitejs/vite]
- [ ] `vitest.config.ts` — `node` tests for server/shared or `jsdom` setup for client tests. [VERIFIED: filesystem scan, Context7 /vitest-dev/vitest]
- [ ] `tests/shared/projectSchema.test.ts` — covers REG-01 and REG-03 validation. [ASSUMED]
- [ ] `tests/server/registryRepository.test.ts` — covers REG-04 file persistence and malformed YAML behavior. [ASSUMED]
- [ ] `tests/server/projects.test.ts` — covers REG-01 and REG-02 API behavior. [ASSUMED]
- [ ] `tests/client/ProjectRegistryPage.test.tsx` — covers visible registry workflows. [ASSUMED]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | v1 is trusted single-user local software; do not add auth in Phase 1. [VERIFIED: REQUIREMENTS.md] |
| V3 Session Management | no | No sessions in Phase 1. [VERIFIED: REQUIREMENTS.md] |
| V4 Access Control | limited | Bind API to local/trusted deployment assumptions; do not expose command/env data beyond app UI. [VERIFIED: PROJECT.md, AGENTS.md] [ASSUMED] |
| V5 Input Validation | yes | Zod schema for all API and persisted registry data. [VERIFIED: Context7 /colinhacks/zod] |
| V6 Cryptography | no | No cryptographic storage or secrets vault in Phase 1; env values are sensitive but stored as local config per decision. [VERIFIED: CONTEXT.md] |

### Known Threat Patterns for Node/React/YAML Registry

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malicious or malformed registry YAML | Tampering | Parse then validate with Zod before use; preserve bad file and show load error. [VERIFIED: Context7 /eemeli/yaml, Context7 /colinhacks/zod] [ASSUMED] |
| Environment value leakage | Information Disclosure | Do not log request bodies/env values; do not display env values in table. [VERIFIED: CONTEXT.md, UI-SPEC.md] |
| Command injection in later phases | Elevation of Privilege | Phase 1 stores command strings but does not execute them; label command fields clearly and keep execution out of scope. [VERIFIED: ROADMAP.md, UI-SPEC.md, AGENTS.md] |
| Overbroad Docker host access assumptions | Elevation of Privilege | Store both host/container paths and document mount reality; do not imply host path execution works without mounts. [VERIFIED: CONTEXT.md, Context7 /docker/docs] |
| Oversized API body | Denial of Service | Use `express.json({ limit: ... })` with a small registry mutation limit. [VERIFIED: Context7 /expressjs/express] [ASSUMED] |

## Sources

### Primary (HIGH confidence)

- `AGENTS.md` - project-specific stack, UI, security, and phase guidance.
- `.planning/PROJECT.md` - product purpose, Docker context, constraints, and active requirements.
- `.planning/REQUIREMENTS.md` - REG-01 through REG-04.
- `.planning/ROADMAP.md` - Phase 1 scope and boundaries.
- `.planning/STATE.md` - current project state.
- `.planning/phases/01-project-registry-foundation/01-CONTEXT.md` - locked decisions and discretion.
- `.planning/phases/01-project-registry-foundation/01-UI-SPEC.md` - Material UI registry UI contract.
- Context7 `/mui/material-ui` - ThemeProvider, CssBaseline, TextField, Tooltip/IconButton accessibility.
- Context7 `/vitejs/vite/v8.0.10` - React TypeScript setup, dev server proxy, backend integration.
- Context7 `/reactjs/react.dev` - controlled inputs, list keys, client fetching.
- Context7 `/eemeli/yaml` - parse/stringify and document parsing.
- Context7 `/colinhacks/zod/v4.0.1` - `safeParse`, issues, formatted errors.
- Context7 `/expressjs/express/v5.2.0` - JSON middleware, REST routes, static files, error handling.
- Context7 `/vitest-dev/vitest/v4.1.6` - jsdom environment and test configuration.
- Context7 `/docker/docs` - bind mount and volume behavior.
- npm registry - current package versions and modification dates.

### Secondary (MEDIUM confidence)

- None; no general web search findings were needed because Context7 and local project artifacts covered the phase.

### Tertiary (LOW confidence)

- Assumptions listed in the Assumptions Log; validate during planning if they become locked decisions.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - package versions verified through npm registry; stack choices constrained by project docs and Context7.  
- Architecture: HIGH - tier responsibilities follow locked phase boundaries and documented library capabilities.  
- Pitfalls: MEDIUM - core pitfalls come from project decisions; some durability and validation-drift warnings are engineering assumptions needing planner attention.

**Research date:** 2026-05-29  
**Valid until:** 2026-06-05 for package versions; 2026-06-29 for architecture unless phase scope changes.

## RESEARCH COMPLETE
