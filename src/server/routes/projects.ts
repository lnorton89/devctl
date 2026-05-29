/**
 * Express router for project registry CRUD operations.
 *
 * All endpoints mount under `/api/projects` and delegate persistence
 * to a `RegistryRepository` instance (injected at creation time).
 *
 * @module projectsRouter
 */

import { Router } from 'express';
import type { RegistryRepository } from '../registry/registryRepository.js';
import {
  projectInputSchema,
  formatZodIssues,
} from '../../shared/projectSchema.js';
import {
  RegistryLoadError,
  ProjectNotFoundError,
} from '../registry/registryErrors.js';

/**
 * Create an Express router for project CRUD endpoints.
 *
 * @param repository  The registry repository backing all operations.
 */
export function createProjectsRouter(
  repository: RegistryRepository,
): Router {
  const router = Router();

  // -------------------------------------------------------------------
  // GET /api/projects — list all projects (REG-01)
  // -------------------------------------------------------------------
  router.get('/', async (_req, res, next) => {
    try {
      const projects = await repository.listProjects();
      res.json({ projects });
    } catch (error) {
      next(error);
    }
  });

  // -------------------------------------------------------------------
  // POST /api/projects — create a project (REG-01, REG-03)
  // -------------------------------------------------------------------
  router.post('/', async (req, res, next) => {
    try {
      const parsed = projectInputSchema.safeParse(req.body);
      if (!parsed.success) {
        // Return field-level validation issues — no request-body logging (D-06 / T-01-04-02)
        return res.status(400).json({
          message: 'Invalid project',
          issues: formatZodIssues(parsed.error),
        });
      }

      const project = await repository.createProject(parsed.data);
      res.status(201).json(project);
    } catch (error) {
      next(error);
    }
  });

  // -------------------------------------------------------------------
  // PUT /api/projects/:id — update a project (REG-02)
  // -------------------------------------------------------------------
  router.put('/:id', async (req, res, next) => {
    try {
      const parsed = projectInputSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: 'Invalid project',
          issues: formatZodIssues(parsed.error),
        });
      }

      const project = await repository.updateProject(
        req.params.id,
        parsed.data,
      );
      res.json(project);
    } catch (error) {
      if (error instanceof ProjectNotFoundError) {
        return res.status(404).json({ message: error.message });
      }
      next(error);
    }
  });

  // -------------------------------------------------------------------
  // DELETE /api/projects/:id — delete a project (REG-02)
  // -------------------------------------------------------------------
  router.delete('/:id', async (req, res, next) => {
    try {
      await repository.deleteProject(req.params.id);
      res.status(204).end();
    } catch (error) {
      if (error instanceof ProjectNotFoundError) {
        return res.status(404).json({ message: error.message });
      }
      next(error);
    }
  });

  return router;
}
