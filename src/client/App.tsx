/**
 * devctl root application component.
 *
 * First screen: Project registry shell with an "Add project" placeholder.
 * No lifecycle controls, logs, health polling, port checks, or fake data.
 *
 * @module App
 */

import { Box, Button, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

/**
 * Root application component.
 *
 * Renders the Projects registry shell — the first screen a user sees.
 * Later plans will wire the project table, form drawer, and API calls.
 */
function App() {
  return (
    <Box sx={{ p: '32px 24px', maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3,
        }}
      >
        <Typography variant="h5" component="h1">
          Projects
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          aria-label="Add project"
          disabled
        >
          Add project
        </Button>
      </Box>

      {/* Empty state placeholder */}
      <Typography variant="body1" color="text.secondary">
        No projects registered
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        Add a local app so devctl can manage its configuration.
      </Typography>
    </Box>
  );
}

export default App;
