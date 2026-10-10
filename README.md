# Canopy

Your codebase, as a city you can fly through.

Paste a public GitHub repository URL and Canopy will analyze its files, dependencies, churn, risk hotspots, and history, then render the result as a navigable 3D city with timeline playback, dependency roads, and search fly-to.

## Project Overview

- **Project name:** Canopy
- **Short description:** A visual codebase explorer where folders become districts, files become buildings, git history becomes a time slider, and risky code glows.
- **Team:** TODO
- **Working demo:** Local demo with `pnpm dev`; open `http://localhost:5173`, paste a public GitHub URL, or load the sample city.
- **Technology stack:** TypeScript, pnpm workspaces, Fastify, Vite, React 18, React Three Fiber, Drei, Three.js, Zustand, d3-hierarchy, web-tree-sitter, tree-sitter-wasms, Vitest.

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

- Working features: pnpm workspace, shared `CityData` types, Fastify `/api/health`, `/api/limits`, in-memory analyze jobs, safe GitHub URL validation, repo clone/fetch cache, repo walking filters, tree-sitter metrics with heuristic fallback, relative JS/TS/Python dependency edges, git history parsing, timeline data, churn/risk scoring, Language/Churn/Complexity/Risk view modes, deterministic fake city generation, treemap layout tests, generated sample data, a full-screen 3D city scene, district plates, toggleable dependency roads with selection highlights, orbit controls, camera fly-to, file/function search, drone fly mode with collision, chase camera, proximity popups, fly HUD, hover highlighting, click selection, live time-slider playback with smooth building growth and changed-file pulses, inspect panel metrics and dependency lists, URL submission UI, progress overlay, friendly rate-limit panel, strict TypeScript checks, and Vitest setup.
- Known limitations: Phase 6 polish and offline pre-baked real samples are later phases.
- Libraries, APIs, and public datasets used: Fastify, Vite, React, React Three Fiber, Drei, Three.js, Zustand, TypeScript, Vitest, d3-hierarchy, web-tree-sitter, tree-sitter-wasms, and fontsource packages. No external datasets are used.

See [AI_USAGE.md](AI_USAGE.md) for AI assistance and [CHANGELOG.md](CHANGELOG.md) for the development record.
