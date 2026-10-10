# AI usage record

Use Codex during the hackathon and briefly document its actual contribution here. Add a row after each meaningful task or milestone. Keep summaries concise and omit secrets, private data, and full chat transcripts.

## Event build log

| Date and time with timezone | Tool / model, if known | Task | Assistance and affected files | Human review / corrections | Validation and result |
| --- | --- | --- | --- | --- | --- |
| 2026-10-10T22:30:32+05:30 | Codex | Rename to Canopy and start Phase 1 | Renamed app/package identity to Canopy, updated docs and imports, wrote the Phase 1 plan, added layout and fake-data tests, implemented deterministic layout and fake city generation, generated `apps/web/public/samples/fake.json`, and started the web data-loading UI shell. | Pending human review. Correction made: increased Vitest timeout after confirming the route test only timed out during full-suite worker contention. | `rg` found no old Code City references. `pnpm test` passed 7 tests, `pnpm typecheck` passed, and `pnpm build` passed. Phase 1 is still incomplete; 3D scene work remains. |
| 2026-10-10T21:34:26+05:30 | Codex | Phase 0 scaffold | Created the pnpm workspace, shared TypeScript contract, Fastify health route, Vite React shell, tests, docs, and implementation plan. Affected `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `vitest.config.mjs`, `packages/shared`, `apps/server`, `apps/web`, `README.md`, `CHANGELOG.md`, `AI_USAGE.md`, `AGENTS.md`, `NOTES.md`, and `docs/superpowers/plans/2026-10-10-canopy-phase-0.md`. | Pending human review. Corrections made during development: fixed pnpm manifest workspace dependency misuse, Vitest include patterns, Windows pnpm shim usage, TypeScript 7 incompatibility, workspace type resolution, and a `tsx` startup failure in this environment. | Red checks confirmed missing implementation. Final checks passed: `pnpm test`, `pnpm typecheck`, `pnpm build`, `pnpm dev`, and `GET /api/health`. |

## Template preparation

On 10 October 2026, Codex prepared this documentation template from the organizer's supplied rules and checked the linked Luma page for the event name and dates. This covered `README.md`, `RULES.md`, `AGENTS.md`, `CHANGELOG.md`, `AI_USAGE.md`, `SUBMISSION.md`, `.gitignore`, and the pull request checklist. Agent validation covered local links, event consistency, required documents, and diff whitespace; organizer review is pending.

This preparation is separate from participant project implementation and participant AI usage during the event.
