import { useQuery } from '@tanstack/react-query';
import React, { useMemo } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';

import { logService } from '../../services/logService';
import type { WeeklyMuscleVolumeLog } from '../../types';
import { MuscleHeatmap } from '../ui/MuscleHeatmap';

interface RawLog extends WeeklyMuscleVolumeLog {
  created_at: string;
}

export const AnalyticsView = () => {
  const { data: rawLogs, isLoading } = useQuery<RawLog[]>({
    queryKey: ['analytics', 'weekly-volume'],
    queryFn: async () => {
      const { data } = await logService.fetchWeeklyVolumeByMuscle();
      return (data as RawLog[]) || [];
    },
  });

  const muscleStats = useMemo(() => {
    const stats: Record<string, number> = {};
    if (rawLogs) {
      rawLogs.forEach((log) => {
        const group = log.exercises?.muscle_group || 'Varie';
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
        dateStr: d.toISOString().split('T')[0],
        volume: 0,
      };
    });

    if (rawLogs) {
      rawLogs.forEach((log) => {
        const logDate = log.created_at.split('T')[0];
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
          color: (opacity = 1) => `rgba(0, 255, 136, ${opacity})`,
          strokeWidth: 2,
        },
      ],
      legend: ['Volume Giornaliero (kg)'],
    };
  }, [rawLogs]);

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
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00ff88" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Analisi</Text>
          <Text style={styles.subtitle}>Insight professionali dei tuoi progressi</Text>
        </View>

        <View style={styles.heatmapSection}>
          <View style={styles.heatmapInfo}>
            <Text style={styles.sectionTitle}>Muscle Heatmap</Text>
            <Text style={styles.sectionDesc}>
              I muscoli più allenati negli ultimi 7 giorni basati sul volume totale.
            </Text>

            <View style={styles.legendRow}>
              <View style={[styles.dot, { backgroundColor: '#333' }]} />
              <Text style={styles.legendText}>Inattivo</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.dot, { backgroundColor: '#006633' }]} />
              <Text style={styles.legendText}>Basso</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.dot, { backgroundColor: '#00ff88' }]} />
              <Text style={styles.legendText}>Alto</Text>
            </View>
          </View>
          <MuscleHeatmap muscleStats={muscleStats} />
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>Volume Settimanale</Text>
          <LineChart
            data={chartData}
            width={Dimensions.get('window').width - 40}
            height={200}
            chartConfig={{
              backgroundColor: '#1a1a1a',
              backgroundGradientFrom: '#252525',
              backgroundGradientTo: '#1a1a1a',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 255, 136, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              style: { borderRadius: 16 },
              propsForDots: { r: '5', strokeWidth: '2', stroke: '#00ff88' },
            }}
            bezier
            style={styles.chart}
          />
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Volume Totale</Text>
            <Text style={styles.statValue}>{Math.round(stats.total / 1000)}k</Text>
            <Text style={styles.statSub}>kg sollevati</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Media Giornaliera</Text>
            <Text style={styles.statValue}>{stats.avg}</Text>
            <Text style={styles.statSub}>kg / giorno</Text>
          </View>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a' },
  header: { padding: 20 },
  title: { fontSize: 32, fontWeight: '900', color: '#fff' },
  subtitle: { fontSize: 14, color: '#aaa', marginTop: 4 },
  heatmapSection: { flexDirection: 'row', padding: 20, gap: 20, alignItems: 'center' },
  heatmapInfo: { flex: 1 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 8 },
  sectionDesc: { color: '#666', fontSize: 12, lineHeight: 18, marginBottom: 15 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: '#888', fontSize: 10, fontWeight: '700' },
  chartContainer: { padding: 20 },
  chart: { borderRadius: 16, marginVertical: 8 },
  statsGrid: { flexDirection: 'row', padding: 20, gap: 15 },
  statBox: {
    flex: 1,
    backgroundColor: '#252525',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#333',
  },
  statLabel: {
    color: '#888',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  statValue: { color: '#00ff88', fontSize: 28, fontWeight: '900' },
  statSub: { color: '#666', fontSize: 10, marginTop: 4 },
});
