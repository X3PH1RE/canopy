import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { CityData } from "@canopy/shared";

export function cacheKey(repoUrl: string, headSha: string): string {
  return createHash("sha1").update(`${repoUrl}:${headSha}`).digest("hex");
}

export function resultPath(cacheRoot: string, key: string): string {
  return path.join(cacheRoot, "results", `${key}.json`);
}

export async function readCachedCity(cacheRoot: string, key: string): Promise<CityData | null> {
  try {
    const content = await readFile(resultPath(cacheRoot, key), "utf8");
    return JSON.parse(content) as CityData;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

export async function writeCachedCity(cacheRoot: string, key: string, city: CityData): Promise<void> {
  const filePath = resultPath(cacheRoot, key);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(city)}\n`, "utf8");
}
