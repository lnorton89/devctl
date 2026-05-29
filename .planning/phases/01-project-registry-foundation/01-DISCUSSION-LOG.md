# Phase 1: Project Registry Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `01-CONTEXT.md`; this log preserves the alternatives considered.

**Date:** 2026-05-29
**Phase:** 1 - Project Registry Foundation
**Areas discussed:** project paths, environment variables, persistence format, registry UI shape

---

## Project Path Model

| Option | Description | Selected |
|--------|-------------|----------|
| Store both | Store a recognizable host path and the container path commands actually run from. | Yes |
| Container path only | Store only the Docker-mounted execution path. | |
| User-entered only | Store only what the user types. | |

**User's choice:** The user was unsure how to answer.
**Notes:** The default selected for context is to store both host and container paths because devctl runs from Docker while controlling local projects.

---

## Environment Configuration

| Option | Description | Selected |
|--------|-------------|----------|
| Key/value editor | Edit explicit environment variables directly in the UI. | |
| `.env` file path | Reference an existing env file. | |
| Both | Support direct key/value entries plus an optional env file path. | Yes |
| Plain notes only | Record environment notes without structured values. | |

**User's choice:** The user was unsure how to answer.
**Notes:** The default selected for context is key/value entries plus optional `.env` path to support both direct editing and existing project conventions.

---

## Persistence Format

| Option | Description | Selected |
|--------|-------------|----------|
| JSON file | Simple structured local file. | |
| SQLite | Embedded relational database. | |
| YAML file | Human-readable local configuration file. | Yes |

**User's choice:** YAML file.
**Notes:** YAML persistence is locked for Phase 1 planning.

---

## Registry UI Shape

| Option | Description | Selected |
|--------|-------------|----------|
| Table + drawer | Dense desktop table with create/edit drawer or dialog. | Yes |
| Compact cards | Card-like project list with inline actions. | |
| Agent decides | Planner/implementer chooses the best fit. | |

**User's choice:** Use best practices for the type of data displayed.
**Notes:** The context captures a dense operational table for desktop, with responsive adaptation for narrow screens.

---

## The Agent's Discretion

- Exact schema names, validation tooling, form composition, empty states, and copy details.

## Deferred Ideas

- None.
