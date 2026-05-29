import express from 'express';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createLifecycleRouter } from '../../src/server/routes/lifecycle.js';
import { createRegistryRepository } from '../../src/server/registry/registryRepository.js';
import type { RegistryRepository } from '../../src/server/registry/registryRepository.js';
import type { ProcessManager } from '../../src/server/process/processManager.js';
import type { ProcessStatus } from '../../src/shared/lifecycleSchema.js';

function tmpDir(): string {
  return mkdtempSync(join(tmpdir(), 'devctl-lifecycle-test-'));
}

function createPackageJson(dir: string, scripts: Record<string, string>): void {
  writeFileSync(
    join(dir, 'package.json'),
    JSON.stringify({ scripts }, null, 2),
    'utf8',
  );
}

function validPayload(hostPath: string, overrides: Record<string, unknown> = {}) {
  return {
    name: 'Lifecycle App',
    hostPath,
    containerPath: '/workspace/lifecycle-app',
    startCommand: 'npm run dev',
    scriptName: 'dev',
    ...overrides,
  };
}

function status(overrides: Partial<ProcessStatus> = {}): ProcessStatus {
  return {
    state: 'starting',
    uptime: 0,
    currentRun: null,
    recentLogTail: [],
    ...overrides,
  };
}

function createProcessManagerMock(): ProcessManager {
  return {
    start: vi.fn(() => status()),
    stop: vi.fn(() => status({ state: 'stopping' })),
    restart: vi.fn(async () => status()),
    getStatus: vi.fn(() => status({ state: 'stopped', uptime: null })),
    getLogs: vi.fn(() => ({ currentRun: null, history: [] })),
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

describe('Lifecycle API', () => {
  let dir: string;
  let projectDir: string;
  let repository: RegistryRepository;
  let processManager: ProcessManager;

  beforeEach(() => {
    dir = tmpDir();
    projectDir = join(dir, 'project');
    repository = createRegistryRepository({
      registryPath: join(dir, 'projects.yaml'),
    });
    processManager = createProcessManagerMock();
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  describe('POST /api/projects/parse-scripts', () => {
    it('returns scripts from a package.json', async () => {
      createPackageJson(dir, {
        dev: 'vite',
        test: 'vitest',
      });

      const app = createLifecycleTestApp(repository, processManager);
      const res = await request(app)
        .post('/api/projects/parse-scripts')
        .send({ path: dir });

      expect(res.status).toBe(200);
      expect(res.body.scripts).toEqual({
        dev: 'vite',
        test: 'vitest',
      });
      expect(res.body.path).toContain('package.json');
    });

    it('returns 400 when body.path is missing', async () => {
      const app = createLifecycleTestApp(repository, processManager);
      const res = await request(app)
        .post('/api/projects/parse-scripts')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Path is required.');
    });

    it('returns 404 when package.json is missing', async () => {
      const app = createLifecycleTestApp(repository, processManager);
      const res = await request(app)
        .post('/api/projects/parse-scripts')
        .send({ path: dir });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('No package.json found at this path.');
    });

    it('returns 400 when package.json is malformed', async () => {
      writeFileSync(join(dir, 'package.json'), '{ broken', 'utf8');

      const app = createLifecycleTestApp(repository, processManager);
      const res = await request(app)
        .post('/api/projects/parse-scripts')
        .send({ path: dir });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe(
        'Could not read package.json. Check that the file is valid JSON.',
      );
    });
  });

  describe('POST /api/projects/:id/start', () => {
    it('validates scriptName and starts the registered project', async () => {
      createPackageJson(projectDir, { dev: 'vite' });
      const project = await repository.createProject(validPayload(projectDir));

      const app = createLifecycleTestApp(repository, processManager);
      const res = await request(app).post(`/api/projects/${project.id}/start`);

      expect(res.status).toBe(200);
      expect(processManager.start).toHaveBeenCalledWith(
        project.id,
        'dev',
        projectDir,
      );
      expect(res.body.state).toBe('starting');
    });

    it('returns 400 and does not start when scriptName is absent from package.json scripts', async () => {
      createPackageJson(projectDir, { test: 'vitest' });
      const project = await repository.createProject(validPayload(projectDir));

      const app = createLifecycleTestApp(repository, processManager);
      const res = await request(app).post(`/api/projects/${project.id}/start`);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe(
        'Configured script "dev" was not found in package.json.',
      );
      expect(processManager.start).not.toHaveBeenCalled();
    });

    it('returns 400 when the project has no scriptName', async () => {
      createPackageJson(projectDir, { dev: 'vite' });
      const project = await repository.createProject(
        validPayload(projectDir, { scriptName: undefined }),
      );

      const app = createLifecycleTestApp(repository, processManager);
      const res = await request(app).post(`/api/projects/${project.id}/start`);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe(
        'Project must have a scriptName before lifecycle actions can run.',
      );
      expect(processManager.start).not.toHaveBeenCalled();
    });

    it('returns 404 when the project id is missing', async () => {
      const app = createLifecycleTestApp(repository, processManager);
      const res = await request(app).post('/api/projects/missing/start');

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Project not found: missing');
      expect(processManager.start).not.toHaveBeenCalled();
    });
  });
});
