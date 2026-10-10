import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  plugins: [react()],
  resolve: {
    preserveSymlinks: true,
  },
  optimizeDeps: command === "serve" ? { disabled: "dev" } : undefined,
  server: {
    port: 5173,
  },
}));
