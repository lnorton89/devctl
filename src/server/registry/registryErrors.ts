/**
 * Custom error classes for the registry persistence layer.
 *
 * Distinguishes load errors (malformed/invalid YAML) from
 * application-level errors (project not found).
 *
 * @module registryErrors
 */

/**
 * Thrown when the registry YAML file cannot be parsed or its
 * contents fail schema validation.
 *
 * The file is left intact so the user can edit or remove it to
 * recover (D-09 / T-01-04-01).
 */
export class RegistryLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RegistryLoadError';
  }
}

/**
 * Thrown when an operation references a project id that does not
 * exist in the current registry.
 */
export class ProjectNotFoundError extends Error {
  constructor(id: string) {
    super(`Project not found: ${id}`);
    this.name = 'ProjectNotFoundError';
  }
}
