import { z } from 'zod';

export const processStateSchema = z.enum([
  'stopped',
  'starting',
  'running',
  'unhealthy',
  'stopping',
  'failed',
  'errored',
]);

export type ProcessState = z.output<typeof processStateSchema>;

export const runRecordSchema = z.object({
  runId: z.string(),
  scriptName: z.string(),
  startTime: z.string(),
  endTime: z.string().optional(),
  exitCode: z.number().int().nullable().optional(),
  signalCode: z.string().nullable().optional(),
  error: z.string().optional(),
  stdout: z.array(z.string()),
  stderr: z.array(z.string()),
  crashed: z.boolean().optional(),
});

export type RunRecord = z.output<typeof runRecordSchema>;

export const processStatusSchema = z.object({
  state: processStateSchema,
  uptime: z.number().nonnegative().nullable().optional(),
  currentRun: runRecordSchema.nullable().optional(),
  recentLogTail: z.array(z.string()),
  error: z.string().optional(),
});

export type ProcessStatus = z.output<typeof processStatusSchema>;

export const logDataSchema = z.object({
  currentRun: runRecordSchema.nullable().optional(),
  history: z.array(runRecordSchema),
});

export type LogData = z.output<typeof logDataSchema>;

export const packageScriptsSchema = z.record(z.string(), z.string());

export type PackageScripts = z.output<typeof packageScriptsSchema>;

export const parseScriptsResponseSchema = z.object({
  scripts: packageScriptsSchema,
  path: z.string(),
});

export type ParseScriptsResponse = z.output<typeof parseScriptsResponseSchema>;

export const packageJsonBrowserEntrySchema = z.object({
  name: z.string(),
  path: z.string(),
  type: z.enum(['directory', 'packageJson']),
});

export type PackageJsonBrowserEntry = z.output<typeof packageJsonBrowserEntrySchema>;

export const packageJsonBrowserResponseSchema = z.object({
  path: z.string(),
  parentPath: z.string().nullable(),
  entries: z.array(packageJsonBrowserEntrySchema),
});

export type PackageJsonBrowserResponse = z.output<typeof packageJsonBrowserResponseSchema>;

// ---------------------------------------------------------------------------
// Port / Health Check Types (Phase 3 — OBS-02, OBS-04)
// ---------------------------------------------------------------------------

export const portCheckResultSchema = z.object({
  occupied: z.boolean(),
  error: z.string().optional(),
});

export type PortCheckResult = z.output<typeof portCheckResultSchema>;

export const healthCheckResultSchema = z.object({
  healthy: z.boolean(),
  statusCode: z.number().int().optional(),
  error: z.string().optional(),
});

export type HealthCheckResult = z.output<typeof healthCheckResultSchema>;

export const healthStatusSchema = z.object({
  port: portCheckResultSchema.nullable(),
  health: healthCheckResultSchema.nullable(),
});

export type HealthStatus = z.output<typeof healthStatusSchema>;

// ---------------------------------------------------------------------------
// Package.json Content (Phase 5 — quick task)
// ---------------------------------------------------------------------------

export const getPackageJsonResponseSchema = z.object({
  content: z.string(),
  path: z.string(),
});

export type GetPackageJsonResponse = z.output<typeof getPackageJsonResponseSchema>;
