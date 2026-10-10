import type { CityData } from "@canopy/shared";

export type SearchResultKind = "file" | "function";

export interface SearchResult {
  fileId: number;
  label: string;
  detail: string;
  kind: SearchResultKind;
  score: number;
}

export function searchCity(city: CityData, query: string, limit = 8): SearchResult[] {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return [];
  }

  const results: SearchResult[] = [];
  for (const file of city.files) {
    const pathScore = scoreFile(file.path, file.name, needle);
    if (pathScore !== null) {
      results.push({
        fileId: file.id,
        label: file.name,
        detail: file.path,
        kind: "file",
        score: pathScore,
      });
    }

    for (const fn of file.functions ?? []) {
      const functionScore = scoreFunction(fn.name, needle);
      if (functionScore !== null) {
        results.push({
          fileId: file.id,
          label: fn.name,
          detail: `${file.path}:${fn.startLine}`,
          kind: "function",
          score: functionScore,
        });
      }
    }
  }

  return results
    .sort((a, b) => a.score - b.score || a.detail.localeCompare(b.detail) || a.label.localeCompare(b.label))
    .slice(0, limit);
}

function scoreFile(filePath: string, fileName: string, needle: string): number | null {
  const path = filePath.toLowerCase();
  const name = fileName.toLowerCase();
  const stem = name.replace(/\.[^.]+$/, "");

  if (path === needle || name === needle || stem === needle) {
    return 0;
  }
  if (path.includes(`/${needle}/`) || path.startsWith(`${needle}/`)) {
    return 10;
  }
  if (path.startsWith(needle)) {
    return 20;
  }
  if (stem.startsWith(needle)) {
    return 30;
  }
  if (name.includes(needle)) {
    return 35;
  }
  if (path.includes(needle)) {
    return 40;
  }

  return null;
}

function scoreFunction(value: string, needle: string): number | null {
  const haystack = value.toLowerCase();
  if (haystack === needle) {
    return 5;
  }
  if (haystack.startsWith(needle)) {
    return 25;
  }
  if (haystack.includes(needle)) {
    return 45;
  }
  return null;
}
