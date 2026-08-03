import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

import { GARMIN_DEREGISTER_URL } from '../garminClient.ts';
import { json } from '../http.ts';
import { getValidAccessToken } from '../tokens.ts';

type AdminClient = ReturnType<typeof createClient>;

export async function handleDisconnect(admin: AdminClient, userId: string) {
  try {
    const accessToken = await getValidAccessToken(admin, userId);
    await fetch(GARMIN_DEREGISTER_URL, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    // Continua cleanup locale anche se deregister remoto fallisce
  }

  await admin.from('garmin_tokens').delete().eq('user_id', userId);
  await admin
    .from('user_settings')
    .upsert({ user_id: userId, garmin_connected: false }, { onConflict: 'user_id' });

  return json({ ok: true });
}
