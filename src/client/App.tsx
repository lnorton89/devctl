/**
 * devctl root application component.
 *
 * First screen: Project registry dashboard with data-fetching,
 * loading, empty, and error states. No lifecycle controls, logs,
 * health polling, port checks, or fake data.
 *
 * @module App
 */

import ProjectRegistryPage from './components/ProjectRegistryPage';

/**
 * Root application component.
 *
 * Renders the Projects registry page — the first screen a user sees.
 * Plan 06 will wire the onAddProject / onEditProject / onDeleteProject
 * callbacks to the form drawer and delete confirmation dialog.
 */
function App() {
  return (
    <ProjectRegistryPage />
  );
}

export default App;
