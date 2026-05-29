/**
 * Express application factory for devctl.
 *
 * Creates a configured Express instance with:
 * - JSON body parsing with a small mutation-size limit (T-01-03-03)
 * - `/api/health` endpoint returning `{ ok: true }`
 * - No request-body logging per D-06 (T-01-03-01)
 *
 * Route mounting for registry CRUD endpoints happens in later plans.
 *
 * @module app
 */

import express from 'express';

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
 * @returns Configured Express app ready for route mounting and server startup.
 */
export function createApp(): express.Application {
  const app = express();

  // --- JSON body parser with size limit (T-01-03-03 DoS mitigation) ---
  app.use(express.json({ limit: JSON_BODY_LIMIT }));

  // --- Health check (no body logging per D-06 / T-01-03-01) ---
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  return app;
}

export default createApp;
