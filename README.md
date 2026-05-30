# devctl

**devctl** is a local web app for managing the lifecycle of development server processes. It provides a Material UI dashboard for registering projects, starting/stopping their dev servers, viewing status and logs, and configuring boot-time automation.

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

193 tests across 12 test files covering shared schema validation, YAML registry persistence, Express API routes, React components, lifecycle process management, and an end-to-end integration flow.

### Type Check

```bash
npm run typecheck
```

---

## Usage

### Adding a project

1. Click **Add project**
2. Click **Select package.json** to browse the filesystem for a project directory
3. Choose a directory containing a `package.json`, then select an npm script
4. The project is saved with the directory path, script name, and a generated `startCommand` of `npm run <script>`

### Lifecycle controls

Each project shows action buttons based on its current state:

| State     | Available actions                |
|-----------|----------------------------------|
| Stopped   | Start                            |
| Starting  | Stop                             |
| Running   | Stop, Restart, View logs         |
| Stopping  | (waiting)                        |
| Failed    | Start, Restart, View logs        |
| Error     | Start                            |

A pulsing Status chip indicates transitional states (Starting, Stopping). Logs can be toggled inline per project.

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
| `startCommand` | Yes | Shell command to start the dev server (`npm run <script>`) |
| `scriptName` | No | npm script selected for lifecycle execution |
| `appUrl` | No | URL to open the app in the browser |
| `port` | No | Port number (1–65535) |
| `healthUrl` | No | URL for health-check polling (future use) |
| `envFilePath` | No | Optional `.env` file path |
| `env` | No (default `[]`) | Key/value environment variable overrides |
| `autostart` | No (default `false`) | Start on devctl boot (future use) |

Environment variable values are editable through the project form but are **not shown** in the registry table, logged, or exposed outside the edit surface.

### API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/projects` | List all registered projects |
| `POST` | `/api/projects` | Create a new project |
| `PUT` | `/api/projects/:id` | Update an existing project |
| `DELETE` | `/api/projects/:id` | Delete a project |
| `GET` | `/api/projects/package-json-browser` | Browse directories for package.json files |
| `POST` | `/api/projects/parse-scripts` | Parse npm scripts from a directory's package.json |
| `POST` | `/api/projects/:id/start` | Start a project's dev server |
| `POST` | `/api/projects/:id/stop` | Stop a running project |
| `POST` | `/api/projects/:id/restart` | Restart a running or failed project |
| `GET` | `/api/projects/:id/status` | Get current process status (state, uptime, recent logs) |
| `GET` | `/api/projects/:id/logs` | Get log data with current run and run history |

All endpoints validate input through a shared Zod schema. Validation errors return HTTP 400 with field-level issue paths. Registry load errors (malformed YAML) return HTTP 503.

---

## Project Structure

```
src/
├── client/              # React frontend (Material UI)
│   ├── App.tsx
│   ├── main.tsx
│   ├── theme.ts         # Aurora-inspired theme
│   ├── api/             # API client functions
│   └── components/      # UI components
├── server/              # Express backend
│   ├── index.ts         # Server entry point
│   ├── app.ts           # App factory (dependency injection)
│   ├── routes/          # API route handlers (registry + lifecycle)
│   ├── registry/        # YAML persistence layer
│   └── process/         # Process manager and package.json parser
└── shared/              # Shared Zod schemas and types
    ├── projectSchema.ts
    └── lifecycleSchema.ts

tests/
├── client/              # React component tests
├── server/              # Express/API tests
├── integration/         # End-to-end integration tests
└── setup.ts             # Test environment setup
```

---

## License

Private — internal development tool.
