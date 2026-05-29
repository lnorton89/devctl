import { describe, expect, it } from 'vitest';
import {
  logDataSchema,
  packageScriptsSchema,
  parseScriptsResponseSchema,
  processStateSchema,
  processStatusSchema,
  type LogData,
  type PackageScripts,
  type ParseScriptsResponse,
  type ProcessState,
  type ProcessStatus,
  type RunRecord,
} from '../../src/shared/lifecycleSchema.js';

describe('processStateSchema', () => {
  it('accepts the Phase 2 lifecycle states', () => {
    const states: ProcessState[] = [
      'stopped',
      'starting',
      'running',
      'stopping',
      'failed',
      'errored',
    ];

    states.forEach((state) => {
      expect(processStateSchema.parse(state)).toBe(state);
    });
  });
});

describe('processStatusSchema', () => {
  it('accepts state, uptime, currentRun, recentLogTail, and error fields', () => {
    const currentRun: RunRecord = {
      runId: 'run-1',
      scriptName: 'dev',
      startTime: '2026-05-29T12:00:00.000Z',
      stdout: ['ready'],
      stderr: [],
    };

    const status: ProcessStatus = {
      state: 'running',
      uptime: 15,
      currentRun,
      recentLogTail: ['ready'],
      error: undefined,
    };

    expect(processStatusSchema.parse(status)).toEqual(status);
  });
});

describe('logDataSchema', () => {
  it('accepts currentRun plus history entries with lifecycle and crash details', () => {
    const completedRun: RunRecord = {
      runId: 'run-1',
      scriptName: 'dev',
      startTime: '2026-05-29T12:00:00.000Z',
      endTime: '2026-05-29T12:01:00.000Z',
      exitCode: 1,
      signalCode: null,
      error: 'Process exited with code 1',
      stdout: ['starting'],
      stderr: ['failed'],
      crashed: true,
    };
    const currentRun: RunRecord = {
      runId: 'run-2',
      scriptName: 'dev',
      startTime: '2026-05-29T12:02:00.000Z',
      stdout: ['restarting'],
      stderr: [],
    };
    const logs: LogData = {
      currentRun,
      history: [completedRun],
    };

    expect(logDataSchema.parse(logs)).toEqual(logs);
  });
});

describe('packageScriptsSchema', () => {
  it('only accepts string-valued scripts', () => {
    const scripts: PackageScripts = {
      dev: 'vite',
      test: 'vitest',
    };

    expect(packageScriptsSchema.parse(scripts)).toEqual(scripts);
    expect(packageScriptsSchema.safeParse({ dev: 'vite', broken: 42 }).success).toBe(
      false,
    );
  });
});

describe('parseScriptsResponseSchema', () => {
  it('accepts parsed scripts with their package.json path', () => {
    const response: ParseScriptsResponse = {
      scripts: {
        dev: 'vite',
      },
      path: '/workspace/app/package.json',
    };

    expect(parseScriptsResponseSchema.parse(response)).toEqual(response);
  });
});
