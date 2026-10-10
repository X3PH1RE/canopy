# Canopy Phase 4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add timeline playback so Canopy can scrub and play repository history with smoothly growing buildings.

**Architecture:** The server already emits `CityData.timeline` from Phase 3, so Phase 4 keeps the data contract stable and builds client-side timeline state, pure helpers for LOC-at-frame and recent-change pulses, a bottom `TimeSlider`, and per-frame height interpolation in the 3D scene. The static final city remains the fallback when `timeline` is `null`.

**Tech Stack:** TypeScript strict mode, pnpm workspaces, Vite + React 18, Zustand, React Three Fiber, Vitest. No new dependencies.

**Spec:** `C:\Users\ashwi\.codex\attachments\ab2f18fa-b603-423f-89c5-fb7f15a9b3d4\Pasted text.txt`

## Global Constraints

- Work in order and do not start Phase 5 until Phase 4 acceptance checks pass.
- Use the exact stack and file layout from the project spec.
- Never execute analyzed repository code; only read files and run `git` commands.
- Shared types live in `packages/shared/src/types.ts`.
- Keep the app runnable after every checkpoint.
- If a dependency is added, record why in `NOTES.md`; Phase 4 should add no dependencies.
- Make interval commits for coherent Phase 4 slices, then finish with `phase 4: add timeline playback`.

## Review Focus

- Timeline absence: repos with `timeline: null` must hide the slider and keep final static heights.
- Frame lookup: sparse `locSeries` must return `0` before the first change and the last known LOC after a change.
- Playback ending: play must stop cleanly at the final frame and leave buildings at exact final `file.loc` heights.
- Scrubbing: frame changes must not alter layout coordinates or selection state.
- Recent changes: pulse logic must include files changed within the last 5 frames and exclude older changes.

---

### Task 1: Timeline State And Pure Helpers

**Files:**
- Modify: `apps/web/src/store.ts`
- Modify: `apps/web/src/scene/model.ts`
- Modify: `apps/web/src/scene/model.test.ts`
- Modify: `NOTES.md`

**Interfaces:**
- Produces: `timelineFrame`, `isTimelinePlaying`, `setTimelineFrame(frame)`, and `setTimelinePlaying(isPlaying)` in the Zustand store.
- Produces: `locAtFrame(series, frame): number`
- Produces: `fileLocAtFrame(file, timeline, frame): number`
- Produces: `fileChangedRecently(fileId, timeline, frame, windowSize): boolean`

- [ ] **Step 1: Write failing timeline helper tests**

Add tests that assert sparse LOC lookup before/after changes, final-frame LOC fallback to the static file LOC, and recent-change windows.

- [ ] **Step 2: Run focused test to verify failure**

Run: `pnpm.cmd --filter @canopy/web test -- src/scene/model.test.ts`
Expected: FAIL because the helper exports do not exist.

- [ ] **Step 3: Implement store state and pure helpers**

Reset the timeline frame and playback flag in `setCity`. Clamp frame writes to valid timeline bounds. Implement pure helpers without React or Three dependencies.

- [ ] **Step 4: Verify and checkpoint**

Run `pnpm.cmd --filter @canopy/web test -- src/scene/model.test.ts`, `pnpm.cmd test`, `pnpm.cmd typecheck`, then commit and push `wip: phase 4 timeline helpers`.

### Task 2: TimeSlider UI And Playback Clock

**Files:**
- Create: `apps/web/src/ui/TimeSlider.tsx`
- Create: `apps/web/src/ui/TimeSlider.test.tsx` if the existing test setup supports component tests without new dependencies; otherwise cover behavior through pure helpers only and ledger the ruling.
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`
- Modify: `NOTES.md`

**Interfaces:**
- Produces: `<TimeSlider city={city} />`, hidden when `city.timeline` is `null`.

- [ ] **Step 1: Write failing playback helper or component test**

Assert the slider hides for `timeline: null`, shows the current frame date for timeline data, and toggles play state.

- [ ] **Step 2: Run focused test to verify failure**

Run the focused web test command selected in Step 1.
Expected: FAIL because `TimeSlider` does not exist or playback wiring is missing.

- [ ] **Step 3: Implement TimeSlider**

Render a compact bottom panel with a play/pause icon button, range input from `0` to `frameCount - 1`, and formatted current date. Keep copy short and controls stable.

- [ ] **Step 4: Implement playback interval**

Advance from frame `0` to `frameCount - 1` over about 15 seconds. Stop at the final frame. Use effect cleanup so changing city data or unmounting does not leave timers running.

- [ ] **Step 5: Verify and checkpoint**

Run focused web tests, `pnpm.cmd test`, `pnpm.cmd typecheck`, `pnpm.cmd build`, then commit and push `wip: phase 4 time slider`.

### Task 3: Live Building Heights And Pulses

**Files:**
- Modify: `apps/web/src/scene/Buildings.tsx`
- Modify: `apps/web/src/scene/model.ts`
- Modify: `apps/web/src/scene/model.test.ts`
- Modify: `apps/web/src/theme.ts`
- Modify: `NOTES.md`

**Interfaces:**
- Consumes: timeline store state and helper functions from Task 1.
- Produces: smoothly lerped building heights during timeline frame changes.

- [ ] **Step 1: Write failing visual helper tests**

Assert the final timeline frame returns `file.loc`, intermediate frames return sparse-series LOC, and pulse intensity only appears for recent changes.

- [ ] **Step 2: Run focused test to verify failure**

Run: `pnpm.cmd --filter @canopy/web test -- src/scene/model.test.ts`
Expected: FAIL for missing or incomplete live-height/pulse helpers.

- [ ] **Step 3: Implement live height calculation**

Buildings should use timeline LOC while a timeline exists, otherwise static LOC. Use React Three Fiber frame interpolation so heights lerp toward each target instead of snapping. Keep `x`, `z`, `w`, and `d` unchanged.

- [ ] **Step 4: Implement recent-change pulse**

Buildings changed in the last 5 frames get a subtle warm emissive boost layered on top of the active view mode, without overwhelming Risk or Churn colors.

- [ ] **Step 5: Verify and checkpoint**

Run `pnpm.cmd --filter @canopy/web test -- src/scene/model.test.ts`, `pnpm.cmd test`, `pnpm.cmd typecheck`, `pnpm.cmd build`, then commit and push `wip: phase 4 live city playback`.

### Task 4: Phase 4 Acceptance

**Files:**
- Modify: `README.md`
- Modify: `NOTES.md`
- Modify: `docs/superpowers/plans/2026-10-11-canopy-phase-4.md`

**Interfaces:**
- Produces: recorded Phase 4 acceptance evidence.

- [ ] **Step 1: Run full verification**

Run `pnpm.cmd test`, `pnpm.cmd typecheck`, and `pnpm.cmd build`.

- [ ] **Step 2: Run live timeline acceptance check**

Analyze a fresh or cached `https://github.com/expressjs/express` city and verify `timeline.frameCount === 100`, final-frame LOC equals static LOC for sampled files, and at least one file has non-empty `changeFrames`.

- [ ] **Step 3: Update docs and plan evidence**

Record commands and acceptance results in `NOTES.md` and this plan. Update `README.md` current status so Phase 4 is no longer listed as pending.

- [ ] **Step 4: Final phase commit**

Commit and push `phase 4: add timeline playback`.
