/**
 * Dense Material UI desktop table for the project registry.
 *
 * Exposes all required columns from UI-SPEC.md: Project, Host path,
 * Container path, Command, Port, Health URL, Autostart, Actions.
 *
 * Threat model T-01-05-01: No environment variable values rendered.
 * Truncates long paths/commands with Tooltip.
 * Monospace styling for paths, command, port, URLs.
 *
 * @module ProjectTable
 */

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  IconButton,
  Chip,
  Link,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import type { ProjectConfig } from '../../shared/projectSchema.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProjectTableProps {
  /** The projects to display. */
  projects: ProjectConfig[];
  /** Called when the user clicks a row's edit action. */
  onEditProject: (project: ProjectConfig) => void;
  /** Called when the user clicks a row's delete action. */
  onDeleteProject: (project: ProjectConfig) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Maximum character length before a value is truncated with ellipsis.
 * Longer values get a Tooltip on hover.
 */
const MAX_STRING_LENGTH = 60;

/** Monospace font stack for code-like values. */
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

/**
 * Renders a monospaced cell value with optional Tooltip truncation.
 */
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
  const needsTooltip = truncated !== value;

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

  if (needsTooltip) {
    return <Tooltip title={value}>{content}</Tooltip>;
  }
  return content;
}

/**
 * Renders an optional value: a dash when empty, or monospaced text.
 */
function OptionalCell({ value }: { value: string | null | undefined }) {
  if (!value) {
    return (
      <Typography component="span" color="text.secondary" sx={{ fontSize: 14 }}>
        &mdash;
      </Typography>
    );
  }
  return (
    <Typography
      component="span"
      sx={{ fontFamily: MONO_STACK, fontSize: 13 }}
    >
      {value}
    </Typography>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Desktop registry table with dense rows and all required columns.
 */
export default function ProjectTable({
  projects,
  onEditProject,
  onDeleteProject,
}: ProjectTableProps) {
  if (projects.length === 0) {
    return null;
  }

  return (
    <TableContainer>
      <Table size="small" sx={{ minWidth: 900 }}>
        <TableHead>
          <TableRow>
            <TableCell>Project</TableCell>
            <TableCell>Host path</TableCell>
            <TableCell>Container path</TableCell>
            <TableCell>Command</TableCell>
            <TableCell>Port</TableCell>
            <TableCell>Health URL</TableCell>
            <TableCell>Autostart</TableCell>
            <TableCell sx={{ width: 90 }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {projects.map((project) => (
            <TableRow
              key={project.id}
              hover
              sx={{ '&:last-child td': { border: 0 } }}
            >
              {/* Project: name + optional app URL */}
              <TableCell>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
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

              {/* Host path */}
              <TableCell>
                <MonospaceCell value={project.hostPath} />
              </TableCell>

              {/* Container path */}
              <TableCell>
                <MonospaceCell value={project.containerPath} />
              </TableCell>

              {/* Command */}
              <TableCell>
                <MonospaceCell value={project.startCommand} maxWidth={180} />
              </TableCell>

              {/* Port */}
              <TableCell>
                <OptionalCell value={project.port?.toString()} />
              </TableCell>

              {/* Health URL */}
              <TableCell>
                <OptionalCell value={project.healthUrl} />
              </TableCell>

              {/* Autostart */}
              <TableCell>
                <Chip
                  label={project.autostart ? 'On' : 'Off'}
                  size="small"
                  color={project.autostart ? 'success' : 'default'}
                  variant={project.autostart ? 'filled' : 'outlined'}
                />
              </TableCell>

              {/* Actions */}
              <TableCell>
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
