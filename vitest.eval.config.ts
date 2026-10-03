import { defineConfig } from "vitest/config";

// Osobna konfiguracja ewaluacji prawnej: `npm run eval`.
// Nie wchodzi do `npm test`, bo jest bramką wydania, a nie testem jednostkowym.
export default defineConfig({
  test: {
    include: ["eval/**/*.eval.ts"],
    testTimeout: 60000,
  },
});
