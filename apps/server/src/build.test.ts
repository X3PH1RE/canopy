import { describe, expect, it } from "vitest";
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
  });
});
