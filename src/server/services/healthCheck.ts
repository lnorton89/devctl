/**
 * Health check service for devctl Phase 3.
 *
 * Provides TCP port-occupancy detection and HTTP health URL reachability
 * checks. Runs inside the server to reach localhost ports and URLs from
 * the host network context.
 *
 * @module healthCheck
 */

import { connect } from 'node:net';
import { get as httpGet } from 'node:http';
import { get as httpsGet } from 'node:https';
import type { ProjectConfig } from '../../shared/projectSchema.js';
import type {
  PortCheckResult,
  HealthCheckResult,
  HealthStatus,
} from '../../shared/lifecycleSchema.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PORT_CHECK_TIMEOUT_MS = 2000;
const HEALTH_CHECK_TIMEOUT_MS = 2000;

// ---------------------------------------------------------------------------
// Error Classes
// ---------------------------------------------------------------------------

export class PortOccupiedError extends Error {
  constructor(port: number) {
    super(`Port ${port} is already in use.`);
    this.name = 'PortOccupiedError';
  }
}

export class HealthCheckTimeoutError extends Error {
  constructor(url: string) {
    super(`Health check timed out for ${url}`);
    this.name = 'HealthCheckTimeoutError';
  }
}

// ---------------------------------------------------------------------------
// Port Occupancy Check
// ---------------------------------------------------------------------------

/**
 * Attempt a TCP connection to determine if a port is occupied.
 *
 * @param port - Port number to check.
 * @param host - Host to connect to (default: 'localhost').
 * @returns Result with `occupied` boolean and optional `error` string.
 */
export async function checkPortOccupied(
  port: number,
  host = 'localhost',
): Promise<PortCheckResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PORT_CHECK_TIMEOUT_MS);

  return new Promise<PortCheckResult>((resolve) => {
    const socket = connect({ host, port });

    const cleanup = (): void => {
      clearTimeout(timeoutId);
      socket.destroy();
    };

    socket.on('connect', () => {
      cleanup();
      resolve({ occupied: true });
    });

    socket.on('error', (error: NodeJS.ErrnoException) => {
      cleanup();
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        resolve({ occupied: false });
      } else {
        resolve({ occupied: false, error: error.message });
      }
    });

    controller.signal.addEventListener('abort', () => {
      cleanup();
      resolve({ occupied: true, error: 'Connection timed out.' });
    });
  });
}

// ---------------------------------------------------------------------------
// Health URL Check
// ---------------------------------------------------------------------------

/**
 * Perform an HTTP GET request to a health URL and check for a 2xx response.
 *
 * @param url - The health check URL to request.
 * @returns Result with `healthy` boolean, optional `statusCode`, and optional `error`.
 */
export async function checkHealthUrl(url: string): Promise<HealthCheckResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS);

  return new Promise<HealthCheckResult>((resolve) => {
    const parsedUrl = new URL(url);
    const get = parsedUrl.protocol === 'https:' ? httpsGet : httpGet;

    const request = get(
      url,
      { signal: controller.signal },
      (response) => {
        clearTimeout(timeoutId);
        const statusCode = response.statusCode ?? 0;
        const healthy = statusCode >= 200 && statusCode < 300;
        resolve({ healthy, statusCode });
      },
    );

    request.on('error', (error: Error) => {
      clearTimeout(timeoutId);
      resolve({ healthy: false, error: error.message });
    });

    controller.signal.addEventListener('abort', () => {
      request.destroy();
      clearTimeout(timeoutId);
      resolve({ healthy: false, error: 'Health check timed out.' });
    });
  });
}

// ---------------------------------------------------------------------------
// Composite Health Check
// ---------------------------------------------------------------------------

/**
 * Run port and health URL checks concurrently for a running project.
 *
 * - If `project.port` is set, a TCP check runs against it.
 * - If `project.healthUrl` is set, an HTTP GET runs against it.
 *
 * The caller (route handler or client) interprets the results:
 * - Pre-start: `port.occupied === true` means the port is taken → block start
 * - Post-start: `port.occupied === false` means our process isn't listening → unhealthy
 *
 * @param project - The project configuration to check.
 * @returns Combined health status with nullable port and health fields.
 */
export async function checkProjectHealth(
  project: ProjectConfig,
): Promise<HealthStatus> {
  const checks: Promise<unknown>[] = [];
  let portResult: PortCheckResult | null = null;
  let healthResult: HealthCheckResult | null = null;

  if (project.port != null) {
    checks.push(
      checkPortOccupied(project.port).then((r) => {
        portResult = r;
      }),
    );
  }

  if (project.healthUrl) {
    checks.push(
      checkHealthUrl(project.healthUrl).then((r) => {
        healthResult = r;
      }),
    );
  }

  await Promise.all(checks);

  return { port: portResult, health: healthResult };
}
