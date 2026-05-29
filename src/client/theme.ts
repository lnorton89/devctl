/**
 * devctl Material UI theme.
 *
 * Operational dashboard palette and compact typography
 * matching UI-SPEC.md color and typography contracts.
 *
 * @module theme
 */

import { createTheme } from '@mui/material/styles';

// ---------------------------------------------------------------------------
// Typography tokens  (UI-SPEC.md § Typography)
// ---------------------------------------------------------------------------

const typography = {
  fontFamily: [
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    'sans-serif',
  ].join(','),
  fontSize: 14, // base = body size

  body1: {
    fontSize: 14,
    fontWeight: 400,
    lineHeight: 1.45,
  },
  body2: {
    fontSize: 12,
    fontWeight: 400,
    lineHeight: 1.35,
  },
  subtitle1: {
    fontSize: 12,
    fontWeight: 500,
    lineHeight: 1.35,
  },
  subtitle2: {
    fontSize: 12,
    fontWeight: 600,
    lineHeight: 1.3,
  },
  h6: {
    fontSize: 16,
    fontWeight: 600,
    lineHeight: 1.35,
  },
  h5: {
    fontSize: 20,
    fontWeight: 600,
    lineHeight: 1.3,
  },
  overline: {
    fontSize: 12,
    fontWeight: 600,
    lineHeight: 1.3,
    textTransform: 'none',
  },
  caption: {
    fontSize: 12,
    fontWeight: 400,
    lineHeight: 1.35,
  },
} as const;

// ---------------------------------------------------------------------------
// Palette tokens  (UI-SPEC.md § Color)
// ---------------------------------------------------------------------------

const palette = {
  mode: 'light' as const,
  background: {
    default: '#f7f8fa',
    paper: '#ffffff',
  },
  divider: '#d7dde5',
  text: {
    primary: '#17202a',
    secondary: '#5f6b7a',
  },
  primary: {
    main: '#1976d2',
  },
  success: {
    main: '#2e7d32',
  },
  warning: {
    main: '#ed6c02',
  },
  error: {
    main: '#d32f2f',
  },
};

// ---------------------------------------------------------------------------
// Component overrides for dense operational dashboard
// ---------------------------------------------------------------------------

const components = {
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        backgroundColor: '#f7f8fa',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
      },
    },
  },
  MuiButton: {
    defaultProps: {
      disableElevation: true,
    },
    styleOverrides: {
      root: {
        textTransform: 'none',
        fontWeight: 500,
        fontSize: 14,
      },
      sizeSmall: {
        fontSize: 12,
      },
    },
  },
  MuiIconButton: {
    defaultProps: {
      size: 'small' as const,
    },
  },
  MuiTableHead: {
    styleOverrides: {
      root: {
        '& .MuiTableCell-head': {
          fontSize: 12,
          fontWeight: 600,
          lineHeight: 1.3,
          color: '#5f6b7a',
        },
      },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      root: {
        fontSize: 14,
        lineHeight: 1.45,
        padding: '8px 16px',
      },
      head: {
        padding: '8px 16px',
      },
    },
  },
  MuiTooltip: {
    styleOverrides: {
      tooltip: {
        fontSize: 12,
      },
    },
  },
  MuiSwitch: {
    defaultProps: {
      size: 'small' as const,
    },
  },
  MuiTextField: {
    defaultProps: {
      variant: 'outlined' as const,
      size: 'small' as const,
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        padding: 24,
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Export theme
// ---------------------------------------------------------------------------

const theme = createTheme({
  palette,
  typography,
  components,
});

export default theme;
