/**
 * Typed client API wrapper for devctl project registry endpoints.
 *
 * All calls go through `/api/projects` and handle error responses
 * (validation 400, not-found 404, load-error 503, network failure)
 * into typed `ApiError` instances.
 *
 * @module projectsApi
 */

import type { ProjectConfig, ProjectInput, FormattedIssue } from '../../shared/projectSchema.js';
import type {
  ProcessStatus,
  LogData,
  PackageJsonBrowserResponse,
  ParseScriptsResponse,
} from '../../shared/lifecycleSchema.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const API_BASE = '/api/projects';

// ---------------------------------------------------------------------------
// Error Types
// ---------------------------------------------------------------------------

/**
 * Typed error from API responses.
 *
 * Carries the HTTP `status` and optional `issues` (field-level Zod
 * validation issues from 400 responses) so the UI can display
 * per-field error messages.
 */
export class ApiError extends Error {
  status: number;
  issues?: FormattedIssue[];

  constructor(status: number, message: string, issues?: FormattedIssue[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.issues = issues;
  }

  /** True when the error carries field-level validation issues. */
  get hasFieldIssues(): boolean {
    return this.status === 400 && Array.isArray(this.issues) && this.issues.length > 0;
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let body: Record<string, unknown> = {};
    try {
      body = await response.json();
    } catch {
      // Non-JSON body — use status text
    }
    throw new ApiError(
      response.status,
      (body.message as string) ?? response.statusText,
      body.issues as FormattedIssue[] | undefined,
    );
  }
  // 204 No Content (DELETE)
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch all registered projects.
 *
 * @returns The current list of project configurations.
 * @throws {ApiError} On non-OK responses.
 */
export async function listProjects(): Promise<ProjectConfig[]> {
  const response = await fetch(API_BASE);
  const data = await handleResponse<{ projects: ProjectConfig[] }>(response);
  return data.projects;
}

/**
 * Create a new project.
 *
 * @param input  The project configuration fields.
 * @returns The persisted project with a stable `id`.
 * @throws {ApiError} On validation (400) or server errors.
 */
export async function createProject(input: ProjectInput): Promise<ProjectConfig> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return handleResponse<ProjectConfig>(response);
}

/**
 * Update an existing project.
 *
 * @param id     The stable project ID.
 * @param input  The updated project configuration.
 * @returns The updated project record.
 * @throws {ApiError} On validation (400), not-found (404), or server errors.
 */
export async function updateProject(id: string, input: ProjectInput): Promise<ProjectConfig> {
  const response = await fetch(`${API_BASE}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return handleResponse<ProjectConfig>(response);
}

/**
 * Delete a project.
 *
 * @param id  The stable project ID of the project to remove.
 * @throws {ApiError} On not-found (404) or server errors.
 */
export async function deleteProject(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  return handleResponse<void>(response);
}

// ---------------------------------------------------------------------------
// Lifecycle API — Phase 2
// ---------------------------------------------------------------------------

/**
 * Start a project's dev server.
 *
 * @param id  The stable project ID.
 * @returns The current process status after starting.
 * @throws {ApiError} On validation (400), not-found (404), or server errors.
 */
export async function startProject(id: string): Promise<ProcessStatus> {
  const response = await fetch(`${API_BASE}/${encodeURIComponent(id)}/start`, {
    method: 'POST',
  });
  return handleResponse<ProcessStatus>(response);
}

/**
 * Stop a running project's dev server.
 *
 * @param id  The stable project ID.
 * @returns The current process status after stopping.
 * @throws {ApiError} On not-found (404) or server errors.
 */
export async function stopProject(id: string): Promise<ProcessStatus> {
  const response = await fetch(`${API_BASE}/${encodeURIComponent(id)}/stop`, {
    method: 'POST',
  });
  return handleResponse<ProcessStatus>(response);
}

/**
 * Restart a running or failed project's dev server.
 *
 * @param id  The stable project ID.
 * @returns The current process status after restarting.
 * @throws {ApiError} On validation (400), not-found (404), or server errors.
 */
export async function restartProject(id: string): Promise<ProcessStatus> {
  const response = await fetch(`${API_BASE}/${encodeURIComponent(id)}/restart`, {
    method: 'POST',
  });
  return handleResponse<ProcessStatus>(response);
}

/**
 * Get the current process status for a project.
 *
 * @param id  The stable project ID.
 * @returns The current process status (state, uptime, recent log tail).
 * @throws {ApiError} On not-found (404) or server errors.
 */
export async function getProjectStatus(id: string): Promise<ProcessStatus> {
  const response = await fetch(`${API_BASE}/${encodeURIComponent(id)}/status`);
  return handleResponse<ProcessStatus>(response);
}

/**
 * Get log data (current run + run history) for a project.
 *
 * @param id  The stable project ID.
 * @returns Log data with current run output and run history.
 * @throws {ApiError} On not-found (404) or server errors.
 */
export async function getProjectLogs(id: string): Promise<LogData> {
  const response = await fetch(`${API_BASE}/${encodeURIComponent(id)}/logs`);
  return handleResponse<LogData>(response);
}

/**
 * Parse package.json scripts at a given directory path.
 *
 * @param dirPath  Absolute path to a directory containing package.json.
 * @returns The discovered scripts and the resolved path.
 * @throws {ApiError} On not-found (404), invalid JSON (400), or server errors.
 */
export async function parseScripts(dirPath: string): Promise<ParseScriptsResponse> {
  const response = await fetch(`${API_BASE}/parse-scripts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: dirPath }),
  });
  return handleResponse<ParseScriptsResponse>(response);
}

/**
 * Browse local directories for package.json files through the devctl server.
 *
 * @param dirPath  Optional directory to list; defaults to the server cwd.
 * @returns Directory entries containing child folders and package.json files.
 * @throws {ApiError} On missing/unreadable paths or network failure.
 */
export async function browsePackageJson(
  dirPath?: string,
): Promise<PackageJsonBrowserResponse> {
  const query = dirPath ? `?path=${encodeURIComponent(dirPath)}` : '';
  const response = await fetch(`${API_BASE}/package-json-browser${query}`);
  return handleResponse<PackageJsonBrowserResponse>(response);
}
