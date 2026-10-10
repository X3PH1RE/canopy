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
- 2026-10-10T22:45:53+05:30: Completed Phase 1 with a static React Three Fiber city from generated sample data, including orbit controls, hover state, click selection, and a minimal inspect panel.
- 2026-10-10T22:45:53+05:30: Kept Vite dependency optimization enabled for dev and moved its cache into the workspace. Disabling the optimizer made R3F/Zustand load raw CommonJS React modules in the browser; preserving symlinks caused esbuild to attempt reads outside the workspace.
- 2026-10-10T22:45:53+05:30: Scene objects use the layout's centered `x`/`z` coordinates directly. The renderer derives ground size from city bounds instead of assuming a separate world size.
- 2026-10-10T23:13:34+05:30: Started Phase 2 with a plan split into interval commits: rate limiting/config, safe repo walking, metrics/build, analyze routes, then web progress UI.
- 2026-10-10T23:13:34+05:30: Added `zod` for Phase 2 environment validation because the spec requires typed env parsing and startup failures for invalid values.
- 2026-10-10T23:22:07+05:30: Added safe GitHub URL normalization, argument-array `git` process helpers with prompts disabled, JSON cache helpers, and repo file walking that filters vendored/media/lock/binary/oversize files.
- 2026-10-10T23:26:36+05:30: Added fallback metric parsing, relative JS/TS/Python import edges, and `CityData` assembly from walked files. Tree-sitter parsing is still pending inside Phase 2.
- 2026-10-10T23:31:49+05:30: Added in-memory analyze jobs and API routes for `POST /api/analyze`, `GET /api/jobs/:id`, and `GET /api/city/:id`; tests use an injected analyzer so unit tests never clone public repos.
- 2026-10-10T23:36:09+05:30: Wired the web URL bar to the analyze API with job polling, `/api/limits`, Vite dev proxying, progress overlay, and friendly rate-limit panel.
- 2026-10-11T00:27:00+05:30: Pinned `web-tree-sitter@0.25.10` with `tree-sitter-wasms@0.1.13` for Phase 2 because newer `web-tree-sitter@0.26.x` has a known ABI mismatch with the WASM package. Added `@types/emscripten@1.41.6` for strict TypeScript declarations.
- 2026-10-11T00:27:00+05:30: Switched real city assembly to tree-sitter-backed metrics for TS/JS/Python/Go/Java when grammar loading succeeds, with per-file fallback to heuristics.
- 2026-10-11T00:31:00+05:30: Phase 2 acceptance passed: Express fresh-cache analysis 6.9s, Flask 10.3s, cache hits and rate-limit behavior verified by Fastify injection.
- 2026-10-11T00:40:00+05:30: Started Phase 3 and added the capped single-pass git history parser/summary builder for churn inputs and timeline samples.
- 2026-10-11T00:46:00+05:30: Added percentile-based risk scoring and wired git history into `CityData` assembly for commit counts, authors, churn, last modified dates, timeline, and risk.
- 2026-10-11T00:52:00+05:30: Added Language, Churn, Complexity, and Risk view modes with solarpunk ramps, emissive hot buildings, and richer inspect history metrics.
- 2026-10-11T00:57:00+05:30: Phase 3 live checks passed: Express history parse 1.8s with 2733 commits/355 authors, Flask history parse 3.0s with 5000 capped commits/827 authors, both with timeline frames and non-zero risk/churn subsets.
- 2026-10-11T01:03:00+05:30: Review fix: all-zero churn view now stays at the low sunlight ramp with no glow; added empty/malformed history parser coverage.
- 2026-10-11T01:12:00+05:30: Started Phase 4 with client-side timeline playback. Phase 3 already emits timeline data, so Phase 4 focuses on UI, live heights, smooth interpolation, and changed-file pulses.

## Commands

- Install dependencies: `pnpm install`
- Start server and web together: `pnpm dev`
- Run tests: `pnpm test`
- Run typechecks: `pnpm typecheck`
- Build packages and web app: `pnpm build`

## Known limitations

- The city currently renders generated sample data only. Real public GitHub repository analysis starts in Phase 2.
- Phase 3 live checks pass for Express and Flask. Phase 4 timeline playback is in progress.
