import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";

export interface NormalizedRepo {
  owner: string;
  repo: string;
  name: string;
  url: string;
  cacheName: string;
}

export interface CloneResult {
  repo: NormalizedRepo;
  repoDir: string;
  headSha: string;
  truncated: boolean;
}

const GITHUB_URL = /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/;

export function normalizeRepoUrl(repoUrl: string): NormalizedRepo {
  const match = GITHUB_URL.exec(repoUrl.trim());

  if (!match) {
    throw new Error("Enter a public GitHub HTTPS URL like https://github.com/owner/repo");
  }

  const owner = match[1];
  const repo = match[2];
  return {
    owner,
    repo,
    name: `${owner}/${repo}`,
    url: `https://github.com/${owner}/${repo}.git`,
    cacheName: `${owner}__${repo}`,
  };
}

export async function cloneOrFetchRepo(repoUrl: string, cacheRoot: string): Promise<CloneResult> {
  const repo = normalizeRepoUrl(repoUrl);
  const repoDir = path.join(cacheRoot, "repos", repo.cacheName);
  await mkdir(path.dirname(repoDir), { recursive: true });

  let truncated = true;
  try {
    await runGit(["-C", repoDir, "fetch", "--depth", "1000", "--no-tags", "origin"]);
  } catch {
    await runGit(["clone", "--depth", "1000", "--single-branch", "--no-tags", repo.url, repoDir], 90_000);
  }

  const headSha = (await runGit(["-C", repoDir, "rev-parse", "HEAD"])).trim();
  return { repo, repoDir, headSha, truncated };
}

export function runGit(args: string[], timeoutMs = 60_000, cwd?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn("git", args, {
      cwd,
      env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
      shell: false,
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error(`git ${args[0] ?? ""} timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        resolve(stdout);
        return;
      }

      reject(new Error(stderr.trim() || `git exited with code ${code}`));
    });
  });
}
