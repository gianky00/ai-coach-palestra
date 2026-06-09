-- Sincronizzazione Nuova Scheda: GIANCARLO ALLEGRETTI
-- Periodo: 01/06/2026 - 01/07
-- Attenzione: Questo script deve essere eseguito nell'SQL Editor di Supabase.

DO $$ 
DECLARE
  v_user_id UUID;
BEGIN
  -- 1. Recupero dell'ID Utente (assumiamo sia l'unico o il principale)
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Nessun utente trovato in auth.users';
  END IF;

  -- 2. Archiviazione Vecchia Scheda
  -- Invece di eliminare gli esercizi (che cancellerebbe lo storico per CASCADE),
  -- modifichiamo il giorno di allenamento in modo che non appaiano piu' nell'app.
  UPDATE public.exercises
  SET training_day = 'STORICO ' || training_day
  WHERE training_day IN ('LUNEDI', 'MARTEDI', 'MERCOLEDI', 'GIOVEDI', 'VENERDI', 'SABATO', 'DOMENICA');

  -- 3. Inserimento Nuova Scheda
  INSERT INTO public.exercises (user_id, name, muscle_group, target_reps, target_sets, training_day, notes, order_index, rest_time)
  VALUES 
    -- ==========================================
    -- Giorno 1 (Petto e Bicipiti) -> LUNEDI
    -- ==========================================
    (v_user_id, 'CHEST INCLINE', 'Petto', '8', 4, 'LUNEDI', 'PALESTRA', 1, 120),
    (v_user_id, 'DIST. PANCA PIANA MANUBRI', 'Petto', '10', 3, 'LUNEDI', 'PALESTRA', 2, 60),
    (v_user_id, 'CROCI AI CAVI ALTI', 'Petto', '15', 3, 'LUNEDI', 'PALESTRA', 3, 60),
    (v_user_id, 'PECTORAL MACHINE', 'Petto', '20', 3, 'LUNEDI', 'PALESTRA', 4, 60),
    (v_user_id, 'BICIPITI BILANCIERE E.Z', 'Bicipiti', '8', 3, 'LUNEDI', 'PALESTRA', 5, 45),
    (v_user_id, 'BICIPITI MANUBRI', 'Bicipiti', '10', 2, 'LUNEDI', 'PALESTRA', 6, 45),
    (v_user_id, 'BICIPITI CAVO BASSO', 'Bicipiti', '12', 2, 'LUNEDI', 'PALESTRA', 7, 45),
    
    -- ==========================================
    -- Giorno 2 (Gambe e Addome) -> MARTEDI
    -- ==========================================
    (v_user_id, 'LEG PRESS', 'Gambe', '8', 3, 'MARTEDI', 'PALESTRA', 1, 120),
    (v_user_id, 'LEG CURL', 'Femorali', '10', 3, 'MARTEDI', 'PALESTRA', 2, 60),
    (v_user_id, 'LEG EXTENSION', 'Quadricipiti', '15', 3, 'MARTEDI', 'PALESTRA', 3, 60),
    (v_user_id, 'CALF IN PIEDI', 'Polpacci', '20', 3, 'MARTEDI', 'PALESTRA', 4, 60),
    (v_user_id, 'CALF SEDUTO', 'Polpacci', '10/12', 3, 'MARTEDI', 'PALESTRA', 5, 45),
    (v_user_id, 'HIPEREXTENSION', 'Lombari', '10', 2, 'MARTEDI', 'CON DISCO DA 10KG', 6, 45),
    (v_user_id, 'CRUNCH INVERSO', 'Addome', 'MAX', 4, 'MARTEDI', 'PALESTRA', 7, 45),
    
    -- ==========================================
    -- Giorno 3 (Spalle, Tricipiti e Addome) -> GIOVEDI
    -- ==========================================
    (v_user_id, 'LENTO AVANTI MANUBRI P.75°', 'Spalle', '8', 4, 'GIOVEDI', 'PALESTRA', 1, 120),
    (v_user_id, 'ALZATE FRONTALI', 'Spalle', '10', 3, 'GIOVEDI', 'PALESTRA', 2, 60),
    (v_user_id, 'ALZATE LATERALI', 'Spalle', '15', 3, 'GIOVEDI', 'PALESTRA', 3, 60),
    (v_user_id, 'FRENCH PRESS', 'Tricipiti', '8', 3, 'GIOVEDI', 'PALESTRA', 4, 60),
    (v_user_id, 'TRICIPITI ERCOLINA TRIANGOLO', 'Tricipiti', '10', 3, 'GIOVEDI', 'PALESTRA', 5, 45),
    (v_user_id, 'KICK BACK', 'Tricipiti', '15', 3, 'GIOVEDI', 'PALESTRA', 6, 45),
    (v_user_id, 'CRUNCH', 'Addome', 'MAX', 4, 'GIOVEDI', 'PALESTRA', 7, 45),
    
    -- ==========================================
    -- Giorno 4 (Dorso e Femorali/Core) -> VENERDI
    -- ==========================================
    (v_user_id, 'PULLEY', 'Dorso', '8', 4, 'VENERDI', 'PALESTRA', 1, 120),
    (v_user_id, 'LAT MACHINE AVANTI', 'Dorso', '10', 3, 'VENERDI', 'PALESTRA', 2, 60),
    (v_user_id, 'ROWING 1 BRACCIO PER VOLTA', 'Dorso', '15', 3, 'VENERDI', 'PALESTRA', 3, 60),
    (v_user_id, 'PULLOVER', 'Dorso', '15', 3, 'VENERDI', 'PALESTRA', 4, 60),
    (v_user_id, 'CROCI A 90°', 'Spalle', '12', 3, 'VENERDI', 'PALESTRA', 5, 45),
    (v_user_id, 'STACCO RUMENO MANUBRI', 'Femorali', '15', 3, 'VENERDI', 'apprendimento', 6, 45),
    (v_user_id, 'Plank', 'Addome', '45''''', 3, 'VENERDI', 'PALESTRA', 7, 0);

END $$;
