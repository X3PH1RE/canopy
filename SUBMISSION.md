# Project submission

Complete this file during the hackathon and use it to prepare your submission through the method announced by the organizers. Do not submit your project to the template repository.

## Project

- **Project name:** Canopy
- **Short description:** Canopy turns a public GitHub repository into a 3D solarpunk city: folders become districts, files become buildings, git history becomes a time slider, and risky code glows. It helps developers and reviewers see structure, churn, complexity and dependencies at a glance.
- **Code repository URL:** https://github.com/X3PH1RE/canopy
- **Final submitted implementation commit SHA:** f9f1892f0abd63ff37b359a22a08bd7629835a2d (the last commit before this SHA was recorded)
- **Demo video link:** https://drive.google.com/file/d/19_4Yk8tpS9wDz5aKTS4FWK5rVLw0-Lc3/view?usp=sharing
- **Working demo URL or local demo steps:** Live at https://canopy.ashwinmenon.me. To run locally: `pnpm install`, `pnpm dev`, open http://localhost:5173, then load the sample city or paste a public GitHub URL and press Analyze.
- **Demo access requirements:** Node.js 20.19+ and pnpm 9+. Analysing a GitHub repository needs network access; the sample city works offline. No credentials are needed.

## Participants

Participate solo or in a team of up to 4. Remove unused rows.

| Participant name | GitHub handle | Contribution |
| --- | --- | --- |
| Ashwin Menon | [@X3PH1RE](https://github.com/X3PH1RE) | Everything: product direction, review and the final project |

## Run and demonstrate

- **Prerequisites and versions:** Node.js >= 20.19, pnpm 9.12
- **Install command:** `pnpm install`
- **Required environment variable names:** None required. Optional: `RATE_LIMIT_ENABLED`, `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MINUTES`, `TRUST_PROXY` (see `apps/server/.env.example`).
- **Start command:** `pnpm dev` (server on :8787, web on :5173)
- **Demo walkthrough:** 1) Open the app and orbit the sample city. 2) Switch Color by Language / Churn / Complexity / Risk and use the legend "i" buttons. 3) Click a building to inspect it; toggle Routes. 4) Search for a file to fly to it. 5) Analyze a public repo such as https://github.com/expressjs/express and press play on the time slider. 6) Press F for drone mode (WASD, Q/E, Shift) and fly between buildings.
- **Checks performed and results:** `pnpm test` passed 101 tests in 28 files and `pnpm typecheck` passed at the last run. Earlier phases recorded `pnpm build` passing and fresh-cache analyses of Express (6.9s) and Flask (10.3s). Browser checks were done for the visual changes. Re-run all three commands before submitting.
- **Known limitations or incomplete features:** Offline pre-baked real samples are not included. GitHub analysis needs network access. Frame rate on very large cities has not been measured. Narrow-window layouts were not re-checked after the latest changes. See `NOTES.md`.
- **Libraries, APIs, and public datasets used:** Fastify, Vite, React, React Three Fiber, Drei, Three.js, Zustand, d3-hierarchy, web-tree-sitter, tree-sitter-wasms, zod, TypeScript, Vitest and fontsource fonts (Fraunces, DM Sans). No external datasets.
- **AI usage record:** [AI_USAGE.md](AI_USAGE.md)
- **Development change log:** [CHANGELOG.md](CHANGELOG.md)

## Submission checklist

- [ ] The project implementation started from scratch at the event.
- [ ] I participated solo or with no more than 4 team members in total.
- [ ] Codex was used during development and its usage is documented.
- [ ] The code repository URL, short description, and working demo are provided.
- [ ] README setup and demo instructions match the submitted code.
- [ ] Actual checks and known limitations are documented.
- [ ] Meaningful changes are documented and committed throughout development.
- [ ] The final implementation is committed and pushed, and its SHA is recorded above.
- [ ] No credentials or private data are included in the repository or demo instructions.
- [ ] The organizers' announced submission method and timing have been followed.

Event reference: [DevDay Exchange Community: Kochi on Luma](https://luma.com/z10nz8gp). The event wraps up by **10:00 AM IST on 11 October 2026**.
