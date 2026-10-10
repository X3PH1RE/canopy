# Change log

Record each meaningful project change during the event, newest first. Update this file in the same commit as the change. Use a real timestamp with timezone, for example `YYYY-MM-DDTHH:MM:SS+05:30`.

## Event build log

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
