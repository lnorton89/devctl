/**
 * Component tests for ProjectFormDrawer (Phase 2).
 *
 * Covers: directory picker, script dropdown, old field hiding,
 * parse script loading/error states, create/edit submission.
 *
 * @module ProjectFormDrawer.test
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import ProjectFormDrawer from '../../src/client/components/ProjectFormDrawer';
import type { ProjectConfig } from '../../src/shared/projectSchema.js';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockCreateProject = vi.hoisted(() => vi.fn());
const mockUpdateProject = vi.hoisted(() => vi.fn());
const mockParseScripts = vi.hoisted(() => vi.fn());
const mockBrowsePackageJson = vi.hoisted(() => vi.fn());

vi.mock('../../src/client/api/projectsApi', () => ({
  createProject: mockCreateProject,
  updateProject: mockUpdateProject,
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
// Sample data
// ---------------------------------------------------------------------------

const SAMPLE_SCRIPTS = {
  dev: 'vite --port 3000',
  build: 'tsc && vite build',
  start: 'node dist/index.js',
  test: 'vitest run',
};

const sampleProject = (overrides: Partial<ProjectConfig> = {}): ProjectConfig => ({
  id: 'proj_001',
  name: 'Test App',
  hostPath: 'C:\\Users\\test\\app',
  containerPath: '/workspace/app',
  startCommand: 'npm run dev',
  scriptName: 'dev',
  env: [],
  autostart: false,
  ...overrides,
});

async function choosePackageJson(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.click(screen.getByRole('button', { name: /select package\.json/i }));
  await screen.findByRole('dialog', { name: /select package\.json/i });
  await user.click(await screen.findByRole('button', { name: /package\.json/ }));
  await waitFor(() => {
    expect(screen.queryByRole('dialog', { name: /select package\.json/i })).not.toBeInTheDocument();
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ProjectFormDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParseScripts.mockResolvedValue({ scripts: SAMPLE_SCRIPTS, path: '/test/app' });
    mockBrowsePackageJson.mockResolvedValue({
      path: '/test/app',
      parentPath: '/test',
      entries: [
        { name: 'src', path: '/test/app/src', type: 'directory' },
        { name: 'package.json', path: '/test/app/package.json', type: 'packageJson' },
      ],
    });
  });

  // =====================================================================
  // Create mode
  // =====================================================================

  it('shows "Add project" title in create mode', () => {
    render(<ProjectFormDrawer open onClose={vi.fn()} onSaved={vi.fn()} />);

    expect(
      screen.getByRole('heading', { name: 'Add project' }),
    ).toBeInTheDocument();
  });

  it('shows "Add project" submit button in create mode', () => {
    render(<ProjectFormDrawer open onClose={vi.fn()} onSaved={vi.fn()} />);

    expect(
      screen.getByRole('button', { name: 'Add project' }),
    ).toBeInTheDocument();
  });

  it('shows Name, package picker, selected directory display, and no Phase 1 fields', () => {
    render(<ProjectFormDrawer open onClose={vi.fn()} onSaved={vi.fn()} />);

    expect(screen.getByLabelText(/^name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /select package\.json/i })).toBeInTheDocument();
    expect(screen.getByText('Project directory')).toBeInTheDocument();
    expect(screen.getByTestId('selected-directory-path')).toHaveTextContent(
      'No package.json selected',
    );

    // Phase 1 fields should NOT be present
    expect(screen.queryByLabelText(/directory path/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/host path/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/container path/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/start command/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^port/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/health url/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/app url/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/env file path/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('switch', { name: /autostart/i })).not.toBeInTheDocument();
  });

  it('shows package.json selection button', () => {
    render(<ProjectFormDrawer open onClose={vi.fn()} onSaved={vi.fn()} />);

    expect(
      screen.getByRole('button', { name: /select package\.json/i }),
    ).toBeInTheDocument();
  });

  // =====================================================================
  // Edit mode
  // =====================================================================

  it('shows "Edit project" title in edit mode', () => {
    render(
      <ProjectFormDrawer
        open
        project={sampleProject()}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    expect(screen.getByText('Edit project')).toBeInTheDocument();
  });

  it('shows "Save changes" submit button in edit mode', () => {
    render(
      <ProjectFormDrawer
        open
        project={sampleProject()}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Save changes' }),
    ).toBeInTheDocument();
  });

  it('pre-populates name and shows directory path in edit mode', () => {
    const project = sampleProject({
      name: 'My Edited App',
      hostPath: '/custom/host',
    });

    render(
      <ProjectFormDrawer
        open
        project={project}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    expect(screen.getByLabelText(/^name/i)).toHaveValue('My Edited App');
    expect(screen.getByTestId('selected-directory-path')).toHaveTextContent('/custom/host');
  });

  // =====================================================================
  // Script parsing
  // =====================================================================

  it('calls parseScripts for the existing directory in edit mode', async () => {
    const existing = sampleProject({ hostPath: '/test/app' });
    render(
      <ProjectFormDrawer
        open
        project={existing}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(mockParseScripts).toHaveBeenCalledWith('/test/app');
    });
  });

  it('shows script dropdown after package scripts load in edit mode', async () => {
    const existing = sampleProject({ hostPath: '/test/app' });

    render(
      <ProjectFormDrawer
        open
        project={existing}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });

  it('opens a package.json picker from the selection button', async () => {
    const user = userEvent.setup();
    render(<ProjectFormDrawer open onClose={vi.fn()} onSaved={vi.fn()} />);

    await waitFor(() => {
      expect(mockBrowsePackageJson).not.toHaveBeenCalled();
    });

    await user.click(screen.getByRole('button', { name: /select package\.json/i }));

    expect(await screen.findByRole('dialog', { name: /select package\.json/i })).toBeInTheDocument();
    expect(mockBrowsePackageJson).toHaveBeenCalledWith(undefined);
    expect(await screen.findByText('package.json')).toBeInTheDocument();
  });

  it('fills directory path and loads scripts when package.json is selected', async () => {
    const user = userEvent.setup();
    render(<ProjectFormDrawer open onClose={vi.fn()} onSaved={vi.fn()} />);

    await choosePackageJson(user);

    await waitFor(() => {
      expect(screen.getByTestId('selected-directory-path')).toHaveTextContent('/test/app');
      expect(mockParseScripts).toHaveBeenCalledWith('/test/app');
    });
  });

  it('navigates folders in the package.json picker', async () => {
    const user = userEvent.setup();
    mockBrowsePackageJson
      .mockResolvedValueOnce({
        path: '/test/app',
        parentPath: '/test',
        entries: [{ name: 'nested', path: '/test/app/nested', type: 'directory' }],
      })
      .mockResolvedValueOnce({
        path: '/test/app/nested',
        parentPath: '/test/app',
        entries: [{ name: 'package.json', path: '/test/app/nested/package.json', type: 'packageJson' }],
      });
    render(<ProjectFormDrawer open onClose={vi.fn()} onSaved={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /select package\.json/i }));
    await user.click(await screen.findByText('nested'));

    expect(await screen.findByText('/test/app/nested')).toBeInTheDocument();
    expect(mockBrowsePackageJson).toHaveBeenLastCalledWith('/test/app/nested');
  });

  it('shows script loading indicator', async () => {
    mockParseScripts.mockReturnValue(new Promise(() => {}));

    render(
      <ProjectFormDrawer
        open
        project={sampleProject({ hostPath: '/test/app' })}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Looking for scripts...')).toBeInTheDocument();
    });
  });

  it('disables submit button while scripts are loading', async () => {
    mockParseScripts.mockReturnValue(new Promise(() => {}));

    const user = userEvent.setup();
    render(
      <ProjectFormDrawer
        open
        project={sampleProject({ hostPath: '/test/app' })}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    // Name is required, fill it
    await user.type(screen.getByLabelText(/^name/i), 'My App');

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
    });
  });

  // =====================================================================
  // Script error states
  // =====================================================================

  it('shows error when parseScripts fails', async () => {
    mockParseScripts.mockRejectedValue(new Error('No package.json found at this path.'));

    render(
      <ProjectFormDrawer
        open
        project={sampleProject({ hostPath: '/test/app' })}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByText('No package.json found at this path.'),
      ).toBeInTheDocument();
    });
  });

  // =====================================================================
  // Submit
  // =====================================================================

  it('shows script selection error when submitting without selecting a script', async () => {
    mockParseScripts.mockResolvedValue({ scripts: SAMPLE_SCRIPTS, path: '/test/app' });

    const user = userEvent.setup();
    render(<ProjectFormDrawer open onClose={vi.fn()} onSaved={vi.fn()} />);

    await user.type(screen.getByLabelText(/^name/i), 'My App');
    await choosePackageJson(user);

    await waitFor(() => {
      expect(screen.getByLabelText('Script')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Add project' }));

    await waitFor(() => {
      expect(screen.getByText('Select a script.')).toBeInTheDocument();
    });
  });

  it('calls createProject with derived payload when script is selected', async () => {
    mockCreateProject.mockResolvedValue(sampleProject({ id: 'new_id' }));

    const user = userEvent.setup();
    const onSaved = vi.fn();

    render(<ProjectFormDrawer open onClose={vi.fn()} onSaved={onSaved} />);

    await user.type(screen.getByLabelText(/^name/i), 'My App');
    await choosePackageJson(user);

    // Wait for script dropdown to appear
    await waitFor(() => {
      expect(screen.getByLabelText('Script')).toBeInTheDocument();
    });

    // Open the dropdown
    const scriptLabel = screen.getByLabelText('Script');
    fireEvent.mouseDown(scriptLabel);

    // Click dev script
    const devOption = await screen.findByText(/dev - vite --port 3000/);
    await user.click(devOption);

    // Submit
    await user.click(screen.getByRole('button', { name: 'Add project' }));

    await waitFor(() => {
      expect(mockCreateProject).toHaveBeenCalledOnce();
    });

    const callArg = mockCreateProject.mock.calls[0][0];
    expect(callArg).toMatchObject({
      name: 'My App',
      hostPath: '/test/app',
      containerPath: '/test/app',
      startCommand: 'npm run dev',
      scriptName: 'dev',
    });
  });

  it('calls onSaved after successful create', async () => {
    mockCreateProject.mockResolvedValue(sampleProject({ id: 'new_id' }));

    const user = userEvent.setup();
    const onSaved = vi.fn();

    render(<ProjectFormDrawer open onClose={vi.fn()} onSaved={onSaved} />);

    await user.type(screen.getByLabelText(/^name/i), 'My App');
    await choosePackageJson(user);

    await waitFor(() => {
      expect(screen.getByLabelText('Script')).toBeInTheDocument();
    });

    const scriptLabel = screen.getByLabelText('Script');
    fireEvent.mouseDown(scriptLabel);
    const devOption = await screen.findByText(/dev/);
    await user.click(devOption);

    await user.click(screen.getByRole('button', { name: 'Add project' }));

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledOnce();
    });
  });

  it('calls updateProject in edit mode', async () => {
    const existing = sampleProject({
      id: 'proj_edit',
      name: 'Original',
      hostPath: '/orig/host',
      scriptName: 'dev',
    });

    mockUpdateProject.mockResolvedValue(existing);

    const user = userEvent.setup();
    const onSaved = vi.fn();

    render(
      <ProjectFormDrawer
        open
        project={existing}
        onClose={vi.fn()}
        onSaved={onSaved}
      />,
    );

    const nameInput = screen.getByLabelText(/^name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated');

    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(mockUpdateProject).toHaveBeenCalledOnce();
    });

    const [callId, callData] = mockUpdateProject.mock.calls[0];
    expect(callId).toBe('proj_edit');
    expect(callData.name).toBe('Updated');
  });

  // =====================================================================
  // Close behavior
  // =====================================================================

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <ProjectFormDrawer
        open
        project={sampleProject()}
        onClose={onClose}
        onSaved={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onClose).toHaveBeenCalledOnce();
  });
});
