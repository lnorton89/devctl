/**
 * devctl browser entry point.
 *
 * Wraps the root `<App />` component in Material UI `ThemeProvider`
 * and `CssBaseline` using the operational dashboard theme.
 *
 * @module main
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import '@fontsource/plus-jakarta-sans/latin-300.css';
import '@fontsource/plus-jakarta-sans/latin-400.css';
import '@fontsource/plus-jakarta-sans/latin-500.css';
import '@fontsource/plus-jakarta-sans/latin-600.css';
import '@fontsource/plus-jakarta-sans/latin-700.css';
import '@fontsource/plus-jakarta-sans/latin-800.css';
import '@fontsource/spline-sans-mono/latin-400.css';
import '@fontsource/spline-sans-mono/latin-500.css';
import '@fontsource/spline-sans-mono/latin-600.css';

import App from './App';
import theme from './theme';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element #root not found in index.html');
}

createRoot(root).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>,
);
