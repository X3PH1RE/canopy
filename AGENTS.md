# Code City agent guide

1. Work in order: Phase 0, then 1, then 2, and so on. Each phase has acceptance checks. Do not start the next phase until they pass.
2. After every phase, make a git commit with the message `phase N: <short summary>`.
3. Use the exact stack and file layout defined in the project spec. Do not swap libraries or add new ones unless something is truly blocked. If you add a dependency, note why in `NOTES.md`.
4. TypeScript strict mode everywhere. Shared types live in one place and are imported by both server and web.
5. Never execute any code from an analyzed repo. Only read files and run `git` commands.
6. Always keep the app in a runnable state. If a feature is half done, hide it behind a flag instead of leaving the app broken.
7. If time is short, follow the cut list in the project spec. Phases 1 to 5 are the must-haves. Phase 5b is the next priority. Phases 6 and 7 are polish and hardening.
8. Keep a running `NOTES.md` with decisions, known bugs, and commands. Keep it short.
