import { describe, expect, it } from "vitest";
import { normalizeRepoUrl } from "./clone";
import { collectWalkFiles, shouldSkipPath } from "./walk";

describe("normalizeRepoUrl", () => {
  it("accepts public GitHub HTTPS URLs and normalizes names", () => {
    expect(normalizeRepoUrl("https://github.com/expressjs/express")).toEqual({
      owner: "expressjs",
      repo: "express",
      name: "expressjs/express",
      url: "https://github.com/expressjs/express.git",
      cacheName: "expressjs__express",
    });

    expect(normalizeRepoUrl("https://github.com/pallets/flask.git/").url).toBe(
      "https://github.com/pallets/flask.git",
    );
  });

  it("rejects non-GitHub, SSH, and malformed URLs", () => {
    expect(() => normalizeRepoUrl("git@github.com:expressjs/express.git")).toThrow(/GitHub/);
    expect(() => normalizeRepoUrl("https://example.com/expressjs/express")).toThrow(/GitHub/);
    expect(() => normalizeRepoUrl("https://github.com/owner")).toThrow(/GitHub/);
  });
});

describe("shouldSkipPath", () => {
  it("skips vendored, build, media, binary, and lock files", () => {
    expect(shouldSkipPath("src/index.ts")).toBe(false);
    expect(shouldSkipPath("node_modules/pkg/index.js")).toBe(true);
    expect(shouldSkipPath("dist/app.js")).toBe(true);
    expect(shouldSkipPath("assets/logo.png")).toBe(true);
    expect(shouldSkipPath("pnpm-lock.yaml")).toBe(true);
    expect(shouldSkipPath("src/app.min.js")).toBe(true);
  });
});

describe("collectWalkFiles", () => {
  it("keeps text files, computes LOC, and caps to the largest files", () => {
    const result = collectWalkFiles(
      [
        { path: "src/a.ts", content: Buffer.from("const a = 1;\n\nconst b = 2;\n") },
        { path: "src/b.py", content: Buffer.from("print('hi')\n") },
        { path: "assets/logo.png", content: Buffer.from("skip") },
        { path: "src/binary.ts", content: Buffer.from([0xff, 0xfe, 0xfd]) },
      ],
      { maxFiles: 1 },
    );

    expect(result.truncated).toBe(true);
    expect(result.files).toEqual([
      {
        path: "src/a.ts",
        content: "const a = 1;\n\nconst b = 2;\n",
        loc: 2,
        language: "typescript",
      },
    ]);
  });

  it("skips files larger than the configured size limit", () => {
    const result = collectWalkFiles(
      [{ path: "src/large.ts", content: Buffer.alloc(6, "a") }],
      { maxBytes: 5 },
    );

    expect(result).toEqual({ files: [], truncated: false });
  });
});
