/**
 * SCRIPT DI MIGRAZIONE UNA-TANTUM
 * Da incollare ed eseguire nell'editor di Google Sheets
 */
function exportToSupabase() {
  var SUPABASE_URL = "https://ekckzmihqswqfglowpwk.supabase.co";
  var SUPABASE_KEY = "sb_publishable_wIFYjd5yII9ThcBrBTvQtg_2vRBoZZh";
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName("Palestra");
  var data = sh.getDataRange().getValues();
  
  var exercises = [];
  data.forEach(function(r, i) {
    var rowIdx = i + 1;
    if (rowIdx < 3 || rowIdx === 45 || rowIdx === 46) return;
    
    if (r[3]) { // Nome esercizio
      exercises.push({
        name: r[3],
        muscle_group: r[2],
        training_day: (r[0]||"").toString().toUpperCase().trim(),
        target_sets: parseInt(r[5]) || 0,
        target_reps: (r[4]||"").toString(),
        order_index: rowIdx,
        notes: rowIdx >= 47 ? "COMPEX" : "PALESTRA" // Distinzione automatica
      });
    }
  });
  
  // Invio dati a Supabase
  var options = {
    method: "post",
    contentType: "application/json",
    headers: { "apikey": SUPABASE_KEY, "Authorization": "Bearer " + SUPABASE_KEY },
    payload: JSON.stringify(exercises)
  };
  
  var response = UrlFetchApp.fetch(SUPABASE_URL + "/rest/v1/exercises", options);
  Logger.log("Migrazione completata: " + exercises.length + " esercizi caricati.");
}
