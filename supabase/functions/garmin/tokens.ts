import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

import { garminTokenRequest, type GarminTokenResponse } from './garminClient.ts';

type AdminClient = ReturnType<typeof createClient>;

export async function upsertTokens(
  admin: AdminClient,
  userId: string,
  token: GarminTokenResponse,
  garminUserId: string | null,
) {
  const expiresAt = new Date(Date.now() + token.expires_in * 1000).toISOString();
  const refreshExpiresAt = token.refresh_token_expires_in
    ? new Date(Date.now() + token.refresh_token_expires_in * 1000).toISOString()
    : null;

  const { error } = await admin.from('garmin_tokens').upsert({
    user_id: userId,
    access_token: token.access_token,
    refresh_token: token.refresh_token,
    expires_at: expiresAt,
    refresh_expires_at: refreshExpiresAt,
    garmin_user_id: garminUserId,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);

  const { error: settingsError } = await admin
    .from('user_settings')
    .upsert({ user_id: userId, garmin_connected: true }, { onConflict: 'user_id' });
  if (settingsError) throw new Error(settingsError.message);
}

export async function getValidAccessToken(admin: AdminClient, userId: string): Promise<string> {
  const { data, error } = await admin
    .from('garmin_tokens')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) throw new Error('Garmin non connesso');

  const expiresAt = new Date(data.expires_at).getTime();
  if (expiresAt - Date.now() > 60_000) {
    return data.access_token as string;
  }

  const refreshed = await garminTokenRequest({
    grant_type: 'refresh_token',
    refresh_token: data.refresh_token as string,
  });

  await upsertTokens(admin, userId, refreshed, (data.garmin_user_id as string | null) ?? null);
  return refreshed.access_token;
}
