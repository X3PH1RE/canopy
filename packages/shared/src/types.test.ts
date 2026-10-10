import { describe, expect, it } from "vitest";
import type { CityData } from "./types";

describe("CityData contract", () => {
  it("accepts a minimal valid city data object", () => {
    const city = {
      version: 1,
      repo: {
        url: "https://github.com/example/repo",
        name: "example/repo",
        headSha: "abc123",
        analyzedAt: "2026-10-10T16:00:00.000Z",
        truncated: false,
      },
      stats: {
        fileCount: 0,
        totalLoc: 0,
        commitCount: 0,
        authorCount: 0,
        languages: {},
      },
      files: [],
      districts: [],
      edges: [],
      timeline: null,
    } satisfies CityData;

    expect(city.version).toBe(1);
    expect(city.timeline).toBeNull();
  });
});
