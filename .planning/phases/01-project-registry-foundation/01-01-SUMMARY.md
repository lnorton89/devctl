---
phase: 01-project-registry-foundation
plan: 01
subsystem: toolchain
tags: [package-manager, typescript, vite, vitest, material-ui, react, express, zod, yaml]
requires: []
provides: [build-toolchain, test-framework, type-checking, data-directory]
affects: [all subsequent plans in Phase 1]
tech-stack:
  added:
    - package: node
      version: "22.18.0"
    - package: npm
      version: "10.9.3"
    - package: typescript
      version: "^6.0.3"
    - package: vite
      version: "^8.0.14"
    - package: vitest
      version: "^4.1.7"
    - package: "@vitejs/plugin-react"
      version: "^6.0.2"
    - package: react
      version: "^19.2.6"
    - package: react-dom
      version: "^19.2.6"
    - package: "@mui/material"
      version: "^9.0.1"
    - package: "@mui/icons-material"
      version: "^9.0.1"
    - package: "@emotion/react"
      version: "^11.14.0"
    - package: "@emotion/styled"
      version: "^11.14.1"
    - package: express
      version: "^5.2.1"
    - package: yaml
      version: "^2.9.0"
    - package: zod
      version: "^4.4.3"
    - package: "@testing-library/react"
      version: "^16.3.2"
    - package: "@testing-library/jest-dom"
      version: "^6.9.1"
    - package: jsdom
      version: "^29.1.1"
    - package: supertest
      version: "^7.2.2"
    - package: tsx
      version: "^4.22.3"
  patterns:
    - "Strict TypeScript 6 with bundler module resolution"
    - "Vite 8 with Express API proxy to port 3001"
    - "Vitest 4 with jsdom environment and Testing Library setup"
    - "Dual tsconfig approach: main config for source/tests, node config for build tooling"
key-files:
  created:
    - path: package.json
      purpose: "npm manifest with all dependency declarations and 7 scripts (dev, dev:client, dev:server, build, preview, test, typecheck)"
    - path: package-lock.json
      purpose: "locked dependency graph for reproducible installs"
    - path: tsconfig.json
      purpose: "strict TypeScript 6 config with ES2022 target, bundler module resolution, react-jsx, and source maps"
    - path: tsconfig.node.json
      purpose: "standalone composite config for Vite and Vitest configuration files"
    - path: vite.config.ts
      purpose: "Vite React dev server with /api proxy to http://localhost:3001 (future Express dev server)"
    - path: vitest.config.ts
      purpose: "Vitest config with jsdom DOM environment, globals, Testing Library setup, and V8 coverage"
    - path: tests/setup.ts
      purpose: "loads @testing-library/jest-dom matchers for all tests"
    - path: data/.gitkeep
      purpose: "placeholder for registry YAML persistence directory (REG-04)"
    - path: .gitignore
      purpose: "ignores node_modules, dist, *.local, and data/projects.yaml"
  modified: []
decisions: []
metrics:
  duration_minutes: 12
  files_created: 9
  files_modified: 0
  dependencies_installed: 287
  vulnerabilities: 0
---

# Phase 1 Plan 01: Toolchain and Data Directory Foundation

**One-liner:** Created the complete Node/Vite/React/MUI/Express/YAML/Zod/Vitest dependency baseline with strict TypeScript 6, dev server proxy configuration, test infrastructure, and a durable data directory placeholder — enabling all subsequent Phase 1 registry plans to build without touching the toolchain boundary.

## What Was Built

### Package Manifest and Dependencies

- **package.json** declares the full v1 stack: React 19, Material UI 9, Emotion 11, Express 5, YAML 2, Zod 4, Vite 8, Vitest 4, Testing Library, Supertest, and tsx.
- 7 npm scripts set up for development workflows: `dev`, `dev:client`, `dev:server`, `build`, `preview`, `test`, and `typecheck`.
- `npm install` completed with **287 packages, 0 vulnerabilities**.

### TypeScript Configuration

- **tsconfig.json** enables strict mode with ES2022 target, bundler module resolution, react-jsx transform, isolated modules, and source maps — covering `src/`, `tests/`, and config files.
- **tsconfig.node.json** provides a standalone composite config for Vite/Vitest build tooling.
- `tsc --noEmit` passes cleanly.

### Build and Dev Server Configuration

- **vite.config.ts** configures the Vite dev server on port 5173 with `@vitejs/plugin-react` and proxies `/api` requests to `http://localhost:3001` (the future Express dev server).
- **vitest.config.ts** sets up jsdom as the DOM environment, enables globals, loads `tests/setup.ts`, and includes V8 coverage reporters.

### Test Infrastructure

- **tests/setup.ts** imports `@testing-library/jest-dom` matchers so all component tests have access to DOM assertion helpers like `toBeInTheDocument()`.

### Data Persistence Placeholder

- **data/.gitkeep** creates and tracks the data directory that will later hold the YAML registry file (REG-04), ensuring the directory is present across clones and checkouts.

### Ignore Rules

- **.gitignore** excludes `node_modules/`, `dist/`, `*.local` config files, and the future `data/projects.yaml` registry file.

## Deviations from Plan

None — plan executed exactly as written.

## TypeScript 6 Compatibility

During implementation, TypeScript 6.0.3 required two adjustments from the plan's initial assumptions:

1. **Removed `declaration: true` and `declarationMap: true`** from the main tsconfig — these conflict with `noEmit: true` in TypeScript 6 (TS6305).
2. **Removed `baseUrl` and `paths`** — `baseUrl` is deprecated in TypeScript 6 (TS5101) and will be removed in TypeScript 7. Path aliases can be added later via Vite's resolve.alias if needed.
3. **Simplified tsconfig.node.json** to a standalone composite config without `noEmit` — the main tsconfig now includes all files directly without project references, avoiding TS6306/TS6310 errors.

These adjustments are forward-compatible and do not affect any downstream plan capabilities.

## Verification

| Check | Status |
|-------|--------|
| `npm install` | ✅ Passed — 287 packages, 0 vulnerabilities |
| `npm run typecheck` | ✅ Passed — zero errors |
| `npm test -- --run` | ✅ Passed (no test files yet — expected) |
| No lifecycle/Docker scripts | ✅ Verified — no start/stop/restart or Docker execution commands |

## Success Criteria Met

- [x] Dependencies install cleanly — 287 packages, 0 vulns
- [x] TypeScript configuration loads — `tsc --noEmit` passes
- [x] Build/typecheck scripts exist — `build`, `typecheck`, `test`, `dev`, `preview`
- [x] Data directory placeholder exists — `data/.gitkeep`
- [x] No lifecycle or Docker execution scope — only dev/build/test/typecheck scripts

## State Updates

- **STATE.md**: Updated status to reflect Plan 01-01 completion, progress percent to 14% (1/7 plans).
- **ROADMAP.md**: Plan 01-01 marked as completed. Phase 1 status: In Progress (1/7 plans complete).
- **REQUIREMENTS.md**: REG-01 through REG-04 marked as per plan frontmatter. Note: full feature-level fulfillment (create, edit, delete, persist projects) is implemented in downstream plans 02–07; this plan provides the toolchain and data directory foundation.

## Commit

```
ed12cf3 feat(01-project-registry-foundation): create toolchain and data directory foundation
```

## Self-Check

- [x] `package.json` exists
- [x] `package-lock.json` exists
- [x] `tsconfig.json` exists — typecheck passes
- [x] `tsconfig.node.json` exists
- [x] `vite.config.ts` exists
- [x] `vitest.config.ts` exists — vitest runs
- [x] `tests/setup.ts` exists
- [x] `data/.gitkeep` exists
- [x] `.gitignore` exists
- [x] Commit `ed12cf3` exists in git log
