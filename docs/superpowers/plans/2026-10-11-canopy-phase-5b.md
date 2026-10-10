# Canopy Phase 5b Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add drone flight mode with collision, chase camera, proximity popups, search glide, and keyboard-safe controls.

**Architecture:** Pure modules own key filtering, mutable world snapshots, spatial queries, collision resolution, and proximity timing so they can be tested without WebGL. React Three Fiber components consume those helpers for the procedural drone, fly camera, popup, and HUD while the existing orbit mode remains the default.

**Tech Stack:** TypeScript strict mode, pnpm workspaces, Vite + React 18, Zustand, React Three Fiber, Drei, Three.js, Vitest. No new dependencies.

**Spec:** `C:\Users\ashwi\.codex\attachments\ab2f18fa-b603-423f-89c5-fb7f15a9b3d4\Pasted text.txt`

## Global Constraints

- Work in order and do not start Phase 6 until Phase 5b acceptance checks pass.
- Use the exact stack and file layout from the project spec.
- Never execute analyzed repository code; only read files and run `git` commands.
- Shared types live in `packages/shared/src/types.ts`; Phase 5b should not need shared type changes.
- Keep the app runnable after every checkpoint.
- Add no dependencies for Phase 5b.
- Make interval commits for coherent Phase 5b slices, then finish with `phase 5b: add drone mode`.

## Review Focus

- Input focus: typing in search or URL inputs must never move the drone or trigger shortcuts.
- Collision freshness: building collision boxes must follow timeline height changes while flying.
- Camera handoff: toggling `F` into and out of fly mode must not leave OrbitControls with a stale target or jump.
- Popup dwell: one nearby building should show after about 250 ms; high-speed flybys should show none.
- Search glide: selecting search while flying should steer the drone near the target building instead of yanking the orbit camera.

---

### Task 1: Input Guard And World Snapshot

**Files:**
- Create: `apps/web/src/input/keys.ts`
- Create: `apps/web/src/input/keys.test.ts`
- Create: `apps/web/src/scene/worldState.ts`
- Create: `apps/web/src/scene/worldState.test.ts`
- Modify: `apps/web/src/scene/Buildings.tsx`
- Modify: `NOTES.md`

**Interfaces:**
- Produces: `isEditableTarget(target: EventTarget | null): boolean`
- Produces: `createKeyTracker(): { press(key), release(key), clear(), snapshot(): KeySnapshot }`
- Produces: `useKeyControls(enabled?: boolean): KeySnapshot`
- Produces: `syncCityWorldState(city: CityData): void`
- Produces: `updateLiveBuildingHeight(fileId: number, height: number): void`
- Produces: `canopyWorldState` with `buildingBoxes`, `liveHeights`, `importedByCounts`, and `drone`.

- [x] **Step 1: Write failing input tests**

Assert editable targets include `input`, `textarea`, `select`, and `[contenteditable=true]`; assert key tracker normalizes casing and clears on blur.

- [x] **Step 2: Run input tests to verify failure**

Run: `pnpm.cmd --filter @canopy/web test -- src/input/keys.test.ts`
Expected: FAIL because `keys.ts` does not exist.

- [x] **Step 3: Implement input helpers and hook**

Implement the pure guard/tracker first, then `useKeyControls` with document `keydown`, `keyup`, and window `blur` listeners.

- [x] **Step 4: Write failing world-state tests**

Assert city sync builds one box per file, imported-by counts invert edges, and live height updates change a box's `maxY`.

- [x] **Step 5: Run world-state tests to verify failure**

Run: `pnpm.cmd --filter @canopy/web test -- src/scene/worldState.test.ts`
Expected: FAIL because `worldState.ts` does not exist.

- [x] **Step 6: Implement world-state helpers and building wiring**

Populate boxes from file center/width/depth and `buildingHeight(file.loc)`, then update each building height from `Buildings` during timeline animation.

- [x] **Step 7: Verify and checkpoint**

Run `pnpm.cmd --filter @canopy/web test -- src/input/keys.test.ts src/scene/worldState.test.ts`, `pnpm.cmd test`, `pnpm.cmd typecheck`, then commit and push `wip: phase 5b input world state`.

### Task 2: Spatial Grid And Collision

**Files:**
- Create: `apps/web/src/scene/spatialGrid.ts`
- Create: `apps/web/src/scene/spatialGrid.test.ts`
- Modify: `NOTES.md`

**Interfaces:**
- Produces: `buildSpatialGrid(boxes: BuildingBox[], cellSize?: number): SpatialGrid`
- Produces: `querySpatialGrid(grid: SpatialGrid, x: number, z: number, radius: number): BuildingBox[]`
- Produces: `resolveDroneCollision(position: Vector3Like, velocity: Vector3Like, boxes: BuildingBox[], radius: number): CollisionResult`

- [x] **Step 1: Write failing spatial-grid tests**

Assert query returns boxes in intersecting cells, excludes far boxes, push-out resolves overlap, and sliding preserves tangential velocity.

- [x] **Step 2: Run focused test to verify failure**

Run: `pnpm.cmd --filter @canopy/web test -- src/scene/spatialGrid.test.ts`
Expected: FAIL because `spatialGrid.ts` does not exist.

- [x] **Step 3: Implement spatial grid and collision**

Use integer `x:z` cell keys, query by radius bounds, and resolve horizontal sphere-vs-box overlap only when drone altitude intersects the building height.

- [x] **Step 4: Verify and checkpoint**

Run `pnpm.cmd --filter @canopy/web test -- src/scene/spatialGrid.test.ts`, `pnpm.cmd test`, `pnpm.cmd typecheck`, then commit and push `wip: phase 5b spatial collision`.

### Task 3: Proximity Timing

**Files:**
- Create: `apps/web/src/scene/proximity.ts`
- Create: `apps/web/src/scene/proximity.test.ts`
- Modify: `NOTES.md`

**Interfaces:**
- Produces: `updateProximity(state: ProximityState, input: ProximityInput): ProximityState`
- Produces: dwell constants `PROXIMITY_DWELL_MS = 250` and `PROXIMITY_RELEASE_MS = 300`.

- [ ] **Step 1: Write failing proximity tests**

Assert one popup activates after dwell, fast flybys do not activate, leaving range hides after release, and switching nearest buildings resets dwell.

- [ ] **Step 2: Run focused test to verify failure**

Run: `pnpm.cmd --filter @canopy/web test -- src/scene/proximity.test.ts`
Expected: FAIL because `proximity.ts` does not exist.

- [ ] **Step 3: Implement proximity state machine**

Track candidate id/time and active id; require speed below threshold and a stable nearest id for 250 ms before activation.

- [ ] **Step 4: Verify and checkpoint**

Run `pnpm.cmd --filter @canopy/web test -- src/scene/proximity.test.ts`, `pnpm.cmd test`, `pnpm.cmd typecheck`, then commit and push `wip: phase 5b proximity`.

### Task 4: Drone Flight Controller

**Files:**
- Create: `apps/web/src/scene/Drone.tsx`
- Create: `apps/web/src/scene/DroneController.tsx`
- Modify: `apps/web/src/scene/CameraRig.tsx`
- Modify: `apps/web/src/scene/City.tsx`
- Modify: `apps/web/src/store.ts`
- Modify: `apps/web/src/ui/Toolbar.tsx`
- Modify: `apps/web/src/styles.css`
- Modify: `NOTES.md`

**Interfaces:**
- Produces: `isFlyMode`, `setFlyMode(isFlyMode)`, `activeBuildingId`, and `setActiveBuildingId(id)` in the store.
- Consumes: `useKeyControls`, `canopyWorldState`, `buildSpatialGrid`, and `resolveDroneCollision`.

- [ ] **Step 1: Write failing store/model coverage where practical**

Add tests only for pure exported flight helpers if extracted during implementation; otherwise reuse Task 1/2 tests as the contract and keep runtime code minimal.

- [ ] **Step 2: Implement procedural drone and controller**

Create body, arms, rotors, tilt, bob, and blob shadow; implement `F`, WASD, QE, Shift boost, mouse/arrow yaw, bounded movement, collision sliding, and chase camera.

- [ ] **Step 3: Disable orbit controls during fly mode**

`CameraRig` should keep default orbit behavior outside fly mode and set controls enabled false during drone chase.

- [ ] **Step 4: Wire Fly button**

Add a compact `Fly` toggle next to `Roads` with `aria-pressed`.

- [ ] **Step 5: Verify and checkpoint**

Run `pnpm.cmd test`, `pnpm.cmd typecheck`, `pnpm.cmd build`, then commit and push `wip: phase 5b drone controller`.

### Task 5: Popup, Expand, HUD, And Search Glide

**Files:**
- Create: `apps/web/src/scene/DronePopup.tsx`
- Create: `apps/web/src/ui/FlyHud.tsx`
- Modify: `apps/web/src/scene/DroneController.tsx`
- Modify: `apps/web/src/scene/Buildings.tsx`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/store.ts`
- Modify: `apps/web/src/styles.css`
- Modify: `NOTES.md`

**Interfaces:**
- Consumes: `updateProximity`, store `focusRequest`, and `activeBuildingId`.
- Produces: `Enter` opens `InspectPanel` for the active building; `Escape` clears active building; search while flying glides the drone toward the focused file.

- [ ] **Step 1: Write failing popup/glide tests for pure helpers if extracted**

If glide target math is extracted, test that it offsets the target outside the building footprint and above the roof.

- [ ] **Step 2: Implement popup and building highlight**

Show exactly one `DronePopup` for `activeBuildingId`, render concise path/metrics copy, and highlight the active building shell without changing selection.

- [ ] **Step 3: Implement Expand and HUD**

Pressing `Enter` while a popup is active sets selected id and opens the existing inspect panel. Add `FlyHud` with mode hints and compact speed/altitude readouts.

- [ ] **Step 4: Implement search glide in fly mode**

When `focusRequest` changes during fly mode, steer the drone to a safe offset near the target building and keep collision active during the glide.

- [ ] **Step 5: Verify and checkpoint**

Run `pnpm.cmd test`, `pnpm.cmd typecheck`, `pnpm.cmd build`, then commit and push `wip: phase 5b popup hud glide`.

### Task 6: Phase 5b Acceptance

**Files:**
- Modify: `README.md`
- Modify: `NOTES.md`
- Modify: `docs/superpowers/plans/2026-10-11-canopy-phase-5b.md`

**Interfaces:**
- Produces: recorded Phase 5b acceptance evidence.

- [ ] **Step 1: Run full verification**

Run `pnpm.cmd test`, `pnpm.cmd typecheck`, and `pnpm.cmd build`.

- [ ] **Step 2: Run browser acceptance**

Start the app, inspect desktop and mobile screenshots, and verify the WebGL canvas is nonblank. Manually check `F`, WASD/QE/Shift, input focus guard, collision, popup dwell, Expand, search glide, and orbit return.

- [ ] **Step 3: Update docs and plan evidence**

Record commands and acceptance results in `NOTES.md` and this plan. Update `README.md` current status so drone mode is no longer pending.

- [ ] **Step 4: Final phase commit**

Commit and push `phase 5b: add drone mode`.

## Acceptance Evidence

- Pending.
