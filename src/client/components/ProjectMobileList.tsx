/**
 * Compact responsive registry list for narrow viewports.
 *
 * Phase 2: Adds Status chip and lifecycle action buttons.
 * Shows only Phase 2-relevant metadata (Host path, Command) per D-04.
 *
 * @module ProjectMobileList
 */

import {
  Box,
  Typography,
  IconButton,
  Chip,
  CircularProgress,
  Tooltip,
  Collapse,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import ReplayIcon from '@mui/icons-material/Replay';
import TerminalIcon from '@mui/icons-material/Terminal';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';


import type { ProjectConfig } from '../../shared/projectSchema.js';
import type { ProcessState, HealthStatus } from '../../shared/lifecycleSchema.js';
import LiveProjectLogs from './LiveProjectLogs';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProjectMobileListProps {
  projects: ProjectConfig[];
  onEditProject: (project: ProjectConfig) => void;
  onDeleteProject: (project: ProjectConfig) => void;
  processStatuses?: Map<string, ProcessState>;
  loadingActions?: Set<string>;
  onStartProject?: (project: ProjectConfig) => void;
  onStopProject?: (project: ProjectConfig) => void;
  onRestartProject?: (project: ProjectConfig) => void;
  onOpenLogs?: (project: ProjectConfig) => void;
  expandedLogProjectId?: string | null;
  /** Phase 3 — port/health check results per project. */
  healthStatuses?: Map<string, HealthStatus>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MONO_STACK = [
  '"Spline Sans Mono"',
  'ui-monospace',
  '"Cascadia Code"',
  '"Fira Code"',
  '"Consolas"',
  'monospace',
].join(',');

const STATUS_COLORS: Record<ProcessState, 'default' | 'success' | 'warning' | 'error'> = {
  stopped: 'default',
  starting: 'warning',
  running: 'success',
  unhealthy: 'error',
  stopping: 'warning',
  failed: 'error',
  errored: 'error',
};

const STATUS_VARIANTS: Record<ProcessState, 'filled' | 'outlined'> = {
  stopped: 'outlined',
  starting: 'filled',
  running: 'filled',
  unhealthy: 'filled',
  stopping: 'filled',
  failed: 'filled',
  errored: 'outlined',
};

const STATUS_LABELS: Record<ProcessState, string> = {
  stopped: 'Stopped',
  starting: 'Starting',
  running: 'Running',
  unhealthy: 'Unhealthy',
  stopping: 'Stopping',
  failed: 'Failed',
  errored: 'Error',
};

const pulseKeyframes = {
  '@keyframes pulse': {
    '0%': { opacity: 0.7 },
    '50%': { opacity: 1 },
    '100%': { opacity: 0.7 },
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function canStart(state: ProcessState | undefined): boolean {
  return state === undefined || state === 'stopped' || state === 'failed' || state === 'errored';
}

function canStop(state: ProcessState | undefined): boolean {
  return state === 'running' || state === 'starting' || state === 'unhealthy';
}

function canRestart(state: ProcessState | undefined): boolean {
  return state === 'running' || state === 'failed' || state === 'unhealthy';
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ minWidth: 60, flexShrink: 0, fontWeight: 500 }}
      >
        {label}
      </Typography>
      <Typography
        variant="caption"
        sx={{
          fontFamily: MONO_STACK,
          fontSize: 12,
          wordBreak: 'break-all',
          lineHeight: 1.4,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ProjectMobileList({
  projects,
  onEditProject,
  onDeleteProject,
  processStatuses,
  loadingActions,
  onStartProject,
  onStopProject,
  onRestartProject,
  onOpenLogs,
  expandedLogProjectId,
  healthStatuses,
}: ProjectMobileListProps) {
  if (projects.length === 0) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {projects.map((project) => {
        const state = processStatuses?.get(project.id);
        const isLoading = loadingActions?.has(project.id);
        const showStart = canStart(state) && !isLoading;
        const showStop = canStop(state) && !isLoading;
        const showRestart = canRestart(state) && !isLoading;
        const showEdit = true;
        const logsExpanded = expandedLogProjectId === project.id;

        const stateLabel = state ? STATUS_LABELS[state] : undefined;
        const isTransition = state === 'starting' || state === 'stopping' || state === 'unhealthy';

        return (
          <Box
            key={project.id}
            sx={{
              p: 2,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              bgcolor: 'background.paper',
            }}
          >
            {/* Header row: name + actions */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {project.name}
              </Typography>

              <Box sx={{ display: 'flex', gap: 0.5, ml: 1, flexShrink: 0 }}>
                {isLoading ? (
                  <CircularProgress size={20} />
                ) : (
                  <>
                    {showStart && onStartProject && (
                      <Tooltip title={`Start ${project.name}`}>
                        <IconButton
                          aria-label={`Start ${project.name}`}
                          onClick={() => onStartProject(project)}
                          size="small"
                          color="success"
                        >
                          <PlayArrowIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {showStop && onStopProject && (
                      <Tooltip title={`Stop ${project.name}`}>
                        <IconButton
                          aria-label={`Stop ${project.name}`}
                          onClick={() => onStopProject(project)}
                          size="small"
                          color="warning"
                        >
                          <StopIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {showRestart && onRestartProject && (
                      <Tooltip title={`Restart ${project.name}`}>
                        <IconButton
                          aria-label={`Restart ${project.name}`}
                          onClick={() => onRestartProject(project)}
                          size="small"
                        >
                          <ReplayIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </>
                )}

                {onOpenLogs && (
                  <Tooltip title={`${logsExpanded ? 'Hide' : 'View'} logs for ${project.name}`}>
                    <IconButton
                      aria-label={`${logsExpanded ? 'Hide' : 'View'} logs for ${project.name}`}
                      onClick={() => onOpenLogs(project)}
                      size="small"
                      color={logsExpanded ? 'primary' : 'default'}
                    >
                      {logsExpanded ? (
                        <ExpandLessIcon fontSize="small" />
                      ) : (
                        <TerminalIcon fontSize="small" />
                      )}
                    </IconButton>
                  </Tooltip>
                )}

                {showEdit && (
                  <IconButton
                    aria-label="Edit project"
                    onClick={() => onEditProject(project)}
                    size="small"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                )}

                {showEdit && (
                  <IconButton
                    aria-label="Delete project"
                    onClick={() => onDeleteProject(project)}
                    size="small"
                    color="error"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            </Box>

            {/* Status chip */}
            {state && stateLabel && (
              <Box sx={{ mt: 1 }}>
                <Chip
                  label={stateLabel}
                  size="small"
                  color={STATUS_COLORS[state]}
                  variant={STATUS_VARIANTS[state]}
                  aria-label={`Status: ${stateLabel}`}
                  sx={
                    isTransition
                      ? { animation: 'pulse 1.5s ease-in-out infinite', ...pulseKeyframes }
                      : undefined
                  }
                />
              </Box>
            )}

            {/* Metadata */}
            <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              <MetadataRow label="Host" value={project.hostPath} />
              <MetadataRow label="Command" value={project.startCommand} />
              {project.port && (
                <MetadataRow label="Port" value={String(project.port)} />
              )}
            </Box>

            <Collapse in={logsExpanded} timeout="auto" unmountOnExit>
              <Box sx={{ mt: 1.5 }}>
                <LiveProjectLogs project={project} />
              </Box>
            </Collapse>
          </Box>
        );
      })}
    </Box>
  );
}
