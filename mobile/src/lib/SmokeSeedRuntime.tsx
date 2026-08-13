import { useQueryClient } from '@tanstack/react-query';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';
import type { SmokeMode, SmokeSeedStatus } from './smokeMode';
import { clearSmokeFixtures, seedSmokeFixtures } from './smokeSeed';

export function SmokeSeedStatusBar({ status }: { status: SmokeSeedStatus }) {
  if (status === 'idle') return null;
  return (
    <View style={styles.seedStatus}>
      <View testID="smoke-seed-status" accessibilityLabel={status}>
        <Text style={styles.seedStatusText}>seed:{status}</Text>
      </View>
      {status === 'seeded' ? (
        <Text testID="smoke-seed-ready" accessibilityLabel="SEED" style={styles.seedText}>
          SEED
        </Text>
      ) : null}
    </View>
  );
}

export function useSmokeSeedEffect(
  smokeMode: SmokeMode,
  setSmokeMode: React.Dispatch<React.SetStateAction<SmokeMode>>,
  dbReady: boolean,
) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!dbReady || (smokeMode.kind !== 'seed' && smokeMode.kind !== 'clear')) return;
    let cancelled = false;
    const run = async () => {
      try {
        if (smokeMode.kind === 'seed') {
          await seedSmokeFixtures({ days: smokeMode.days, sets: smokeMode.sets });
          if (cancelled) return;
          await qc.invalidateQueries();
          setSmokeMode({ kind: 'tabs', tab: 'oggi', seedStatus: 'seeded' });
          return;
        }
        await clearSmokeFixtures();
        if (cancelled) return;
        await qc.invalidateQueries();
        setSmokeMode({ kind: 'tabs', tab: 'oggi', seedStatus: 'cleared' });
      } catch (err) {
        if (__DEV__) console.error('[smoke] seed/clear failed', err);
        if (!cancelled) setSmokeMode({ kind: 'tabs', tab: 'oggi', seedStatus: 'error' });
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [dbReady, smokeMode, qc, setSmokeMode]);
}

export function smokeSeedStatusFromMode(smokeMode: SmokeMode): SmokeSeedStatus {
  if (smokeMode.kind === 'seed') return 'seeding';
  if (smokeMode.kind === 'clear') return 'clearing';
  if (smokeMode.kind === 'tabs') return smokeMode.seedStatus ?? 'idle';
  return 'idle';
}

const styles = StyleSheet.create({
  seedStatus: {
    backgroundColor: colors.surfaceMuted,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingVertical: 3,
    alignItems: 'center',
  },
  seedStatusText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  seedText: {
    color: colors.warning,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 2,
  },
});
