ALTER TABLE public.user_settings
ADD COLUMN height NUMERIC,
ADD COLUMN birth_year INTEGER,
ADD COLUMN biological_sex TEXT,
ADD COLUMN experience_level TEXT,
ADD COLUMN primary_goal TEXT,
ADD COLUMN training_days_per_week INTEGER,
ADD COLUMN injuries_notes TEXT,
ADD COLUMN gym_equipment TEXT,
ADD COLUMN garmin_connected BOOLEAN DEFAULT false,
ADD COLUMN onboarding_completed BOOLEAN DEFAULT false;
