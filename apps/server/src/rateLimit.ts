export interface RateLimitOptions {
  enabled: boolean;
  max: number;
  windowMs: number;
  windowMinutes?: number;
  now?: () => number;
}

export type RateLimitState =
  | { enabled: false }
  | {
      enabled: true;
      max: number;
      windowMinutes: number;
      remaining: number;
      resetAt: string;
    };

export type RateLimitDecision =
  | ({ allowed: true; retryAfterSeconds?: never } & RateLimitState)
  | ({ allowed: false; retryAfterSeconds: number } & Extract<RateLimitState, { enabled: true }>);

export interface RateLimiter {
  consume: (key: string) => RateLimitDecision;
  peek: (key: string) => RateLimitState;
  cleanup: () => void;
}

export function createRateLimiter(options: RateLimitOptions): RateLimiter {
  const timestampsByKey = new Map<string, number[]>();
  const now = options.now ?? Date.now;
  const windowMinutes = options.windowMinutes ?? options.windowMs / 60_000;

  function prune(key: string, currentTime: number) {
    const cutoff = currentTime - options.windowMs;
    const timestamps = (timestampsByKey.get(key) ?? []).filter((timestamp) => timestamp > cutoff);

    if (timestamps.length === 0) {
      timestampsByKey.delete(key);
      return timestamps;
    }

    timestampsByKey.set(key, timestamps);
    return timestamps;
  }

  function stateFrom(timestamps: number[], currentTime: number): Extract<RateLimitState, { enabled: true }> {
    const oldest = timestamps[0] ?? currentTime;
    return {
      enabled: true,
      max: options.max,
      windowMinutes,
      remaining: Math.max(0, options.max - timestamps.length),
      resetAt: new Date(oldest + options.windowMs).toISOString(),
    };
  }

  return {
    consume(key) {
      if (!options.enabled) {
        return { allowed: true, enabled: false };
      }

      const currentTime = now();
      const timestamps = prune(key, currentTime);

      if (timestamps.length >= options.max) {
        const state = stateFrom(timestamps, currentTime);
        const retryAfterSeconds = Math.max(1, Math.ceil((Date.parse(state.resetAt) - currentTime) / 1_000));
        return { ...state, allowed: false, retryAfterSeconds };
      }

      timestamps.push(currentTime);
      timestampsByKey.set(key, timestamps);
      return { ...stateFrom(timestamps, currentTime), allowed: true };
    },
    peek(key) {
      if (!options.enabled) {
        return { enabled: false };
      }

      return stateFrom(prune(key, now()), now());
    },
    cleanup() {
      const currentTime = now();
      for (const key of timestampsByKey.keys()) {
        prune(key, currentTime);
      }
    },
  };
}
