/**
 * Component tests for LogViewerDialog.
 *
 * Covers Phase 2 log viewer loading, empty, history, output, and error states.
 *
 * @module LogViewerDialog.test
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import LogViewerDialog from '../../src/client/components/LogViewerDialog';
import type { ProjectConfig } from '../../src/shared/projectSchema.js';
import type { LogData, RunRecord } from '../../src/shared/lifecycleSchema.js';

const mockGetProjectLogs = vi.hoisted(() => vi.fn());

vi.mock('../../src/client/api/projectsApi', () => ({
  getProjectLogs: mockGetProjectLogs,
}));

const sampleProject = (overrides: Partial<ProjectConfig> = {}): ProjectConfig => ({
  id: 'proj_001',
  name: 'Test App',
  hostPath: '/workspace/test-app',
  containerPath: '/workspace/test-app',
  startCommand: 'npm run dev',
  scriptName: 'dev',
  env: [],
  autostart: false,
  ...overrides,
});

const sampleRun = (overrides: Partial<RunRecord> = {}): RunRecord => ({
  runId: 'run_001',
  scriptName: 'dev',
  startTime: '2026-05-30T10:00:00.000Z',
  endTime: '2026-05-30T10:02:05.000Z',
  exitCode: 0,
  signalCode: null,
  stdout: ['ready on http://localhost:3000'],
  stderr: [],
  ...overrides,
});

describe('LogViewerDialog', () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('loads logs when opened', async () => {
    mockGetProjectLogs.mockResolvedValue({ currentRun: null, history: [] } satisfies LogData);

    render(
      <LogViewerDialog
        open
        project={sampleProject({ id: 'proj_logs' })}
        onClose={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(mockGetProjectLogs).toHaveBeenCalledWith('proj_logs');
    });
  });

  it('shows a loading state while logs load', () => {
    mockGetProjectLogs.mockReturnValue(new Promise(() => {}));

    render(
      <LogViewerDialog
        open
        project={sampleProject()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows an empty message when no current run or history exists', async () => {
    mockGetProjectLogs.mockResolvedValue({ currentRun: null, history: [] } satisfies LogData);

    render(
      <LogViewerDialog
        open
        project={sampleProject()}
        onClose={vi.fn()}
      />,
    );

    expect(
      await screen.findByText('No logs recorded for this project yet.'),
    ).toBeInTheDocument();
  });

  it('renders run history with script, timing, duration, and exit details', async () => {
    mockGetProjectLogs.mockResolvedValue({
      currentRun: null,
      history: [sampleRun()],
    } satisfies LogData);

    render(
      <LogViewerDialog
        open
        project={sampleProject()}
        onClose={vi.fn()}
      />,
    );

    expect(await screen.findByText('Run history')).toBeInTheDocument();
    expect(screen.getByText('dev')).toBeInTheDocument();
    expect(screen.getByText('Started 2026-05-30T10:00:00.000Z')).toBeInTheDocument();
    expect(screen.getByText('Ended 2026-05-30T10:02:05.000Z')).toBeInTheDocument();
    expect(screen.getByText('2m 5s')).toBeInTheDocument();
    expect(screen.getByText('Exit code: 0')).toBeInTheDocument();
  });

  it('renders stdout and stderr output with stderr marked', async () => {
    mockGetProjectLogs.mockResolvedValue({
      currentRun: sampleRun({
        stdout: ['server ready'],
        stderr: ['warning: port fallback'],
      }),
      history: [],
    } satisfies LogData);

    render(
      <LogViewerDialog
        open
        project={sampleProject()}
        onClose={vi.fn()}
      />,
    );

    expect(await screen.findByRole('log')).toBeInTheDocument();
    expect(screen.getByText('server ready')).toBeInTheDocument();
    expect(screen.getByText('[ERR] warning: port fallback')).toBeInTheDocument();
  });

  it('refreshes logs while the dialog stays open', async () => {
    mockGetProjectLogs
      .mockResolvedValueOnce({
        currentRun: sampleRun({ stdout: [] }),
        history: [],
      } satisfies LogData)
      .mockResolvedValueOnce({
        currentRun: sampleRun({ stdout: ['server ready'] }),
        history: [],
      } satisfies LogData);

    render(
      <LogViewerDialog
        open
        project={sampleProject()}
        onClose={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(mockGetProjectLogs).toHaveBeenCalledTimes(1);
    });

    expect(await screen.findByText('server ready')).toBeInTheDocument();
    expect(mockGetProjectLogs).toHaveBeenCalledTimes(2);
  }, 3000);

  it('renders crash and error details in history', async () => {
    mockGetProjectLogs.mockResolvedValue({
      currentRun: null,
      history: [
        sampleRun({
          exitCode: 1,
          crashed: true,
          error: 'Process exited unexpectedly',
        }),
      ],
    } satisfies LogData);

    render(
      <LogViewerDialog
        open
        project={sampleProject()}
        onClose={vi.fn()}
      />,
    );

    expect(
      await screen.findByText('Error: Process exited unexpectedly'),
    ).toBeInTheDocument();
  });

  it('shows a controlled error message when log loading fails', async () => {
    mockGetProjectLogs.mockRejectedValue(new Error('Could not load logs.'));

    render(
      <LogViewerDialog
        open
        project={sampleProject()}
        onClose={vi.fn()}
      />,
    );

    expect(await screen.findByText('Could not load logs.')).toBeInTheDocument();
  });

  it('calls onClose from the close button', async () => {
    mockGetProjectLogs.mockResolvedValue({ currentRun: null, history: [] } satisfies LogData);
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(
      <LogViewerDialog
        open
        project={sampleProject()}
        onClose={onClose}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Close log viewer' }));

    expect(onClose).toHaveBeenCalledOnce();
  });
});
