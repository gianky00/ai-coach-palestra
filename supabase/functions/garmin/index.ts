import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

import { handleDisconnect } from './actions/disconnect.ts';
import { handleExchange } from './actions/exchange.ts';
import { handleSync } from './actions/sync.ts';
import { corsHeaders, json, requireEnv } from './http.ts';

type Action = 'exchange' | 'disconnect' | 'sync';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Unauthorized' }, 401);

    const supabaseUrl = requireEnv('SUPABASE_URL');
    const anonKey = requireEnv('SUPABASE_ANON_KEY');
    const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();
    if (userError || !user) return json({ error: 'Unauthorized' }, 401);

    const admin = createClient(supabaseUrl, serviceKey);
    const body = await req.json();
    const action = body.action as Action;

    if (action === 'exchange') return handleExchange(admin, user.id, body);
    if (action === 'disconnect') return handleDisconnect(admin, user.id);
    if (action === 'sync') return handleSync(admin, user.id, body.days);

    return json({ error: `Azione non supportata: ${action}` }, 400);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Errore sconosciuto';
    return json({ error: message }, 500);
  }
});
