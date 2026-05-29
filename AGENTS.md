# devctl Agent Guide

## Project

devctl is a Node.js web app for controlling local web app dev-server lifecycles from a Docker-launched control surface.

Read these before planning or implementing:

- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`

## Working Rules

- Keep changes scoped to the active roadmap phase.
- Prefer TypeScript for Node.js and React code.
- Use Material UI for frontend components, theming, icons, layout primitives, and accessible controls.
- Design the app as an operational dashboard: dense, clear, responsive, and action-oriented.
- Treat command execution and Docker host access as security-sensitive.
- Verify lifecycle behavior with real commands or controlled sample projects when possible.

## Current Next Step

Phase 1 is Project Registry Foundation. Discuss or plan it before implementation unless the user explicitly asks to build immediately.
