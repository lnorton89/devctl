/**
 * devctl server startup entry point.
 *
 * Starts the Express app on the port specified by the `PORT` environment
 * variable (defaulting to 3001).
 *
 * @module index
 */

import { createApp } from './app';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const PORT = parseInt(process.env.PORT ?? '3001', 10);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

const app = createApp();

app.listen(PORT, () => {
  // Only log the port on startup — never log request bodies or env values (D-06).
  console.log(`devctl server listening on port ${PORT}`);
});
