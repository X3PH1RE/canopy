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
