import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const apiProxy = {
  "/api": "http://localhost:8787",
};

export default defineConfig(({ command }) => ({
  plugins: [react()],
  cacheDir: "../../node_modules/.vite/apps-web",
  resolve: {
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps:
    command === "serve"
      ? {
          entries: ["src/main.tsx"],
          include: ["@react-three/drei", "@react-three/fiber", "react", "react-dom/client", "three", "zustand"],
        }
      : undefined,
  server: {
    port: 5173,
    proxy: apiProxy,
  },
  preview: {
    port: 4173,
    proxy: apiProxy,
  },
}));
