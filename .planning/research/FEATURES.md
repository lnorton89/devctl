# Feature Research: devctl

## Table Stakes

- Project registry with name, path, start command, stop strategy, port, health URL, environment variables, and autostart flag.
- Lifecycle controls: start, stop, restart, and open app URL.
- Live status: stopped, starting, running, unhealthy, stopping, failed.
- Log viewer with recent output per project.
- Boot automation: start selected projects when devctl starts.
- Failure visibility: command errors, missing paths, occupied ports, and unhealthy checks shown in the UI.
- Configuration export or backup path for local durability.

## Differentiators

- Project groups or profiles such as "workday", "client A", or "frontend only".
- Dependency ordering between projects.
- Schedule-based start/stop windows.
- Resource view showing ports, CPU, memory, and recent restarts.
- One-click open terminals or project folders.

## v1 Recommendation

Focus v1 on reliable registry, lifecycle control, status, logs, autostart, and Docker boot integration. Defer profiles, dependency graphs, scheduling, and resource analytics until the core loop is proven.
