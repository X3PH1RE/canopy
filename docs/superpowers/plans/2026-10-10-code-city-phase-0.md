# Code City Phase 0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Phase 0 foundation for Code City: a pnpm TypeScript workspace with shared types, a Fastify health server, a Vite React shell, documentation, and runnable checks.

**Architecture:** The repository is a pnpm workspace with one shared package and two apps. `packages/shared` owns the CityData contract; `apps/server` owns HTTP startup and exports a testable Fastify builder; `apps/web` owns the blank desktop shell and imports a shared type.

**Tech Stack:** TypeScript strict mode, pnpm workspaces, Fastify, Vite, React 18, Vitest, tsx.

**Spec:** `C:\Users\ashwi\.codex\attachments\ab2f18fa-b603-423f-89c5-fb7f15a9b3d4\Pasted text.txt`

## Global Constraints

- Build project implementation from scratch at the event.
- Use the exact stack defined for Code City Phase 0: TypeScript, pnpm workspaces, Vite + React 18, Fastify, and Vitest.
- TypeScript strict mode everywhere.
- Shared types live in `packages/shared/src/types.ts` and are imported by both server and web.
- Keep dependencies few and purposeful.
- Never execute code from analyzed repositories; Phase 0 does not analyze external repositories.
- Keep the app runnable.
- Update `CHANGELOG.md`, `README.md`, and `AI_USAGE.md` for meaningful changes.

## Review Focus

- Missing workspace package references should fail during `pnpm typecheck`; Task 1 pins workspace names and TypeScript references.
- The health endpoint should return only `{ ok: true }`; Task 2 tests the Fastify route with `server.inject`.
- The web app must import a type from shared without runtime coupling; Task 3 verifies typechecking and a production build.
- Generated output and cache folders must stay out of git; Task 4 records ignore entries.
- Setup instructions must match actual commands; Task 4 updates docs after commands exist.

---

### Task 1: Workspace And Shared Contract

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `vitest.config.mjs`
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/types.ts`
- Create: `packages/shared/src/index.ts`
- Create: `packages/shared/src/types.test.ts`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `@code-city/shared` package exporting `CityData`, `FileNode`, `FunctionInfo`, `District`, `Edge`, and `Timeline`.
- Consumes: No earlier task outputs.

- [ ] **Step 1: Write the failing shared contract test**

Create `packages/shared/src/types.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { CityData } from "./types";

describe("CityData contract", () => {
  it("accepts a minimal valid city data object", () => {
    const city = {
      version: 1,
      repo: {
        url: "https://github.com/example/repo",
        name: "example/repo",
        headSha: "abc123",
        analyzedAt: "2026-10-10T16:00:00.000Z",
        truncated: false,
      },
      stats: {
        fileCount: 0,
        totalLoc: 0,
        commitCount: 0,
        authorCount: 0,
        languages: {},
      },
      files: [],
      districts: [],
      edges: [],
      timeline: null,
    } satisfies CityData;

    expect(city.version).toBe(1);
    expect(city.timeline).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @code-city/shared typecheck`
Expected: FAIL because pnpm dependencies or the shared type module are not present yet.

- [ ] **Step 3: Add workspace configuration and shared types**

Create the files listed above. In `types.ts`, copy the CityData contract from the spec exactly, using exported TypeScript interfaces.

- [ ] **Step 4: Run shared checks**

Run: `pnpm --filter @code-city/shared test`
Expected: PASS.

Run: `pnpm --filter @code-city/shared typecheck`
Expected: PASS.

### Task 2: Fastify Health Server

**Files:**
- Create: `apps/server/package.json`
- Create: `apps/server/tsconfig.json`
- Create: `apps/server/src/index.ts`
- Create: `apps/server/src/routes.ts`
- Create: `apps/server/src/routes.test.ts`

**Interfaces:**
- Consumes: `@code-city/shared` type export.
- Produces: `buildServer(): FastifyInstance` and `GET /api/health -> { ok: true }`.

- [ ] **Step 1: Write the failing route test**

Create `apps/server/src/routes.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildServer } from "./routes";

describe("health route", () => {
  it("returns ok true", async () => {
    const server = buildServer();
    const response = await server.inject({ method: "GET", url: "/api/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ ok: true });

    await server.close();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @code-city/server test`
Expected: FAIL because `buildServer` is not implemented.

- [ ] **Step 3: Implement the server**

`routes.ts` exports `buildServer`, registers `/api/health`, and references a shared type to prove server can import shared. `index.ts` starts the server on `PORT` or `8787`.

- [ ] **Step 4: Run server checks**

Run: `pnpm --filter @code-city/server test`
Expected: PASS.

Run: `pnpm --filter @code-city/server typecheck`
Expected: PASS.

### Task 3: Vite Web Shell

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/tsconfig.node.json`
- Create: `apps/web/index.html`
- Create: `apps/web/src/main.tsx`
- Create: `apps/web/src/App.tsx`
- Create: `apps/web/src/styles.css`
- Create: `apps/web/src/vite-env.d.ts`
- Create: `apps/web/vite.config.mjs`

**Interfaces:**
- Consumes: `@code-city/shared` type export.
- Produces: Vite app on port `5173` with a blank dark page that imports a shared type.

- [ ] **Step 1: Write the failing web app import**

Create `apps/web/src/App.tsx` with a `CityData` type import and a minimal component. Before the package files exist, `pnpm typecheck --filter @code-city/web` should fail.

- [ ] **Step 2: Run typecheck to verify it fails**

Run: `pnpm --filter @code-city/web typecheck`
Expected: FAIL because the web package is not configured.

- [ ] **Step 3: Add Vite React shell**

Create the files listed above. The app renders a blank dark full-screen shell and keeps visible text minimal.

- [ ] **Step 4: Run web checks**

Run: `pnpm --filter @code-city/web typecheck`
Expected: PASS.

Run: `pnpm --filter @code-city/web build`
Expected: PASS.

### Task 4: Documentation, Dev Script, And Phase Commit

**Files:**
- Create: `NOTES.md`
- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Modify: `AI_USAGE.md`
- Modify: `AGENTS.md`
- Modify: root `package.json`

**Interfaces:**
- Consumes: working package scripts from Tasks 1-3.
- Produces: `pnpm dev` starts server and web together; docs describe current Phase 0 setup and checks.

- [ ] **Step 1: Add root scripts**

Root `package.json` includes `dev`, `test`, `typecheck`, and `build` scripts using `pnpm -r`.

- [ ] **Step 2: Update docs**

Update README setup and status, replace AI usage placeholder with the Phase 0 Codex entry, add a changelog entry with the actual timestamp, and replace `AGENTS.md` with the Code City section 0 agent rules from the pasted spec.

- [ ] **Step 3: Run Phase 0 verification**

Run: `pnpm test`
Expected: PASS.

Run: `pnpm typecheck`
Expected: PASS.

Run: `pnpm build`
Expected: PASS.

Run: start `pnpm dev`, then request `http://localhost:8787/api/health`.
Expected: response body is `{ "ok": true }`, and Vite reports local server on port `5173`.

- [ ] **Step 4: Commit**

Run:

```bash
git add package.json pnpm-workspace.yaml tsconfig.base.json vitest.config.ts .gitignore AGENTS.md README.md CHANGELOG.md AI_USAGE.md NOTES.md docs/superpowers/plans/2026-10-10-code-city-phase-0.md packages apps
git commit -m "phase 0: scaffold workspace"
```
