import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
      // server-only throws outside React Server Components; tests run in Node.
      "server-only": fileURLToPath(
        new URL("./node_modules/server-only/empty.js", import.meta.url),
      ),
    },
  },
  test: {
    environment: "node",
    hookTimeout: 120_000, // first run downloads the in-memory mongod binary
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "json-summary"], // lcov is read by Octocov
      include: ["app/**", "components/**", "lib/**"],
      exclude: ["**/*.test.ts"],
    },
  },
});
