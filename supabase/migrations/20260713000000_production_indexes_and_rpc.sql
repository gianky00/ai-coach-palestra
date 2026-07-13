-- Fase 5: indici performance, vincoli dati, RPC analytics

-- Indici (idempotenti)
CREATE INDEX IF NOT EXISTS idx_training_logs_user_created
  ON public.training_logs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_training_logs_exercise
  ON public.training_logs (exercise_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_start
  ON public.workout_sessions (user_id, start_time DESC);

CREATE INDEX IF NOT EXISTS idx_exercises_user_day
  ON public.exercises (user_id, training_day);

-- Vincoli di validità (ignora se già presenti)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_weight_positive'
  ) THEN
    ALTER TABLE public.training_logs
      ADD CONSTRAINT chk_weight_positive CHECK (weight >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_reps_positive'
  ) THEN
    ALTER TABLE public.training_logs
      ADD CONSTRAINT chk_reps_positive CHECK (reps > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_rpe_range'
  ) THEN
    ALTER TABLE public.training_logs
      ADD CONSTRAINT chk_rpe_range CHECK (rpe BETWEEN 1 AND 10);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_set_type'
  ) THEN
    ALTER TABLE public.training_logs
      ADD CONSTRAINT chk_set_type CHECK (set_type IN ('W', 'S', 'F'));
  END IF;
END $$;

-- Record personale (e1RM) per esercizio
CREATE OR REPLACE FUNCTION public.get_personal_record(p_exercise_id UUID)
RETURNS TABLE (weight NUMERIC, reps INTEGER, e1rm NUMERIC)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    tl.weight,
    tl.reps,
    ROUND(tl.weight / (1.0278 - 0.0278 * tl.reps))::NUMERIC AS e1rm
  FROM public.training_logs tl
  WHERE tl.exercise_id = p_exercise_id
    AND tl.user_id = auth.uid()
    AND tl.reps > 0
    AND tl.weight > 0
    AND tl.set_type <> 'W'
  ORDER BY (tl.weight / (1.0278 - 0.0278 * tl.reps)) DESC
  LIMIT 1;
$$;

-- Volume giornaliero aggregato (ultimi N giorni)
CREATE OR REPLACE FUNCTION public.get_weekly_volume(p_days INTEGER DEFAULT 7)
RETURNS TABLE (day DATE, total_volume NUMERIC)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    (tl.created_at AT TIME ZONE 'UTC')::DATE AS day,
    SUM(tl.weight * tl.reps)::NUMERIC AS total_volume
  FROM public.training_logs tl
  WHERE tl.user_id = auth.uid()
    AND tl.created_at >= (NOW() - (GREATEST(p_days, 1) || ' days')::INTERVAL)
    AND tl.set_type <> 'W'
  GROUP BY (tl.created_at AT TIME ZONE 'UTC')::DATE
  ORDER BY day;
$$;

-- Riepilogo sessione (volume, set, durata)
CREATE OR REPLACE FUNCTION public.get_session_summary(p_session_id UUID)
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COALESCE(
    json_build_object(
      'total_volume', COALESCE(SUM(tl.weight * tl.reps), 0),
      'sets_count', COUNT(tl.id),
      'duration_mins', ROUND(
        EXTRACT(EPOCH FROM (ws.end_time - ws.start_time)) / 60,
        1
      )
    ),
    '{}'::json
  )
  FROM public.workout_sessions ws
  LEFT JOIN public.training_logs tl
    ON tl.session_id = ws.id
    AND tl.user_id = auth.uid()
    AND tl.set_type <> 'W'
  WHERE ws.id = p_session_id
    AND ws.user_id = auth.uid()
  GROUP BY ws.start_time, ws.end_time;
$$;

GRANT EXECUTE ON FUNCTION public.get_personal_record(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_weekly_volume(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_session_summary(UUID) TO authenticated;
