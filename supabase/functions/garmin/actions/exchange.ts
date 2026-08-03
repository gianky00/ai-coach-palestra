import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

import { fetchGarminUserId, garminTokenRequest } from '../garminClient.ts';
import { json } from '../http.ts';
import { upsertTokens } from '../tokens.ts';

type AdminClient = ReturnType<typeof createClient>;

export async function handleExchange(
  admin: AdminClient,
  userId: string,
  body: {
    code?: string;
    code_verifier?: string;
    redirect_uri?: string;
  },
) {
  const { code, code_verifier, redirect_uri } = body;
  if (!code || !code_verifier || !redirect_uri) {
    return json({ error: 'code, code_verifier e redirect_uri richiesti' }, 400);
  }

  const token = await garminTokenRequest({
    grant_type: 'authorization_code',
    code,
    code_verifier,
    redirect_uri,
  });

  const garminUserId = await fetchGarminUserId(token.access_token);
  await upsertTokens(admin, userId, token, garminUserId);
  return json({ ok: true, garmin_user_id: garminUserId });
}
