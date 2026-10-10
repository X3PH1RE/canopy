import { z } from "zod";

export interface AppConfig {
  trustProxy: boolean;
  rateLimit: {
    enabled: boolean;
    max: number;
    windowMinutes: number;
    windowMs: number;
  };
}

const booleanFlag = (name: string) =>
  z
    .string()
    .optional()
    .default(name === "RATE_LIMIT_ENABLED" ? "true" : "false")
    .transform((value, ctx) => {
      if (value === "true" || value === "1") {
        return true;
      }

      if (value === "false" || value === "0") {
        return false;
      }

      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${name} must be true, false, 1, or 0`,
      });
      return z.NEVER;
    });

const integerAtLeastOne = (name: string, defaultValue: string) =>
  z
    .string()
    .optional()
    .default(defaultValue)
    .transform((value, ctx) => {
      if (!/^\d+$/.test(value)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${name} must be an integer` });
        return z.NEVER;
      }

      const parsed = Number.parseInt(value, 10);
      if (parsed < 1) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${name} must be at least 1` });
        return z.NEVER;
      }

      return parsed;
    });

const envSchema = z.object({
  RATE_LIMIT_ENABLED: booleanFlag("RATE_LIMIT_ENABLED"),
  RATE_LIMIT_MAX: integerAtLeastOne("RATE_LIMIT_MAX", "2"),
  RATE_LIMIT_WINDOW_MINUTES: integerAtLeastOne("RATE_LIMIT_WINDOW_MINUTES", "30"),
  TRUST_PROXY: booleanFlag("TRUST_PROXY"),
});

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const result = envSchema.safeParse(env);

  if (!result.success) {
    const messages = result.error.issues.map((issue) => issue.message).join("; ");
    throw new Error(`Invalid server configuration: ${messages}`);
  }

  return {
    trustProxy: result.data.TRUST_PROXY,
    rateLimit: {
      enabled: result.data.RATE_LIMIT_ENABLED,
      max: result.data.RATE_LIMIT_MAX,
      windowMinutes: result.data.RATE_LIMIT_WINDOW_MINUTES,
      windowMs: result.data.RATE_LIMIT_WINDOW_MINUTES * 60_000,
    },
  };
}
