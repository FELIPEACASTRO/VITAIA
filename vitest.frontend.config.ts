import { defineConfig } from "vitest/config";
import path from "path";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  root: path.resolve(import.meta.dirname),
  test: {
    globals: true,
    environment: "jsdom",
    include: [
      "client/**/*.test.tsx",
      "client/**/*.test.ts",
      "client/**/*.spec.tsx",
      "client/**/*.spec.ts",
    ],
    setupFiles: ["./tests/frontend-setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["client/src/**/*"],
      exclude: [
        "node_modules/",
        "dist/",
        "tests/",
        "**/*.d.ts",
        "**/*.config.*",
        "client/src/main.tsx",
        "client/src/index.css",
      ],
      thresholds: {
        global: {
          branches: 75,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./client/src"),
      "@client": path.resolve(import.meta.dirname, "./client/src"),
      "@server": path.resolve(import.meta.dirname, "./server"),
    },
  },
});
