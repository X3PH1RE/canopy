import { describe, expect, it } from "vitest";
import { legendForViewMode } from "./legend";

describe("legend helpers", () => {
  it("returns view-specific legend items", () => {
    expect(legendForViewMode("language").map((item) => item.label)).toEqual([
      "TypeScript",
      "JavaScript",
      "Python",
      "Go",
      "Java",
      "Markdown",
      "Other",
    ]);
    expect(legendForViewMode("churn").map((item) => item.label)).toEqual(["Low churn", "Medium", "High churn"]);
    expect(legendForViewMode("complexity").map((item) => item.label)).toContain("High complexity");
    expect(legendForViewMode("risk").map((item) => item.label)).toContain("High risk");
  });

  it("explains every legend item", () => {
    for (const mode of ["language", "churn", "complexity", "risk"] as const) {
      for (const item of legendForViewMode(mode)) {
        expect(item.info.length).toBeGreaterThan(10);
      }
    }
  });
});
