import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: false,
    exclude: ["**/node_modules/**", "**/dist/**", "apps/server/cache/**"],
    include: ["src/**/*.test.ts", "packages/**/*.test.ts", "apps/**/*.test.ts"],
    testTimeout: 15000,
  },
});
