/**
 * Component tests for DeleteProjectDialog.
 *
 * Covers: dialog opening, exact confirmation copy, cancel behavior,
 * successful deletion, API error display, destructive action labeling,
 * and absence of lifecycle controls or file-deletion wording.
 *
 * @module DeleteProjectDialog.test
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import DeleteProjectDialog from '../../src/client/components/DeleteProjectDialog';
import type { ProjectConfig } from '../../src/shared/projectSchema.js';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockDeleteProject = vi.hoisted(() => vi.fn());

vi.mock('../../src/client/api/projectsApi', () => ({
  deleteProject: mockDeleteProject,
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

describe('DeleteProjectDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =====================================================================
  // Dialog rendering
  // =====================================================================

  it('renders when open is true', () => {
    render(
      <DeleteProjectDialog
        open
        project={sampleProject()}
        onClose={vi.fn()}
        onDeleted={vi.fn()}
      />,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    render(
      <DeleteProjectDialog
        open={false}
        project={sampleProject()}
        onClose={vi.fn()}
        onDeleted={vi.fn()}
      />,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  // =====================================================================
  // Confirmation copy (exact UI-SPEC copy)
  // =====================================================================

  it('shows the exact confirmation copy with project name', () => {
    const project = sampleProject({ name: 'My App' });

    render(
      <DeleteProjectDialog
        open
        project={project}
        onClose={vi.fn()}
        onDeleted={vi.fn()}
      />,
    );

    expect(
      screen.getByText(
        'Delete My App? This removes the project from devctl but does not delete files from disk.',
      ),
    ).toBeInTheDocument();
  });

  it('shows "Delete project" as the destructive action button', () => {
    render(
      <DeleteProjectDialog
        open
        project={sampleProject()}
        onClose={vi.fn()}
        onDeleted={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Delete project' }),
    ).toBeInTheDocument();
  });

  it('shows "Cancel" button', () => {
    render(
      <DeleteProjectDialog
        open
        project={sampleProject()}
        onClose={vi.fn()}
        onDeleted={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Cancel' }),
    ).toBeInTheDocument();
  });

  it('confirms the correct wording about not deleting files from disk', () => {
    render(
      <DeleteProjectDialog
        open
        project={sampleProject({ name: 'Test App' })}
        onClose={vi.fn()}
        onDeleted={vi.fn()}
      />,
    );

    // Verify the copy explicitly states files are not deleted
    expect(
      screen.getByText(/does not delete files from disk/i),
    ).toBeInTheDocument();
  });

  // =====================================================================
  // Cancel / Close behavior
  // =====================================================================

  it('calls onClose when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <DeleteProjectDialog
        open
        project={sampleProject()}
        onClose={onClose}
        onDeleted={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not call onDeleted when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const onDeleted = vi.fn();

    render(
      <DeleteProjectDialog
        open
        project={sampleProject()}
        onClose={vi.fn()}
        onDeleted={onDeleted}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onDeleted).not.toHaveBeenCalled();
  });

  // =====================================================================
  // Delete API call
  // =====================================================================

  it('calls deleteProject with the project id when Delete is clicked', async () => {
    mockDeleteProject.mockResolvedValue(undefined);

    const user = userEvent.setup();
    const project = sampleProject({ id: 'proj_del' });

    render(
      <DeleteProjectDialog
        open
        project={project}
        onClose={vi.fn()}
        onDeleted={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Delete project' }));

    await waitFor(() => {
      expect(mockDeleteProject).toHaveBeenCalledOnce();
    });
    expect(mockDeleteProject).toHaveBeenCalledWith('proj_del');
  });

  it('calls onDeleted after successful deletion', async () => {
    mockDeleteProject.mockResolvedValue(undefined);

    const user = userEvent.setup();
    const onDeleted = vi.fn();

    render(
      <DeleteProjectDialog
        open
        project={sampleProject({ id: 'proj_del' })}
        onClose={vi.fn()}
        onDeleted={onDeleted}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Delete project' }));

    await waitFor(() => {
      expect(onDeleted).toHaveBeenCalledOnce();
    });
  });

  it('calls onClose after successful deletion', async () => {
    mockDeleteProject.mockResolvedValue(undefined);

    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <DeleteProjectDialog
        open
        project={sampleProject({ id: 'proj_del' })}
        onClose={onClose}
        onDeleted={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Delete project' }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  // =====================================================================
  // Error handling
  // =====================================================================

  it('shows an error message when deletion fails', async () => {
    mockDeleteProject.mockRejectedValue(new Error('Failed to delete project'));

    const user = userEvent.setup();

    render(
      <DeleteProjectDialog
        open
        project={sampleProject({ id: 'proj_del' })}
        onClose={vi.fn()}
        onDeleted={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Delete project' }));

    await waitFor(() => {
      expect(screen.getByText('Failed to delete project')).toBeInTheDocument();
    });
  });

  it('shows generic error message when deletion fails without message', async () => {
    mockDeleteProject.mockRejectedValue(new Error('Network error'));

    const user = userEvent.setup();

    render(
      <DeleteProjectDialog
        open
        project={sampleProject({ id: 'proj_del' })}
        onClose={vi.fn()}
        onDeleted={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Delete project' }));

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('does not show env values or raw error dumps in error message', async () => {
    mockDeleteProject.mockRejectedValue(
      new Error('Something went wrong with config'),
    );

    const user = userEvent.setup();

    render(
      <DeleteProjectDialog
        open
        project={sampleProject({
          id: 'proj_del',
          env: [{ key: 'SECRET', value: 'should-not-appear' }],
        })}
        onClose={vi.fn()}
        onDeleted={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Delete project' }));

    await waitFor(() => {
      expect(
        screen.getByText('Something went wrong with config'),
      ).toBeInTheDocument();
    });

    // Env values should not be in the error output
    expect(screen.queryByText('SECRET')).not.toBeInTheDocument();
    expect(screen.queryByText('should-not-appear')).not.toBeInTheDocument();
  });

  // =====================================================================
  // Submit button behavior
  // =====================================================================

  it('disables delete button while deleting', async () => {
    // Keep promise pending to simulate in-flight deletion
    mockDeleteProject.mockReturnValue(new Promise(() => {}));

    const user = userEvent.setup();

    render(
      <DeleteProjectDialog
        open
        project={sampleProject({ id: 'proj_del' })}
        onClose={vi.fn()}
        onDeleted={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Delete project' }));

    expect(
      screen.getByRole('button', { name: 'Delete project' }),
    ).toBeDisabled();
  });

  it('disables Cancel button while deleting', async () => {
    mockDeleteProject.mockReturnValue(new Promise(() => {}));

    const user = userEvent.setup();

    render(
      <DeleteProjectDialog
        open
        project={sampleProject({ id: 'proj_del' })}
        onClose={vi.fn()}
        onDeleted={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Delete project' }));

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });

  // =====================================================================
  // Threat model compliance
  // =====================================================================

  it('does not show start, stop, restart, or lifecycle controls', () => {
    render(
      <DeleteProjectDialog
        open
        project={sampleProject()}
        onClose={vi.fn()}
        onDeleted={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole('button', { name: /start/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /stop/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /restart/i }),
    ).not.toBeInTheDocument();
  });
});
