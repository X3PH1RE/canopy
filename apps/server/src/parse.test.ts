import { describe, expect, it } from "vitest";
import { analyzeTextFile } from "./parse";

describe("analyzeTextFile", () => {
  it("extracts basic TypeScript metrics and function summaries", () => {
    const metrics = analyzeTextFile({
      path: "src/app.ts",
      language: "typescript",
      content: `
export function start() {
  if (ready && enabled) {
    return true;
  }
  return false;
}

const stop = () => {
  for (const item of items) console.log(item);
};
`,
      loc: 10,
    });

    expect(metrics.functionCount).toBe(2);
    expect(metrics.complexity).toBeGreaterThanOrEqual(4);
    expect(metrics.maxFunctionComplexity).toBeGreaterThanOrEqual(2);
    expect(metrics.functions.map((fn) => fn.name)).toContain("start");
  });

  it("uses Python def names and branch keywords", () => {
    const metrics = analyzeTextFile({
      path: "app/views.py",
      language: "python",
      content: "def index():\n    if ok or debug:\n        return 'ok'\n",
      loc: 3,
    });

    expect(metrics.functionCount).toBe(1);
    expect(metrics.complexity).toBeGreaterThanOrEqual(3);
    expect(metrics.functions[0]?.name).toBe("index");
  });
});
