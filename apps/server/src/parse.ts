import path from "node:path";
import type { FunctionInfo } from "@canopy/shared";
import type { WalkFile } from "./walk";

export interface ParsedFile {
  id: number;
  path: string;
  name: string;
  language: string;
  content: string;
  loc: number;
  functionCount: number;
  complexity: number;
  maxFunctionComplexity: number;
  functions: FunctionInfo[];
}

export function analyzeTextFile(file: Omit<WalkFile, "path"> & { path: string }, id = 0): ParsedFile {
  const functions = extractFunctions(file.content, file.language);
  const functionCount = Math.max(functions.length, estimateFunctionCount(file.content, file.language));
  const complexity = Math.max(functionCount, functionCount + countComplexity(file.content, file.language));
  const maxFunctionComplexity = Math.max(1, Math.ceil(complexity / Math.max(1, functionCount)));

  return {
    id,
    path: file.path,
    name: path.posix.basename(file.path),
    language: file.language,
    content: file.content,
    loc: file.loc,
    functionCount,
    complexity,
    maxFunctionComplexity,
    functions: functions.slice(0, 40).map((fn) => ({
      ...fn,
      complexity: Math.max(1, Math.min(maxFunctionComplexity, fn.complexity)),
    })),
  };
}

function extractFunctions(content: string, language: string): FunctionInfo[] {
  const patterns = functionPatterns(language);

  const lines = content.split(/\r?\n/);
  const functions: FunctionInfo[] = [];

  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) {
      const name = match[1];
      if (!name || ["if", "for", "while", "switch", "catch"].includes(name)) {
        continue;
      }

      const startLine = 1 + content.slice(0, match.index ?? 0).split(/\r?\n/).length - 1;
      functions.push({
        name,
        startLine,
        endLine: Math.min(lines.length, startLine + 25),
        complexity: 1 + countComplexity(lines.slice(startLine - 1, startLine + 25).join("\n"), language),
      });
    }
  }

  return functions.sort((a, b) => a.startLine - b.startLine);
}

function estimateFunctionCount(content: string, language: string): number {
  return functionPatterns(language).reduce((total, pattern) => total + countMatches(content, pattern), 0);
}

function countComplexity(content: string, language: string): number {
  const common =
    countMatches(content, /\bif\b/g) +
    countMatches(content, /\bfor\b/g) +
    countMatches(content, /\bwhile\b/g) +
    countMatches(content, /\bcase\b/g) +
    countMatches(content, /\bcatch\b/g) +
    countMatches(content, /&&|\|\||\?/g);

  if (language === "python") {
    return common + countMatches(content, /\belif\b|\bexcept\b|\band\b|\bor\b/g);
  }

  return common;
}

function countMatches(content: string, pattern: RegExp): number {
  return Array.from(content.matchAll(pattern)).length;
}

function functionPatterns(language: string): RegExp[] {
  if (language === "python") {
    return [/^\s*def\s+([A-Za-z_]\w*)\s*\(/gm];
  }

  if (language === "go") {
    return [/\bfunc\s+([A-Za-z_]\w*)\s*\(/g];
  }

  if (language === "java") {
    return [/\b(?:public|private|protected)?\s*(?:static\s+)?[A-Za-z_<>,\[\]]+\s+([A-Za-z_]\w*)\s*\(/g];
  }

  return [
    /\b(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/g,
    /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\(?/g,
  ];
}
