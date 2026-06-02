import { defineConfig, mergeConfig } from 'vitest/config';

import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      exclude: [
        '**/node_modules/**',
        'dist',
        '.idea',
        '.git',
        '.cache',
        'e2e/**',
        'migration-v2/**',
      ],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html', 'json-summary'],
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/main.tsx', 'src/vite-env.d.ts', '**/*.test.{ts,tsx}', '**/*.d.ts'],
      },
    },
  }),
);
