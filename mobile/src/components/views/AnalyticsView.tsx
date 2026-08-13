import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';

import { useAuth } from '../../hooks/useAuth';
import {
  ANALYTICS_MAX_WEEK_OFFSET,
  analyticsWeekDayKeys,
  analyticsWeekNavHints,
  buildAnalyticsEmptyCopy,
  clampAnalyticsWeekOffset,
  resolveAnalyticsWeekRange,
} from '../../lib/analyticsWeek';
import { normalizeMuscleGroup } from '../../lib/heatmap';
import { useSmokeMode } from '../../lib/SmokeContext';
import { isSmokeDataMode, SMOKE_USER_ID } from '../../lib/smokeMode';
import { isSmokeFixtureId, muscleGroupForSmokeExercise } from '../../lib/smokeSeed';
import { sqliteService } from '../../lib/sqlite';
import { mergeLogsWithoutDuplicates, toLocalDateKey } from '../../lib/utils';
import { Ionicons } from '../../platform/icons';
import { logService } from '../../services/logService';
import { hapticService } from '../../services/soundService';
import { colors, hitSlop, radius, space, typography } from '../../theme';
import type { WeeklyMuscleVolumeLog } from '../../types';
import { Button } from '../ui/Button';
import { MuscleHeatmap } from '../ui/MuscleHeatmap';
import { Screen } from '../ui/Screen';

interface RawLog extends WeeklyMuscleVolumeLog {
  created_at: string;
}

const CHART_COLOR = (opacity = 1) => `rgba(0, 255, 136, ${opacity})`;
const LABEL_COLOR = (opacity = 1) => `rgba(255, 255, 255, ${opacity})`;
/** Chart buckets are Mon→Sun (matches analyticsWeekDayKeys). */
const DAY_LABELS_FROM_MON = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'] as const;

export const AnalyticsView = () => {
  const { user } = useAuth();
  const smokeMode = useSmokeMode();
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const [weekOffset, setWeekOffset] = useState(0);

  const week = useMemo(() => resolveAnalyticsWeekRange(weekOffset), [weekOffset]);
  const isCurrentWeek = week.offset === 0;

  const {
    data: rawLogs,
    isPending,
    isFetching,
    isRefetching,
    refetch,
  } = useQuery<RawLog[]>({
    queryKey: ['analytics', 'weekly-volume', user?.id, smokeMode.kind, week.startKey, week.endKey],
    enabled: !!user || isSmokeDataMode(smokeMode),
    queryFn: async () => {
      const since = week.start.toISOString();
      const until = week.end.toISOString();

      const offlineLogs = await sqliteService.getAllLogs();
      const offlineInRange = offlineLogs.filter((l) => {
        if (l.created_at < since || l.created_at > until) return false;
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

      const { data } = await logService.fetchWeeklyVolumeByMuscle({
        since,
        until,
      });
      const remote = (data as RawLog[]) || [];
      if (offlineAsRaw.length === 0) return remote;
      return mergeLogsWithoutDuplicates(remote, offlineAsRaw);
    },
  });

  const goPrevWeek = useCallback(() => {
    if (!week.canGoPrev) return;
    hapticService.light();
    setWeekOffset((o) => clampAnalyticsWeekOffset(o - 1));
  }, [week.canGoPrev]);

  const goNextWeek = useCallback(() => {
    if (!week.canGoNext) return;
    hapticService.light();
    setWeekOffset((o) => clampAnalyticsWeekOffset(o + 1));
  }, [week.canGoNext]);

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
    const dayKeys = analyticsWeekDayKeys(week.startKey);
    const buckets = dayKeys.map((dateStr, i) => ({
      label: DAY_LABELS_FROM_MON[i],
      dateStr,
      volume: 0,
    }));

    if (rawLogs) {
      rawLogs.forEach((log) => {
        const logDate = toLocalDateKey(new Date(log.created_at));
        const dayMatch = buckets.find((b) => b.dateStr === logDate);
        if (dayMatch) {
          dayMatch.volume += (log.weight || 0) * (log.reps || 0);
        }
      });
    }

    return {
      labels: buckets.map((b) => b.label),
      datasets: [
        {
          data: buckets.map((b) => b.volume),
          color: CHART_COLOR,
          strokeWidth: 2,
        },
      ],
      legend: ['Volume giornaliero (kg)'],
    };
  }, [rawLogs, week.startKey]);

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

  // Week key change → pending with no cached row: show spinner (never flash prior week / empty).
  // Pull-to-refresh keeps content + RefreshControl (isRefetching).
  const showWeekLoading = isPending || (isFetching && rawLogs == null);
  const isEmpty = !showWeekLoading && (!rawLogs || rawLogs.length === 0);

  const emptyCopy = useMemo(
    () =>
      buildAnalyticsEmptyCopy({
        isCurrentWeek,
        label: week.label,
        a11yLabel: week.a11yLabel,
        canGoPrev: week.canGoPrev,
        canGoNext: week.canGoNext,
      }),
    [isCurrentWeek, week.a11yLabel, week.canGoNext, week.canGoPrev, week.label],
  );

  const navHints = useMemo(
    () =>
      analyticsWeekNavHints({
        canGoPrev: week.canGoPrev,
        canGoNext: week.canGoNext,
      }),
    [week.canGoNext, week.canGoPrev],
  );

  return (
    <Screen testID="screen-analytics">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, isEmpty && styles.scrollEmpty]}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !showWeekLoading}
            onRefresh={refetch}
            tintColor={colors.accent}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">
            Analisi
          </Text>
          <Text style={styles.subtitle}>Volume e carico muscolare per settimana</Text>
        </View>

        <View
          style={styles.weekSelector}
          testID="analytics-week-selector"
          accessibilityRole="adjustable"
          accessibilityLabel={week.a11yLabel}
          accessibilityHint="Usa i pulsanti per cambiare settimana"
          accessibilityValue={{
            text: week.label,
            min: 0,
            max: ANALYTICS_MAX_WEEK_OFFSET,
            now: ANALYTICS_MAX_WEEK_OFFSET + week.offset,
          }}
          accessibilityState={{ busy: showWeekLoading }}
        >
          <Pressable
            testID="analytics-week-prev"
            onPress={goPrevWeek}
            disabled={!week.canGoPrev}
            hitSlop={hitSlop}
            accessibilityRole="button"
            accessibilityLabel="Settimana precedente"
            accessibilityHint={navHints.prevHint}
            accessibilityState={{ disabled: !week.canGoPrev }}
            style={({ pressed }) => [
              styles.weekNavBtn,
              !week.canGoPrev && styles.weekNavDisabled,
              pressed && week.canGoPrev && styles.weekNavPressed,
            ]}
          >
            <Ionicons
              name="chevron-back"
              size={22}
              color={week.canGoPrev ? colors.accent : colors.textFaint}
            />
          </Pressable>

          <View style={styles.weekLabelWrap}>
            <Text
              testID="analytics-week-label"
              style={styles.weekLabel}
              accessibilityRole="text"
              accessibilityLabel={week.a11yLabel}
            >
              {week.label}
            </Text>
            <Text style={styles.weekRangeHint} importantForAccessibility="no">
              {week.startKey.slice(8)}/{week.startKey.slice(5, 7)} – {week.endKey.slice(8)}/
              {week.endKey.slice(5, 7)}
            </Text>
          </View>

          <Pressable
            testID="analytics-week-next"
            onPress={goNextWeek}
            disabled={!week.canGoNext}
            hitSlop={hitSlop}
            accessibilityRole="button"
            accessibilityLabel="Settimana successiva"
            accessibilityHint={navHints.nextHint}
            accessibilityState={{ disabled: !week.canGoNext }}
            style={({ pressed }) => [
              styles.weekNavBtn,
              !week.canGoNext && styles.weekNavDisabled,
              pressed && week.canGoNext && styles.weekNavPressed,
            ]}
          >
            <Ionicons
              name="chevron-forward"
              size={22}
              color={week.canGoNext ? colors.accent : colors.textFaint}
            />
          </Pressable>
        </View>

        {showWeekLoading ? (
          <View
            style={styles.loadingBox}
            testID="analytics-week-loading"
            accessibilityRole="progressbar"
            accessibilityLabel="Caricamento analisi settimanale"
            accessibilityLiveRegion="polite"
          >
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : isEmpty ? (
          <View
            style={styles.emptyBox}
            testID="analytics-empty-state"
            accessibilityRole="summary"
            accessibilityLabel={emptyCopy.a11y}
            accessibilityLiveRegion="polite"
          >
            <Text style={styles.emptyText}>{emptyCopy.title}</Text>
            <Text style={styles.emptyHint}>{emptyCopy.hint}</Text>
            <Button
              testID="analytics-empty-goto-hint"
              variant="outline"
              title={emptyCopy.ctaTitle}
              accessibilityHint={emptyCopy.ctaHint}
              onPress={() => {
                hapticService.light();
                navigation.navigate('Oggi' as never);
              }}
            />
          </View>
        ) : (
          <>
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
              <View
                style={styles.statBlock}
                accessible
                accessibilityRole="text"
                accessibilityLabel={`Volume totale ${Math.round(stats.total / 1000)}k chilogrammi sollevati`}
              >
                <Text style={styles.statLabel} importantForAccessibility="no">
                  Volume totale
                </Text>
                <Text
                  testID="analytics-volume-total"
                  style={styles.statValue}
                  importantForAccessibility="no"
                >
                  {Math.round(stats.total / 1000)}k
                </Text>
                <Text style={styles.statSub} importantForAccessibility="no">
                  kg sollevati
                </Text>
              </View>
              <View style={styles.statDivider} importantForAccessibility="no" />
              <View
                style={styles.statBlock}
                accessible
                accessibilityRole="text"
                accessibilityLabel={`Media giornaliera ${stats.avg} chilogrammi al giorno`}
              >
                <Text style={styles.statLabel} importantForAccessibility="no">
                  Media giornaliera
                </Text>
                <Text style={styles.statValue} importantForAccessibility="no">
                  {stats.avg}
                </Text>
                <Text style={styles.statSub} importantForAccessibility="no">
                  kg / giorno
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scroll: { paddingBottom: 120 },
  scrollEmpty: { flexGrow: 1 },
  header: { paddingHorizontal: space.xl, paddingTop: space.sm, paddingBottom: space.sm },
  title: { ...typography.screenTitle, color: colors.text },
  subtitle: { ...typography.caption, color: colors.textMuted, marginTop: 4 },
  weekSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: space.xl,
    marginBottom: space.md,
    paddingVertical: space.sm,
    paddingHorizontal: space.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  weekNavBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  weekNavPressed: { backgroundColor: colors.accentMuted },
  weekNavDisabled: { opacity: 0.45 },
  weekLabelWrap: { flex: 1, alignItems: 'center', paddingHorizontal: space.sm },
  weekLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  weekRangeHint: {
    color: colors.textDim,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
    minHeight: 200,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
    paddingHorizontal: space.xl,
    gap: space.md,
    minHeight: 200,
  },
  emptyText: { color: colors.textSecondary, textAlign: 'center', fontSize: 16, fontWeight: '700' },
  emptyHint: { color: colors.textDim, textAlign: 'center', fontSize: 13, marginBottom: space.sm },
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
