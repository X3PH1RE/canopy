import { describe, expect, it } from "vitest";
import { scoreRisks } from "./risk";

describe("scoreRisks", () => {
  it("uses percentile-ranked churn, complexity, and loc while keeping tiny files at zero", () => {
    const scores = scoreRisks([
      { id: 0, loc: 10, complexity: 100, churn: 100, authorCount: 1 },
      { id: 1, loc: 100, complexity: 1, churn: 1, authorCount: 2 },
      { id: 2, loc: 200, complexity: 20, churn: 10, authorCount: 2 },
    ]);

    expect(scores.get(0)).toBe(0);
    expect(scores.get(1)).toBeCloseTo(0.125);
    expect(scores.get(2)).toBeCloseTo(0.625);
  });

  it("boosts single-author files in the top churn percentile", () => {
    const scores = scoreRisks([
      { id: 0, loc: 100, complexity: 1, churn: 10, authorCount: 1 },
      { id: 1, loc: 100, complexity: 1, churn: 5, authorCount: 2 },
      { id: 2, loc: 50, complexity: 1, churn: 0, authorCount: 2 },
    ]);

    expect(scores.get(0)).toBeCloseTo(0.876875);
    expect(scores.get(0)).toBeGreaterThan(scores.get(1) ?? 0);
  });
});
