/**
 * Dense Material UI desktop table for the project registry.
 *
 * Phase 2: Replaces old columns (Container path, Port, Health URL, Autostart)
 * with Status column and lifecycle action buttons per D-04 / UI-SPEC.
 *
 * @module ProjectTable
 */

import { Fragment } from 'react';
import {
  Box,
  Collapse,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  IconButton,
  Chip,
  CircularProgress,
  Link,
  Typography,
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

export interface ProjectTableProps {
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
  /** Phase 4 — autostart toggle handler. */
  onToggleAutostart?: (project: ProjectConfig, autostart: boolean) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_STRING_LENGTH = 60;

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
// Sub-components
// ---------------------------------------------------------------------------

function StatusChip({ state }: { state: ProcessState }) {
  const isTransition = state === 'starting' || state === 'stopping' || state === 'unhealthy';
  return (
    <Chip
      label={STATUS_LABELS[state]}
      size="small"
      color={STATUS_COLORS[state]}
      variant={STATUS_VARIANTS[state]}
      aria-label={`Status: ${STATUS_LABELS[state]}`}
      sx={
        isTransition
          ? { animation: 'pulse 1.5s ease-in-out infinite', ...pulseKeyframes }
          : undefined
      }
    />
  );
}

function MonospaceCell({
  value,
  maxWidth,
}: {
  value: string;
  maxWidth?: number;
}) {
  const truncated =
    value.length > MAX_STRING_LENGTH
      ? value.slice(0, MAX_STRING_LENGTH - 3) + '...'
      : value;

  const content = (
    <Typography
      component="span"
      sx={{
        fontFamily: MONO_STACK,
        fontSize: 13,
        maxWidth: maxWidth ?? 220,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        display: 'block',
      }}
    >
      {truncated}
    </Typography>
  );

  return <Tooltip title={value}>{content}</Tooltip>;
}

// ---------------------------------------------------------------------------
// Lifecycle button visibility matrix
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ProjectTable({
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
  onToggleAutostart,
}: ProjectTableProps) {
  if (projects.length === 0) {
    return null;
  }

  const hasPortConfig = projects.some((p) => p.port != null);

  return (
    <TableContainer>
      <Table size="small" sx={{ minWidth: 750 }}>
        <TableHead>
          <TableRow>
            <TableCell>Project</TableCell>
            <TableCell>Host path</TableCell>
            <TableCell>Command</TableCell>
            {hasPortConfig && <TableCell sx={{ width: 80 }}>Port</TableCell>}
            <TableCell sx={{ width: 60 }}>Auto</TableCell>
            <TableCell sx={{ width: 160 }}>Status</TableCell>
            <TableCell sx={{ width: 180 }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {projects.map((project) => {
            const state = processStatuses?.get(project.id);
            const isLoading = loadingActions?.has(project.id);
            const showStart = canStart(state) && !isLoading;
            const showStop = canStop(state) && !isLoading;
            const showRestart = canRestart(state) && !isLoading;
            const showEdit = true;
            const logsExpanded = expandedLogProjectId === project.id;

            return (
              <Fragment key={project.id}>
                <TableRow
                  hover
                  sx={{ '& > *': { borderBottom: logsExpanded ? 0 : undefined } }}
                >
                  <TableCell>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {project.name}
                    </Typography>
                    {project.appUrl && (
                      <Link
                        href={project.appUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          fontFamily: MONO_STACK,
                          fontSize: 12,
                          display: 'inline-block',
                          maxWidth: 220,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        underline="hover"
                      >
                        {project.appUrl}
                      </Link>
                    )}
                  </TableCell>

                  <TableCell>
                    <MonospaceCell value={project.hostPath} />
                  </TableCell>

                  <TableCell>
                    <MonospaceCell value={project.startCommand} maxWidth={180} />
                  </TableCell>

                  {hasPortConfig && (
                    <TableCell>
                      {project.port ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <Box
                            component="span"
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: healthStatuses?.get(project.id)?.port?.occupied
                                ? 'success.main'
                                : healthStatuses?.get(project.id)?.port
                                  ? 'error.main'
                                  : 'grey.400',
                              display: 'inline-block',
                            }}
                          />
                          <Typography
                            component="span"
                            sx={{ fontFamily: MONO_STACK, fontSize: 13 }}
                          >
                            {project.port}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography component="span" color="text.secondary" sx={{ fontSize: 14 }}>
                          &mdash;
                        </Typography>
                      )}
                    </TableCell>
                  )}

                  <TableCell>
                    <Switch
                      size="small"
                      color="primary"
                      checked={project.autostart}
                      onChange={(e) => {
                        e.stopPropagation();
                        onToggleAutostart?.(project, e.target.checked);
                      }}
                      slotProps={{ input: { 'aria-label': `Autostart ${project.name}` } }}
                    />
                  </TableCell>

                  <TableCell>
                    {state ? (
                      <StatusChip state={state} />
                    ) : (
                      <Typography component="span" color="text.secondary" sx={{ fontSize: 14 }}>
                        &mdash;
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                      {isLoading ? (
                        <CircularProgress size={20} sx={{ mx: 0.5 }} />
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
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={hasPortConfig ? 7 : 6} sx={{ py: 0, borderBottom: logsExpanded ? undefined : 0 }}>
                    <Collapse in={logsExpanded} timeout="auto" unmountOnExit>
                      <Box sx={{ py: 2 }}>
                        <LiveProjectLogs project={project} />
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
