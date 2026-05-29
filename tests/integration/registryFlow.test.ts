/**
 * Integration test for the full project registry CRUD flow.
 *
 * Exercises the complete create / list / update / persistence / delete
 * cycle through HTTP routes using a dedicated temporary YAML registry
 * file so real user configuration is never touched (T-01-07-01).
 *
 * @module registryFlowTest
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createApp } from '../../src/server/app.js';
import { createRegistryRepository } from '../../src/server/registry/registryRepository.js';
import type { RegistryRepository } from '../../src/server/registry/registryRepository.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function tmpDir(): string {
  return mkdtempSync(join(tmpdir(), 'devctl-integration-'));
}

/**
 * Full project payload exercising all Phase 1 fields (REG-01, REG-03).
 *
 * Does NOT print or snapshot env values per T-01-07-02 (information
 * disclosure mitigation). Assertions check values in memory only.
 */
function fullPayload(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Integration Test App',
    hostPath: '/home/user/test-app',
    containerPath: '/workspace/test-app',
    startCommand: 'npm run dev',
    appUrl: 'http://localhost:5173',
    port: 5173,
    healthUrl: 'http://localhost:5173/health',
    envFilePath: '.env.local',
    env: [{ key: 'NODE_ENV', value: 'test' }],
    autostart: true,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Registry Flow (integration)', () => {
  let dir: string;
  let yamlPath: string;
  let repository: RegistryRepository;

  beforeEach(() => {
    dir = tmpDir();
    yamlPath = join(dir, 'projects.yaml');
    repository = createRegistryRepository({ registryPath: yamlPath });
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  // -----------------------------------------------------------------------
  // Full CRUD + Persistence cycle (REG-01 through REG-04)
  // -----------------------------------------------------------------------

  it('creates a project, persists across instances, updates, and deletes', async () => {
    // ---- 1. POST creates a project with ALL Phase 1 fields (REG-01, REG-03) ----
    const app1 = createApp({ registryRepository: repository });

    const createRes = await request(app1)
      .post('/api/projects')
      .send(fullPayload())
      .expect('Content-Type', /json/);

    expect(createRes.status).toBe(201);
    expect(createRes.body.id).toBeDefined();
    expect(createRes.body.name).toBe('Integration Test App');
    expect(createRes.body.hostPath).toBe('/home/user/test-app');
    expect(createRes.body.containerPath).toBe('/workspace/test-app');
    expect(createRes.body.startCommand).toBe('npm run dev');
    expect(createRes.body.appUrl).toBe('http://localhost:5173');
    expect(createRes.body.port).toBe(5173);
    expect(createRes.body.healthUrl).toBe('http://localhost:5173/health');
    expect(createRes.body.envFilePath).toBe('.env.local');
    expect(createRes.body.env).toHaveLength(1);
    expect(createRes.body.env[0].key).toBe('NODE_ENV');
    expect(createRes.body.env[0].value).toBe('test');
    expect(createRes.body.autostart).toBe(true);

    const projectId = createRes.body.id;

    // ---- 2. GET returns the created project in the list (REG-01) ----
    const listRes = await request(app1).get('/api/projects');
    expect(listRes.status).toBe(200);
    expect(listRes.body.projects).toHaveLength(1);
    expect(listRes.body.projects[0].id).toBe(projectId);

    // ---- 3. A new app/repository reading the SAME YAML file sees the data (REG-04) ----
    const repo2 = createRegistryRepository({ registryPath: yamlPath });
    const app2 = createApp({ registryRepository: repo2 });

    const listRes2 = await request(app2).get('/api/projects');
    expect(listRes2.status).toBe(200);
    expect(listRes2.body.projects).toHaveLength(1);
    expect(listRes2.body.projects[0].id).toBe(projectId);
    expect(listRes2.body.projects[0].name).toBe('Integration Test App');
    // Env and autostart survive re-load
    expect(listRes2.body.projects[0].env).toHaveLength(1);
    expect(listRes2.body.projects[0].autostart).toBe(true);

    // ---- 4. PUT updates editable fields (REG-02) ----
    const updateRes = await request(app1)
      .put(`/api/projects/${projectId}`)
      .send(
        fullPayload({
          name: 'Updated App',
          port: 3000,
          autostart: false,
        }),
      );

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.id).toBe(projectId);
    expect(updateRes.body.name).toBe('Updated App');
    expect(updateRes.body.port).toBe(3000);
    expect(updateRes.body.autostart).toBe(false);
    // Unchanged fields are preserved
    expect(updateRes.body.hostPath).toBe('/home/user/test-app');
    expect(updateRes.body.startCommand).toBe('npm run dev');

    // Verify GET reflects the update
    const getAfterUpdate = await request(app1).get('/api/projects');
    expect(getAfterUpdate.body.projects[0].name).toBe('Updated App');

    // ---- 5. YAML file exists with version: 1 (REG-04 / D-07, D-08) ----
    const yamlContent = readFileSync(yamlPath, 'utf8');
    expect(yamlContent).toContain('version: 1');
    expect(yamlContent).toContain('Updated App');
    expect(yamlContent).toContain('/workspace/test-app');
    // Env key preserved in YAML (assertion is in memory — not a snapshot, T-01-07-02 compliant)
    expect(yamlContent).toContain('NODE_ENV');

    // ---- 6. DELETE removes the project (REG-02) ----
    const deleteRes = await request(app1).delete(
      `/api/projects/${projectId}`,
    );
    expect(deleteRes.status).toBe(204);

    // Verify empty final state
    const finalRes = await request(app1).get('/api/projects');
    expect(finalRes.status).toBe(200);
    expect(finalRes.body.projects).toHaveLength(0);
  });

  // -----------------------------------------------------------------------
  // Edge cases
  // -----------------------------------------------------------------------

  it('returns empty list when no projects exist', async () => {
    const app = createApp({ registryRepository: repository });
    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ projects: [] });
  });

  it('returns 400 for missing required fields', async () => {
    const app = createApp({ registryRepository: repository });
    const res = await request(app)
      .post('/api/projects')
      .send({ name: '' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('issues');
  });

  it('returns 404 for non-existent id on PUT', async () => {
    const app = createApp({ registryRepository: repository });
    const res = await request(app)
      .put('/api/projects/non-existent-id')
      .send(fullPayload());

    expect(res.status).toBe(404);
  });

  it('returns 404 for non-existent id on DELETE', async () => {
    const app = createApp({ registryRepository: repository });
    const res = await request(app).delete(
      '/api/projects/non-existent-id',
    );

    expect(res.status).toBe(404);
  });

  it('returns 503 for malformed YAML registry file', async () => {
    writeFileSync(yamlPath, '{ broken yaml', 'utf8');

    const badRepo = createRegistryRepository({ registryPath: yamlPath });
    const app = createApp({ registryRepository: badRepo });

    const res = await request(app).get('/api/projects');

    expect(res.status).toBe(503);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('detail');
  });
});
