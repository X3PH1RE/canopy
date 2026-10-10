import { describe, expect, it } from "vitest";
import { layoutCity } from "./layout";

const sampleFiles = [
  { path: "apps/web/src/App.tsx", loc: 120, functionCount: 6 },
  { path: "apps/web/src/scene/City.tsx", loc: 220, functionCount: 10 },
  { path: "apps/server/src/index.ts", loc: 80, functionCount: 3 },
  { path: "packages/shared/src/types.ts", loc: 160, functionCount: 1 },
  { path: "apps/server/src/routes.ts", loc: 55, functionCount: 2 },
];

function overlaps(a: { x: number; z: number; w: number; d: number }, b: { x: number; z: number; w: number; d: number }) {
  return Math.abs(a.x - b.x) < (a.w + b.w) / 2 && Math.abs(a.z - b.z) < (a.d + b.d) / 2;
}

describe("layoutCity", () => {
  it("is deterministic for the same input", () => {
    expect(layoutCity(sampleFiles)).toEqual(layoutCity([...sampleFiles].reverse()));
  });

  it("keeps file rectangles inside the world and non-overlapping", () => {
    const result = layoutCity(sampleFiles, { size: 60, padding: 1 });

    for (const file of result.files) {
      expect(file.w).toBeGreaterThan(0);
      expect(file.d).toBeGreaterThan(0);
      expect(file.x - file.w / 2).toBeGreaterThanOrEqual(-30);
      expect(file.x + file.w / 2).toBeLessThanOrEqual(30);
      expect(file.z - file.d / 2).toBeGreaterThanOrEqual(-30);
      expect(file.z + file.d / 2).toBeLessThanOrEqual(30);
    }

    for (let i = 0; i < result.files.length; i += 1) {
      for (let j = i + 1; j < result.files.length; j += 1) {
        expect(overlaps(result.files[i], result.files[j])).toBe(false);
      }
    }
  });

  it("creates district bounds that contain their files", () => {
    const result = layoutCity(sampleFiles, { size: 60, padding: 1 });
    const webDistrict = result.districts.find((district) => district.path === "apps/web");

    expect(webDistrict).toBeDefined();

    const webFiles = result.files.filter((file) => file.path.startsWith("apps/web/"));
    for (const file of webFiles) {
      expect(file.x - file.w / 2).toBeGreaterThanOrEqual(webDistrict!.x - webDistrict!.w / 2);
      expect(file.x + file.w / 2).toBeLessThanOrEqual(webDistrict!.x + webDistrict!.w / 2);
      expect(file.z - file.d / 2).toBeGreaterThanOrEqual(webDistrict!.z - webDistrict!.d / 2);
      expect(file.z + file.d / 2).toBeLessThanOrEqual(webDistrict!.z + webDistrict!.d / 2);
    }
  });
});
