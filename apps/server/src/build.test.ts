import { describe, expect, it } from "vitest";
import type { Timeline } from "@canopy/shared";
import { buildCityFromWalk } from "./build";

describe("buildCityFromWalk", () => {
  it("assembles CityData with parser metrics, layout, stats, and edges", async () => {
    const city = await buildCityFromWalk({
      repo: {
        url: "https://github.com/acme/demo.git",
        name: "acme/demo",
        headSha: "abc123",
        truncated: false,
      },
      analyzedAt: "2026-10-10T17:30:00.000Z",
      files: [
        {
          path: "src/app.ts",
          language: "typescript",
          loc: 5,
          content: "// ignored by tree-sitter loc\nimport './router';\nexport function app() {\n  if (ok) return true;\n}\n",
        },
        {
          path: "src/router.ts",
          language: "typescript",
          loc: 2,
          content: "export const router = true;\n",
        },
      ],
    });

    expect(city.repo.name).toBe("acme/demo");
    expect(city.stats.fileCount).toBe(2);
    expect(city.stats.totalLoc).toBe(5);
    expect(city.stats.languages).toEqual({ typescript: 2 });
    expect(city.files[0]?.x).toEqual(expect.any(Number));
    expect(city.edges).toEqual([{ from: 0, to: 1, weight: 1 }]);
    expect(city.timeline).toBeNull();
    expect(city.files[0]).toMatchObject({ churn: 0, authorCount: 0, risk: 0 });
  });

  it("applies injected history metrics and risk scores", async () => {
    const timeline: Timeline = {
      frameCount: 100,
      frameDates: ["2026-01-01T00:00:00.000Z", "2026-01-02T00:00:00.000Z"],
      locSeries: [[[0, 10], [99, 80]], [[99, 30]]],
      changeFrames: [[0, 99], [99]],
    };
    const city = await buildCityFromWalk({
      repo: {
        url: "https://github.com/acme/demo.git",
        name: "acme/demo",
        headSha: "abc123",
        truncated: false,
      },
      analyzedAt: "2026-10-10T17:30:00.000Z",
      history: {
        commitCount: 4,
        authorCount: 2,
        truncated: true,
        timeline,
        files: new Map([
          [
            "src/app.ts",
            {
              churn: 3,
              authorCount: 1,
              commitCount: 3,
              lastModified: "2026-01-02T00:00:00.000Z",
              commitTimestamps: [1, 2, 3],
            },
          ],
          [
            "src/router.ts",
            {
              churn: 1,
              authorCount: 2,
              commitCount: 1,
              lastModified: "2026-01-01T00:00:00.000Z",
              commitTimestamps: [1],
            },
          ],
        ]),
      },
      files: [
        {
          path: "src/app.ts",
          language: "typescript",
          loc: 80,
          content: longFunction("app", 30),
        },
        {
          path: "src/router.ts",
          language: "typescript",
          loc: 30,
          content: longFunction("router", 24),
        },
      ],
    });

    expect(city.repo.truncated).toBe(true);
    expect(city.stats.commitCount).toBe(4);
    expect(city.stats.authorCount).toBe(2);
    expect(city.timeline).toBe(timeline);
    expect(city.files[0]).toMatchObject({
      path: "src/app.ts",
      churn: 3,
      authorCount: 1,
      lastModified: "2026-01-02T00:00:00.000Z",
    });
    expect(city.files[0]?.risk).toBeGreaterThan(city.files[1]?.risk ?? 0);
  });
});

function longFunction(name: string, lines: number): string {
  return [
    `export function ${name}() {`,
    "  if (ready) return true;",
    ...Array.from({ length: lines }, (_, index) => `  const value${index} = ${index};`),
    "  return false;",
    "}",
    "",
  ].join("\n");
}
