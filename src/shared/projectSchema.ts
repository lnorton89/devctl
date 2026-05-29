/**
 * Shared Zod schemas for devctl Phase 1 project registry.
 *
 * Single source of truth for project configuration validation.
 * Backend (server) and frontend (client) plans import from here
 * so fields, types, rules, and defaults cannot drift.
 *
 * @module projectSchema
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Sub-schemas
// ---------------------------------------------------------------------------

/**
 * Single environment variable entry: a key/value pair.
 *
 * Keys must start with a letter or underscore and contain only
 * letters, numbers, and underscores (UI-SPEC.md validation copy).
 */
const envVarSchema = z.object({
  key: z
    .string()
    .regex(
      /^[a-zA-Z_][a-zA-Z0-9_]*$/,
      'Environment variable names must use letters, numbers, and underscores.',
    ),
  value: z.string(),
});

/** Inferred TypeScript type for an environment variable entry. */
export type EnvVar = z.output<typeof envVarSchema>;

// ---------------------------------------------------------------------------
// Project Input Schema  —  for API / form payload validation (REG-01, REG-03)
// ---------------------------------------------------------------------------

/**
 * User-supplied project configuration (without stable id).
 *
 * **Required** (REG-01, D-01, D-03):
 * - `name`           — human-readable project label
 * - `hostPath`       — path on the host workstation
 * - `containerPath`  — mounted path used inside Docker
 * - `startCommand`   — shell command to start the dev server
 * - `scriptName`     — npm script selected for lifecycle execution (Phase 2)
 *
 * **Optional** (REG-01, REG-03, D-04, D-05):
 * - `appUrl`         — URL to open the app in the browser
 * - `port`           — integer 1-65535
 * - `healthUrl`      — URL for health-check polling (Phase 3+)
 * - `envFilePath`    — optional path to a .env file (relative to containerPath)
 * - `env`            — key/value environment overrides (default: [])
 * - `autostart`      — start on devctl boot (default: false)
 *
 * **Validation copy** matches UI-SPEC.md error messages.
 * **Threat model T-01-02-01:** Validation gates all fields before
 *   API/persistence consumes them.
 */
export const projectInputSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required.'),
  hostPath: z
    .string()
    .min(1, 'Host path is required.'),
  containerPath: z
    .string()
    .min(1, 'Container path is required.'),
  startCommand: z
    .string()
    .min(1, 'Start command is required.'),
  scriptName: z
    .string()
    .optional(),

  // --- Optional fields ---
  appUrl: z
    .string()
    .url('Enter a valid app URL.')
    .optional(),
  port: z
    .number()
    .int()
    .gte(1, 'Port must be between 1 and 65535.')
    .lte(65535, 'Port must be between 1 and 65535.')
    .optional(),
  healthUrl: z
    .string()
    .url('Enter a valid health URL.')
    .optional(),
  envFilePath: z
    .string()
    .optional(),

  // --- Optional with defaults ---
  env: z
    .array(envVarSchema)
    .default([]),
  autostart: z
    .boolean()
    .default(false),
});

/** Input type accepted from form/API payload (before defaults are applied). */
export type ProjectInput = z.input<typeof projectInputSchema>;

// ---------------------------------------------------------------------------
// Stored Project Schema  —  with stable id for persistence (REG-02)
// ---------------------------------------------------------------------------

/**
 * Full project record as stored in the YAML registry.
 * Same fields as `projectInputSchema` plus a stable `id`.
 *
 * The `id` is generated at create-time and never user-visible in the
 * Phase 1 registry UI (resolved research question).
 */
export const projectSchema = projectInputSchema.extend({
  id: z.string(),
});

/** Output type for a persisted project configuration record. */
export type ProjectConfig = z.output<typeof projectSchema>;

// ---------------------------------------------------------------------------
// Registry Envelope Schema  —  top-level YAML shape (REG-04, D-07-D-09)
// ---------------------------------------------------------------------------

/**
 * Top-level registry file schema.
 *
 * ```yaml
 * version: 1
 * projects:
 *   - id: "proj_abc123"
 *     name: "Example"
 *     ...
 * ```
 */
export const registrySchema = z.object({
  version: z.literal(1),
  projects: z.array(projectSchema),
});

/** Output type for the full registry file. */
export type RegistryFile = z.output<typeof registrySchema>;

// ---------------------------------------------------------------------------
// Issue Formatting Helper  (Threat T-01-02-02: no env-value logging)
// ---------------------------------------------------------------------------

/** Simplified validation issue for UI/API display. */
export interface FormattedIssue {
  /** Dot-separated field path (e.g. `"env.0.key"`, `"name"`). */
  path: string;
  /** Human-readable validation message. */
  message: string;
}

/**
 * Convert a ZodError into a flat array of `{ path, message }` objects
 * that API/UI plans can map into field-level error display.
 *
 * This helper purposefully **does not** expose the raw input values
 * from Zod issues (threat T-01-02-02 — no env-value logging or
 * redaction-bypass helpers).
 *
 * @example
 * ```ts
 * const result = projectInputSchema.safeParse(body);
 * if (!result.success) {
 *   return res.status(400).json({
 *     message: 'Invalid project',
 *     issues: formatZodIssues(result.error),
 *   });
 * }
 * ```
 */
export function formatZodIssues(
  error: { issues: Array<{ path: PropertyKey[]; message: string }> },
): FormattedIssue[] {
  return error.issues.map((issue) => ({
    path: issue.path.map(String).join('.'),
    message: issue.message,
  }));
}
