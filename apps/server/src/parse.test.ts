import { describe, expect, it } from "vitest";
import { analyzeTextFile, analyzeTextFileWithParsers } from "./parse";

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

describe("analyzeTextFileWithParsers", () => {
  it("uses tree-sitter for TypeScript loc and function metrics when available", async () => {
    const metrics = await analyzeTextFileWithParsers({
      path: "src/app.ts",
      language: "typescript",
      content: `
// tree-sitter should remove this from loc
export function start() {
  if (ready) {
    return true;
  }
  return false;
}
`,
      loc: 7,
    });

    expect(metrics.loc).toBe(6);
    expect(metrics.functionCount).toBe(1);
    expect(metrics.functions[0]?.name).toBe("start");
    expect(metrics.complexity).toBeGreaterThanOrEqual(2);
  });
});
