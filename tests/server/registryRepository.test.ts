import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createRegistryRepository } from '../../src/server/registry/registryRepository.js';
import {
  RegistryLoadError,
  ProjectNotFoundError,
} from '../../src/server/registry/registryErrors.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a temp directory for each test's YAML file. */
function tmpDir(): string {
  return mkdtempSync(join(tmpdir(), 'devctl-registry-test-'));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('registryRepository', () => {
  let dir: string;

  beforeEach(() => {
    dir = tmpDir();
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  // -----------------------------------------------------------------------
  // Missing file behaviour
  // -----------------------------------------------------------------------
  describe('missing file', () => {
    it('returns an empty project list when the file does not exist', async () => {
      const repo = createRegistryRepository({
        registryPath: join(dir, 'missing.yaml'),
      });
      const projects = await repo.listProjects();
      expect(projects).toEqual([]);
    });
  });

  // -----------------------------------------------------------------------
  // Create (REG-01, REG-03)
  // -----------------------------------------------------------------------
  describe('createProject', () => {
    it('creates a project with required fields and assigns an id', async () => {
      const repo = createRegistryRepository({
        registryPath: join(dir, 'create.yaml'),
      });
      const project = await repo.createProject({
        name: 'My App',
        hostPath: '/home/user/project',
        containerPath: '/workspace/project',
        startCommand: 'npm run dev',
      });

      expect(project.id).toBeDefined();
      expect(typeof project.id).toBe('string');
      expect(project.id.length).toBeGreaterThan(0);
      expect(project.name).toBe('My App');
      expect(project.hostPath).toBe('/home/user/project');
      expect(project.containerPath).toBe('/workspace/project');
      expect(project.startCommand).toBe('npm run dev');
    });

    it('applies default values (env: [], autostart: false) on create', async () => {
      const repo = createRegistryRepository({
        registryPath: join(dir, 'defaults.yaml'),
      });
      const project = await repo.createProject({
        name: 'Defaults',
        hostPath: '/host',
        containerPath: '/ctr',
        startCommand: 'go run .',
      });

      expect(project.env).toEqual([]);
      expect(project.autostart).toBe(false);
    });

    it('persists optional fields when provided', async () => {
      const repo = createRegistryRepository({
        registryPath: join(dir, 'optional.yaml'),
      });
      const project = await repo.createProject({
        name: 'Full Config',
        hostPath: '/host',
        containerPath: '/ctr',
        startCommand: 'npm start',
        appUrl: 'http://localhost:3000',
        port: 3000,
        healthUrl: 'http://localhost:3000/health',
        envFilePath: '/workspace/.env',
        env: [{ key: 'NODE_ENV', value: 'production' }],
        autostart: true,
      });

      expect(project.appUrl).toBe('http://localhost:3000');
      expect(project.port).toBe(3000);
      expect(project.healthUrl).toBe('http://localhost:3000/health');
      expect(project.envFilePath).toBe('/workspace/.env');
      expect(project.env).toHaveLength(1);
      expect(project.env[0].key).toBe('NODE_ENV');
      expect(project.autostart).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Update (REG-02)
  // -----------------------------------------------------------------------
  describe('updateProject', () => {
    it('updates fields on an existing project', async () => {
      const repo = createRegistryRepository({
        registryPath: join(dir, 'update.yaml'),
      });
      const created = await repo.createProject({
        name: 'Original',
        hostPath: '/host',
        containerPath: '/ctr',
        startCommand: 'npm start',
      });

      const updated = await repo.updateProject(created.id, {
        name: 'Updated',
        hostPath: '/host',
        containerPath: '/ctr',
        startCommand: 'npm run dev',
      });

      expect(updated.id).toBe(created.id);
      expect(updated.name).toBe('Updated');
      expect(updated.startCommand).toBe('npm run dev');
    });

    it('throws ProjectNotFoundError when id does not exist', async () => {
      const repo = createRegistryRepository({
        registryPath: join(dir, 'update-notfound.yaml'),
      });
      await expect(
        repo.updateProject('no-such-id', {
          name: 'Nope',
          hostPath: '/host',
          containerPath: '/ctr',
          startCommand: 'echo',
        }),
      ).rejects.toThrow(ProjectNotFoundError);
    });
  });

  // -----------------------------------------------------------------------
  // Delete (REG-02)
  // -----------------------------------------------------------------------
  describe('deleteProject', () => {
    it('removes a project and list returns empty', async () => {
      const repo = createRegistryRepository({
        registryPath: join(dir, 'delete.yaml'),
      });
      const created = await repo.createProject({
        name: 'DeleteMe',
        hostPath: '/host',
        containerPath: '/ctr',
        startCommand: 'npm start',
      });

      await repo.deleteProject(created.id);
      const projects = await repo.listProjects();
      expect(projects).toHaveLength(0);
    });

    it('throws ProjectNotFoundError when id does not exist', async () => {
      const repo = createRegistryRepository({
        registryPath: join(dir, 'delete-notfound.yaml'),
      });
      await expect(repo.deleteProject('no-such-id')).rejects.toThrow(
        ProjectNotFoundError,
      );
    });
  });

  // -----------------------------------------------------------------------
  // Restart persistence (REG-04)
  // -----------------------------------------------------------------------
  describe('persistence across repository instances (REG-04)', () => {
    it('loads projects created by a previous repository instance', async () => {
      const yamlPath = join(dir, 'persist.yaml');

      // First session
      const repo1 = createRegistryRepository({ registryPath: yamlPath });
      const created = await repo1.createProject({
        name: 'Persistent App',
        hostPath: '/host',
        containerPath: '/ctr',
        startCommand: 'node server.js',
        port: 8080,
      });

      // Second session (simulates restart)
      const repo2 = createRegistryRepository({ registryPath: yamlPath });
      const projects = await repo2.listProjects();
      expect(projects).toHaveLength(1);
      expect(projects[0].id).toBe(created.id);
      expect(projects[0].name).toBe('Persistent App');
      expect(projects[0].port).toBe(8080);
    });
  });

  // -----------------------------------------------------------------------
  // Malformed YAML (REG-04, D-09)
  // -----------------------------------------------------------------------
  describe('malformed YAML handling (REG-04, D-09)', () => {
    it('throws RegistryLoadError and preserves the file when YAML is malformed', async () => {
      const yamlPath = join(dir, 'malformed.yaml');
      writeFileSync(yamlPath, '{ invalid yaml: [unclosed }', 'utf8');

      const repo = createRegistryRepository({ registryPath: yamlPath });
      await expect(repo.listProjects()).rejects.toThrow(RegistryLoadError);
      expect(existsSync(yamlPath)).toBe(true);
    });

    it('throws RegistryLoadError when persisted data fails schema validation', async () => {
      const yamlPath = join(dir, 'invalid-schema.yaml');
      writeFileSync(yamlPath, 'version: 2\nprojects: []', 'utf8');

      const repo = createRegistryRepository({ registryPath: yamlPath });
      await expect(repo.listProjects()).rejects.toThrow(RegistryLoadError);
    });

    it('does not overwrite a malformed file for create operations', async () => {
      const yamlPath = join(dir, 'malformed-create.yaml');
      writeFileSync(yamlPath, '{ broken', 'utf8');

      const repo = createRegistryRepository({ registryPath: yamlPath });
      await expect(
        repo.createProject({
          name: 'Should Fail',
          hostPath: '/host',
          containerPath: '/ctr',
          startCommand: 'echo',
        }),
      ).rejects.toThrow(RegistryLoadError);

      // Original content should be preserved
      const content = readFileSync(yamlPath, 'utf8');
      expect(content).toBe('{ broken');
    });
  });

  // -----------------------------------------------------------------------
  // Empty YAML file edge case
  // -----------------------------------------------------------------------
  describe('empty file', () => {
    it('throws RegistryLoadError when the YAML file exists but is empty', async () => {
      const yamlPath = join(dir, 'empty.yaml');
      writeFileSync(yamlPath, '', 'utf8');

      const repo = createRegistryRepository({ registryPath: yamlPath });
      await expect(repo.listProjects()).rejects.toThrow(RegistryLoadError);
    });

    it('throws RegistryLoadError when the file contains only whitespace', async () => {
      const yamlPath = join(dir, 'whitespace.yaml');
      writeFileSync(yamlPath, '   \n  \n  ', 'utf8');

      const repo = createRegistryRepository({ registryPath: yamlPath });
      await expect(repo.listProjects()).rejects.toThrow(RegistryLoadError);
    });
  });
});
