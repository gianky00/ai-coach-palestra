import { Alert } from 'react-native';

import { escapeCsv } from '../lib/csv';
import {
  buildExerciseMetaCatalog,
  mergeExerciseMetaCatalogs,
  smokeExerciseMetaCatalog,
} from '../lib/exerciseMeta';
import {
  buildOfflineHistorySessions,
  collectMissingExerciseIds,
  enrichHistorySessionsWithExercises,
  type HistorySessionRow,
  mergeHistorySessions,
} from '../lib/historySessions';
import { sqliteService } from '../lib/sqlite';
import { toLocalDateKey } from '../lib/utils';
import * as FileSystem from '../platform/filesystem';
import * as Sharing from '../platform/sharing';
import { exerciseService } from './exerciseService';
import { sessionService } from './sessionService';

interface SessionExportRow {
  id: string;
  start_time: string;
  end_time: string | null;
  training_logs: {
    weight: number;
    reps: number;
    exercise_id?: string;
    exercises?: { name: string; muscle_group: string } | null;
  }[];
}

async function loadExerciseCatalogForExport(
  rows: HistorySessionRow[],
): Promise<ReturnType<typeof buildExerciseMetaCatalog>> {
  const missingIds = collectMissingExerciseIds(rows);
  const base = smokeExerciseMetaCatalog();
  if (missingIds.length === 0) {
    return mergeExerciseMetaCatalogs(base, new Map());
  }

  try {
    const { data, error } = await exerciseService.fetchExercisesByIds(missingIds);
    if (error || !data) {
      return mergeExerciseMetaCatalogs(base, new Map());
    }
    return mergeExerciseMetaCatalogs(base, buildExerciseMetaCatalog(data));
  } catch {
    return mergeExerciseMetaCatalogs(base, new Map());
  }
}

async function loadSessionsForExport(): Promise<SessionExportRow[]> {
  const [remote, offlineSessions, offlineLogs] = await Promise.all([
    sessionService.fetchSessionsWithStats(),
    sqliteService.getAllOfflineSessions().catch(() => []),
    sqliteService.getAllLogs().catch(() => []),
  ]);
  const offlineRows = buildOfflineHistorySessions(offlineSessions, offlineLogs, {
    includeActive: true,
  });
  const merged = mergeHistorySessions(
    ((remote as HistorySessionRow[]) || []) as HistorySessionRow[],
    offlineRows,
    {
      completedOnly: false,
    },
  );
  const catalog = await loadExerciseCatalogForExport(merged);
  return enrichHistorySessionsWithExercises(merged, catalog) as SessionExportRow[];
}

export const exportService = {
  async exportSessionsToCsv(): Promise<void> {
    const sessions = await loadSessionsForExport();

    if (!sessions || sessions.length === 0) {
      Alert.alert('Nessun dato', 'Non ci sono allenamenti da esportare.');
      return;
    }

    const headers = [
      'Sessione ID',
      'Data',
      'Ora inizio',
      'Ora fine',
      'Volume (kg)',
      'Esercizio',
      'Gruppo',
      'Peso',
      'Reps',
    ];
    const rows: string[] = [headers.join(',')];

    for (const session of sessions) {
      const date = new Date(session.start_time).toLocaleDateString('it-IT');
      const startTime = new Date(session.start_time).toLocaleTimeString('it-IT', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const endTime = session.end_time
        ? new Date(session.end_time).toLocaleTimeString('it-IT', {
            hour: '2-digit',
            minute: '2-digit',
          })
        : '';
      const volume =
        session.training_logs?.reduce((acc, log) => acc + log.weight * log.reps, 0) ?? 0;

      if (!session.training_logs?.length) {
        rows.push(
          [session.id, date, startTime, endTime, volume, '', '', '', ''].map(escapeCsv).join(','),
        );
        continue;
      }

      for (const log of session.training_logs) {
        rows.push(
          [
            session.id,
            date,
            startTime,
            endTime,
            volume,
            log.exercises?.name ?? 'Esercizio',
            log.exercises?.muscle_group ?? 'Varie',
            log.weight,
            log.reps,
          ]
            .map(escapeCsv)
            .join(','),
        );
      }
    }

    const csv = rows.join('\n');
    const filename = `kinefit-export-${toLocalDateKey(new Date())}.csv`;
    const uri = `${FileSystem.cacheDirectory}${filename}`;

    await FileSystem.writeAsStringAsync(uri, csv, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      Alert.alert('Export completato', `File salvato in cache: ${filename}`);
      return;
    }

    const sessionCount = sessions.length;
    const setCount = sessions.reduce((acc, s) => acc + (s.training_logs?.length ?? 0), 0);

    await Sharing.shareAsync(uri, {
      mimeType: 'text/csv',
      dialogTitle: `KineFit · ${sessionCount} sessioni · ${setCount} set`,
      UTI: 'public.comma-separated-values-text',
    });
  },
};
