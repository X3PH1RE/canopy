import Fastify from "fastify";
import type { FastifyInstance } from "fastify";
import type { CityData } from "@code-city/shared";

export function buildServer(): FastifyInstance {
  const app = Fastify({ logger: false });

  app.get("/api/health", async () => {
    const response: Pick<CityData["repo"], never> & { ok: true } = { ok: true };
    return response;
  });

  return app;
}
