import { spawn, execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import type { ChildProcess } from 'node:child_process';
import type {
  LogData,
  ProcessState,
  ProcessStatus,
  RunRecord,
} from '../../shared/lifecycleSchema.js';
import { createRingBuffer, type RingBuffer } from './ringBuffer.js';

const DEFAULT_LOG_LINE_COUNT = 200;
const DEFAULT_HISTORY_LIMIT = 5;
const DEFAULT_STOP_TIMEOUT_MS = 5000;
const DEFAULT_RESTART_DELAY_MS = 50;
const USER_TERMINATION_SIGNALS = new Set<NodeJS.Signals | string>([
  'SIGHUP',
  'SIGINT',
  'SIGTERM',
]);

export interface ProcessManager {
  start(projectId: string, scriptName: string, cwd: string): ProcessStatus;
  stop(projectId: string, timeoutMs?: number): ProcessStatus;
  restart(
    projectId: string,
    scriptName: string,
    cwd: string,
  ): Promise<ProcessStatus>;
  getStatus(projectId: string): ProcessStatus;
  getLogs(projectId: string): LogData;
}

export interface ProcessManagerOptions {
  logLineCount?: number;
  historyLimit?: number;
  stopTimeoutMs?: number;
  restartDelayMs?: number;
}

interface ManagedProcess {
  state: ProcessState;
  child: ChildProcess | null;
  currentRun: RunRecord | null;
  stdout: RingBuffer;
  stderr: RingBuffer;
  tail: RingBuffer;
  history: RunRecord[];
  error?: string;
  completed: boolean;
  exitWaiters: Array<() => void>;
  stopTimer?: ReturnType<typeof setTimeout>;
}

export function createProcessManager(
  options: ProcessManagerOptions = {},
): ProcessManager {
  const logLineCount = options.logLineCount ?? DEFAULT_LOG_LINE_COUNT;
  const historyLimit = options.historyLimit ?? DEFAULT_HISTORY_LIMIT;
  const stopTimeoutMs = options.stopTimeoutMs ?? DEFAULT_STOP_TIMEOUT_MS;
  const restartDelayMs = options.restartDelayMs ?? DEFAULT_RESTART_DELAY_MS;
  const processes = new Map<string, ManagedProcess>();

  function start(projectId: string, scriptName: string, cwd: string): ProcessStatus {
    const existing = processes.get(projectId);
    if (
      existing &&
      (existing.state === 'starting' ||
        existing.state === 'running' ||
        existing.state === 'stopping')
    ) {
      return toStatus(existing);
    }

    const managed = createManagedProcess(scriptName, logLineCount);
    if (existing) {
      managed.history = existing.history;
    }
    processes.set(projectId, managed);

    const child = spawn(`npm run ${scriptName}`, [], {
      shell: true,
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: process.platform !== 'win32',
      windowsHide: true,
      env: process.env,
    });
    managed.child = child;

    child.on('spawn', () => {
      if (managed.state === 'starting') {
        managed.state = 'running';
      }
    });

    child.stdout?.on('data', (chunk: Buffer | string) => {
      captureOutput(managed, 'stdout', chunk);
      if (managed.state === 'starting') {
        managed.state = 'running';
      }
    });

    child.stderr?.on('data', (chunk: Buffer | string) => {
      captureOutput(managed, 'stderr', chunk);
      if (managed.state === 'starting') {
        managed.state = 'running';
      }
    });

    child.on('error', (error: Error) => {
      completeRun(managed, {
        state: 'errored',
        exitCode: null,
        signalCode: null,
        error: error.message,
        crashed: true,
        historyLimit,
      });
    });

    child.on('exit', (exitCode: number | null, signalCode: NodeJS.Signals | null) => {
      const exitState = classifyExit(managed, exitCode, signalCode);
      completeRun(managed, {
        state: exitState,
        exitCode,
        signalCode,
        crashed: exitState === 'failed',
        historyLimit,
      });
    });

    return toStatus(managed);
  }

  function stop(projectId: string, timeoutMs = stopTimeoutMs): ProcessStatus {
    const managed = processes.get(projectId);
    if (!managed || !managed.child || !managed.child.pid) {
      return getStatus(projectId);
    }

    if (managed.state !== 'running' && managed.state !== 'starting') {
      return toStatus(managed);
    }

    managed.state = 'stopping';
    terminateProcessTree(managed, timeoutMs);
    return toStatus(managed);
  }

  async function restart(
    projectId: string,
    scriptName: string,
    cwd: string,
  ): Promise<ProcessStatus> {
    const managed = processes.get(projectId);
    if (managed?.state === 'running' || managed?.state === 'starting') {
      stop(projectId);
      await waitForExit(managed);
    }

    await delay(restartDelayMs);
    return start(projectId, scriptName, cwd);
  }

  function getStatus(projectId: string): ProcessStatus {
    const managed = processes.get(projectId);
    if (!managed) {
      return stoppedStatus();
    }

    return toStatus(managed);
  }

  function getLogs(projectId: string): LogData {
    const managed = processes.get(projectId);
    if (!managed) {
      return {
        currentRun: null,
        history: [],
      };
    }

    return {
      currentRun: managed.currentRun,
      history: managed.history,
    };
  }

  function terminateProcessTree(
    managed: ManagedProcess,
    timeoutMs: number,
  ): void {
    const pid = managed.child?.pid;
    if (!pid) {
      return;
    }

    if (process.platform === 'win32') {
      execFile('taskkill', ['/pid', String(pid), '/T'], () => undefined);
      managed.stopTimer = setTimeout(() => {
        if (managed.state === 'running' || managed.state === 'stopping') {
          execFile(
            'taskkill',
            ['/pid', String(pid), '/T', '/F'],
            () => undefined,
          );
        }
      }, timeoutMs);
      return;
    }

    try {
      process.kill(-pid, 'SIGTERM');
    } catch {
      // The process may have already exited.
    }

    managed.stopTimer = setTimeout(() => {
      if (managed.state === 'running' || managed.state === 'stopping') {
        try {
          process.kill(-pid, 'SIGKILL');
        } catch {
          // The process may have already exited.
        }
      }
    }, timeoutMs);
  }

  return {
    start,
    stop,
    restart,
    getStatus,
    getLogs,
  };
}

function createManagedProcess(
  scriptName: string,
  logLineCount: number,
): ManagedProcess {
  const run: RunRecord = {
    runId: randomUUID(),
    scriptName,
    startTime: new Date().toISOString(),
    exitCode: null,
    signalCode: null,
    stdout: [],
    stderr: [],
    crashed: false,
  };

  return {
    state: 'starting',
    child: null,
    currentRun: run,
    stdout: createRingBuffer(logLineCount),
    stderr: createRingBuffer(logLineCount),
    tail: createRingBuffer(logLineCount),
    history: [],
    completed: false,
    exitWaiters: [],
  };
}

function captureOutput(
  managed: ManagedProcess,
  stream: 'stdout' | 'stderr',
  chunk: Buffer | string,
): void {
  const lines = String(chunk)
    .split(/\r?\n/)
    .filter((line) => line.length > 0);

  for (const line of lines) {
    managed[stream].push(line);
    managed.tail.push(line);
  }

  if (managed.currentRun) {
    managed.currentRun.stdout = managed.stdout.toArray();
    managed.currentRun.stderr = managed.stderr.toArray();
  }
}

function classifyExit(
  managed: ManagedProcess,
  exitCode: number | null,
  signalCode: NodeJS.Signals | string | null,
): ProcessState {
  if (
    managed.state === 'stopping' ||
    exitCode === 0 ||
    (signalCode && USER_TERMINATION_SIGNALS.has(signalCode))
  ) {
    return 'stopped';
  }

  return 'failed';
}

interface CompleteRunOptions {
  state: ProcessState;
  exitCode: number | null;
  signalCode: NodeJS.Signals | string | null;
  error?: string;
  crashed: boolean;
  historyLimit: number;
}

function completeRun(
  managed: ManagedProcess,
  options: CompleteRunOptions,
): void {
  if (managed.completed) {
    return;
  }

  managed.completed = true;
  managed.state = options.state;
  managed.error = options.error;
  if (managed.stopTimer) {
    clearTimeout(managed.stopTimer);
  }

  if (managed.currentRun) {
    managed.currentRun.endTime = new Date().toISOString();
    managed.currentRun.exitCode = options.exitCode;
    managed.currentRun.signalCode = options.signalCode;
    managed.currentRun.crashed = options.crashed;
    managed.currentRun.stdout = managed.stdout.toArray();
    managed.currentRun.stderr = managed.stderr.toArray();
    if (options.error) {
      managed.currentRun.error = options.error;
    }
    managed.history.push(managed.currentRun);
    managed.history = managed.history.slice(-options.historyLimit);
  }

  managed.child = null;
  managed.exitWaiters.splice(0).forEach((resolve) => resolve());
}

function toStatus(managed: ManagedProcess): ProcessStatus {
  return {
    state: managed.state,
    uptime: getUptimeSeconds(managed.currentRun),
    currentRun: managed.currentRun,
    recentLogTail: managed.tail.toArray(),
    ...(managed.error ? { error: managed.error } : {}),
  };
}

function stoppedStatus(): ProcessStatus {
  return {
    state: 'stopped',
    uptime: null,
    currentRun: null,
    recentLogTail: [],
  };
}

function getUptimeSeconds(run: RunRecord | null): number | null {
  if (!run || run.endTime) {
    return null;
  }

  return Math.max(
    0,
    Math.floor((Date.now() - new Date(run.startTime).getTime()) / 1000),
  );
}

function waitForExit(managed: ManagedProcess): Promise<void> {
  if (managed.state !== 'stopping') {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    managed.exitWaiters.push(resolve);
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
