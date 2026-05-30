/**
 * devctl Material UI theme.
 *
 * Aurora dark operational dashboard palette and compact typography.
 *
 * @module theme
 */

import { alpha, createTheme } from '@mui/material/styles';

const aurora = {
  common: {
    white: '#ffffff',
    black: '#000000',
  },
  grey: {
    50: '#F7FAFC',
    100: '#EBF2F5',
    200: '#DBE6EB',
    300: '#C3D3DB',
    400: '#9CAEB8',
    500: '#77878F',
    600: '#4D595E',
    700: '#262D30',
    800: '#1B2124',
    900: '#111417',
    950: '#06080A',
  },
  blue: {
    50: '#EAF3FD',
    100: '#C6DDFB',
    300: '#7DB1F5',
    400: '#589BF3',
    500: '#3385F0',
    600: '#2B71CC',
    700: '#245DA8',
    900: '#143560',
  },
  purple: {
    50: '#F2E4FE',
    300: '#C686FC',
    400: '#B663FB',
    500: '#A641FA',
    700: '#742DAF',
    900: '#421A64',
  },
  red: {
    50: '#F9E2E6',
    300: '#E17286',
    400: '#D84A63',
    500: '#D02241',
    600: '#B11D37',
    900: '#530E1A',
  },
  orange: {
    50: '#FEEFE1',
    300: '#F9B677',
    400: '#F8A250',
    500: '#F68D2A',
    700: '#AC631D',
    900: '#623811',
  },
  green: {
    50: '#E6F5F0',
    300: '#62C29F',
    400: '#35B084',
    500: '#099F69',
    700: '#066F49',
    900: '#04402A',
  },
  cyan: {
    50: '#E0F3FA',
    300: '#64C6E5',
    400: '#39B6DD',
    500: '#0DA6D6',
    700: '#097496',
    900: '#054256',
  },
} as const;

// ---------------------------------------------------------------------------
// Typography tokens
// ---------------------------------------------------------------------------

const typography = {
  fontFamily: [
    '"Plus Jakarta Sans"',
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    'sans-serif',
  ].join(','),
  fontSize: 14,

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
    fontWeight: 600,
    lineHeight: 1.35,
  },
  subtitle2: {
    fontSize: 12,
    fontWeight: 700,
    lineHeight: 1.3,
  },
  h6: {
    fontSize: 16,
    fontWeight: 700,
    lineHeight: 1.35,
  },
  h5: {
    fontSize: 22,
    fontWeight: 700,
    lineHeight: 1.3,
  },
  overline: {
    fontSize: 12,
    fontWeight: 700,
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
// Palette tokens
// ---------------------------------------------------------------------------

const palette = {
  mode: 'dark' as const,
  common: aurora.common,
  background: {
    default: aurora.grey[950],
    paper: aurora.grey[900],
  },
  divider: aurora.grey[700],
  text: {
    primary: aurora.grey[50],
    secondary: aurora.grey[400],
  },
  primary: {
    light: aurora.blue[300],
    main: aurora.blue[400],
    dark: aurora.blue[500],
    contrastText: aurora.grey[950],
  },
  secondary: {
    light: aurora.purple[300],
    main: aurora.purple[400],
    dark: aurora.purple[500],
    contrastText: aurora.grey[950],
  },
  success: {
    light: aurora.green[300],
    main: aurora.green[400],
    dark: aurora.green[500],
  },
  warning: {
    light: aurora.orange[300],
    main: aurora.orange[400],
    dark: aurora.orange[500],
  },
  error: {
    light: aurora.red[300],
    main: aurora.red[400],
    dark: aurora.red[500],
  },
  info: {
    light: aurora.cyan[300],
    main: aurora.cyan[400],
    dark: aurora.cyan[500],
  },
};

// ---------------------------------------------------------------------------
// Component overrides for dense operational dashboard
// ---------------------------------------------------------------------------

const components = {
  MuiCssBaseline: {
    styleOverrides: {
      ':root': {
        colorScheme: 'dark',
      },
      body: {
        background:
          `radial-gradient(circle at top left, ${alpha(aurora.blue[500], 0.16)}, transparent 34rem), ` +
          `radial-gradient(circle at top right, ${alpha(aurora.purple[500], 0.16)}, transparent 32rem), ` +
          aurora.grey[950],
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        color: aurora.grey[50],
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
      },
      '::selection': {
        backgroundColor: alpha(aurora.blue[400], 0.28),
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
        fontWeight: 700,
        fontSize: 14,
        borderRadius: 8,
        boxShadow: 'none',
      },
      contained: {
        color: aurora.grey[950],
        backgroundImage: `linear-gradient(135deg, ${aurora.blue[400]} 0%, ${aurora.purple[400]} 100%)`,
        '&:hover': {
          boxShadow: `0 10px 24px ${alpha(aurora.blue[400], 0.28)}`,
        },
      },
      outlined: {
        borderColor: aurora.grey[700],
        color: aurora.grey[100],
        '&:hover': {
          borderColor: aurora.blue[400],
          backgroundColor: alpha(aurora.blue[500], 0.12),
        },
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
    styleOverrides: {
      root: {
        borderRadius: 8,
        color: aurora.grey[300],
        '&:hover': {
          backgroundColor: alpha(aurora.blue[500], 0.14),
          color: aurora.blue[300],
        },
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundImage: 'none',
      },
      elevation1: {
        boxShadow: `0 18px 50px ${alpha(aurora.common.black, 0.28)}`,
      },
    },
  },
  MuiTableContainer: {
    styleOverrides: {
      root: {
        backgroundColor: alpha(aurora.grey[900], 0.92),
        border: `1px solid ${aurora.grey[700]}`,
        borderRadius: 8,
        boxShadow: `0 18px 50px ${alpha(aurora.common.black, 0.28)}`,
        backdropFilter: 'blur(16px)',
      },
    },
  },
  MuiTableHead: {
    styleOverrides: {
      root: {
        '& .MuiTableCell-head': {
          fontSize: 12,
          fontWeight: 800,
          lineHeight: 1.3,
          color: aurora.grey[300],
          backgroundColor: alpha(aurora.grey[800], 0.72),
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
        borderColor: aurora.grey[700],
      },
      head: {
        padding: '8px 16px',
      },
    },
  },
  MuiTableRow: {
    styleOverrides: {
      root: {
        '&.MuiTableRow-hover:hover': {
          backgroundColor: alpha(aurora.blue[500], 0.08),
        },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 999,
        fontWeight: 700,
      },
      sizeSmall: {
        height: 24,
        fontSize: 12,
      },
    },
  },
  MuiTooltip: {
    styleOverrides: {
      tooltip: {
        fontSize: 12,
        borderRadius: 6,
        backgroundColor: aurora.grey[100],
        color: aurora.grey[900],
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
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        backgroundColor: alpha(aurora.grey[900], 0.8),
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: aurora.blue[400],
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderWidth: 1,
          borderColor: aurora.blue[400],
          boxShadow: `0 0 0 3px ${alpha(aurora.blue[400], 0.16)}`,
        },
      },
      notchedOutline: {
        borderColor: aurora.grey[700],
      },
    },
  },
  MuiInputLabel: {
    styleOverrides: {
      root: {
        color: aurora.grey[400],
        '&.Mui-focused': {
          color: aurora.blue[300],
        },
      },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        padding: 24,
        backgroundColor: aurora.grey[900],
        borderLeft: `1px solid ${aurora.grey[700]}`,
        boxShadow: `-20px 0 56px ${alpha(aurora.common.black, 0.4)}`,
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: 8,
        border: `1px solid ${aurora.grey[700]}`,
        backgroundColor: aurora.grey[900],
        boxShadow: `0 24px 70px ${alpha(aurora.common.black, 0.48)}`,
      },
    },
  },
  MuiDialogTitle: {
    styleOverrides: {
      root: {
        fontWeight: 800,
      },
    },
  },
  MuiAlert: {
    styleOverrides: {
      root: {
        borderRadius: 8,
      },
    },
  },
  MuiListItemButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        '&:hover': {
          backgroundColor: alpha(aurora.blue[500], 0.12),
        },
      },
    },
  },
  MuiAccordion: {
    styleOverrides: {
      root: {
        backgroundColor: alpha(aurora.grey[900], 0.92),
        border: `1px solid ${aurora.grey[700]}`,
        borderRadius: 8,
        boxShadow: 'none',
        '&:before': {
          display: 'none',
        },
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
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    `0 2px 8px ${alpha(aurora.common.black, 0.22)}`,
    `0 4px 12px ${alpha(aurora.common.black, 0.24)}`,
    `0 8px 20px ${alpha(aurora.common.black, 0.26)}`,
    `0 12px 28px ${alpha(aurora.common.black, 0.28)}`,
    `0 16px 36px ${alpha(aurora.common.black, 0.3)}`,
    `0 20px 44px ${alpha(aurora.common.black, 0.32)}`,
    `0 24px 52px ${alpha(aurora.common.black, 0.34)}`,
    `0 28px 60px ${alpha(aurora.common.black, 0.36)}`,
    `0 32px 68px ${alpha(aurora.common.black, 0.38)}`,
    `0 36px 76px ${alpha(aurora.common.black, 0.4)}`,
    `0 40px 84px ${alpha(aurora.common.black, 0.42)}`,
    `0 44px 92px ${alpha(aurora.common.black, 0.44)}`,
    `0 48px 100px ${alpha(aurora.common.black, 0.46)}`,
    `0 52px 108px ${alpha(aurora.common.black, 0.48)}`,
    `0 56px 116px ${alpha(aurora.common.black, 0.5)}`,
    `0 60px 124px ${alpha(aurora.common.black, 0.52)}`,
    `0 64px 132px ${alpha(aurora.common.black, 0.54)}`,
    `0 68px 140px ${alpha(aurora.common.black, 0.56)}`,
    `0 72px 148px ${alpha(aurora.common.black, 0.58)}`,
    `0 76px 156px ${alpha(aurora.common.black, 0.6)}`,
    `0 80px 164px ${alpha(aurora.common.black, 0.62)}`,
    `0 84px 172px ${alpha(aurora.common.black, 0.64)}`,
    `0 88px 180px ${alpha(aurora.common.black, 0.66)}`,
    `0 92px 188px ${alpha(aurora.common.black, 0.68)}`,
  ],
});

export default theme;
