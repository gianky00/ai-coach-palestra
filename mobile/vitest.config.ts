import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'lcov', 'html'],
      reportsDirectory: './coverage',
      include: [
        'src/lib/utils.ts',
        'src/lib/profileMappers.ts',
        'src/lib/offlineSync.ts',
        'src/lib/smokeMode.ts',
        'src/lib/heatmap.ts',
        'src/lib/csv.ts',
        'src/lib/garminBadges.ts',
        'src/lib/exerciseAssets.ts',
        'src/services/profileService.ts',
        'src/services/analyticsService.ts',
        'src/services/exerciseService.ts',
        'src/services/logService.ts',
        'src/services/sessionService.ts',
        'src/services/exportService.ts',
        'src/services/notificationService.ts',
        'src/services/soundService.ts',
        'src/services/garmin/garminPkce.ts',
        'src/services/garmin/constants.ts',
      ],
      exclude: [
        'src/lib/sqlite.ts',
        'src/lib/supabase.ts',
        'src/lib/Auth*.ts',
        'src/lib/sentry.ts',
      ],
      thresholds: {
        lines: 95,
        functions: 95,
        statements: 95,
        branches: 85,
      },
    },
  },
});
