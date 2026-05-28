-- 1. Creazione Tabella EXERCISES
CREATE TABLE public.exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    muscle_group TEXT NOT NULL,
    target_reps TEXT NOT NULL,
    target_sets INTEGER NOT NULL DEFAULT 3,
    training_day TEXT NOT NULL,
    notes TEXT DEFAULT 'PALESTRA',
    order_index INTEGER,
    rest_time INTEGER DEFAULT 90,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Creazione Tabella WORKOUT_SESSIONS
CREATE TABLE public.workout_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE
);

-- 3. Creazione Tabella TRAINING_LOGS
CREATE TABLE public.training_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.workout_sessions(id) ON DELETE SET NULL,
    weight NUMERIC NOT NULL,
    reps INTEGER NOT NULL,
    rpe NUMERIC NOT NULL,
    set_type TEXT NOT NULL DEFAULT 'S', -- 'W': Warmup, 'S': Standard, 'F': Failure
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Creazione Tabella BIOMETRICS
CREATE TABLE public.biometrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    weight NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Creazione Tabella USER_SETTINGS
CREATE TABLE public.user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    timer_secs INTEGER DEFAULT 90 NOT NULL,
    bar_weight NUMERIC DEFAULT 20 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Abilitazione RLS su tutte le tabelle
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biometrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- 7. Definizione Policy RLS
CREATE POLICY "Users can manage their own exercises" ON public.exercises
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own sessions" ON public.workout_sessions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own logs" ON public.training_logs
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own biometrics" ON public.biometrics
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own settings" ON public.user_settings
    FOR ALL USING (auth.uid() = user_id);
