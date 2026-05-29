import { z } from 'zod';

export const processStateSchema = z.enum([
  'stopped',
  'starting',
  'running',
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
