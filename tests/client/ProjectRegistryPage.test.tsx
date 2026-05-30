/**
 * Component tests for ProjectRegistryPage.
 *
 * Covers: loading state, empty state, load error rendering,
 * primary CTA presence, lifecycle controls, polling, and errors.
 *
 * @module ProjectRegistryPage.test
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import ProjectRegistryPage from '../../src/client/components/ProjectRegistryPage';
import type { ProjectConfig } from '../../src/shared/projectSchema.js';
import type { ProcessStatus } from '../../src/shared/lifecycleSchema.js';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockListProjects = vi.hoisted(() => vi.fn());
const mockCreateProject = vi.hoisted(() => vi.fn());
const mockUpdateProject = vi.hoisted(() => vi.fn());
const mockDeleteProject = vi.hoisted(() => vi.fn());
const mockStartProject = vi.hoisted(() => vi.fn());
const mockStopProject = vi.hoisted(() => vi.fn());
const mockRestartProject = vi.hoisted(() => vi.fn());
const mockGetProjectStatus = vi.hoisted(() => vi.fn());
const mockGetProjectLogs = vi.hoisted(() => vi.fn());
const mockCheckProjectHealth = vi.hoisted(() => vi.fn());
const mockParseScripts = vi.hoisted(() => vi.fn());
const mockBrowsePackageJson = vi.hoisted(() => vi.fn());

vi.mock('../../src/client/api/projectsApi', () => ({
  listProjects: mockListProjects,
  createProject: mockCreateProject,
  updateProject: mockUpdateProject,
  deleteProject: mockDeleteProject,
  startProject: mockStartProject,
  stopProject: mockStopProject,
  restartProject: mockRestartProject,
  getProjectStatus: mockGetProjectStatus,
  getProjectLogs: mockGetProjectLogs,
  checkProjectHealth: mockCheckProjectHealth,
  parseScripts: mockParseScripts,
  browsePackageJson: mockBrowsePackageJson,
  ApiError: class ApiError extends Error {
    status: number;
    issues: Array<{ path: string; message: string }> | undefined;
    constructor(
      status: number,
      message: string,
      issues?: Array<{ path: string; message: string }>,
    ) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.issues = issues;
    }
    get hasFieldIssues(): boolean {
      return (
        this.status === 400 &&
        Array.isArray(this.issues) &&
        this.issues.length > 0
      );
    }
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sampleProject = (overrides: Partial<ProjectConfig> = {}): ProjectConfig => ({
  id: 'proj_001',
  name: 'Test App',
  hostPath: 'C:\\Users\\test\\app',
  containerPath: '/workspace/app',
  startCommand: 'npm run dev',
  env: [],
  autostart: false,
  ...overrides,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ProjectRegistryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBrowsePackageJson.mockResolvedValue({
      path: '/host',
      parentPath: '/',
      entries: [
        { name: 'package.json', path: '/host/package.json', type: 'packageJson' },
      ],
    });
    mockParseScripts.mockResolvedValue({
      scripts: { dev: 'vite --port 3000' },
      path: '/host/package.json',
    });
  });

  // ----- Loading state -----

  it('shows a loading indicator on mount while fetching projects', () => {
    mockListProjects.mockReturnValue(new Promise<ProjectConfig[]>(() => {}));
    render(<ProjectRegistryPage />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  // ----- Empty state -----

  it('shows empty state when no projects are returned', async () => {
    mockListProjects.mockResolvedValue([]);
    render(<ProjectRegistryPage />);

    await waitFor(() => {
      expect(screen.getByText('No projects registered')).toBeInTheDocument();
    });

    expect(
      screen.getByText('Add a local app so devctl can manage its configuration.'),
    ).toBeInTheDocument();
  });

  // ----- Project rendering -----

  it('replaces empty state with project list after projects load', async () => {
    mockListProjects.mockResolvedValue([
      sampleProject({ id: 'p1', name: 'App One' }),
      sampleProject({ id: 'p2', name: 'App Two' }),
    ]);
    render(<ProjectRegistryPage />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    expect(
      screen.queryByText('No projects registered'),
    ).not.toBeInTheDocument();

    expect(screen.getByText('App One')).toBeInTheDocument();
    expect(screen.getByText('App Two')).toBeInTheDocument();
  });

  // ----- Load error state -----

  it('shows error message when API call fails', async () => {
    mockListProjects.mockRejectedValue(new Error('Registry unavailable'));
    render(<ProjectRegistryPage />);

    await waitFor(() => {
      expect(screen.getByText('Registry unavailable')).toBeInTheDocument();
    });
  });

  it('shows a retry button on load error', async () => {
    mockListProjects.mockRejectedValue(new Error('Failed to fetch'));
    render(<ProjectRegistryPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
  });

  it('retries loading when retry button is clicked', async () => {
    mockListProjects.mockRejectedValueOnce(new Error('Network error'));
    mockListProjects.mockResolvedValueOnce([
      sampleProject({ id: 'p1', name: 'Retried App' }),
    ]);
    render(<ProjectRegistryPage />);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const retryButton = screen.getByRole('button', { name: /retry/i });
    await user.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('Retried App')).toBeInTheDocument();
    });
    expect(mockListProjects).toHaveBeenCalledTimes(2);
  });

  // ----- Primary CTA -----

  it('renders an enabled primary "Add project" button', async () => {
    mockListProjects.mockResolvedValue([]);
    render(<ProjectRegistryPage />);

    const addButton = await screen.findByRole('button', { name: /add project/i });
    expect(addButton).toBeEnabled();
    expect(addButton).toHaveTextContent('Add project');
  });

  // ----- Page title -----

  it('renders the page title "Projects"', async () => {
    mockListProjects.mockResolvedValue([]);
    render(<ProjectRegistryPage />);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /projects/i, level: 1 }),
      ).toBeInTheDocument();
    });
  });

  // ===================================================================
  // Phase 2: Lifecycle controls
  // ===================================================================

  describe('lifecycle controls', () => {
    it('shows Start button for a stopped project', async () => {
      mockListProjects.mockResolvedValue([sampleProject({ id: 'p1', name: 'Stopped App' })]);
      render(<ProjectRegistryPage />);

      await waitFor(() => {
        expect(screen.getByText('Stopped App')).toBeInTheDocument();
      });

      expect(
        screen.getByRole('button', { name: /start stopped app/i }),
      ).toBeInTheDocument();
    });

    it('calls startProject when Start is clicked', async () => {
      const status: ProcessStatus = {
        state: 'starting',
        uptime: null,
        recentLogTail: [],
      };
      mockListProjects.mockResolvedValue([sampleProject({ id: 'p1', name: 'Start Me' })]);
      mockStartProject.mockResolvedValue(status);
      // Return 'stopped' on initial load so Start button shows
      mockGetProjectStatus.mockResolvedValue({
        state: 'stopped',
        uptime: null,
        recentLogTail: [],
      });

      render(<ProjectRegistryPage />);

      const user = userEvent.setup();
      await waitFor(() => {
        expect(screen.getByText('Start Me')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /start start me/i }));

      await waitFor(() => {
        expect(mockStartProject).toHaveBeenCalledWith('p1');
      });
    });

    it('calls stopProject when Stop is clicked', async () => {
      const status: ProcessStatus = {
        state: 'stopping',
        uptime: null,
        recentLogTail: [],
      };
      mockListProjects.mockResolvedValue([sampleProject({ id: 'p1', name: 'Stop Me' })]);
      mockStartProject.mockResolvedValue({
        state: 'running',
        uptime: 5,
        recentLogTail: [],
      });
      mockStopProject.mockResolvedValue(status);
      mockGetProjectStatus.mockResolvedValue({
        state: 'stopped',
        uptime: null,
        recentLogTail: [],
      });

      render(<ProjectRegistryPage />);

      const user = userEvent.setup();

      // First start the project to get into running state
      await waitFor(() => {
        expect(screen.getByText('Stop Me')).toBeInTheDocument();
      });
      await user.click(screen.getByRole('button', { name: /start stop me/i }));

      // Wait for running state to show Stop button
      await waitFor(() => {
        expect(mockStartProject).toHaveBeenCalledWith('p1');
      });
    });

    it('shows lifecycle error in snackbar on start failure', async () => {
      mockListProjects.mockResolvedValue([sampleProject({ id: 'p1', name: 'Fail App' })]);
      mockStartProject.mockRejectedValue(new Error('ENOENT'));

      render(<ProjectRegistryPage />);

      const user = userEvent.setup();
      await waitFor(() => {
        expect(screen.getByText('Fail App')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /start fail app/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/Could not start Fail App\. ENOENT/),
        ).toBeInTheDocument();
      });
    });
  });

  // ===================================================================
  // Desktop table (ProjectTable) — Phase 2 columns
  // ===================================================================

  describe('desktop table (ProjectTable)', () => {
    it('renders Phase 2 table header columns', async () => {
      mockListProjects.mockResolvedValue([
        sampleProject({ id: 'p1', name: 'Table App' }),
      ]);
      render(<ProjectRegistryPage />);

      await waitFor(() => {
        expect(screen.getByText('Table App')).toBeInTheDocument();
      });

      expect(screen.getByText('Project')).toBeInTheDocument();
      expect(screen.getByText('Host path')).toBeInTheDocument();
      expect(screen.getByText('Command')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();

      // Phase 1 removed columns should NOT render
      expect(screen.queryByText('Container path')).not.toBeInTheDocument();
      expect(screen.queryByText('Port')).not.toBeInTheDocument();
      expect(screen.queryByText('Health URL')).not.toBeInTheDocument();
      expect(screen.queryByText('Autostart')).not.toBeInTheDocument();
    });

    it('renders project data in table cells', async () => {
      mockListProjects.mockResolvedValue([
        sampleProject({
          id: 'p1',
          name: 'My App',
          hostPath: '/home/user/app',
          startCommand: 'npm run dev',
        }),
      ]);
      render(<ProjectRegistryPage />);

      await waitFor(() => {
        expect(screen.getByText('My App')).toBeInTheDocument();
      });

      expect(screen.getByText('/home/user/app')).toBeInTheDocument();
      expect(screen.getByText('npm run dev')).toBeInTheDocument();
    });

    it('renders edit button with correct aria-label', async () => {
      mockListProjects.mockResolvedValue([
        sampleProject({ id: 'p1', name: 'Edit Test' }),
      ]);
      render(<ProjectRegistryPage />);

      await waitFor(() => {
        expect(screen.getByText('Edit Test')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: 'Edit project' });
      expect(editButton).toBeInTheDocument();
    });

    it('renders delete button with correct aria-label', async () => {
      mockListProjects.mockResolvedValue([
        sampleProject({ id: 'p1', name: 'Delete Test' }),
      ]);
      render(<ProjectRegistryPage />);

      await waitFor(() => {
        expect(screen.getByText('Delete Test')).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: 'Delete project' });
      expect(deleteButton).toBeInTheDocument();
    });

    it('shows Stopped chip for status on load', async () => {
      mockListProjects.mockResolvedValue([
        sampleProject({ id: 'p1', name: 'New App' }),
      ]);
      mockGetProjectStatus.mockResolvedValue({
        state: 'stopped',
        uptime: null,
        recentLogTail: [],
      });
      render(<ProjectRegistryPage />);

      await waitFor(() => {
        expect(screen.getByText('New App')).toBeInTheDocument();
      });

      expect(screen.getByText('Stopped')).toBeInTheDocument();
    });
  });

  // ===================================================================
  // Drawer integration
  // ===================================================================

  it('opens create form drawer when Add project is clicked', async () => {
    mockListProjects.mockResolvedValue([]);
    render(<ProjectRegistryPage />);

    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: /add project/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/^name/i)).toBeInTheDocument();
    });
  });

  it('opens edit form drawer when Edit project is clicked', async () => {
    const project = sampleProject({
      id: 'p1',
      name: 'Edit Me',
      hostPath: '/custom/host',
    });
    mockListProjects.mockResolvedValue([project]);
    render(<ProjectRegistryPage />);

    await waitFor(() => {
      expect(screen.getByText('Edit Me')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Edit project' }));

    await waitFor(() => {
      expect(screen.getByDisplayValue('Edit Me')).toBeInTheDocument();
    });
    expect(screen.getByTestId('selected-directory-path')).toHaveTextContent('/custom/host');
  });

  it('closes drawer and reloads projects after successful save', async () => {
    mockListProjects.mockResolvedValue([]);
    mockCreateProject.mockResolvedValue({
      id: 'new_id',
      name: 'New Project',
      hostPath: '/host',
      containerPath: '/container',
      startCommand: 'npm start',
      scriptName: 'dev',
      env: [],
      autostart: false,
    });

    render(<ProjectRegistryPage />);

    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: /add project/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/^name/i)).toBeInTheDocument();
    });
    await user.type(screen.getByLabelText(/^name/i), 'New Project');

    await user.click(screen.getByRole('button', { name: /select package\.json/i }));
    await user.click(await screen.findByRole('button', { name: /package\.json/ }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /select package\.json/i })).not.toBeInTheDocument();
    });

    const scriptSelect = await screen.findByLabelText('Script');
    fireEvent.mouseDown(scriptSelect);
    await user.click(await screen.findByText(/dev - vite --port 3000/));

    await user.click(screen.getByRole('button', { name: 'Add project' }));

    await waitFor(() => {
      expect(mockListProjects).toHaveBeenCalledTimes(2);
    });
  });

  // ===================================================================
  // Delete dialog integration
  // ===================================================================

  it('opens delete confirmation dialog when Delete project is clicked', async () => {
    const project = sampleProject({ id: 'p1', name: 'To Delete' });
    mockListProjects.mockResolvedValue([project]);
    render(<ProjectRegistryPage />);

    await waitFor(() => {
      expect(screen.getByText('To Delete')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Delete project' }));

    await waitFor(() => {
      expect(
        screen.getByText(
          /Delete To Delete\? This removes the project from devctl/i,
        ),
      ).toBeInTheDocument();
    });
  });

  it('removes project from registry after successful delete', async () => {
    let callCount = 0;
    mockListProjects.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve([sampleProject({ id: 'p1', name: 'Delete Me' })]);
      }
      return Promise.resolve([]);
    });
    mockDeleteProject.mockResolvedValue(undefined);

    const user = userEvent.setup();
    render(<ProjectRegistryPage />);

    await waitFor(() => {
      expect(screen.getByText('Delete Me')).toBeInTheDocument();
    });

    const rowDeleteButtons = screen.getAllByRole('button', { name: 'Delete project' });
    await user.click(rowDeleteButtons[0]);

    const confirmButton = await screen.findByRole('button', { name: 'Delete project' });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(
        screen.getByText('No projects registered'),
      ).toBeInTheDocument();
    });
    expect(callCount).toBe(2);
  });

  it('does not display environment variable values in the registry page', async () => {
    mockListProjects.mockResolvedValue([
      sampleProject({
        id: 'p1',
        name: 'Env Test',
        env: [
          { key: 'NODE_ENV', value: 'production' },
          { key: 'API_KEY', value: 'secret-123' },
        ],
      }),
    ]);
    render(<ProjectRegistryPage />);

    await waitFor(() => {
      expect(screen.getByText('Env Test')).toBeInTheDocument();
    });

    expect(screen.queryByText('production')).not.toBeInTheDocument();
    expect(screen.queryByText('secret-123')).not.toBeInTheDocument();
    expect(screen.queryByText('NODE_ENV')).not.toBeInTheDocument();
    expect(screen.queryByText('API_KEY')).not.toBeInTheDocument();
  });

  // ===================================================================
  // Log viewer integration
  // ===================================================================

  it('shows log viewer icon button for each project', async () => {
    mockListProjects.mockResolvedValue([
      sampleProject({ id: 'p1', name: 'Log App' }),
    ]);
    render(<ProjectRegistryPage />);

    await waitFor(() => {
      expect(screen.getByText('Log App')).toBeInTheDocument();
    });

    expect(
      screen.getByRole('button', { name: /view logs for log app/i }),
    ).toBeInTheDocument();
  });

  it('expands and collapses inline live logs for a project', async () => {
    mockListProjects.mockResolvedValue([
      sampleProject({ id: 'p1', name: 'Log App' }),
    ]);
    mockGetProjectLogs.mockResolvedValue({
      currentRun: {
        runId: 'run-1',
        scriptName: 'dev',
        startTime: '2026-05-30T12:00:00.000Z',
        stdout: ['ready on 5273'],
        stderr: [],
      },
      history: [],
    });

    const user = userEvent.setup();
    render(<ProjectRegistryPage />);

    await waitFor(() => {
      expect(screen.getByText('Log App')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /view logs for log app/i }));

    expect(await screen.findByText('Live logs')).toBeInTheDocument();
    expect(await screen.findByText('ready on 5273')).toBeInTheDocument();
    expect(mockGetProjectLogs).toHaveBeenCalledWith('p1');

    await user.click(screen.getByRole('button', { name: /hide logs for log app/i }));

    await waitFor(() => {
      expect(screen.queryByText('ready on 5273')).not.toBeInTheDocument();
    });
  });

  // ===================================================================
  // Phase 3: Health polling and port-occupied errors
  // ===================================================================

  it('calls checkProjectHealth when project is running after lifecycle start', async () => {
    mockListProjects.mockResolvedValue([
      sampleProject({ id: 'p1', name: 'Health App', port: 3000 }),
    ]);
    mockGetProjectStatus
      .mockResolvedValueOnce({ state: 'stopped', uptime: null, recentLogTail: [] })
      .mockResolvedValue({ state: 'running', uptime: 10, recentLogTail: [] });
    mockStartProject.mockResolvedValue({
      state: 'starting',
      uptime: null,
      recentLogTail: [],
    });
    mockCheckProjectHealth.mockResolvedValue({
      port: { occupied: true },
      health: { healthy: true, statusCode: 200 },
    });

    const user = userEvent.setup();
    render(<ProjectRegistryPage />);

    // Wait for project to render with Start button
    await waitFor(() => {
      expect(screen.getByText('Health App')).toBeInTheDocument();
    });

    // Click Start — this triggers startPolling with a 1s interval
    await user.click(screen.getByRole('button', { name: /start health app/i }));

    // Wait for the polling interval to fire and checkProjectHealth to be called
    await waitFor(
      () => {
        expect(mockCheckProjectHealth).toHaveBeenCalledWith('p1');
      },
      { timeout: 3000 },
    );
  });

  it('does not call checkProjectHealth when project is stopped', async () => {
    mockListProjects.mockResolvedValue([
      sampleProject({ id: 'p1', name: 'Stopped App', port: 3000 }),
    ]);
    mockGetProjectStatus.mockResolvedValue({
      state: 'stopped',
      uptime: null,
      recentLogTail: [],
    });

    render(<ProjectRegistryPage />);

    await waitFor(() => {
      expect(screen.getByText('Stopped App')).toBeInTheDocument();
    });

    // Allow a small window for any potential health check calls
    await new Promise((r) => setTimeout(r, 100));

    expect(mockCheckProjectHealth).not.toHaveBeenCalled();
  });

  it('shows port-occupied error in snackbar on start failure', async () => {
    mockListProjects.mockResolvedValue([
      sampleProject({ id: 'p1', name: 'Port App', port: 3000 }),
    ]);
    mockGetProjectStatus.mockResolvedValue({
      state: 'stopped',
      uptime: null,
      recentLogTail: [],
    });
    mockStartProject.mockRejectedValue(
      new (class extends Error {
        status: number;
        constructor() {
          super('Port 3000 is already in use.');
          this.name = 'ApiError';
          this.status = 409;
        }
      })(),
    );

    const user = userEvent.setup();
    render(<ProjectRegistryPage />);

    await waitFor(() => {
      expect(screen.getByText('Port App')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /start port app/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Port 3000 is already in use/),
      ).toBeInTheDocument();
    });
  });
});
