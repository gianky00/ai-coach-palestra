/**
 * AI COACH - CORE ENGINE (Consolidated v18.0.0)
 * Sistema unificato per massima stabilità.
 */

var AppConfig = {
  Sheets: { PALESTRA: 'Palestra', REGISTRO: 'Registro_Allenamenti', BIOMETRIA: 'Dati_Biometrici', SETTINGS: 'Settings' },
  Structure: { START_ROW: 3, NAME_COL: 4, DONE_COL: 13, VOLUME_COL: 14, E1RM_COL: 15, RPE_COL: 11, WEIGHT_START: 7, WEIGHT_END: 10 },
  Version: '18.0.0'
};

function doGet() { 
  return HtmlService.createHtmlOutputFromFile('ui_mobile')
    .setTitle('AI Coach')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'); 
}

function getInitialData() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var shPal = ss.getSheetByName(AppConfig.Sheets.PALESTRA);
    var data = shPal.getDataRange().getValues();
    
    var shReg = ss.getSheetByName(AppConfig.Sheets.REGISTRO);
    var reg = shReg ? shReg.getDataRange().getValues() : [];
    
    var shBio = ss.getSheetByName(AppConfig.Sheets.BIOMETRIA);
    var uPeso = (shBio && shBio.getLastRow() > 1) ? shBio.getRange(shBio.getLastRow(), 2).getValue() : 0;
    
    var days = ['DOMENICA','LUNEDI','MARTEDI','MARTEDÌ','MERCOLEDI','GIOVEDI','VENERDI','SABATO'];
    var oggi = days[new Date().getDay()];
    
    var palestra = [], compex = [], volume = 0;

    data.forEach(function(r, i) {
      var rIdx = i+1; 
      if (rIdx < 3 || rIdx === 45 || rIdx === 46) return;
      
      var giorno = (r[0]||"").toString().toUpperCase().trim();
      var isOggi = (giorno === oggi) || ((oggi.indexOf('MART')>-1) && (giorno.indexOf('MART')>-1));
      
      if (isOggi && r[3]) {
        var nome = r[3];
        var stor = reg.filter(function(l){return l[3]===nome;}).slice(-3).reverse().map(function(l){
          var d = "??"; try { d = Utilities.formatDate(new Date(l[0]), "GMT+1", "dd/MM"); } catch(e){}
          return { data: d, setReps: l[4]+"x"+l[5], peso: l[6]||0 };
        });
        
        var ex = { 
          id: rIdx, 
          nome: nome, 
          gruppo: r[2], 
          target: r[5]+"x"+r[4], 
          comp: r[12]===true, 
          last: r[9]||r[8]||r[7]||r[6]||0, 
          stor: stor 
        };
        
        if (ex.comp) volume += (parseFloat(r[13])||0);
        if (rIdx < 45) palestra.push(ex); else compex.push(ex);
      }
    });

    return { 
      giorno: oggi, 
      palestra: palestra, 
      compex: compex, 
      uPeso: uPeso, 
      prog: (palestra.length+compex.length)>0 ? (palestra.filter(function(e){return e.comp;}).length+compex.filter(function(e){return e.comp;}).length)/(palestra.length+compex.length)*100 : 0, 
      lVol: volume.toFixed(0)
    };
  } catch(e) { 
    return { error: e.toString() }; 
  }
}

function logSetAdvanced(p) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(AppConfig.Sheets.PALESTRA);
  var r = p.id;
  
  // Logica inserimento peso
  var col = 7;
  for(var c=7; c<=10; c++) {
    if(sh.getRange(r,c).getValue() === '') {
      col = c;
      break;
    }
    col = c; // sovrascrive ultimo se pieno
  }
  
  sh.getRange(r, col).setValue("'"+p.valore);
  sh.getRange(r, 11).setValue(p.rpe);
  sh.getRange(r, 13).setValue(true);
  
  return getInitialData();
}

function deleteSetAdvanced(id) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(AppConfig.Sheets.PALESTRA);
  for(var c=10; c>=7; c--) { 
    if(sh.getRange(id,c).getValue()!==''){ 
      sh.getRange(id,c).clearContent(); 
      break; 
    } 
  }
  sh.getRange(id, 13).setValue(false);
  return getInitialData();
}
