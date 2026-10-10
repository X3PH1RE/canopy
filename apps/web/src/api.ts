import type { CityData } from "@canopy/shared";

export type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export interface AnalyzeResponse {
  jobId: string;
  cached?: boolean;
}

export interface JobResponse {
  status: "queued" | "running" | "done" | "error";
  stage: string;
  progress: number;
  error?: string;
}

export type LimitState =
  | { enabled: false }
  | {
      enabled: true;
      max: number;
      windowMinutes: number;
      remaining: number;
      resetAt: string;
    };

interface RateLimitPayload {
  message: string;
  limit: number;
  windowMinutes: number;
  retryAfterSeconds: number;
  resetAt: string;
}

const defaultFetcher: Fetcher = (input, init) => fetch(input, init);

export class RateLimitError extends Error {
  readonly limit: number;
  readonly windowMinutes: number;
  readonly retryAfterSeconds: number;
  readonly resetAt: string;

  constructor(payload: RateLimitPayload) {
    super(payload.message);
    this.name = "RateLimitError";
    this.limit = payload.limit;
    this.windowMinutes = payload.windowMinutes;
    this.retryAfterSeconds = payload.retryAfterSeconds;
    this.resetAt = payload.resetAt;
  }
}

export async function loadSampleCity(): Promise<CityData> {
  const response = await fetch("/samples/fake.json");

  if (!response.ok) {
    throw new Error(`Could not load sample city (${response.status})`);
  }

  return response.json() as Promise<CityData>;
}

export async function startAnalysis(repoUrl: string, fetcher: Fetcher = defaultFetcher): Promise<AnalyzeResponse> {
  const response = await fetcher("/api/analyze", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ repoUrl }),
  });

  if (response.status === 429) {
    throw new RateLimitError((await response.json()) as RateLimitPayload);
  }

  return readJson<AnalyzeResponse>(response, "Could not start analysis");
}

export async function getJob(jobId: string, fetcher: Fetcher = defaultFetcher): Promise<JobResponse> {
  return readJson<JobResponse>(await fetcher(`/api/jobs/${jobId}`), "Could not load job status");
}

export async function getCity(jobId: string, fetcher: Fetcher = defaultFetcher): Promise<CityData> {
  return readJson<CityData>(await fetcher(`/api/city/${jobId}`), "Could not load city");
}

export async function getLimits(fetcher: Fetcher = defaultFetcher): Promise<LimitState> {
  return readJson<LimitState>(await fetcher("/api/limits"), "Could not load build limits");
}

async function readJson<T>(response: Response, message: string): Promise<T> {
  if (!response.ok) {
    const body = await tryReadError(response);
    throw new Error(formatApiError(body, message, response.status));
  }

  return response.json() as Promise<T>;
}

function formatApiError(body: string | null, message: string, status: number) {
  if (body?.startsWith("Route ") && body.includes(" not found")) {
    return "The Canopy API route was not found. Start the server and web app together with pnpm dev, or use a preview server that proxies /api to localhost:8787.";
  }

  return body ?? `${message} (${status})`;
}

async function tryReadError(response: Response): Promise<string | null> {
  try {
    const body = (await response.json()) as { message?: unknown };
    return typeof body.message === "string" ? body.message : null;
  } catch {
    return null;
  }
}
