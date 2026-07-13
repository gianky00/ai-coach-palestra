import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

import { sessionService } from './sessionService';

interface SessionExportRow {
  id: string;
  start_time: string;
  end_time: string | null;
  training_logs: {
    weight: number;
    reps: number;
    exercises?: { name: string; muscle_group: string } | null;
  }[];
}

const escapeCsv = (value: string | number | null | undefined): string => {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const exportService = {
  async exportSessionsToCsv(): Promise<void> {
    const sessions = (await sessionService.fetchSessionsWithStats()) as SessionExportRow[] | null;

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
            log.exercises?.name ?? 'N/A',
            log.exercises?.muscle_group ?? '',
            log.weight,
            log.reps,
          ]
            .map(escapeCsv)
            .join(','),
        );
      }
    }

    const csv = rows.join('\n');
    const filename = `kinefit-export-${new Date().toISOString().slice(0, 10)}.csv`;
    const uri = `${FileSystem.cacheDirectory}${filename}`;

    await FileSystem.writeAsStringAsync(uri, csv, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      Alert.alert('Export completato', `File salvato in cache: ${filename}`);
      return;
    }

    await Sharing.shareAsync(uri, {
      mimeType: 'text/csv',
      dialogTitle: 'Esporta storico KineFit',
      UTI: 'public.comma-separated-values-text',
    });
  },
};
