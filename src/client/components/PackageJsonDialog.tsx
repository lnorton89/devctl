import { useEffect, useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import type { ProjectConfig } from '../../shared/projectSchema.js';
import type { GetPackageJsonResponse } from '../../shared/lifecycleSchema.js';
import { getPackageJson } from '../api/projectsApi.js';

const MONO_STACK = [
  '"Spline Sans Mono"',
  'ui-monospace',
  '"Cascadia Code"',
  '"Fira Code"',
  '"Consolas"',
  'monospace',
].join(',');

type JsonTokenType =
  | 'key'
  | 'string'
  | 'number'
  | 'boolean'
  | 'null'
  | 'punctuation'
  | 'plain';

interface JsonToken {
  text: string;
  type: JsonTokenType;
}

const TOKEN_COLORS: Record<JsonTokenType, string> = {
  key: '#89b4fa',
  string: '#a6e3a1',
  number: '#fab387',
  boolean: '#cba6f7',
  null: '#f38ba8',
  punctuation: '#bac2de',
  plain: '#cdd6f4',
};

export interface PackageJsonDialogProps {
  open: boolean;
  project: ProjectConfig;
  onClose: () => void;
}

export default function PackageJsonDialog({
  open,
  project,
  onClose,
}: PackageJsonDialogProps) {
  const [data, setData] = useState<GetPackageJsonResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadContent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getPackageJson(project.id);
      setData(result);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Could not load package.json.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [project.id]);

  useEffect(() => {
    if (open) {
      void loadContent();
    } else {
      setData(null);
      setError(null);
    }
  }, [open, loadContent]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      aria-label={`${project.name} - package.json`}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" component="div" sx={{ fontSize: 16, fontWeight: 600 }}>
          {project.name} - package.json
        </Typography>
        <IconButton aria-label="Close package.json viewer" onClick={onClose} size="small">
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
          <Alert severity="error">{error}</Alert>
        )}

        {!loading && !error && data && (
          <>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              {data.path}
            </Typography>
            <Box
              sx={{
                bgcolor: '#1e1e2e',
                color: '#cdd6f4',
                fontFamily: MONO_STACK,
                fontSize: 12,
                lineHeight: 1.6,
                p: 2,
                borderRadius: 1,
                maxHeight: 480,
                overflow: 'auto',
                whiteSpace: 'pre',
                '&::-webkit-scrollbar': { width: 6 },
                '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 3 },
              }}
              role="document"
              aria-label="package.json content"
            >
              {tokenizeJson(data.content).map((token, index) => (
                <Box
                  component="span"
                  data-token-type={token.type}
                  key={`${index}:${token.type}`}
                  sx={{ color: TOKEN_COLORS[token.type] }}
                >
                  {token.text}
                </Box>
              ))}
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export function tokenizeJson(content: string): JsonToken[] {
  const tokens: JsonToken[] = [];
  let index = 0;

  while (index < content.length) {
    const character = content[index];

    if (character === '"') {
      const end = findStringEnd(content, index);
      const text = content.slice(index, end);
      const remainder = content.slice(end);
      tokens.push({
        text,
        type: /^\s*:/.test(remainder) ? 'key' : 'string',
      });
      index = end;
      continue;
    }

    const number = content.slice(index).match(/^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/);
    if (number) {
      tokens.push({ text: number[0], type: 'number' });
      index += number[0].length;
      continue;
    }

    const literal = content.slice(index).match(/^(?:true|false|null)\b/);
    if (literal) {
      tokens.push({
        text: literal[0],
        type: literal[0] === 'null' ? 'null' : 'boolean',
      });
      index += literal[0].length;
      continue;
    }

    if ('{}[],:'.includes(character)) {
      tokens.push({ text: character, type: 'punctuation' });
      index++;
      continue;
    }

    const nextSpecial = findNextSpecialCharacter(content, index + 1);
    tokens.push({ text: content.slice(index, nextSpecial), type: 'plain' });
    index = nextSpecial;
  }

  return tokens;
}

function findStringEnd(content: string, start: number): number {
  let escaped = false;

  for (let index = start + 1; index < content.length; index++) {
    const character = content[index];
    if (!escaped && character === '"') {
      return index + 1;
    }
    escaped = !escaped && character === '\\';
  }

  return content.length;
}

function findNextSpecialCharacter(content: string, start: number): number {
  for (let index = start; index < content.length; index++) {
    const character = content[index];
    if (
      character === '"' ||
      '{}[],:'.includes(character) ||
      /[-\d]/.test(character) ||
      content.startsWith('true', index) ||
      content.startsWith('false', index) ||
      content.startsWith('null', index)
    ) {
      return index;
    }
  }

  return content.length;
}
