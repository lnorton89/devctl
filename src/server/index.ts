/**
 * devctl server startup entry point.
 *
 * Starts the Express app on the port specified by the `PORT` environment
 * variable, the `--port` CLI argument, or defaults to 4002.
 *
 * @module index
 */

import { createApp } from './app';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const cliPortIndex = process.argv.indexOf('--port');
const cliPort = cliPortIndex !== -1 ? parseInt(process.argv[cliPortIndex + 1], 10) : NaN;
const PORT = cliPort || parseInt(process.env.PORT ?? '4002', 10);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

const app = createApp();

app.listen(PORT, () => {
  // Only log the port on startup — never log request bodies or env values (D-06).
  console.log(`devctl server listening on port ${PORT}`);
});
