/**
 * devctl server startup entry point.
 *
 * Starts the Express app on the port specified by the `PORT` environment
 * variable, the `--port` CLI argument, or defaults to 4002.
 *
 * @module index
 */

import { createApp } from './app.js';
import { createRegistryRepository } from './registry/registryRepository.js';
import { createProcessManager } from './process/processManager.js';
import { autostartProjects } from './autostart/autostart.js';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const cliPortIndex = process.argv.indexOf('--port');
const cliPort = cliPortIndex !== -1 ? parseInt(process.argv[cliPortIndex + 1], 10) : NaN;
const PORT = cliPort || parseInt(process.env.PORT ?? '4002', 10);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

// Shared instances — passed to both the app and the autostart engine so that
// autostart-started processes are visible to the API routes (same processManager).
const repository = createRegistryRepository();
const processManager = createProcessManager();
const app = createApp({ registryRepository: repository, processManager });

app.listen(PORT, () => {
  // Only log the port on startup — never log request bodies or env values (D-06).
  console.log(`devctl server listening on port ${PORT}`);

  // Fire-and-forget autostart of projects marked with autostart: true.
  // Individual failures are isolated — one failing project won't block others.
  autostartProjects(repository, processManager).catch(
    (err: Error) => console.error('[autostart]', err.message),
  );
});
