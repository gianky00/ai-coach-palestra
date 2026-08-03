import { supabase } from '../../lib/supabase';
import { REDIRECT_URI } from './constants';

export async function exchangeOAuthCode(params: {
  code: string;
  codeVerifier: string;
  state: string;
}): Promise<{ garminUserId: string | null; error: Error | null }> {
  const { data, error } = await supabase.functions.invoke('garmin', {
    body: {
      action: 'exchange',
      code: params.code,
      code_verifier: params.codeVerifier,
      redirect_uri: REDIRECT_URI,
      state: params.state,
    },
  });

  if (error) {
    return {
      garminUserId: null,
      error: new Error(error.message || 'Scambio token Garmin fallito'),
    };
  }
  if (data?.error) {
    return { garminUserId: null, error: new Error(String(data.error)) };
  }
  return { garminUserId: (data?.garmin_user_id as string | null) ?? null, error: null };
}

export async function disconnectRemote(): Promise<{ error: Error | null }> {
  const { data, error } = await supabase.functions.invoke('garmin', {
    body: { action: 'disconnect' },
  });
  if (error) {
    return { error: new Error(error.message || 'Disconnessione Garmin fallita') };
  }
  if (data?.error) {
    return { error: new Error(String(data.error)) };
  }
  return { error: null };
}

export async function syncRemote(days = 7): Promise<{ synced: number; message: string }> {
  const { data, error } = await supabase.functions.invoke('garmin', {
    body: { action: 'sync', days },
  });

  if (error) {
    return { synced: 0, message: error.message || 'Sync Garmin fallita' };
  }
  if (data?.error) {
    return { synced: 0, message: String(data.error) };
  }

  return {
    synced: Number(data?.synced ?? 0),
    message: String(data?.message ?? 'Sync completata'),
  };
}

export async function fetchRecentActivities(limit = 10) {
  const { data, error } = await supabase
    .from('garmin_activities')
    .select(
      'id, garmin_activity_id, activity_type, name, start_time, duration_secs, calories, average_hr',
    )
    .order('start_time', { ascending: false })
    .limit(limit);

  if (error) return [];
  return data ?? [];
}
