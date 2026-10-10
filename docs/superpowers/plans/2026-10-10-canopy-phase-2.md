# Canopy Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Analyze public GitHub repositories into real `CityData` with basic metrics, caching, jobs, rate limiting, and web API wiring.

**Architecture:** The server owns all unsafe boundaries: URL validation, git clone/fetch via argument-array `spawn`, file walking with caps, metric parsing, dependency extraction, layout, cache, jobs, and rate limiting. The web app talks only to the Canopy API and still keeps the bundled sample as the fallback. Each backend subsystem is pure or dependency-injected where possible so Vitest can cover behavior without cloning public repos.

**Tech Stack:** TypeScript strict mode, pnpm workspaces, Fastify, zod, system `git`, d3-hierarchy, Vite + React 18, Zustand, React Three Fiber, Vitest.

**Spec:** `C:\Users\ashwi\.codex\attachments\ab2f18fa-b603-423f-89c5-fb7f15a9b3d4\Pasted text.txt`

## Global Constraints

- Work in order and do not start Phase 3 until Phase 2 acceptance checks pass.
- Use the exact stack and file layout from the project spec.
- Do not execute analyzed repository code. Only read files and run `git` commands.
- Shared types live in `packages/shared/src/types.ts`.
- Keep the app runnable after every checkpoint.
- If a dependency is added, record why in `NOTES.md`.
- Make interval commits for coherent Phase 2 slices, then finish with `phase 2: analyze real repos`.

## Review Focus

- URL safety: invalid, private, or non-GitHub URLs must fail clearly without consuming rate-limit slots.
- Rate limits: cache hits and invalid URLs must not consume slots; the third fresh build with defaults must return 429.
- Repo safety: cloning/walking must never run scripts, install hooks, or shell-interpolate user input.
- File limits: binary, huge, vendored, lock, and invalid UTF-8 files must be skipped; oversized repos must truncate predictably.
- Job states: errors, progress stages, and cached results must be visible through API and UI without breaking the sample fallback.

---

### Task 1: Config And Rate Limiter

**Files:**
- Create: `apps/server/src/config.ts`
- Create: `apps/server/src/rateLimit.ts`
- Create: `apps/server/src/rateLimit.test.ts`
- Create: `apps/server/.env.example`
- Modify: `apps/server/package.json`
- Modify: `apps/server/src/routes.ts`
- Modify: `apps/server/src/index.ts`
- Modify: `NOTES.md`

**Interfaces:**
- Produces: `loadConfig(env?: NodeJS.ProcessEnv): AppConfig`
- Produces: `createRateLimiter(options): RateLimiter`
- Produces: `GET /api/limits`

- [x] **Step 1: Write failing config and limiter tests**

Add tests for disabled flag, max/window behavior, independent clients, retry-after, and invalid env values naming the variable.

- [x] **Step 2: Run tests to verify failure**

Run: `pnpm.cmd --filter @canopy/server test -- src/rateLimit.test.ts`
Expected: FAIL because `config.ts` and `rateLimit.ts` do not exist.

- [x] **Step 3: Implement config and limiter**

Use zod for env parsing. Use an injectable clock and in-memory sliding window log.

- [x] **Step 4: Wire `/api/limits` and Fastify trust proxy**

Load config in `index.ts`, pass it to `buildServer`, and return disabled or current anonymous client limit state.

- [x] **Step 5: Verify and checkpoint**

Run `pnpm.cmd --filter @canopy/server test -- src/rateLimit.test.ts`, `pnpm.cmd test`, `pnpm.cmd typecheck`, and commit `wip: phase 2 rate limiting`.

### Task 2: Safe Git Clone, Cache, And File Walk

**Files:**
- Create: `apps/server/src/clone.ts`
- Create: `apps/server/src/cache.ts`
- Create: `apps/server/src/walk.ts`
- Create: `apps/server/src/walk.test.ts`
- Modify: `NOTES.md`

**Interfaces:**
- Produces: `normalizeRepoUrl(repoUrl: string): NormalizedRepo`
- Produces: `cloneOrFetchRepo(repoUrl: string, cacheRoot: string): Promise<CloneResult>`
- Produces: `walkRepoFiles(repoDir: string, options?: WalkOptions): Promise<WalkResult>`
- Produces: JSON cache helpers for `CityData`

- [x] **Step 1: Write failing walk and URL tests**
- [x] **Step 2: Implement validation and safe git process helpers**
- [x] **Step 3: Implement file filtering, UTF-8 read, LOC cap, and truncation**
- [x] **Step 4: Verify and checkpoint**

Run `pnpm.cmd --filter @canopy/server test -- src/walk.test.ts`, `pnpm.cmd test`, `pnpm.cmd typecheck`, and commit `wip: phase 2 repo walking`.

### Task 3: Basic Metrics, Imports, And City Build

**Files:**
- Create: `apps/server/src/parse.ts`
- Create: `apps/server/src/parse.test.ts`
- Create: `apps/server/src/imports.ts`
- Create: `apps/server/src/imports.test.ts`
- Create: `apps/server/src/build.ts`
- Create: `apps/server/src/build.test.ts`
- Modify: `apps/server/package.json`
- Modify: `NOTES.md`

**Interfaces:**
- Produces: `analyzeTextFile(file): ParsedFileMetrics`
- Produces: `extractDependencyEdges(files): Edge[]`
- Produces: `buildCity(repo): Promise<CityData>`

- [x] **Step 1: Write failing parser/import/build tests**
- [x] **Step 2: Implement fallback metrics first**
- [x] **Step 3: Add tree-sitter-backed parsing where available, falling back per file**
- [x] **Step 4: Implement relative import edges**
- [x] **Step 5: Assemble `CityData` with layout**
- [x] **Step 6: Verify and checkpoint**

Run parser/import/build tests, `pnpm.cmd test`, `pnpm.cmd typecheck`, and commit `wip: phase 2 basic analysis`.

### Task 4: Jobs, Analyze Routes, And Cache Hits

**Files:**
- Create: `apps/server/src/jobs.ts`
- Modify: `apps/server/src/routes.ts`
- Modify: `apps/server/src/routes.test.ts`
- Modify: `NOTES.md`

**Interfaces:**
- Produces: `POST /api/analyze`
- Produces: `GET /api/jobs/:id`
- Produces: `GET /api/city/:id`

- [x] **Step 1: Write failing route tests for validation, job lifecycle, cache hit, and 429**
- [x] **Step 2: Implement in-memory job queue and route wiring**
- [x] **Step 3: Apply limiter after validation and cache check**
- [x] **Step 4: Verify and checkpoint**

Run route tests, `pnpm.cmd test`, `pnpm.cmd typecheck`, and commit `wip: phase 2 analyze api`.

### Task 5: Web API Wiring And Progress UI

**Files:**
- Create: `apps/web/src/ui/ProgressOverlay.tsx`
- Modify: `apps/web/src/api.ts`
- Modify: `apps/web/src/store.ts`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/ui/UrlBar.tsx`
- Modify: `apps/web/src/ui/Toolbar.tsx`
- Modify: `apps/web/src/styles.css`
- Modify: `README.md`
- Modify: `NOTES.md`

**Interfaces:**
- Produces: URL submission, polling, city loading, limits note, and friendly 429 panel.

- [x] **Step 1: Add typed API client tests where pure helpers exist**
- [x] **Step 2: Wire URL form and sample fallback**
- [x] **Step 3: Add progress overlay and rate-limit note**
- [x] **Step 4: Add language color view mode control**
- [x] **Step 5: Verify and final phase commit**

Run `pnpm.cmd test`, `pnpm.cmd typecheck`, `pnpm.cmd build`, manual API checks, and commit `phase 2: analyze real repos`.

## Acceptance Evidence

- 2026-10-11T00:29+05:30: `pnpm.cmd test` passed 11 files / 38 tests.
- 2026-10-11T00:29+05:30: `pnpm.cmd typecheck` passed all workspace packages.
- 2026-10-11T00:29+05:30: `pnpm.cmd build` passed; Vite emitted only the existing large chunk warning.
- 2026-10-11T00:30+05:30: Fresh-cache analysis completed `expressjs/express` in 6901 ms with 214 files, 95 edges, and 20866 LOC.
- 2026-10-11T00:30+05:30: Fresh-cache analysis completed `pallets/flask` in 10275 ms with 227 files, 90 edges, and 25979 LOC.
- 2026-10-11T00:31+05:30: API injection verified invalid URL 400, cache hit without extra analyzer call, default third fresh build 429 with `Retry-After`, disabled limits response, and invalid `RATE_LIMIT_MAX` startup error naming the variable.
