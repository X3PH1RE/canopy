import { describe, expect, it } from "vitest";
import { buildServer } from "./routes";

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
