import { describe, expect, it } from "vitest";
import { makeFakeCity } from "./fakeCity";

describe("makeFakeCity", () => {
  it("creates deterministic city data for the same seed", () => {
    const first = makeFakeCity(42);
    const second = makeFakeCity(42);

    expect(first).toEqual(second);
    expect(first.files).toHaveLength(300);
    expect(first.files[0]?.path).toBe("apps/server/src/analysis/analyze-237.go");
    expect(first.files.some((file) => file.path === "apps/server/src/api/analyze.ts")).toBe(true);
  });

  it("keeps ids, stats, districts, and edges internally consistent", () => {
    const city = makeFakeCity(7);

    expect(city.version).toBe(1);
    expect(city.stats.fileCount).toBe(city.files.length);
    expect(city.stats.totalLoc).toBe(city.files.reduce((total, file) => total + file.loc, 0));
    expect(city.districts.length).toBeGreaterThan(0);
    expect(city.edges.length).toBeGreaterThan(0);

    for (const [index, file] of city.files.entries()) {
      expect(file.id).toBe(index);
      expect(file.w).toBeGreaterThan(0);
      expect(file.d).toBeGreaterThan(0);
      expect(file.risk).toBeGreaterThanOrEqual(0);
      expect(file.risk).toBeLessThanOrEqual(1);
    }

    for (const edge of city.edges) {
      expect(edge.from).toBeGreaterThanOrEqual(0);
      expect(edge.from).toBeLessThan(city.files.length);
      expect(edge.to).toBeGreaterThanOrEqual(0);
      expect(edge.to).toBeLessThan(city.files.length);
      expect(edge.from).not.toBe(edge.to);
    }
  });
});
