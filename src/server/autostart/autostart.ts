/**
 * Server-side autostart boot engine for devctl.
 *
 * Reads all registered projects from the repository, filters those marked
 * with `autostart: true`, and starts them in parallel via the process
 * manager. Individual failures are isolated so one failing project does
 * not block others.
 *
 * @module autostart
 */

import type { RegistryRepository } from '../registry/registryRepository.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Details for a single autostart failure. */
export interface AutostartError {
  /** The project id that failed to start. */
  projectId: string;
  /** The human-readable project name. */
  projectName: string;
  /** Description of the failure. */
  error: string;
}

/** Aggregate result of an autostart run. */
export interface AutostartResult {
  /** Number of projects successfully started. */
  started: number;
  /** Number of projects that failed to start. */
  failed: number;
  /** Detailed errors for each failed project. */
  errors: AutostartError[];
}

interface AutostartProcessManager {
  start(projectId: string, scriptName: string, cwd: string): unknown;
}

// ---------------------------------------------------------------------------
// Autostart
// ---------------------------------------------------------------------------

/**
 * Start all autostart-enabled projects in parallel.
 *
 * Projects are started via `processManager.start()` using their stored
 * `scriptName` and `hostPath`. The function validates both fields exist
 * before delegating to the process manager. Each project's start attempt
 * is wrapped in an individual try/catch so failures are isolated.
 *
 * @param repository      Registry repository for reading project configs.
 * @param processManager  Process manager for starting projects.
 * @returns Result with started/failed counts and failure details.
 */
export async function autostartProjects(
  repository: Pick<RegistryRepository, 'listProjects'>,
  processManager: AutostartProcessManager,
): Promise<AutostartResult> {
  const projects = await repository.listProjects();
  const autostartCandidates = projects.filter((p) => p.autostart === true);

  if (autostartCandidates.length === 0) {
    return { started: 0, failed: 0, errors: [] };
  }

  // Map each autostart project to a start promise.  Validation and the
  // start call are synchronous, but wrapping in an async function ensures
  // each attempt produces a settled promise via Promise.allSettled below.
  const startPromises = autostartCandidates.map(async (project) => {
    if (!project.scriptName || !project.hostPath) {
      throw new Error(
        `Project "${project.name}" (${project.id}): missing scriptName or hostPath`,
      );
    }

    try {
      processManager.start(project.id, project.scriptName, project.hostPath);
    } catch (e) {
      throw new Error(
        `Project "${project.name}" (${project.id}): ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  });

  const results = await Promise.allSettled(startPromises);

  let started = 0;
  const errors: AutostartError[] = [];

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === 'fulfilled') {
      started++;
    } else {
      errors.push({
        projectId: autostartCandidates[i].id,
        projectName: autostartCandidates[i].name,
        error:
          result.reason instanceof Error
            ? result.reason.message
            : String(result.reason),
      });
    }
  }

  return { started, failed: errors.length, errors };
}
