import { describe, expect, it } from "vitest";
import { getCity, getJob, getLimits, RateLimitError, startAnalysis } from "./api";

describe("api client", () => {
  it("starts analysis jobs", async () => {
    const fetcher = jsonFetcher({ jobId: "job-1" });

    await expect(startAnalysis("https://github.com/expressjs/express", fetcher)).resolves.toEqual({ jobId: "job-1" });
  });

  it("throws a typed rate-limit error for 429 responses", async () => {
    const fetcher = async () =>
      new Response(
        JSON.stringify({
          error: "rate_limited",
          message: "Try again in 12 minutes.",
          limit: 2,
          windowMinutes: 30,
          retryAfterSeconds: 720,
          resetAt: "2026-10-10T18:00:00.000Z",
        }),
        { status: 429, headers: { "content-type": "application/json" } },
      );

    await expect(startAnalysis("https://github.com/expressjs/express", fetcher)).rejects.toBeInstanceOf(
      RateLimitError,
    );
  });

  it("loads job, city, and limit state", async () => {
    const fetcher = async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/api/jobs/job-1")) {
        return jsonResponse({ status: "done", stage: "done", progress: 1 });
      }
      if (url.endsWith("/api/city/job-1")) {
        return jsonResponse({ version: 1, files: [] });
      }
      return jsonResponse({ enabled: true, max: 2, windowMinutes: 30, remaining: 1, resetAt: "soon" });
    };

    await expect(getJob("job-1", fetcher)).resolves.toMatchObject({ status: "done" });
    await expect(getCity("job-1", fetcher)).resolves.toMatchObject({ version: 1 });
    await expect(getLimits(fetcher)).resolves.toMatchObject({ enabled: true, remaining: 1 });
  });
});

function jsonFetcher(payload: unknown) {
  return async () => jsonResponse(payload);
}

function jsonResponse(payload: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init,
  });
}
