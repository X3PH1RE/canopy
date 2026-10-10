import { describe, expect, it } from "vitest";
import { buildCityFromWalk } from "./build";

describe("buildCityFromWalk", () => {
  it("assembles CityData with metrics, layout, stats, and edges", () => {
    const city = buildCityFromWalk({
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
          content: "import './router';\nexport function app() { if (ok) return true; }\n",
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
    expect(city.stats.totalLoc).toBe(7);
    expect(city.stats.languages).toEqual({ typescript: 2 });
    expect(city.files[0]?.x).toEqual(expect.any(Number));
    expect(city.edges).toEqual([{ from: 0, to: 1, weight: 1 }]);
    expect(city.timeline).toBeNull();
  });
});
