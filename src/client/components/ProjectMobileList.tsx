/**
 * Compact responsive registry list for narrow viewports.
 *
 * Renders each project as a concise card with essential metadata
 * (host path, container path, command, port) and edit/delete actions.
 *
 * Threat model T-01-05-01: No environment variable values rendered.
 *
 * @module ProjectMobileList
 */

import { Box, Typography, IconButton, Chip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import type { ProjectConfig } from '../../shared/projectSchema.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProjectMobileListProps {
  /** The projects to display. */
  projects: ProjectConfig[];
  /** Called when the user clicks a project's edit action. */
  onEditProject: (project: ProjectConfig) => void;
  /** Called when the user clicks a project's delete action. */
  onDeleteProject: (project: ProjectConfig) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MONO_STACK = [
  'ui-monospace',
  '"Cascadia Code"',
  '"Fira Code"',
  '"Consolas"',
  'monospace',
].join(',');

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** A single metadata row: label on the left, monospaced value on the right. */
function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ minWidth: 72, flexShrink: 0, fontWeight: 500 }}
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

/**
 * Compact mobile list rendering each project as a bordered card
 * with metadata rows and action icon buttons.
 */
export default function ProjectMobileList({
  projects,
  onEditProject,
  onDeleteProject,
}: ProjectMobileListProps) {
  if (projects.length === 0) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {projects.map((project) => (
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
              <IconButton
                aria-label="Edit project"
                onClick={() => onEditProject(project)}
                size="small"
              >
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton
                aria-label="Delete project"
                onClick={() => onDeleteProject(project)}
                size="small"
                color="error"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* Metadata */}
          <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            <MetadataRow label="Host" value={project.hostPath} />
            <MetadataRow label="Container" value={project.containerPath} />
            <MetadataRow label="Command" value={project.startCommand} />
            {project.port && <MetadataRow label="Port" value={String(project.port)} />}
            {project.healthUrl && <MetadataRow label="Health" value={project.healthUrl} />}
          </Box>

          {/* Autostart chip */}
          <Box sx={{ mt: 1.5 }}>
            <Chip
              label={`Autostart: ${project.autostart ? 'On' : 'Off'}`}
              size="small"
              color={project.autostart ? 'success' : 'default'}
              variant={project.autostart ? 'filled' : 'outlined'}
            />
          </Box>
        </Box>
      ))}
    </Box>
  );
}
