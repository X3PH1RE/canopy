import { readFile } from "node:fs/promises";
import path from "node:path";
import { runGit } from "./clone";

export interface WalkFile {
  path: string;
  content: string;
  loc: number;
  language: string;
}

export interface WalkResult {
  files: WalkFile[];
  truncated: boolean;
}

export interface WalkOptions {
  maxFiles?: number;
  maxBytes?: number;
}

interface WalkEntry {
  path: string;
  content: Buffer;
}

const DEFAULT_MAX_FILES = 2500;
const DEFAULT_MAX_BYTES = 300 * 1024;
const SKIP_SEGMENTS = [
  "node_modules",
  "vendor",
  "dist",
  "build",
  "third_party",
  "__pycache__",
  ".venv",
];
const SKIP_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".svg",
  ".ico",
  ".pdf",
  ".zip",
  ".gz",
  ".woff",
  ".woff2",
  ".ttf",
  ".mp3",
  ".mp4",
  ".mov",
  ".wasm",
  ".bin",
  ".lock",
]);
const LOCK_FILES = new Set(["package-lock.json", "pnpm-lock.yaml", "yarn.lock", "Cargo.lock", "poetry.lock"]);

export async function walkRepoFiles(repoDir: string, options: WalkOptions = {}): Promise<WalkResult> {
  const output = await runGit(["-C", repoDir, "ls-files", "-z"]);
  const paths = parseGitFileList(output);
  const entries = await Promise.all(
    paths.map(async (filePath) => ({
      path: filePath,
      content: await readFile(path.join(repoDir, filePath)),
    })),
  );

  return collectWalkFiles(entries, options);
}

export function parseGitFileList(output: string): string[] {
  return output.split("\0").filter(Boolean);
}

export function collectWalkFiles(entries: WalkEntry[], options: WalkOptions = {}): WalkResult {
  const maxFiles = options.maxFiles ?? DEFAULT_MAX_FILES;
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  const files: WalkFile[] = [];

  for (const entry of entries) {
    if (shouldSkipPath(entry.path) || entry.content.byteLength > maxBytes) {
      continue;
    }

    const content = decodeUtf8(entry.content);
    if (content === null) {
      continue;
    }

    files.push({
      path: normalizePath(entry.path),
      content,
      loc: countLoc(content),
      language: languageForPath(entry.path),
    });
  }

  const truncated = files.length > maxFiles;
  const capped = truncated
    ? [...files].sort((a, b) => b.loc - a.loc || a.path.localeCompare(b.path)).slice(0, maxFiles)
    : files;

  return {
    files: capped.sort((a, b) => a.path.localeCompare(b.path)),
    truncated,
  };
}

export function shouldSkipPath(filePath: string): boolean {
  const normalized = normalizePath(filePath);
  const parts = normalized.split("/");
  const fileName = parts.at(-1) ?? normalized;

  return (
    parts.some((part) => SKIP_SEGMENTS.includes(part)) ||
    normalized.includes(".min.") ||
    LOCK_FILES.has(fileName) ||
    SKIP_EXTENSIONS.has(path.extname(fileName).toLowerCase())
  );
}

export function languageForPath(filePath: string): string {
  const extension = path.extname(filePath).toLowerCase();
  switch (extension) {
    case ".ts":
    case ".tsx":
      return "typescript";
    case ".js":
    case ".jsx":
    case ".mjs":
      return "javascript";
    case ".py":
      return "python";
    case ".go":
      return "go";
    case ".java":
      return "java";
    case ".md":
      return "markdown";
    default:
      return "other";
  }
}

export function countLoc(content: string): number {
  return content.split(/\r?\n/).filter((line) => line.trim().length > 0).length;
}

function decodeUtf8(content: Buffer): string | null {
  const decoded = content.toString("utf8");
  if (decoded.includes("\uFFFD")) {
    return null;
  }

  return decoded;
}

function normalizePath(filePath: string): string {
  return filePath.replaceAll("\\", "/");
}
