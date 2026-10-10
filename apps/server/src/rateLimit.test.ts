import { describe, expect, it } from "vitest";
import { loadConfig } from "./config";
import { createRateLimiter } from "./rateLimit";

describe("loadConfig", () => {
  it("parses default rate limit settings", () => {
    const config = loadConfig({});

    expect(config.rateLimit.enabled).toBe(true);
    expect(config.rateLimit.max).toBe(2);
    expect(config.rateLimit.windowMinutes).toBe(30);
    expect(config.trustProxy).toBe(false);
  });

  it("accepts boolean-like flags and custom numeric settings", () => {
    const config = loadConfig({
      RATE_LIMIT_ENABLED: "0",
      RATE_LIMIT_MAX: "5",
      RATE_LIMIT_WINDOW_MINUTES: "10",
      TRUST_PROXY: "1",
    });

    expect(config.rateLimit.enabled).toBe(false);
    expect(config.rateLimit.max).toBe(5);
    expect(config.rateLimit.windowMinutes).toBe(10);
    expect(config.trustProxy).toBe(true);
  });

  it("throws with the variable name for invalid env values", () => {
    expect(() => loadConfig({ RATE_LIMIT_MAX: "abc" })).toThrow(/RATE_LIMIT_MAX/);
    expect(() => loadConfig({ RATE_LIMIT_ENABLED: "maybe" })).toThrow(/RATE_LIMIT_ENABLED/);
  });
});

describe("createRateLimiter", () => {
  it("allows up to max builds and blocks the next one", () => {
    let now = 1_000;
    const limiter = createRateLimiter({ enabled: true, max: 2, windowMs: 30_000, now: () => now });

    expect(limiter.consume("127.0.0.1").allowed).toBe(true);
    const second = limiter.consume("127.0.0.1");
    expect(second.allowed).toBe(true);
    expect(second.enabled).toBe(true);
    if (second.enabled) {
      expect(second.remaining).toBe(0);
    }

    const blocked = limiter.consume("127.0.0.1");
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(30);

    now += 30_001;
    const reopened = limiter.consume("127.0.0.1");
    expect(reopened.allowed).toBe(true);
    expect(reopened.enabled).toBe(true);
    if (reopened.enabled) {
      expect(reopened.remaining).toBe(1);
    }
  });

  it("keeps independent windows per client key", () => {
    const limiter = createRateLimiter({ enabled: true, max: 1, windowMs: 60_000, now: () => 5_000 });

    expect(limiter.consume("a").allowed).toBe(true);
    expect(limiter.consume("a").allowed).toBe(false);
    expect(limiter.consume("b").allowed).toBe(true);
  });

  it("does not consume slots when disabled", () => {
    const limiter = createRateLimiter({ enabled: false, max: 1, windowMs: 60_000, now: () => 5_000 });

    expect(limiter.consume("a").allowed).toBe(true);
    expect(limiter.consume("a").allowed).toBe(true);
    expect(limiter.peek("a")).toEqual({ enabled: false });
  });

  it("reports remaining builds without consuming a slot", () => {
    const limiter = createRateLimiter({ enabled: true, max: 2, windowMs: 60_000, now: () => 10_000 });

    limiter.consume("a");
    const state = limiter.peek("a");

    expect(state.enabled).toBe(true);
    if (state.enabled) {
      expect(state.remaining).toBe(1);
      expect(state.resetAt).toBe("1970-01-01T00:01:10.000Z");
    }
    expect(limiter.consume("a").allowed).toBe(true);
  });
});
