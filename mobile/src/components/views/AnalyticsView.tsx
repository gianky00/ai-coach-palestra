import { useQuery } from '@tanstack/react-query';
import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';

import { useAuth } from '../../hooks/useAuth';
import { normalizeMuscleGroup } from '../../lib/heatmap';
import { useSmokeMode } from '../../lib/SmokeContext';
import { isSmokeDataMode, SMOKE_USER_ID } from '../../lib/smokeMode';
import { isSmokeFixtureId, muscleGroupForSmokeExercise } from '../../lib/smokeSeed';
import { sqliteService } from '../../lib/sqlite';
import { mergeLogsWithoutDuplicates, toLocalDateKey } from '../../lib/utils';
import { logService } from '../../services/logService';
import { colors, radius, space, typography } from '../../theme';
import type { WeeklyMuscleVolumeLog } from '../../types';
import { MuscleHeatmap } from '../ui/MuscleHeatmap';
import { Screen } from '../ui/Screen';

interface RawLog extends WeeklyMuscleVolumeLog {
  created_at: string;
}

const CHART_COLOR = (opacity = 1) => `rgba(0, 255, 136, ${opacity})`;
const LABEL_COLOR = (opacity = 1) => `rgba(255, 255, 255, ${opacity})`;

export const AnalyticsView = () => {
  const { user } = useAuth();
  const smokeMode = useSmokeMode();
  const { width } = useWindowDimensions();
  const {
    data: rawLogs,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<RawLog[]>({
    queryKey: ['analytics', 'weekly-volume', user?.id, smokeMode.kind],
    enabled: !!user || isSmokeDataMode(smokeMode),
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      const since = sevenDaysAgo.toISOString();

      const offlineLogs = await sqliteService.getAllLogs();
      const offlineInRange = offlineLogs.filter((l) => {
        if (l.created_at < since) return false;
        if (!user) {
          return (
            l.user_id === SMOKE_USER_ID ||
            isSmokeFixtureId(l.tempId) ||
            isSmokeFixtureId(l.id) ||
            isSmokeFixtureId(l.session_id)
          );
        }
        return true;
      });

      const offlineAsRaw: RawLog[] = offlineInRange.map((l) => ({
        weight: l.weight,
        reps: l.reps,
        created_at: l.created_at,
        exercises: {
          muscle_group: normalizeMuscleGroup(
            (l as { muscle_group?: string }).muscle_group ??
              muscleGroupForSmokeExercise(l.exercise_id),
          ),
        },
      }));

      if (!user) return offlineAsRaw;

      const { data } = await logService.fetchWeeklyVolumeByMuscle();
      const remote = (data as RawLog[]) || [];
      if (offlineAsRaw.length === 0) return remote;
      return mergeLogsWithoutDuplicates(remote, offlineAsRaw);
    },
  });

  const muscleStats = useMemo(() => {
    const stats: Record<string, number> = {};
    if (rawLogs) {
      rawLogs.forEach((log) => {
        const group = normalizeMuscleGroup(log.exercises?.muscle_group);
        stats[group] = (stats[group] || 0) + (log.weight || 0) * (log.reps || 0);
      });
    }
    return stats;
  }, [rawLogs]);

  const chartData = useMemo(() => {
    const days = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        label: days[d.getDay()],
        dateStr: toLocalDateKey(d),
        volume: 0,
      };
    });

    if (rawLogs) {
      rawLogs.forEach((log) => {
        const logDate = toLocalDateKey(new Date(log.created_at));
        const dayMatch = last7Days.find((d) => d.dateStr === logDate);
        if (dayMatch) {
          dayMatch.volume += (log.weight || 0) * (log.reps || 0);
        }
      });
    }

    return {
      labels: last7Days.map((d) => d.label),
      datasets: [
        {
          data: last7Days.map((d) => d.volume),
          color: CHART_COLOR,
          strokeWidth: 2,
        },
      ],
      legend: ['Volume Giornaliero (kg)'],
    };
  }, [rawLogs]);

  const chartConfig = useMemo(
    () => ({
      backgroundColor: colors.bg,
      backgroundGradientFrom: colors.surfaceMuted,
      backgroundGradientTo: colors.bg,
      decimalPlaces: 0,
      color: CHART_COLOR,
      labelColor: LABEL_COLOR,
      style: { borderRadius: radius.lg },
      propsForDots: { r: '4', strokeWidth: '2', stroke: colors.accent },
    }),
    [],
  );

  const stats = useMemo(() => {
    if (!rawLogs || rawLogs.length === 0) return { avg: 0, total: 0 };
    const totalVolume = rawLogs.reduce(
      (acc: number, log) => acc + (log.weight || 0) * (log.reps || 0),
      0,
    );
    return {
      avg: Math.round(totalVolume / 7),
      total: totalVolume,
    };
  }, [rawLogs]);

  if (isLoading) {
    return (
      <Screen bare testID="screen-analytics" style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </Screen>
    );
  }

  return (
    <Screen testID="screen-analytics">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accent} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Analisi</Text>
          <Text style={styles.subtitle}>Volume e carico muscolare · ultimi 7 giorni</Text>
        </View>

        <View style={styles.heatmapSection}>
          <View style={styles.heatmapInfo}>
            <Text style={styles.sectionTitle}>Heatmap muscolare</Text>
            <Text style={styles.sectionDesc}>
              Intensità per gruppo muscolare in base al volume totale.
            </Text>

            <View style={styles.legendRow}>
              <View style={[styles.dot, { backgroundColor: colors.border }]} />
              <Text style={styles.legendText}>Inattivo</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.dot, { backgroundColor: '#006633' }]} />
              <Text style={styles.legendText}>Basso</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.dot, { backgroundColor: colors.accent }]} />
              <Text style={styles.legendText}>Alto</Text>
            </View>
          </View>
          <MuscleHeatmap muscleStats={muscleStats} />
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>Volume settimanale</Text>
          <LineChart
            data={chartData}
            width={width - 40}
            height={200}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBlock}>
            <Text style={styles.statLabel}>Volume totale</Text>
            <Text testID="analytics-volume-total" style={styles.statValue}>
              {Math.round(stats.total / 1000)}k
            </Text>
            <Text style={styles.statSub}>kg sollevati</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBlock}>
            <Text style={styles.statLabel}>Media giornaliera</Text>
            <Text style={styles.statValue}>{stats.avg}</Text>
            <Text style={styles.statSub}>kg / giorno</Text>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  scroll: { paddingBottom: 120 },
  header: { paddingHorizontal: space.xl, paddingTop: space.sm, paddingBottom: space.md },
  title: { ...typography.screenTitle, color: colors.text },
  subtitle: { ...typography.caption, color: colors.textMuted, marginTop: 4 },
  heatmapSection: {
    flexDirection: 'row',
    paddingHorizontal: space.xl,
    paddingVertical: space.lg,
    gap: space.xl,
    alignItems: 'center',
  },
  heatmapInfo: { flex: 1 },
  sectionTitle: { ...typography.section, color: colors.text, marginBottom: space.sm },
  sectionDesc: {
    color: colors.textDim,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: space.lg,
  },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: colors.textMuted, fontSize: 10, fontWeight: '700' },
  chartContainer: { paddingHorizontal: space.xl, paddingTop: space.md },
  chart: { borderRadius: radius.lg, marginVertical: space.sm },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: space.xl,
    marginTop: space.xl,
    paddingVertical: space.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  statBlock: { flex: 1, alignItems: 'flex-start' },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: space.lg,
  },
  statLabel: { ...typography.overline, color: colors.textMuted, marginBottom: 6 },
  statValue: { color: colors.accent, fontSize: 28, fontWeight: '900' },
  statSub: { color: colors.textDim, fontSize: 11, marginTop: 4 },
});
