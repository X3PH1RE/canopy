import type { CityData, FileNode } from "@canopy/shared";
import { extractDependencyEdges } from "./imports";
import { analyzeGitHistory, type GitHistorySummary } from "./gitHistory";
import { layoutCity } from "./layout";
import { analyzeTextFileWithParsers } from "./parse";
import { scoreRisks } from "./risk";
import type { WalkFile } from "./walk";

interface BuildCityInput {
  repo: {
    url: string;
    name: string;
    headSha: string;
    truncated: boolean;
  };
  analyzedAt?: string;
  files: WalkFile[];
  repoDir?: string;
  history?: GitHistorySummary | null;
}

export async function buildCityFromWalk(input: BuildCityInput): Promise<CityData> {
  const parsed = await Promise.all(
    input.files
      .slice()
      .sort((a, b) => a.path.localeCompare(b.path))
      .map((file, id) => analyzeTextFileWithParsers(file, id)),
  );
  const history = input.history ?? (input.repoDir
    ? await analyzeGitHistory(input.repoDir, parsed.map((file) => ({ id: file.id, path: file.path, loc: file.loc })))
    : null);
  const layout = layoutCity(parsed.map((file) => ({
    path: file.path,
    loc: file.loc,
    functionCount: file.functionCount,
  })));
  const layoutByPath = new Map(layout.files.map((file) => [file.path, file]));
  const riskInputs = parsed.map((file) => {
    const fileHistory = history?.files.get(file.path);
    return {
      id: file.id,
      loc: file.loc,
      complexity: file.complexity,
      churn: fileHistory?.churn ?? 0,
      authorCount: fileHistory?.authorCount ?? 0,
    };
  });
  const risks = scoreRisks(riskInputs);
  const analyzedAt = input.analyzedAt ?? new Date().toISOString();
  const files: FileNode[] = parsed.map((file) => {
    const rect = layoutByPath.get(file.path);
    if (!rect) {
      throw new Error(`Missing layout for ${file.path}`);
    }
    const fileHistory = history?.files.get(file.path);

    return {
      id: file.id,
      path: file.path,
      name: file.name,
      language: file.language,
      loc: file.loc,
      functionCount: file.functionCount,
      complexity: file.complexity,
      maxFunctionComplexity: file.maxFunctionComplexity,
      churn: fileHistory?.churn ?? 0,
      authorCount: fileHistory?.authorCount ?? 0,
      lastModified: fileHistory?.lastModified ?? analyzedAt,
      risk: risks.get(file.id) ?? 0,
      x: rect.x,
      z: rect.z,
      w: rect.w,
      d: rect.d,
      functions: file.functions,
    };
  });

  return {
    version: 1,
    repo: {
      url: input.repo.url,
      name: input.repo.name,
      headSha: input.repo.headSha,
      analyzedAt,
      truncated: input.repo.truncated || (history?.truncated ?? false),
    },
    stats: {
      fileCount: files.length,
      totalLoc: files.reduce((sum, file) => sum + file.loc, 0),
      commitCount: history?.commitCount ?? 0,
      authorCount: history?.authorCount ?? 0,
      languages: countLanguages(files),
    },
    files,
    districts: layout.districts,
    edges: extractDependencyEdges(parsed),
    timeline: history?.timeline ?? null,
  };
}

function countLanguages(files: FileNode[]): Record<string, number> {
  return files.reduce<Record<string, number>>((counts, file) => {
    counts[file.language] = (counts[file.language] ?? 0) + 1;
    return counts;
  }, {});
}
