# devctl

**devctl** is a local web app for managing the lifecycle of development server processes. It provides a Material UI dashboard for registering projects, configuring their start commands, environment, and ports, and (in future phases) starting, stopping, and monitoring them.

> **Phase 1 — Project Registry Foundation.** This release covers project registration, configuration storage, and basic CRUD through a web UI. Lifecycle execution, health polling, logs, and autostart are planned for later phases.

---

## Quick Start

### Prerequisites

- Node.js 22+
- npm 10+

### Install

```bash
npm install
```

### Develop

Start both the Vite dev server (frontend) and the Express API server (backend) concurrently:

```bash
npm run dev
```

Or start them separately:

```bash
npm run dev:client   # Vite dev server on port 5273
npm run dev:server   # Express API with tsx watch
```

### Build

```bash
npm run build
```

TypeScript check (`tsc --noEmit`) followed by Vite production build. Output goes to `dist/client/`.

### Test

```bash
npm test             # Run tests in watch mode
npm test -- --run    # Run once (CI-friendly)
```

144 tests across 7 test files covering shared schema validation, YAML registry persistence, Express API routes, React components, and an end-to-end integration flow.

### Type Check

```bash
npm run typecheck
```

---

## Project Registry

### Configuration File

Project data is stored in a YAML file at:

```
data/projects.yaml
```

You can override this path with the `DEVCTL_CONFIG_PATH` environment variable:

```bash
DEVCTL_CONFIG_PATH=/custom/path/projects.yaml npm run dev:server
```

The file uses a `version: 1` envelope with a `projects` array. It is human-readable and durable across server restarts.

### Stored Fields

Each project record stores the following fields:

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Human-readable project label |
| `hostPath` | Yes | Path on the host workstation |
| `containerPath` | Yes | Mounted path used inside Docker |
| `startCommand` | Yes | Shell command to start the dev server |
| `appUrl` | No | URL to open the app in the browser |
| `port` | No | Port number (1–65535) |
| `healthUrl` | No | URL for health-check polling (future use) |
| `envFilePath` | No | Optional `.env` file path (relative to `containerPath` unless absolute) |
| `env` | No (default `[]`) | Key/value environment variable overrides |
| `autostart` | No (default `false`) | Start on devctl boot (future use) |

Environment variable values are considered local sensitive configuration. They are editable through the project form UI but are **not shown** in the registry table, logged, or exposed outside the edit surface.

### API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/projects` | List all registered projects |
| `POST` | `/api/projects` | Create a new project |
| `PUT` | `/api/projects/:id` | Update an existing project |
| `DELETE` | `/api/projects/:id` | Delete a project |

All endpoints validate input through a shared Zod schema. Validation errors return HTTP 400 with field-level issue paths. Registry load errors (malformed YAML) return HTTP 503.

---

## Phase 1 Scope

**What Phase 1 does:**
- Register projects with name, host/container paths, start command, and optional configuration
- Edit and delete registered projects
- Persist project configuration to a human-readable YAML file
- Serve a Material UI dashboard for managing the registry

**What Phase 1 does NOT do:**
- ❌ Execute project start/stop commands (Phase 2)
- ❌ Monitor project health or port occupancy (Phase 3)
- ❌ Display live process status or logs (Phase 3)
- ❌ Automatically start projects on boot (Phase 4)
- ❌ Provide Docker runtime setup (Phase 5)
- ❌ Run commands or execute configured start commands

Commands are stored as configuration strings only and are not executed. This is a deliberate Phase 1 boundary — see planned Phase 2 for lifecycle execution.

---

## Project Structure

```
src/
├── client/              # React frontend (Material UI)
│   ├── App.tsx
│   ├── main.tsx
│   ├── api/             # API client functions
│   └── components/      # UI components
├── server/              # Express backend
│   ├── index.ts         # Server entry point
│   ├── app.ts           # App factory
│   ├── routes/          # API route handlers
│   └── registry/        # YAML persistence layer
└── shared/              # Shared Zod schemas and types
    └── projectSchema.ts

tests/
├── client/              # React component tests
├── server/              # Express/API tests
├── integration/         # End-to-end integration tests
└── setup.ts             # Test environment setup
```

---

## License

Private — internal development tool.
