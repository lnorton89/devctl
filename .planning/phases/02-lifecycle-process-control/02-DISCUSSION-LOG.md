# Phase 2: Lifecycle Process Control - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-29
**Phase:** 02-lifecycle-process-control
**Areas discussed:** Project Creation Model, Execution Model, Lifecycle API, Logs

---

## Project Creation Model

| Option | Description | Selected |
|--------|-------------|----------|
| Remove old fields | Simplify: drop hostPath/containerPath, appUrl, port, healthUrl, envFilePath, env, autostart | |
| Keep but deprioritize | Don't remove, just hide from creation/edit UI | ✓ |

**User's choice:** Keep but deprioritize
**Notes:** Old fields stay in schema and YAML but are hidden from the form. The new creation flow is path+script driven.

---

## Directory Picker

| Option | Description | Selected |
|--------|-------------|----------|
| Text input + browse button | User types or browses to select path | ✓ |
| Text input only | Manual path entry only | |

**User's choice:** Text input + browse button

---

## Scripts Per Project

| Option | Description | Selected |
|--------|-------------|----------|
| One script per project | Pick one script from package.json, simpler lifecycle | ✓ |
| Multiple scripts per project | Check multiple, each with independent state/logs | |

**User's choice:** One script per project (simpler)

---

## Execution Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Fix creation + execution (full) | Update form, build execution engine, API, logs | ✓ |
| Just creation fix | Only update form and parser | |
| Just execution + logs | Build execution but keep old form | |

**User's choice:** Full — creation fix, execution engine, lifecycle API, and logs

---

## Claude's Discretion

- Ring buffer size for log capture
- Exact status endpoint response shape
- Browse button implementation

## Deferred Ideas

None — discussion stayed within phase scope.
