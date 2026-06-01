/**
 * Unit tests for the autostart boot engine.
 *
 * Tests parallel startup, isolation of individual failures, validation of
 * scriptName/hostPath, and graceful handling of empty/mixed registries.
 *
 * @module autostart.test
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { Mock } from 'vitest';
import { autostartProjects } from '../../src/server/autostart/autostart.js';
import type { ProjectConfig } from '../../src/shared/projectSchema.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Create a sample project with sensible defaults for autostart tests.
 *
 * @param overrides  Partial fields to override the default project shape.
 * @returns A complete ProjectConfig suitable for repository.listProjects.
 */
function sampleProject(overrides?: Partial<ProjectConfig>): ProjectConfig {
  return {
    id: 'proj_001',
    name: 'Test App',
    hostPath: '/workspace/app',
    containerPath: '/workspace/app',
    startCommand: 'npm run dev',
    scriptName: 'dev',
    autostart: false,
    env: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('autostartProjects', () => {
  let mockListProjects: Mock<() => Promise<ProjectConfig[]>>;
  let mockStart: Mock<(projectId: string, scriptName: string, cwd: string) => void>;
  let mockRepository: { listProjects: typeof mockListProjects };
  let mockProcessManager: { start: typeof mockStart };

  beforeEach(() => {
    mockListProjects = vi.fn<() => Promise<ProjectConfig[]>>();
    mockStart = vi.fn<(projectId: string, scriptName: string, cwd: string) => void>();
    mockRepository = { listProjects: mockListProjects };
    mockProcessManager = { start: mockStart };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -----------------------------------------------------------------------
  // starts autostart-enabled projects
  // -----------------------------------------------------------------------

  it('starts autostart-enabled projects', async () => {
    const proj1 = sampleProject({
      id: 'proj_001',
      name: 'App 1',
      autostart: true,
    });
    const proj2 = sampleProject({
      id: 'proj_002',
      name: 'App 2',
      autostart: true,
    });
    mockListProjects.mockResolvedValue([proj1, proj2]);

    const result = await autostartProjects(mockRepository, mockProcessManager);

    expect(mockStart).toHaveBeenCalledTimes(2);
    expect(mockStart).toHaveBeenCalledWith('proj_001', 'dev', '/workspace/app');
    expect(mockStart).toHaveBeenCalledWith('proj_002', 'dev', '/workspace/app');
    expect(result).toEqual({ started: 2, failed: 0, errors: [] });
  });

  // -----------------------------------------------------------------------
  // skips non-autostart projects
  // -----------------------------------------------------------------------

  it('skips non-autostart projects', async () => {
    const proj1 = sampleProject({
      id: 'proj_001',
      name: 'App 1',
      autostart: false,
    });
    const proj2 = sampleProject({
      id: 'proj_002',
      name: 'App 2',
      autostart: true,
    });
    const proj3 = sampleProject({
      id: 'proj_003',
      name: 'App 3',
      autostart: false,
    });
    mockListProjects.mockResolvedValue([proj1, proj2, proj3]);

    const result = await autostartProjects(mockRepository, mockProcessManager);

    expect(mockStart).toHaveBeenCalledTimes(1);
    expect(mockStart).toHaveBeenCalledWith('proj_002', 'dev', '/workspace/app');
    expect(result).toEqual({ started: 1, failed: 0, errors: [] });
  });

  // -----------------------------------------------------------------------
  // returns zero started when no autostart projects exist
  // -----------------------------------------------------------------------

  it('returns started: 0 when no autostart projects exist', async () => {
    mockListProjects.mockResolvedValue([
      sampleProject({ autostart: false }),
      sampleProject({ autostart: false }),
    ]);

    const result = await autostartProjects(mockRepository, mockProcessManager);

    expect(mockStart).not.toHaveBeenCalled();
    expect(result).toEqual({ started: 0, failed: 0, errors: [] });
  });

  // -----------------------------------------------------------------------
  // continues when one project fails to start
  // -----------------------------------------------------------------------

  it('continues when one project fails to start', async () => {
    const proj1 = sampleProject({
      id: 'proj_001',
      name: 'App 1',
      autostart: true,
    });
    const proj2 = sampleProject({
      id: 'proj_002',
      name: 'App 2',
      autostart: true,
    });
    mockListProjects.mockResolvedValue([proj1, proj2]);
    mockStart.mockImplementation((id: string) => {
      if (id === 'proj_001') {
        throw new Error('Port already in use');
      }
    });

    const result = await autostartProjects(mockRepository, mockProcessManager);

    expect(mockStart).toHaveBeenCalledTimes(2);
    expect(result.started).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].projectId).toBe('proj_001');
    expect(result.errors[0].projectName).toBe('App 1');
    expect(result.errors[0].error).toContain('Port already in use');
  });

  // -----------------------------------------------------------------------
  // handles empty repository gracefully
  // -----------------------------------------------------------------------

  it('handles empty repository gracefully', async () => {
    mockListProjects.mockResolvedValue([]);

    const result = await autostartProjects(mockRepository, mockProcessManager);

    expect(mockStart).not.toHaveBeenCalled();
    expect(result).toEqual({ started: 0, failed: 0, errors: [] });
  });

  // -----------------------------------------------------------------------
  // skips projects without scriptName
  // -----------------------------------------------------------------------

  it('skips projects without scriptName', async () => {
    mockListProjects.mockResolvedValue([
      sampleProject({
        id: 'proj_001',
        name: 'No Script',
        scriptName: undefined,
        autostart: true,
      }),
    ]);

    const result = await autostartProjects(mockRepository, mockProcessManager);

    expect(mockStart).not.toHaveBeenCalled();
    expect(result.started).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].projectId).toBe('proj_001');
    expect(result.errors[0].projectName).toBe('No Script');
    expect(result.errors[0].error).toContain('missing scriptName');
  });

  // -----------------------------------------------------------------------
  // skips projects without hostPath
  // -----------------------------------------------------------------------

  it('skips projects without hostPath', async () => {
    mockListProjects.mockResolvedValue([
      sampleProject({
        id: 'proj_001',
        name: 'No Path',
        hostPath: '',
        autostart: true,
      }),
    ]);

    const result = await autostartProjects(mockRepository, mockProcessManager);

    expect(mockStart).not.toHaveBeenCalled();
    expect(result.started).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].projectId).toBe('proj_001');
    expect(result.errors[0].projectName).toBe('No Path');
    expect(result.errors[0].error).toContain('missing scriptName or hostPath');
  });
});
