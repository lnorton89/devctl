/**
 * YAML-backed registry repository for devctl project persistence.
 *
 * Encapsulates all YAML read/write logic behind a simple repository API.
 * Routes call repository methods and never manipulate YAML directly.
 *
 * @module registryRepository
 */

import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { parse, stringify } from 'yaml';
import {
  projectInputSchema,
  registrySchema,
} from '../../shared/projectSchema.js';
import type { ProjectInput, ProjectConfig, RegistryFile } from '../../shared/projectSchema.js';
import {
  RegistryLoadError,
  ProjectNotFoundError,
} from './registryErrors.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RegistryRepositoryOptions {
  /** Path to the YAML registry file. Defaults to `DEVCTL_CONFIG_PATH` env or `data/projects.yaml`. */
  registryPath?: string;
}

export interface RegistryRepository {
  /** Return all registered projects. */
  listProjects(): Promise<ProjectConfig[]>;
  /** Create a new project with a stable generated id. Returns the saved record. */
  createProject(input: ProjectInput): Promise<ProjectConfig>;
  /** Update an existing project by id. Returns the saved record. */
  updateProject(id: string, input: ProjectInput): Promise<ProjectConfig>;
  /** Delete a project by id. */
  deleteProject(id: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a repository instance backed by a YAML file.
 *
 * @param options  Path overrides. Uses `DEVCTL_CONFIG_PATH` env or `data/projects.yaml` by default.
 */
export function createRegistryRepository(
  options: RegistryRepositoryOptions = {},
): RegistryRepository {
  const registryPath = resolve(
    options.registryPath ??
      process.env.DEVCTL_CONFIG_PATH ??
      'data/projects.yaml',
  );

  // -----------------------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------------------

  /** Ensure the target directory exists. */
  async function ensureDir(dir: string): Promise<void> {
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
  }

  /**
   * Load and validate the registry file.
   *
   * - Missing file returns an empty registry (first-run / fresh-start).
   * - Malformed YAML or schema-invalid data throws `RegistryLoadError`
   *   and does NOT overwrite the file (D-09 / T-01-04-01).
   */
  async function loadRegistry(): Promise<RegistryFile> {
    try {
      const raw = await readFile(registryPath, 'utf8');
      const trimmed = raw.trim();

      if (!trimmed) {
        throw new RegistryLoadError(
          `Registry file "${registryPath}" is empty. Edit or remove the file to recover.`,
        );
      }

      let parsed: unknown;
      try {
        parsed = parse(trimmed);
      } catch {
        throw new RegistryLoadError(
          `Registry file "${registryPath}" contains malformed YAML. Edit or remove the file to recover.`,
        );
      }

      const result = registrySchema.safeParse(parsed);
      if (!result.success) {
        throw new RegistryLoadError(
          `Registry file "${registryPath}" contains invalid data and could not be loaded. Edit or remove the file to recover.`,
        );
      }

      return result.data;
    } catch (error) {
      // Re-throw known errors as-is
      if (error instanceof RegistryLoadError) {
        throw error;
      }

      // File not found — return empty registry (first run)
      const nodeError = error as NodeJS.ErrnoException;
      if (nodeError.code === 'ENOENT') {
        return { version: 1, projects: [] };
      }

      // Unexpected I/O error
      throw new RegistryLoadError(
        `Failed to read registry file "${registryPath}".`,
      );
    }
  }

  /**
   * Write the registry to the YAML file using an atomic temp-file-then-rename
   * strategy to avoid partial writes (A5).
   */
  async function saveRegistry(registry: RegistryFile): Promise<void> {
    const yaml = stringify(registry);

    // Ensure directory exists before writing
    const dir = dirname(registryPath);
    await ensureDir(dir);

    // Write to a temp file in the same directory, then rename into place.
    // The UUID suffix avoids collisions if multiple instances write concurrently.
    const tmpPath = `${registryPath}.tmp.${randomUUID()}`;
    await writeFile(tmpPath, yaml, 'utf8');
    await rename(tmpPath, registryPath);
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  return {
    async listProjects(): Promise<ProjectConfig[]> {
      const registry = await loadRegistry();
      return registry.projects;
    },

    async createProject(input: ProjectInput): Promise<ProjectConfig> {
      // Validate input before touching the registry file
      const parsed = projectInputSchema.safeParse(input);
      if (!parsed.success) {
        throw parsed.error;
      }

      const project: ProjectConfig = {
        ...parsed.data,
        id: randomUUID(),
      };

      const registry = await loadRegistry();
      registry.projects.push(project);
      await saveRegistry(registry);
      return project;
    },

    async updateProject(id: string, input: ProjectInput): Promise<ProjectConfig> {
      const parsed = projectInputSchema.safeParse(input);
      if (!parsed.success) {
        throw parsed.error;
      }

      const registry = await loadRegistry();
      const index = registry.projects.findIndex((p) => p.id === id);
      if (index === -1) {
        throw new ProjectNotFoundError(id);
      }

      const updated: ProjectConfig = {
        ...parsed.data,
        id,
      };

      registry.projects[index] = updated;
      await saveRegistry(registry);
      return updated;
    },

    async deleteProject(id: string): Promise<void> {
      const registry = await loadRegistry();
      const index = registry.projects.findIndex((p) => p.id === id);
      if (index === -1) {
        throw new ProjectNotFoundError(id);
      }

      registry.projects.splice(index, 1);
      await saveRegistry(registry);
    },
  };
}
