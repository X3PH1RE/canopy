import path from "node:path";
import type { Edge } from "@canopy/shared";
import type { ParsedFile } from "./parse";

const JS_EXTENSIONS = ["", ".ts", ".tsx", ".js", ".jsx", ".mjs", "/index.ts", "/index.tsx", "/index.js", "/index.jsx"];
const PY_EXTENSIONS = ["", ".py", "/__init__.py"];

export function extractDependencyEdges(files: ParsedFile[]): Edge[] {
  const idByPath = new Map(files.map((file) => [file.path, file.id]));
  const weights = new Map<string, Edge>();

  for (const file of files) {
    for (const specifier of importSpecifiers(file)) {
      const target = resolveImport(file.path, specifier, idByPath);
      if (target === null || target === file.id) {
        continue;
      }

      const key = `${file.id}:${target}`;
      const current = weights.get(key);
      if (current) {
        current.weight += 1;
      } else {
        weights.set(key, { from: file.id, to: target, weight: 1 });
      }
    }
  }

  return [...weights.values()].slice(0, 1500).sort((a, b) => a.from - b.from || a.to - b.to);
}

function importSpecifiers(file: ParsedFile): string[] {
  const specs: string[] = [];

  for (const match of file.content.matchAll(/\b(?:import|export)\b[^'"]*\bfrom\s*['"]([^'"]+)['"]/g)) {
    specs.push(match[1] ?? "");
  }

  for (const match of file.content.matchAll(/\bimport\s*['"]([^'"]+)['"]/g)) {
    specs.push(match[1] ?? "");
  }

  for (const match of file.content.matchAll(/\brequire\(\s*['"]([^'"]+)['"]\s*\)/g)) {
    specs.push(match[1] ?? "");
  }

  for (const match of file.content.matchAll(/^\s*from\s+(\.+[A-Za-z_][\w.]*)\s+import\b/gm)) {
    specs.push(normalizePythonRelativeSpecifier(match[1] ?? ""));
  }

  return specs.filter((specifier) => specifier.startsWith(".") || specifier.startsWith("/"));
}

function normalizePythonRelativeSpecifier(specifier: string): string {
  const leading = specifier.match(/^\.+/)?.[0] ?? "";
  const rest = specifier.slice(leading.length).replaceAll(".", "/");

  if (leading.length <= 1) {
    return `./${rest}`;
  }

  return `${"../".repeat(leading.length - 1)}${rest}`;
}

function resolveImport(fromPath: string, specifier: string, idByPath: Map<string, number>): number | null {
  const baseDir = path.posix.dirname(fromPath);
  const rawBase = specifier.startsWith("/")
    ? specifier.slice(1)
    : path.posix.normalize(path.posix.join(baseDir, specifier));
  const extensions = fromPath.endsWith(".py") ? PY_EXTENSIONS : JS_EXTENSIONS;

  for (const extension of extensions) {
    const candidate = normalizePath(`${rawBase}${extension}`);
    const id = idByPath.get(candidate);
    if (id !== undefined) {
      return id;
    }
  }

  return null;
}

function normalizePath(filePath: string): string {
  return filePath.replaceAll("\\", "/").replace(/^\.\//, "");
}
