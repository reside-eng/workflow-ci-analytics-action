import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'lcov', 'json'],
      include: ['src/**'],
      thresholds: {
        lines: 75,
        statements: 75,
      },
    },
  },
});
