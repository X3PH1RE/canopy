# Canopy Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render a static 3D Canopy from generated fake `CityData`, with deterministic layout, solarpunk scene styling, orbit controls, hover highlight, click selection, and a minimal inspect panel.

**Architecture:** The server package owns deterministic fake data generation and pure treemap layout helpers so they can be tested without rendering. The web package consumes `public/samples/fake.json` and renders a React Three Fiber scene with focused scene and UI components. The UI remains a desktop-first tool surface, not a landing page.

**Tech Stack:** TypeScript strict mode, pnpm workspaces, Vitest, d3-hierarchy, Vite + React 18, three, @react-three/fiber, @react-three/drei, @fontsource/fraunces, @fontsource/dm-sans.

**Spec:** `C:\Users\ashwi\.codex\attachments\ab2f18fa-b603-423f-89c5-fb7f15a9b3d4\Pasted text.txt`

## Global Constraints

- Work in order and do not start Phase 2 until Phase 1 acceptance checks pass.
- Use the exact stack from the spec unless truly blocked.
- TypeScript strict mode everywhere.
- Shared types live in `packages/shared/src/types.ts`.
- Keep the app runnable.
- Never execute code from analyzed repositories. Phase 1 uses only generated fake data.
- Update `CHANGELOG.md`, `README.md`, `AI_USAGE.md`, and `NOTES.md` for this meaningful change.
- Commit after the completed milestone with `phase 1: render static city`, then push.

## Review Focus

- Layout overlap: Task 1 tests sibling buildings do not overlap and all rectangles stay within the world bounds.
- Determinism: Task 1 and Task 2 tests verify repeated layout and fake-data generation return stable values for the same seed.
- Fake data shape: Task 2 tests verify `CityData` ids, district bounds, edges, and stats are internally consistent.
- Missing sample data: Task 3 renders a clear loading/error state if `public/samples/fake.json` cannot load.
- 3D interaction: Task 4 manually verifies hover and click selection in the browser because pointer picking is renderer-bound.

---

## Design Plan

**Color tokens**
- `skyTop #9dd8cf`: pale teal morning sky.
- `skyBottom #f8d99b`: warm golden haze.
- `ground #4f8f64`: mossy district plates.
- `timber #d8b77c`: warm building body.
- `glass #8fd3c8`: translucent rooftop and rail accents.
- `ink #18322f`: quiet UI text on frosted panels.

**Type**
- Fraunces for file names and primary metrics, matching the organic city metaphor.
- DM Sans for compact interface controls and readable metrics.

**Layout**
```text
+-------------------------------------------------------------+
| URL bar placeholder / sample chip / stats banner             |
|-------------------------------------------------------------|
|                                                             |
|                    full-screen 3D city scene                 |
|                                                             |
|                                      +------------------+   |
|                                      | Inspect panel    |   |
|                                      +------------------+   |
+-------------------------------------------------------------+
```

The scene is full-bleed and utilitarian; panels are overlays, not nested cards. The first viewport is the city itself.

**Principles**
- Spend visual personality in the city: warm light, mossy districts, timber/glass buildings, soft fog.
- Keep UI sparse and operational so judges focus on orbiting and selecting buildings.
- Use stable dimensions for overlay panels and interaction states so metrics do not shift the layout.

Self-critique: This follows the spec's solarpunk direction rather than the generic dark SaaS-card default. The UI is deliberately quiet; the memorable element is the rendered city.

---

### Task 1: Deterministic Treemap Layout

**Files:**
- Create: `apps/server/src/layout.ts`
- Create: `apps/server/src/layout.test.ts`
- Modify: `apps/server/package.json`

**Interfaces:**
- Consumes: `FileNode` and `District` from `@canopy/shared`.
- Produces: `layoutCity(files: LayoutInputFile[], options?: LayoutOptions): LayoutResult` where `LayoutInputFile` is `{ path: string; loc: number; functionCount: number }`, `LayoutOptions` is `{ size?: number; padding?: number }`, and `LayoutResult` is `{ files: LayoutFile[]; districts: District[] }`.

- [x] **Step 1: Write failing layout tests**

Add tests for deterministic output, no overlapping file rectangles, and district bounds covering their children.

- [x] **Step 2: Run tests to verify failure**

Run: `pnpm --filter @canopy/server test -- src/layout.test.ts`
Expected: FAIL because `layoutCity` does not exist.

- [x] **Step 3: Implement layout**

Use `d3-hierarchy` treemap with stable path sorting, square world bounds, and small padding. Treat building area as `functionCount + 2`.

- [x] **Step 4: Verify layout**

Run: `pnpm --filter @canopy/server test -- src/layout.test.ts`
Expected: PASS.

### Task 2: Fake City Generator And Sample JSON

**Files:**
- Create: `apps/server/src/fakeCity.ts`
- Create: `apps/server/src/fakeCity.test.ts`
- Create: `apps/server/scripts/makeFake.mjs`
- Create: `apps/web/public/samples/fake.json`
- Modify: `apps/server/package.json`

**Interfaces:**
- Consumes: `layoutCity`.
- Produces: `makeFakeCity(seed?: number): CityData` and `pnpm --filter @canopy/server make:fake`.

- [x] **Step 1: Write failing fake-data tests**

Test that `makeFakeCity(42)` creates about 300 files, stable first paths, valid ids, matching stats, at least one edge, and non-empty districts.

- [x] **Step 2: Run tests to verify failure**

Run: `pnpm --filter @canopy/server test -- src/fakeCity.test.ts`
Expected: FAIL because `makeFakeCity` does not exist.

- [x] **Step 3: Implement fake-data generation**

Use a seeded random generator, realistic folder families, language spread, metrics, simple relative dependency edges, and call `layoutCity`.

- [x] **Step 4: Generate the sample**

Run: `pnpm --filter @canopy/server make:fake`
Expected: creates `apps/web/public/samples/fake.json`.

- [x] **Step 5: Verify fake data**

Run: `pnpm --filter @canopy/server test -- src/fakeCity.test.ts`
Expected: PASS.

### Task 3: Web State, API Loader, And UI Shell

**Files:**
- Create: `apps/web/src/api.ts`
- Create: `apps/web/src/store.ts`
- Create: `apps/web/src/theme.ts`
- Create: `apps/web/src/ui/UrlBar.tsx`
- Create: `apps/web/src/ui/InspectPanel.tsx`
- Create: `apps/web/src/ui/Toolbar.tsx`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`

**Interfaces:**
- Consumes: `CityData`.
- Produces: `loadSampleCity(): Promise<CityData>` and a zustand store with `city`, `selectedId`, `hoveredId`, and setter actions.

- [x] **Step 1: Write the loader before implementation**

Create `api.ts` with the intended exported signature and import it from `App.tsx`; typecheck should fail before the function exists.

- [x] **Step 2: Run typecheck to verify failure**

Run: `pnpm --filter @canopy/web typecheck`
Expected: FAIL while the loader/store files are incomplete.

- [x] **Step 3: Implement loader, store, and UI shell**

Load `/samples/fake.json`, render URL/sample toolbar, stats banner, and an inspect panel for selected buildings.

- [x] **Step 4: Verify web shell**

Run: `pnpm --filter @canopy/web typecheck`
Expected: PASS.

### Task 4: 3D City Scene

**Files:**
- Create: `apps/web/src/scene/City.tsx`
- Create: `apps/web/src/scene/Buildings.tsx`
- Create: `apps/web/src/scene/Districts.tsx`
- Create: `apps/web/src/scene/Roads.tsx`
- Create: `apps/web/src/scene/CameraRig.tsx`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`
- Modify: `apps/web/package.json`

**Interfaces:**
- Consumes: city/store state from Task 3.
- Produces: full-screen Canvas with district plates, instanced-like building meshes, simple roads, orbit controls, hover highlighting, and click selection.

- [x] **Step 1: Add scene imports before dependencies**

Import `City` from `App.tsx` and run typecheck to confirm missing scene/dependencies fail.

- [x] **Step 2: Install 3D dependencies**

Run: `pnpm install` after adding pinned dependencies to `apps/web/package.json`: `three`, `@react-three/fiber`, `@react-three/drei`, `zustand`, `@fontsource/fraunces`, `@fontsource/dm-sans`.

- [x] **Step 3: Implement scene components**

Map file height as `Math.max(0.3, Math.log2(loc + 1) * 1.2)`, color by language, show district plates, roads, sky/fog/lights, and orbit controls.

- [x] **Step 4: Verify app build**

Run: `pnpm test`, `pnpm typecheck`, and `pnpm build`.
Expected: PASS.

### Task 5: Documentation, Browser Smoke Test, Commit, And Push

**Files:**
- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Modify: `AI_USAGE.md`
- Modify: `NOTES.md`

**Interfaces:**
- Consumes: completed Phase 1 app.
- Produces: updated docs and commit `phase 1: render static city`.

- [x] **Step 1: Browser smoke test**

Run `pnpm dev`, open `http://localhost:5173`, verify the page returns HTTP 200, the canvas mounts, and `/api/health` returns `{ "ok": true }`.

- [x] **Step 2: Update docs**

Record implemented Phase 1 behavior, validation commands, dependencies, and known limitations.

- [x] **Step 3: Final verification**

Run: `pnpm test`, `pnpm typecheck`, `pnpm build`.
Expected: PASS.

- [x] **Step 4: Commit and push**

Run:

```bash
git add .
git commit -m "phase 1: render static city"
git push origin main
```
