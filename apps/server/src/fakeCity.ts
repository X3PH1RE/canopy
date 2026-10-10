import type { CityData, Edge, FileNode, FunctionInfo } from "@canopy/shared";
import { layoutCity } from "./layout";

const FOLDERS = [
  "apps/server/src/api",
  "apps/server/src/jobs",
  "apps/server/src/analysis",
  "apps/server/src/git",
  "apps/server/src/cache",
  "apps/web/src/scene",
  "apps/web/src/ui",
  "apps/web/src/store",
  "apps/web/src/input",
  "packages/shared/src",
  "scripts",
  "docs",
] as const;

const TOPICS = [
  "analyze",
  "build",
  "city",
  "clone",
  "district",
  "edge",
  "file",
  "graph",
  "history",
  "inspect",
  "layout",
  "metrics",
  "parse",
  "risk",
  "search",
  "timeline",
] as const;

const EXTENSIONS = [
  { ext: "ts", language: "typescript" },
  { ext: "tsx", language: "typescript" },
  { ext: "py", language: "python" },
  { ext: "go", language: "go" },
  { ext: "java", language: "java" },
  { ext: "md", language: "markdown" },
] as const;

export function makeFakeCity(seed = 42): CityData {
  const random = mulberry32(seed);
  const now = "2026-10-10T16:00:00.000Z";
  const sourceFiles = buildSourceFiles(random);
  const layout = layoutCity(sourceFiles.map((file) => ({
    path: file.path,
    loc: file.loc,
    functionCount: file.functionCount,
  })));

  const layoutByPath = new Map(layout.files.map((file) => [file.path, file]));
  const files: FileNode[] = sourceFiles.map((file, id) => {
    const rect = layoutByPath.get(file.path);
    if (!rect) {
      throw new Error(`Missing layout for ${file.path}`);
    }

    return {
      id,
      path: file.path,
      name: file.path.split("/").at(-1) ?? file.path,
      language: file.language,
      loc: file.loc,
      functionCount: file.functionCount,
      complexity: file.complexity,
      maxFunctionComplexity: file.maxFunctionComplexity,
      churn: file.churn,
      authorCount: file.authorCount,
      lastModified: file.lastModified,
      risk: computeRisk(file),
      x: rect.x,
      z: rect.z,
      w: rect.w,
      d: rect.d,
      functions: buildFunctions(file, random),
    };
  });

  return {
    version: 1,
    repo: {
      url: "sample://fake",
      name: "canopy/fake",
      headSha: "fake-phase-1",
      analyzedAt: now,
      truncated: false,
    },
    stats: {
      fileCount: files.length,
      totalLoc: files.reduce((total, file) => total + file.loc, 0),
      commitCount: 420,
      authorCount: 12,
      languages: countLanguages(files),
    },
    files,
    districts: layout.districts,
    edges: buildEdges(files, random),
    timeline: null,
  };
}

interface SourceFile {
  path: string;
  language: string;
  loc: number;
  functionCount: number;
  complexity: number;
  maxFunctionComplexity: number;
  churn: number;
  authorCount: number;
  lastModified: string;
}

function buildSourceFiles(random: () => number): SourceFile[] {
  const files: SourceFile[] = [];
  const used = new Set<string>();

  files.push(makeSourceFile("apps/server/src/api/analyze.ts", "typescript", random));
  used.add("apps/server/src/api/analyze.ts");

  while (files.length < 300) {
    const folder = pick(FOLDERS, random);
    const topic = pick(TOPICS, random);
    const extension = pick(EXTENSIONS, random);
    const suffix = Math.floor(random() * 1000).toString().padStart(3, "0");
    const path = `${folder}/${topic}-${suffix}.${extension.ext}`;

    if (used.has(path)) {
      continue;
    }

    used.add(path);
    files.push(makeSourceFile(path, extension.language, random));
  }

  return files.sort((a, b) => a.path.localeCompare(b.path));
}

function makeSourceFile(path: string, language: string, random: () => number): SourceFile {
  const loc = Math.floor(25 + random() * random() * 850);
  const functionCount = Math.max(1, Math.floor(loc / (35 + random() * 65)));
  const complexity = functionCount + Math.floor(random() * functionCount * 4);

  return {
    path,
    language,
    loc,
    functionCount,
    complexity,
    maxFunctionComplexity: Math.max(1, Math.ceil(complexity / Math.max(1, Math.floor(functionCount / 2)))),
    churn: Math.floor(random() * random() * 35),
    authorCount: 1 + Math.floor(random() * 5),
    lastModified: `2026-10-${String(1 + Math.floor(random() * 10)).padStart(2, "0")}T12:00:00.000Z`,
  };
}

function buildFunctions(file: SourceFile, random: () => number): FunctionInfo[] {
  const count = Math.min(file.functionCount, 8);
  return Array.from({ length: count }, (_, index) => {
    const startLine = 1 + Math.floor((file.loc / Math.max(1, count)) * index);
    const endLine = Math.min(file.loc, startLine + 8 + Math.floor(random() * 30));
    return {
      name: `${file.path.split("/").at(-1)?.split(".")[0] ?? "module"}${index + 1}`,
      startLine,
      endLine,
      complexity: 1 + Math.floor(random() * Math.max(1, file.maxFunctionComplexity)),
    };
  });
}

function buildEdges(files: FileNode[], random: () => number): Edge[] {
  const edges: Edge[] = [];
  const byFolder = new Map<string, FileNode[]>();

  for (const file of files) {
    const folder = file.path.split("/").slice(0, -1).join("/");
    byFolder.set(folder, [...(byFolder.get(folder) ?? []), file]);
  }

  for (const file of files) {
    if (random() > 0.55) {
      continue;
    }

    const folder = file.path.split("/").slice(0, -1).join("/");
    const candidates = (byFolder.get(folder) ?? files).filter((candidate) => candidate.id !== file.id);
    const target = candidates[Math.floor(random() * candidates.length)] ?? files[Math.floor(random() * files.length)];

    if (target && target.id !== file.id) {
      edges.push({ from: file.id, to: target.id, weight: 1 + Math.floor(random() * 3) });
    }
  }

  return edges.slice(0, 450);
}

function countLanguages(files: FileNode[]) {
  return files.reduce<Record<string, number>>((counts, file) => {
    counts[file.language] = (counts[file.language] ?? 0) + 1;
    return counts;
  }, {});
}

function computeRisk(file: SourceFile) {
  if (file.loc < 20) {
    return 0;
  }

  return Math.min(1, (file.churn / 35) * 0.4 + (file.complexity / 120) * 0.35 + (file.loc / 900) * 0.25);
}

function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length)] ?? items[0];
}

function mulberry32(seed: number) {
  let value = seed;
  return () => {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}
