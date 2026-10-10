# Canopy

Your codebase, as a city you can fly through.

Paste a public GitHub repository URL and Canopy will analyze its files, history, dependencies, and risk hotspots, then render the result as a navigable 3D city. Phase 1 currently renders a deterministic sample city from generated data.

## Project Overview

- **Project name:** Canopy
- **Short description:** A visual codebase explorer where folders become districts, files become buildings, git history becomes a time slider, and risky code glows.
- **Team:** TODO
- **Working demo:** Local demo with `pnpm dev`; open `http://localhost:5173` and orbit the sample city.
- **Technology stack:** TypeScript, pnpm workspaces, Fastify, Vite, React 18, React Three Fiber, Drei, Three.js, Zustand, Vitest.

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

- Working features: pnpm workspace, shared `CityData` types, Fastify `/api/health`, deterministic fake city generation, treemap layout tests, generated sample data, a full-screen 3D city scene, district plates, dependency roads, orbit controls, hover highlighting, click selection, inspect panel metrics, strict TypeScript checks, and Vitest setup.
- Known limitations: The app renders generated sample data only. Real GitHub repository analysis, git history playback, risk hotspot rules, URL submission, and persistence start in later phases.
- Libraries, APIs, and public datasets used: Fastify, Vite, React, React Three Fiber, Drei, Three.js, Zustand, TypeScript, Vitest, d3-hierarchy, and fontsource packages. No external datasets are used in Phase 1.

See [AI_USAGE.md](AI_USAGE.md) for AI assistance and [CHANGELOG.md](CHANGELOG.md) for the development record.
