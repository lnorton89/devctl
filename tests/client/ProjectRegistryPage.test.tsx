/**
 * Component tests for ProjectRegistryPage.
 *
 * Covers: loading state, empty state, load error rendering,
 * primary CTA presence, empty-state replacement after projects load,
 * no lifecycle controls rendered.
 *
 * @module ProjectRegistryPage.test
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import ProjectRegistryPage from '../../src/client/components/ProjectRegistryPage';
import type { ProjectConfig } from '../../src/shared/projectSchema.js';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockListProjects = vi.hoisted(() => vi.fn());

vi.mock('../../src/client/api/projectsApi', () => ({
  listProjects: mockListProjects,
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
  });

  // ----- Loading state -----

  it('shows a loading indicator on mount while fetching projects', () => {
    // Keep the promise pending so loading stays visible
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

    // Empty state copy
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

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Empty state should NOT be visible
    expect(
      screen.queryByText('No projects registered'),
    ).not.toBeInTheDocument();

    // Projects should appear
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
    // First call fails
    mockListProjects.mockRejectedValueOnce(new Error('Network error'));
    // Second call succeeds
    mockListProjects.mockResolvedValueOnce([
      sampleProject({ id: 'p1', name: 'Retried App' }),
    ]);
    render(<ProjectRegistryPage />);

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    // Click retry
    const user = userEvent.setup();
    const retryButton = screen.getByRole('button', { name: /retry/i });
    await user.click(retryButton);

    // Should call listProjects again and show the project
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

  // ----- No lifecycle controls (T-01-05-03) -----

  it('does not show start, stop, restart, or status controls', async () => {
    mockListProjects.mockResolvedValue([
      sampleProject({ id: 'p1', name: 'No Lifecycle App' }),
    ]);
    render(<ProjectRegistryPage />);

    await waitFor(() => {
      expect(screen.getByText('No Lifecycle App')).toBeInTheDocument();
    });

    // Verify absence of lifecycle-related controls
    expect(
      screen.queryByRole('button', { name: /start/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /stop/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /restart/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/running/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/stopped/i),
    ).not.toBeInTheDocument();
  });

  // ----- Callback wiring -----

  it('calls onAddProject when Add project is clicked', async () => {
    mockListProjects.mockResolvedValue([]);
    const onAddProject = vi.fn();
    render(<ProjectRegistryPage onAddProject={onAddProject} />);

    const addButton = await screen.findByRole('button', { name: /add project/i });
    const user = userEvent.setup();
    await user.click(addButton);

    expect(onAddProject).toHaveBeenCalledOnce();
  });

  // ===================================================================
  // Task 2 — ProjectTable / ProjectMobileList rendering
  // ===================================================================

  describe('desktop table (ProjectTable)', () => {
    it('renders table header columns', async () => {
      mockListProjects.mockResolvedValue([
        sampleProject({ id: 'p1', name: 'Table App' }),
      ]);
      render(<ProjectRegistryPage />);

      await waitFor(() => {
        expect(screen.getByText('Table App')).toBeInTheDocument();
      });

      // Column headers
      expect(screen.getByText('Project')).toBeInTheDocument();
      expect(screen.getByText('Host path')).toBeInTheDocument();
      expect(screen.getByText('Container path')).toBeInTheDocument();
      expect(screen.getByText('Command')).toBeInTheDocument();
      expect(screen.getByText('Port')).toBeInTheDocument();
      expect(screen.getByText('Health URL')).toBeInTheDocument();
      expect(screen.getByText('Autostart')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('renders project data in table cells', async () => {
      mockListProjects.mockResolvedValue([
        sampleProject({
          id: 'p1',
          name: 'My App',
          hostPath: '/home/user/app',
          containerPath: '/workspace/app',
          startCommand: 'npm run dev',
          port: 3000,
        }),
      ]);
      render(<ProjectRegistryPage />);

      await waitFor(() => {
        expect(screen.getByText('My App')).toBeInTheDocument();
      });

      expect(screen.getByText('/home/user/app')).toBeInTheDocument();
      expect(screen.getByText('/workspace/app')).toBeInTheDocument();
      expect(screen.getByText('npm run dev')).toBeInTheDocument();
      expect(screen.getByText('3000')).toBeInTheDocument();
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

    it('calls onEditProject when edit button is clicked', async () => {
      const project = sampleProject({ id: 'p1', name: 'Edit Me' });
      mockListProjects.mockResolvedValue([project]);
      const onEditProject = vi.fn();
      render(<ProjectRegistryPage onEditProject={onEditProject} />);

      await waitFor(() => {
        expect(screen.getByText('Edit Me')).toBeInTheDocument();
      });

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: 'Edit project' }));

      expect(onEditProject).toHaveBeenCalledOnce();
      expect(onEditProject).toHaveBeenCalledWith(project);
    });

    it('calls onDeleteProject when delete button is clicked', async () => {
      const project = sampleProject({ id: 'p1', name: 'Delete Me' });
      mockListProjects.mockResolvedValue([project]);
      const onDeleteProject = vi.fn();
      render(<ProjectRegistryPage onDeleteProject={onDeleteProject} />);

      await waitFor(() => {
        expect(screen.getByText('Delete Me')).toBeInTheDocument();
      });

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: 'Delete project' }));

      expect(onDeleteProject).toHaveBeenCalledOnce();
      expect(onDeleteProject).toHaveBeenCalledWith(project);
    });

    it('shows dash (—) for empty optional port and health URL', async () => {
      // Project without port or healthUrl
      mockListProjects.mockResolvedValue([
        sampleProject({
          id: 'p1',
          name: 'Minimal',
          port: undefined,
          healthUrl: undefined,
        }),
      ]);
      render(<ProjectRegistryPage />);

      await waitFor(() => {
        expect(screen.getByText('Minimal')).toBeInTheDocument();
      });

      // Empty optional values render as em-dash
      const dashes = screen.getAllByText('—');
      expect(dashes.length).toBeGreaterThanOrEqual(1);
    });

    it('shows autostart chip for Off state', async () => {
      mockListProjects.mockResolvedValue([
        sampleProject({ id: 'p1', name: 'AutoOff', autostart: false }),
      ]);
      render(<ProjectRegistryPage />);

      await waitFor(() => {
        expect(screen.getByText('AutoOff')).toBeInTheDocument();
      });

      expect(screen.getByText('Off')).toBeInTheDocument();
    });

    it('shows autostart chip for On state', async () => {
      mockListProjects.mockResolvedValue([
        sampleProject({ id: 'p1', name: 'AutoOn', autostart: true }),
      ]);
      render(<ProjectRegistryPage />);

      await waitFor(() => {
        expect(screen.getByText('AutoOn')).toBeInTheDocument();
      });

      expect(screen.getByText('On')).toBeInTheDocument();
    });
  });

  // ----- No env values in registry display (T-01-05-01) -----

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

    // Env values should NOT be visible
    expect(screen.queryByText('production')).not.toBeInTheDocument();
    expect(screen.queryByText('secret-123')).not.toBeInTheDocument();
    // Keys also should not appear in table rows
    expect(screen.queryByText('NODE_ENV')).not.toBeInTheDocument();
    expect(screen.queryByText('API_KEY')).not.toBeInTheDocument();
  });
});
