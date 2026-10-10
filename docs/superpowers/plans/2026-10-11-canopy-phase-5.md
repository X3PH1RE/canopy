# Canopy Phase 5 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add usable dependency roads, dependency lists, fuzzy search, and camera fly-to so users can navigate from code relationships to the right building.

**Architecture:** Server dependency extraction already emits `edges`, so Phase 5 focuses on client-side graph indexing, road visibility/highlighting, search indexing over file paths and functions, and an imperative camera target store consumed by `CameraRig`. Pure helper modules carry the test coverage; React components stay thin and match the existing solarpunk control surface.

**Tech Stack:** TypeScript strict mode, pnpm workspaces, Vite + React 18, Zustand, React Three Fiber, Drei `Line`/`OrbitControls`, Vitest. No new dependencies.

**Spec:** `C:\Users\ashwi\.codex\attachments\ab2f18fa-b603-423f-89c5-fb7f15a9b3d4\Pasted text.txt`

## Global Constraints

- Work in order and do not start Phase 5b until Phase 5 acceptance checks pass.
- Use the exact stack and file layout from the project spec.
- Never execute analyzed repository code; only read files and run `git` commands.
- Shared types live in `packages/shared/src/types.ts`.
- Keep the app runnable after every checkpoint.
- If a dependency is added, record why in `NOTES.md`; Phase 5 should add no dependencies.
- Make interval commits for coherent Phase 5 slices, then finish with `phase 5: add search roads fly-to`.

## Review Focus

- Edge direction: `from` means selected file imports `to`; imported-by lists must invert this correctly.
- Empty graphs: repos with no edges must hide dependency sections gracefully and keep road rendering cheap.
- Search ranking: exact path/function matches should rank before broad substring matches, and selecting a result must choose the correct file id.
- Camera fly-to: focus requests must move both camera and orbit target without replacing the user's selected building unexpectedly.
- Road performance: roads must be toggleable and capped/highlighted so dense repos do not drown the scene.

---

### Task 1: Dependency Graph Helpers And Inspect Lists

**Files:**
- Create: `apps/web/src/graph.ts`
- Create: `apps/web/src/graph.test.ts`
- Modify: `apps/web/src/ui/InspectPanel.tsx`
- Modify: `apps/web/src/styles.css`
- Modify: `NOTES.md`

**Interfaces:**
- Produces: `buildDependencyIndex(city: CityData): DependencyIndex`
- Produces: `dependenciesForFile(city, fileId, index): { imports: FileNode[]; importedBy: FileNode[] }`

- [ ] **Step 1: Write failing graph tests**

Assert imports use `edge.from === selectedId`, imported-by uses `edge.to === selectedId`, duplicate/weighted edges do not duplicate list entries, missing file ids are ignored, and stable ordering is by path.

- [ ] **Step 2: Run focused test to verify failure**

Run: `pnpm.cmd --filter @canopy/web test -- src/graph.test.ts`
Expected: FAIL because `graph.ts` does not exist.

- [ ] **Step 3: Implement graph helpers**

Build `importsByFile` and `importedByFile` maps from `CityData.edges`, dedupe by file id, ignore missing endpoints, and sort results by path.

- [ ] **Step 4: Wire InspectPanel lists**

Show imports and imported-by lists under the complex functions section, each capped at 8 entries with a quiet empty state when both are empty.

- [ ] **Step 5: Verify and checkpoint**

Run `pnpm.cmd --filter @canopy/web test -- src/graph.test.ts`, `pnpm.cmd test`, `pnpm.cmd typecheck`, then commit and push `wip: phase 5 dependency lists`.

### Task 2: Road Toggle And Selection Highlight

**Files:**
- Modify: `apps/web/src/store.ts`
- Modify: `apps/web/src/scene/Roads.tsx`
- Modify: `apps/web/src/scene/model.ts`
- Modify: `apps/web/src/scene/model.test.ts`
- Modify: `apps/web/src/ui/Toolbar.tsx`
- Modify: `apps/web/src/styles.css`
- Modify: `NOTES.md`

**Interfaces:**
- Produces: `showRoads`, `setShowRoads(showRoads)` in the store.
- Produces: `edgeMatchesSelection(edge, selectedId): boolean`
- Produces: road rendering hidden unless `showRoads` is true, with selected-file edges highlighted.

- [ ] **Step 1: Write failing road helper tests**

Assert road selection matches both incoming and outgoing edges, no selection matches nothing, and the helper stays pure.

- [ ] **Step 2: Run focused test to verify failure**

Run: `pnpm.cmd --filter @canopy/web test -- src/scene/model.test.ts`
Expected: FAIL because `edgeMatchesSelection` does not exist.

- [ ] **Step 3: Implement road helper and store flag**

Add `showRoads: false` by default, reset no city data, and expose `setShowRoads`.

- [ ] **Step 4: Wire road toggle and highlight**

Add a compact Roads toggle to `Toolbar`. `Roads` should render nothing when disabled, cap visible edges to a practical number, draw lifted three-point arcs, and highlight selected incoming/outgoing roads in gold while dimming non-selected edges.

- [ ] **Step 5: Verify and checkpoint**

Run `pnpm.cmd --filter @canopy/web test -- src/scene/model.test.ts`, `pnpm.cmd test`, `pnpm.cmd typecheck`, `pnpm.cmd build`, then commit and push `wip: phase 5 road controls`.

### Task 3: Search Box And Result Selection

**Files:**
- Create: `apps/web/src/search.ts`
- Create: `apps/web/src/search.test.ts`
- Create: `apps/web/src/ui/SearchBox.tsx`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`
- Modify: `NOTES.md`

**Interfaces:**
- Produces: `searchCity(city: CityData, query: string, limit?: number): SearchResult[]`
- Produces: `<SearchBox city={city} />`

- [ ] **Step 1: Write failing search tests**

Assert path exact/prefix/substring ranking, function-name matches, empty query returns no results, and results contain the owning `fileId`.

- [ ] **Step 2: Run focused test to verify failure**

Run: `pnpm.cmd --filter @canopy/web test -- src/search.test.ts`
Expected: FAIL because `search.ts` does not exist.

- [ ] **Step 3: Implement pure search**

Use simple case-insensitive scoring: exact path/name/function match first, path/name prefix next, path/name substring next, function substring next. Cap results to the requested limit.

- [ ] **Step 4: Implement SearchBox**

Add a compact search panel near the top controls. Selecting a result sets `selectedId` and issues a camera focus request for that file id. Keep keyboard/mouse behavior simple and avoid new dependencies.

- [ ] **Step 5: Verify and checkpoint**

Run `pnpm.cmd --filter @canopy/web test -- src/search.test.ts`, `pnpm.cmd test`, `pnpm.cmd typecheck`, `pnpm.cmd build`, then commit and push `wip: phase 5 search`.

### Task 4: Camera Fly-To And Focus Button

**Files:**
- Modify: `apps/web/src/store.ts`
- Modify: `apps/web/src/scene/CameraRig.tsx`
- Modify: `apps/web/src/scene/model.ts`
- Modify: `apps/web/src/scene/model.test.ts`
- Modify: `apps/web/src/ui/InspectPanel.tsx`
- Modify: `NOTES.md`

**Interfaces:**
- Produces: `focusRequest: { fileId: number; nonce: number } | null` and `requestFocus(fileId)` in the store.
- Produces: `cameraFocusForFile(file, worldSize): { camera: [number, number, number]; target: [number, number, number] }`

- [ ] **Step 1: Write failing camera helper tests**

Assert focus target points at the selected building, camera stands off at a distance proportional to city size/building size, and output is deterministic.

- [ ] **Step 2: Run focused test to verify failure**

Run: `pnpm.cmd --filter @canopy/web test -- src/scene/model.test.ts`
Expected: FAIL because `cameraFocusForFile` does not exist.

- [ ] **Step 3: Implement focus store and pure camera helper**

Focus requests should increment a nonce so selecting the same building again can retrigger fly-to.

- [ ] **Step 4: Wire CameraRig animation**

On a new focus request, animate camera position and orbit target over about 1 second with easing. Keep OrbitControls enabled and update its target during the animation.

- [ ] **Step 5: Add InspectPanel Focus button**

The Focus button should request camera focus for the selected file without changing metrics or selection.

- [ ] **Step 6: Verify and checkpoint**

Run `pnpm.cmd --filter @canopy/web test -- src/scene/model.test.ts`, `pnpm.cmd test`, `pnpm.cmd typecheck`, `pnpm.cmd build`, then commit and push `wip: phase 5 camera fly-to`.

### Task 5: Phase 5 Acceptance

**Files:**
- Modify: `README.md`
- Modify: `NOTES.md`
- Modify: `docs/superpowers/plans/2026-10-11-canopy-phase-5.md`

**Interfaces:**
- Produces: recorded Phase 5 acceptance evidence.

- [ ] **Step 1: Run full verification**

Run `pnpm.cmd test`, `pnpm.cmd typecheck`, and `pnpm.cmd build`.

- [ ] **Step 2: Run live dependency/search acceptance check**

Analyze fresh-cache or cached `https://github.com/expressjs/express`; verify `edges.length > 0`, at least one file has imports or imported-by entries, and searching a known path or function returns the expected file id.

- [ ] **Step 3: Update docs and plan evidence**

Record commands and acceptance results in `NOTES.md` and this plan. Update `README.md` current status so Phase 5 is no longer listed as pending.

- [ ] **Step 4: Final phase commit**

Commit and push `phase 5: add search roads fly-to`.
