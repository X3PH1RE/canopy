import Fastify from "fastify";
import type { FastifyInstance } from "fastify";
import type { CityData } from "@canopy/shared";
import path from "node:path";
import { buildCityFromWalk } from "./build";
import { cacheKey, readCachedCity, writeCachedCity } from "./cache";
import { cloneOrFetchRepo, normalizeRepoUrl } from "./clone";
import { loadConfig, type AppConfig } from "./config";
import { createJobQueue, type AnalyzeRepository } from "./jobs";
import { createRateLimiter, type RateLimiter } from "./rateLimit";
import { walkRepoFiles } from "./walk";

interface ServerOptions {
  config?: AppConfig;
  rateLimiter?: RateLimiter;
  analyzer?: AnalyzeRepository;
  cacheRoot?: string;
}

export function buildServer(options: ServerOptions = {}): FastifyInstance {
  const config = options.config ?? loadConfig();
  const cacheRoot = options.cacheRoot ?? path.resolve("apps/server/cache");
  const analyzer = options.analyzer ?? ((repoUrl: string) => analyzeRepository(repoUrl, cacheRoot));
  const rateLimiter =
    options.rateLimiter ??
    createRateLimiter({
      enabled: config.rateLimit.enabled,
      max: config.rateLimit.max,
      windowMs: config.rateLimit.windowMs,
      windowMinutes: config.rateLimit.windowMinutes,
    });
  const memoryCache = new Map<string, CityData>();
  const jobs = createJobQueue(analyzer, {
    onDone: (repoUrl, city) => {
      memoryCache.set(repoUrl, city);
    },
  });
  const app = Fastify({ logger: false, trustProxy: config.trustProxy });

  app.get("/api/health", async () => {
    const response: Pick<CityData["repo"], never> & { ok: true } = { ok: true };
    return response;
  });

  app.get("/api/limits", async (request) => {
    return rateLimiter.peek(request.ip);
  });

  app.post("/api/analyze", async (request, reply) => {
    const repoUrl = readRepoUrl(request.body);
    if (!repoUrl) {
      return reply.code(400).send({
        error: "invalid_repo_url",
        message: "Enter a public GitHub HTTPS URL like https://github.com/owner/repo",
      });
    }

    let normalizedUrl: string;
    try {
      normalizedUrl = normalizeRepoUrl(repoUrl).url;
    } catch (error) {
      return reply.code(400).send({
        error: "invalid_repo_url",
        message: error instanceof Error ? error.message : "Enter a public GitHub HTTPS URL",
      });
    }

    const cachedCity = memoryCache.get(normalizedUrl);
    if (cachedCity) {
      const cachedJob = jobs.addDone(cachedCity);
      return { jobId: cachedJob.id, cached: true };
    }

    const limit = rateLimiter.consume(request.ip);
    if (!limit.allowed) {
      reply.header("Retry-After", String(limit.retryAfterSeconds));
      return reply.code(429).send({
        error: "rate_limited",
        message: `You can build ${limit.max} cities every ${limit.windowMinutes} minutes. Try again later, or explore a sample city.`,
        limit: limit.max,
        windowMinutes: limit.windowMinutes,
        retryAfterSeconds: limit.retryAfterSeconds,
        resetAt: limit.resetAt,
      });
    }

    if (limit.enabled) {
      reply.header("X-RateLimit-Limit", String(limit.max));
      reply.header("X-RateLimit-Remaining", String(limit.remaining));
      reply.header("X-RateLimit-Reset", String(Math.floor(Date.parse(limit.resetAt) / 1_000)));
    }

    const job = jobs.start(normalizedUrl);
    return { jobId: job.id };
  });

  app.get("/api/jobs/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const job = jobs.get(id);
    if (!job) {
      return reply.code(404).send({ error: "not_found", message: "Job not found" });
    }

    return {
      status: job.status,
      stage: job.stage,
      progress: job.progress,
      error: job.error,
    };
  });

  app.get("/api/city/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const job = jobs.get(id);
    if (!job) {
      return reply.code(404).send({ error: "not_found", message: "Job not found" });
    }

    if (job.status !== "done" || !job.city) {
      return reply.code(409).send({ error: "not_ready", message: "City is not ready yet" });
    }

    return job.city;
  });

  return app;
}

async function analyzeRepository(repoUrl: string, cacheRoot: string): Promise<CityData> {
  const cloned = await cloneOrFetchRepo(repoUrl, cacheRoot);
  const key = cacheKey(cloned.repo.url, cloned.headSha);
  const cached = await readCachedCity(cacheRoot, key);
  if (cached) {
    return cached;
  }

  const walked = await walkRepoFiles(cloned.repoDir);
  const city = await buildCityFromWalk({
    repo: {
      url: cloned.repo.url,
      name: cloned.repo.name,
      headSha: cloned.headSha,
      truncated: cloned.truncated || walked.truncated,
    },
    repoDir: cloned.repoDir,
    files: walked.files,
  });
  await writeCachedCity(cacheRoot, key, city);
  return city;
}

function readRepoUrl(body: unknown): string | null {
  if (!body || typeof body !== "object" || !("repoUrl" in body)) {
    return null;
  }

  const repoUrl = (body as { repoUrl?: unknown }).repoUrl;
  return typeof repoUrl === "string" ? repoUrl : null;
}

