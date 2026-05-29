/**
 * Express application factory for devctl.
 *
 * Creates a configured Express instance with:
 * - JSON body parsing with a small mutation-size limit (T-01-03-03)
 * - `/api/health` endpoint returning `{ ok: true }`
 * - Project lifecycle routes at `/api/projects/:id/{start,stop,restart,status,logs}`
 * - Project registry CRUD routes at `/api/projects`
 * - Error handler returning safe responses (no request-body / env-value logging)
 *
 * @module app
 */

import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { createRegistryRepository } from './registry/registryRepository.js';
import type { RegistryRepository } from './registry/registryRepository.js';
import {
  createProcessManager,
  type ProcessManager,
} from './process/processManager.js';
import { createLifecycleRouter } from './routes/lifecycle.js';
import { createProjectsRouter } from './routes/projects.js';
import { RegistryLoadError } from './registry/registryErrors.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateAppOptions {
  /** Optional pre-configured repository (allows dependency injection in tests). */
  registryRepository?: RegistryRepository;
  /** Optional process manager (allows lifecycle route injection in tests). */
  processManager?: ProcessManager;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum JSON request body size (256 KB) — suitable for registry mutations. */
const JSON_BODY_LIMIT = '256kb';

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a configured Express application instance.
 *
 * @param options  Optional overrides (e.g., test repository).
 * @returns Configured Express app ready for server startup.
 */
export function createApp(options?: CreateAppOptions): express.Application {
  const app = express();

  // --- JSON body parser with size limit (T-01-03-03 DoS mitigation) ---
  app.use(express.json({ limit: JSON_BODY_LIMIT }));

  // --- Health check (no body logging per D-06 / T-01-03-01) ---
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  // --- Project lifecycle routes must mount before CRUD /:id routes ---
  const repository =
    options?.registryRepository ?? createRegistryRepository();
  const processManager =
    options?.processManager ?? createProcessManager();
  const lifecycleRouter = createLifecycleRouter(processManager, repository);
  app.use('/api/projects', lifecycleRouter);

  // --- Project registry CRUD routes ---
  const projectsRouter = createProjectsRouter(repository);
  app.use('/api/projects', projectsRouter);

  // --- Error handler (safe messages only — no env-value leakage per T-01-04-02) ---
  app.use(
    (
      err: Error,
      _req: Request,
      res: Response,
      _next: NextFunction,
    ) => {
      if (err instanceof RegistryLoadError) {
        return res.status(503).json({
          message: 'Registry is unavailable.',
          detail: err.message,
        });
      }

      // Generic fallback — log the error type without exposing request data
      console.error(
        `Unhandled error [${err.name}]: ${err.message}`,
      );
      res.status(500).json({ message: 'Internal server error' });
    },
  );

  return app;
}

export default createApp;
