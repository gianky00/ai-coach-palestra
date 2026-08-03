-- Harden garmin_connected + wearable token/activity tables for real Garmin OAuth sync.

UPDATE public.user_settings
SET garmin_connected = false
WHERE garmin_connected IS NULL;

ALTER TABLE public.user_settings
  ALTER COLUMN garmin_connected SET DEFAULT false,
  ALTER COLUMN garmin_connected SET NOT NULL;

-- Tokens: accessibile solo via service_role (edge functions). Mai esporre al client.
CREATE TABLE IF NOT EXISTS public.garmin_tokens (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  refresh_expires_at TIMESTAMPTZ,
  garmin_user_id TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.garmin_tokens ENABLE ROW LEVEL SECURITY;

-- Nessuna policy per authenticated: solo service_role legge/scrive i token.

CREATE TABLE IF NOT EXISTS public.garmin_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  garmin_activity_id TEXT NOT NULL,
  activity_type TEXT,
  name TEXT,
  start_time TIMESTAMPTZ,
  duration_secs INTEGER,
  calories NUMERIC,
  average_hr INTEGER,
  max_hr INTEGER,
  distance_meters NUMERIC,
  raw JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (user_id, garmin_activity_id)
);

CREATE INDEX IF NOT EXISTS garmin_activities_user_start_idx
  ON public.garmin_activities (user_id, start_time DESC);

ALTER TABLE public.garmin_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own garmin activities"
  ON public.garmin_activities
  FOR SELECT
  USING (auth.uid() = user_id);

-- Insert/update/delete solo service_role (edge sync).
