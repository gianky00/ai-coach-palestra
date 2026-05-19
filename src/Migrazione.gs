/**
 * SCRIPT DI MIGRAZIONE AUTOMATICA
 * Caricato da Gemini CLI per sincronizzare Sheets -> Supabase
 */

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🚀 MIGRAZIONE V2')
      .addItem('Esporta Programma su Supabase', 'exportToSupabase')
      .addToUi();
}

function exportToSupabase() {
  var SUPABASE_URL = "https://ekckzmihqswqfglowpwk.supabase.co";
  var SUPABASE_KEY = "sb_publishable_wIFYjd5yII9ThcBrBTvQtg_2vRBoZZh";
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName("Palestra");
  if (!sh) {
    Browser.msgBox("Errore: Foglio 'Palestra' non trovato.");
    return;
  }
  
  var data = sh.getDataRange().getValues();
  var exercises = [];
  
  data.forEach(function(r, i) {
    var rowIdx = i + 1;
    if (rowIdx < 3 || rowIdx === 45 || rowIdx === 46) return;
    
    var nomeEx = (r[3]||"").toString().trim();
    if (nomeEx && nomeEx !== "") {
      exercises.push({
        name: nomeEx,
        muscle_group: (r[2]||"").toString().trim(),
        training_day: (r[0]||"").toString().toUpperCase().trim(),
        target_sets: parseInt(r[5]) || 0,
        target_reps: (r[4]||"").toString(),
        order_index: rowIdx,
        notes: rowIdx >= 47 ? "COMPEX" : "PALESTRA"
      });
    }
  });
  
  if (exercises.length === 0) {
    Browser.msgBox("Nessun esercizio trovato da esportare.");
    return;
  }

  try {
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
      Browser.msgBox("SUCCESSO! " + exercises.length + " esercizi caricati su Supabase.");
    } else {
      Browser.msgBox("Errore Server (" + resCode + "): " + response.getContentText());
    }
  } catch(e) {
    Browser.msgBox("Errore Critico: " + e.toString());
  }
}
