/**
 * Per-project log viewer dialog.
 *
 * Displays run history and current run output from the process manager.
 * Opens as a Material UI Dialog with full-width desktop and full-screen mobile behavior.
 *
 * @module LogViewerDialog
 */

import { useEffect, useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  Button,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import type { ProjectConfig } from '../../shared/projectSchema.js';
import type { LogData, RunRecord } from '../../shared/lifecycleSchema.js';
import { getProjectLogs } from '../api/projectsApi.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LogViewerDialogProps {
  open: boolean;
  project: ProjectConfig;
  onClose: () => void;
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

const LOG_REFRESH_INTERVAL_MS = 1000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(startTime: string, endTime?: string): string {
  const start = new Date(startTime).getTime();
  const end = endTime ? new Date(endTime).getTime() : Date.now();
  const diffMs = Math.max(0, end - start);
  const totalSeconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

function formatRunOutcome(run: RunRecord): string {
  if (run.error) {
    return `Error: ${run.error}`;
  }
  if (run.crashed) {
    return 'Crashed';
  }
  if (run.exitCode != null) {
    return `Exit code: ${run.exitCode}`;
  }
  if (run.signalCode) {
    return `Signal: ${run.signalCode}`;
  }
  return 'Running';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LogViewerDialog({
  open,
  project,
  onClose,
}: LogViewerDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [logData, setLogData] = useState<LogData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await getProjectLogs(project.id);
      setLogData(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Could not load logs.';
      setError(message);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [project.id]);

  useEffect(() => {
    if (open) {
      loadLogs();
      const refreshTimer = setInterval(() => {
        void loadLogs(false);
      }, LOG_REFRESH_INTERVAL_MS);

      return () => {
        clearInterval(refreshTimer);
      };
    }

    setLogData(null);
    setError(null);
    return undefined;
  }, [open, loadLogs]);

  const hasHistory = logData && logData.history && logData.history.length > 0;
  const hasCurrentRun = logData?.currentRun != null;
  const hasOutput =
    hasCurrentRun &&
    ((logData!.currentRun!.stdout && logData!.currentRun!.stdout.length > 0) ||
      (logData!.currentRun!.stderr && logData!.currentRun!.stderr.length > 0));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      fullScreen={fullScreen}
      aria-label={`${project.name} - Logs`}
    >
      {/* Title */}
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" component="div" sx={{ fontSize: 16, fontWeight: 600 }}>
          {project.name} - Logs
        </Typography>
        <IconButton aria-label="Close log viewer" onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {!loading && error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && !logData && (
          <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            No logs recorded for this project yet.
          </Typography>
        )}

        {!loading && !error && logData && (
          <>
            {/* Run history */}
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Run history
            </Typography>

            {hasHistory ? (
              <List dense disablePadding sx={{ mb: 3 }}>
                {logData.history.map((run: RunRecord) => (
                  <ListItem key={run.runId} disableGutters sx={{ px: 0 }}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {run.scriptName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: MONO_STACK }}>
                            Started {run.startTime}
                          </Typography>
                          {run.endTime && (
                            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: MONO_STACK }}>
                              Ended {run.endTime}
                            </Typography>
                          )}
                          <Typography variant="caption" color="text.secondary">
                            {formatDuration(run.startTime, run.endTime)}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              fontFamily: MONO_STACK,
                              color:
                                run.exitCode === 0 && !run.error && !run.crashed
                                  ? 'success.main'
                                  : run.exitCode == null && !run.error && !run.crashed
                                    ? 'text.secondary'
                                    : 'error.main',
                            }}
                          >
                            {formatRunOutcome(run)}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                No previous runs.
              </Typography>
            )}

            {/* Output */}
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Output
            </Typography>

            {hasOutput ? (
              <Box
                sx={{
                  bgcolor: '#1e1e2e',
                  color: '#cdd6f4',
                  fontFamily: MONO_STACK,
                  fontSize: 12,
                  lineHeight: 1.6,
                  p: 2,
                  borderRadius: 1,
                  maxHeight: 400,
                  overflow: 'auto',
                }}
                role="log"
                aria-live="polite"
              >
                {logData.currentRun!.stdout.map((line: string, i: number) => (
                  <Box key={`out-${i}`} sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                    {line}
                  </Box>
                ))}
                {logData.currentRun!.stderr.map((line: string, i: number) => (
                  <Box
                    key={`err-${i}`}
                    sx={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                      color: '#f38ba8',
                    }}
                  >
                    [ERR] {line}
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No output yet.
              </Typography>
            )}

            {/* Empty log */}
            {!hasHistory && !hasOutput && !logData.currentRun && (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                No logs recorded for this project yet.
              </Typography>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
