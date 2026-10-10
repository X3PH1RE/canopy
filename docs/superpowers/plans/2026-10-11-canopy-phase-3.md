# Canopy Phase 3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Git history metrics, churn/risk scoring, and instant Churn/Complexity/Risk view modes to Canopy.

**Architecture:** The server parses a single capped `git log` stream after file parsing, maps history back onto current HEAD files, and computes risk before emitting `CityData`. The web app keeps the active view mode in Zustand and derives building colors/emissive values from existing file metrics so mode switches do not call the API or reload city data.

**Tech Stack:** TypeScript strict mode, pnpm workspaces, Fastify, system `git`, zod, d3-hierarchy, Vite + React 18, Zustand, React Three Fiber, Vitest.

**Spec:** `C:\Users\ashwi\.codex\attachments\ab2f18fa-b603-423f-89c5-fb7f15a9b3d4\Pasted text.txt`

## Global Constraints

- Work in order and do not start Phase 4 until Phase 3 acceptance checks pass.
- Use the exact stack and file layout from the project spec.
- Never execute analyzed repository code; only read files and run `git` commands.
- Shared types live in `packages/shared/src/types.ts`.
- Keep the app runnable after every checkpoint.
- If a dependency is added, record why in `NOTES.md`; Phase 3 should add no dependencies.
- Make interval commits for coherent Phase 3 slices, then finish with `phase 3: add churn risk views`.

## Review Focus

- Git log parsing: binary numstat lines, paths with tabs/spaces, malformed lines, and empty output must not crash analysis.
- Shallow or tiny histories: one-commit repos should still return file metrics and hide the timeline by leaving `timeline: null`.
- Churn window: old repositories must compute churn relative to the HEAD commit date, not today.
- Risk scoring: tiny files with `loc < 20` must remain risk `0`, and percentile ranking must avoid one huge file flattening the repo.
- View switching: Churn, Complexity, and Risk modes must recolor immediately from loaded `CityData` without starting a new analysis job.

---

### Task 1: Git History Parser

**Files:**
- Create: `apps/server/src/gitHistory.ts`
- Create: `apps/server/src/gitHistory.test.ts`
- Modify: `NOTES.md`

**Interfaces:**
- Produces: `parseGitHistoryLog(output: string): ParsedGitHistoryLog`
- Produces: `buildHistorySummary(log: ParsedGitHistoryLog, files: HistoryFileInput[]): GitHistorySummary`
- Produces: `analyzeGitHistory(repoDir: string, files: HistoryFileInput[]): Promise<GitHistorySummary | null>`

- [ ] **Step 1: Write failing parser tests**

Cover a small hand-written log with two authors, repeated file changes, a binary numstat line, an old commit outside the 90-day churn window, and one current file not present in history.

- [ ] **Step 2: Run the focused test to verify failure**

Run: `pnpm.cmd --filter @canopy/server test -- src/gitHistory.test.ts`
Expected: FAIL because `gitHistory.ts` does not exist.

- [ ] **Step 3: Implement the parser and summary builder**

Parse commits beginning with `@@sha|author|unixTime`, skip binary `-` numstat rows, normalize paths to POSIX separators, compute per-file authors/commit timestamps/last modified/running LOC, and generate a 100-frame timeline only when history has at least two commits and a positive time span.

- [ ] **Step 4: Implement the git command wrapper**

Run exactly one history command through the existing `runGit`: `git -C <repoDir> log --max-count=5000 --reverse --no-renames --numstat --format=@@%H|%an|%at`. Return `null` if the command fails.

- [ ] **Step 5: Verify and checkpoint**

Run `pnpm.cmd --filter @canopy/server test -- src/gitHistory.test.ts`, `pnpm.cmd test`, `pnpm.cmd typecheck`, then commit and push `wip: phase 3 git history`.

### Task 2: Risk Scoring And Server Assembly

**Files:**
- Create: `apps/server/src/risk.ts`
- Create: `apps/server/src/risk.test.ts`
- Modify: `apps/server/src/build.ts`
- Modify: `apps/server/src/build.test.ts`
- Modify: `apps/server/src/routes.test.ts`
- Modify: `NOTES.md`

**Interfaces:**
- Consumes: `GitHistorySummary` from Task 1.
- Produces: `scoreRisks(files: RiskInput[]): Map<number, number>`
- Produces: `buildCityFromWalk(input)` filling `churn`, `authorCount`, `lastModified`, repo `commitCount`, repo `authorCount`, `timeline`, and `risk`.

- [ ] **Step 1: Write failing risk tests**

Assert percentile ranking, weighted formula, tiny-file zeroing, and the single-author high-churn boost.

- [ ] **Step 2: Write failing build integration tests**

Assert `buildCityFromWalk` accepts injected history, fills per-file history fields, sets repo stats, returns a non-null timeline when available, and leaves defaults when history is missing.

- [ ] **Step 3: Run focused tests to verify failure**

Run: `pnpm.cmd --filter @canopy/server test -- src/risk.test.ts src/build.test.ts`
Expected: FAIL because `risk.ts` does not exist and `buildCityFromWalk` still emits zero history.

- [ ] **Step 4: Implement risk scoring and build integration**

Use percentile rank within the loaded repo for churn, complexity, and LOC. Compute `risk = 0.40 * pct(churn) + 0.35 * pct(complexity) + 0.25 * pct(loc)`, boost `authorCount === 1` files in the top 20 percent of churn by 1.15, and clamp to 1.

- [ ] **Step 5: Wire real repo history in the default analyzer**

Pass `repoDir` into `buildCityFromWalk` from `routes.ts` so real analyses call `analyzeGitHistory`. Keep tests able to inject summary data so unit tests never clone public repos.

- [ ] **Step 6: Verify and checkpoint**

Run `pnpm.cmd --filter @canopy/server test -- src/risk.test.ts src/gitHistory.test.ts src/build.test.ts src/routes.test.ts`, `pnpm.cmd test`, `pnpm.cmd typecheck`, then commit and push `wip: phase 3 risk scoring`.

### Task 3: View Mode Model And Toolbar

**Files:**
- Modify: `apps/web/src/store.ts`
- Modify: `apps/web/src/theme.ts`
- Modify: `apps/web/src/scene/model.ts`
- Modify: `apps/web/src/scene/model.test.ts`
- Modify: `apps/web/src/scene/Buildings.tsx`
- Modify: `apps/web/src/ui/Toolbar.tsx`
- Modify: `apps/web/src/ui/InspectPanel.tsx`
- Modify: `apps/web/src/styles.css`
- Modify: `NOTES.md`

**Interfaces:**
- Produces: `type ViewMode = "language" | "churn" | "complexity" | "risk"`
- Produces: `buildingVisual(file, files, viewMode): { color: string; roofColor: string; emissive: string; emissiveIntensity: number }`

- [ ] **Step 1: Write failing scene model tests**

Assert language colors, churn sunlight ramp, complexity mint-to-plum ramp, risk drought ramp, and stronger emissive for hot values.

- [ ] **Step 2: Run focused tests to verify failure**

Run: `pnpm.cmd --filter @canopy/web test -- src/scene/model.test.ts`
Expected: FAIL because `buildingVisual` and `ViewMode` are not implemented.

- [ ] **Step 3: Implement store and visual helpers**

Add `viewMode` and `setViewMode` to the store. Add exact Phase 3 ramp tokens in `theme.ts`, percentile helpers in `model.ts`, and keep helper tests pure.

- [ ] **Step 4: Wire toolbar controls and building colors**

Render a compact segmented control for Language, Churn, Complexity, and Risk. Buildings read `viewMode` from the store and use `buildingVisual` for body, roof, and emissive values.

- [ ] **Step 5: Enrich inspect metrics**

Show churn, author count, last modified date, and the top five complex functions in `InspectPanel` without changing selection behavior.

- [ ] **Step 6: Verify and checkpoint**

Run `pnpm.cmd --filter @canopy/web test -- src/scene/model.test.ts`, `pnpm.cmd test`, `pnpm.cmd typecheck`, `pnpm.cmd build`, then commit and push `wip: phase 3 view modes`.

### Task 4: Phase 3 Acceptance

**Files:**
- Modify: `README.md`
- Modify: `NOTES.md`
- Modify: `docs/superpowers/plans/2026-10-11-canopy-phase-3.md`

**Interfaces:**
- Produces: recorded Phase 3 acceptance evidence.

- [ ] **Step 1: Run full verification**

Run `pnpm.cmd test`, `pnpm.cmd typecheck`, and `pnpm.cmd build`.

- [ ] **Step 2: Run live history acceptance checks**

Analyze fresh-cache `https://github.com/expressjs/express` and `https://github.com/pallets/flask`; verify history parsing completes under 10 seconds for the capped command, repo stats have non-zero commits/authors, risk has a believable non-zero subset, and mode-ready fields are present.

- [ ] **Step 3: Update docs and plan evidence**

Record commands and acceptance results in `NOTES.md` and this plan. Update `README.md` current status so Phase 3 is no longer listed as pending.

- [ ] **Step 4: Final phase commit**

Commit and push `phase 3: add churn risk views`.
