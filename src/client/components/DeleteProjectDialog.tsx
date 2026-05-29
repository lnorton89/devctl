/**
 * Delete confirmation dialog for project registry.
 *
 * Displays a destructive confirmation dialog with exact UI-SPEC copy,
 * calls the delete API on confirmation, and provides accessible close
 * and cancel behavior.
 *
 * Threat model:
 * - T-01-06-04: Requires explicit destructive confirmation before
 *   deleting a registry entry.
 * - T-01-06-05 (accept): v1 is trusted single-user local software.
 *
 * Phase boundaries:
 * - Does not delete files from disk (confirmed by dialog copy).
 * - No lifecycle controls present (start, stop, restart).
 *
 * @module DeleteProjectDialog
 */

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Alert,
} from '@mui/material';

import type { ProjectConfig } from '../../shared/projectSchema.js';
import { deleteProject } from '../api/projectsApi.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DeleteProjectDialogProps {
  /** Whether the dialog is open. */
  open: boolean;
  /** The project to delete. */
  project: ProjectConfig;
  /** Called when the dialog should close (cancel, close, or after delete). */
  onClose: () => void;
  /** Called after a successful deletion (parent should refresh state). */
  onDeleted: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DeleteProjectDialog({
  open,
  project,
  onClose,
  onDeleted,
}: DeleteProjectDialogProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    setError(null);

    try {
      await deleteProject(project.id);
      onDeleted();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to delete project.');
      }
      setDeleting(false);
    }
  }, [project.id, onDeleted, onClose]);

  return (
    <Dialog
      open={open}
      onClose={deleting ? undefined : onClose}
      aria-labelledby="delete-dialog-title"
      aria-describedby="delete-dialog-description"
    >
      <DialogTitle id="delete-dialog-title">Delete project</DialogTitle>

      <DialogContent>
        {/* Error alert */}
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {/* Confirmation copy (exact UI-SPEC wording) */}
        <DialogContentText id="delete-dialog-description">
          Delete {project.name}? This removes the project from devctl but
          does not delete files from disk.
        </DialogContentText>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={deleting}>
          Cancel
        </Button>
        <Button
          onClick={handleDelete}
          color="error"
          variant="contained"
          disabled={deleting}
        >
          Delete project
        </Button>
      </DialogActions>
    </Dialog>
  );
}
