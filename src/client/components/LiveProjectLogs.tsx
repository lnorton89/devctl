/**
 * Inline live log panel for an expanded project row.
 *
 * Polls the lifecycle log endpoint while mounted and renders recent run
 * history plus current stdout/stderr output.
 *
 * @module LiveProjectLogs
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

import type { ProjectConfig } from '../../shared/projectSchema.js';
import type { LogData, RunRecord } from '../../shared/lifecycleSchema.js';
import { getProjectLogs } from '../api/projectsApi.js';

const MONO_STACK = [
  '"Spline Sans Mono"',
  'ui-monospace',
  '"Cascadia Code"',
  '"Fira Code"',
  '"Consolas"',
  'monospace',
].join(',');

const LOG_REFRESH_INTERVAL_MS = 1000;

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

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export interface LiveProjectLogsProps {
  project: ProjectConfig;
}

export default function LiveProjectLogs({ project }: LiveProjectLogsProps) {
  const [logData, setLogData] = useState<LogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollCountRef = useRef(0);
  const logContainerRef = useRef<HTMLDivElement | null>(null);

  const loadLogs = useCallback(async (isInitial = false) => {
    if (isInitial) {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await getProjectLogs(project.id);
      setLogData(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not load logs.');
    } finally {
      setLoading(false);
    }
  }, [project.id]);

  useEffect(() => {
    pollCountRef.current = 0;
    void loadLogs(true);
    const timer = setInterval(() => {
      pollCountRef.current += 1;
      void loadLogs(false);
    }, LOG_REFRESH_INTERVAL_MS);

    return () => {
      clearInterval(timer);
    };
  }, [loadLogs]);

  const currentRun = logData?.currentRun;
  const stdout = currentRun?.stdout ?? [];
  const stderr = currentRun?.stderr ?? [];
  const hasOutput = stdout.length > 0 || stderr.length > 0;

  const outputLineCount = stdout.length + stderr.length;

  useEffect(() => {
    const el = logContainerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [outputLineCount]);

  return (
    <Box
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        bgcolor: 'background.paper',
        p: 2,
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        sx={{
          mb: 1.5,
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
        }}
      >
        <Box>
          <Typography variant="subtitle2">Live logs</Typography>
          <Typography variant="caption" color="text.secondary">
            {currentRun ? `${currentRun.scriptName} is running` : 'No active run'}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<RefreshIcon />}
          onClick={() => void loadLogs(false)}
        >
          Refresh
        </Button>
      </Stack>

      {loading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 2 }}>
          <CircularProgress size={18} />
          <Typography variant="body2" color="text.secondary">
            Loading logs...
          </Typography>
        </Box>
      )}

      {!loading && error && (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && (
        <Box
          ref={logContainerRef}
          sx={{
            bgcolor: '#06080A',
            color: '#EBF2F5',
            fontFamily: MONO_STACK,
            fontSize: 12,
            lineHeight: 1.6,
            p: 1.5,
            borderRadius: 1,
            border: 1,
            borderColor: 'divider',
            minHeight: 120,
            maxHeight: 320,
            overflow: 'auto',
          }}
          role="log"
          aria-live="polite"
          aria-label={`${project.name} live logs`}
        >
          {hasOutput ? (
            <>
              {stdout.map((line, index) => (
                <Box key={`out-${index}`} sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {line}
                </Box>
              ))}
              {stderr.map((line, index) => (
                <Box
                  key={`err-${index}`}
                  sx={{
                    color: 'error.light',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                  }}
                >
                  [ERR] {line}
                </Box>
              ))}
            </>
          ) : (
            <Typography component="span" variant="caption" color="text.secondary">
              No output yet.
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}
