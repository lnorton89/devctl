/**
 * Project registry page — first screen of the devctl UI.
 *
 * Orchestrates project registry state: loading, load-error, empty,
 * and project display. Wires Add/Edit/Delete action hooks that
 * Plan 06 will complete with drawer/dialog surfaces.
 *
 * Threat model T-01-05-03: No lifecycle execution controls rendered.
 * Threat model T-01-05-01: No environment variable values exposed in
 * the registry table/list (values only appear in the edit form surface).
 *
 * @module ProjectRegistryPage
 */

import { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

import type { ProjectConfig } from '../../shared/projectSchema.js';
import { listProjects } from '../api/projectsApi.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProjectRegistryPageProps {
  /**
   * Callback when the user clicks "Add project".
   * Plan 06 will wire this to the create form drawer.
   */
  onAddProject?: () => void;

  /**
   * Callback when the user clicks a row's edit action.
   * Plan 06 will wire this to the edit form drawer.
   */
  onEditProject?: (project: ProjectConfig) => void;

  /**
   * Callback when the user clicks a row's delete action.
   * Plan 06 will wire this to the delete confirmation dialog.
   */
  onDeleteProject?: (project: ProjectConfig) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LOAD_ERROR_MESSAGE =
  'Project registry could not be loaded. Check the configuration file and refresh.';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ProjectRegistryPage(props: ProjectRegistryPageProps) {
  const [projects, setProjects] = useState<ProjectConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ----- Data fetching -----

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listProjects();
      setProjects(result);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : LOAD_ERROR_MESSAGE;
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // ----- Action handlers (Plan 06 will wire real implementations) -----

  const handleAddProject = () => {
    props.onAddProject?.();
  };

  // ----- Render -----

  return (
    <Box sx={{ p: '32px 24px', maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3,
        }}
      >
        <Typography variant="h5" component="h1">
          Projects
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddProject}
          aria-label="Add project"
        >
          Add project
        </Button>
      </Box>

      {/* Save error snackbar/alert — ready for Plan 06 mutation surfaces */}
      {saveError && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() => setSaveError(null)}
        >
          {saveError}
        </Alert>
      )}

      {/* Loading state */}
      {loading && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            py: 6,
          }}
        >
          <CircularProgress aria-label="Loading projects" />
        </Box>
      )}

      {/* Load error state */}
      {!loading && error && (
        <Box sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button variant="outlined" onClick={loadProjects}>
            Retry
          </Button>
        </Box>
      )}

      {/* Empty state — shown when loaded with zero projects */}
      {!loading && !error && projects.length === 0 && (
        <Box sx={{ py: 6 }}>
          <Typography variant="body1" color="text.secondary">
            No projects registered
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1 }}
          >
            Add a local app so devctl can manage its configuration.
          </Typography>
        </Box>
      )}

      {/* Project list — will be replaced with ProjectTable /
          ProjectMobileList in Task 2 / Plan 01-05 */}
      {!loading && !error && projects.length > 0 && (
        <Box>
          {projects.map((project) => (
            <Box
              key={project.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 1,
                px: 2,
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography variant="body1">{project.name}</Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
