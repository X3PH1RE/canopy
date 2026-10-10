import { describe, expect, it } from "vitest";
import type { CityData, FileNode } from "@canopy/shared";
import { buildingHeight, buildingVisual, fileById, fileCenter, sceneWorldSize } from "./model";

const file: FileNode = {
  id: 1,
  path: "src/App.tsx",
  name: "App.tsx",
  language: "typescript",
  loc: 127,
  functionCount: 4,
  complexity: 7,
  maxFunctionComplexity: 3,
  churn: 12,
  authorCount: 2,
  lastModified: "2026-10-10T00:00:00.000Z",
  risk: 0.3,
  x: 10,
  z: 30,
  w: 8,
  d: 12,
};

describe("scene model helpers", () => {
  it("maps lines of code to a stable logarithmic building height", () => {
    expect(buildingHeight(0)).toBe(0.3);
    expect(buildingHeight(127)).toBeCloseTo(8.4, 5);
  });

  it("uses layout file centers directly as scene coordinates", () => {
    expect(fileCenter(file)).toEqual([10, 30]);
  });

  it("derives a world size from centered city bounds", () => {
    const city = {
      files: [
        { ...file, x: -54, z: 0, w: 12, d: 8 },
        { ...file, id: 2, x: 35, z: 53, w: 10, d: 14 },
      ],
    } as CityData;

    expect(sceneWorldSize(city)).toBe(120);
  });

  it("finds files by id instead of assuming ids are array indexes", () => {
    const files = [
      { ...file, id: 10, name: "first.ts" },
      { ...file, id: 42, name: "selected.ts" },
    ];

    expect(fileById(files, 42)?.name).toBe("selected.ts");
  });

  it("uses language colors in language view", () => {
    expect(buildingVisual(file, [file], "language")).toMatchObject({
      color: "#5fa8a0",
      roofColor: "#5a9a52",
      emissiveIntensity: 0,
    });
  });

  it("maps churn, complexity, and risk modes to solarpunk ramps", () => {
    const files = [
      { ...file, id: 1, churn: 0, complexity: 1, risk: 0, loc: 40 },
      { ...file, id: 2, churn: 5, complexity: 10, risk: 0.5, loc: 80 },
      { ...file, id: 3, churn: 10, complexity: 20, risk: 1, loc: 160 },
    ];

    expect(buildingVisual(files[2]!, files, "churn").color).toBe("#ff8a1f");
    expect(buildingVisual(files[2]!, files, "churn").emissiveIntensity).toBeGreaterThan(
      buildingVisual(files[0]!, files, "churn").emissiveIntensity,
    );
    expect(buildingVisual(files[2]!, files, "complexity").color).toBe("#6b3f7a");
    expect(buildingVisual(files[2]!, files, "risk")).toMatchObject({
      color: "#c4452d",
      roofColor: "#d9cdb4",
    });
    expect(buildingVisual(files[2]!, files, "risk").emissiveIntensity).toBeGreaterThan(0.2);
  });
});
