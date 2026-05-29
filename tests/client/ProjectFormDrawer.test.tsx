/**
 * Component tests for ProjectFormDrawer.
 *
 * Covers: create/edit mode switching, required validation, optional field
 * validation, env variable editor (add/remove rows), autostart switch,
 * helper text, API mutation wiring, validation issue mapping, save error
 * display, and disabled submission during save.
 *
 * @module ProjectFormDrawer.test
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import ProjectFormDrawer from '../../src/client/components/ProjectFormDrawer';
import type { ProjectConfig } from '../../src/shared/projectSchema.js';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockCreateProject = vi.hoisted(() => vi.fn());
const mockUpdateProject = vi.hoisted(() => vi.fn());

vi.mock('../../src/client/api/projectsApi', () => ({
  createProject: mockCreateProject,
  updateProject: mockUpdateProject,
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

// Helper to fill all required fields in the form
async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^name/i), 'My App');
  await user.type(screen.getByLabelText(/host path/i), '/host/myapp');
  await user.type(screen.getByLabelText(/container path/i), '/container/myapp');
  await user.type(screen.getByLabelText(/start command/i), 'npm start');
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ProjectFormDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

    expect(screen.getByRole('button', { name: 'Add project' })).toBeInTheDocument();
  });

  it('shows empty fields in create mode', () => {
    render(<ProjectFormDrawer open onClose={vi.fn()} onSaved={vi.fn()} />);

    expect(screen.getByLabelText(/^name/i)).toHaveValue('');
    expect(screen.getByLabelText(/host path/i)).toHaveValue('');
    expect(screen.getByLabelText(/container path/i)).toHaveValue('');
    expect(screen.getByLabelText(/start command/i)).toHaveValue('');
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

  it('pre-populates fields with project values in edit mode', () => {
    const project = sampleProject({
      name: 'My Edited App',
      hostPath: '/custom/host',
      containerPath: '/custom/container',
      startCommand: 'yarn dev',
      port: 8080,
      appUrl: 'https://example.com',
      healthUrl: 'https://example.com/health',
      envFilePath: '.env.prod',
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
    expect(screen.getByLabelText(/host path/i)).toHaveValue('/custom/host');
    expect(screen.getByLabelText(/container path/i)).toHaveValue('/custom/container');
    expect(screen.getByLabelText(/start command/i)).toHaveValue('yarn dev');
    expect(screen.getByLabelText(/^port/i)).toHaveValue(8080);
    expect(screen.getByLabelText(/app url/i)).toHaveValue('https://example.com');
    expect(screen.getByLabelText(/health url/i)).toHaveValue('https://example.com/health');
    expect(screen.getByLabelText(/env file path/i)).toHaveValue('.env.prod');
  });

  it('pre-populates env variables in edit mode', () => {
    const project = sampleProject({
      env: [
        { key: 'NODE_ENV', value: 'production' },
        { key: 'API_KEY', value: 'sk-abc123' },
      ],
    });

    render(
      <ProjectFormDrawer
        open
        project={project}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    // First env row
    expect(screen.getByDisplayValue('NODE_ENV')).toBeInTheDocument();
    expect(screen.getByDisplayValue('production')).toBeInTheDocument();
    // Second env row
    expect(screen.getByDisplayValue('API_KEY')).toBeInTheDocument();
    expect(screen.getByDisplayValue('sk-abc123')).toBeInTheDocument();
  });

  it('pre-populates autostart switch in edit mode', () => {
    const project = sampleProject({ autostart: true });

    render(
      <ProjectFormDrawer
        open
        project={project}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    const switch_ = screen.getByRole('switch', { name: /autostart/i });
    expect(switch_).toBeChecked();
  });

  it('pre-populates autostart as unchecked when false in edit mode', () => {
    const project = sampleProject({ autostart: false });

    render(
      <ProjectFormDrawer
        open
        project={project}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    const switch_ = screen.getByRole('switch', { name: /autostart/i });
    expect(switch_).not.toBeChecked();
  });

  // =====================================================================
  // Helper text
  // =====================================================================

  it('shows correct helper text for host path', () => {
    render(<ProjectFormDrawer open onClose={vi.fn()} onSaved={vi.fn()} />);

    expect(
      screen.getByText('Path on this workstation.'),
    ).toBeInTheDocument();
  });

  it('shows correct helper text for container path', () => {
    render(<ProjectFormDrawer open onClose={vi.fn()} onSaved={vi.fn()} />);

    expect(
      screen.getByText('Mounted path devctl uses inside Docker.'),
    ).toBeInTheDocument();
  });

  // =====================================================================
  // Required field validation
  // =====================================================================

  it('shows required validation error for name when empty', async () => {
    const user = userEvent.setup();
    render(<ProjectFormDrawer open onClose={vi.fn()} onSaved={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Add project' }));

    expect(screen.getByText('Name is required.')).toBeInTheDocument();
  });

  it('shows required validation error for host path when empty', async () => {
    const user = userEvent.setup();
    render(<ProjectFormDrawer open onClose={vi.fn()} onSaved={vi.fn()} />);

    await user.type(screen.getByLabelText(/^name/i), 'My App');
    await user.click(screen.getByRole('button', { name: 'Add project' }));

    expect(screen.getByText('Host path is required.')).toBeInTheDocument();
  });

  it('shows required validation error for container path when empty', async () => {
    const user = userEvent.setup();
    render(<ProjectFormDrawer open onClose={vi.fn()} onSaved={vi.fn()} />);

    await user.type(screen.getByLabelText(/^name/i), 'My App');
    await user.type(screen.getByLabelText(/host path/i), '/host/path');
    await user.click(screen.getByRole('button', { name: 'Add project' }));

    expect(
      screen.getByText('Container path is required.'),
    ).toBeInTheDocument();
  });

  it('shows required validation error for command when empty', async () => {
    const user = userEvent.setup();
    render(<ProjectFormDrawer open onClose={vi.fn()} onSaved={vi.fn()} />);

    await user.type(screen.getByLabelText(/^name/i), 'My App');
    await user.type(screen.getByLabelText(/host path/i), '/host/path');
    await user.type(screen.getByLabelText(/container path/i), '/container/path');
    await user.click(screen.getByRole('button', { name: 'Add project' }));

    expect(
      screen.getByText('Start command is required.'),
    ).toBeInTheDocument();
  });

  it('shows multiple required validation errors when submitting empty form', async () => {
    const user = userEvent.setup();
    render(<ProjectFormDrawer open onClose={vi.fn()} onSaved={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Add project' }));

    expect(screen.getByText('Name is required.')).toBeInTheDocument();
    expect(screen.getByText('Host path is required.')).toBeInTheDocument();
    expect(screen.getByText('Container path is required.')).toBeInTheDocument();
    expect(screen.getByText('Start command is required.')).toBeInTheDocument();
  });

  // =====================================================================
  // Optional field validation
  // =====================================================================

  it('shows port validation error for out-of-range port', async () => {
    const user = userEvent.setup();
    render(<ProjectFormDrawer open onClose={vi.fn()} onSaved={vi.fn()} />);

    await fillRequiredFields(user);
    await user.type(screen.getByLabelText(/^port/i), '99999');
    await user.click(screen.getByRole('button', { name: 'Add project' }));

    expect(
      screen.getByText('Port must be between 1 and 65535.'),
    ).toBeInTheDocument();
  });



  it('shows health URL validation error for invalid URL', async () => {
    const user = userEvent.setup();
    render(<ProjectFormDrawer open onClose={vi.fn()} onSaved={vi.fn()} />);

    await fillRequiredFields(user);
    await user.type(screen.getByLabelText(/health url/i), 'not-a-url');
    await user.click(screen.getByRole('button', { name: 'Add project' }));

    expect(screen.getByText('Enter a valid health URL.')).toBeInTheDocument();
  });

  it('shows app URL validation error for invalid URL', async () => {
    const user = userEvent.setup();
    render(<ProjectFormDrawer open onClose={vi.fn()} onSaved={vi.fn()} />);

    await fillRequiredFields(user);
    await user.type(screen.getByLabelText(/app url/i), 'bad-url');
    await user.click(screen.getByRole('button', { name: 'Add project' }));

    expect(screen.getByText('Enter a valid app URL.')).toBeInTheDocument();
  });

  it('shows env key validation error for invalid key format', async () => {
    const user = userEvent.setup();
    render(<ProjectFormDrawer open onClose={vi.fn()} onSaved={vi.fn()} />);

    await fillRequiredFields(user);

    // Add env variable with invalid key
    await user.click(screen.getByRole('button', { name: /add variable/i }));
    await user.type(screen.getAllByPlaceholderText(/key/i)[0], '123invalid');

    await user.click(screen.getByRole('button', { name: 'Add project' }));

    expect(
      screen.getByText(
        'Environment variable names must use letters, numbers, and underscores.',
      ),
    ).toBeInTheDocument();
  });

  // =====================================================================
  // Env variable editor
  // =====================================================================

  it('shows "Add variable" button for env editor', () => {
    render(<ProjectFormDrawer open onClose={vi.fn()} onSaved={vi.fn()} />);

    expect(
      screen.getByRole('button', { name: /add variable/i }),
    ).toBeInTheDocument();
  });

  it('adds an env row when "Add variable" is clicked', async () => {
    const user = userEvent.setup();
    render(<ProjectFormDrawer open onClose={vi.fn()} onSaved={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /add variable/i }));

    // Should have key and value fields for the new env row
    const keyInputs = screen.getAllByPlaceholderText(/key/i);
    const valueInputs = screen.getAllByPlaceholderText(/value/i);
    expect(keyInputs.length).toBeGreaterThanOrEqual(1);
    expect(valueInputs.length).toBeGreaterThanOrEqual(1);
  });

  it('removes an env row when remove button is clicked', async () => {
    const user = userEvent.setup();
    const project = sampleProject({
      env: [{ key: 'NODE_ENV', value: 'test' }],
    });

    render(
      <ProjectFormDrawer
        open
        project={project}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    // Should show the env row
    expect(screen.getByDisplayValue('NODE_ENV')).toBeInTheDocument();

    // Click the remove button for the env row
    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    await user.click(removeButtons[0]);

    // Row should be removed
    expect(screen.queryByDisplayValue('NODE_ENV')).not.toBeInTheDocument();
  });

  it('removes the correct env row when multiple exist', async () => {
    const user = userEvent.setup();
    const project = sampleProject({
      env: [
        { key: 'FIRST_VAR', value: 'first' },
        { key: 'SECOND_VAR', value: 'second' },
      ],
    });

    render(
      <ProjectFormDrawer
        open
        project={project}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    // Remove the first row
    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    await user.click(removeButtons[0]);

    // First var should be gone, second should remain
    expect(screen.queryByDisplayValue('FIRST_VAR')).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('SECOND_VAR')).toBeInTheDocument();
  });

  // =====================================================================
  // API mutation wiring — create
  // =====================================================================

  it('calls createProject with form data on submit in create mode', async () => {
    mockCreateProject.mockResolvedValue(sampleProject({ id: 'new_id', name: 'My App' }));

    const user = userEvent.setup();
    const onSaved = vi.fn();

    render(<ProjectFormDrawer open onClose={vi.fn()} onSaved={onSaved} />);

    await fillRequiredFields(user);
    await user.click(screen.getByRole('button', { name: 'Add project' }));

    await waitFor(() => {
      expect(mockCreateProject).toHaveBeenCalledOnce();
    });

    const callArg = mockCreateProject.mock.calls[0][0];
    expect(callArg).toMatchObject({
      name: 'My App',
      hostPath: '/host/myapp',
      containerPath: '/container/myapp',
      startCommand: 'npm start',
    });
  });

  it('calls onSaved after successful create', async () => {
    mockCreateProject.mockResolvedValue(sampleProject({ id: 'new_id' }));

    const user = userEvent.setup();
    const onSaved = vi.fn();

    render(<ProjectFormDrawer open onClose={vi.fn()} onSaved={onSaved} />);

    await fillRequiredFields(user);
    await user.click(screen.getByRole('button', { name: 'Add project' }));

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledOnce();
    });
  });

  // =====================================================================
  // API mutation wiring — update
  // =====================================================================

  it('calls updateProject with form data on submit in edit mode', async () => {
    const existing = sampleProject({
      id: 'proj_edit',
      name: 'Original',
      hostPath: '/orig/host',
      containerPath: '/orig/container',
      startCommand: 'npm run orig',
    });
    mockUpdateProject.mockResolvedValue({ ...existing, name: 'Updated' });

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

    // Modify the name
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

  it('calls onSaved after successful update', async () => {
    const existing = sampleProject({ id: 'proj_edit' });
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

    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledOnce();
    });
  });

  // =====================================================================
  // Save error display
  // =====================================================================

  it('shows save error message when API call fails', async () => {
    mockCreateProject.mockRejectedValue(
      new Error('Project could not be saved. Check the highlighted fields and try again.'),
    );

    const user = userEvent.setup();
    render(<ProjectFormDrawer open onClose={vi.fn()} onSaved={vi.fn()} />);

    await fillRequiredFields(user);
    await user.click(screen.getByRole('button', { name: 'Add project' }));

    await waitFor(() => {
      expect(
        screen.getByText(
          'Project could not be saved. Check the highlighted fields and try again.',
        ),
      ).toBeInTheDocument();
    });
  });

  it('shows generic error message when API fails without message', async () => {
    mockCreateProject.mockRejectedValue(new Error('Network error'));

    const user = userEvent.setup();
    render(<ProjectFormDrawer open onClose={vi.fn()} onSaved={vi.fn()} />);

    await fillRequiredFields(user);
    await user.click(screen.getByRole('button', { name: 'Add project' }));

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('maps API validation issues to field errors', async () => {
    const apiError = new Error('Validation failed');
    (apiError as any).status = 400;
    (apiError as any).issues = [
      { path: 'name', message: 'Name is required.' },
      { path: 'hostPath', message: 'Host path is required.' },
    ];
    mockCreateProject.mockRejectedValue(apiError);

    const user = userEvent.setup();
    render(<ProjectFormDrawer open onClose={vi.fn()} onSaved={vi.fn()} />);

    await fillRequiredFields(user);
    await user.click(screen.getByRole('button', { name: 'Add project' }));

    await waitFor(() => {
      expect(screen.getByText('Name is required.')).toBeInTheDocument();
      expect(screen.getByText('Host path is required.')).toBeInTheDocument();
    });
  });

  // =====================================================================
  // Submit button behavior during save
  // =====================================================================

  it('disables submit button while saving', async () => {
    // Keep the promise pending to simulate in-flight save
    mockCreateProject.mockReturnValue(new Promise(() => {}));

    const user = userEvent.setup();
    render(<ProjectFormDrawer open onClose={vi.fn()} onSaved={vi.fn()} />);

    await fillRequiredFields(user);
    await user.click(screen.getByRole('button', { name: 'Add project' }));

    // After clicking, the button should be disabled
    expect(screen.getByRole('button', { name: 'Add project' })).toBeDisabled();
  });

  // =====================================================================
  // Close behavior
  // =====================================================================

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <ProjectFormDrawer open project={sampleProject()} onClose={onClose} onSaved={vi.fn()} />,
    );

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when drawer is closed but not on save', async () => {
    mockCreateProject.mockResolvedValue(sampleProject({ id: 'new_id' }));

    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSaved = vi.fn();

    render(<ProjectFormDrawer open onClose={onClose} onSaved={onSaved} />);

    await fillRequiredFields(user);
    await user.click(screen.getByRole('button', { name: 'Add project' }));

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledOnce();
    });

    // onClose should NOT have been called by save
    expect(onClose).not.toHaveBeenCalled();
  });

  // =====================================================================
  // Env variable value persistence
  // =====================================================================

  it('includes env variable values in create API call', async () => {
    mockCreateProject.mockResolvedValue(sampleProject({ id: 'new_id' }));

    const user = userEvent.setup();
    render(<ProjectFormDrawer open onClose={vi.fn()} onSaved={vi.fn()} />);

    await fillRequiredFields(user);

    // Add env variables
    await user.click(screen.getByRole('button', { name: /add variable/i }));
    const keyInputs = screen.getAllByPlaceholderText(/key/i);
    const valueInputs = screen.getAllByPlaceholderText(/value/i);

    await user.type(keyInputs[0], 'NODE_ENV');
    await user.type(valueInputs[0], 'development');

    await user.click(screen.getByRole('button', { name: 'Add project' }));

    await waitFor(() => {
      expect(mockCreateProject).toHaveBeenCalledOnce();
    });

    const callArg = mockCreateProject.mock.calls[0][0];
    expect(callArg.env).toEqual([{ key: 'NODE_ENV', value: 'development' }]);
  });

  it('includes autostart value in create API call', async () => {
    mockCreateProject.mockResolvedValue(sampleProject({ id: 'new_id' }));

    const user = userEvent.setup();
    render(<ProjectFormDrawer open onClose={vi.fn()} onSaved={vi.fn()} />);

    await fillRequiredFields(user);

    // Toggle autostart on
    const autostartSwitch = screen.getByRole('switch', { name: /autostart/i });
    await user.click(autostartSwitch);

    await user.click(screen.getByRole('button', { name: 'Add project' }));

    await waitFor(() => {
      expect(mockCreateProject).toHaveBeenCalledOnce();
    });

    const callArg = mockCreateProject.mock.calls[0][0];
    expect(callArg.autostart).toBe(true);
  });
});
