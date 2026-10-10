import Fastify from "fastify";
import type { FastifyInstance } from "fastify";
import type { CityData } from "@canopy/shared";
import { loadConfig, type AppConfig } from "./config";
import { createRateLimiter, type RateLimiter } from "./rateLimit";

interface ServerOptions {
  config?: AppConfig;
  rateLimiter?: RateLimiter;
}

export function buildServer(options: ServerOptions = {}): FastifyInstance {
  const config = options.config ?? loadConfig();
  const rateLimiter =
    options.rateLimiter ??
    createRateLimiter({
      enabled: config.rateLimit.enabled,
      max: config.rateLimit.max,
      windowMs: config.rateLimit.windowMs,
      windowMinutes: config.rateLimit.windowMinutes,
    });
  const app = Fastify({ logger: false, trustProxy: config.trustProxy });

  app.get("/api/health", async () => {
    const response: Pick<CityData["repo"], never> & { ok: true } = { ok: true };
    return response;
  });

  app.get("/api/limits", async (request) => {
    return rateLimiter.peek(request.ip);
  });

  return app;
}
