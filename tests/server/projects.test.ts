import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createApp } from '../../src/server/app.js';
import { createRegistryRepository } from '../../src/server/registry/registryRepository.js';
import type { RegistryRepository } from '../../src/server/registry/registryRepository.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function tmpDir(): string {
  return mkdtempSync(join(tmpdir(), 'devctl-projects-test-'));
}

/** Build a valid minimal project payload. */
function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Test App',
    hostPath: '/home/user/project',
    containerPath: '/workspace/project',
    startCommand: 'npm run dev',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Projects API', () => {
  let dir: string;
  let repository: RegistryRepository;

  beforeEach(() => {
    dir = tmpDir();
    repository = createRegistryRepository({
      registryPath: join(dir, 'projects.yaml'),
    });
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  // -----------------------------------------------------------------------
  // GET /api/projects — list projects (REG-01)
  // -----------------------------------------------------------------------
  describe('GET /api/projects', () => {
    it('returns an empty list when no projects exist', async () => {
      const app = createApp({ registryRepository: repository });
      const res = await request(app).get('/api/projects');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ projects: [] });
    });

    it('returns all created projects', async () => {
      const app = createApp({ registryRepository: repository });

      await repository.createProject(validPayload({ name: 'First' }));
      await repository.createProject(validPayload({ name: 'Second' }));

      const res = await request(app).get('/api/projects');
      expect(res.status).toBe(200);
      expect(res.body.projects).toHaveLength(2);
      expect(res.body.projects[0].name).toBe('First');
      expect(res.body.projects[1].name).toBe('Second');
    });
  });

  // -----------------------------------------------------------------------
  // POST /api/projects — create project (REG-01, REG-03)
  // -----------------------------------------------------------------------
  describe('POST /api/projects', () => {
    it('creates a project and returns 201 with the saved record', async () => {
      const app = createApp({ registryRepository: repository });
      const res = await request(app)
        .post('/api/projects')
        .send(validPayload())
        .expect('Content-Type', /json/);

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.name).toBe('Test App');
      expect(res.body.hostPath).toBe('/home/user/project');
    });

    it('returns 400 with issues for missing required fields', async () => {
      const app = createApp({ registryRepository: repository });
      const res = await request(app)
        .post('/api/projects')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('issues');
      expect(Array.isArray(res.body.issues)).toBe(true);
      expect(res.body.issues.length).toBeGreaterThan(0);
    });

    it('returns 400 with field-level issues for invalid port', async () => {
      const app = createApp({ registryRepository: repository });
      const res = await request(app)
        .post('/api/projects')
        .send(validPayload({ port: 99999 }));

      expect(res.status).toBe(400);
      const portIssue = res.body.issues.find(
        (i: { path: string }) => i.path === 'port',
      );
      expect(portIssue).toBeDefined();
      expect(portIssue.message).toMatch(/65535/);
    });

    it('returns 400 for invalid env key', async () => {
      const app = createApp({ registryRepository: repository });
      const res = await request(app)
        .post('/api/projects')
        .send(
          validPayload({ env: [{ key: 'INVALID-KEY', value: 'val' }] }),
        );

      expect(res.status).toBe(400);
      const envIssue = res.body.issues.find(
        (i: { path: string }) => i.path === 'env.0.key',
      );
      expect(envIssue).toBeDefined();
    });

    it('accepts a project with all optional fields (REG-03)', async () => {
      const app = createApp({ registryRepository: repository });
      const payload = validPayload({
        appUrl: 'http://localhost:3000',
        port: 3000,
        healthUrl: 'http://localhost:3000/health',
        envFilePath: '/workspace/.env',
        env: [{ key: 'NODE_ENV', value: 'development' }],
        autostart: true,
      });

      const res = await request(app).post('/api/projects').send(payload);
      expect(res.status).toBe(201);
      expect(res.body.appUrl).toBe('http://localhost:3000');
      expect(res.body.port).toBe(3000);
      expect(res.body.healthUrl).toBe('http://localhost:3000/health');
      expect(res.body.envFilePath).toBe('/workspace/.env');
      expect(res.body.env).toHaveLength(1);
      expect(res.body.autostart).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // PUT /api/projects/:id — update project (REG-02)
  // -----------------------------------------------------------------------
  describe('PUT /api/projects/:id', () => {
    it('updates an existing project and returns 200', async () => {
      const app = createApp({ registryRepository: repository });

      const created = await repository.createProject(
        validPayload({ name: 'Original' }),
      );
      const res = await request(app)
        .put(`/api/projects/${created.id}`)
        .send(validPayload({ name: 'Updated' }));

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(created.id);
      expect(res.body.name).toBe('Updated');
    });

    it('returns 404 for non-existent id', async () => {
      const app = createApp({ registryRepository: repository });
      const res = await request(app)
        .put('/api/projects/no-such-id')
        .send(validPayload());

      expect(res.status).toBe(404);
    });

    it('returns 400 for invalid update payload', async () => {
      const app = createApp({ registryRepository: repository });
      const created = await repository.createProject(validPayload());

      const res = await request(app)
        .put(`/api/projects/${created.id}`)
        .send({ name: '' });

      expect(res.status).toBe(400);
      expect(res.body.issues).toBeDefined();
    });
  });

  // -----------------------------------------------------------------------
  // DELETE /api/projects/:id — delete project (REG-02)
  // -----------------------------------------------------------------------
  describe('DELETE /api/projects/:id', () => {
    it('deletes an existing project and returns 204', async () => {
      const app = createApp({ registryRepository: repository });

      const created = await repository.createProject(validPayload());
      const res = await request(app).delete(`/api/projects/${created.id}`);

      expect(res.status).toBe(204);

      // Verify it's actually deleted
      const projects = await repository.listProjects();
      expect(projects).toHaveLength(0);
    });

    it('returns 404 for non-existent id', async () => {
      const app = createApp({ registryRepository: repository });
      const res = await request(app).delete('/api/projects/no-such-id');

      expect(res.status).toBe(404);
    });
  });

  // -----------------------------------------------------------------------
  // Registry load errors
  // -----------------------------------------------------------------------
  describe('registry load errors', () => {
    it('returns an error response when the registry contains malformed YAML', async () => {
      // Write malformed YAML directly
      const yamlPath = join(dir, 'malformed.yaml');
      writeFileSync(yamlPath, '{ broken', 'utf8');

      const badRepo = createRegistryRepository({ registryPath: yamlPath });
      const app = createApp({ registryRepository: badRepo });

      const res = await request(app).get('/api/projects');

      // Should return an error status (not 200)
      expect(res.status).not.toBe(200);
    });
  });
});
