# Phase 3: Operational Dashboard, Status, and Logs — Pattern Map

**Mapped:** 2026-05-30
**Files analyzed:** 8 (6 modified, 1 new, 1 new test file)
**Analogs found:** 7 / 8

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/shared/lifecycleSchema.ts` | schema | static | itself (add to enum) | exact-match |
| `src/server/services/healthCheck.ts` **[NEW]** | service | request-response | `src/server/process/packageJsonParser.ts` | role-match |
| `src/server/process/processManager.ts` | service | event-driven | itself (add methods) | exact-match |
| `src/server/routes/lifecycle.ts` | route | request-response | itself (add endpoints) | exact-match |
| `src/client/api/projectsApi.ts` | utility | request-response | itself (add functions) | exact-match |
| `src/client/components/ProjectTable.tsx` | component | request-response | itself (extend constants/columns) | exact-match |
| `src/client/components/ProjectMobileList.tsx` | component | request-response | itself (extend constants/rows) | exact-match |
| `src/client/components/ProjectRegistryPage.tsx` | component | request-response | itself (extend polling/state) | exact-match |

## Pattern Assignments

### `src/shared/lifecycleSchema.ts` (schema, static)

**Analog:** itself (lines 1-12)

**Core enum pattern** (lines 1-12) — add `'unhealthy'` to the Zod enum array:
```typescript
import { z } from 'zod';

export const processStateSchema = z.enum([
  'stopped',
  'starting',
  'running',
  'stopping',
  'failed',
  'errored',
  // Phase 3: add 'unhealthy'
]);
```

**Pattern notes:**
- Keep the enum order: terminal states last, transient/pulse states together
- `unhealthy` goes between `running` and `stopping` (transitional failed state)
- No other schema additions needed — `port` and `healthUrl` already exist in `projectSchema.ts` (lines 84-93)

---

### `src/server/services/healthCheck.ts` (service, request-response) **[NEW]**

**Analog:** `src/server/process/packageJsonParser.ts` (lines 1-70)

**Imports pattern** (Analog lines 1-6):
```typescript
import { connect } from 'node:net';
import { get } from 'node:http';
import type { ProjectConfig } from '../../shared/projectSchema.js';
```

**Error class pattern** (Analog lines 8-19):
```typescript
export class PortOccupiedError extends Error {
  constructor(port: number) {
    super(`Port ${port} is already in use.`);
    this.name = 'PortOccupiedError';
  }
}

export class HealthCheckTimeoutError extends Error {
  constructor(url: string) {
    super(`Health check timed out for ${url}`);
    this.name = 'HealthCheckTimeoutError';
  }
}
```

**Core service pattern** (Analog lines 26-53) — async functions, no class wrapper:
```typescript
const PORT_CHECK_TIMEOUT_MS = 2000;
const HEALTH_CHECK_TIMEOUT_MS = 2000;

export interface PortCheckResult {
  occupied: boolean;
  error?: string;
}

export interface HealthCheckResult {
  healthy: boolean;
  statusCode?: number;
  error?: string;
}

export async function checkPortOccupied(port: number, host = 'localhost'): Promise<PortCheckResult> {
  // TCP connect with timeout
  // If connect succeeds → occupied
  // If timeout/refused → available
}

export async function checkHealthUrl(url: string): Promise<HealthCheckResult> {
  // HTTP GET with timeout
  // 2xx → healthy
  // Otherwise → unhealthy
}

export type HealthStatus = { port: PortCheckResult; health: HealthCheckResult | null };
export async function checkProjectHealth(project: ProjectConfig): Promise<HealthStatus> {
  // Run port check + health URL check concurrently
}
```

**Export pattern** (Analog lines 26-27):
```typescript
export async function checkProjectHealth(
  // ... no wrapper object, just exported functions
```

**Pattern notes:**
- Use `AbortController` + `setTimeout` for timeouts (not `socket.setTimeout`)
- Run port and health checks concurrently via `Promise.all`
- Health check is only performed if `project.healthUrl` is configured
- Port check is always performed if `project.port` is configured

---

### `src/server/process/processManager.ts` (service, event-driven)

**Analog:** itself (lines 1-389)

**Interface expansion pattern** (lines 22-32) — add check method:
```typescript
export interface ProcessManager {
  start(projectId: string, scriptName: string, cwd: string): ProcessStatus;
  stop(projectId: string, timeoutMs?: number): ProcessStatus;
  restart(projectId: string, scriptName: string, cwd: string): Promise<ProcessStatus>;
  getStatus(projectId: string): ProcessStatus;
  getLogs(projectId: string): LogData;
  // Phase 3: add health check
  checkHealth?(projectId: string): Promise<{ healthy: boolean; port?: boolean; healthUrl?: boolean; error?: string }>;
}
```

**ManagedProcess extension pattern** (lines 41-53) — no changes needed; unhealthy state is just a state value.

**toStatus pattern** (lines 345-353) — already returns state; just needs to work with the new `unhealthy` value:
```typescript
function toStatus(managed: ManagedProcess): ProcessStatus {
  return {
    state: managed.state,
    uptime: getUptimeSeconds(managed.currentRun),
    currentRun: managed.currentRun,
    recentLogTail: managed.tail.toArray(),
    ...(managed.error ? { error: managed.error } : {}),
  };
}
```

**Pattern notes:**
- The `unhealthy` state is never set inside `processManager.ts` itself — it's managed externally by the health check polling loop
- The `getStatus` interface already returns `ProcessStatus` whose `state` field will include the new enum value
- Keep `processManager.ts` focused on process lifecycle; health state transitions happen at the route/app layer

---

### `src/server/routes/lifecycle.ts` (route, request-response)

**Analog:** itself (lines 1-293)

**Route pattern** (lines 40-44, 114-127) — add a new health-check endpoint:
```typescript
export function createLifecycleRouter(
  processManager: ProcessManager,
  repository: RegistryRepository,
  // Phase 3: add optional healthChecker
  healthChecker?: HealthChecker,
): Router {
```

**New endpoint pattern** — follow existing route structure (lines 193-204):
```typescript
router.get('/:id/health', async (req, res, next) => {
  try {
    await loadProject(repository, req.params.id);
    const result = await healthChecker.checkProjectHealth(req.params.id);
    res.json(result);
  } catch (error) {
    if (error instanceof ProjectNotFoundError) {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
});
```

**Error handling pattern** (lines 128-144, 199-204):
```typescript
try {
  // ... operation
} catch (error) {
  if (error instanceof ProjectNotFoundError) {
    return res.status(404).json({ message: error.message });
  }
  if (error instanceof PortOccupiedError) {
    return res.status(409).json({ message: error.message });  // 409 Conflict
  }
  next(error);
}
```

**Imports pattern** — follow existing (lines 11-30), add new error types as needed:
```typescript
import type { ProcessManager } from '../process/processManager.js';
import { ProjectNotFoundError } from '../registry/registryErrors.js';
import { PortOccupiedError } from '../services/healthCheck.js';
```

---

### `src/client/api/projectsApi.ts` (utility, request-response)

**Analog:** itself (lines 1-239)

**New API function pattern** (lines 193-208):
```typescript
// Phase 3: Health check
export async function checkProjectHealth(id: string): Promise<HealthCheckResponse> {
  const response = await fetch(`${API_BASE}/${encodeURIComponent(id)}/health`);
  return handleResponse<HealthCheckResponse>(response);
}
```

**Import pattern** — add new types to existing import (lines 11-17):
```typescript
import type {
  ProcessStatus,
  LogData,
  PackageJsonBrowserResponse,
  ParseScriptsResponse,
  HealthCheckResponse,  // Phase 3
} from '../../shared/lifecycleSchema.js';
```

**Pattern notes:**
- Follow the exact `handleResponse<T>` pattern (lines 57-76)
- Export `HealthCheckResponse` type from `lifecycleSchema.ts` or define locally
- Keep the API base constant and error handling consistent

---

### `src/client/components/ProjectTable.tsx` (component, request-response)

**Analog:** itself (lines 1-368)

**STATUS_* constants pattern** (lines 72-97) — add `unhealthy` entries:
```typescript
const STATUS_COLORS: Record<ProcessState, 'default' | 'success' | 'warning' | 'error'> = {
  stopped: 'default',
  starting: 'warning',
  running: 'success',
  stopping: 'warning',
  unhealthy: 'error',     // Phase 3 — red for degraded
  failed: 'error',
  errored: 'error',
};

const STATUS_VARIANTS: Record<ProcessState, 'filled' | 'outlined'> = {
  stopped: 'outlined',
  starting: 'filled',
  running: 'filled',
  stopping: 'filled',
  unhealthy: 'filled',   // Phase 3 — filled like other active states
  failed: 'filled',
  errored: 'outlined',
};

const STATUS_LABELS: Record<ProcessState, string> = {
  stopped: 'Stopped',
  starting: 'Starting',
  running: 'Running',
  stopping: 'Stopping',
  unhealthy: 'Unhealthy',  // Phase 3
  failed: 'Failed',
  errored: 'Error',
};
```

**Pulse animation pattern** (lines 99-105, 112-127) — `unhealthy` gets pulse like `starting`/`stopping`:
```typescript
function StatusChip({ state }: { state: ProcessState }) {
  const isTransition = state === 'starting' || state === 'stopping' || state === 'unhealthy';
  return (
    <Chip
      label={STATUS_LABELS[state]}
      size="small"
      color={STATUS_COLORS[state]}
      variant={STATUS_VARIANTS[state]}
      aria-label={`Status: ${STATUS_LABELS[state]}`}
      sx={
        isTransition
          ? { animation: 'pulse 1.5s ease-in-out infinite', ...pulseKeyframes }
          : undefined
      }
    />
  );
}
```

**Table column pattern** — Port column between Command and Status (lines 201-207, 253-258):
```typescript
<TableHead>
  <TableRow>
    <TableCell>Project</TableCell>
    <TableCell>Host path</TableCell>
    <TableCell>Command</TableCell>
    <TableCell sx={{ width: 80 }}>Port</TableCell>      {/* Phase 3 — port column */}
    <TableCell sx={{ width: 120 }}>Status</TableCell>
    <TableCell sx={{ width: 180 }}>Actions</TableCell>
  </TableRow>
</TableHead>
```

**Port cell pattern** — between Command cell and Status cell:
```typescript
// Phase 3: Port column with status indicator
<TableCell>
  {project.port ? (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
      <Box
        component="span"
        sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          bgcolor: portHealthy ? 'success.main' : 'error.main',
          display: 'inline-block',
        }}
      />
      <Typography
        component="span"
        sx={{ fontFamily: MONO_STACK, fontSize: 13 }}
      >
        {project.port}
      </Typography>
    </Box>
  ) : (
    <Typography component="span" color="text.secondary" sx={{ fontSize: 14 }}>
      &mdash;
    </Typography>
  )}
</TableCell>
```

**Props pattern** (lines 44-55) — add optional port health data:
```typescript
export interface ProjectTableProps {
  projects: ProjectConfig[];
  onEditProject: (project: ProjectConfig) => void;
  onDeleteProject: (project: ProjectConfig) => void;
  processStatuses?: Map<string, ProcessState>;
  loadingActions?: Set<string>;
  onStartProject?: (project: ProjectConfig) => void;
  onStopProject?: (project: ProjectConfig) => void;
  onRestartProject?: (project: ProjectConfig) => void;
  onOpenLogs?: (project: ProjectConfig) => void;
  expandedLogProjectId?: string | null;
  // Phase 3 — port/health status per project
  healthStatuses?: Map<string, { portHealthy: boolean; healthUrlHealthy?: boolean }>;
}
```

**Button visibility matrix pattern** (lines 165-176) — `unhealthy` allows stop/restart:
```typescript
function canStart(state: ProcessState | undefined): boolean {
  return state === undefined || state === 'stopped' || state === 'failed' || state === 'errored';
}

function canStop(state: ProcessState | undefined): boolean {
  return state === 'running' || state === 'starting' || state === 'unhealthy';  // Phase 3
}

function canRestart(state: ProcessState | undefined): boolean {
  return state === 'running' || state === 'failed' || state === 'unhealthy';  // Phase 3
}
```

**Column collapsing pattern** — hide Port column when no project has `port` set:
```typescript
// Determine if any project has port configured
const hasPortConfig = projects.some((p) => p.port != null);
```

**colSpan update** (line 353) — increase from 5 to 6 when port column is shown.

---

### `src/client/components/ProjectMobileList.tsx` (component, request-response)

**Analog:** itself (lines 1-312)

**STATUS_* constants** — identical additions as ProjectTable (lines 62-95).

**Pulse animation pattern** (lines 89-95, 286-293) — same pattern as ProjectTable.

**Port metadata row pattern** — add between Command and the status chip (around lines 296-300):
```typescript
<Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
  <MetadataRow label="Host" value={project.hostPath} />
  <MetadataRow label="Command" value={project.startCommand} />
  {/* Phase 3 — Port metadata */}
  {project.port && (
    <MetadataRow label="Port" value={String(project.port)} />
  )}
</Box>
```

**Props pattern** (lines 36-47) — same additions as ProjectTable.

---

### `src/client/components/ProjectRegistryPage.tsx` (component, request-response)

**Analog:** itself (lines 1-452)

**State additions pattern** (lines 52-60) — add health statuses state:
```typescript
// Lifecycle state
const [processStatuses, setProcessStatuses] = useState<Map<string, ProcessState>>(new Map());
const [loadingActions, setLoadingActions] = useState<Set<string>>(new Set());
const [lifecycleError, setLifecycleError] = useState<string | null>(null);

// Phase 3 — health check state
const [healthStatuses, setHealthStatuses] = useState<Map<string, HealthCheckResponse>>(new Map());
```

**Polling modification pattern** — extend the startPolling callback (lines 134-180) to also poll health for `running` projects:
```typescript
const startPolling = useCallback((projectId: string) => {
  stopPolling(projectId);

  const timer = setInterval(async () => {
    try {
      const status: ProcessStatus = await getProjectStatus(projectId);
      pollErrorCountRef.current.set(projectId, 0);

      setProcessStatuses((prev) => {
        const next = new Map(prev);
        next.set(projectId, status.state);
        return next;
      });

      // Phase 3 — for running/unhealthy projects, also check port/health
      if (status.state === 'running' || status.state === 'unhealthy') {
        try {
          const health = await checkProjectHealth(projectId);
          setHealthStatuses((prev) => {
            const next = new Map(prev);
            next.set(projectId, health);
            return next;
          });
        } catch {
          // health check failures are non-fatal
        }
      }

      // Stop polling on terminal states (unchanged)
      if (
        status.state === 'stopped' ||
        status.state === 'running' ||
        status.state === 'failed' ||
        status.state === 'errored'
      ) {
        stopPolling(projectId);
        setLoadingActions((prev) => {
          const next = new Set(prev);
          next.delete(projectId);
          return next;
        });
      }
    } catch {
      // ...error handling unchanged
    }
  }, POLL_INTERVAL_MS);

  pollingRef.current.set(projectId, timer);
}, [stopPolling]);
```

**Project display wiring pattern** (lines 387-415) — pass healthStatuses to children:
```typescript
{!loading && !error && projects.length > 0 && (
  isMobile ? (
    <ProjectMobileList
      projects={projects}
      onEditProject={handleEditProject}
      onDeleteProject={handleDeleteProject}
      processStatuses={processStatuses}
      loadingActions={loadingActions}
      onStartProject={handleStartProject}
      onStopProject={handleStopProject}
      onRestartProject={handleRestartProject}
      onOpenLogs={handleOpenLogs}
      expandedLogProjectId={expandedLogProjectId}
      // Phase 3
      healthStatuses={healthStatuses}
    />
  ) : (
    <ProjectTable
      projects={projects}
      onEditProject={handleEditProject}
      onDeleteProject={handleDeleteProject}
      processStatuses={processStatuses}
      loadingActions={loadingActions}
      onStartProject={handleStartProject}
      onStopProject={handleStopProject}
      onRestartProject={handleRestartProject}
      onOpenLogs={handleOpenLogs}
      expandedLogProjectId={expandedLogProjectId}
      // Phase 3
      healthStatuses={healthStatuses}
    />
  )
)}
```

**Imports pattern** (lines 10-35) — add new imports:
```typescript
import { checkProjectHealth } from '../api/projectsApi.js';  // Phase 3
```

---

### `src/server/app.ts` (app wiring)

**Analog:** itself (lines 1-103)

**Wiring pattern** (lines 65-71) — inject health checker into lifecycle router:
```typescript
// Phase 3: create health checker
import { createHealthChecker } from './services/healthCheck.js';

export function createApp(options?: CreateAppOptions): express.Application {
  // ...
  const healthChecker = createHealthChecker(processManager, repository);
  const lifecycleRouter = createLifecycleRouter(processManager, repository, healthChecker);
  app.use('/api/projects', lifecycleRouter);
  // ...
}
```

---

## Shared Patterns

### Enum Expansion
**Apply to:** `ProjectTable.tsx`, `ProjectMobileList.tsx`, `lifecycleSchema.ts`

All three files share identical `STATUS_COLORS`, `STATUS_VARIANTS`, and `STATUS_LABELS` structures. When adding `unhealthy`:
1. Add to `processStateSchema` Zod enum first
2. Add to all three `STATUS_*` constants in both `ProjectTable` and `ProjectMobileList`
3. Update `canStop` and `canRestart` to accept `unhealthy` in both components

### Pulse Animation
**Source:** `ProjectTable.tsx` lines 99-105, `ProjectMobileList.tsx` lines 89-95
**Apply to:** `unhealthy` state

The pulse keyframes are identical in both components. Add `unhealthy` to the `isTransition` check that gates the pulse animation:
```typescript
const isTransition = state === 'starting' || state === 'stopping' || state === 'unhealthy';
```

### Error Handling
**Source:** `src/server/routes/lifecycle.ts` lines 128-144
**Apply to:** Any new health check endpoints

Follow the existing `try/catch` → `instanceof` check → `res.status().json()` → `next(error)` pattern. Use `409 Conflict` for port-occupied errors.

### Route Ordering
**Source:** `src/server/app.ts` lines 65-75
**Apply to:** Any new health endpoint

Lifecycle router must mount before CRUD routes. The health-check endpoint at `/:id/health` must not conflict with CRUD `/:id` routes.

### API Client Pattern
**Source:** `src/client/api/projectsApi.ts` lines 57-76
**Apply to:** Any new health check API function

All API functions use `fetch` + `handleResponse<T>()`. The raw type is wrapped in the error handling layer.

### Test Patterns
**Source:** `tests/server/lifecycle.test.ts` — mock ProcessManager, supertest, temp dir
**Source:** `tests/client/ProjectRegistryPage.test.tsx` — vi.hoisted mocks, RTL render/waitFor
**Apply to:** New health check tests

Server tests use the `createProcessManagerMock()` + `createLifecycleTestApp()` + `supertest` pattern. Client tests use `vi.mock('../../src/client/api/projectsApi')` with hoisted mock functions.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/server/services/healthCheck.ts` **[NEW]** | service | request-response | No existing health/network check service exists. Use `packageJsonParser.ts` as the structural analog (typed errors, exported functions, no class). |

## Metadata

**Analog search scope:** `src/server/`, `src/client/`, `src/shared/`, `tests/`
**Files scanned:** 22
**Pattern extraction date:** 2026-05-30
