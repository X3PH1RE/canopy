import { describe, expect, it } from "vitest";
import { buildServer } from "./routes";
import { makeFakeCity } from "./fakeCity";

describe("health route", () => {
  it("returns ok true", async () => {
    const server = buildServer();
    const response = await server.inject({ method: "GET", url: "/api/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ ok: true });

    await server.close();
  });
});

describe("limits route", () => {
  it("returns the current rate limit state", async () => {
    const server = buildServer({
      config: {
        trustProxy: false,
        rateLimit: {
          enabled: true,
          max: 2,
          windowMinutes: 30,
          windowMs: 1_800_000,
        },
      },
    });

    const response = await server.inject({ method: "GET", url: "/api/limits" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      enabled: true,
      max: 2,
      windowMinutes: 30,
      remaining: 2,
    });

    await server.close();
  });
});

describe("analyze routes", () => {
  it("rejects invalid URLs without consuming a rate-limit slot", async () => {
    const server = buildServer({
      config: testConfig(),
      analyzer: async () => makeFakeCity(),
    });

    const response = await server.inject({
      method: "POST",
      url: "/api/analyze",
      payload: { repoUrl: "https://example.com/nope/nope" },
    });
    const limits = await server.inject({ method: "GET", url: "/api/limits" });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ error: "invalid_repo_url" });
    expect(limits.json()).toMatchObject({ remaining: 2 });

    await server.close();
  });

  it("creates a job, exposes status, and returns the city when done", async () => {
    const city = makeFakeCity();
    const server = buildServer({
      config: testConfig(),
      analyzer: async () => city,
    });

    const started = await server.inject({
      method: "POST",
      url: "/api/analyze",
      payload: { repoUrl: "https://github.com/expressjs/express" },
    });
    const { jobId } = started.json() as { jobId: string };
    await new Promise((resolve) => setTimeout(resolve, 0));

    const status = await server.inject({ method: "GET", url: `/api/jobs/${jobId}` });
    const result = await server.inject({ method: "GET", url: `/api/city/${jobId}` });

    expect(started.statusCode).toBe(200);
    expect(status.json()).toMatchObject({ status: "done", stage: "done", progress: 1 });
    expect(result.json()).toMatchObject({ repo: { name: "canopy/fake" } });

    await server.close();
  });

  it("returns cached jobs without consuming another rate-limit slot", async () => {
    const server = buildServer({
      config: testConfig(),
      analyzer: async () => makeFakeCity(),
    });
    const payload = { repoUrl: "https://github.com/expressjs/express" };

    await server.inject({ method: "POST", url: "/api/analyze", payload });
    await new Promise((resolve) => setTimeout(resolve, 0));
    const cached = await server.inject({ method: "POST", url: "/api/analyze", payload });
    const limits = await server.inject({ method: "GET", url: "/api/limits" });

    expect(cached.json()).toMatchObject({ cached: true });
    expect(limits.json()).toMatchObject({ remaining: 1 });

    await server.close();
  });

  it("returns cached jobs after a delayed analyzer completes", async () => {
    const city = makeFakeCity();
    const deferred = deferredCity();
    const server = buildServer({
      config: testConfig(),
      analyzer: async () => deferred.promise,
    });
    const payload = { repoUrl: "https://github.com/expressjs/express" };

    await server.inject({ method: "POST", url: "/api/analyze", payload });
    deferred.resolve(city);
    await new Promise((resolve) => setTimeout(resolve, 0));
    const cached = await server.inject({ method: "POST", url: "/api/analyze", payload });
    const limits = await server.inject({ method: "GET", url: "/api/limits" });

    expect(cached.json()).toMatchObject({ cached: true });
    expect(limits.json()).toMatchObject({ remaining: 1 });

    await server.close();
  });

  it("returns 429 for the third new build with default limits", async () => {
    const server = buildServer({
      config: testConfig(),
      analyzer: async () => makeFakeCity(),
    });

    await server.inject({ method: "POST", url: "/api/analyze", payload: { repoUrl: "https://github.com/a/one" } });
    await server.inject({ method: "POST", url: "/api/analyze", payload: { repoUrl: "https://github.com/a/two" } });
    const blocked = await server.inject({
      method: "POST",
      url: "/api/analyze",
      payload: { repoUrl: "https://github.com/a/three" },
    });

    expect(blocked.statusCode).toBe(429);
    expect(blocked.headers["retry-after"]).toBeDefined();
    expect(blocked.json()).toMatchObject({ error: "rate_limited", limit: 2, windowMinutes: 30 });

    await server.close();
  });
});

function testConfig() {
  return {
    trustProxy: false,
    rateLimit: {
      enabled: true,
      max: 2,
      windowMinutes: 30,
      windowMs: 1_800_000,
    },
  };
}

function deferredCity() {
  let resolve!: (city: ReturnType<typeof makeFakeCity>) => void;
  const promise = new Promise<ReturnType<typeof makeFakeCity>>((innerResolve) => {
    resolve = innerResolve;
  });

  return { promise, resolve };
}
