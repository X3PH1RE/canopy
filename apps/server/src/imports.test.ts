import { describe, expect, it } from "vitest";
import { extractDependencyEdges } from "./imports";
import type { ParsedFile } from "./parse";

const files: ParsedFile[] = [
  file(0, "src/app.ts", "import { router } from './router';\nimport './router';\n"),
  file(1, "src/router.ts", "export const router = true;\n"),
  file(2, "src/index.ts", "export * from './app';\n"),
  file(3, "pkg/views.py", "from .helpers import render\n"),
  file(4, "pkg/helpers.py", "def render(): pass\n"),
];

describe("extractDependencyEdges", () => {
  it("resolves relative TypeScript and Python imports and merges duplicates", () => {
    expect(extractDependencyEdges(files)).toEqual([
      { from: 0, to: 1, weight: 2 },
      { from: 2, to: 0, weight: 1 },
      { from: 3, to: 4, weight: 1 },
    ]);
  });
});

function file(id: number, path: string, content: string): ParsedFile {
  return {
    id,
    path,
    name: path.split("/").at(-1) ?? path,
    language: path.endsWith(".py") ? "python" : "typescript",
    content,
    loc: 1,
    functionCount: 1,
    complexity: 1,
    maxFunctionComplexity: 1,
    functions: [],
  };
}
