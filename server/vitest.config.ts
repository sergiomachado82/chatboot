import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary'],
      include: ['src/services/**', 'src/middleware/**', 'src/utils/**'],
      exclude: ['src/scripts/**', 'src/__tests__/**'],
      thresholds: { lines: 18, functions: 20, branches: 16 },
    },
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
});
