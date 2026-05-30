import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
} from 'vitest';
import express from 'express';
import request from 'supertest';
import { EventEmitter } from 'node:events';
import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createLifecycleRouter } from '../../src/server/routes/lifecycle.js';
import { createRegistryRepository } from '../../src/server/registry/registryRepository.js';
import { createProcessManager } from '../../src/server/process/processManager.js';
import type { RegistryRepository } from '../../src/server/registry/registryRepository.js';
import type { ProcessManager } from '../../src/server/process/processManager.js';

// ---------------------------------------------------------------------------
// Mock node:net, node:http, node:https at the top level so the healthCheck
// module's underlying imports resolve without making real connections.
// Route tests spy on the healthCheck functions directly, so the net/http
// mocks are inert for those tests — they just need to exist.
// ---------------------------------------------------------------------------

const { mockTcpConnect } = vi.hoisted(() => ({
  mockTcpConnect: vi.fn(),
}));
vi.mock('node:net', () => ({
  connect: mockTcpConnect,
  default: { connect: mockTcpConnect },
}));

const { mockHttpGet } = vi.hoisted(() => ({
  mockHttpGet: vi.fn(),
}));
vi.mock('node:http', () => ({
  get: mockHttpGet,
  default: { get: mockHttpGet },
}));
vi.mock('node:https', () => ({
  get: mockHttpGet,
  default: { get: mockHttpGet },
}));

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

function tmpDir(): string {
  return mkdtempSync(join(tmpdir(), 'devctl-health-test-'));
}

function createPackageJson(dir: string, scripts: Record<string, string>): void {
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, 'package.json'),
    JSON.stringify({ scripts }, null, 2),
    'utf8',
  );
}

function validPayload(hostPath: string, overrides: Record<string, unknown> = {}) {
  return {
    name: 'Health Test App',
    hostPath,
    containerPath: '/workspace/test-app',
    startCommand: 'npm run dev',
    scriptName: 'dev',
    ...overrides,
  };
}

function createLifecycleTestApp(
  repository: RegistryRepository,
  processManager: ProcessManager,
): express.Application {
  const app = express();
  app.use(express.json());
  app.use('/api/projects', createLifecycleRouter(processManager, repository));
  app.use(
    (
      err: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      res.status(500).json({ message: err.message });
    },
  );
  return app;
}

/**
 * Retry-safe directory removal.
 * Spawned child processes may hold handles on temp dirs (EBUSY on win32).
 * Retries with progressive backoff to avoid flaky test cleanup.
 */
function forceRmDir(dir: string): void {
  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      rmSync(dir, { recursive: true, force: true });
      return;
    } catch {
      if (attempt === 29) {
        // Last attempt — let it throw
        rmSync(dir, { recursive: true, force: true });
        return;
      }
      // Busy-wait ~100ms before retrying
      const deadline = Date.now() + 100;
      while (Date.now() < deadline) {
        /* spin */
      }
    }
  }
}

function createMockSocket() {
  const socket = new EventEmitter() as EventEmitter & {
    destroy: () => void;
  };
  socket.destroy = vi.fn();
  return socket;
}

// =========================================================================
// checkPortOccupied unit tests (uses mocked node:net)
// =========================================================================

describe('checkPortOccupied', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns occupied: true when port responds', async () => {
    const { checkPortOccupied } = await import(
      '../../src/server/services/healthCheck.js'
    );
    const socket = createMockSocket();
    mockTcpConnect.mockReturnValue(socket);

    const resultPromise = checkPortOccupied(3000);
    socket.emit('connect');

    const result = await resultPromise;
    expect(result).toEqual({ occupied: true });
    expect(socket.destroy).toHaveBeenCalled();
  });

  it('returns occupied: false when port is refused', async () => {
    const { checkPortOccupied } = await import(
      '../../src/server/services/healthCheck.js'
    );
    const socket = createMockSocket();
    mockTcpConnect.mockReturnValue(socket);

    const resultPromise = checkPortOccupied(3000);
    const error = new Error('Connection refused');
    (error as NodeJS.ErrnoException).code = 'ECONNREFUSED';
    socket.emit('error', error);

    const result = await resultPromise;
    expect(result).toEqual({ occupied: false });
    expect(socket.destroy).toHaveBeenCalled();
  });

  it('handles timeouts gracefully', async () => {
    const { checkPortOccupied } = await import(
      '../../src/server/services/healthCheck.js'
    );
    const socket = createMockSocket();
    mockTcpConnect.mockReturnValue(socket);

    vi.useFakeTimers();
    const resultPromise = checkPortOccupied(3000);
    await vi.advanceTimersByTimeAsync(2100);

    const result = await resultPromise;
    expect(result).toEqual({ occupied: true, error: 'Connection timed out.' });
    expect(socket.destroy).toHaveBeenCalled();

    vi.useRealTimers();
  });
});

// =========================================================================
// checkHealthUrl unit tests (uses mocked node:http / node:https)
// =========================================================================

describe('checkHealthUrl', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns healthy: true when response is 2xx', async () => {
    const { checkHealthUrl } = await import(
      '../../src/server/services/healthCheck.js'
    );

    const mockReq = new EventEmitter() as EventEmitter & { destroy: () => void };
    mockReq.destroy = vi.fn();
    mockHttpGet.mockImplementation(
      (_url: string, _opts: unknown, cb: (res: { statusCode: number }) => void) => {
        cb({ statusCode: 200 });
        return mockReq;
      },
    );

    const result = await checkHealthUrl('http://localhost:3000/health');
    expect(result).toEqual({ healthy: true, statusCode: 200 });
  });

  it('returns healthy: false when response is non-2xx', async () => {
    const { checkHealthUrl } = await import(
      '../../src/server/services/healthCheck.js'
    );

    const mockReq = new EventEmitter() as EventEmitter & { destroy: () => void };
    mockReq.destroy = vi.fn();
    mockHttpGet.mockImplementation(
      (_url: string, _opts: unknown, cb: (res: { statusCode: number }) => void) => {
        cb({ statusCode: 500 });
        return mockReq;
      },
    );

    const result = await checkHealthUrl('http://localhost:3000/health');
    expect(result).toEqual({ healthy: false, statusCode: 500 });
  });

  it('handles request error', async () => {
    const { checkHealthUrl } = await import(
      '../../src/server/services/healthCheck.js'
    );

    const mockReq = new EventEmitter() as EventEmitter & { destroy: () => void };
    mockReq.destroy = vi.fn();
    mockHttpGet.mockImplementation(() => {
      return mockReq;
    });

    const resultPromise = checkHealthUrl('http://localhost:3000/health');
    mockReq.emit('error', new Error('ECONNREFUSED'));

    const result = await resultPromise;
    expect(result).toEqual({ healthy: false, error: 'ECONNREFUSED' });
  });
});

// =========================================================================
// processManager setState tests
// =========================================================================

describe('processManager setState', () => {
  it('returns null for unknown project', () => {
    const pm = createProcessManager();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = (pm as any).setState('unknown', 'unhealthy');
    expect(result).toBeNull();
  });

  it('updates state and returns updated ProcessStatus for known project', () => {
    const pm = createProcessManager();
    const dir = tmpDir();
    try {
      mkdirSync(dir, { recursive: true });

      const status = pm.start('test-id', 'dev', dir);
      expect(status.state).toBe('starting');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (pm as any).setState('test-id', 'unhealthy');
      expect(result).not.toBeNull();
      expect(result!.state).toBe('unhealthy');

      const retrieved = pm.getStatus('test-id');
      expect(retrieved.state).toBe('unhealthy');
    } finally {
      forceRmDir(dir);
    }
  });

  it('start() skips unhealthy projects', () => {
    const pm = createProcessManager();
    const dir = tmpDir();
    try {
      mkdirSync(dir, { recursive: true });

      pm.start('test-id', 'dev', dir);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (pm as any).setState('test-id', 'unhealthy');

      // Try to start again — should skip since unhealthy
      const result = pm.start('test-id', 'dev', dir);
      expect(result.state).toBe('unhealthy');
    } finally {
      forceRmDir(dir);
    }
  });

  it('stop() can stop unhealthy projects', () => {
    const pm = createProcessManager();
    const dir = tmpDir();
    try {
      mkdirSync(dir, { recursive: true });

      pm.start('test-id', 'dev', dir);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (pm as any).setState('test-id', 'unhealthy');

      // Stop should be allowed for unhealthy projects
      const result = pm.stop('test-id');
      expect(result.state).toBe('stopping');
    } finally {
      forceRmDir(dir);
    }
  });
});

// =========================================================================
// Health API route tests
// =========================================================================

describe('Health API', () => {
  let dir: string;
  let repository: RegistryRepository;
  let processManager: ProcessManager;

  beforeEach(() => {
    dir = tmpDir();
    repository = createRegistryRepository({
      registryPath: join(dir, 'projects.yaml'),
    });
    processManager = createProcessManager();
  });

  afterEach(() => {
    forceRmDir(dir);
    vi.restoreAllMocks();
  });

  describe('GET /api/projects/:id/health', () => {
    it('returns port and health fields for a project with both configured', async () => {
      createPackageJson(dir, { dev: 'node server.js' });
      const project = await repository.createProject(
        validPayload(dir, {
          port: 3000,
          healthUrl: 'http://localhost:3000/health',
        }),
      );

      const healthCheck = await import(
        '../../src/server/services/healthCheck.js'
      );
      const checkProjectHealthSpy = vi.spyOn(
        healthCheck,
        'checkProjectHealth',
      );
      checkProjectHealthSpy.mockResolvedValue({
        port: { occupied: true },
        health: { healthy: true, statusCode: 200 },
      });

      const app = createLifecycleTestApp(repository, processManager);
      processManager.start(project.id, 'dev', dir);

      const res = await request(app).get(
        `/api/projects/${project.id}/health`,
      );

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('port');
      expect(res.body).toHaveProperty('health');
      expect(res.body.port).toEqual({ occupied: true });
      expect(res.body.health).toEqual({ healthy: true, statusCode: 200 });
    });

    it('returns port:null when only healthUrl is configured', async () => {
      createPackageJson(dir, { dev: 'node server.js' });
      const project = await repository.createProject(
        validPayload(dir, { healthUrl: 'http://localhost:4000/health' }),
      );

      const healthCheck = await import(
        '../../src/server/services/healthCheck.js'
      );
      const checkProjectHealthSpy = vi.spyOn(
        healthCheck,
        'checkProjectHealth',
      );
      checkProjectHealthSpy.mockResolvedValue({
        port: null,
        health: { healthy: true, statusCode: 200 },
      });

      const app = createLifecycleTestApp(repository, processManager);
      processManager.start(project.id, 'dev', dir);

      const res = await request(app).get(
        `/api/projects/${project.id}/health`,
      );

      expect(res.status).toBe(200);
      expect(res.body.port).toBeNull();
      expect(res.body.health).toEqual({ healthy: true, statusCode: 200 });
    });

    it('returns 404 for unknown project id', async () => {
      const app = createLifecycleTestApp(repository, processManager);

      const res = await request(app).get('/api/projects/unknown/health');

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Project not found: unknown');
    });

    it('returns early with null results for stopped projects', async () => {
      createPackageJson(dir, { dev: 'node server.js' });
      const project = await repository.createProject(validPayload(dir));

      const app = createLifecycleTestApp(repository, processManager);

      const res = await request(app).get(
        `/api/projects/${project.id}/health`,
      );

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ port: null, health: null });
    });
  });

  describe('state transitions via health endpoint', () => {
    it('transitions running → unhealthy when port check fails', async () => {
      createPackageJson(dir, { dev: 'node server.js' });
      const project = await repository.createProject(
        validPayload(dir, { port: 3000 }),
      );

      const healthCheck = await import(
        '../../src/server/services/healthCheck.js'
      );
      const checkProjectHealthSpy = vi.spyOn(
        healthCheck,
        'checkProjectHealth',
      );
      checkProjectHealthSpy.mockResolvedValue({
        port: { occupied: false },
        health: null,
      });

      const app = createLifecycleTestApp(repository, processManager);
      processManager.start(project.id, 'dev', dir);

      const res = await request(app).get(
        `/api/projects/${project.id}/health`,
      );

      expect(res.status).toBe(200);
      expect(res.body.port).toEqual({ occupied: false });
      expect(processManager.getStatus(project.id).state).toBe('unhealthy');
    });

    it('transitions unhealthy → running when all checks pass', async () => {
      createPackageJson(dir, { dev: 'node server.js' });
      const project = await repository.createProject(
        validPayload(dir, { port: 3000 }),
      );

      const healthCheck = await import(
        '../../src/server/services/healthCheck.js'
      );
      const checkProjectHealthSpy = vi.spyOn(
        healthCheck,
        'checkProjectHealth',
      );
      checkProjectHealthSpy.mockResolvedValue({
        port: { occupied: true },
        health: null,
      });

      const app = createLifecycleTestApp(repository, processManager);
      processManager.start(project.id, 'dev', dir);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (processManager as any).setState(project.id, 'unhealthy');

      const res = await request(app).get(
        `/api/projects/${project.id}/health`,
      );

      expect(res.status).toBe(200);
      expect(res.body.port).toEqual({ occupied: true });
      expect(processManager.getStatus(project.id).state).toBe('running');
    });

    it('does not transition stopped projects', async () => {
      createPackageJson(dir, { dev: 'node server.js' });
      const project = await repository.createProject(validPayload(dir));

      const app = createLifecycleTestApp(repository, processManager);

      const res = await request(app).get(
        `/api/projects/${project.id}/health`,
      );

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ port: null, health: null });
      expect(processManager.getStatus(project.id).state).toBe('stopped');
    });
  });

  describe('pre-start port check', () => {
    it('POST /api/projects/:id/start returns 409 when port is occupied', async () => {
      createPackageJson(dir, { dev: 'node server.js' });
      const project = await repository.createProject(
        validPayload(dir, { port: 3000 }),
      );

      const healthCheck = await import(
        '../../src/server/services/healthCheck.js'
      );
      const checkPortOccupiedSpy = vi.spyOn(
        healthCheck,
        'checkPortOccupied',
      );
      checkPortOccupiedSpy.mockResolvedValue({ occupied: true });

      const app = createLifecycleTestApp(repository, processManager);

      const res = await request(app).post(
        `/api/projects/${project.id}/start`,
      );

      expect(res.status).toBe(409);
      expect(res.body.message).toBe('Port 3000 is already in use.');
    });

    it('POST /api/projects/:id/start proceeds normally when port is free', async () => {
      createPackageJson(dir, { dev: 'node server.js' });
      const project = await repository.createProject(
        validPayload(dir, { port: 3000 }),
      );

      const healthCheck = await import(
        '../../src/server/services/healthCheck.js'
      );
      const checkPortOccupiedSpy = vi.spyOn(
        healthCheck,
        'checkPortOccupied',
      );
      checkPortOccupiedSpy.mockResolvedValue({ occupied: false });

      const app = createLifecycleTestApp(repository, processManager);

      const res = await request(app).post(
        `/api/projects/${project.id}/start`,
      );

      expect(res.status).toBe(200);
      expect(res.body.state).toBe('starting');
    });
  });
});
