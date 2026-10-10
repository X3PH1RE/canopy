# Canopy Phase 6 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the Phase 6 solarpunk polish layer: instanced nature, solar roofs, legend, shortcuts, loading polish, and refined frosted UI.

**Architecture:** Pure placement/shortcut/legend helpers own deterministic behavior and tests. React Three Fiber components render instanced trees, solar panels, rail pulses, sun movement, and district labels without changing the analysis pipeline. UI components stay compact and operational rather than becoming a landing page.

**Tech Stack:** TypeScript strict mode, pnpm workspaces, Vite + React 18, Zustand, React Three Fiber, Drei, Three.js, Vitest. No new dependencies.

**Spec:** `C:\Users\ashwi\.codex\attachments\ab2f18fa-b603-423f-89c5-fb7f15a9b3d4\Pasted text.txt`

## Global Constraints

- Phase 6 starts only after Phase 5b acceptance and formal commit pass.
- Do only: instanced trees, solar panels on big buildings, frosted glass UI panels, bundled fonts, loading screen, legend, and keyboard shortcuts.
- Use the exact stack and file layout from the project spec.
- Never execute analyzed repository code; only read files and run `git` commands.
- Shared types live in `packages/shared/src/types.ts`; Phase 6 should not need shared type changes.
- Keep the app runnable after every checkpoint.
- Add no dependencies for Phase 6.
- Make interval commits for coherent Phase 6 slices, then finish with `phase 6: add solarpunk polish`.

## Review Focus

- Shortcut focus guard: typing in URL/search inputs must not change view modes, roads, or playback.
- Legend accuracy: legend colors/copy must match the active view mode and not overlap the timeline or inspect panel.
- Nature determinism: sample and real repos should place trees/solar panels stably from city data, not from random render order.
- Performance: instanced nature/panels should avoid per-frame React state and excessive mesh counts.
- Loading polish: sample/analysis loading should provide useful stage copy without hiding errors or rate-limit messages.

---

### Task 1: Deterministic Nature And Solar Placement

**Files:**
- Create: `apps/web/src/scene/nature.ts`
- Create: `apps/web/src/scene/nature.test.ts`
- Create: `apps/web/src/scene/Nature.tsx`
- Modify: `apps/web/src/scene/City.tsx`
- Modify: `apps/web/src/scene/Buildings.tsx`
- Modify: `NOTES.md`

**Interfaces:**
- Produces: `treePlacementsForCity(city, worldSize): TreePlacement[]`
- Produces: `solarPanelsForFiles(files): SolarPanelPlacement[]`
- Produces: `<Nature city={city} worldSize={worldSize} />`

- [x] **Step 1: Write failing placement tests**

Assert tree placement is deterministic, avoids building footprints, caps count, and solar panels choose high-LOC large roofs.

- [x] **Step 2: Run focused test to verify failure**

Run: `pnpm.cmd --filter @canopy/web test -- src/scene/nature.test.ts`
Expected: FAIL because `nature.ts` does not exist.

- [x] **Step 3: Implement placement helpers and instanced rendering**

Use seeded hash values from city/file ids. Render trees as instanced trunks/canopies and solar panels as slim roof meshes.

- [x] **Step 4: Verify and checkpoint**

Run `pnpm.cmd --filter @canopy/web test -- src/scene/nature.test.ts`, `pnpm.cmd test`, `pnpm.cmd typecheck`, then commit and push `wip: phase 6 nature solar`.

### Task 2: Legend And Shortcuts

**Files:**
- Create: `apps/web/src/ui/legend.ts`
- Create: `apps/web/src/ui/legend.test.ts`
- Create: `apps/web/src/ui/Legend.tsx`
- Create: `apps/web/src/input/shortcuts.ts`
- Create: `apps/web/src/input/shortcuts.test.ts`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`
- Modify: `NOTES.md`

**Interfaces:**
- Produces: `legendForViewMode(viewMode): LegendItem[]`
- Produces: `shortcutActionForKey(key, target): ShortcutAction | null`
- Produces: `<Legend />`

- [x] **Step 1: Write failing legend and shortcut tests**

Assert each view mode returns accurate legend items and shortcuts ignore editable targets while mapping `1..4`, `R`, and `Space`.

- [x] **Step 2: Run focused tests to verify failure**

Run: `pnpm.cmd --filter @canopy/web test -- src/ui/legend.test.ts src/input/shortcuts.test.ts`
Expected: FAIL because modules do not exist.

- [x] **Step 3: Implement helpers, Legend component, and keyboard hook**

Wire shortcuts in `App`: `1..4` view modes, `R` roads, and `Space` timeline play/pause when a timeline exists.

- [x] **Step 4: Verify and checkpoint**

Run focused tests, `pnpm.cmd test`, `pnpm.cmd typecheck`, `pnpm.cmd build`, then commit and push `wip: phase 6 legend shortcuts`.

### Task 3: Loading, Glass, Labels, And Acceptance

**Files:**
- Create: `apps/web/src/ui/loading.ts`
- Create: `apps/web/src/ui/loading.test.ts`
- Modify: `apps/web/src/ui/ProgressOverlay.tsx`
- Modify: `apps/web/src/scene/Districts.tsx`
- Modify: `apps/web/src/scene/City.tsx`
- Modify: `apps/web/src/styles.css`
- Modify: `README.md`
- Modify: `NOTES.md`
- Modify: `docs/superpowers/plans/2026-10-11-canopy-phase-6.md`

**Interfaces:**
- Produces: `loadingCopyForStage(stage): { title; detail }`
- Produces: subtle district labels with camera-distance fading.

- [x] **Step 1: Write failing loading-copy tests**

Assert queued/cloning/parsing/layout/error stages return useful seed-to-tree copy and unknown stages are human-readable.

- [x] **Step 2: Run focused test to verify failure**

Run: `pnpm.cmd --filter @canopy/web test -- src/ui/loading.test.ts`
Expected: FAIL because `loading.ts` does not exist.

- [x] **Step 3: Implement loading copy, glass refinements, and district labels**

Refine panels with stronger frosted contrast, add labels for top-level districts, and keep text compact at 1080p.

- [x] **Step 4: Run full acceptance**

Run `pnpm.cmd test`, `pnpm.cmd typecheck`, `pnpm.cmd build`, and browser screenshot/console checks on desktop/mobile.

- [ ] **Step 5: Final phase commit**

Commit and push `phase 6: add solarpunk polish`.

## Acceptance Evidence

- 2026-10-11T03:30+05:30: `pnpm.cmd test` passed 27 files / 91 tests.
- 2026-10-11T03:31+05:30: `pnpm.cmd typecheck` passed for shared, server, and web packages.
- 2026-10-11T03:31+05:30: `pnpm.cmd build` passed; Vite emitted only the existing large chunk warning.
- 2026-10-11T03:32+05:30: Production preview browser smoke passed at `http://localhost:4173/?phase6=final`: 0 console errors/warnings, desktop screenshot `.playwright-mcp/phase6-final-desktop.png`, mobile screenshot `.playwright-mcp/phase6-final-mobile.png`, legend visible, nature/solar layer visible, and mobile controls no longer cropped.
- 2026-10-11T03:40+05:30: Final review fix pass completed for three Important polish findings plus one Minor repeat-key issue. Added regression coverage for complete language legend, repeat-safe shortcuts, and live solar panel heights; `pnpm.cmd test` passed 27 files / 93 tests, `pnpm.cmd typecheck` passed, `pnpm.cmd build` passed with the existing large chunk warning, and production preview remained at 0 console errors/warnings with `.playwright-mcp/phase6-reviewfix-mobile.png`.
