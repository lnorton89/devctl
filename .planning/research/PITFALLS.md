# Pitfalls Research: devctl

## Pitfalls

### Container cannot control host projects clearly

Warning signs: commands work outside Docker but fail inside; paths differ; processes die when container restarts.

Prevention: make host mounts, working directories, shell behavior, and persistence explicit in docker compose and docs.

### Status lies to the user

Warning signs: UI says running when port is dead, or failed processes remain green.

Prevention: combine child process state, port probing, health checks, and recent errors into explicit statuses.

### Logs grow without bound

Warning signs: long-running dev servers consume disk or memory.

Prevention: bounded in-memory buffers for UI and optional capped persisted history.

### Stop behavior is inconsistent

Warning signs: orphaned child processes, occupied ports after stop, Windows-specific shutdown failures.

Prevention: define stop strategy per project, test on Windows, and surface when graceful stop falls back or fails.

### UI becomes too decorative for operations

Warning signs: large hero sections, too much whitespace, hidden controls.

Prevention: design as a compact operational console with clear tables, status chips, logs, and direct controls.
