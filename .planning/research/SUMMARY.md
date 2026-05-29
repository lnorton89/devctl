# Research Summary: devctl

## Stack

Build a TypeScript Node.js app with a React plus Material UI frontend. Use SQLite for local configuration and lifecycle history, and use Docker plus docker compose to run devctl automatically at boot with mounted project directories and a persistent data volume.

## Table Stakes

- Project registry
- Start, stop, restart, and open controls
- Live status and health checks
- Recent logs and visible startup errors
- Autostart policy when devctl starts
- Docker runtime configuration

## Watch Out For

- Container-to-host process control must be explicit and tested.
- Status must reflect process state, port/health checks, and errors.
- Stop behavior on Windows needs particular care.
- The UI should feel like an operational tool, not a landing page.

## Recommended First Milestone

Create a working local controller with registry, process lifecycle control, status, logs, Material UI dashboard, and Docker boot documentation.
