# Canopy notes

## Decisions

- 2026-10-10T21:34:26+05:30: Started Phase 0 from the provided Canopy spec and the hackathon scaffold.
- 2026-10-10T21:34:26+05:30: Used `pnpm.cmd` on Windows because PowerShell blocks the `pnpm.ps1` shim under the current execution policy.
- 2026-10-10T21:34:26+05:30: Pinned TypeScript to the 5.x line because `latest` resolved to TypeScript 7.0.2, whose removed `baseUrl` option broke the simple workspace alias setup.
- 2026-10-10T21:34:26+05:30: Pinned React, Vite, Vitest, and related types instead of using `latest` so the scaffold stays aligned with React 18 and Node 20.19+.
- 2026-10-10T21:34:26+05:30: App package typechecks include `packages/shared/src` directly for Phase 0. This avoids declaration build ordering until the monorepo has more real code.
- 2026-10-10T21:34:26+05:30: Server dev compiles to CommonJS before running with Node because `tsx` calls `os.userInfo()`, which fails in this Windows execution environment before app code loads.
- 2026-10-10T21:34:26+05:30: Vite and Vitest scripts use `--configLoader native` because the bundled config loader tries to read above the workspace in this sandbox.
- 2026-10-10T21:34:26+05:30: pnpm uses `node-linker=hoisted` for this repo because Vite's dev optimizer could not resolve React's CommonJS files through the default pnpm symlink layout in this sandbox.
- 2026-10-10T21:34:26+05:30: Vite dev disables dependency optimization because the optimizer tries to read above the workspace in this sandbox. Vite prints a warning recommending `noDiscovery`, but that setting did not stop the failing optimizer path here.
- 2026-10-10T22:30:32+05:30: Renamed the project identity from Code City to Canopy across package names, imports, docs, UI text, and sample metadata.
- 2026-10-10T22:30:32+05:30: Phase 1 is partially implemented: deterministic layout, fake city generation, sample JSON, and the initial web data-loading shell are in place. The 3D scene remains next.

## Commands

- Install dependencies: `pnpm install`
- Start server and web together: `pnpm dev`
- Run tests: `pnpm test`
- Run typechecks: `pnpm typecheck`
- Build packages and web app: `pnpm build`

## Known limitations

- `pnpm dev` starts successfully, but Vite prints an optimizer warning because dependency optimization is disabled for this sandbox.
