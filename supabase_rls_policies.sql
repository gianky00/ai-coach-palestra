
-- 1. Abilitazione RLS su tutte le tabelle
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biometrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- 2. Policy per EXERCISES (Utenti possono vedere solo i propri esercizi)
CREATE POLICY "Users can manage their own exercises" ON public.exercises
FOR ALL USING (auth.uid() = user_id);

-- 3. Policy per TRAINING_LOGS
CREATE POLICY "Users can manage their own logs" ON public.training_logs
FOR ALL USING (auth.uid() = user_id);

-- 4. Policy per WORKOUT_SESSIONS
CREATE POLICY "Users can manage their own sessions" ON public.workout_sessions
FOR ALL USING (auth.uid() = user_id);

-- 5. Policy per BIOMETRICS
CREATE POLICY "Users can manage their own biometrics" ON public.biometrics
FOR ALL USING (auth.uid() = user_id);

-- 6. Policy per USER_SETTINGS
CREATE POLICY "Users can manage their own settings" ON public.user_settings
FOR ALL USING (auth.uid() = user_id);
