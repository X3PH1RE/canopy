import { describe, expect, it } from "vitest";
import { loadingCopyForStage } from "./loading";

describe("loading copy", () => {
  it("maps known analysis stages to seed-to-tree copy", () => {
    expect(loadingCopyForStage("queued").title).toBe("Planting the seed");
    expect(loadingCopyForStage("cloning").detail).toContain("repo");
    expect(loadingCopyForStage("parsing").title).toBe("Reading the rings");
    expect(loadingCopyForStage("layout").detail).toContain("districts");
  });

  it("humanizes unknown stages", () => {
    expect(loadingCopyForStage("counting-widgets")).toEqual({
      title: "Growing your city",
      detail: "Counting widgets",
    });
  });
});
