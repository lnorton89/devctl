/**
 * Express router for project lifecycle operations.
 *
 * Lifecycle actions load stored project configuration, validate the
 * configured npm script against the current package.json, and then delegate
 * execution to the process manager.
 *
 * @module lifecycleRouter
 */

import { Router } from 'express';
import { readdir, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import type { RegistryRepository } from '../registry/registryRepository.js';
import type { ProjectConfig } from '../../shared/projectSchema.js';
import type {
  LogData,
  PackageJsonBrowserEntry,
  PackageJsonBrowserResponse,
  ProcessStatus,
  ParseScriptsResponse,
} from '../../shared/lifecycleSchema.js';
import type { ProcessManager } from '../process/processManager.js';
import { ProjectNotFoundError } from '../registry/registryErrors.js';
import {
  PackageJsonNotFoundError,
  PackageJsonParseError,
  parsePackageJson,
} from '../process/packageJsonParser.js';

const SCRIPT_REQUIRED_MESSAGE =
  'Project must have a scriptName before lifecycle actions can run.';

/**
 * Create an Express router for lifecycle endpoints.
 *
 * @param processManager  In-memory process manager backing lifecycle actions.
 * @param repository      Project registry repository used for project lookup.
 */
export function createLifecycleRouter(
  processManager: ProcessManager,
  repository: RegistryRepository,
): Router {
  const router = Router();

  router.get('/package-json-browser', async (req, res, next) => {
    try {
      const requestedPath = getQueryPath(req.query.path);
      const currentPath = requestedPath ? resolve(requestedPath) : process.cwd();
      const currentStat = await stat(currentPath);

      if (!currentStat.isDirectory()) {
        return res.status(400).json({
          message: 'Path must be a directory.',
        });
      }

      const dirEntries = await readdir(currentPath, { withFileTypes: true });
      const entries: PackageJsonBrowserEntry[] = dirEntries
        .filter((entry) => entry.isDirectory() || entry.name === 'package.json')
        .map((entry): PackageJsonBrowserEntry => {
          return {
            name: entry.name,
            path: resolve(currentPath, entry.name),
            type: entry.isDirectory() ? 'directory' : 'packageJson',
          };
        })
        .sort(compareBrowserEntries);

      const parentPath = getParentPath(currentPath);
      const response: PackageJsonBrowserResponse = {
        path: currentPath,
        parentPath,
        entries,
      };
      res.json(response);
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === 'ENOENT') {
        return res.status(404).json({ message: 'Directory not found.' });
      }
      if (err.code === 'EACCES' || err.code === 'EPERM') {
        return res.status(403).json({ message: 'Directory cannot be read.' });
      }
      next(error);
    }
  });

  router.post('/parse-scripts', async (req, res, next) => {
    try {
      const dirPath = getBodyPath(req.body);
      if (!dirPath) {
        return res.status(400).json({ message: 'Path is required.' });
      }

      const result: ParseScriptsResponse = await parsePackageJson(dirPath);
      res.json(result);
    } catch (error) {
      if (error instanceof PackageJsonNotFoundError) {
        return res.status(404).json({
          message: 'No package.json found at this path.',
        });
      }
      if (error instanceof PackageJsonParseError) {
        return res.status(400).json({
          message:
            'Could not read package.json. Check that the file is valid JSON.',
        });
      }
      next(error);
    }
  });

  router.post('/:id/start', async (req, res, next) => {
    try {
      const project = await loadProject(repository, req.params.id);
      const validation = await validateProjectScript(project);
      if (!validation.valid) {
        return res.status(400).json({ message: validation.message });
      }

      const status: ProcessStatus = processManager.start(
        project.id,
        validation.scriptName,
        project.hostPath,
      );
      res.json(status);
    } catch (error) {
      if (error instanceof ProjectNotFoundError) {
        return res.status(404).json({ message: error.message });
      }
      if (error instanceof PackageJsonNotFoundError) {
        return res.status(404).json({
          message: 'No package.json found at this path.',
        });
      }
      if (error instanceof PackageJsonParseError) {
        return res.status(400).json({
          message:
            'Could not read package.json. Check that the file is valid JSON.',
        });
      }
      next(error);
    }
  });

  router.post('/:id/stop', async (req, res, next) => {
    try {
      await loadProject(repository, req.params.id);
      const status: ProcessStatus = processManager.stop(req.params.id);
      res.json(status);
    } catch (error) {
      if (error instanceof ProjectNotFoundError) {
        return res.status(404).json({ message: error.message });
      }
      next(error);
    }
  });

  router.post('/:id/restart', async (req, res, next) => {
    try {
      const project = await loadProject(repository, req.params.id);
      const validation = await validateProjectScript(project);
      if (!validation.valid) {
        return res.status(400).json({ message: validation.message });
      }

      const status: ProcessStatus = await processManager.restart(
        project.id,
        validation.scriptName,
        project.hostPath,
      );
      res.json(status);
    } catch (error) {
      if (error instanceof ProjectNotFoundError) {
        return res.status(404).json({ message: error.message });
      }
      if (error instanceof PackageJsonNotFoundError) {
        return res.status(404).json({
          message: 'No package.json found at this path.',
        });
      }
      if (error instanceof PackageJsonParseError) {
        return res.status(400).json({
          message:
            'Could not read package.json. Check that the file is valid JSON.',
        });
      }
      next(error);
    }
  });

  router.get('/:id/status', async (req, res, next) => {
    try {
      await loadProject(repository, req.params.id);
      const status: ProcessStatus = processManager.getStatus(req.params.id);
      res.json(status);
    } catch (error) {
      if (error instanceof ProjectNotFoundError) {
        return res.status(404).json({ message: error.message });
      }
      next(error);
    }
  });

  router.get('/:id/logs', async (req, res, next) => {
    try {
      await loadProject(repository, req.params.id);
      const logs: LogData = processManager.getLogs(req.params.id);
      res.json(logs);
    } catch (error) {
      if (error instanceof ProjectNotFoundError) {
        return res.status(404).json({ message: error.message });
      }
      next(error);
    }
  });

  return router;
}

function getQueryPath(value: unknown): string | null {
  if (Array.isArray(value)) {
    return getQueryPath(value[0]);
  }
  return typeof value === 'string' && value.trim() ? value : null;
}

function getBodyPath(body: unknown): string | null {
  if (!body || typeof body !== 'object' || !('path' in body)) {
    return null;
  }

  const value = (body as { path?: unknown }).path;
  return typeof value === 'string' && value.trim() ? value : null;
}

function getParentPath(currentPath: string): string | null {
  const parentPath = dirname(currentPath);
  return parentPath === currentPath ? null : parentPath;
}

function compareBrowserEntries(
  left: PackageJsonBrowserEntry,
  right: PackageJsonBrowserEntry,
): number {
  if (left.type !== right.type) {
    return left.type === 'directory' ? -1 : 1;
  }

  return left.name.localeCompare(right.name, undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}

async function loadProject(
  repository: RegistryRepository,
  id: string,
): Promise<ProjectConfig> {
  const projects = await repository.listProjects();
  const project = projects.find((candidate) => candidate.id === id);
  if (!project) {
    throw new ProjectNotFoundError(id);
  }

  return project;
}

type ScriptValidation =
  | { valid: true; scriptName: string }
  | { valid: false; message: string };

async function validateProjectScript(
  project: ProjectConfig,
): Promise<ScriptValidation> {
  if (!project.scriptName) {
    return {
      valid: false,
      message: SCRIPT_REQUIRED_MESSAGE,
    };
  }

  const parsed = await parsePackageJson(project.hostPath);
  if (!(project.scriptName in parsed.scripts)) {
    return {
      valid: false,
      message: `Configured script "${project.scriptName}" was not found in package.json.`,
    };
  }

  return { valid: true, scriptName: project.scriptName };
}
