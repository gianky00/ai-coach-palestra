/**
 * SCRIPT DI MIGRAZIONE AGGIORNATO (DA EXCEL)
 * Caricato da Gemini CLI
 */

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🚀 MIGRAZIONE V2')
      .addItem('Sincronizza Programma da Excel', 'syncExcelData')
      .addToUi();
}

function syncExcelData() {
  var SUPABASE_URL = "https://ekckzmihqswqfglowpwk.supabase.co";
  var SUPABASE_KEY = "sb_publishable_wIFYjd5yII9ThcBrBTvQtg_2vRBoZZh";
  
  // Dati estratti da Gemini CLI dal file "scheda palestra.xlsx"
  var exercises = [
  { "training_day": "LUNEDI", "muscle_group": "Petto", "name": "CHEST PRESS ORIZZONTALE", "target_reps": "12-10-8-6", "target_sets": 4, "notes": "PALESTRA" },
  { "training_day": "LUNEDI", "muscle_group": "Petto", "name": "DISTENSIONI PANCA 30° MANUBRI", "target_reps": "10-8", "target_sets": 3, "notes": "PALESTRA" },
  { "training_day": "LUNEDI", "muscle_group": "Petto", "name": "CROCI PANCA PIANA", "target_reps": "12-15", "target_sets": 3, "notes": "PALESTRA" },
  { "training_day": "LUNEDI", "muscle_group": "Petto", "name": "PULLOVER", "target_reps": "12-15", "target_sets": 3, "notes": "PALESTRA" },
  { "training_day": "LUNEDI", "muscle_group": "Bicipiti", "name": "BICIPITI BILANCIERE EZ PRESA AMPIA", "target_reps": "12-10-8-6", "target_sets": 4, "notes": "PALESTRA" },
  { "training_day": "LUNEDI", "muscle_group": "Bicipiti", "name": "BICIPITI MANUBRI ALTERNATI", "target_reps": "12-10", "target_sets": 3, "notes": "PALESTRA" },
  { "training_day": "LUNEDI", "muscle_group": "Bicipiti", "name": "BICIPITI SU PANCA SCOTT CON MANUBRIO", "target_reps": "12-15", "target_sets": 3, "notes": "PALESTRA" },
  { "training_day": "LUNEDI", "muscle_group": "Core", "name": "ADDOMINALI", "target_reps": "MAX", "target_sets": 4, "notes": "PALESTRA" },
  { "training_day": "MARTEDI", "muscle_group": "Gambe", "name": "CALF IN PIEDI", "target_reps": "15", "target_sets": 4, "notes": "PALESTRA" },
  { "training_day": "MARTEDI", "muscle_group": "Gambe", "name": "CALF SEDUTO", "target_reps": "20", "target_sets": 3, "notes": "PALESTRA" },
  { "training_day": "MARTEDI", "muscle_group": "Gambe", "name": "LEG PRESS 45°", "target_reps": "12-10-8-6", "target_sets": 4, "notes": "PALESTRA" },
  { "training_day": "MARTEDI", "muscle_group": "Gambe", "name": "LEG EXTENSION", "target_reps": "12-10", "target_sets": 3, "notes": "PALESTRA" },
  { "training_day": "MARTEDI", "muscle_group": "Gambe", "name": "LEG CURL", "target_reps": "12", "target_sets": 4, "notes": "PALESTRA" },
  { "training_day": "MARTEDI", "muscle_group": "Lombari", "name": "HIPEREXTENSION", "target_reps": "15", "target_sets": 3, "notes": "PALESTRA" },
  { "training_day": "MARTEDI", "muscle_group": "Tricipiti", "name": "FRENCH PRESS", "target_reps": "8", "target_sets": 4, "notes": "PALESTRA" },
  { "training_day": "MARTEDI", "muscle_group": "Tricipiti", "name": "TRICIPITI ERCOLINA", "target_reps": "12", "target_sets": 3, "notes": "PALESTRA" },
  { "training_day": "MERCOLEDI", "muscle_group": "Schiena", "name": "PULLEY", "target_reps": "12-10-8-6", "target_sets": 4, "notes": "PALESTRA" },
  { "training_day": "MERCOLEDI", "muscle_group": "Schiena", "name": "LAT MACHINE AVANTI", "target_reps": "10-8", "target_sets": 3, "notes": "PALESTRA" },
  { "training_day": "MERCOLEDI", "muscle_group": "Schiena", "name": "ROWING MACHINE", "target_reps": "12", "target_sets": 3, "notes": "PALESTRA" },
  { "training_day": "MERCOLEDI", "muscle_group": "Schiena", "name": "PULLDOWN", "target_reps": "15", "target_sets": 3, "notes": "PALESTRA" },
  { "training_day": "MERCOLEDI", "muscle_group": "Spalle", "name": "SHOULDER PRESS PRESA AMPIA", "target_reps": "12-10-8-6", "target_sets": 4, "notes": "PALESTRA" },
  { "training_day": "MERCOLEDI", "muscle_group": "Spalle", "name": "ALZATE LATERALI", "target_reps": "12", "target_sets": 3, "notes": "PALESTRA" },
  { "training_day": "MERCOLEDI", "muscle_group": "Spalle", "name": "CROCI A 90°", "target_reps": "15", "target_sets": 3, "notes": "PALESTRA" },
  { "training_day": "MERCOLEDI", "muscle_group": "Core", "name": "CRUNCH INVERSO", "target_reps": "MAX", "target_sets": 4, "notes": "PALESTRA" },
  { "training_day": "GIOVEDI", "muscle_group": "Gambe", "name": "AFFONDI SU POSTO MONOLATERALI", "target_reps": "12", "target_sets": 3, "notes": "PALESTRA" },
  { "training_day": "GIOVEDI", "muscle_group": "Petto", "name": "PANCA PIANA", "target_reps": "12", "target_sets": 3, "notes": "PALESTRA" },
  { "training_day": "GIOVEDI", "muscle_group": "Petto", "name": "CROCI AI CAVI ALTI", "target_reps": "15", "target_sets": 3, "notes": "PALESTRA" },
  { "training_day": "GIOVEDI", "muscle_group": "Schiena", "name": "LAT MACHINE PRESA INVERSA", "target_reps": "12", "target_sets": 3, "notes": "PALESTRA" },
  { "training_day": "GIOVEDI", "muscle_group": "Spalle", "name": "REVERS FLY 1 BRACCIO PER VOLTA", "target_reps": "12-12", "target_sets": 3, "notes": "PALESTRA" },
  { "training_day": "GIOVEDI", "muscle_group": "Bicipiti", "name": "BICIPITI A MARTELLO MANUBRI", "target_reps": "12", "target_sets": 3, "notes": "PALESTRA" },
  { "training_day": "GIOVEDI", "muscle_group": "Tricipiti", "name": "KICK BACK MANUBRIO", "target_reps": "12", "target_sets": 3, "notes": "PALESTRA" },
  { "training_day": "GIOVEDI", "muscle_group": "Core", "name": "ABS MACHINE", "target_reps": "15-20", "target_sets": 4, "notes": "PALESTRA" },
  { "training_day": "VENERDI", "muscle_group": "Spalle", "name": "MILITARY PRESS MANUBRI", "target_reps": "8-10", "target_sets": 4, "notes": "PALESTRA" },
  { "training_day": "VENERDI", "muscle_group": "Spalle", "name": "ALZATE FRONTALI", "target_reps": "12", "target_sets": 3, "notes": "PALESTRA" },
  { "training_day": "VENERDI", "muscle_group": "Bicipiti", "name": "CURL CONCENTRATO", "target_reps": "12", "target_sets": 3, "notes": "PALESTRA" },
  { "training_day": "VENERDI", "muscle_group": "Tricipiti", "name": "DIP TRA PANCHE", "target_reps": "MAX", "target_sets": 3, "notes": "PALESTRA" },
  { "training_day": "VENERDI", "muscle_group": "Core", "name": "PLANK", "target_reps": "1'", "target_sets": 3, "notes": "PALESTRA" },
  { "training_day": "SABATO", "muscle_group": "Gambe", "name": "STACCO RUMENO (RDL)", "target_reps": "10-12", "target_sets": 4, "notes": "PALESTRA" },
  { "training_day": "SABATO", "muscle_group": "Schiena", "name": "REMATORE MANUBRIO SINGOLO", "target_reps": "10-12", "target_sets": 4, "notes": "PALESTRA" },
  { "training_day": "SABATO", "muscle_group": "Schiena", "name": "FACE PULL AI CAVI", "target_reps": "15", "target_sets": 3, "notes": "PALESTRA" },
  { "training_day": "SABATO", "muscle_group": "Gambe", "name": "LEG EXTENSION (Richiamo)", "target_reps": "15", "target_sets": 3, "notes": "PALESTRA" },
  { "training_day": "SABATO", "muscle_group": "Core", "name": "BICYCLE CRUNCH", "target_reps": "MAX", "target_sets": 4, "notes": "PALESTRA" },
  { "training_day": "LUNEDI", "muscle_group": "Addominali", "name": "Ipertrofia", "target_reps": "1", "target_sets": 1, "notes": "COMPEX" },
  { "training_day": "MARTEDI", "muscle_group": "Interno Cosce", "name": "Tonifica cosce", "target_reps": "1", "target_sets": 1, "notes": "COMPEX" },
  { "training_day": "MERCOLEDI", "muscle_group": "Addominali", "name": "Core stability", "target_reps": "1", "target_sets": 1, "notes": "COMPEX" },
  { "training_day": "GIOVEDI", "muscle_group": "Interno Cosce", "name": "Ipertrofia", "target_reps": "1", "target_sets": 1, "notes": "COMPEX" },
  { "training_day": "VENERDI", "muscle_group": "Addominali", "name": "Addominali scolpiti", "target_reps": "1", "target_sets": 1, "notes": "COMPEX" },
  { "training_day": "SABATO", "muscle_group": "Interno Cosce", "name": "Tonifica cosce", "target_reps": "1", "target_sets": 1, "notes": "COMPEX" },
  { "training_day": "DOMENICA", "muscle_group": "Addominali / Interno Cosce", "name": "Massaggio rilassante", "target_reps": "1", "target_sets": 1, "notes": "COMPEX" }
  ];

  try {
    // Aggiungi user_id manualmente se lo conosci, o usa RLS DISABLE temporaneo
    var options = {
      method: "post",
      contentType: "application/json",
      headers: { 
        "apikey": SUPABASE_KEY, 
        "Authorization": "Bearer " + SUPABASE_KEY,
        "Prefer": "resolution=merge-duplicates"
      },
      payload: JSON.stringify(exercises),
      muteHttpExceptions: true
    };
    
    var response = UrlFetchApp.fetch(SUPABASE_URL + "/rest/v1/exercises", options);
    var resCode = response.getResponseCode();
    
    if (resCode >= 200 && resCode < 300) {
      Browser.msgBox("SUCCESSO! " + exercises.length + " esercizi sincronizzati da Excel.");
    } else {
      Browser.msgBox("Errore Server (" + resCode + "): " + response.getContentText());
    }
  } catch(e) {
    Browser.msgBox("Errore Critico: " + e.toString());
  }
}
