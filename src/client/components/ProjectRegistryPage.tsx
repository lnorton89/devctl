/**
 * Project registry page — first screen of the devctl UI.
 *
 * Orchestrates project registry state: loading, load-error, empty,
 * and project display. Manages create/edit form drawer and delete
 * confirmation dialog state with Plan 06 components.
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
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

import type { ProjectConfig } from '../../shared/projectSchema.js';
import { listProjects } from '../api/projectsApi.js';
import ProjectTable from './ProjectTable';
import ProjectMobileList from './ProjectMobileList';
import ProjectFormDrawer from './ProjectFormDrawer';
import DeleteProjectDialog from './DeleteProjectDialog';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProjectRegistryPageProps {
  /**
   * Callback when the user clicks "Add project".
   */
  onAddProject?: () => void;

  /**
   * Callback when the user clicks a row's edit action.
   */
  onEditProject?: (project: ProjectConfig) => void;

  /**
   * Callback when the user clicks a row's delete action.
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

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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

  // ----- Form drawer state (create/edit) -----

  const [formProject, setFormProject] = useState<ProjectConfig | null | undefined>(undefined);

  const handleAddProject = () => {
    props.onAddProject?.();
    setFormProject(null); // null = create mode
  };

  const handleEditProject = (project: ProjectConfig) => {
    props.onEditProject?.(project);
    setFormProject(project);
  };

  const handleFormClose = () => {
    setFormProject(undefined);
  };

  const handleFormSaved = () => {
    setFormProject(undefined);
    loadProjects();
  };

  // ----- Delete dialog state (wired in Task 2) -----

  const [deleteProject, setDeleteProject] = useState<ProjectConfig | undefined>(undefined);

  const handleDeleteProject = (project: ProjectConfig) => {
    props.onDeleteProject?.(project);
    setDeleteProject(project);
  };

  const handleDeleteClose = () => {
    setDeleteProject(undefined);
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

      {/* Project display — desktop table or mobile list */}
      {!loading && !error && projects.length > 0 && (
        isMobile ? (
          <ProjectMobileList
            projects={projects}
            onEditProject={handleEditProject}
            onDeleteProject={handleDeleteProject}
          />
        ) : (
          <ProjectTable
            projects={projects}
            onEditProject={handleEditProject}
            onDeleteProject={handleDeleteProject}
          />
        )
      )}

      {/* Create/edit form drawer */}
      {formProject !== undefined && (
        <ProjectFormDrawer
          open
          project={formProject}
          onClose={handleFormClose}
          onSaved={handleFormSaved}
        />
      )}

      {/* Delete confirmation dialog */}
      {deleteProject && (
        <DeleteProjectDialog
          open
          project={deleteProject}
          onClose={handleDeleteClose}
          onDeleted={() => {
            setDeleteProject(undefined);
            loadProjects();
          }}
        />
      )}
    </Box>
  );
}
