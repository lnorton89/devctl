# Phase 2: Lifecycle Process Control — Pattern Map

**Mapped:** 2026-05-29
**Files analyzed:** 10 (5 new, 5 modified)
**Analogs found:** 10 / 10

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/shared/projectSchema.ts` | model | CRUD | `src/shared/projectSchema.ts` (self) | exact |
| `src/server/process/processManager.ts` | service | event-driven | `src/server/registry/registryRepository.ts` | role-match |
| `src/server/process/packageJsonParser.ts` | utility | file-I/O | `src/server/registry/registryRepository.ts` | partial |
| `src/server/routes/lifecycle.ts` | controller | request-response | `src/server/routes/projects.ts` | exact |
| `src/server/routes/projects.ts` | controller | CRUD | `src/server/routes/projects.ts` (self) | exact |
| `src/server/app.ts` | config | request-response | `src/server/app.ts` (self) | exact |
| `src/client/api/projectsApi.ts` | utility | request-response | `src/client/api/projectsApi.ts` (self) | exact |
| `src/client/components/ProjectFormDrawer.tsx` | component | request-response | `src/client/components/ProjectFormDrawer.tsx` (self) | exact |
| `src/client/components/ProjectRegistryPage.tsx` | component | request-response | `src/client/components/ProjectRegistryPage.tsx` (self) | exact |
| `src/client/components/LogViewerDialog.tsx` | component | request-response | `src/client/components/DeleteProjectDialog.tsx` | role-match |

## Pattern Assignments

### `src/shared/projectSchema.ts` (model, CRUD) — MODIFY

**Analog:** `src/shared/projectSchema.ts` (self)

**Import pattern** (line 11):
```typescript
import { z } from 'zod';
```

**Field pattern — add `scriptName` after `startCommand`** (lines 71-73, insert after line 73):
```typescript
// Phase 1 existing fields stay as-is:
startCommand: z
  .string()
  .min(1, 'Start command is required.'),

  // NEW in Phase 2: which npm script to run (stored alongside path)
  scriptName: z.string().optional(),
```

**Extend `projectSchema` pattern** (lines 117-119):
```typescript
export const projectSchema = projectInputSchema.extend({
  id: z.string(),
});
```

**Schema structure pattern** (lines 61-101): Use existing `projectInputSchema = z.object({...})` with sub-schema composition pattern.

---

### `src/server/process/processManager.ts` (service, event-driven) — NEW

**Analog:** `src/server/registry/registryRepository.ts`

**Export pattern — factory function** (lines 54-61):
```typescript
export function createRegistryRepository(
  options: RegistryRepositoryOptions = {},
): RegistryRepository {
```

**Import pattern — built-in modules** (lines 10-13):
```typescript
import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
```

**Error class pattern** (from `src/server/registry/registryErrors.ts`, lines 17-33):
```typescript
export class ProcessNotFoundError extends Error {
  constructor(projectId: string) {
    super(`No managed process found for project: ${projectId}`);
    this.name = 'ProcessNotFoundError';
  }
}
```

**Return type interface** (from `src/server/registry/registryRepository.ts`, lines 34-43):
```typescript
export interface ProcessManager {
  start(projectId: string, scriptName: string, cwd: string): ProcessStatus;
  stop(projectId: string, timeoutMs?: number): ProcessStatus;
  restart(projectId: string, scriptName: string, cwd: string): Promise<ProcessStatus>;
  getStatus(projectId: string): ProcessStatus;
  getLogs(projectId: string): LogData;
}
```

**Map-based internal registry** (line 281 pattern):
```typescript
const processes = new Map<string, ManagedProcess>();
```

---

### `src/server/process/packageJsonParser.ts` (utility, file-I/O) — NEW

**Analog:** `src/server/registry/registryRepository.ts` (file I/O pattern)

**File read import pattern** (from `registryRepository.ts` line 10):
```typescript
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
```

**Custom error classes** (from `src/server/registry/registryErrors.ts`, lines 17-33):
```typescript
export class PackageJsonNotFoundError extends Error {
  constructor(path: string) {
    super(`No package.json found at ${path}`);
    this.name = 'PackageJsonNotFoundError';
  }
}

export class PackageJsonParseError extends Error {
  constructor(path: string, detail: string) {
    super(`Failed to parse package.json at ${path}: ${detail}`);
    this.name = 'PackageJsonParseError';
  }
}
```

**Return type pattern** (from `registryRepository.ts` line 29-33):
```typescript
export interface ParseResult {
  scripts: Record<string, string>;
  path: string;
}
```

---

### `src/server/routes/lifecycle.ts` (controller, request-response) — NEW

**Analog:** `src/server/routes/projects.ts` (exact match)

**Import pattern** (lines 10-19):
```typescript
import { Router } from 'express';
import type { ProcessManager } from '../process/processManager.js';
import {
  projectInputSchema,
  formatZodIssues,
} from '../../shared/projectSchema.js';
import {
  ProcessNotFoundError,
} from '../process/processManager.js';
```

**Router factory pattern** (lines 26-29):
```typescript
export function createLifecycleRouter(
  processManager: ProcessManager,
): Router {
  const router = Router();
```

**Route handler pattern with validation** (lines 46-61):
```typescript
router.post('/:id/start', async (req, res, next) => {
  try {
    const { id } = req.params;
    // Read project from repository to get cwd + scriptName
    const status = processManager.start(id, scriptName, cwd);
    res.json(status);
  } catch (error) {
    next(error);
  }
});
```

**GET handler returning data** (lines 34-41):
```typescript
router.get('/:id/status', async (req, res, next) => {
  try {
    const status = processManager.getStatus(req.params.id);
    res.json(status);
  } catch (error) {
    next(error);
  }
});
```

**POST handler without body** (lines 46-61, for lifecycle actions):
```typescript
router.post('/:id/stop', async (req, res, next) => {
  try {
    const status = processManager.stop(req.params.id);
    res.json(status);
  } catch (error) {
    next(error);
  }
});
```

**Error instanceof branch pattern** (lines 83-87):
```typescript
if (error instanceof ProcessNotFoundError) {
  return res.status(404).json({ message: error.message });
}
next(error);
```

---

### `src/server/routes/projects.ts` (controller, CRUD) — MODIFY

**Analog:** `src/server/routes/projects.ts` (self)

**Changes needed:**
1. Import `scriptName` from projectSchema (already imports from shared schema)
2. The `create` handler (line 46-62) and `update` handler (line 67-88) automatically validate new `scriptName` field since they use `projectInputSchema.safeParse(req.body)` — no handler code changes if `scriptName` is added to the schema as optional.

**No structural changes needed** — the schema-driven validation pattern (lines 48-55) auto-accepts the new optional field.

---

### `src/server/app.ts` (config, request-response) — MODIFY

**Analog:** `src/server/app.ts` (self)

**Import + mount pattern** (from lines 17-18, mount at line 60-61):
```typescript
import { createLifecycleRouter } from './routes/lifecycle.js';
import { createProcessManager } from './process/processManager.js';

// Inside createApp(), after existing project routes mount:
const processManager = createProcessManager();
const lifecycleRouter = createLifecycleRouter(processManager);
app.use('/api/projects', lifecycleRouter);
```

**Mount BEFORE existing CRUD routes** to avoid `:id` capturing lifecycle path segments (Pitfall 5 from RESEARCH.md) — order: lifecycle routes first, then CRUD routes.

---

### `src/client/api/projectsApi.ts` (utility, request-response) — MODIFY

**Analog:** `src/client/api/projectsApi.ts` (self)

**Shared DTO rule:** Import `ProcessStatus`, `LogData`, `PackageScripts`, and related lifecycle DTO types from `src/shared/lifecycleSchema.ts`, not from `src/server/process/*`.

**Existing method pattern** (lines 95-102):
```typescript
export async function startProject(id: string): Promise<ProcessStatus> {
  const response = await fetch(`${API_BASE}/${encodeURIComponent(id)}/start`, {
    method: 'POST',
  });
  return handleResponse<ProcessStatus>(response);
}
```

**Other lifecycle methods follow same pattern** — stop, restart, status, logs:
```typescript
export async function getProjectStatus(id: string): Promise<ProcessStatus> {
  const response = await fetch(`${API_BASE}/${encodeURIComponent(id)}/status`);
  return handleResponse<ProcessStatus>(response);
}
```

**POST with JSON body pattern** (lines 96-101):
```typescript
export async function parseScripts(dirPath: string): Promise<PackageScripts> {
  const response = await fetch(`${API_BASE}/parse-scripts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: dirPath }),
  });
  return handleResponse<PackageScripts>(response);
}
```

---

### `src/client/components/ProjectFormDrawer.tsx` (component, request-response) — MODIFY

**Analog:** `src/client/components/ProjectFormDrawer.tsx` (self)

**Form state interface** (lines 72-83): add `selectedScript` field:
```typescript
interface FormState {
  name: string;
  hostPath: string;
  containerPath: string;
  startCommand: string;
  scriptName: string;       // NEW
  selectedScript: string;   // NEW: selected from dropdown
  availableScripts: Record<string, string>; // NEW: from parse endpoint
  // ... rest unchanged
  appUrl: string;
  port: string;
  healthUrl: string;
  envFilePath: string;
  env: EnvVar[];
  autostart: boolean;
}
```

**MUI TextField with required/error/helper pattern** (lines 322-331):
```tsx
<TextField
  label="Name"
  value={form.name}
  onChange={(e) => handleChange('name', e.target.value)}
  error={Boolean(errors.name)}
  helperText={errors.name ?? ' '}
  required
  fullWidth
  size="small"
/>
```

**Directory picker pattern** — text input + hidden file input (new for Phase 2):
Use `<input type="file" webkitdirectory>` hidden behind a "Browse" MUI `Button`. When a directory is selected, populate the TextField with the path and call `parseScripts(path)` to populate the script dropdown.

**Select dropdown pattern** — use MUI `Select` + `MenuItem` for script selection:
```tsx
<FormControl fullWidth size="small" error={Boolean(errors.scriptName)}>
  <InputLabel>Script</InputLabel>
  <Select
    value={form.scriptName}
    label="Script"
    onChange={(e) => handleChange('scriptName', e.target.value)}
  >
    {Object.entries(form.availableScripts).map(([name, cmd]) => (
      <MenuItem key={name} value={name}>
        {name} — {cmd}
      </MenuItem>
    ))}
  </Select>
  {errors.scriptName && <FormHelperText>{errors.scriptName}</FormHelperText>}
</FormControl>
```

**Submit payload builder** (lines 104-117) — derive `startCommand` from selected script:
```typescript
function buildPayload(state: FormState) {
  return {
    name: state.name,
    hostPath: state.hostPath,
    containerPath: state.containerPath,
    startCommand: `npm run ${state.scriptName}`, // Derived from script selection
    scriptName: state.scriptName,                 // Stored for future use
    // ... rest unchanged
  };
}
```

---

### `src/client/components/ProjectRegistryPage.tsx` (component, request-response) — MODIFY

**Analog:** `src/client/components/ProjectRegistryPage.tsx` (self)

**Data fetching pattern** (lines 77-94):
```typescript
const loadProjects = useCallback(async () => {
  setLoading(true);
  setError(null);
  try {
    const result = await listProjects();
    setProjects(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : LOAD_ERROR_MESSAGE;
    setError(message);
  } finally {
    setLoading(false);
  }
}, []);
```

**Add process status state** — hold per-project status in a `Map<string, ProcessStatus>`:
```typescript
const [processStatuses, setProcessStatuses] = useState<Map<string, ProcessStatus>>(new Map());
```

**Lifecycle action handler pattern**:
```typescript
const handleStartProject = useCallback(async (projectId: string) => {
  try {
    const status = await startProject(projectId);
    setProcessStatuses((prev) => {
      const next = new Map(prev);
      next.set(projectId, status);
      return next;
    });
  } catch (err: unknown) {
    setSaveError(err instanceof Error ? err.message : 'Failed to start project');
  }
}, []);
```

**Pass lifecycle handlers to ProjectTable/ProjectMobileList** as new props alongside existing `onEditProject`/`onDeleteProject`.

---

### `src/client/components/LogViewerDialog.tsx` (component, request-response) — NEW

**Analog:** `src/client/components/DeleteProjectDialog.tsx`

**Dialog import pattern** (lines 20-29):
```typescript
import { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  CircularProgress,
  Typography,
  Box,
} from '@mui/material';
```

**Props interface pattern** (from `DeleteProjectDialog.tsx` lines 38-47):
```typescript
export interface LogViewerDialogProps {
  open: boolean;
  projectId: string;
  onClose: () => void;
}
```

**Dialog structure pattern** (from `DeleteProjectDialog.tsx` lines 81-122):
```tsx
return (
  <Dialog
    open={open}
    onClose={onClose}
    aria-labelledby="log-viewer-title"
    fullWidth
    maxWidth="lg"
  >
    <DialogTitle id="log-viewer-title">
      Logs for {projectName}
    </DialogTitle>
    <DialogContent>
      {/* Log content in a monospace scrollable area */}
      <Box
        component="pre"
        sx={{
          fontFamily: 'monospace',
          fontSize: 12,
          bgcolor: 'grey.900',
          color: 'grey.100',
          p: 2,
          borderRadius: 1,
          maxHeight: 500,
          overflow: 'auto',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
        }}
      >
        {logs.map((line, i) => (
          <Box key={i} component="span" sx={{ display: 'block' }}>
            {line}
          </Box>
        ))}
      </Box>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Close</Button>
    </DialogActions>
  </Dialog>
);
```

**Loading state pattern** (from `DeleteProjectDialog.tsx` lines 59-78):
```typescript
const [loading, setLoading] = useState(false);
const [logs, setLogs] = useState<string[]>([]);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  if (open && projectId) {
    loadLogs(projectId);
  }
}, [open, projectId]);
```

---

## Shared Patterns

### Express Router Factory Pattern
**Source:** `src/server/routes/projects.ts` (lines 26-106)
**Apply to:** `src/server/routes/lifecycle.ts`

All route files follow this structure:
1. Dependency-inject the service into the factory function
2. Create `const router = Router()`
3. Define handlers with `try/catch` + `next(error)`
4. `return router`

```typescript
export function createXxxRouter(dependency: XxxService): Router {
  const router = Router();
  // route definitions...
  return router;
}
```

### Error Handling Pattern
**Source:** `src/server/routes/projects.ts` (lines 39, 60, 82-87)
**Apply to:** `src/server/routes/lifecycle.ts`

Throw/catch with typed error instances:
```typescript
try {
  // operation
} catch (error) {
  if (error instanceof ProjectNotFoundError) {
    return res.status(404).json({ message: error.message });
  }
  next(error);
}
```

### Centralized Error Handler
**Source:** `src/server/app.ts` (lines 64-84)
**Apply to:** Any new error types from `processManager.ts`

```typescript
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof RegistryLoadError) {
    return res.status(503).json({ message: '...', detail: err.message });
  }
  console.error(`Unhandled error [${err.name}]: ${err.message}`);
  res.status(500).json({ message: 'Internal server error' });
});
```

### Typed Fetch API Client Pattern
**Source:** `src/client/api/projectsApi.ts` (lines 51-132)
**Apply to:** New lifecycle methods added to the same file

```typescript
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let body: Record<string, unknown> = {};
    try { body = await response.json(); } catch { /* ignore */ }
    throw new ApiError(
      response.status,
      (body.message as string) ?? response.statusText,
      body.issues as FormattedIssue[] | undefined,
    );
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
```

### MUI Form Validation Pattern (Client-side + Server-side)
**Source:** `src/client/components/ProjectFormDrawer.tsx` (lines 201-262)
**Apply to:** Updated ProjectFormDrawer with script dropdown

1. Client-side: `projectInputSchema.safeParse(payload)` for field-level errors
2. Server-side: Same Zod schema in route handler, returns `formatZodIssues()`
3. Client maps API 400 issues to field errors via `apiErr.issues` array

### Test Pattern — Backend Integration Tests (Vitest + Supertest)
**Source:** `tests/server/projects.test.ts` (lines 1-238)
**Apply to:** `tests/server/lifecycle.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/server/app.js';
import { createRegistryRepository } from '../../src/server/registry/registryRepository.js';

describe('Lifecycle API', () => {
  let dir: string;
  let repository: RegistryRepository;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'devctl-lifecycle-test-'));
    repository = createRegistryRepository({
      registryPath: join(dir, 'projects.yaml'),
    });
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('starts a process and returns status', async () => {
    const app = createApp({ registryRepository: repository });
    const res = await request(app)
      .post('/api/projects/some-id/start');
    expect(res.status).toBe(200);
    expect(res.body.state).toBeDefined();
  });
});
```

### Test Pattern — Component Tests (Vitest + Testing Library)
**Source:** `tests/client/ProjectFormDrawer.test.tsx` (lines 1-725)
**Apply to:** Updated ProjectFormDrawer tests + LogViewerDialog tests

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock API module
const mockApiMethod = vi.hoisted(() => vi.fn());
vi.mock('../../src/client/api/projectsApi', () => ({
  apiMethod: mockApiMethod,
}));

const sampleProject = (overrides = {}): ProjectConfig => ({
  id: 'proj_001', name: 'Test', /* defaults */
  ...overrides,
});
```

### Test Pattern — Unit Tests (Schema)
**Source:** `tests/shared/projectSchema.test.ts` (lines 1-458)
**Apply to:** `tests/server/packageJsonParser.test.ts`

```typescript
describe('parsePackageJson', () => {
  it('handles valid package.json with scripts', async () => { /* ... */ });
  it('throws PackageJsonNotFoundError for missing file', async () => { /* ... */ });
  it('throws PackageJsonParseError for invalid JSON', async () => { /* ... */ });
  it('returns empty scripts when scripts field is missing', async () => { /* ... */ });
});
```

### State Machine Pattern (for tests)
**Source:** RESEARCH.md provides full state machine: `stopped → starting → running → stopping → stopped` (with `failed`/`errored` terminal states)
**Apply to:** `tests/server/processManager.test.ts` — test all valid transitions and guard conditions (reject start if already running, etc.)

---

## No Analog Found

| File | Role | Data Flow | Reason | Recommended Source |
|------|------|-----------|--------|-------------------|
| `src/server/process/processManager.ts` | service | event-driven | No existing process manager exists | RESEARCH.md lines 263-458 provides full reference implementation |
| `src/server/process/packageJsonParser.ts` | utility | file-I/O | No existing file-parse utility | RESEARCH.md lines 539-597 provides full reference implementation |
| `src/client/components/LogViewerDialog.tsx` | component | request-response | No existing log viewer | Base on DeleteProjectDialog.tsx pattern + custom log display content |

## Metadata

**Analog search scope:** `src/server/`, `src/client/`, `src/shared/`, `tests/`
**Files scanned:** 15 source files, 7 test files
**Pattern extraction date:** 2026-05-29
