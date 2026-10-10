# Code City

Your codebase, as a city you can fly through.

Paste a public GitHub repository URL and Code City will analyze its files, history, dependencies, and risk hotspots, then render the result as a navigable 3D city. Phase 0 currently provides the runnable TypeScript workspace foundation.

## Project Overview

- **Project name:** Code City
- **Short description:** A visual codebase explorer where folders become districts, files become buildings, git history becomes a time slider, and risky code glows.
- **Team:** TODO
- **Working demo:** Local demo with `pnpm dev`; full 3D city comes in later phases.
- **Technology stack:** TypeScript, pnpm workspaces, Fastify, Vite, React 18, Vitest.

## Run The Project

### Prerequisites

- Node.js 20.19 or newer
- pnpm 9 or newer

### Install

```bash
pnpm install
```

### Start

```bash
pnpm dev
```

The server listens on `http://localhost:8787` and the web app listens on `http://localhost:5173`.

### Checks

```bash
pnpm test
pnpm typecheck
pnpm build
```

## Current Status

- Working features: pnpm workspace, shared `CityData` types, Fastify `/api/health`, Vite React shell, strict TypeScript checks, and Vitest setup.
- Known limitations: The app does not yet analyze repositories or render a city. That starts in Phase 1 and Phase 2. `pnpm dev` may print a Vite optimizer warning from the local sandbox workaround.
- Libraries, APIs, and public datasets used: Fastify, Vite, React, TypeScript, Vitest, and tsx. No external datasets are used in Phase 0.

See [AI_USAGE.md](AI_USAGE.md) for AI assistance and [CHANGELOG.md](CHANGELOG.md) for the development record.
