# Stack Research: devctl

## Recommended Stack

- Runtime: Node.js with TypeScript.
- Backend: Fastify or Express API for lifecycle actions, WebSocket or Server-Sent Events for live status/log updates.
- Frontend: React with Vite and Material UI.
- Persistence: SQLite for local project registry, process history, preferences, and boot policy.
- Process control: Node child process management for spawned commands, plus port probing and health checks.
- Containerization: Dockerfile plus docker compose example for boot-launched service.

## Notes

- Official Docker guidance for Node.js emphasizes containerizing with clear dependency install, runtime image hygiene, and an explicit app entrypoint.
- Official Material UI docs support React usage with theming through `@mui/material` and Emotion styling packages.
- Context7 MCP has been added to the Codex environment and should be used for current MUI examples when available.
- Because devctl must manage host projects, the Docker design is more important than a normal web app container: it needs mounted project directories, a persistent data volume, and a deliberate host process model.

## Sources

- Docker Node.js guide: https://docs.docker.com/guides/nodejs/
- Docker Node.js containerize guide: https://docs.docker.com/guides/nodejs/containerize/
- Material UI docs: https://mui.com/material-ui/
