/**
 * Create/edit form drawer for project registry.
 *
 * A Material UI Drawer containing controlled form fields for all
 * project configuration. Used for both create (empty fields) and
 * edit (pre-populated fields) workflows.
 *
 * Validates with shared Zod schema before calling the API.
 * Maps API validation issues back to field-level errors.
 *
 * Threat model:
 * - T-01-06-01: Env values render only in this form surface.
 * - T-01-06-02: Form data validated with shared schema before API mutation.
 * - T-01-06-03: No lifecycle execution controls in this form.
 *
 * @module ProjectFormDrawer
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Drawer,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Stack,
  Switch,
  FormControlLabel,
  Alert,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import RemoveCircleOutlineOutlinedIcon from '@mui/icons-material/RemoveCircleOutlineOutlined';

import type { ProjectConfig, EnvVar } from '../../shared/projectSchema.js';
import { projectInputSchema } from '../../shared/projectSchema.js';
import { createProject, updateProject } from '../api/projectsApi.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HOST_PATH_HELPER = 'Path on this workstation.';
const CONTAINER_PATH_HELPER = 'Mounted path devctl uses inside Docker.';
const DRAWER_WIDTH = 480;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProjectFormDrawerProps {
  /** Whether the drawer is open. */
  open: boolean;
  /**
   * The project to edit, or `null`/`undefined` for create mode.
   * When provided, fields are pre-populated and the submit label
   * changes to "Save changes".
   */
  project?: ProjectConfig | null;
  /** Called when the drawer should close (cancel, close icon). */
  onClose: () => void;
  /** Called after a successful create or update API call. */
  onSaved: () => void;
}

// ---------------------------------------------------------------------------
// Initialization helper
// ---------------------------------------------------------------------------

interface FormState {
  name: string;
  hostPath: string;
  containerPath: string;
  startCommand: string;
  appUrl: string;
  port: string;
  healthUrl: string;
  envFilePath: string;
  env: EnvVar[];
  autostart: boolean;
}

function createInitialState(project?: ProjectConfig | null): FormState {
  return {
    name: project?.name ?? '',
    hostPath: project?.hostPath ?? '',
    containerPath: project?.containerPath ?? '',
    startCommand: project?.startCommand ?? '',
    appUrl: project?.appUrl ?? '',
    port: project?.port?.toString() ?? '',
    healthUrl: project?.healthUrl ?? '',
    envFilePath: project?.envFilePath ?? '',
    env: project?.env ? project.env.map((e) => ({ ...e })) : [],
    autostart: project?.autostart ?? false,
  };
}

// ---------------------------------------------------------------------------
// Build submission payload from form state
// ---------------------------------------------------------------------------

function buildPayload(state: FormState) {
  return {
    name: state.name,
    hostPath: state.hostPath,
    containerPath: state.containerPath,
    startCommand: state.startCommand,
    appUrl: state.appUrl || undefined,
    port: state.port ? Number(state.port) : undefined,
    healthUrl: state.healthUrl || undefined,
    envFilePath: state.envFilePath || undefined,
    env: state.env,
    autostart: state.autostart,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ProjectFormDrawer({
  open,
  project,
  onClose,
  onSaved,
}: ProjectFormDrawerProps) {
  const isEdit = Boolean(project);

  const [form, setForm] = useState<FormState>(() => createInitialState(project));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ----- Reset form when drawer opens -----

  useEffect(() => {
    if (open) {
      setForm(createInitialState(project));
      setErrors({});
      setSaveError(null);
      setSaving(false);
    }
  }, [open, project?.id]);

  // ----- Field change handler -----

  const handleChange = useCallback(
    (field: keyof FormState, value: string | boolean | EnvVar[]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      // Clear the error for the changed field
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    },
    [],
  );

  // ----- Env row handlers -----

  const handleAddEnvRow = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      env: [...prev.env, { key: '', value: '' }],
    }));
  }, []);

  const handleRemoveEnvRow = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      env: prev.env.filter((_, i) => i !== index),
    }));
  }, []);

  const handleEnvChange = useCallback(
    (index: number, field: 'key' | 'value', value: string) => {
      setForm((prev) => {
        const next = prev.env.map((row, i) =>
          i === index ? { ...row, [field]: value } : row,
        );
        return { ...prev, env: next };
      });
      // Clear env-related errors
      setErrors((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((key) => {
          if (key.startsWith('env.')) delete next[key];
        });
        delete next.env;
        return next;
      });
    },
    [],
  );

  // ----- Submit handler -----

  const handleSubmit = useCallback(async () => {
    setSaving(true);
    setSaveError(null);
    setErrors({});

    // Build payload and validate
    const payload = buildPayload(form);
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

    // Call API
    try {
      if (isEdit && project) {
        await updateProject(project.id, result.data);
      } else {
        await createProject(result.data);
      }
      onSaved();
    } catch (err: unknown) {
      // Map API validation issues to field errors
      // Uses structural check (status, issues) instead of instanceof ApiError
      // to work correctly across mocked module boundaries in tests.
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

      // Show save error message (generic safe message without env values)
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
        {/* ----- Header ----- */}
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

        {/* ----- Save error ----- */}
        {saveError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSaveError(null)}>
            {saveError}
          </Alert>
        )}

        {/* ----- Form fields ----- */}
        <Stack spacing={2.5} sx={{ flex: 1, overflowY: 'auto', pb: 2 }}>
          {/* Name */}
          <TextField
            label="Name"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            error={Boolean(errors.name)}
            helperText={errors.name ?? ' '}
            required
            fullWidth
            size="small"
          />

          {/* Host path */}
          <TextField
            label="Host path"
            value={form.hostPath}
            onChange={(e) => handleChange('hostPath', e.target.value)}
            error={Boolean(errors.hostPath)}
            helperText={errors.hostPath ?? HOST_PATH_HELPER}
            required
            fullWidth
            size="small"
          />

          {/* Container path */}
          <TextField
            label="Container path"
            value={form.containerPath}
            onChange={(e) => handleChange('containerPath', e.target.value)}
            error={Boolean(errors.containerPath)}
            helperText={errors.containerPath ?? CONTAINER_PATH_HELPER}
            required
            fullWidth
            size="small"
          />

          {/* Start command */}
          <TextField
            label="Start command"
            value={form.startCommand}
            onChange={(e) => handleChange('startCommand', e.target.value)}
            error={Boolean(errors.startCommand)}
            helperText={errors.startCommand ?? ' '}
            required
            fullWidth
            size="small"
          />

          {/* App URL */}
          <TextField
            label="App URL"
            value={form.appUrl}
            onChange={(e) => handleChange('appUrl', e.target.value)}
            error={Boolean(errors.appUrl)}
            helperText={errors.appUrl ?? ' '}
            fullWidth
            size="small"
            placeholder="https://localhost:3000"
          />

          {/* Port */}
          <TextField
            label="Port"
            value={form.port}
            onChange={(e) => handleChange('port', e.target.value)}
            error={Boolean(errors.port)}
            helperText={errors.port ?? ' '}
            fullWidth
            size="small"
            type="number"
            placeholder="3000"
          />

          {/* Health URL */}
          <TextField
            label="Health URL"
            value={form.healthUrl}
            onChange={(e) => handleChange('healthUrl', e.target.value)}
            error={Boolean(errors.healthUrl)}
            helperText={errors.healthUrl ?? ' '}
            fullWidth
            size="small"
            placeholder="https://localhost:3000/health"
          />

          {/* Divider for env section */}
          <Divider sx={{ pt: 1 }} />

          {/* Environment Variables */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Environment variables
            </Typography>

            {form.env.map((row, index) => (
              <Stack
                key={index}
                direction="row"
                spacing={1}
                sx={{ mb: 1, alignItems: 'flex-start' }}
              >
                <TextField
                  placeholder="KEY"
                  value={row.key}
                  onChange={(e) => handleEnvChange(index, 'key', e.target.value)}
                  error={Boolean(errors[`env.${index}.key`])}
                  helperText={errors[`env.${index}.key`] ?? ' '}
                  size="small"
                  sx={{ width: 140 }}
                />
                <TextField
                  placeholder="Value"
                  value={row.value}
                  onChange={(e) => handleEnvChange(index, 'value', e.target.value)}
                  error={Boolean(errors[`env.${index}.value`])}
                  helperText={errors[`env.${index}.value`] ?? ' '}
                  size="small"
                  sx={{ flex: 1 }}
                />
                <IconButton
                  aria-label="Remove environment variable"
                  onClick={() => handleRemoveEnvRow(index)}
                  size="small"
                  color="error"
                  sx={{ mt: 0.5 }}
                >
                  <RemoveCircleOutlineOutlinedIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}

            <Button
              variant="text"
              startIcon={<AddCircleOutlineOutlinedIcon />}
              onClick={handleAddEnvRow}
              size="small"
              sx={{ mt: 0.5 }}
            >
              Add variable
            </Button>
          </Box>

          {/* Env file path */}
          <TextField
            label="Env file path"
            value={form.envFilePath}
            onChange={(e) => handleChange('envFilePath', e.target.value)}
            error={Boolean(errors.envFilePath)}
            helperText={errors.envFilePath ?? 'Optional path to a .env file'}
            fullWidth
            size="small"
            placeholder=".env.local"
          />

          <Divider />

          {/* Autostart */}
          <FormControlLabel
            control={
              <Switch
                checked={form.autostart}
                onChange={(e) => handleChange('autostart', e.target.checked)}
                inputProps={{ 'aria-label': 'Autostart project' }}
              />
            }
            label="Autostart project on devctl boot"
          />
        </Stack>

        {/* ----- Footer actions ----- */}
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
            disabled={saving}
          >
            {submitLabel}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
