import { describe, expect, it } from "vitest";
import type { CityData, FileNode, Timeline } from "@canopy/shared";
import {
  buildingHeight,
  buildingVisual,
  fileById,
  fileCenter,
  fileChangedRecently,
  fileLocAtFrame,
  filePulseIntensity,
  locAtFrame,
  sceneWorldSize,
} from "./model";

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

  it("keeps all-zero churn repos at the low sunlight ramp without glow", () => {
    const files = [
      { ...file, id: 1, churn: 0 },
      { ...file, id: 2, churn: 0 },
    ];

    expect(buildingVisual(files[0]!, files, "churn")).toMatchObject({
      color: "#f4ecd8",
      emissiveIntensity: 0,
    });
  });

  it("looks up sparse timeline LOC at and between change points", () => {
    expect(locAtFrame([], 10)).toBe(0);
    expect(locAtFrame([[12, 24]], 8)).toBe(0);
    expect(locAtFrame([[12, 24]], 12)).toBe(24);
    expect(locAtFrame([[0, 4], [10, 18], [20, 12]], 19)).toBe(18);
    expect(locAtFrame([[0, 4], [10, 18], [20, 12]], 21)).toBe(12);
  });

  it("uses static LOC exactly on the final timeline frame", () => {
    const timeline: Timeline = {
      frameCount: 4,
      frameDates: [
        "2024-01-01T00:00:00.000Z",
        "2024-01-02T00:00:00.000Z",
        "2024-01-03T00:00:00.000Z",
        "2024-01-04T00:00:00.000Z",
      ],
      locSeries: [[[0, 4], [2, 120]]],
      changeFrames: [[0, 2]],
    };

    expect(fileLocAtFrame({ ...file, id: 0, loc: 127 }, timeline, 0)).toBe(4);
    expect(fileLocAtFrame({ ...file, id: 0, loc: 127 }, timeline, 3)).toBe(127);
  });

  it("detects files changed within the recent timeline window", () => {
    const timeline: Timeline = {
      frameCount: 12,
      frameDates: Array.from({ length: 12 }, (_, index) => `2024-01-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`),
      locSeries: [[], []],
      changeFrames: [[1, 6], [2]],
    };

    expect(fileChangedRecently(0, timeline, 10, 5)).toBe(true);
    expect(fileChangedRecently(0, timeline, 12, 5)).toBe(false);
    expect(fileChangedRecently(1, timeline, 10, 5)).toBe(false);
    expect(fileChangedRecently(9, timeline, 10, 5)).toBe(false);
  });

  it("computes warm pulse intensity for recent timeline changes only", () => {
    const timeline: Timeline = {
      frameCount: 20,
      frameDates: Array.from({ length: 20 }, (_, index) => `2024-02-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`),
      locSeries: [[], []],
      changeFrames: [[5, 10], [1]],
    };

    expect(filePulseIntensity(0, timeline, 12, 5)).toBeCloseTo(0.32, 5);
    expect(filePulseIntensity(0, timeline, 16, 5)).toBe(0);
    expect(filePulseIntensity(1, timeline, 12, 5)).toBe(0);
    expect(filePulseIntensity(0, null, 12, 5)).toBe(0);
  });
});
