import path from "node:path";
import type { FunctionInfo } from "@canopy/shared";
import type { WalkFile } from "./walk";
import type { Language, Node, Parser as TreeSitterParser } from "web-tree-sitter";

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

type TreeSitterModule = typeof import("web-tree-sitter");

const treeSitter = require("web-tree-sitter") as TreeSitterModule;
let parserInit: Promise<void> | null = null;
const languageCache = new Map<string, Promise<Language>>();

export async function analyzeTextFileWithParsers(
  file: Omit<WalkFile, "path"> & { path: string },
  id = 0,
): Promise<ParsedFile> {
  try {
    return (await analyzeWithTreeSitter(file, id)) ?? analyzeTextFile(file, id);
  } catch {
    return analyzeTextFile(file, id);
  }
}

async function analyzeWithTreeSitter(
  file: Omit<WalkFile, "path"> & { path: string },
  id: number,
): Promise<ParsedFile | null> {
  const grammar = grammarForFile(file.path, file.language);
  if (!grammar) {
    return null;
  }

  await initParserRuntime();
  const parser = new treeSitter.Parser();
  let tree: ReturnType<TreeSitterParser["parse"]> | null = null;
  try {
    parser.setLanguage(await loadLanguage(grammar));
    tree = parser.parse(file.content);
    if (!tree || tree.rootNode.hasError) {
      return null;
    }

    const root = tree.rootNode;
    const functions = extractTreeSitterFunctions(root, file.language);
    const functionCount = functions.length;
    const branchCount = countTreeSitterBranches(root);
    const complexity = Math.max(functionCount, functionCount + branchCount);
    const maxFunctionComplexity = Math.max(
      1,
      ...functions.map((fn) => fn.complexity),
      Math.ceil(complexity / Math.max(1, functionCount)),
    );

    return {
      id,
      path: file.path,
      name: path.posix.basename(file.path),
      language: file.language,
      content: file.content,
      loc: countLocWithoutCommentOnlyLines(file.content, root),
      functionCount,
      complexity,
      maxFunctionComplexity,
      functions: functions
        .sort((a, b) => b.complexity - a.complexity || a.startLine - b.startLine)
        .slice(0, 40)
        .sort((a, b) => a.startLine - b.startLine),
    };
  } finally {
    tree?.delete();
    parser.delete();
  }
}

async function initParserRuntime(): Promise<void> {
  parserInit ??= treeSitter.Parser.init({
    locateFile: (scriptName: string) =>
      scriptName.endsWith(".wasm") ? require.resolve("web-tree-sitter/tree-sitter.wasm") : scriptName,
  } as Parameters<typeof treeSitter.Parser.init>[0]);
  return parserInit;
}

function loadLanguage(grammar: string): Promise<Language> {
  const existing = languageCache.get(grammar);
  if (existing) {
    return existing;
  }

  const loaded = treeSitter.Language.load(require.resolve(`tree-sitter-wasms/out/tree-sitter-${grammar}.wasm`));
  languageCache.set(grammar, loaded);
  return loaded;
}

function grammarForFile(filePath: string, language: string): string | null {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".tsx") {
    return "tsx";
  }
  if (language === "typescript") {
    return "typescript";
  }
  if (language === "javascript") {
    return "javascript";
  }
  if (language === "python") {
    return "python";
  }
  if (language === "go") {
    return "go";
  }
  if (language === "java") {
    return "java";
  }
  return null;
}

function extractTreeSitterFunctions(root: Node, language: string): FunctionInfo[] {
  const functions: FunctionInfo[] = [];

  walkTree(root, (node) => {
    if (!isFunctionNode(node, language)) {
      return;
    }

    const name = functionName(node);
    if (!name) {
      return;
    }

    functions.push({
      name,
      startLine: node.startPosition.row + 1,
      endLine: node.endPosition.row + 1,
      complexity: 1 + countTreeSitterBranches(node),
    });
  });

  return functions;
}

function isFunctionNode(node: Node, language: string): boolean {
  if (language === "python") {
    return node.type === "function_definition";
  }
  if (language === "go") {
    return node.type === "function_declaration" || node.type === "method_declaration";
  }
  if (language === "java") {
    return node.type === "method_declaration" || node.type === "constructor_declaration";
  }
  return [
    "function_declaration",
    "generator_function_declaration",
    "method_definition",
    "function_expression",
    "arrow_function",
  ].includes(node.type);
}

function functionName(node: Node): string | null {
  const ownName = node.childForFieldName("name")?.text;
  if (ownName) {
    return ownName;
  }

  const parent = node.parent;
  if (parent?.type === "variable_declarator" || parent?.type === "assignment_expression") {
    return parent.childForFieldName("name")?.text ?? parent.childForFieldName("left")?.text ?? null;
  }

  return null;
}

function countTreeSitterBranches(root: Node): number {
  let branches = 0;
  walkTree(root, (node) => {
    if (isBranchNode(node)) {
      branches += 1;
    }
  });
  return branches;
}

function isBranchNode(node: Node): boolean {
  if (
    [
      "if_statement",
      "elif_clause",
      "for_statement",
      "for_in_statement",
      "enhanced_for_statement",
      "while_statement",
      "do_statement",
      "switch_case",
      "case_statement",
      "catch_clause",
      "except_clause",
      "ternary_expression",
      "conditional_expression",
    ].includes(node.type)
  ) {
    return true;
  }

  return (node.type === "binary_expression" || node.type === "boolean_operator") && /&&|\|\||\band\b|\bor\b/.test(node.text);
}

function countLocWithoutCommentOnlyLines(content: string, root: Node): number {
  const commentRanges: Array<{ start: number; end: number }> = [];
  walkTree(root, (node) => {
    if (node.type.includes("comment")) {
      commentRanges.push({ start: node.startIndex, end: node.endIndex });
    }
  });

  let lineStart = 0;
  let loc = 0;
  for (const line of content.split(/\r?\n/)) {
    const trimmedStartOffset = line.search(/\S/);
    if (trimmedStartOffset >= 0) {
      const trimmedEnd = lineStart + line.trimEnd().length;
      const trimmedStart = lineStart + trimmedStartOffset;
      const isCommentOnly = commentRanges.some((range) => range.start <= trimmedStart && range.end >= trimmedEnd);
      if (!isCommentOnly) {
        loc += 1;
      }
    }
    lineStart += line.length + 1;
  }

  return loc;
}

function walkTree(node: Node, visit: (node: Node) => void): void {
  visit(node);
  for (const child of node.namedChildren) {
    if (child) {
      walkTree(child, visit);
    }
  }
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
