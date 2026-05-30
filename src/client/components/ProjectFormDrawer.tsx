/**
 * Create/edit form drawer with directory picker and script selection.
 *
 * Phase 2: Replaces the old field-by-field form with a directory path
 * input (manual + Browse) and a script dropdown. Old fields are hidden
 * from UI but retained in schema per D-04.
 *
 * @module ProjectFormDrawer
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Drawer,
  Box,
  Typography,
  Button,
  IconButton,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Divider,
  CircularProgress,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Breadcrumbs,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DescriptionIcon from '@mui/icons-material/Description';
import FolderIcon from '@mui/icons-material/Folder';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';

import type { ProjectConfig } from '../../shared/projectSchema.js';
import type {
  LogData,
  RunRecord,
  PackageJsonBrowserEntry,
  PackageJsonBrowserResponse,
} from '../../shared/lifecycleSchema.js';
import { projectInputSchema } from '../../shared/projectSchema.js';
import {
  browsePackageJson,
  createProject,
  updateProject,
  parseScripts,
  getProjectLogs,
} from '../api/projectsApi.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DRAWER_WIDTH = 560;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProjectFormDrawerProps {
  open: boolean;
  project?: ProjectConfig | null;
  processRunning?: boolean;
  onClose: () => void;
  onSaved: () => void;
}

interface FormState {
  name: string;
  directoryPath: string;
  scriptName: string;
}

type ScriptLoadState = 'idle' | 'loading' | 'loaded' | 'empty' | 'error';
type BrowserLoadState = 'idle' | 'loading' | 'loaded' | 'error';

function getDirectoryFromFilePath(filePath: string): string {
  const lastSeparator = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'));
  return lastSeparator > 0 ? filePath.slice(0, lastSeparator) : '';
}

function formatRunOutcome(run: RunRecord): string {
  if (run.error) return `Error: ${run.error}`;
  if (run.crashed) return 'Crashed';
  if (run.exitCode != null) return `Exit code: ${run.exitCode}`;
  if (run.signalCode) return `Signal: ${run.signalCode}`;
  return 'Running';
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ProjectFormDrawer({
  open,
  project,
  processRunning,
  onClose,
  onSaved,
}: ProjectFormDrawerProps) {
  const isEdit = Boolean(project);

  const [form, setForm] = useState<FormState>({
    name: project?.name ?? '',
    directoryPath: project?.hostPath ?? '',
    scriptName: project?.scriptName ?? '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Script parsing state
  const [scripts, setScripts] = useState<Record<string, string>>({});
  const [scriptLoadState, setScriptLoadState] = useState<ScriptLoadState>('idle');
  const [scriptError, setScriptError] = useState<string | null>(null);
  const [browserOpen, setBrowserOpen] = useState(false);
  const [browserState, setBrowserState] = useState<BrowserLoadState>('idle');
  const [browserError, setBrowserError] = useState<string | null>(null);
  const [browserData, setBrowserData] = useState<PackageJsonBrowserResponse | null>(null);

  // Run history state (edit mode only)
  const [logData, setLogData] = useState<LogData | null>(null);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);

  // Track initial values to detect changes
  const initialFormRef = useRef<FormState | null>(null);

  // ----- Reset form when drawer opens -----

  useEffect(() => {
    if (open) {
      const nextForm = {
        name: project?.name ?? '',
        directoryPath: project?.hostPath ?? '',
        scriptName: project?.scriptName ?? '',
      };
      setForm(nextForm);
      initialFormRef.current = nextForm;
      setErrors({});
      setSaveError(null);
      setSaving(false);
      setScripts({});
      setScriptLoadState('idle');
      setScriptError(null);
      setBrowserOpen(false);
      setBrowserState('idle');
      setBrowserError(null);
      setBrowserData(null);

      // Auto-trigger script load in edit mode
      if (project?.hostPath) {
        loadScripts(project.hostPath);
      }

      // Load run history in edit mode
      setLogData(null);
      setLogsLoading(false);
      setLogsError(null);
      if (isEdit && project) {
        void loadLogs(project.id);
      }
    }
  }, [open, project?.id]);

  // ----- Script loading -----

  const loadScripts = useCallback(async (dirPath: string) => {
    if (!dirPath.trim()) {
      setScripts({});
      setScriptLoadState('idle');
      return;
    }

    setScriptLoadState('loading');
    setScriptError(null);

    try {
      const result = await parseScripts(dirPath.trim());
      const scriptEntries = result.scripts;
      const keys = Object.keys(scriptEntries);
      if (keys.length === 0) {
        setScriptLoadState('empty');
        setScripts({});
      } else {
        setScriptLoadState('loaded');
        setScripts(scriptEntries);
      }
    } catch (err: unknown) {
      setScriptLoadState('error');
      setScripts({});
      if (err instanceof Error) {
        setScriptError(err.message);
      } else {
        setScriptError('Could not load scripts. Try again or enter a different path.');
      }
    }
  }, []);

  const loadLogs = useCallback(async (projectId: string) => {
    setLogsLoading(true);
    setLogsError(null);
    try {
      const data = await getProjectLogs(projectId);
      setLogData(data);
    } catch (err: unknown) {
      setLogsError(err instanceof Error ? err.message : 'Could not load logs.');
    } finally {
      setLogsLoading(false);
    }
  }, []);

  // ----- Browse handler -----

  const loadBrowserDirectory = useCallback(async (dirPath?: string) => {
    setBrowserState('loading');
    setBrowserError(null);

    try {
      const result = await browsePackageJson(dirPath);
      setBrowserData(result);
      setBrowserState('loaded');
    } catch (err: unknown) {
      setBrowserState('error');
      if (err instanceof Error) {
        setBrowserError(err.message);
      } else {
        setBrowserError('Could not read this directory.');
      }
    }
  }, []);

  const handleBrowse = useCallback(() => {
    setBrowserOpen(true);
    void loadBrowserDirectory(form.directoryPath || undefined);
  }, [form.directoryPath, loadBrowserDirectory]);

  const handleBrowserEntrySelected = useCallback(
    (entry: PackageJsonBrowserEntry) => {
      if (entry.type === 'directory') {
        void loadBrowserDirectory(entry.path);
        return;
      }

      const selectedDirectory = getDirectoryFromFilePath(entry.path);
      setForm((prev) => ({
        ...prev,
        directoryPath: selectedDirectory,
        scriptName: '',
      }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next.hostPath;
        return next;
      });
      setBrowserOpen(false);
      void loadScripts(selectedDirectory);
    },
    [loadBrowserDirectory, loadScripts],
  );

  // ----- Submit -----

  const handleSubmit = useCallback(async () => {
    setSaving(true);
    setSaveError(null);
    setErrors({});

    if (!form.scriptName) {
      setErrors((prev) => ({ ...prev, scriptName: 'Select a script.' }));
      setSaving(false);
      return;
    }

    if (!form.directoryPath) {
      setErrors((prev) => ({ ...prev, hostPath: 'Select a package.json that exposes its directory path.' }));
      setSaving(false);
      return;
    }

    const payload = {
      name: form.name,
      hostPath: form.directoryPath,
      containerPath: form.directoryPath,
      startCommand: `npm run ${form.scriptName}`,
      scriptName: form.scriptName,
      appUrl: undefined,
      port: undefined,
      healthUrl: undefined,
      envFilePath: undefined,
      env: [],
      autostart: false,
    };

    const result = projectInputSchema.safeParse(payload);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.map(String).join('.');
        if (!fieldErrors[path]) {
          fieldErrors[path] = issue.message;
        }
      }
      setErrors(fieldErrors);
      setSaving(false);
      return;
    }

    try {
      if (isEdit && project) {
        await updateProject(project.id, result.data);
      } else {
        await createProject(result.data);
      }
      onSaved();
    } catch (err: unknown) {
      const apiErr = err as {
        status?: number;
        issues?: Array<{ path: string; message: string }>;
      } | null;
      if (
        apiErr &&
        apiErr.status === 400 &&
        Array.isArray(apiErr.issues) &&
        apiErr.issues.length > 0
      ) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of apiErr.issues) {
          if (!fieldErrors[issue.path]) {
            fieldErrors[issue.path] = issue.message;
          }
        }
        setErrors(fieldErrors);
      }

      if (err instanceof Error) {
        setSaveError(err.message);
      } else {
        setSaveError('Project could not be saved. Check the highlighted fields and try again.');
      }
      setSaving(false);
    }
  }, [form, isEdit, project, onSaved]);

  // ----- Render -----

  const title = isEdit ? 'Edit project' : 'Add project';
  const submitLabel = isEdit ? 'Save changes' : 'Add project';

  const scriptKeys = Object.keys(scripts);
  const selectedScriptValue = form.scriptName && scripts[form.scriptName] ? form.scriptName : '';

  const hasChanges = isEdit && initialFormRef.current
    ? initialFormRef.current.name !== form.name ||
      initialFormRef.current.directoryPath !== form.directoryPath ||
      initialFormRef.current.scriptName !== form.scriptName
    : true;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        backdrop: { invisible: true },
      }}
    >
      <Box
        sx={{
          width: DRAWER_WIDTH,
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
        role="dialog"
        aria-label={title}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography variant="h6" component="h2">
            {title}
          </Typography>
          <IconButton
            aria-label="Close drawer"
            onClick={onClose}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Save error */}
        {saveError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSaveError(null)}>
            {saveError}
          </Alert>
        )}

        {/* Running warning */}
        {isEdit && processRunning && (
          <Alert severity="info" sx={{ mb: 2 }}>
            This project is currently running. Changes will take effect on next start.
          </Alert>
        )}

        {/* Form fields */}
        <Stack spacing={2.5} sx={{ flex: 1, overflowY: 'auto', pt: 0.5, pb: 2 }}>
          {/* Name */}
          <TextField
            label="Name"
            value={form.name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, name: e.target.value }))
            }
            error={Boolean(errors.name)}
            helperText={errors.name ?? ' '}
            required
            fullWidth
            size="small"
          />

          {/* Package selection */}
          <Box>
            <Button
              variant="outlined"
              onClick={handleBrowse}
              startIcon={<DescriptionIcon />}
              fullWidth
              sx={{ justifyContent: 'flex-start' }}
            >
              Select package.json
            </Button>
            <Box
              sx={{
                mt: 1,
                p: 1.25,
                border: '1px solid',
                borderColor: errors.hostPath ? 'error.main' : 'divider',
                borderRadius: 1,
                bgcolor: 'background.default',
              }}
            >
              <Typography variant="caption" color="text.secondary" component="div">
                Project directory
              </Typography>
              <Typography
                data-testid="selected-directory-path"
                sx={{
                  mt: 0.25,
                  fontFamily: '"Spline Sans Mono", ui-monospace, "Cascadia Code", "Fira Code", Consolas, monospace',
                  fontSize: 13,
                  wordBreak: 'break-all',
                  color: form.directoryPath ? 'text.primary' : 'text.secondary',
                }}
              >
                {form.directoryPath || 'No package.json selected'}
              </Typography>
              {errors.hostPath && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                  {errors.hostPath}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Script selection */}
          {scriptLoadState !== 'idle' && (
            <FormControl fullWidth size="small" error={Boolean(errors.scriptName)}>
              <InputLabel id="script-label">Script</InputLabel>
              <Select
                labelId="script-label"
                label="Script"
                value={selectedScriptValue}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, scriptName: e.target.value }))
                }
                disabled={scriptLoadState !== 'loaded' || saving}
              >
                {scriptKeys.map((key) => (
                  <MenuItem key={key} value={key}>
                    {key} - {scripts[key]}
                  </MenuItem>
                ))}
              </Select>
              {errors.scriptName && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                  {errors.scriptName}
                </Typography>
              )}
            </FormControl>
          )}

          {/* Script loading state */}
          {scriptLoadState === 'loading' && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="caption" color="text.secondary">
                Looking for scripts...
              </Typography>
            </Box>
          )}

          {/* Script error state */}
          {scriptLoadState === 'error' && scriptError && (
            <Alert severity="warning" sx={{ py: 0.5 }}>
              <Typography variant="caption">{scriptError}</Typography>
            </Alert>
          )}

          {/* Script empty state */}
          {scriptLoadState === 'empty' && (
            <Typography variant="caption" color="text.secondary">
              No npm scripts found in this project.
            </Typography>
          )}

          {/* Run history (edit mode only) */}
          {isEdit && (
            <>
              <Divider />
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Run history
                </Typography>

                {logsLoading && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
                    <CircularProgress size={16} />
                    <Typography variant="caption" color="text.secondary">
                      Loading history...
                    </Typography>
                  </Box>
                )}

                {!logsLoading && logsError && (
                  <Typography variant="caption" color="error">
                    {logsError}
                  </Typography>
                )}

                {!logsLoading && !logsError && logData && logData.history.length > 0 && (
                  <Stack spacing={0.5}>
                    {logData.history.map((run: RunRecord) => (
                      <Stack
                        key={run.runId}
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={{ xs: 0.25, sm: 1.5 }}
                        sx={{ color: 'text.secondary' }}
                      >
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>
                          {run.scriptName}
                        </Typography>
                        <Typography variant="caption" sx={{ fontFamily: '"Spline Sans Mono", ui-monospace, "Cascadia Code", "Fira Code", Consolas, monospace' }}>
                          {formatTimestamp(run.startTime)}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            fontFamily: '"Spline Sans Mono", ui-monospace, "Cascadia Code", "Fira Code", Consolas, monospace',
                            color: run.exitCode === 0 && !run.error && !run.crashed
                              ? 'success.main'
                              : run.exitCode == null && !run.error && !run.crashed
                                ? 'text.secondary'
                                : 'error.main',
                          }}
                        >
                          {formatRunOutcome(run)}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                )}

                {!logsLoading && !logsError && (!logData || logData.history.length === 0) && (
                  <Typography variant="caption" color="text.secondary">
                    No previous runs.
                  </Typography>
                )}
              </Box>
            </>
          )}

        </Stack>

        {/* Footer actions */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 1,
            pt: 2,
            borderTop: 1,
            borderColor: 'divider',
          }}
        >
          <Button variant="outlined" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={saving || scriptLoadState === 'loading' || (isEdit && !hasChanges)}
          >
            {saving ? 'Saving...' : submitLabel}
          </Button>
        </Box>
      </Box>
      <Dialog
        open={browserOpen}
        onClose={() => setBrowserOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Select package.json</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.5}>
            <Breadcrumbs aria-label="Current directory">
              <Typography
                variant="body2"
                sx={{
                  fontFamily: '"Spline Sans Mono", ui-monospace, "Cascadia Code", "Fira Code", Consolas, monospace',
                  wordBreak: 'break-all',
                }}
              >
                {browserData?.path ?? 'Loading...'}
              </Typography>
            </Breadcrumbs>

            {browserError && (
              <Alert severity="warning">{browserError}</Alert>
            )}

            {browserState === 'loading' && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 2 }}>
                <CircularProgress size={18} />
                <Typography variant="body2" color="text.secondary">
                  Loading directory...
                </Typography>
              </Box>
            )}

            {browserState !== 'loading' && browserData && (
              <List dense disablePadding sx={{ maxHeight: 420, overflowY: 'auto' }}>
                {browserData.parentPath && (
                  <ListItemButton onClick={() => loadBrowserDirectory(browserData.parentPath ?? undefined)}>
                    <ListItemIcon>
                      <ArrowUpwardIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Parent directory" />
                  </ListItemButton>
                )}
                {browserData.entries.map((entry) => (
                  <ListItemButton
                    key={`${entry.type}:${entry.path}`}
                    onClick={() => handleBrowserEntrySelected(entry)}
                  >
                    <ListItemIcon>
                      {entry.type === 'directory' ? (
                        <FolderIcon fontSize="small" />
                      ) : (
                        <DescriptionIcon fontSize="small" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={entry.name}
                      secondary={entry.type === 'packageJson' ? entry.path : undefined}
                    />
                  </ListItemButton>
                ))}
                {browserData.entries.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    No folders or package.json files in this directory.
                  </Typography>
                )}
              </List>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBrowserOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Drawer>
  );
}
