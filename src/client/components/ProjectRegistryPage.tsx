/**
 * Project registry page — first screen of the devctl UI.
 *
 * Phase 2: Manages lifecycle state (process statuses, loading actions,
 * polling) and log viewer dialog state.
 *
 * @module ProjectRegistryPage
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Snackbar,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

import type { ProjectConfig } from '../../shared/projectSchema.js';
import type { ProcessState, ProcessStatus, HealthStatus } from '../../shared/lifecycleSchema.js';
import {
  listProjects,
  updateProject,
  startProject,
  stopProject,
  restartProject,
  getProjectStatus,
  checkProjectHealth,
} from '../api/projectsApi.js';
import ProjectTable from './ProjectTable';
import ProjectMobileList from './ProjectMobileList';
import ProjectFormDrawer from './ProjectFormDrawer';
import DeleteProjectDialog from './DeleteProjectDialog';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LOAD_ERROR_MESSAGE =
  'Project registry could not be loaded. Check the configuration file and refresh.';

const POLL_INTERVAL_MS = 1000;
const MAX_POLL_ERRORS = 3;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ProjectRegistryPage() {
  const [projects, setProjects] = useState<ProjectConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Lifecycle state
  const [processStatuses, setProcessStatuses] = useState<Map<string, ProcessState>>(new Map());
  const [loadingActions, setLoadingActions] = useState<Set<string>>(new Set());
  const [lifecycleError, setLifecycleError] = useState<string | null>(null);

  // Phase 3 — health check state
  const [healthStatuses, setHealthStatuses] = useState<Map<string, HealthStatus>>(new Map());

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Polling refs
  const pollingRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());
  const pollErrorCountRef = useRef<Map<string, number>>(new Map());

  // ----- Data fetching -----

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listProjects();
      setProjects(result);
      // Fetch status for all projects on load to keep processStatuses in sync
      const statuses = new Map<string, ProcessState>();
      await Promise.allSettled(
        result.map(async (p) => {
          try {
            const s = await getProjectStatus(p.id);
            statuses.set(p.id, s.state);
          } catch {
            // skip — leave unset
          }
        }),
      );
      if (statuses.size > 0) {
        setProcessStatuses((prev) => {
          const next = new Map(prev);
          for (const [id, state] of statuses) {
            next.set(id, state);
          }
          return next;
        });
      }
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

  // ----- Cleanup polling on unmount -----

  useEffect(() => {
    const ref = pollingRef.current;
    return () => {
      for (const timer of ref.values()) {
        clearInterval(timer);
      }
      ref.clear();
    };
  }, []);

  // ----- Polling helper -----

  const stopPolling = useCallback((projectId: string) => {
    const timer = pollingRef.current.get(projectId);
    if (timer) {
      clearInterval(timer);
      pollingRef.current.delete(projectId);
      pollErrorCountRef.current.delete(projectId);
    }
  }, []);

  const startPolling = useCallback((projectId: string) => {
    stopPolling(projectId);

    const timer = setInterval(async () => {
      try {
        const status: ProcessStatus = await getProjectStatus(projectId);
        pollErrorCountRef.current.set(projectId, 0);

        setProcessStatuses((prev) => {
          const next = new Map(prev);
          next.set(projectId, status.state);
          return next;
        });

        // Phase 3 — health check for running/unhealthy projects
        if (status.state === 'running' || status.state === 'unhealthy') {
          try {
            const health = await checkProjectHealth(projectId);
            setHealthStatuses((prev) => {
              const next = new Map(prev);
              next.set(projectId, health);
              return next;
            });
          } catch {
            // health check failures are non-fatal — we'll retry on next poll
          }
        }

        // Stop polling on terminal states
        if (
          status.state === 'stopped' ||
          status.state === 'running' ||
          status.state === 'failed' ||
          status.state === 'errored'
        ) {
          stopPolling(projectId);
          setHealthStatuses((prev) => {
            const next = new Map(prev);
            next.delete(projectId);
            return next;
          });
          setLoadingActions((prev) => {
            const next = new Set(prev);
            next.delete(projectId);
            return next;
          });
        }
      } catch {
        const errorCount = (pollErrorCountRef.current.get(projectId) ?? 0) + 1;
        pollErrorCountRef.current.set(projectId, errorCount);
        if (errorCount >= MAX_POLL_ERRORS) {
          stopPolling(projectId);
          setHealthStatuses((prev) => {
            const next = new Map(prev);
            next.delete(projectId);
            return next;
          });
          setLoadingActions((prev) => {
            const next = new Set(prev);
            next.delete(projectId);
            return next;
          });
          setLifecycleError(
            `Could not reach devctl for project status updates.`,
          );
        }
      }
    }, POLL_INTERVAL_MS);

    pollingRef.current.set(projectId, timer);
  }, [stopPolling]);

  // ----- Lifecycle handlers -----

  const handleStartProject = useCallback(async (project: ProjectConfig) => {
    setLifecycleError(null);
    setHealthStatuses((prev) => {
      const next = new Map(prev);
      next.delete(project.id);
      return next;
    });
    setLoadingActions((prev) => {
      const next = new Set(prev);
      next.add(project.id);
      return next;
    });

    try {
      const status = await startProject(project.id);
      setProcessStatuses((prev) => {
        const next = new Map(prev);
        next.set(project.id, status.state);
        return next;
      });
      startPolling(project.id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setLifecycleError(`Could not start ${project.name}. ${message}`);
      setLoadingActions((prev) => {
        const next = new Set(prev);
        next.delete(project.id);
        return next;
      });
    }
  }, [startPolling]);

  const handleStopProject = useCallback(async (project: ProjectConfig) => {
    setLifecycleError(null);
    setHealthStatuses((prev) => {
      const next = new Map(prev);
      next.delete(project.id);
      return next;
    });
    setLoadingActions((prev) => {
      const next = new Set(prev);
      next.add(project.id);
      return next;
    });

    try {
      const status = await stopProject(project.id);
      setProcessStatuses((prev) => {
        const next = new Map(prev);
        next.set(project.id, status.state);
        return next;
      });
      startPolling(project.id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setLifecycleError(`Could not stop ${project.name}. ${message}`);
      setLoadingActions((prev) => {
        const next = new Set(prev);
        next.delete(project.id);
        return next;
      });
    }
  }, [startPolling]);

  const handleRestartProject = useCallback(async (project: ProjectConfig) => {
    setLifecycleError(null);
    setHealthStatuses((prev) => {
      const next = new Map(prev);
      next.delete(project.id);
      return next;
    });
    setLoadingActions((prev) => {
      const next = new Set(prev);
      next.add(project.id);
      return next;
    });

    try {
      const status = await restartProject(project.id);
      setProcessStatuses((prev) => {
        const next = new Map(prev);
        next.set(project.id, status.state);
        return next;
      });
      startPolling(project.id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setLifecycleError(`Could not restart ${project.name}. ${message}`);
      setLoadingActions((prev) => {
        const next = new Set(prev);
        next.delete(project.id);
        return next;
      });
    }
  }, [startPolling]);

  // ----- Autostart toggle -----

  const handleToggleAutostart = useCallback(
    async (project: ProjectConfig, autostart: boolean) => {
      // 1. Optimistic update: immediately update local projects array
      setProjects((prev) =>
        prev.map((p) =>
          p.id === project.id ? { ...p, autostart } : p,
        ),
      );

      // 2. Clear previous lifecycle error
      setLifecycleError(null);

      // 3. Call API
      try {
        const updated = await updateProject(project.id, {
          ...project,
          autostart,
        });
        // Use server response to confirm state
        setProjects((prev) =>
          prev.map((p) =>
            p.id === updated.id ? updated : p,
          ),
        );
      } catch (err: unknown) {
        // 4. Rollback optimistic update on failure
        setProjects((prev) =>
          prev.map((p) =>
            p.id === project.id ? { ...p, autostart: !autostart } : p,
          ),
        );
        const message =
          err instanceof Error ? err.message : 'Unknown error';
        setLifecycleError(
          `Could not update autostart for ${project.name}. ${message}`,
        );
      }
    },
    [],
  );

  // ----- Form drawer state -----

  const [formProject, setFormProject] = useState<ProjectConfig | null | undefined>(undefined);

  const handleAddProject = () => {
    setFormProject(null);
  };

  const handleEditProject = (project: ProjectConfig) => {
    setFormProject(project);
  };

  const handleFormClose = () => {
    setFormProject(undefined);
  };

  const handleFormSaved = () => {
    setFormProject(undefined);
    loadProjects();
  };

  // ----- Delete dialog state -----

  const [deleteProject, setDeleteProject] = useState<ProjectConfig | undefined>(undefined);

  const handleDeleteProject = (project: ProjectConfig) => {
    setDeleteProject(project);
  };

  const handleDeleteClose = () => {
    setDeleteProject(undefined);
  };

  // ----- Log viewer state -----

  const [expandedLogProjectId, setExpandedLogProjectId] = useState<string | null>(null);

  const handleOpenLogs = (project: ProjectConfig) => {
    setExpandedLogProjectId((current) =>
      current === project.id ? null : project.id,
    );
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

      {/* Save error */}
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

      {/* Empty state */}
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

      {/* Project display */}
      {!loading && !error && projects.length > 0 && (
        isMobile ? (
          <ProjectMobileList
            projects={projects}
            onEditProject={handleEditProject}
            onDeleteProject={handleDeleteProject}
            processStatuses={processStatuses}
            loadingActions={loadingActions}
            onStartProject={handleStartProject}
            onStopProject={handleStopProject}
            onRestartProject={handleRestartProject}
            onOpenLogs={handleOpenLogs}
            expandedLogProjectId={expandedLogProjectId}
            healthStatuses={healthStatuses}
            onToggleAutostart={handleToggleAutostart}
          />
        ) : (
          <ProjectTable
            projects={projects}
            onEditProject={handleEditProject}
            onDeleteProject={handleDeleteProject}
            processStatuses={processStatuses}
            loadingActions={loadingActions}
            onStartProject={handleStartProject}
            onStopProject={handleStopProject}
            onRestartProject={handleRestartProject}
            onOpenLogs={handleOpenLogs}
            expandedLogProjectId={expandedLogProjectId}
            healthStatuses={healthStatuses}
            onToggleAutostart={handleToggleAutostart}
          />
        )
      )}

      {/* Lifecycle error snackbar */}
      <Snackbar
        open={Boolean(lifecycleError)}
        autoHideDuration={6000}
        onClose={() => setLifecycleError(null)}
        message={lifecycleError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />

      {/* Create/edit form drawer */}
      {formProject !== undefined && (
        <ProjectFormDrawer
          open
          project={formProject}
          processRunning={formProject ? processStatuses.get(formProject.id) === 'running' : false}
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
