import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: [
        'src/lib/utils.ts',
        'src/lib/profileMappers.ts',
        'src/lib/offlineSync.ts',
        'src/services/profileService.ts',
      ],
      thresholds: {
        lines: 55,
        functions: 55,
        statements: 55,
      },
    },
  },
});
