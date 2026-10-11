# Change log

Record each meaningful project change during the event, newest first. Update this file in the same commit as the change. Use a real timestamp with timezone, for example `YYYY-MM-DDTHH:MM:SS+05:30`.

## Event build log

## 2026-10-11T07:14:45+05:30 - Richer building facades and roofs

- Changed: Added per-building colour variation, ground shading, cream corner pillars, floor lines and green balcony planters in the building shader. Roofs now have a cream parapet around a green roof garden. Stepped and terraced buildings get a set-back top block, slim towers get a spire with a beacon, and glass slabs get a greenhouse dome. Commit `9192437`.
- Why: Buildings still read as plain boxes with flat green slabs on top.
- Validation: `pnpm test` passed 101 tests across 28 files, typecheck passed, and a browser check showed no console or shader warnings.
- Limitations: Frame rate was not measured, and the building close-ups and fly mode were not visually re-checked.

## 2026-10-11T07:09:38+05:30 - Stats and controls panel redesign

- Changed: Replaced the plain stats line with four stat tiles (large LOC counts shortened, correct singular labels), added a "Color by" label, a pill-shaped view switch, and Routes/Fly buttons with icons and key hints. Commit `5481baa`.
- Why: The old panel looked unfinished.
- Validation: Typecheck passed and a browser screenshot confirmed the layout. Narrow-window layout was not checked.
- Limitations: None known beyond the unchecked narrow layout.

## 2026-10-11T07:05:55+05:30 - Legend info cards

- Changed: Every legend item has an "i" button that opens a card explaining the colour or level, closing on a second click, outside click, Esc or view-mode change. Added a test that every legend item has an explanation. Commit `e49661d`.
- Why: The legend showed colours without saying what they meant.
- Validation: Legend tests passed (2 tests) and a browser check opened the Python card.
- Limitations: Explanations were written from how the app computes churn and risk and have not had a separate human review.

## 2026-10-11T07:03:19+05:30 - Legend moved to avoid overlap

- Changed: Moved the legend to the bottom-left and the fly HUD to the centre bottom so the inspect card no longer overlaps the legend. Commit `35113c9`.
- Why: Clicking a building opened an inspect card that covered the legend.
- Validation: Browser screenshot after selecting a building showed no overlap.
- Limitations: The fly HUD's new position was not checked in fly mode.

## 2026-10-11T07:02:01+05:30 - Roads renamed to Routes and made bolder

- Changed: Renamed Roads to Routes in the UI and README, turned routes on by default, drew them as thicker teal-to-gold lines in a single draw call, and added about 90 moving light pulses. A selected file's routes are thicker gold with a travelling light and the rest dim. Commit `6809b60`.
- Why: Routes were thin and hard to see.
- Validation: `pnpm test` passed 100 tests, typecheck passed, and a browser screenshot showed the new routes with no console errors.
- Limitations: Large cities look busy with every route visible.

## 2026-10-11T07:00:00+05:30 - F, Enter and Esc handled as key events

- Changed: Fly toggle (F), expand (Enter) and clear (Esc) now react to the key press event instead of held-key state. Commit `d40055b`.
- Why: A quick tap on F was dropped when the key was released before the next render.
- Validation: A browser check toggled fly mode on and back to orbit with single taps.
- Limitations: The orbit camera sits close to the buildings after leaving fly mode because of the minimum orbit distance.

## 2026-10-11T06:57:59+05:30 - Drone WASD heading fix

- Changed: Fixed a sign error that made W/S slide sideways when the drone was turned, reversed the Left/Right arrow turning, and rotated the drone model to face its direction of travel. Added a heading test at any yaw. Commit `f6c54c0`.
- Why: The WASD controls were not accurate.
- Validation: Drone flight tests passed (5 tests) and typecheck passed. Fly mode was not flown by hand in a browser.
- Limitations: Mouse-drag steering was left unchanged.

## 2026-10-11T06:55:57+05:30 - Solarpunk scene, merged routes, route stepper, drone model, timeline date fix

- Changed: Shader-painted windows, lit panes and vines, green roofs with shrubs, rooftop solar panels and spinning wind turbines, a floating island with a gradient sky and clouds, pine and round trees, bushes, flowers, ponds, a monorail with moving pods, and a full-city shadow area. Dependency routes became one merged draw call. Added a five-step analysis progress stepper, a branded top bar, and a quadcopter drone model. The timeline now uses the earliest and latest commit times instead of log order. Commit `f4364da`.
- Why: The city looked rough and half finished, and timeline dates could be wrong when author dates were not in order.
- Validation: `pnpm test` passed 99 tests, typecheck passed, and a browser screenshot showed no console errors.
- Limitations: Frame rate was not measured. Cached analyses keep their old timeline dates until re-analysed.

## 2026-10-10T23:14:14+05:30 to 2026-10-11T06:39:34+05:30 - Phases 2 to 6 and polish

- Changed: Phase 2 real repository analysis (rate limiting, safe GitHub clone and cache, repo walking filters, tree-sitter metrics, relative-import edges, analyze job API, URL bar and progress UI). Phase 3 git history parsing, churn and risk scoring and the Language, Churn, Complexity and Risk views. Phase 4 timeline playback. Phase 5 dependency lists, route toggle and highlights, search and camera fly-to. Phase 5b drone fly mode with collision, chase camera and proximity popups. Phase 6 trees, solar panels, legend, shortcuts, loading copy and mobile layout. Followed by analyze-route fixes, procedural building detail and a HUD spacing fix. Per-step detail is in `NOTES.md` and the git history.
- Why: Deliver the must-have phases 1 to 5, then 5b and 6 from the project spec.
- Validation: Recorded in `NOTES.md`: fresh-cache Express analysed in 6.9s and Flask in 10.3s, history parsed for Express (2,733 commits) and Flask (capped at 5,000), and the Phase 6 run passed 27 files with 93 tests, typecheck and build.
- Limitations: See `NOTES.md` known limitations. This entry was written afterwards from the commit history and notes rather than at each commit.

## 2026-10-10T22:45:53+05:30 - Phase 1 static 3D city

- Changed: Added the React Three Fiber scene with district plates, file buildings, dependency road lines, orbit controls, hover highlighting, click selection, scene model tests, Vite optimizer configuration, centered-layout scene mapping, id-based inspect lookup, and Phase 1 demo documentation.
- Why: Complete the Phase 1 goal of rendering a navigable static Canopy from generated `CityData`.
- Validation: `pnpm --filter @canopy/web test -- src/scene/model.test.ts` passed 4 tests. `pnpm test` passed 11 tests, `pnpm typecheck` passed, and `pnpm build` passed. Browser smoke test confirmed `GET http://localhost:5173` returned HTTP 200, `GET http://localhost:8787/api/health` returned `{"ok":true}`, the canvas mounted with nonblank pixels, and clicking the canvas selected a building in the inspect panel.
- Limitations: The scene still uses generated sample data only. Real repository analysis, URL submission, timeline playback, and production risk rules are deferred to later phases.

## 2026-10-10T22:30:32+05:30 - Rename app to Canopy and start Phase 1

- Changed: Renamed visible app and workspace package identity from Code City to Canopy, updated imports to `@canopy/*`, refreshed the lockfile, added the Phase 1 plan, implemented deterministic layout tests/helpers, fake city generation, sample JSON, and the initial web loader/UI shell.
- Why: The project name is Canopy, and Phase 1 needs fake data plus a tested layout foundation before the 3D scene is added.
- Validation: `rg` found no remaining `Code City`, `code-city`, or `@code-city` references. `pnpm test` passed 7 tests, `pnpm typecheck` passed, and `pnpm build` passed.
- Limitations: Phase 1 is not complete yet. The 3D city scene, orbit controls, hover highlight, and click selection still need to be implemented.

## 2026-10-10T21:34:26+05:30 - Phase 0 workspace scaffold

- Changed: Added the pnpm workspace, shared `CityData` contract, Fastify health server, Vite React shell, strict TypeScript configs, Vitest tests, Canopy agent guide, implementation plan, and Phase 0 notes.
- Why: Establish the runnable foundation required before static city rendering and real repository analysis.
- Validation: Initial red checks observed missing shared types, missing server routes, and missing web shared import resolution. Final checks passed: `pnpm test` (2 tests), `pnpm typecheck`, `pnpm build`, `pnpm dev`, `GET http://localhost:8787/api/health` returned `{"ok":true}`, and `GET http://localhost:5173` returned HTTP 200.
- Limitations: Repository analysis, 3D rendering, fake sample data, and city UI are not implemented yet. `pnpm dev` starts with a Vite optimizer warning from the sandbox workaround.

## Template setup - 10 October 2026

- Changed: Added the event README, rules, agent guide, change log, AI usage record, submission checklist, Git ignore rules, and pull request checklist.
- Why: Give participants a consistent starting point for event rules, basic coding patterns, documented changes, and regular commits.
- Validation: Checked local Markdown links, event detail consistency, required documents, and diff whitespace before publishing.
- Limitations: Documentation scaffolding only; no participant project, application, or working demo is included. GitHub publication and template status are verified separately after creation.
