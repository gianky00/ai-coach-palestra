import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

import { GARMIN_ACTIVITIES_URL } from '../garminClient.ts';
import { json } from '../http.ts';
import { getValidAccessToken } from '../tokens.ts';

type AdminClient = ReturnType<typeof createClient>;

export function mapGarminActivityRow(userId: string, raw: Record<string, unknown>) {
  const garminActivityId = String(
    raw.activityId ?? raw.summaryId ?? raw.activityIdStr ?? crypto.randomUUID(),
  );
  const startTimeSec = Number(raw.startTimeInSeconds ?? raw.startTime ?? 0);
  const activityTypeValue =
    typeof raw.activityType === 'string'
      ? raw.activityType
      : raw.activityType && typeof raw.activityType === 'object'
        ? String((raw.activityType as { typeKey?: string }).typeKey ?? '')
        : null;

  return {
    user_id: userId,
    garmin_activity_id: garminActivityId,
    activity_type: activityTypeValue || null,
    name: (raw.activityName as string) ?? (raw.name as string) ?? null,
    start_time: startTimeSec ? new Date(startTimeSec * 1000).toISOString() : null,
    duration_secs: Number(raw.durationInSeconds ?? raw.duration ?? 0) || null,
    calories: Number(raw.calories ?? raw.activeKilocalories ?? 0) || null,
    average_hr: Number(raw.averageHeartRateInBeatsPerMinute ?? raw.averageHR ?? 0) || null,
    max_hr: Number(raw.maxHeartRateInBeatsPerMinute ?? raw.maxHR ?? 0) || null,
    distance_meters: Number(raw.distanceInMeters ?? raw.distance ?? 0) || null,
    raw,
  };
}

export async function handleSync(admin: AdminClient, userId: string, daysInput?: number) {
  const accessToken = await getValidAccessToken(admin, userId);
  const days = Math.min(Math.max(daysInput ?? 7, 1), 30);
  const end = Math.floor(Date.now() / 1000);
  const start = end - days * 24 * 60 * 60;

  const url =
    `${GARMIN_ACTIVITIES_URL}?uploadStartTimeInSeconds=${start}` + `&uploadEndTimeInSeconds=${end}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
  });
  const text = await res.text();
  if (!res.ok) {
    return json(
      {
        synced: 0,
        message:
          `Garmin Health API non disponibile (${res.status}). ` +
          'Verifica approvazione developer e scope Wellness.',
        detail: text.slice(0, 500),
      },
      200,
    );
  }

  let activities: unknown[] = [];
  try {
    const parsed = JSON.parse(text);
    activities = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.activities)
        ? parsed.activities
        : [];
  } catch {
    activities = [];
  }

  let synced = 0;
  for (const raw of activities) {
    const row = mapGarminActivityRow(userId, raw as Record<string, unknown>);
    const { error } = await admin.from('garmin_activities').upsert(row, {
      onConflict: 'user_id,garmin_activity_id',
    });
    if (!error) synced += 1;
  }

  return json({
    synced,
    message:
      synced > 0
        ? `Sincronizzate ${synced} attività Garmin.`
        : 'Nessuna attività nuova nel periodo selezionato.',
  });
}
