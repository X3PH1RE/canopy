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
- 2026-10-11T01:14:00+05:30: Added timeline store state and pure sparse-series helpers for LOC lookup, exact final-frame LOC, and recent-change detection.
- 2026-10-11T01:18:00+05:30: Added the bottom TimeSlider UI with play/pause, scrubber, current date display, and a 15-second playback clock.
- 2026-10-11T01:21:00+05:30: Wired timeline frames into building target heights with smooth R3F interpolation and warm pulses for files changed in the last 5 frames.
- 2026-10-11T01:23:00+05:30: Phase 4 acceptance passed on fresh-cache Express: 214 files, 2733 commits, 100 timeline frames, 208 files with change frames, sampled final-frame LOC matched static LOC.
- 2026-10-11T01:30:00+05:30: Phase 4 review fixes: moved controls above the bottom timeline, snapped rendered heights on the final frame, and tightened changed-file pulses to exactly the last 5 frames.
- 2026-10-11T01:36:00+05:30: Started Phase 5 with a plan for dependency lists, road toggles/highlights, search, and camera fly-to. Existing Phase 2 dependency extraction and basic road rendering are being extended rather than replaced.
- 2026-10-11T01:40:00+05:30: Added client dependency graph helpers and InspectPanel imports/imported-by lists with deduped, sorted file entries.
- 2026-10-11T01:43:00+05:30: Added road visibility toggle, lifted dependency arcs, and selected-file road highlighting for incoming and outgoing edges.
- 2026-10-11T01:46:00+05:30: Added file/function search with ranked results and selection wiring that queues camera focus requests.
- 2026-10-11T01:50:00+05:30: Added deterministic camera focus math, SearchBox/InspectPanel focus requests, and smooth OrbitControls fly-to animation.
- 2026-10-11T01:52:00+05:30: Phase 5 acceptance passed on fresh-cache Express: 214 files, 95 dependency edges, dependency lists present, and search returned the expected owning file.
- 2026-10-11T01:57:00+05:30: Phase 5 review fixes: exact function search now outranks broad path substrings, disabled roads skip edge work, and the inspect panel scrolls before reaching the timeline.
- 2026-10-11T02:05:00+05:30: Started Phase 5b with a drone mode plan split into input/world state, collision, proximity, controller, popup/HUD/search glide, then acceptance.
- 2026-10-11T02:08:00+05:30: Added Phase 5b input focus guards and mutable world snapshots for live building boxes/imported-by counts; full tests/typecheck passed.
- 2026-10-11T02:10:00+05:30: Added Phase 5b spatial grid queries and drone collision push-out/sliding helpers; full tests/typecheck passed.
- 2026-10-11T02:12:00+05:30: Added Phase 5b proximity dwell/release timing so nearby building popups can avoid fast-flyby noise; full tests/typecheck passed.
- 2026-10-11T02:17:00+05:30: Added Phase 5b procedural drone, fly toggle, keyboard/mouse movement, collision sliding, and chase camera; full tests/typecheck/build passed.
- 2026-10-11T02:20:00+05:30: Added Phase 5b drone proximity popup, active building highlight, Enter expand, fly HUD, and search glide; full tests/typecheck/build passed.
- 2026-10-11T03:06:00+05:30: Phase 5b acceptance passed: tests 21 files/81 tests, typecheck, build, and browser preview with clean console plus desktop/mobile screenshots. Startup `/api/limits` fetch was removed so sample/preview load stays quiet; analyze still refreshes limits when needed.
- 2026-10-11T03:15:00+05:30: Phase 5b review fixes: orbit focus now ignores fly-mode focus requests, OrbitControls target syncs on fly exit, search glide waits for normal proximity dwell, and UI pointer drags no longer rotate the drone; tests 23 files/84 tests, typecheck, and build passed.
- 2026-10-11T03:16:00+05:30: Completed Phase 5b and made the formal phase commit. One minor remains deferred: spatial grid rebuild frequency during fly mode.
- 2026-10-11T03:18:00+05:30: Started Phase 6 with a cut-list polish plan for nature/solar, legend/shortcuts, loading copy, frosted panels, and district labels.
- 2026-10-11T03:22:00+05:30: Added Phase 6 deterministic instanced trees, roof solar panels, and a light rail pulse ring; tests 24 files/86 tests and typecheck passed.
- 2026-10-11T03:26:00+05:30: Added Phase 6 view legend and focus-safe keyboard shortcuts for 1-4 view modes, roads, and timeline playback; tests 26 files/89 tests, typecheck, and build passed.
- 2026-10-11T03:32:00+05:30: Added Phase 6 seed-to-tree loading copy, district labels, stronger frosted glass panels, and responsive mobile controls; tests 27 files/91 tests, typecheck, build, and browser preview passed with clean console.
- 2026-10-11T03:40:00+05:30: Phase 6 review fixes: complete language legend, repeat-safe shortcuts, live-height solar panels, and mobile legend/timeline spacing; tests 27 files/93 tests, typecheck, build, and browser preview passed with clean console.
- 2026-10-11T03:41:00+05:30: Completed Phase 6 and made the formal phase commit.
- 2026-10-11T03:52:00+05:30: Fixed analyze-route failures caused by stale/local preview routing: preview now proxies `/api`, API 404s explain the server/proxy issue, and failed analyzes keep the existing city visible with an alert.
- 2026-10-11T04:05:00+05:30: GitHub analysis works when the dev server is started with network access; cached analyzed repos are excluded from Vitest so tests never execute code from analyzed repos.
- 2026-10-11T06:29:00+05:30: Upgraded buildings from single boxes to deterministic procedural kits with plinths, facade fins, glass bands, roof caps, and stepped/terraced/slab archetypes. Browser screenshot tooling was unavailable in this session; tests, typecheck, and build passed.

## Commands

- Install dependencies: `pnpm install`
- Start server and web together: `pnpm dev`
- Run tests: `pnpm test`
- Run typechecks: `pnpm typecheck`
- Build packages and web app: `pnpm build`

## Known limitations

- Public GitHub analysis needs network access and a fresh `pnpm dev` server on port 8787; restricted networks can still fail during `git fetch`.
- Phase 5b deferred one polish item: spatial grid rebuild frequency during fly mode.
