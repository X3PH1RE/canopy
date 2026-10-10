import { describe, expect, it } from "vitest";
import type { CityData, FileNode } from "@canopy/shared";
import { searchCity } from "./search";

const baseFile: FileNode = {
  id: 0,
  path: "src/index.ts",
  name: "index.ts",
  language: "typescript",
  loc: 10,
  functionCount: 1,
  complexity: 1,
  maxFunctionComplexity: 1,
  churn: 0,
  authorCount: 1,
  lastModified: "2026-10-10T00:00:00.000Z",
  risk: 0,
  x: 0,
  z: 0,
  w: 1,
  d: 1,
};

describe("searchCity", () => {
  it("returns no results for empty or whitespace queries", () => {
    expect(searchCity(cityFixture(), "")).toEqual([]);
    expect(searchCity(cityFixture(), "   ")).toEqual([]);
  });

  it("ranks exact and prefix file matches before broad substring matches", () => {
    const results = searchCity(cityFixture(), "router");

    expect(results.map((result) => result.fileId)).toEqual([1, 2, 3]);
    expect(results[0]).toMatchObject({ fileId: 1, label: "router.ts", kind: "file" });
  });

  it("finds function names and returns the owning file id", () => {
    const results = searchCity(cityFixture(), "createapp");

    expect(results[0]).toMatchObject({
      fileId: 0,
      label: "createApp",
      kind: "function",
    });
  });

  it("caps results to the requested limit", () => {
    expect(searchCity(cityFixture(), "src", 2)).toHaveLength(2);
  });
});

function cityFixture(): CityData {
  const files: FileNode[] = [
    {
      ...baseFile,
      id: 0,
      path: "src/index.ts",
      name: "index.ts",
      functions: [{ name: "createApp", startLine: 1, endLine: 8, complexity: 2 }],
    },
    { ...baseFile, id: 1, path: "src/router.ts", name: "router.ts" },
    { ...baseFile, id: 2, path: "src/router/index.ts", name: "index.ts" },
    { ...baseFile, id: 3, path: "src/http/router-utils.ts", name: "router-utils.ts" },
  ];

  return {
    version: 1,
    repo: {
      url: "https://github.com/example/repo",
      name: "example/repo",
      headSha: "abc",
      analyzedAt: "2026-10-10T00:00:00.000Z",
      truncated: false,
    },
    stats: {
      fileCount: files.length,
      totalLoc: 40,
      commitCount: 0,
      authorCount: 0,
      languages: { typescript: files.length },
    },
    files,
    districts: [],
    edges: [],
    timeline: null,
  };
}
