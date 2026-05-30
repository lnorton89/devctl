---
quick_id: 260530-grq
status: planned
created: 2026-05-30
---

# Quick Task: Implement Aurora Theme

Implement a Material UI theme inspired by the Aurora account page at https://aurora.themewagon.com/pages/account.

## Scope

- Translate Aurora's light theme tokens into `src/client/theme.ts`.
- Preserve devctl's dense operational dashboard behavior.
- Load the Aurora font stack through npm-managed font packages.
- Verify with TypeScript/build checks.

## Tasks

1. Replace the existing neutral dashboard theme with Aurora-derived palette, typography, shape, shadows, and component overrides.
2. Import Plus Jakarta Sans and Spline Sans Mono from `@fontsource` packages.
3. Run build/type checks and create a quick-task summary.
