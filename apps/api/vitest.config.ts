import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    pool: "threads",
    testTimeout: 10000,
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      include: ["src/**/*.ts"],
      exclude: ["src/index.ts", "src/generate-openapi.ts"],
      reporter: ["text", "html", "lcov"],
    },
  },
});
