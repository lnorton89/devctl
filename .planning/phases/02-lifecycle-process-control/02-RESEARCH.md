# Phase 2: Lifecycle Process Control — Research

**Researched:** 2026-05-29
**Domain:** Process lifecycle management, cross-platform process control, log capture, Express API extension, React/MUI form revision
**Confidence:** HIGH

## Summary

Phase 2 delivers the core value proposition of devctl: starting, stopping, and restarting registered dev servers from the control surface. It also revises the project creation model from a multi-field form to a pick-directory→select-script flow.

The primary effort splits into three areas: (1) a **process manager** service that wraps `child_process.spawn` with cross-platform process group management and in-memory ring buffer log capture, (2) **lifecycle API routes** following the established Express router factory pattern, and (3) **frontend revisions** to the ProjectFormDrawer for directory+script selection and to ProjectRegistryPage for lifecycle action buttons and status display.

**Key insight:** The process group kill pattern is the highest-risk area — Windows and Unix have fundamentally different mechanisms. On Unix, `detached: true` + negative PID process group kill handles clean tree termination. On Windows, `taskkill /T /F` is the only reliable approach. Do NOT add `cross-spawn` or `tree-kill` dependencies; Node.js native `child_process.spawn` with `shell: true` handles `.cmd` resolution cross-platform. The deprecated `args + shell: true` pattern (Node.js v23+) is avoided by passing the full command string as the first argument to spawn and keeping args empty.

**Primary recommendation:** Build a `processManager` module that encapsulates all spawn/kill/log state, hiding platform differences behind a clean `start(projectId, scriptName, cwd)` / `stop(projectId)` / `status(projectId)` API. Mount lifecycle routes at `/api/projects/:id/{start,stop,restart,status,logs}` following the existing router factory pattern. Revise the ProjectFormDrawer to swap the old multi-field inputs for a directory picker → script dropdown flow while keeping old fields in the Zod schema (hidden from UI).

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Project creation uses a directory picker (text input + browse) instead of individual field entry
- **D-02:** On path selection, devctl reads `package.json` from that directory and parses the `scripts` section
- **D-03:** User selects exactly one script per project (simpler lifecycle — one running state per project)
- **D-04:** Old Phase 1 fields (hostPath, containerPath, appUrl, port, healthUrl, envFilePath, env, autostart) remain in the database schema but are hidden from the creation/edit UI
- **D-05:** Process execution uses Node.js `child_process.spawn` with stdio pipes
- **D-06:** Each process runs in its own process group for clean kill (cross-platform)
- **D-07:** stdout and stderr are captured in memory with a ring buffer for live tail + history
- **D-08:** Process state machine: stopped → starting → running → stopping → stopped (with failed/errored terminal states)
- **D-09:** State is tracked in-memory (process registry), not persisted — restarts re-evaluate from stopped
- **D-10:** POST /api/projects/:id/start — spawns the process, returns current state
- **D-11:** POST /api/projects/:id/stop — sends SIGTERM then SIGKILL after timeout
- **D-12:** POST /api/projects/:id/restart — stop then start
- **D-13:** GET /api/projects/:id/status — returns current state, uptime, recent log tail
- **D-14:** All lifecycle endpoints return immediately with the resulting state (async pattern, poll GET /status for updates)
- **D-15:** Logs are captured per-run, with a history of previous runs kept
- **D-16:** Log data: stdout, stderr, start time, end time, exit code, crash detection
- **D-17:** GET /api/projects/:id/logs returns recent run history and current run's tail
- **D-18:** A project's enabled script name is stored alongside the project path

### the agent's Discretion
- Ring buffer size for log capture
- Exact status endpoint response shape
- Browse button implementation (file input vs Electron-style dialog vs path input)

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LIFE-01 | User can start a registered project's dev server from the UI | Process manager `start()` wraps `child_process.spawn` with `shell: true`, `detached: true`, stdio pipes. POST /api/projects/:id/start triggers spawn and returns state immediately. Frontend renders Start button that calls the API and polls status. |
| LIFE-02 | User can stop a running project from the UI | Process manager `stop()` uses `taskkill /T /F` on Windows, `process.kill(-pid, SIGTERM)→SIGKILL` on Unix for process group tree kill. POST /api/projects/:id/stop triggers kill and returns state. |
| LIFE-03 | User can restart a running or failed project from the UI | POST /api/projects/:id/restart delegates to stop then start sequentially (stop is blocking with timeout, start is fire-and-forget). Frontend calls restart endpoint. |
| LIFE-04 | User can see command failures and missing-path errors when lifecycle actions fail | Process manager catches spawn errors (ENOENT for missing path, EACCES for permissions) and transitions to `failed` state with error message. Status/lifecycle endpoints include error detail. |
</phase_requirements>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Process spawning | API / Backend | — | `child_process.spawn` runs in the Node.js server process. Browser tier cannot spawn processes. |
| Process state tracking | API / Backend | — | In-memory process registry lives in the server. State is NOT persisted (D-09). |
| Process tree kill | API / Backend | — | Requires access to `process.kill()` / `taskkill` / OS signals. Never touchable from browser. |
| Log capture and ring buffer | API / Backend | — | stdout/stderr streams are consumed server-side on the ChildProcess stream. |
| Log retrieval | API / Backend | — | GET /api/projects/:id/logs returns server-stored log data. |
| Directory picker | Browser / Client | — | File input dialog and directory path text input are browser-only UI concerns. |
| Package.json parsing | API / Backend | — | File system access to read and parse package.json. |
| Lifecycle action buttons | Browser / Client | — | Start/Stop/Restart button rendering and click handling. |
| Status polling | Browser / Client | — | Client polls GET /api/projects/:id/status for state transitions. |
| Lifecycle API dispatch | Browser / Client | — | Client calls POST lifecycle endpoints. |
| Schema / validation | Shared | API / Backend, Browser / Client | Zod schemas in `src/shared/` validated on both sides. Add `scriptName` field here. |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js `child_process` (built-in) | — | Process spawning, stdio pipes, signal handling | D-05 locked decision. Native module, zero dependencies. |
| Node.js `fs/promises` (built-in) | — | Read `package.json` from project directories | Native module for file I/O. |
| Express `Router` | ^5.2.1 | Lifecycle route handlers | Established Phase 1 pattern. Dependency-injected router factory. |
| Zod | ^4.4.3 | Schema validation for scriptName field | Existing project dependency. [VERIFIED: npm registry — zod@4.4.3 published 2025-07-08] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `os` (built-in) | — | `os.platform()` for Windows check | Process group kill path selection |
| `node:crypto` (built-in) | — | `randomUUID()` for run IDs | Uniquely identify each process run in log history |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `child_process.spawn` (native) | `cross-spawn` | `cross-spawn` fixes Windows `.cmd` resolution bugs, but D-05 explicitly mandates native `child_process.spawn`. Using `shell: true` provides the required cross-platform `.cmd` resolution without the dependency. |
| Native process tree kill | `tree-kill` | `tree-kill` is a well-known package (11yrs old) but the logic is trivial: Windows → `taskkill /T /F`, Unix → `process.kill(-pid)`. Not worth the dependency. |
| Ring buffer from npm | `ring-buffer-ts`, `circle-buffer` | Ring buffer is ~30 lines of TypeScript. Avoids package legitimacy concerns for a trivial data structure. |
| Fetch from npm | `node-fetch` (deprecated), `ky`, `axios` | Node.js 18+ has global `fetch`. Already used in Phase 1 client. No change needed. |

**Installation:** No new npm packages required for this phase. All capabilities use built-in Node.js modules or existing project dependencies.

**Version verification:** Only existing dependencies are used (`zod@^4.4.3` already installed). No new packages are introduced. Node.js `child_process`, `fs/promises`, `os`, `crypto` are built-in modules.

---

## Package Legitimacy Audit

> **Not required** — Phase 2 introduces **zero new external package dependencies**. All capabilities use:
> - Node.js built-in modules: `child_process`, `fs/promises`, `os`, `crypto`, `path`
> - Existing project dependencies: `zod` (already approved in Phase 1, v4.4.3)
> - Existing dev dependencies: `vitest`, `supertest` (already approved in Phase 1)
>
> The ring buffer log utility is implemented as ~30 lines of in-repo TypeScript, not an external package.

---

## Architecture Patterns

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────┐
│                        Browser / Client                            │
│                                                                    │
│  ProjectRegistryPage.tsx                                           │
│  ├── ProjectTable / ProjectMobileList                              │
│  │   ├── Status Chip (stopped/running/starting/stopping/failed)   │
│  │   └── Action Buttons (Start/Stop/Restart)                      │
│  └── ProjectFormDrawer.tsx (revised)                               │
│      ├── Directory Picker (text input + browse)                    │
│      └── Script Dropdown (populated from parse endpoint)           │
│                                                                    │
│  projectsApi.ts (extended)                                         │
│  └── startProject(id) / stopProject(id) / restartProject(id)       │
│    └── getStatus(id) / getLogs(id) / parseScripts(path)            │
└──────────────────┬─────────────────────────────────────────────────┘
                   │  HTTP (fetch)
                   ▼
┌────────────────────────────────────────────────────────────────────┐
│                      API / Backend (Express)                       │
│                                                                    │
│  app.ts                                                            │
│  └── /api/projects → createProjectsRouter(repository)             │
│  └── /api/projects/:id → createLifecycleRouter(processManager)    │
│      ├── POST /start         → processManager.start(id)           │
│      ├── POST /stop          → processManager.stop(id)            │
│      ├── POST /restart       → processManager.stop() then start() │
│      ├── GET /status         → processManager.getStatus(id)       │
│      └── GET /logs           → processManager.getLogs(id)         │
│  └── /api/projects/parse-scripts → parseScripts(path) endpoint    │
│                                                                    │
│  processManager.ts ←→ processRegistry (Map<id, ProcessState>)     │
│  packageJsonParser.ts ←→ fs.readFile('package.json')              │
└──────────────────┬─────────────────────────────────────────────────┘
                   │  child_process.spawn
                   ▼
┌────────────────────────────────────────────────────────────────────┐
│                     Managed Processes (OS)                         │
│                                                                    │
│  ┌───── shell (sh/cmd) ──── npm run dev ──── dev-server ───────┐  │
│  │ PID: 1234                          PID: 1235   PID: 1236    │  │
│  │ Process Group: 1234                 (same group)             │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  stdout ─pipe─► ring buffer (in-memory, last N lines)              │
│  stderr ─pipe─► ring buffer (in-memory, last N lines)              │
└────────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
src/
├── shared/
│   └── projectSchema.ts             ← Add scriptName field (optional)
├── server/
│   ├── app.ts                       ← Mount lifecycle + parse-scripts routes
│   ├── index.ts                     ← Unchanged
│   ├── routes/
│   │   ├── projects.ts              ← Unchanged (CRUD still works)
│   │   └── lifecycle.ts             ← NEW: lifecycle action handlers
│   │       GET  /api/projects/:id/status
│   │       POST /api/projects/:id/start
│   │       POST /api/projects/:id/stop
│   │       POST /api/projects/:id/restart
│   │       GET  /api/projects/:id/logs
│   │       POST /api/projects/parse-scripts  (or GET /api/projects/:id/scripts)
│   ├── process/
│   │   ├── processManager.ts        ← NEW: process registry + lifecycle logic
│   │   └── packageJsonParser.ts     ← NEW: read & parse package.json scripts
│   └── registry/
│       ├── registryRepository.ts    ← Unchanged
│       └── registryErrors.ts        ← Unchanged
├── client/
│   ├── api/
│   │   └── projectsApi.ts           ← EXTEND: lifecycle + parse-scripts methods
│   └── components/
│       ├── ProjectFormDrawer.tsx    ← REVISE: directory picker + script dropdown
│       ├── ProjectRegistryPage.tsx  ← EXTEND: lifecycle action buttons + status chips
│       ├── ProjectTable.tsx         ← EXTEND: add status + action columns
│       ├── ProjectMobileList.tsx    ← EXTEND: add status + action rows
│       └── ...                      ← Other components unchanged
tests/
├── server/
│   ├── lifecycle.test.ts            ← NEW: lifecycle endpoint integration tests
│   └── processManager.test.ts       ← NEW: unit tests for process manager
├── client/
│   ├── ProjectFormDrawer.test.tsx   ← EXTEND: tests for directory+script flow
│   └── ...                          ← Existing tests updated for new behavior
└── integration/
    └── lifecycleFlow.test.ts        ← NEW: full lifecycle integration test
```

### Pattern 1: Process Manager (encapsulated lifecycle service)

**What:** A service class/factory that owns the in-memory process registry and exposes lifecycle methods. Hides platform differences in spawn/kill from the route handlers.

**When to use:** Every lifecycle route delegates to this service. The Express routes are thin wrappers.

**Source:** Derived from Node.js `child_process` [official docs](https://nodejs.org/docs/latest-v26.x/api/child_process.html) [VERIFIED], cross-platform kill pattern from Gemini CLI [CITED: fossies.org/linux/gemini-cli/packages/core/src/utils/process-utils.ts]

```typescript
// src/shared/lifecycleSchema.ts
export type ProcessState =
  | 'stopped'
  | 'starting'
  | 'running'
  | 'stopping'
  | 'failed'
  | 'errored';

export interface RunRecord {
  runId: string;
  scriptName: string;
  startTime: Date;
  endTime?: Date;
  exitCode?: number | null;
  signalCode?: string | null;
  error?: string;
  stdout: string[];
  stderr: string[];
}

export interface ProcessStatus {
  state: ProcessState;
  uptime: number | null;        // seconds since start, null if not running
  currentRun: RunRecord | null;
  recentLogTail: string[];
  error?: string;
}
```

```typescript
// src/server/process/processManager.ts
import { spawn, execSync } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { createRingBuffer } from './ringBuffer.js';
import type { ProcessState, ProcessStatus, RunRecord } from '../../shared/lifecycleSchema.js';

const RING_BUFFER_SIZE = 1000;  // Claude's discretion — 1000 lines per run
const RUN_HISTORY_MAX = 5;      // Keep last 5 runs per project

interface ManagedProcess {
  child: ChildProcess;
  state: ProcessState;
  currentRun: RunRecord;
  history: RunRecord[];
}

export function createProcessManager() {
  const processes = new Map<string, ManagedProcess>();

  function start(projectId: string, scriptName: string, cwd: string): ProcessStatus {
    // Guard: reject if already running or starting
    const existing = processes.get(projectId);
    if (existing && (existing.state === 'running' || existing.state === 'starting' || existing.state === 'stopping')) {
      return buildStatus(existing);
    }

    const runId = randomUUID();
    const record: RunRecord = {
      runId,
      scriptName,
      startTime: new Date(),
      stdout: createRingBuffer(RING_BUFFER_SIZE),
      stderr: createRingBuffer(RING_BUFFER_SIZE),
    };

    const managed: ManagedProcess = {
      child: null!,
      state: 'starting',
      currentRun: record,
      history: existing?.history ?? [],
    };

    // Build the command string for cross-platform shell execution
    const command = `npm run ${scriptName}`;

    let child: ChildProcess;
    try {
      child = spawn(command, [], {
        shell: true,          // Cross-platform: resolves npm.cmd on Windows
        cwd,
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: true,       // New process group on Unix; no-op but safe on Windows
        windowsHide: true,    // No console window on Windows
      });
    } catch (err) {
      managed.state = 'errored';
      managed.currentRun.error = err instanceof Error ? err.message : String(err);
      processes.set(projectId, managed);
      return buildStatus(managed);
    }

    managed.child = child;
    processes.set(projectId, managed);

    // Capture stdout
    child.stdout!.on('data', (chunk: Buffer) => {
      const lines = chunk.toString('utf-8').split('\n').filter(Boolean);
      for (const line of lines) {
        managed.currentRun.stdout.push(line);
      }
      // Transition to running on first output (heuristic)
      if (managed.state === 'starting') {
        managed.state = 'running';
      }
    });

    // Capture stderr
    child.stderr!.on('data', (chunk: Buffer) => {
      const lines = chunk.toString('utf-8').split('\n').filter(Boolean);
      for (const line of lines) {
        managed.currentRun.stderr.push(line);
      }
    });

    // Handle exit
    child.on('exit', (code, signal) => {
      managed.currentRun.endTime = new Date();
      managed.currentRun.exitCode = code;
      managed.currentRun.signalCode = signal;
      managed.state = code === 0 ? 'stopped' : 'failed';
      // Trim history
      managed.history.push({ ...managed.currentRun });
      if (managed.history.length > RUN_HISTORY_MAX) {
        managed.history = managed.history.slice(-RUN_HISTORY_MAX);
      }
    });

    child.on('error', (err) => {
      managed.currentRun.error = err.message;
      managed.state = 'errored';
    });

    return buildStatus(managed);
  }

  function stop(projectId: string, timeoutMs = 5000): ProcessStatus {
    const managed = processes.get(projectId);
    if (!managed || managed.state === 'stopped') {
      // Not running — consider it stopped
      return buildStatus(managed ?? { state: 'stopped' } as ManagedProcess);
    }

    managed.state = 'stopping';
    const pid = managed.child.pid;
    if (!pid) {
      managed.state = 'stopped';
      return buildStatus(managed);
    }

    // Cross-platform process tree kill
    const isWindows = process.platform === 'win32';

    if (isWindows) {
      try {
        execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore' });
      } catch {
        // Process tree already dead
      }
    } else {
      // Unix: SIGTERM to process group (negative PID = group leader)
      try {
        process.kill(-pid, 'SIGTERM');
      } catch {
        // Group may not exist
      }
    }

    // Wait for graceful shutdown, then escalate
    setTimeout(() => {
      if (managed.state === 'stopping') {
        if (isWindows) {
          // Already sent /F above, force is immediate
        } else {
          try {
            process.kill(-pid, 'SIGKILL');
          } catch {
            // Already dead
          }
        }
      }
    }, timeoutMs);

    return buildStatus(managed);
  }

  async function restart(projectId: string, scriptName: string, cwd: string): Promise<ProcessStatus> {
    stop(projectId);
    // Wait briefly for stop to take effect
    await new Promise(r => setTimeout(r, 100));
    return start(projectId, scriptName, cwd);
  }

  function getStatus(projectId: string): ProcessStatus {
    const managed = processes.get(projectId);
    return buildStatus(managed ?? { state: 'stopped' } as ManagedProcess);
  }

  function getLogs(projectId: string) {
    const managed = processes.get(projectId);
    if (!managed) return { history: [] };
    return {
      currentRun: managed.currentRun,
      history: managed.history,
    };
  }

  function buildStatus(mp: ManagedProcess): ProcessStatus {
    const uptime = mp.currentRun?.startTime
      ? Math.floor((Date.now() - mp.currentRun.startTime.getTime()) / 1000)
      : null;
    return {
      state: mp.state ?? 'stopped',
      uptime: mp.state === 'running' ? uptime : null,
      currentRun: mp.currentRun ?? null,
      recentLogTail: [
        ...(mp.currentRun?.stdout?.slice(-20) ?? []),
        ...(mp.currentRun?.stderr?.slice(-10) ?? []),
      ],
      error: mp.currentRun?.error,
    };
  }

  return { start, stop, restart, getStatus, getLogs };
}
```

### Pattern 2: Lifecycle Route Factory

**What:** Express router factory following the established Phase 1 pattern — dependency-inject the process manager, return a `Router`.

**When to use:** Mounted at `/api/projects` (same base path) alongside the CRUD router. Routes use `/:id` prefix for lifecycle actions.

**Source:** Established Phase 1 pattern from `src/server/routes/projects.ts` [VERIFIED: codebase]

```typescript
// src/server/routes/lifecycle.ts
import { Router } from 'express';
import type { ProcessManager } from '../process/processManager.js';

export function createLifecycleRouter(processManager: ProcessManager): Router {
  const router = Router();

  // POST /api/projects/:id/start
  router.post('/:id/start', async (req, res, next) => {
    try {
      const { id } = req.params;
      // Read project config from repository to get cwd + scriptName
      // processManager.start(id, scriptName, cwd);
      const status = processManager.start(id, 'dev', '/some/path');
      res.json(status);
    } catch (err) {
      next(err);
    }
  });

  // POST /api/projects/:id/stop
  router.post('/:id/stop', (req, res, next) => {
    try {
      const status = processManager.stop(req.params.id);
      res.json(status);
    } catch (err) {
      next(err);
    }
  });

  // POST /api/projects/:id/restart
  router.post('/:id/restart', async (req, res, next) => {
    try {
      const status = await processManager.restart(id, 'dev', '/some/path');
      res.json(status);
    } catch (err) {
      next(err);
    }
  });

  // GET /api/projects/:id/status
  router.get('/:id/status', (req, res, next) => {
    try {
      const status = processManager.getStatus(req.params.id);
      res.json(status);
    } catch (err) {
      next(err);
    }
  });

  // GET /api/projects/:id/logs
  router.get('/:id/logs', (req, res, next) => {
    try {
      const logs = processManager.getLogs(req.params.id);
      res.json(logs);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
```

### Pattern 3: Package.json Parser

**What:** Reads `package.json` from a given directory path and extracts the `scripts` section as key-value pairs.

**When to use:** Called when the user selects a directory in the project creation form. Also exposed as an API endpoint for the frontend to call.

```typescript
// src/server/process/packageJsonParser.ts
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export interface PackageScripts {
  [name: string]: string;
}

export interface ParseResult {
  scripts: PackageScripts;
  path: string;
}

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

export async function parsePackageJson(dirPath: string): Promise<ParseResult> {
  const pkgPath = resolve(dirPath, 'package.json');
  let raw: string;
  try {
    raw = await readFile(pkgPath, 'utf8');
  } catch (err) {
    throw new PackageJsonNotFoundError(pkgPath);
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new PackageJsonParseError(pkgPath, 'Invalid JSON');
  }

  const scripts = parsed.scripts;
  if (!scripts || typeof scripts !== 'object' || Array.isArray(scripts)) {
    return { scripts: {}, path: pkgPath };
  }

  const result: PackageScripts = {};
  for (const [key, value] of Object.entries(scripts)) {
    if (typeof value === 'string') {
      result[key] = value;
    }
  }

  return { scripts: result, path: pkgPath };
}
```

### Anti-Patterns to Avoid
- **Don't persist process state to YAML** — D-09 explicitly says in-memory only. Restarts always start from `stopped`.
- **Don't use `cross-spawn` or `tree-kill`** — D-05 mandates native `child_process.spawn`. The cross-platform patterns are simple enough to implement inline.
- **Don't block the event loop waiting for process exit** — Use events (`close`, `error`) not polling. Lifecycle endpoints return immediately (D-14).
- **Don't leak child processes on server crash** — The process group pattern (`detached: true` on Unix, `taskkill /T` on Windows) ensures cleanup. Detached processes on Unix DO become orphans if the parent crashes without cleanup — log this as a known limitation in README.
- **Don't set `startCommand` as read-only** — When revising the form to use directory+script flow, the old `startCommand` field should be computed from the selected script (`npm run ${scriptName}`) and included in the payload so the existing schema/API still works.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Process group tree kill | Custom `pgrep`/`tasklist` walking | `taskkill /T /F` (Windows) or `process.kill(-pid)` (Unix) | These are the standard OS primitives for tree kill. The logic is ~15 lines total. |
| Ring buffer data structure | Complex linked list or external lib | Simple array-based circular buffer (~30 lines TS) | The buffer only needs `push()` and `toArray()`. No npm package needed for this. |
| Cross-platform npm.cmd resolution | Custom PATH searching | `shell: true` in `child_process.spawn` | On Windows, `shell: true` uses `cmd.exe` which resolves `.cmd` files via PATHEXT. On Unix, it uses `sh`. [VERIFIED: Node.js docs] |

**Key insight:** Every cross-platform problem in this phase has a built-in Node.js solution. Adding dependencies for `cross-spawn`, `tree-kill`, or ring buffer libraries adds package audit overhead for no real benefit. The native solutions are mature, well-documented, and simpler than the abstractions.

---

## Runtime State Inventory

> Omitted — this is a greenfield phase (adding new capabilities, not renaming or migrating existing runtime state).

---

## Common Pitfalls

### Pitfall 1: Shell process survives kill on Unix
**What goes wrong:** Sending `child.kill('SIGTERM')` kills only the shell process (`sh -c "npm run dev"`), not `npm` or the dev server. The dev server continues running as an orphan.
**Why it happens:** With `shell: true`, the ChildProcess.pid is the PID of the shell, not the target command. Signals sent to just the shell process are not forwarded to its children by default.
**How to avoid:** Use `detached: true` when spawning, then kill the process group with `process.kill(-child.pid, 'SIGTERM')`. The negative PID targets the entire process group on Unix.
**Warning signs:** After stopping, `tasklist`/`ps` still shows the dev server process. Port remains occupied.

### Pitfall 2: Windows `taskkill /F` is immediate — no graceful shutdown
**What goes wrong:** `taskkill /F` forces termination immediately (equivalent to SIGKILL). The dev server doesn't get a chance to clean up (close database connections, save state, etc.).
**Why it happens:** Windows doesn't have POSIX signals. `taskkill /F` is the only reliable way to kill a process tree on Windows, but it's a force kill.
**How to avoid:** First try `taskkill /pid X /T` without `/F`, which sends `WM_CLOSE` for a graceful shutdown attempt. If the process still exists after a timeout, escalate to `/F`.
**Warning signs:** Dev servers may leave lock files, temp files, or database connections open after force kill.

### Pitfall 3: `npm run` doesn't resolve on Windows without `shell: true`
**What goes wrong:** `spawn('npm', ['run', 'dev'])` fails with `ENOENT` on Windows because `npm` is actually `npm.cmd`, and Node.js doesn't resolve `.cmd` files via PATHEXT.
**Why it happens:** Node.js `spawn` uses `CreateProcess` directly on Windows, which doesn't search PATHEXT. The command must be an actual executable (`.exe`), not a script wrapper.
**How to avoid:** Use `shell: true` so the command is executed via `cmd.exe` which does resolve PATHEXT. Or use the command-string pattern: `spawn('npm run dev', [], { shell: true })` [VERIFIED: Node.js child_process docs].
**Warning signs:** `ENOENT` errors on Windows but same code works on Mac/Linux.

### Pitfall 4: Ring buffer memory growth from unbounded string accumulation
**What goes wrong:** The ring buffer array is bounded, but individual string entries grow without limit if a single line of output is extremely long (e.g., a minified source map or binary data written to stdout).
**Why it happens:** Most ring buffer implementations only limit *count* of entries, not *size* of each entry.
**How to avoid:** Enforce a maximum line length (e.g., 4096 chars per entry) with truncation. Also set a global per-run memory cap (e.g., 10MB total across stdout+stderr).
**Warning signs:** V8 heap growth over time, especially for projects with verbose logging.

### Pitfall 5: Duplicate route patterns for lifecycle vs CRUD
**What goes wrong:** CRUD routes catch lifecycle paths. For example, `GET /api/projects/:id` might match `GET /api/projects/:id/status` incorrectly.
**Why it happens:** Express matches routes in definition order. If CRUD routes are mounted first, `:id` captures `status` as a project ID.
**How to avoid:** Mount lifecycle routes BEFORE CRUD routes in `app.ts`, or use specific paths: `/api/projects/:id/start` (nested under :id) — Express matches the most specific route first. Verify with the test suite.
**Warning signs:** 404 or wrong handler firing for lifecycle endpoints.

### Pitfall 6: `process.platform` is not a live check
**What goes wrong:** Code checks `process.platform === 'win32'` once at module load time and caches the result.
**Why it happens:** `process.platform` doesn't change at runtime, but caching isn't wrong here — it's fine. The real pitfall is forgetting to handle the `darwin`/`linux` distinction for signal names.
**How to avoid:** Always check `process.platform` at the point of use (not cached globally) to ensure readability. Use a helper: `const isWindows = process.platform === 'win32'`.
**Warning signs:** None — the cached value would be correct. But if someone tests on Windows and deploys to Linux, the static check is still fine.

---

## Code Examples

Verified patterns from official sources:

### Ring Buffer Implementation
```typescript
// src/server/process/ringBuffer.ts
// Self-implemented ~30-line ring buffer. No external dependency needed.
export function createRingBuffer(maxSize: number) {
  const buffer: string[] = [];
  let head = 0;
  let count = 0;

  return {
    push(line: string): void {
      if (count < maxSize) {
        buffer.push(line);
        count++;
      } else {
        buffer[head] = line;
        head = (head + 1) % maxSize;
      }
    },
    toArray(): string[] {
      if (count <= maxSize) return [...buffer];
      const result: string[] = [];
      for (let i = 0; i < maxSize; i++) {
        result.push(buffer[(head + i) % maxSize]);
      }
      return result;
    },
    get length(): number { return Math.min(count, maxSize); },
    clear(): void {
      buffer.length = 0;
      head = 0;
      count = 0;
    },
  };
}
```

### Zod v4: Extending the project schema with scriptName
```typescript
// src/shared/projectSchema.ts — ADD scriptName to input schema
export const projectInputSchema = z.object({
  // Existing required fields
  name: z.string().min(1, 'Name is required.'),
  hostPath: z.string().min(1, 'Host path is required.'),
  containerPath: z.string().min(1, 'Container path is required.'),
  startCommand: z.string().min(1, 'Start command is required.'),

  // NEW in Phase 2: which npm script to run (stored alongside path)
  scriptName: z.string().optional(),

  // --- Optional fields (unchanged, UI-hidden in Phase 2) ---
  appUrl: z.string().url('Enter a valid app URL.').optional(),
  port: z.number().int().gte(1).lte(65535).optional(),
  healthUrl: z.string().url('Enter a valid health URL.').optional(),
  envFilePath: z.string().optional(),

  // --- Optional with defaults ---
  env: z.array(envVarSchema).default([]),
  autostart: z.boolean().default(false),
});
```

### Cross-platform spawn with process group
```typescript
// CORRECT pattern — avoids Node.js v23+ deprecation of args+shell:true
function spawnDevServer(projectDir: string, scriptName: string): ChildProcess {
  // Full command as string (not separate args) — avoids deprecation warning
  const command = `npm run ${scriptName}`;
  return spawn(command, [], {
    shell: true,          // Resolves npm.cmd on Windows via cmd.exe
    cwd: projectDir,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,       // Creates process group on Unix
    windowsHide: true,    // No flash console window on Windows
    env: { ...process.env }, // Inherit parent env (safe for dev servers)
  });
}
// Source: Node.js v26 docs [VERIFIED: https://nodejs.org/docs/latest-v26.x/api/child_process.html]
```

### Cross-platform process tree kill
```typescript
// Source: Gemini CLI killProcessGroup utility pattern [CITED: fossies.org]
function killProcessTree(pid: number): void {
  if (process.platform === 'win32') {
    try {
      // Step 1: graceful via WM_CLOSE (no /F)
      execSync(`taskkill /pid ${pid} /T`, { stdio: 'ignore' });
    } catch {
      // Step 2: force kill if still alive
      try {
        execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore' });
      } catch {
        // Process already dead
      }
    }
  } else {
    // Unix: negative PID = process group leader
    try {
      process.kill(-pid, 'SIGTERM');  // Graceful
    } catch {
      // Group doesn't exist or already dead
    }
    // SIGTERM→SIGKILL escalation is handled by the calling code with a timeout
  }
}
```

### Status endpoint response shape (Claude's discretion)
```typescript
// GET /api/projects/:id/status — response shape
{
  "state": "running",           // "stopped" | "starting" | "running" | "stopping" | "failed" | "errored"
  "uptime": 342,                // seconds, null if not running
  "currentRun": {
    "runId": "abc-123",
    "scriptName": "dev",
    "startTime": "2026-05-29T12:00:00Z",
    "exitCode": null,           // null while running
    "error": null               // error message if state is "errored"
  },
  "recentLogTail": [
    "[12:01:00] Server started on port 3000",
    "[12:01:01] Listening..."
  ],
  "error": null                 // last error message if state is "failed"/"errored"
}
```

### API Client Extension
```typescript
// src/client/api/projectsApi.ts — ADD lifecycle + parse methods
const API_BASE = '/api/projects';

export async function startProject(id: string): Promise<ProcessStatus> {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}/start`, {
    method: 'POST',
  });
  return res.json();
}

export async function stopProject(id: string): Promise<ProcessStatus> {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}/stop`, {
    method: 'POST',
  });
  return res.json();
}

export async function restartProject(id: string): Promise<ProcessStatus> {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}/restart`, {
    method: 'POST',
  });
  return res.json();
}

export async function getProjectStatus(id: string): Promise<ProcessStatus> {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}/status`);
  return res.json();
}

export async function getProjectLogs(id: string): Promise<LogData> {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}/logs`);
  return res.json();
}

export async function parseScripts(dirPath: string): Promise<PackageScripts> {
  const res = await fetch(`${API_BASE}/parse-scripts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: dirPath }),
  });
  return res.json();
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `spawn('npm', ['run', 'dev'], { shell: true })` — passing args with shell:true | `spawn('npm run dev', [], { shell: true })` — full command string, empty args | Node.js v23.11.0+ / v22.15.0 | The old pattern is deprecated. The new pattern avoids the deprecation by passing the full command as the first arg. |
| Phase 1: all fields manual entry | Phase 2: directory picker → parse scripts → select one | Phase 2 | Simplifies UX while keeping backward-compatible schema. |
| State: not tracked (Phase 1 stores config only) | State: in-memory process registry | Phase 2 | No persistence migration needed. Restart from stopped always. |

**Deprecated/outdated:**
- `spawn` with separate `args` + `shell: true` — deprecated in Node.js v23.11.0. Use command-string pattern instead. [VERIFIED: Node.js docs]

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `taskkill /T` kills all descendants of the target process on Windows (not just immediate children). | Cross-platform pattern | If `/T` doesn't kill the full tree, orphan processes remain. Verified by multiple community sources and the Gemini CLI using the same pattern. LOW risk. |
| A2 | `process.kill(-pid, 'SIGTERM')` on Unix with `detached: true` kills the entire process group, not just the shell. | Cross-platform pattern | Verified by Node.js docs: "On non-Windows platforms, if `options.detached` is set to `true`, the child process will be made the leader of a new process group and session." And signal(7): "If pid is negative, the signal is sent to all processes in the process group identified by the absolute value of pid." MEDIUM risk — depends on OS behavior. |
| A3 | The ring buffer approach (pre-sized array with head pointer) is memory-safe for the expected log volumes. | Ring buffer | If a single log line is >10MB, we'd need per-entry truncation. Adding a MAX_LINE_LENGTH constant (4096 chars) mitigates this. LOW risk with the mitigation. |
| A4 | `npm` is always the package manager for registered projects. | Spawn pattern | Some projects may use `yarn`, `pnpm`, or `bun`. D-03 and D-18 assume `npm run <script>`. Phase 2 is scoped to npm. User can configure `startCommand` directly in Phase 1 schema if they need a different runner. |

---

## Open Questions (RESOLVED)

1. **Browse button implementation — RESOLVED**
   - What we know: D-01 says "text input + browse". Claude's discretion on implementation.
   - What's unclear: The standard HTML `<input type="file" webkitdirectory>` API works but is limited — it only allows directory selection, not path entry. A text input + the directory picker button is the standard pattern. Electron-style native dialogs are not available in a browser-only context.
   - Resolution: Use a text `TextField` for manual path entry plus a hidden `<input type="file" webkitdirectory>` behind a Material UI Browse button. The text field remains authoritative because browser directory pickers may not expose an absolute path consistently. This implements D-01 without requiring Electron or native dialogs.

2. **Start command derivation — RESOLVED**
   - What we know: The selected script name should produce `npm run <script>` as the startCommand.
   - What's unclear: Should the derived command be stored in `startCommand` at creation time, or computed at run time from `scriptName`?
   - Resolution: Store `startCommand` at creation/edit time as `npm run ${scriptName}` and also store `scriptName` as a separate field. Start/restart routes must validate the stored `scriptName` against the current `package.json` scripts before calling the process manager, then execute using the validated script name.

---

## Environment Availability

> Phase 2 introduces zero new external dependencies. All capabilities use Node.js built-in modules or existing project dependencies.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js `child_process` | Process spawning | ✓ (built-in) | Node.js 26.x | — |
| Node.js `fs/promises` | package.json parsing | ✓ (built-in) | Node.js 26.x | — |
| Node.js `os` | Platform detection | ✓ (built-in) | Node.js 26.x | — |
| Node.js `crypto` | Run ID generation | ✓ (built-in) | Node.js 26.x | — |
| `taskkill` (Windows) | Process tree kill on Windows | ✓ (OS built-in) | Windows 10+ | — |
| `kill` (Unix) | Process group kill on Unix | ✓ (OS built-in) | POSIX | — |

**Missing dependencies with no fallback:** None

---

## Validation Architecture

> nyquist_validation is enabled in config.json.

### Existing Test Infrastructure

| Property | Value |
|----------|-------|
| Framework | Vitest ^4.1.7 |
| Test location | `tests/` directory |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase 2 Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LIFE-01 | POST /start spawns a process | integration | `npx vitest run tests/server/lifecycle.test.ts` | ❌ Wave 0 |
| LIFE-02 | POST /stop terminates a running process | integration | `npx vitest run tests/server/lifecycle.test.ts` | ❌ Wave 0 |
| LIFE-03 | POST /restart stops then starts | integration | `npx vitest run tests/server/lifecycle.test.ts` | ❌ Wave 0 |
| LIFE-04 | Errors surfaced on missing path/failed command | integration | `npx vitest run tests/server/lifecycle.test.ts` | ❌ Wave 0 |
| Process state machine | State transitions are correct | unit | `npx vitest run tests/server/processManager.test.ts` | ❌ Wave 0 |
| Ring buffer | Fixed-size, oldest eviction, ordering preserved | unit | `npx vitest run tests/server/processManager.test.ts` | ❌ Wave 0 |
| Package.json parsing | Scripts extracted from valid packages | unit | `npx vitest run tests/server/processManager.test.ts` | ❌ Wave 0 |
| Frontend lifecycle API | Client methods call correct endpoints | component | `npx vitest run tests/client/...` | ❌ Wave 0 |

### Wave 0 Gaps

- [ ] `tests/server/lifecycle.test.ts` — lifecycle endpoint integration tests (REQ: LIFE-01 through LIFE-04)
- [ ] `tests/server/processManager.test.ts` — unit tests for process manager, ring buffer, state machine
- [ ] `tests/server/packageJsonParser.test.ts` — unit tests for package.json parsing (valid, missing, malformed)
- [ ] `tests/client/ProjectFormDrawer.test.tsx` — extend existing tests for directory picker + script dropdown
- [ ] `tests/client/ProjectRegistryPage.test.tsx` — extend for lifecycle action buttons

---

## Security Domain

> Security enforcement enabled (absent in config = enabled). Phase 2 introduces process execution, which expands the threat surface.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | yes | Zod schema validation for scriptName; path validation before reading package.json; no unsanitized input passed to `spawn` (command is constructed from user-config values) |
| V6 Cryptography | no | No cryptographic operations in this phase |
| V8 Data Protection | no | Logs are in-memory only, not persisted. No PII/sensitive data in scope. |

### Known Threat Patterns for Node.js child_process

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Command injection via script name | Tampering | Script names are validated against parsed package.json keys, not arbitrary user strings. The `command` string is `npm run ${scriptName}` where scriptName comes from a dropdown, not free-text. |
| Path traversal in package.json read | Information Disclosure | Resolve the path and verify it's within an expected directory structure if needed. For Phase 2 (trusted single-user), the user-visible path is inherently trusted but should be validated via `path.resolve`. |
| Resource exhaustion via process leaks | Denial of Service | Process manager tracks all spawned processes. Server restart would orphan detached children — documented limitation. |
| Uncontrolled log memory growth | DoS | Ring buffer has fixed size. Each entry capped at 4096 chars. Total per-project memory bounded by `(RING_BUFFER_SIZE + RUN_HISTORY_MAX * RING_BUFFER_SIZE) * MAX_LINE_LENGTH`. |

### Risk Acceptance
- Running untrusted `npm run` commands from user-configured projects is the core value proposition, not a vulnerability. devctl is a trusted single-user tool (out of scope for V2-V4 ASVS).

---

## Sources

### Primary (HIGH confidence)
- [CITED: Node.js v26.2.0 child_process docs](https://nodejs.org/docs/latest-v26.x/api/child_process.html) — spawn options, detached behavior, signal handling, Windows .cmd spawning
- [CITED: Node.js v26.2.0 process docs](https://nodejs.org/api/process.html) — process.execPath, process.kill, platform detection
- [VERIFIED: codebase] — src/server/routes/projects.ts router factory pattern, src/server/app.ts DI pattern, src/client/api/projectsApi.ts typed client, tests patterns
- [CITED: CONTEXT.md decisions](.planning/phases/02-lifecycle-process-control/02-CONTEXT.md) — All locked decisions D-01 through D-18

### Secondary (MEDIUM confidence)
- [CITED: Gemini CLI killProcessGroup utility](https://fossies.org/linux/gemini-cli/packages/core/src/utils/process-utils.ts) — Reference implementation for cross-platform SIGTERM→SIGKILL + taskkill pattern
- [CITED: Zod v4 migration guide](https://zod.dev/v4/changelog) — Breaking changes for Zod v4 (^4.4.3 in project)
- [CITED: ring-buffer-ts (domske)](https://github.com/domske/ring-buffer-ts) — Reference pattern for TypeScript circular buffer API design

### Tertiary (LOW confidence)
- Stack Overflow: Windows process kill patterns — verified against Node.js docs and Gemini CLI
- NPM registry: `cross-spawn`, `tree-kill`, `nano-spawn` — researched but not selected per D-05

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Only Node.js built-in modules and existing project dependencies. No new packages.
- Architecture: HIGH — Matches established Phase 1 patterns (DI router factory, typed API client, Vitest testing).
- Pitfalls: HIGH — Cross-platform process management pitfalls are well-documented by Node.js docs and community.
- Ring buffer: HIGH — Simple data structure, well-understood pattern, ~30 lines of TypeScript.

**Research date:** 2026-05-29
**Valid until:** 2026-07-29 (stable APIs — no external dependencies that could drift)
